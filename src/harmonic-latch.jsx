import { useState, useEffect, useRef, useCallback } from "react";
import { API_URL } from "./config.js";

const FONT = document.createElement("link");
FONT.rel = "stylesheet";
FONT.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap";
document.head.appendChild(FONT);

// ── PALETTE ───────────────────────────────────────────────────────────────────
const V = {
  bg: "#0d1b2a", bgDeep: "#091525", bgPanel: "#0f2035",
  border: "rgba(240,237,232,0.12)", borderHi: "rgba(240,237,232,0.35)",
  text: "#F0EDE8", textDim: "rgba(240,237,232,0.5)", textFaint: "rgba(240,237,232,0.2)",
  gold: "#d4a843", red: "#ff2255", lime: "#c8f020", violet: "#b44fff",
};
const SANS    = "'IBM Plex Sans', sans-serif";
const MONO    = "'IBM Plex Mono', monospace";
const DISPLAY = "'Orbitron', monospace";
const PALETTE = ["#ff2255","#c8f020","#d4a843","#b44fff","#00cfff","#ff6600","#ff44aa","#44ffcc","#ffee22","#ff3300","#88ff00","#cc88ff","#ff8844","#00ffcc","#ff0066","#aaffee","#ff99cc","#ccff00"];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function hexToRgba(h, a) {
  const r = parseInt(h.slice(1,3),16), g = parseInt(h.slice(3,5),16), b = parseInt(h.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function normalize(arr) {
  const mn = Math.min(...arr), mx = Math.max(...arr);
  return arr.map(v => mx === mn ? 0.5 : (v - mn) / (mx - mn));
}
function pearson(a, b) {
  const n = Math.min(a.length, b.length);
  const ma = a.slice(0,n).reduce((s,v)=>s+v,0)/n, mb = b.slice(0,n).reduce((s,v)=>s+v,0)/n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { num += (a[i]-ma)*(b[i]-mb); da += (a[i]-ma)**2; db += (b[i]-mb)**2; }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

// ── LOCATIONS ─────────────────────────────────────────────────────────────────
const LOCATIONS = {
  global:{ label:"Global", flag:"🌐", color:"#b44fff" },
  us:    { label:"USA",    flag:"🇺🇸", color:"#00cfff" },
  eu:    { label:"Europe", flag:"🇪🇺", color:"#c8f020" },
  china: { label:"China",  flag:"🇨🇳", color:"#ff2255" },
  india: { label:"India",  flag:"🇮🇳", color:"#ff8844" },
  brazil:{ label:"Brazil", flag:"🇧🇷", color:"#d4a843" },
};
function makeLocData(base, scale=1, offset=0, noise=0.05) {
  return base.map((v,i) => +(v*scale + offset + (Math.sin(i*7.3+offset)*2-1)*noise*Math.abs(v||1)).toFixed(2));
}

// ── TIME ──────────────────────────────────────────────────────────────────────
const N = 72;
const ALL_TIME_LABELS = [2019,2020,2021,2022,2023,2024].flatMap(y =>
  ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => `${m} ${y}`)
);
const ERAS = [
  {start:0,  end:11, label:"Pre-COVID",  color:"rgba(180,79,255,0.18)"},
  {start:12, end:23, label:"Pandemic",   color:"rgba(255,34,85,0.18)"},
  {start:24, end:35, label:"Recovery",   color:"rgba(200,240,32,0.12)"},
  {start:36, end:47, label:"Inflation",  color:"rgba(255,100,0,0.18)"},
  {start:48, end:59, label:"Stabilize",  color:"rgba(0,207,255,0.12)"},
  {start:60, end:71, label:"New Normal", color:"rgba(212,168,67,0.15)"},
];

// ── DATA ──────────────────────────────────────────────────────────────────────
const BASE = {
  gdp:        [2.3,2.1,2.0,2.2,2.3,2.3,2.1,2.0,1.9,2.1,2.3,2.4,-1.2,-4.8,-9.1,-31.4,-2.9,33.8,4.5,2.1,6.3,6.9,6.7,5.0,5.7,3.5,3.2,2.7,2.3,1.9,2.6,2.9,3.2,2.8,2.6,2.9,2.1,1.7,1.3,1.6,2.1,2.3,2.9,2.7,2.6,3.2,3.4,3.2,2.8,2.5,2.9,3.1,2.8,2.5,2.3,2.8,3.0,2.9,3.2,2.8,2.5,2.3,2.8,3.1,2.9,2.6,2.8,3.0,2.9,2.7,2.5,2.8],
  inflation:  [1.6,1.5,1.9,2.0,1.8,1.6,1.8,1.7,1.7,1.8,2.1,2.3,2.5,1.5,0.3,0.1,1.0,1.2,1.2,1.3,1.4,1.2,1.2,1.4,1.7,1.7,2.6,4.2,5.0,5.4,5.3,5.2,5.4,6.2,6.8,7.0,7.5,7.9,8.5,8.3,8.6,9.1,8.5,8.3,8.2,7.7,7.1,6.5,6.0,5.0,5.0,4.9,4.0,3.0,3.2,3.7,3.7,3.2,3.1,2.9,2.7,2.5,2.9,3.5,3.1,2.8,2.6,2.9,2.7,2.5,2.6,2.8],
  unemployment:[4.0,3.8,3.8,3.6,3.6,3.7,3.7,3.7,3.5,3.6,3.5,3.5,3.5,3.5,4.4,14.7,13.3,11.1,10.2,8.4,7.9,6.9,6.7,6.7,6.4,6.0,6.0,5.8,5.8,5.9,5.4,5.2,4.8,4.6,4.2,3.9,4.0,3.8,3.6,3.5,3.6,3.6,3.5,3.7,3.5,3.7,3.6,3.5,3.4,3.4,3.5,3.4,3.7,3.6,3.8,3.8,3.8,3.9,3.7,3.7,3.9,4.0,4.1,4.3,4.2,4.1,4.2,4.3,4.2,4.1,4.2,4.1],
  sentiment:  [127,131,124,129,134,124,135,135,126,126,127,128,130,132,120,86,86,98,101,84,101,100,87,88,88,91,110,117,118,127,129,115,109,113,112,115,111,106,107,107,108,98,95,103,107,102,101,109,105,105,104,103,102,109,110,117,108,103,103,110,100,97,104,100,103,106,103,105,99,99,100,104],
  sp500:      [2704,2784,2834,2946,2945,2942,2980,2926,2977,3037,3141,3231,3258,3370,2711,2470,2973,3100,3271,3500,3363,3270,3756,3756,3714,3811,3973,4181,4211,4298,4395,4422,4308,4608,4567,4766,4515,4374,4545,4392,4132,3785,3955,4130,3586,3583,3828,3840,3970,4080,4109,4170,4109,4193,4450,4588,4288,4194,4273,4769,4845,4958,5137,5277,5308,5460,5522,5648,5762,5705,5854,5882],
  energy:     [58,58,60,64,62,54,57,56,54,58,60,67,57,53,34,19,36,40,43,45,43,40,46,48,52,60,65,61,66,73,72,70,75,80,70,78,80,92,110,107,105,119,105,92,78,83,77,77,75,72,73,71,75,67,72,82,84,84,88,82,72,73,80,84,75,78,68,74,72,70,72,74],
  globaltemp: [0.94,0.92,1.02,0.96,0.88,0.92,0.98,1.01,0.97,1.02,1.05,1.12,1.14,1.17,1.20,1.08,1.12,1.15,1.18,1.20,1.22,1.25,1.28,1.30,1.28,1.32,1.35,1.30,1.38,1.40,1.42,1.38,1.45,1.42,1.48,1.52,1.50,1.55,1.58,1.52,1.60,1.62,1.55,1.65,1.62,1.68,1.72,1.70,1.75,1.72,1.78,1.80,1.75,1.82,1.85,1.88,1.85,1.90,1.88,1.92,1.95,1.98,2.02,1.98,2.05,2.02,2.08,2.05,2.10,2.08,2.12,2.15],
  internet:   [100,101,102,103,104,103,104,104,103,104,105,106,108,112,148,162,155,148,145,143,142,140,141,142,143,145,148,151,153,155,157,158,160,162,163,165,166,168,170,171,172,174,175,177,178,180,182,183,185,187,189,191,193,195,197,199,201,203,205,207,209,211,214,217,220,223,226,229,232,235,238,241],
  socialmood: [58,57,59,60,61,60,62,61,59,60,61,62,63,62,48,38,42,50,52,55,54,53,56,57,58,60,62,65,64,66,65,63,61,63,62,64,60,58,55,54,52,47,49,53,50,49,51,55,54,55,56,57,56,58,60,63,59,57,57,62,58,56,60,58,61,63,61,63,60,59,61,63],
  polarize:   [72,73,73,74,74,75,75,76,76,77,77,78,79,80,82,88,86,85,84,83,82,81,82,83,83,84,84,85,85,85,86,86,86,87,87,88,88,89,90,91,91,92,91,90,90,89,89,89,88,88,87,87,87,86,86,85,86,87,87,88,88,89,90,91,91,90,91,92,91,90,91,92],
  wellbeing:  [67,67,68,68,69,68,68,68,67,67,68,68,68,67,62,55,56,59,61,63,63,64,64,65,65,66,67,68,68,69,69,68,68,69,70,70,70,70,69,69,68,67,66,66,65,65,65,66,66,67,67,67,67,68,68,68,68,68,69,69,69,69,70,70,70,71,71,71,72,72,72,72],
  violent:    [100,99,101,100,102,103,101,104,102,100,98,97,96,94,88,72,74,80,105,112,115,118,116,112,110,108,106,104,102,100,98,97,102,106,110,108,106,104,102,100,98,96,94,92,93,95,97,99,98,97,96,95,94,93,92,91,93,95,97,96,95,94,93,92,91,90,92,94,96,95,94,93],
  property:   [100,98,97,99,98,100,101,99,98,97,96,95,94,92,80,65,68,75,92,98,102,105,108,106,104,102,100,98,96,94,97,100,103,106,109,107,105,103,101,99,97,95,93,91,92,94,96,98,97,96,95,94,93,92,91,90,91,93,95,94,93,92,91,90,89,88,90,92,94,93,92,91],
  drugcrime:  [100,101,103,102,104,105,103,106,104,102,100,99,98,96,90,78,82,88,108,118,122,125,123,119,116,114,112,110,108,106,104,102,106,110,114,112,110,108,106,104,102,100,98,96,97,99,101,103,102,101,100,99,98,97,96,95,97,99,101,100,99,98,97,96,95,94,96,98,100,99,98,97],
  cybercrime: [100,104,108,112,116,120,118,122,126,124,122,126,130,138,165,182,175,168,162,158,154,150,152,156,160,165,170,175,180,185,190,188,192,196,200,198,202,206,210,215,220,225,222,218,220,225,230,235,238,242,246,250,255,260,265,268,272,276,280,284,288,292,296,300,305,310,315,318,322,326,330,335],
  homicide:   [100,99,100,99,101,102,100,103,101,99,97,96,95,93,87,70,72,78,103,114,118,120,118,114,112,110,108,106,104,102,100,99,103,107,111,109,107,105,103,101,99,97,95,93,94,96,98,100,99,98,97,96,95,94,93,92,94,96,98,97,96,95,94,93,92,91,93,95,97,96,95,94],
};
const LOC_SCALES = {
  global:{scale:1.00,offset:0,   noise:0.03},
  us:    {scale:1.05,offset:0.2, noise:0.04},
  eu:    {scale:0.85,offset:-0.3,noise:0.04},
  china: {scale:1.15,offset:0.5, noise:0.06},
  india: {scale:1.20,offset:-0.8,noise:0.07},
  brazil:{scale:0.92,offset:1.2, noise:0.08},
};
const SIGNAL_DEFS = [
  {id:"gdp",         label:"GDP Growth",     unit:"%",   cat:"Economy",     baseKey:"gdp"},
  {id:"inflation",   label:"Inflation",      unit:"%",   cat:"Economy",     baseKey:"inflation"},
  {id:"unemployment",label:"Unemployment",   unit:"%",   cat:"Economy",     baseKey:"unemployment"},
  {id:"sentiment",   label:"Sentiment",      unit:"idx", cat:"Society",     baseKey:"sentiment"},
  {id:"sp500",       label:"S&P 500",        unit:"",    cat:"Markets",     baseKey:"sp500"},
  {id:"energy",      label:"Oil Price",      unit:"$/b", cat:"Environment", baseKey:"energy"},
  {id:"globaltemp",  label:"Temp Anomaly",   unit:"°C",  cat:"Environment", baseKey:"globaltemp"},
  {id:"internet",    label:"Internet",       unit:"idx", cat:"Digital",     baseKey:"internet"},
  {id:"socialmood",  label:"Social Mood",    unit:"idx", cat:"Digital",     baseKey:"socialmood"},
  {id:"polarize",    label:"Polarization",   unit:"idx", cat:"Society",     baseKey:"polarize"},
  {id:"wellbeing",   label:"Wellbeing",      unit:"idx", cat:"Society",     baseKey:"wellbeing"},
  {id:"violent",     label:"Violent Crime",  unit:"idx", cat:"Crime",       baseKey:"violent"},
  {id:"property",    label:"Property Crime", unit:"idx", cat:"Crime",       baseKey:"property"},
  {id:"drugcrime",   label:"Drug Crime",     unit:"idx", cat:"Crime",       baseKey:"drugcrime"},
  {id:"cybercrime",  label:"Cyber Crime",    unit:"idx", cat:"Crime",       baseKey:"cybercrime"},
  {id:"homicide",    label:"Homicide Rate",  unit:"idx", cat:"Crime",       baseKey:"homicide"},
];
function getSignalData(sigId, locId) {
  const def = SIGNAL_DEFS.find(d => d.id === sigId);
  if (!def) return [];
  return makeLocData(BASE[def.baseKey] || [], (LOC_SCALES[locId] || LOC_SCALES.global).scale, (LOC_SCALES[locId] || LOC_SCALES.global).offset, (LOC_SCALES[locId] || LOC_SCALES.global).noise);
}

// ── LINE CHART ────────────────────────────────────────────────────────────────
const CHART_PAD = { L:36, R:14, T:28, B:34 };

function LineChart({activeIds, locations, customSignals, hoveredId, onHover, onPointSelect, pointIdx, width, height, timeRange, perspective}) {
  const canvasRef = useRef(null);
  const dpr = window.devicePixelRatio || 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = width * dpr; canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const { L, R, T, B } = CHART_PAD;
    const plotW = width - L - R, plotH = height - T - B;
    const [t0, t1] = timeRange, sliceN = t1 - t0;
    if (sliceN < 2) return;

    const activeLocs   = locations.filter(l => l.active);
    const primaryLocId = (activeLocs[0] || {id:"global"}).id;

    const lines = perspective === "overlay"
      ? activeLocs.map(loc => {
          const sigId = activeIds[0]; if (!sigId) return null;
          return { id:loc.id, color:LOCATIONS[loc.id].color, data:getSignalData(sigId, loc.id).slice(t0, t1) };
        }).filter(Boolean)
      : activeIds.map((sigId, i) => {
          const custom = customSignals?.find(c => c.id === sigId);
          return { id:sigId, color:PALETTE[i % PALETTE.length], data: custom ? custom.data.slice(0, sliceN) : getSignalData(sigId, primaryLocId).slice(t0, t1) };
        });

    ctx.fillStyle = V.bgDeep; ctx.fillRect(0, 0, width, height);

    ERAS.forEach(era => {
      const eS = Math.max(era.start, t0), eE = Math.min(era.end + 1, t1);
      if (eS >= eE) return;
      const x0 = L + (eS - t0) / sliceN * plotW, x1 = L + (eE - t0) / sliceN * plotW;
      ctx.fillStyle = era.color; ctx.fillRect(x0, T, x1 - x0, plotH);
      const bw = x1 - x0;
      if (bw > 28) {
        ctx.fillStyle = "rgba(240,237,232,0.32)";
        ctx.font = `${Math.min(9, bw/8)}px 'IBM Plex Sans',sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText(era.label, (x0+x1)/2, T+5);
      }
    });

    for (let i = 0; i <= 4; i++) {
      const y = T + (i/4)*plotH;
      ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(L+plotW, y);
      ctx.strokeStyle = i===4 ? "rgba(240,237,232,0.2)" : "rgba(240,237,232,0.06)";
      ctx.lineWidth   = i===4 ? 1 : 0.5; ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, T+plotH);
    ctx.strokeStyle = "rgba(240,237,232,0.2)"; ctx.lineWidth = 1; ctx.stroke();

    ctx.fillStyle = V.textFaint; ctx.font = `8px 'IBM Plex Mono',monospace`;
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    ctx.fillText("HI", L-5, T); ctx.fillText("LO", L-5, T+plotH);

    const numL = Math.min(6, sliceN);
    ctx.fillStyle = V.gold; ctx.font = `bold 8px 'IBM Plex Mono',monospace`;
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let i = 0; i <= numL; i++) {
      const idx = Math.round(i/numL*(sliceN-1)), absIdx = t0+idx;
      if (absIdx >= N) continue;
      ctx.fillText(ALL_TIME_LABELS[absIdx].slice(-4), L + idx/(sliceN-1)*plotW, T+plotH+6);
    }

    lines.forEach(({ id, color, data }) => {
      if (!data || data.length < 2) return;
      const isHov = hoveredId === id, dimmed = hoveredId && !isHov;
      const norm  = normalize(data);
      const xOf   = i => L + (i/(data.length-1))*plotW;
      const yOf   = v => T + (1-v)*plotH;

      ctx.beginPath();
      norm.forEach((v,i) => i===0 ? ctx.moveTo(xOf(i),yOf(v)) : ctx.lineTo(xOf(i),yOf(v)));
      ctx.lineTo(xOf(data.length-1), T+plotH); ctx.lineTo(L, T+plotH); ctx.closePath();
      ctx.fillStyle = hexToRgba(color, dimmed ? 0.01 : isHov ? 0.14 : 0.05); ctx.fill();

      ctx.beginPath();
      norm.forEach((v,i) => i===0 ? ctx.moveTo(xOf(i),yOf(v)) : ctx.lineTo(xOf(i),yOf(v)));
      ctx.strokeStyle = hexToRgba(color, dimmed ? 0.15 : isHov ? 1 : 0.8);
      ctx.lineWidth   = isHov ? 2.5 : 1.5; ctx.stroke();

      if (pointIdx !== null) {
        const pi = Math.min(pointIdx, data.length-1);
        ctx.beginPath(); ctx.arc(xOf(pi), yOf(norm[pi]), isHov ? 5 : 3, 0, Math.PI*2);
        ctx.fillStyle = color; ctx.globalAlpha = dimmed ? 0.2 : 1; ctx.fill(); ctx.globalAlpha = 1;
      }
    });

    if (pointIdx !== null) {
      const x = L + (Math.min(pointIdx, sliceN-1)/(sliceN-1))*plotW;
      ctx.beginPath(); ctx.moveTo(x, T); ctx.lineTo(x, T+plotH);
      ctx.strokeStyle = "rgba(240,237,232,0.28)"; ctx.lineWidth = 1;
      ctx.setLineDash([2,3]); ctx.stroke(); ctx.setLineDash([]);
    }
  }, [activeIds, locations, customSignals, hoveredId, pointIdx, width, height, timeRange, perspective, dpr]);

  const getFromEvent = useCallback((e) => {
    const canvas = canvasRef.current; if (!canvas) return {idx:null,id:null};
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const mx = (clientX - rect.left) * (width/rect.width);
    const my = (clientY - rect.top)  * (height/rect.height);
    const { L, R, T, B } = CHART_PAD;
    const plotW = width-L-R, plotH = height-T-B;
    const [t0,t1] = timeRange, sliceN = t1-t0;
    if (sliceN < 2 || mx < L || mx > L+plotW || my < T || my > T+plotH) return {idx:null,id:null};
    const idx = Math.round((mx-L)/plotW*(sliceN-1));
    const activeLocs   = locations.filter(l => l.active);
    const primaryLocId = (activeLocs[0] || {id:"global"}).id;
    const items = perspective === "overlay"
      ? activeLocs.map(loc => ({id:loc.id, data:getSignalData(activeIds[0], loc.id).slice(t0,t1)}))
      : activeIds.map(sigId => {
          const custom = customSignals?.find(c => c.id === sigId);
          return {id:sigId, data: custom ? custom.data.slice(0,sliceN) : getSignalData(sigId, primaryLocId).slice(t0,t1)};
        });
    let closest = null, closestDist = 999;
    items.forEach(({id, data}) => {
      if (!data?.length) return;
      const v = normalize(data)[Math.min(idx, data.length-1)];
      const y = T + (1-v)*plotH;
      if (Math.abs(my-y) < closestDist) { closestDist = Math.abs(my-y); closest = id; }
    });
    return {idx, id: closestDist < 28 ? closest : null};
  }, [activeIds, locations, customSignals, timeRange, perspective, width, height]);

  const handleMove  = useCallback(e => { const {idx,id} = getFromEvent(e); onPointSelect(idx); onHover(id); }, [getFromEvent, onPointSelect, onHover]);
  const handleLeave = useCallback(() => { onHover(null); onPointSelect(null); }, [onHover, onPointSelect]);

  return (
    <canvas ref={canvasRef}
      style={{width, height, display:"block", cursor:"crosshair", touchAction:"none", maxWidth:"100%"}}
      onMouseMove={handleMove} onMouseLeave={handleLeave}
      onTouchMove={e => {e.preventDefault(); handleMove(e);}} onTouchEnd={handleLeave}
    />
  );
}

// ── ADD MODAL ─────────────────────────────────────────────────────────────────
function AddModal({onAdd, onClose, usedColors}) {
  const [label,setLabel] = useState(""); const [unit,setUnit]   = useState("");
  const [cat,setCat]     = useState("Custom"); const [raw,setRaw] = useState("");
  const [color,setColor] = useState(PALETTE.find(c => !usedColors.includes(c)) || PALETTE[0]);
  const [err,setErr]     = useState("");
  const nums = raw.split(/[\s,;\n\t]+/).map(Number).filter(v => !isNaN(v) && String(v).trim() !== "");
  const submit = () => {
    if (!label.trim()) { setErr("Name required"); return; }
    if (nums.length < 3) { setErr("Need 3+ data points"); return; }
    onAdd({id:`custom_${Date.now()}`, label:label.trim(), unit:unit.trim(), cat:cat||"Custom", baseKey:null, color, data:nums, custom:true});
    onClose();
  };
  const inp = {width:"100%", background:"rgba(255,255,255,0.05)", border:`1px solid ${V.border}`, color:V.text, padding:"10px 12px", fontFamily:MONO, fontSize:13, boxSizing:"border-box", outline:"none"};
  const lbl = {fontSize:10, letterSpacing:"0.15em", color:V.textDim, fontFamily:SANS, marginBottom:5, textTransform:"uppercase", fontWeight:600};
  return (
    <div style={{position:"fixed",inset:0,zIndex:600,background:"rgba(9,21,37,0.95)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{width:"100%",maxWidth:420,background:"#0f2035",border:`1px solid ${V.borderHi}`,padding:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontFamily:SANS,fontSize:13,letterSpacing:"0.15em",color:V.gold,fontWeight:700,textTransform:"uppercase"}}>Add Signal</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:V.textDim,cursor:"pointer",fontSize:22,lineHeight:1}}>×</button>
        </div>
        {[["Signal Name *",label,setLabel,"e.g. My Sales"],["Unit",unit,setUnit,"%, $, pts"],["Category",cat,setCat,"Custom / Economy / ..."]].map(([l,v,s,p]) => (
          <div key={l} style={{marginBottom:12}}>
            <div style={lbl}>{l}</div>
            <input value={v} onChange={e=>s(e.target.value)} placeholder={p} style={inp}/>
          </div>
        ))}
        <div style={{marginBottom:12}}>
          <div style={lbl}>Data Points * — paste any numbers</div>
          <textarea value={raw} onChange={e=>setRaw(e.target.value)} rows={4}
            placeholder={"12.5, 13.1, 11.8...\nor paste from spreadsheet"} style={{...inp,resize:"vertical"}}/>
          <div style={{fontSize:11,color:nums.length>=3?V.lime:V.red,fontFamily:MONO,marginTop:4}}>{nums.length} points detected</div>
        </div>
        <div style={{marginBottom:16}}>
          <div style={lbl}>Color</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {PALETTE.map(c => <div key={c} onClick={()=>setColor(c)} style={{width:22,height:22,background:c,cursor:"pointer",border:`2px solid ${color===c?"white":"transparent"}`,outline:color===c?`2px solid ${c}`:"none",outlineOffset:2}}/>)}
          </div>
        </div>
        {err && <div style={{fontSize:11,color:V.red,fontFamily:MONO,marginBottom:10}}>{err}</div>}
        <button onClick={submit} style={{width:"100%",padding:"13px 0",background:V.gold,border:"none",color:"#000",fontFamily:SANS,fontSize:12,letterSpacing:"0.15em",fontWeight:700,cursor:"pointer",textTransform:"uppercase"}}>
          Add to Array
        </button>
      </div>
    </div>
  );
}

// ── READ PANEL ────────────────────────────────────────────────────────────────
function ReadPanel({activeIds, locations, timeRange, customSignals}) {
  const [reading,setReading] = useState(""); const [echo,setEcho]   = useState("");
  const [loading,setLoading] = useState(false); const [status,setStatus] = useState("idle");

  const analyze = async () => {
    if (activeIds.length < 2) { setStatus("need2"); return; }
    setLoading(true); setStatus("loading"); setReading(""); setEcho("");
    const [t0,t1]   = timeRange;
    const activeLocs = locations.filter(l => l.active).map(l => l.id);
    const locId      = activeLocs[0] || "global";
    const summary    = activeIds.slice(0,8).map(id => {
      const def    = SIGNAL_DEFS.find(d => d.id === id);
      const custom = customSignals.find(c => c.id === id);
      const d      = custom ? custom.data.slice(0,t1-t0) : getSignalData(id, locId).slice(t0,t1);
      if (!d.length) return "";
      const trend = d[d.length-1] - d[0];
      return `${def?.label||custom?.label||id} (${def?.cat||"Custom"}, ${LOCATIONS[locId]?.label||locId}): range ${Math.min(...d).toFixed(1)}–${Math.max(...d).toFixed(1)}, trend ${trend>0?"+":""}${trend.toFixed(1)}`;
    }).filter(Boolean).join("\n");
    const pairs = [];
    for (let i = 0; i < activeIds.length; i++) for (let j = i+1; j < activeIds.length; j++) {
      const da = getSignalData(activeIds[i], locId).slice(t0,t1), db = getSignalData(activeIds[j], locId).slice(t0,t1);
      pairs.push({a:activeIds[i], b:activeIds[j], r:pearson(da,db)});
    }
    pairs.sort((a,b) => Math.abs(b.r)-Math.abs(a.r));
    const pairStr = pairs.slice(0,3).map(p => `${SIGNAL_DEFS.find(d=>d.id===p.a)?.label||p.a} vs ${SIGNAL_DEFS.find(d=>d.id===p.b)?.label||p.b}: r=${p.r.toFixed(2)}`).join("; ");
    const prompt = `Analyzing world signals for ${activeLocs.map(l=>LOCATIONS[l]?.label).join(", ")}, ${ALL_TIME_LABELS[t0]} to ${ALL_TIME_LABELS[Math.min(t1-1,N-1)]}.\n\nSignals:\n${summary}\n\nTop relationships: ${pairStr}\n\nRespond ONLY in this exact format:\n\nREADING: [3 sentences. Specific, poetic. What story do these signals tell together?]\n\nECHO: [One specific historical period with similar pattern. One sentence on the parallel. One sentence on key difference.]`;
    try {
      const res     = await fetch(API_URL, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({model:"claude-haiku-4-5-20251001", max_tokens:1000, messages:[{role:"user",content:prompt}]})});
      const rawText = await res.text();
      if (!res.ok) throw new Error("HTTP "+res.status+": "+rawText.slice(0,300));
      let json; try { json = JSON.parse(rawText); } catch { throw new Error("Not JSON: "+rawText.slice(0,300)); }
      if (json.type==="error"||json.error) throw new Error(json.error?.message||JSON.stringify(json).slice(0,200));
      const txt = (Array.isArray(json.content)?json.content:[]).filter(b=>b.type==="text").map(b=>b.text).join("").trim();
      if (!txt) throw new Error("No text. Keys: "+Object.keys(json).join(","));
      const rM = txt.match(/READING:\s*([\s\S]*?)(?=ECHO:|$)/), eM = txt.match(/ECHO:\s*([\s\S]*?)$/);
      setReading(rM?rM[1].trim():txt); setEcho(eM?eM[1].trim():""); setStatus("done");
    } catch(err) { setReading("Error: "+err.message); setStatus("error"); }
    setLoading(false);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <button onClick={analyze} disabled={loading} style={{width:"100%",padding:"15px 0",background:loading?"transparent":V.gold,border:`2px solid ${V.gold}`,color:loading?V.gold:"#000",fontFamily:SANS,fontWeight:700,fontSize:12,letterSpacing:"0.15em",cursor:loading?"wait":"pointer",textTransform:"uppercase",transition:"background 150ms, color 150ms"}}>
        {loading ? "Scanning..." : "Read the Signals"}
      </button>
      {status==="need2" && <p style={{margin:0,fontSize:12,color:V.red,fontFamily:MONO}}>Activate at least 2 signals first.</p>}
      {status==="idle"  && <p style={{margin:0,fontSize:12,color:V.textFaint,fontFamily:MONO,lineHeight:1.7}}>Select 2+ signals and press Read for AI interpretation and historical echo.</p>}
      {reading && status!=="error" && (
        <div style={{padding:16,border:`1px solid ${V.border}`,background:"rgba(255,255,255,0.03)"}}>
          <div style={{fontSize:9,letterSpacing:"0.2em",color:V.textDim,marginBottom:10,fontFamily:SANS,fontWeight:600,textTransform:"uppercase"}}>Signal Reading</div>
          <p style={{margin:0,fontSize:13,lineHeight:1.8,color:V.text,fontFamily:MONO}}>{reading}</p>
        </div>
      )}
      {echo && (
        <div style={{padding:16,borderLeft:`3px solid ${V.gold}`,background:"rgba(212,168,67,0.05)"}}>
          <div style={{fontSize:9,letterSpacing:"0.2em",color:V.gold,marginBottom:10,fontFamily:SANS,fontWeight:600,textTransform:"uppercase"}}>Historical Echo</div>
          <p style={{margin:0,fontSize:13,lineHeight:1.8,color:"rgba(240,230,200,0.9)",fontFamily:MONO}}>{echo}</p>
        </div>
      )}
      {status==="error" && <div style={{padding:12,borderLeft:`3px solid ${V.red}`}}><p style={{margin:0,fontSize:12,color:"#ff6688",fontFamily:MONO}}>{reading}</p></div>}
    </div>
  );
}

// ── SECTION LABEL ─────────────────────────────────────────────────────────────
function SectionLabel({children}) {
  return <div style={{fontSize:10,letterSpacing:"0.18em",color:V.textDim,fontFamily:SANS,fontWeight:600,textTransform:"uppercase",marginBottom:12}}>{children}</div>;
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [activeIds,     setActiveIds]     = useState(["gdp","inflation","sp500","sentiment","violent","cybercrime"]);
  const [locations,     setLocations]     = useState(Object.keys(LOCATIONS).map((id,i) => ({id, active:i===0})));
  const [timeRange,     setTimeRange]     = useState([0, N]);
  const [searchQ,       setSearchQ]       = useState("");
  const [catFilter,     setCatFilter]     = useState("All");
  const [sortMode,      setSortMode]      = useState("category");
  const [perspective,   setPerspective]   = useState("signals");
  const [customSignals, setCustomSignals] = useState([]);
  const [hoveredId,     setHoveredId]     = useState(null);
  const [pointIdx,      setPointIdx]      = useState(null);
  const [showAdd,       setShowAdd]       = useState(false);
  const [canvasW,       setCanvasW]       = useState(340);
  const [canvasH,       setCanvasH]       = useState(240);
  const [windowWidth,   setWindowWidth]   = useState(window.innerWidth);
  const [headerH,       setHeaderH]       = useState(82);
  const headerRef = useRef(null);
  const isDesktop = windowWidth >= 768;

  // Resize + header measurement
  useEffect(() => {
    const measure = () => {
      const w = window.innerWidth;
      setWindowWidth(w);
      setCanvasW(w >= 768 ? Math.min(Math.max(300, w - 380 - 64), 1100) : w - 32);
      setCanvasH(w >= 768 ? 400 : 260);
      if (headerRef.current) setHeaderH(headerRef.current.offsetHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Re-measure header after fonts load
  useEffect(() => {
    const t = setTimeout(() => { if (headerRef.current) setHeaderH(headerRef.current.offsetHeight); }, 500);
    return () => clearTimeout(t);
  }, []);

  const toggleSignal   = useCallback(id => setActiveIds(p => p.includes(id) ? p.filter(s=>s!==id) : [...p,id]), []);
  const toggleLocation = useCallback(id => setLocations(p => p.map(l => l.id===id ? {...l,active:!l.active} : l)), []);
  const addCustom      = useCallback(sig => { setCustomSignals(p=>[...p,sig]); setActiveIds(p=>[...p,sig.id]); }, []);
  const removeCustom   = useCallback(id  => { setCustomSignals(p=>p.filter(s=>s.id!==id)); setActiveIds(p=>p.filter(s=>s!==id)); }, []);

  const locId    = (locations.find(l=>l.active)||{id:"global"}).id;
  const [t0,t1]  = timeRange;
  const allDefs  = [...SIGNAL_DEFS, ...customSignals.map(c=>({...c,baseKey:null}))];
  const cats     = ["All", ...new Set(allDefs.map(s=>s.cat))];
  const filtered = allDefs.filter(d => {
    const matchQ   = !searchQ || d.label.toLowerCase().includes(searchQ.toLowerCase()) || d.cat.toLowerCase().includes(searchQ.toLowerCase());
    const matchCat = catFilter==="All" || d.cat===catFilter;
    return matchQ && matchCat;
  });
  const sorted = [...filtered].sort((a,b) => {
    if (sortMode==="category") return a.cat.localeCompare(b.cat) || a.label.localeCompare(b.label);
    if (sortMode==="harmony") {
      const scoreOf = def => activeIds.filter(id=>id!==def.id).reduce((s,id) => {
        const da = def.custom ? def.data.slice(0,t1-t0) : getSignalData(def.id,locId).slice(t0,t1);
        return s + Math.abs(pearson(da, getSignalData(id,locId).slice(t0,t1)));
      }, 0);
      return scoreOf(b) - scoreOf(a);
    }
    return a.label.localeCompare(b.label);
  });

  const harmony = (() => {
    let total=0, count=0;
    activeIds.forEach((a,ai) => activeIds.slice(ai+1).forEach(b => {
      total += Math.abs(pearson(getSignalData(a,locId).slice(t0,t1), getSignalData(b,locId).slice(t0,t1)));
      count++;
    }));
    return count ? total/count : 0;
  })();
  const hC     = harmony > 0.6 ? V.lime  : harmony > 0.35 ? V.gold : V.red;
  const hLabel = harmony > 0.6 ? "In Harmony" : harmony > 0.35 ? "Mild Sync" : "Dissonant";
  const activeLocs = locations.filter(l=>l.active);

  // Correlation pairs (sorted by |r|)
  const corrPairs = (() => {
    const pairs = [];
    for (let i=0; i<activeIds.length; i++) for (let j=i+1; j<activeIds.length; j++) {
      pairs.push({a:activeIds[i], b:activeIds[j], r:pearson(getSignalData(activeIds[i],locId).slice(t0,t1), getSignalData(activeIds[j],locId).slice(t0,t1))});
    }
    return pairs.sort((a,b) => Math.abs(b.r)-Math.abs(a.r));
  })();

  const hPad = isDesktop ? "16px 32px 0" : "12px 16px 0";
  const lPad = isDesktop ? "20px 28px" : "16px";
  const rPad = isDesktop ? "20px 20px" : "16px";
  const divider = <div style={{borderTop:`1px solid ${V.border}`,margin:"20px 0"}}/>;

  return (
    <div style={{minHeight:"100dvh",background:V.bg,color:V.text,fontFamily:SANS,maxWidth:isDesktop?"none":540,margin:"0 auto"}}>

      {/* ── STICKY HEADER ── */}
      <header ref={headerRef} style={{padding:hPad,borderBottom:`2px solid ${V.gold}`,background:"#0f2035",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:DISPLAY,fontSize:isDesktop?26:20,fontWeight:900,letterSpacing:"0.05em",color:V.text,lineHeight:1.1}}>
              SIGNAL HARMONICS
            </div>
            <p style={{margin:"5px 0 10px",fontSize:12,color:V.textDim,fontFamily:SANS,lineHeight:1.55,maxWidth:560}}>
              A cross-domain correlation instrument. Select signals across economy, markets, society, environment, and crime — then read the patterns they form together.
            </p>
          </div>
          <div style={{textAlign:"right",flexShrink:0,paddingTop:2}}>
            <div style={{fontSize:9,color:V.textDim,fontFamily:SANS,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.15em"}}>Harmony</div>
            <div style={{fontSize:isDesktop?30:24,fontFamily:DISPLAY,fontWeight:900,color:hC,lineHeight:1}}>{Math.round(harmony*100)}%</div>
            <div style={{fontSize:10,color:hC,fontFamily:SANS,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.1em"}}>{hLabel}</div>
          </div>
        </div>
      </header>

      {/* ── PAGE BODY: left content + right signal panel ── */}
      <div style={{
        display: isDesktop ? "grid" : "block",
        gridTemplateColumns: isDesktop ? "1fr 380px" : undefined,
        alignItems: "start",
      }}>

        {/* ── LEFT: chart + controls + analysis ── */}
        <div style={{padding:lPad, borderRight:isDesktop?`1px solid ${V.border}`:"none"}}>

          {/* Location + perspective row */}
          <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:6,marginBottom:12}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,flex:1}}>
              {Object.entries(LOCATIONS).map(([id,loc]) => {
                const active = locations.find(l=>l.id===id)?.active;
                return (
                  <button key={id} onClick={()=>toggleLocation(id)} style={{padding:"5px 10px",fontSize:11,background:active?hexToRgba(loc.color,0.15):"rgba(255,255,255,0.04)",border:`1px solid ${active?loc.color:V.border}`,color:active?loc.color:V.textDim,cursor:"pointer",fontFamily:SANS,fontWeight:active?600:400,transition:"background 150ms"}}>
                    {loc.flag} {loc.label}
                  </button>
                );
              })}
            </div>
            <div style={{display:"flex",gap:4,flexShrink:0}}>
              {[["signals","Signals"],["overlay","Regions"]].map(([id,lbl]) => (
                <button key={id} onClick={()=>setPerspective(id)} style={{padding:"5px 10px",fontSize:11,background:perspective===id?V.violet:"transparent",border:`1px solid ${perspective===id?V.violet:V.border}`,color:perspective===id?"#fff":V.textDim,cursor:"pointer",fontFamily:SANS,fontWeight:perspective===id?600:400}}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <LineChart
            activeIds={activeIds} locations={locations} customSignals={customSignals}
            hoveredId={hoveredId} onHover={setHoveredId}
            onPointSelect={setPointIdx} pointIdx={pointIdx}
            width={canvasW} height={canvasH}
            timeRange={timeRange} perspective={perspective}
          />

          {/* Time controls */}
          <div style={{marginTop:12}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:V.textDim,fontFamily:SANS,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>
              <span>Time Window</span>
              <span style={{color:V.gold,fontFamily:MONO}}>{ALL_TIME_LABELS[t0]} → {ALL_TIME_LABELS[Math.min(t1-1,N-1)]}</span>
            </div>
            <div style={{display:"flex",gap:4,marginBottom:8}}>
              <input type="range" min={0} max={N-12} value={t0} onChange={e=>setTimeRange([+e.target.value, Math.min(+e.target.value+12,N)])} style={{flex:1,accentColor:V.violet,height:3}}/>
              <input type="range" min={12} max={N} value={t1} onChange={e=>setTimeRange([Math.max(0,+e.target.value-12),+e.target.value])} style={{flex:1,accentColor:V.gold,height:3}}/>
            </div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              <button onClick={()=>setTimeRange([0,N])} style={{padding:"4px 10px",fontSize:10,background:"rgba(255,255,255,0.05)",border:`1px solid ${V.border}`,color:V.textDim,cursor:"pointer",fontFamily:SANS}}>All</button>
              {ERAS.map(e => (
                <button key={e.label} onClick={()=>setTimeRange([e.start,e.end+1])} style={{padding:"4px 10px",fontSize:10,background:e.color,border:`1px solid rgba(255,255,255,0.12)`,color:"rgba(255,255,255,0.85)",cursor:"pointer",fontFamily:SANS}}>{e.label}</button>
              ))}
            </div>
          </div>

          {/* Hover data table */}
          {pointIdx !== null && (
            <div style={{marginTop:12,padding:"12px 14px",border:`1px solid ${V.border}`,background:"#0f2035"}}>
              <div style={{fontSize:10,color:V.gold,fontFamily:SANS,fontWeight:600,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.1em"}}>
                {ALL_TIME_LABELS[t0+pointIdx]||`Point ${pointIdx+1}`} · {activeLocs.map(l=>LOCATIONS[l.id]?.label).join(" / ")}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {activeIds.slice(0,6).map((id,si) => {
                  const def    = SIGNAL_DEFS.find(d=>d.id===id);
                  const custom = customSignals.find(c=>c.id===id);
                  const d      = custom ? custom.data : getSignalData(id,locId);
                  return (
                    <div key={id} style={{textAlign:"center"}}>
                      <div style={{fontSize:10,color:PALETTE[si%PALETTE.length],fontFamily:SANS,fontWeight:600,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{def?.label||custom?.label||id}</div>
                      <div style={{fontSize:14,color:V.text,fontFamily:MONO}}>{d[t0+Math.min(pointIdx,d.length-1)]?.toFixed(1)}<span style={{fontSize:10,color:V.textFaint}}>{def?.unit||custom?.unit||""}</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legend */}
          <div style={{display:"flex",flexWrap:"wrap",gap:10,padding:"12px 0 4px"}}>
            {perspective==="overlay"
              ? activeLocs.map(l => (
                  <div key={l.id} style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:16,height:3,background:LOCATIONS[l.id].color}}/>
                    <span style={{fontSize:11,color:LOCATIONS[l.id].color,fontFamily:SANS,fontWeight:500}}>{LOCATIONS[l.id].flag} {LOCATIONS[l.id].label}</span>
                  </div>
                ))
              : activeIds.map((id,si) => {
                  const def    = SIGNAL_DEFS.find(d=>d.id===id);
                  const custom = customSignals.find(c=>c.id===id);
                  const col    = PALETTE[si%PALETTE.length];
                  return (
                    <div key={id} style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:16,height:3,background:col}}/>
                      <span style={{fontSize:11,color:col,fontFamily:SANS,fontWeight:500}}>{def?.label||custom?.label||id}</span>
                    </div>
                  );
                })
            }
          </div>

          {divider}

          {/* ── CORRELATIONS ── */}
          <SectionLabel>Signal Relationships</SectionLabel>
          {corrPairs.length === 0
            ? <p style={{fontSize:13,color:V.textFaint,fontFamily:MONO,margin:0}}>Activate 2+ signals to see correlations.</p>
            : corrPairs.map(({a,b,r}) => {
                const la  = SIGNAL_DEFS.find(d=>d.id===a)?.label||a;
                const lb  = SIGNAL_DEFS.find(d=>d.id===b)?.label||b;
                const ca  = PALETTE[SIGNAL_DEFS.findIndex(d=>d.id===a)%PALETTE.length];
                const cb  = PALETTE[SIGNAL_DEFS.findIndex(d=>d.id===b)%PALETTE.length];
                const hue = r>0 ? V.lime : V.red;
                const str = Math.abs(r)>0.7?"Strong":Math.abs(r)>0.4?"Moderate":"Weak";
                return (
                  <div key={a+b} style={{marginBottom:14,paddingBottom:14,borderBottom:`1px solid ${V.border}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontSize:12,fontFamily:SANS,color:V.textDim}}>
                        <span style={{color:ca,fontWeight:600}}>{la}</span>
                        <span style={{color:V.textFaint}}> × </span>
                        <span style={{color:cb,fontWeight:600}}>{lb}</span>
                      </span>
                      <span style={{fontSize:13,fontFamily:MONO,color:hue,minWidth:44,textAlign:"right"}}>{r>0?"+":""}{r.toFixed(2)}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{flex:1,height:3,background:"rgba(255,255,255,0.08)"}}>
                        <div style={{height:"100%",width:`${Math.abs(r)*100}%`,background:hue}}/>
                      </div>
                      <span style={{fontSize:10,color:hue,minWidth:80,fontFamily:SANS,fontWeight:600,textTransform:"uppercase"}}>{str} {r>0?"Sync":"Invert"}</span>
                    </div>
                  </div>
                );
              })
          }

          {divider}

          {/* ── READ THE SIGNALS ── */}
          <SectionLabel>AI Interpretation</SectionLabel>
          <ReadPanel activeIds={activeIds} locations={locations} timeRange={timeRange} customSignals={customSignals}/>

          <div style={{height:32}}/>
        </div>

        {/* ── RIGHT: signal panel (sticky on desktop) ── */}
        <div style={{
          gridColumn: isDesktop ? "2" : undefined,
          gridRow:    isDesktop ? "1" : undefined,
        }}>
          <div style={{
            position:  isDesktop ? "sticky" : "static",
            top:       isDesktop ? headerH  : undefined,
            maxHeight: isDesktop ? `calc(100dvh - ${headerH}px)` : undefined,
            overflowY: isDesktop ? "auto"   : undefined,
            padding:   rPad,
            borderTop: isDesktop ? "none"   : `1px solid ${V.border}`,
          }}>

            <SectionLabel>Signals ({filtered.length})</SectionLabel>

            {/* Search */}
            <input
              value={searchQ} onChange={e=>setSearchQ(e.target.value)}
              placeholder="Search by name or category..."
              style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${V.border}`,color:V.text,padding:"9px 12px",fontFamily:MONO,fontSize:12,boxSizing:"border-box",outline:"none",marginBottom:10}}
            />

            {/* Category filter */}
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
              {cats.map(c => (
                <button key={c} onClick={()=>setCatFilter(c)} style={{padding:"4px 10px",fontSize:10,background:catFilter===c?V.gold:"rgba(255,255,255,0.04)",border:`1px solid ${catFilter===c?V.gold:V.border}`,color:catFilter===c?"#000":V.textDim,cursor:"pointer",fontFamily:SANS,fontWeight:catFilter===c?700:400,transition:"background 150ms"}}>{c}</button>
              ))}
            </div>

            {/* Sort */}
            <div style={{display:"flex",gap:4,marginBottom:14}}>
              {[["category","Category"],["harmony","Harmony"],["alpha","A–Z"]].map(([id,lbl]) => (
                <button key={id} onClick={()=>setSortMode(id)} style={{flex:1,padding:"6px 4px",fontSize:10,background:sortMode===id?V.violet:"rgba(255,255,255,0.04)",border:`1px solid ${sortMode===id?V.violet:V.border}`,color:sortMode===id?"#fff":V.textDim,cursor:"pointer",fontFamily:SANS,fontWeight:sortMode===id?600:400,transition:"background 150ms"}}>{lbl}</button>
              ))}
            </div>

            {/* Signal list */}
            {sorted.map(def => {
              const active = activeIds.includes(def.id);
              const col    = PALETTE[SIGNAL_DEFS.findIndex(d=>d.id===def.id)%PALETTE.length] || def.color || PALETTE[0];
              const d      = def.custom ? def.data : getSignalData(def.id,locId).slice(t0,t1);
              const latest = d[d.length-1];
              const trend  = d.length>1 ? d[d.length-1]-d[0] : 0;
              return (
                <div key={def.id} onClick={()=>toggleSignal(def.id)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${V.border}`,cursor:"pointer",opacity:active?1:0.35,transition:"opacity 150ms"}}>
                  <div style={{width:10,height:10,flexShrink:0,background:active?col:"rgba(240,237,232,0.15)"}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontFamily:SANS,fontWeight:active?600:400,color:active?col:V.textFaint,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{def.label}</div>
                    <div style={{fontSize:10,color:V.textFaint,fontFamily:SANS}}>{def.cat}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:13,color:V.text,fontFamily:MONO}}>{latest?.toFixed(1)}<span style={{fontSize:10,color:V.textFaint}}>{def.unit}</span></div>
                    <div style={{fontSize:11,color:trend>0?V.lime:V.red,fontFamily:MONO}}>{trend>0?"▲":"▼"}</div>
                  </div>
                  {def.custom && <button onClick={e=>{e.stopPropagation();removeCustom(def.id);}} style={{background:"none",border:"none",color:"rgba(255,34,85,0.5)",cursor:"pointer",fontSize:16,padding:"0 2px"}}>×</button>}
                </div>
              );
            })}

            <button onClick={()=>setShowAdd(true)} style={{width:"100%",padding:"12px 0",marginTop:12,background:"transparent",border:`1px dashed rgba(212,168,67,0.4)`,color:V.gold,fontFamily:SANS,fontWeight:600,fontSize:11,letterSpacing:"0.1em",cursor:"pointer",textTransform:"uppercase"}}>
              + Add Your Own Signal
            </button>

            <div style={{height:20}}/>
          </div>
        </div>

      </div>

      {showAdd && <AddModal onAdd={addCustom} onClose={()=>setShowAdd(false)} usedColors={Object.values(LOCATIONS).map(l=>l.color)}/>}
    </div>
  );
}
