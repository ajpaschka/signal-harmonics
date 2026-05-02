import { useState, useEffect, useRef, useCallback } from "react";
import { API_URL } from "./config.js";

const FONT = document.createElement("link");
FONT.rel = "stylesheet";
FONT.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap";
document.head.appendChild(FONT);

// ── PAUL RAND / IBM PALETTE ───────────────────────────────────────────────────
const V = {
  bg:       "#0d1b2a",
  bgDeep:   "#091525",
  bgPanel:  "#0f2035",
  border:   "rgba(240,237,232,0.12)",
  borderHi: "rgba(240,237,232,0.35)",
  text:     "#F0EDE8",
  textDim:  "rgba(240,237,232,0.5)",
  textFaint:"rgba(240,237,232,0.2)",
  gold:     "#d4a843",
  goldLight:"#e8c060",
  red:      "#ff2255",
  lime:     "#c8f020",
  violet:   "#b44fff",
  blue:     "#00cfff",
  pink:     "#ff44aa",
  panel:    "#0f2035",
};
const SANS  = "'IBM Plex Sans', sans-serif";
const MONO  = "'IBM Plex Mono', monospace";
const DISPLAY = "'Orbitron', monospace";
const PALETTE = ["#ff2255","#c8f020","#d4a843","#b44fff","#00cfff","#ff6600","#ff44aa","#44ffcc","#ffee22","#ff3300","#88ff00","#cc88ff","#ff8844","#00ffcc","#ff0066","#aaffee","#ff99cc","#ccff00"];

function hexToRgba(h,a){const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return `rgba(${r},${g},${b},${a})`;}
function normalize(arr){const mn=Math.min(...arr),mx=Math.max(...arr);return arr.map(v=>mx===mn?0.5:(v-mn)/(mx-mn));}
function pearson(a,b){const n=Math.min(a.length,b.length);const ma=a.slice(0,n).reduce((s,v)=>s+v,0)/n,mb=b.slice(0,n).reduce((s,v)=>s+v,0)/n;let num=0,da=0,db=0;for(let i=0;i<n;i++){num+=(a[i]-ma)*(b[i]-mb);da+=(a[i]-ma)**2;db+=(b[i]-mb)**2;}return da&&db?num/Math.sqrt(da*db):0;}
function rollingAvg(arr,w=6){return arr.map((_,i)=>{const s=arr.slice(Math.max(0,i-w+1),i+1);return s.reduce((a,b)=>a+b,0)/s.length;});}

const LOCATIONS = {
  global:{ label:"Global",  flag:"🌐", color:"#b44fff" },
  us:    { label:"USA",     flag:"🇺🇸", color:"#00cfff" },
  eu:    { label:"Europe",  flag:"🇪🇺", color:"#c8f020" },
  china: { label:"China",   flag:"🇨🇳", color:"#ff2255" },
  india: { label:"India",   flag:"🇮🇳", color:"#ff8844" },
  brazil:{ label:"Brazil",  flag:"🇧🇷", color:"#d4a843" },
};
function makeLocData(base,scale=1,offset=0,noise=0.05){return base.map((v,i)=>{const n=(Math.sin(i*7.3+offset)*2-1)*noise*Math.abs(v||1);return +(v*scale+offset+n).toFixed(2);});}

const N=72;
const MONTH_LABELS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const ALL_TIME_LABELS=[2019,2020,2021,2022,2023,2024].flatMap(y=>MONTH_LABELS.map(m=>`${m} ${y}`));
const ERAS=[
  {start:0, end:11, label:"Pre-COVID",  color:"rgba(180,79,255,0.18)"},
  {start:12,end:23, label:"Pandemic",   color:"rgba(255,34,85,0.18)"},
  {start:24,end:35, label:"Recovery",   color:"rgba(200,240,32,0.12)"},
  {start:36,end:47, label:"Inflation",  color:"rgba(255,100,0,0.18)"},
  {start:48,end:59, label:"Stabilize",  color:"rgba(0,207,255,0.12)"},
  {start:60,end:71, label:"New Normal", color:"rgba(212,168,67,0.15)"},
];

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
const LOC_SCALES={global:{scale:1.00,offset:0,noise:0.03},us:{scale:1.05,offset:0.2,noise:0.04},eu:{scale:0.85,offset:-0.3,noise:0.04},china:{scale:1.15,offset:0.5,noise:0.06},india:{scale:1.20,offset:-0.8,noise:0.07},brazil:{scale:0.92,offset:1.2,noise:0.08}};
const SIGNAL_DEFS=[
  {id:"gdp",        label:"GDP Growth",    unit:"%",   cat:"Economy",     baseKey:"gdp"},
  {id:"inflation",  label:"Inflation",     unit:"%",   cat:"Economy",     baseKey:"inflation"},
  {id:"unemployment",label:"Unemployment", unit:"%",   cat:"Economy",     baseKey:"unemployment"},
  {id:"sentiment",  label:"Sentiment",     unit:"idx", cat:"Society",     baseKey:"sentiment"},
  {id:"sp500",      label:"S&P 500",       unit:"",    cat:"Markets",     baseKey:"sp500"},
  {id:"energy",     label:"Oil Price",     unit:"$/b", cat:"Environment", baseKey:"energy"},
  {id:"globaltemp", label:"Temp Anomaly",  unit:"°C",  cat:"Environment", baseKey:"globaltemp"},
  {id:"internet",   label:"Internet",      unit:"idx", cat:"Digital",     baseKey:"internet"},
  {id:"socialmood", label:"Social Mood",   unit:"idx", cat:"Digital",     baseKey:"socialmood"},
  {id:"polarize",   label:"Polarization",  unit:"idx", cat:"Society",     baseKey:"polarize"},
  {id:"wellbeing",  label:"Wellbeing",     unit:"idx", cat:"Society",     baseKey:"wellbeing"},
  {id:"violent",    label:"Violent Crime", unit:"idx", cat:"Crime",       baseKey:"violent"},
  {id:"property",   label:"Property Crime",unit:"idx", cat:"Crime",       baseKey:"property"},
  {id:"drugcrime",  label:"Drug Crime",    unit:"idx", cat:"Crime",       baseKey:"drugcrime"},
  {id:"cybercrime", label:"Cyber Crime",   unit:"idx", cat:"Crime",       baseKey:"cybercrime"},
  {id:"homicide",   label:"Homicide Rate", unit:"idx", cat:"Crime",       baseKey:"homicide"},
];
function getSignalData(sigId,locId){const def=SIGNAL_DEFS.find(d=>d.id===sigId);if(!def)return[];const base=BASE[def.baseKey]||[];const ls=LOC_SCALES[locId]||LOC_SCALES.global;return makeLocData(base,ls.scale,ls.offset,ls.noise);}

// ── RADIAL CANVAS ─────────────────────────────────────────────────────────────
function RadialCanvas({activeIds,locations,hoveredId,onHover,onPointSelect,pointIdx,time,size,timeRange,perspective}){
  const canvasRef=useRef(null);
  const dpr=window.devicePixelRatio||1;

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");
    canvas.width=size*dpr;canvas.height=size*dpr;
    ctx.scale(dpr,dpr);
    const W=size,H=size,cx=W/2,cy=H/2;
    const maxR=Math.min(cx,cy)*0.80;
    const minR=maxR*0.15;

    ctx.fillStyle=V.bgDeep;ctx.fillRect(0,0,W,H);
    const vig=ctx.createRadialGradient(cx,cy,maxR*0.3,cx,cy,maxR*1.3);
    vig.addColorStop(0,"transparent");vig.addColorStop(1,"rgba(9,21,37,0.7)");
    ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);

    const [t0,t1]=timeRange;
    const sliceN=t1-t0;

    ERAS.forEach(era=>{
      const eStart=Math.max(era.start,t0),eEnd=Math.min(era.end,t1);
      if(eStart>=eEnd)return;
      const a0=(eStart-t0)/sliceN*Math.PI*2-Math.PI/2;
      const a1=(eEnd-t0)/sliceN*Math.PI*2-Math.PI/2;
      ctx.beginPath();ctx.arc(cx,cy,maxR+8,a0,a1);ctx.arc(cx,cy,maxR+22,a1,a0,true);ctx.closePath();
      ctx.fillStyle=era.color;ctx.fill();
      const midA=(a0+a1)/2;
      const lx=cx+Math.cos(midA)*(maxR+15);
      const ly=cy+Math.sin(midA)*(maxR+15);
      ctx.fillStyle="rgba(240,237,232,0.4)";
      ctx.font=`${size<340?5:6}px 'IBM Plex Sans',sans-serif`;
      ctx.textAlign="center";ctx.textBaseline="middle";
      if(a1-a0>0.25)ctx.fillText(era.label,lx,ly);
    });

    for(let r=1;r<=5;r++){
      const radius=minR+(maxR-minR)*(r/5);
      ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);
      ctx.strokeStyle=r===5?"rgba(240,237,232,0.18)":"rgba(240,237,232,0.05)";
      ctx.lineWidth=r===5?1:0.5;ctx.stroke();
    }

    const numSpokes=Math.min(6,sliceN);
    for(let si=0;si<=numSpokes;si++){
      const idx=Math.round(si/numSpokes*sliceN);
      const angle=(idx/sliceN)*Math.PI*2-Math.PI/2;
      ctx.beginPath();ctx.moveTo(cx+Math.cos(angle)*minR,cy+Math.sin(angle)*minR);
      ctx.lineTo(cx+Math.cos(angle)*(maxR+2),cy+Math.sin(angle)*(maxR+2));
      ctx.strokeStyle="rgba(212,168,67,0.25)";ctx.lineWidth=0.5;
      ctx.setLineDash([2,4]);ctx.stroke();ctx.setLineDash([]);
      if(si<numSpokes){
        const absIdx=t0+idx;
        if(absIdx<N){
          const lx=cx+Math.cos(angle)*(maxR+30);
          const ly=cy+Math.sin(angle)*(maxR+30);
          ctx.fillStyle=V.gold;
          ctx.font=`bold ${size<320?6:7}px 'IBM Plex Sans',sans-serif`;
          ctx.textAlign="center";ctx.textBaseline="middle";
          ctx.fillText(ALL_TIME_LABELS[absIdx].slice(-4),lx,ly);
        }
      }
    }

    if(pointIdx!==null){
      const angle=(pointIdx/sliceN)*Math.PI*2-Math.PI/2;
      ctx.beginPath();ctx.moveTo(cx+Math.cos(angle)*minR,cy+Math.sin(angle)*minR);
      ctx.lineTo(cx+Math.cos(angle)*maxR,cy+Math.sin(angle)*maxR);
      ctx.strokeStyle="rgba(240,237,232,0.35)";ctx.lineWidth=1;
      ctx.setLineDash([2,3]);ctx.stroke();ctx.setLineDash([]);
    }

    const locIds=locations.filter(l=>l.active).map(l=>l.id);
    activeIds.forEach((sigId,si)=>{
      const def=SIGNAL_DEFS.find(d=>d.id===sigId);if(!def)return;
      const isHov=hoveredId===sigId;
      const dimmed=hoveredId&&!isHov;
      if(perspective==="overlay"){
        locIds.forEach((locId,li)=>{
          const loc=LOCATIONS[locId];
          const fullData=getSignalData(sigId,locId);
          const sliced=fullData.slice(t0,t1);
          if(sliced.length<2)return;
          const norm=normalize(sliced);
          const ringOffset=(li-(locIds.length-1)/2)*0.025;
          const pts=norm.map((v,i)=>{
            const angle=(i/(sliced.length-1+1))*Math.PI*2-Math.PI/2;
            const anim=isHov?Math.sin(time*2+i*0.2)*0.012:0;
            const r=minR+(maxR-minR)*Math.max(0,Math.min(1,v+ringOffset+anim));
            return[cx+Math.cos(angle)*r,cy+Math.sin(angle)*r];
          });
          ctx.beginPath();pts.forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y));ctx.closePath();
          ctx.strokeStyle=hexToRgba(loc.color,dimmed?0.1:isHov?0.9:0.55);
          ctx.lineWidth=isHov?2:0.8+li*0.2;
          ctx.setLineDash(li===0?[]:[3+li,2+li]);ctx.stroke();ctx.setLineDash([]);
          if(pointIdx!==null&&pts[Math.min(pointIdx,pts.length-1)]){
            const[px,py]=pts[Math.min(pointIdx,pts.length-1)];
            ctx.beginPath();ctx.arc(px,py,isHov?4:2,0,Math.PI*2);
            ctx.fillStyle=loc.color;ctx.fill();
          }
        });
      }else{
        const locId=locIds[0]||"global";
        const fullData=getSignalData(sigId,locId);
        const sliced=fullData.slice(t0,t1);
        if(sliced.length<2)return;
        const norm=normalize(sliced);
        const sigColor=PALETTE[si%PALETTE.length];
        if(isHov){
          ctx.beginPath();
          norm.forEach((v,i)=>{const angle=(i/(sliced.length))*Math.PI*2-Math.PI/2;const r=minR+(maxR-minR)*v;ctx.lineTo(cx+Math.cos(angle)*r,cy+Math.sin(angle)*r);});
          ctx.closePath();ctx.strokeStyle=hexToRgba(sigColor,0.25);ctx.lineWidth=8;
          ctx.filter="blur(4px)";ctx.stroke();ctx.filter="none";
        }
        const pts=norm.map((v,i)=>{
          const angle=(i/sliced.length)*Math.PI*2-Math.PI/2;
          const anim=isHov?Math.sin(time*2.5+i*0.25)*0.018:0;
          const r=minR+(maxR-minR)*Math.max(0,Math.min(1,v+anim));
          return[cx+Math.cos(angle)*r,cy+Math.sin(angle)*r];
        });
        ctx.beginPath();pts.forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y));ctx.closePath();
        ctx.fillStyle=hexToRgba(sigColor,dimmed?0.01:isHov?0.08:0.04);ctx.fill();
        ctx.strokeStyle=hexToRgba(sigColor,dimmed?0.1:isHov?1:0.75);
        ctx.lineWidth=isHov?2.5:1.2;ctx.stroke();
        if(pointIdx!==null&&pts[Math.min(pointIdx,pts.length-1)]){
          const[px,py]=pts[Math.min(pointIdx,pts.length-1)];
          ctx.beginPath();ctx.arc(px,py,isHov?5:3,0,Math.PI*2);
          ctx.fillStyle=sigColor;ctx.globalAlpha=dimmed?0.2:1;ctx.fill();ctx.globalAlpha=1;
        }
      }
    });

    let total=0,count=0;
    const locId=(locIds[0]||"global");
    activeIds.forEach((a,ai)=>activeIds.slice(ai+1).forEach(b=>{
      const da=getSignalData(a,locId).slice(t0,t1);
      const db=getSignalData(b,locId).slice(t0,t1);
      total+=Math.abs(pearson(da,db));count++;
    }));
    const harmony=count?total/count:0;
    const hC=harmony>0.6?V.lime:harmony>0.35?V.gold:V.red;
    const pulse=1+Math.sin(time*2.2)*0.07;
    const orbR=minR*0.58*pulse;
    ctx.beginPath();ctx.arc(cx,cy,orbR,0,Math.PI*2);
    ctx.fillStyle=hexToRgba(hC,0.85);ctx.fill();
    const fs=size<320?10:12;
    ctx.fillStyle="#000";ctx.font=`bold ${fs}px 'IBM Plex Sans',sans-serif`;
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(`${Math.round(harmony*100)}%`,cx,cy-5);
    ctx.font=`${size<320?6:7}px 'IBM Plex Sans',sans-serif`;
    ctx.fillStyle="rgba(0,0,0,0.7)";ctx.fillText("HARMONY",cx,cy+7);
  },[activeIds,locations,hoveredId,pointIdx,time,size,timeRange,perspective,dpr]);

  const getFromEvent=useCallback((e)=>{
    const canvas=canvasRef.current;if(!canvas)return{idx:null,id:null};
    const rect=canvas.getBoundingClientRect();
    const clientX=e.touches?e.touches[0].clientX:e.clientX;
    const clientY=e.touches?e.touches[0].clientY:e.clientY;
    const mx=(clientX-rect.left)*(size/rect.width);
    const my=(clientY-rect.top)*(size/rect.height);
    const cx=size/2,cy=size/2,maxR=Math.min(cx,cy)*0.80,minR=maxR*0.15;
    const dist=Math.sqrt((mx-cx)**2+(my-cy)**2);
    if(dist<minR*0.5||dist>maxR+30)return{idx:null,id:null};
    const[t0,t1]=timeRange;const sliceN=t1-t0;
    let angle=Math.atan2(my-cy,mx-cx)+Math.PI/2;
    if(angle<0)angle+=Math.PI*2;
    const idx=Math.round((angle/(Math.PI*2))*sliceN)%sliceN;
    const locId=(locations.find(l=>l.active)||{id:"global"}).id;
    let closest=null,closestDist=999;
    activeIds.forEach(sigId=>{
      const sliced=getSignalData(sigId,locId).slice(t0,t1);
      const norm=normalize(sliced);
      const v=norm[Math.min(idx,norm.length-1)];
      const r=minR+(maxR-minR)*v;
      if(Math.abs(dist-r)<closestDist){closestDist=Math.abs(dist-r);closest=sigId;}
    });
    return{idx,id:closestDist<35?closest:null};
  },[activeIds,locations,timeRange,size]);

  const handleMove=useCallback((e)=>{const{idx,id}=getFromEvent(e);onPointSelect(idx);onHover(id);},[getFromEvent,onPointSelect,onHover]);
  const handleLeave=useCallback(()=>{onHover(null);onPointSelect(null);},[onHover,onPointSelect]);
  return(
    <canvas ref={canvasRef}
      style={{width:size,height:size,display:"block",cursor:"crosshair",touchAction:"none"}}
      onMouseMove={handleMove} onMouseLeave={handleLeave}
      onTouchMove={e=>{e.preventDefault();handleMove(e);}} onTouchEnd={handleLeave}
    />
  );
}

// ── ADD SIGNAL MODAL ──────────────────────────────────────────────────────────
function AddModal({onAdd,onClose,usedColors}){
  const[label,setLabel]=useState("");
  const[unit,setUnit]=useState("");
  const[cat,setCat]=useState("Custom");
  const[raw,setRaw]=useState("");
  const[color,setColor]=useState(PALETTE.find(c=>!usedColors.includes(c))||PALETTE[0]);
  const[err,setErr]=useState("");
  const nums=raw.split(/[\s,;\n\t]+/).map(Number).filter(v=>!isNaN(v)&&String(v).trim()!=="");
  const submit=()=>{
    if(!label.trim()){setErr("Name required");return;}
    if(nums.length<3){setErr("Need 3+ data points");return;}
    onAdd({id:`custom_${Date.now()}`,label:label.trim(),unit:unit.trim(),cat:cat||"Custom",baseKey:null,color,data:nums,custom:true});
    onClose();
  };
  const inputStyle={width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${V.border}`,color:V.text,padding:"10px 12px",fontFamily:MONO,fontSize:13,boxSizing:"border-box",outline:"none"};
  const labelStyle={fontSize:10,letterSpacing:"0.15em",color:V.textDim,fontFamily:SANS,marginBottom:5,textTransform:"uppercase",fontWeight:600};
  return(
    <div style={{position:"fixed",inset:0,zIndex:600,background:"rgba(9,21,37,0.95)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{width:"100%",maxWidth:420,background:V.bgPanel,border:`1px solid ${V.borderHi}`,padding:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontFamily:SANS,fontSize:13,letterSpacing:"0.15em",color:V.gold,fontWeight:700,textTransform:"uppercase"}}>Add Signal</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:V.textDim,cursor:"pointer",fontSize:22,lineHeight:1}}>×</button>
        </div>
        {[["Signal Name *",label,setLabel,"e.g. My Sales"],["Unit",unit,setUnit,"%, $, pts"],["Category",cat,setCat,"Custom / Economy / ..."]].map(([lbl,val,set,ph])=>(
          <div key={lbl} style={{marginBottom:12}}>
            <div style={labelStyle}>{lbl}</div>
            <input value={val} onChange={e=>set(e.target.value)} placeholder={ph} style={inputStyle}/>
          </div>
        ))}
        <div style={{marginBottom:12}}>
          <div style={labelStyle}>Data Points * — paste any numbers</div>
          <textarea value={raw} onChange={e=>setRaw(e.target.value)} rows={4} placeholder={"12.5, 13.1, 11.8...\nor paste from spreadsheet"}
            style={{...inputStyle,resize:"vertical"}}/>
          <div style={{fontSize:11,color:nums.length>=3?V.lime:V.red,fontFamily:MONO,marginTop:4}}>{nums.length} points detected</div>
        </div>
        <div style={{marginBottom:16}}>
          <div style={labelStyle}>Color</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {PALETTE.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:22,height:22,background:c,cursor:"pointer",border:`2px solid ${color===c?"white":"transparent"}`,outline:color===c?`2px solid ${c}`:"none",outlineOffset:2}}/>)}
          </div>
        </div>
        {err&&<div style={{fontSize:11,color:V.red,fontFamily:MONO,marginBottom:10}}>{err}</div>}
        <button onClick={submit} style={{width:"100%",padding:"13px 0",background:V.gold,border:"none",color:"#000",fontFamily:SANS,fontSize:12,letterSpacing:"0.15em",fontWeight:700,cursor:"pointer",textTransform:"uppercase"}}>
          Add to Array
        </button>
      </div>
    </div>
  );
}

// ── READ PANEL ────────────────────────────────────────────────────────────────
function ReadPanel({activeIds,locations,timeRange,perspective,customSignals,isDesktop}){
  const[reading,setReading]=useState("");
  const[echo,setEcho]=useState("");
  const[loading,setLoading]=useState(false);
  const[status,setStatus]=useState("idle");

  const analyze=async()=>{
    if(activeIds.length<2){setStatus("need2");return;}
    setLoading(true);setStatus("loading");setReading("");setEcho("");
    const[t0,t1]=timeRange;
    const activeLocs=locations.filter(l=>l.active).map(l=>l.id);
    const locId=activeLocs[0]||"global";
    const summary=activeIds.slice(0,8).map(id=>{
      const def=SIGNAL_DEFS.find(d=>d.id===id);
      const custom=customSignals.find(c=>c.id===id);
      let d;
      if(custom)d=custom.data.slice(0,t1-t0);
      else d=getSignalData(id,locId).slice(t0,t1);
      if(!d.length)return"";
      const trend=d[d.length-1]-d[0];
      const label=def?def.label:custom?.label||id;
      const cat=def?def.cat:custom?.cat||"Custom";
      return`${label} (${cat}, ${LOCATIONS[locId]?.label||locId}): range ${Math.min(...d).toFixed(1)}–${Math.max(...d).toFixed(1)}, trend ${trend>0?"+":""}${trend.toFixed(1)}`;
    }).filter(Boolean).join("\n");
    const pairs=[];
    for(let i=0;i<activeIds.length;i++)for(let j=i+1;j<activeIds.length;j++){
      const da=getSignalData(activeIds[i],locId).slice(t0,t1);
      const db=getSignalData(activeIds[j],locId).slice(t0,t1);
      const r=pearson(da,db);pairs.push({a:activeIds[i],b:activeIds[j],r});
    }
    pairs.sort((a,b)=>Math.abs(b.r)-Math.abs(a.r));
    const pairStr=pairs.slice(0,3).map(p=>{
      const la=SIGNAL_DEFS.find(d=>d.id===p.a)?.label||p.a;
      const lb=SIGNAL_DEFS.find(d=>d.id===p.b)?.label||p.b;
      return`${la} vs ${lb}: r=${p.r.toFixed(2)}`;
    }).join("; ");
    const period=`${ALL_TIME_LABELS[t0]} to ${ALL_TIME_LABELS[Math.min(t1-1,N-1)]}`;
    const locLabel=activeLocs.map(l=>LOCATIONS[l]?.label).join(", ");
    const prompt=`Analyzing world signals for ${locLabel}, ${period}.\n\nSignals:\n${summary}\n\nTop relationships: ${pairStr}\n\nRespond ONLY in this exact format:\n\nREADING: [3 sentences. Specific, poetic. What story do these signals tell together? What tension or harmony?]\n\nECHO: [One specific historical period with similar pattern. One sentence on the parallel. One sentence on key difference.]`;
    try{
      const res=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      const rawText=await res.text();
      if(!res.ok){throw new Error("HTTP "+res.status+": "+rawText.slice(0,300));}
      let json;try{json=JSON.parse(rawText);}catch(pe){throw new Error("Not JSON: "+rawText.slice(0,300));}
      if(json.type==="error"||json.error){throw new Error(json.error&&json.error.message?json.error.message:JSON.stringify(json).slice(0,200));}
      const blocks=Array.isArray(json.content)?json.content:[];
      const txt=blocks.filter(b=>b.type==="text").map(b=>b.text).join("").trim();
      if(!txt){throw new Error("No text. Keys: "+Object.keys(json).join(","));}
      const rM=txt.match(/READING:\s*([\s\S]*?)(?=ECHO:|$)/);
      const eM=txt.match(/ECHO:\s*([\s\S]*?)$/);
      setReading(rM?rM[1].trim():txt);setEcho(eM?eM[1].trim():"");setStatus("done");
    }catch(err){setReading("Error: "+err.message);setStatus("error");}
    setLoading(false);
  };

  const pad=isDesktop?"24px":"16px";
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12,padding:pad}}>
      <div style={{fontSize:10,letterSpacing:"0.2em",color:V.textDim,fontFamily:SANS,fontWeight:600,textTransform:"uppercase",marginBottom:4}}>AI Interpretation</div>
      <button onClick={analyze} disabled={loading} style={{width:"100%",padding:"15px 0",background:loading?"transparent":V.gold,border:`2px solid ${V.gold}`,color:loading?V.gold:"#000000",fontFamily:SANS,fontWeight:700,fontSize:12,letterSpacing:"0.15em",cursor:loading?"wait":"pointer",textTransform:"uppercase",transition:"background 150ms, color 150ms"}}>
        {loading?"Scanning...":"Read the Signals"}
      </button>
      {status==="need2"&&<p style={{margin:0,fontSize:12,color:V.red,fontFamily:MONO}}>Activate at least 2 signals.</p>}
      {reading&&status!=="error"&&(
        <div style={{padding:16,border:`1px solid ${V.border}`,background:"rgba(255,255,255,0.03)"}}>
          <div style={{fontSize:9,letterSpacing:"0.2em",color:V.textDim,marginBottom:10,fontFamily:SANS,fontWeight:600,textTransform:"uppercase"}}>Signal Reading</div>
          <p style={{margin:0,fontSize:13,lineHeight:1.8,color:V.text,fontFamily:MONO}}>{reading}</p>
        </div>
      )}
      {echo&&(
        <div style={{padding:16,borderLeft:`3px solid ${V.gold}`,background:"rgba(212,168,67,0.05)"}}>
          <div style={{fontSize:9,letterSpacing:"0.2em",color:V.gold,marginBottom:10,fontFamily:SANS,fontWeight:600,textTransform:"uppercase"}}>Historical Echo</div>
          <p style={{margin:0,fontSize:13,lineHeight:1.8,color:"rgba(240,230,200,0.9)",fontFamily:MONO}}>{echo}</p>
        </div>
      )}
      {status==="error"&&<div style={{padding:12,borderLeft:`3px solid ${V.red}`}}><p style={{margin:0,fontSize:12,color:"#ff6688",fontFamily:MONO}}>{reading}</p></div>}
      {status==="idle"&&<p style={{margin:0,fontSize:12,color:V.textFaint,fontFamily:MONO,lineHeight:1.75}}>Select signals, location, and time window. Press Read for AI interpretation + historical echo.</p>}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const[activeIds,setActiveIds]=useState(["gdp","inflation","sp500","sentiment","violent","cybercrime"]);
  const[locations,setLocations]=useState(Object.keys(LOCATIONS).map((id,i)=>({id,active:i===0})));
  const[timeRange,setTimeRange]=useState([0,N]);
  const[searchQ,setSearchQ]=useState("");
  const[catFilter,setCatFilter]=useState("All");
  const[sortMode,setSortMode]=useState("category");
  const[perspective,setPerspective]=useState("signals");
  const[customSignals,setCustomSignals]=useState([]);
  const[hoveredId,setHoveredId]=useState(null);
  const[pointIdx,setPointIdx]=useState(null);
  const[tab,setTab]=useState("chart");
  const[showAdd,setShowAdd]=useState(false);
  const[time,setTime]=useState(0);
  const[canvasSize,setCanvasSize]=useState(340);
  const[windowWidth,setWindowWidth]=useState(window.innerWidth);
  const animRef=useRef(null);
  const isDesktop=windowWidth>=768;

  useEffect(()=>{
    const loop=()=>{setTime(t=>t+0.016);animRef.current=requestAnimationFrame(loop);};
    animRef.current=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(animRef.current);
  },[]);

  useEffect(()=>{
    const update=()=>{
      const w=window.innerWidth;
      setWindowWidth(w);
      setCanvasSize(w>=768?Math.min(w*0.5-48,680):Math.min(w-24,500));
    };
    update();window.addEventListener("resize",update);
    return()=>window.removeEventListener("resize",update);
  },[]);

  const toggleSignal=id=>setActiveIds(p=>p.includes(id)?p.filter(s=>s!==id):[...p,id]);
  const toggleLocation=id=>setLocations(p=>p.map(l=>l.id===id?{...l,active:!l.active}:l));
  const addCustom=sig=>{setCustomSignals(p=>[...p,sig]);setActiveIds(p=>[...p,sig.id]);};
  const removeCustom=id=>{setCustomSignals(p=>p.filter(s=>s.id!==id));setActiveIds(p=>p.filter(s=>s!==id));};

  const locId=(locations.find(l=>l.active)||{id:"global"}).id;
  const[t0,t1]=timeRange;
  const allDefs=[...SIGNAL_DEFS,...customSignals.map(c=>({...c,baseKey:null}))];
  const cats=["All",...new Set(allDefs.map(s=>s.cat))];
  const filteredDefs=allDefs.filter(d=>{
    const matchQ=!searchQ||d.label.toLowerCase().includes(searchQ.toLowerCase())||d.cat.toLowerCase().includes(searchQ.toLowerCase());
    const matchCat=catFilter==="All"||d.cat===catFilter;
    return matchQ&&matchCat;
  });
  const sortedDefs=[...filteredDefs].sort((a,b)=>{
    if(sortMode==="category")return a.cat.localeCompare(b.cat)||a.label.localeCompare(b.label);
    if(sortMode==="harmony"){
      const ra=activeIds.filter(id=>id!==a.id).reduce((s,id)=>{const da=a.custom?a.data.slice(0,t1-t0):getSignalData(a.id,locId).slice(t0,t1);const db=getSignalData(id,locId).slice(t0,t1);return s+Math.abs(pearson(da,db));},0);
      const rb=activeIds.filter(id=>id!==b.id).reduce((s,id)=>{const db2=b.custom?b.data.slice(0,t1-t0):getSignalData(b.id,locId).slice(t0,t1);const db=getSignalData(id,locId).slice(t0,t1);return s+Math.abs(pearson(db2,db));},0);
      return rb-ra;
    }
    return a.label.localeCompare(b.label);
  });

  const harmony=(()=>{let total=0,count=0;activeIds.forEach((a,ai)=>activeIds.slice(ai+1).forEach(b=>{const da=getSignalData(a,locId).slice(t0,t1);const db=getSignalData(b,locId).slice(t0,t1);total+=Math.abs(pearson(da,db));count++;}));return count?total/count:0;})();
  const hC=harmony>0.6?V.lime:harmony>0.35?V.gold:V.red;
  const hLabel=harmony>0.6?"In Harmony":harmony>0.35?"Mild Sync":"Dissonant";
  const activeLocs=locations.filter(l=>l.active);
  const TABS=[{id:"chart",label:"Array"},{id:"latch",label:"LATCH"},{id:"harmonics",label:"Links"},{id:"read",label:"Read"}];
  const pad=isDesktop?"0 32px":"0 16px";

  // Signal list — shared between chart sidebar (desktop) and latch tab
  const SignalList=()=>(
    <div>
      <div style={{fontSize:10,letterSpacing:"0.15em",color:V.textDim,fontFamily:SANS,fontWeight:600,textTransform:"uppercase",marginBottom:10}}>Signals ({filteredDefs.length})</div>
      {sortedDefs.map((def)=>{
        const active=activeIds.includes(def.id);
        const col=PALETTE[SIGNAL_DEFS.findIndex(d=>d.id===def.id)%PALETTE.length]||def.color||PALETTE[0];
        const d=def.custom?def.data:getSignalData(def.id,locId).slice(t0,t1);
        const latest=d[d.length-1];
        const trend=d.length>1?d[d.length-1]-d[0]:0;
        return(
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
            {def.custom&&(
              <button onClick={e=>{e.stopPropagation();removeCustom(def.id);}} style={{background:"none",border:"none",color:"rgba(255,34,85,0.5)",cursor:"pointer",fontSize:16,padding:"0 2px"}}>×</button>
            )}
          </div>
        );
      })}
      <button onClick={()=>setShowAdd(true)} style={{width:"100%",padding:"12px 0",marginTop:12,background:"transparent",border:`1px dashed rgba(212,168,67,0.4)`,color:V.gold,fontFamily:SANS,fontWeight:600,fontSize:11,letterSpacing:"0.1em",cursor:"pointer",textTransform:"uppercase"}}>
        + Add Your Own Signal
      </button>
    </div>
  );

  return(
    <div style={{minHeight:"100dvh",background:V.bg,color:V.text,fontFamily:SANS,maxWidth:isDesktop?"none":540,margin:"0 auto",overflow:"hidden"}}>

      {/* HEADER */}
      <div style={{padding:isDesktop?"14px 32px 0":"12px 16px 0",borderBottom:`2px solid ${V.gold}`,background:V.bgPanel,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <div style={{fontSize:9,letterSpacing:"0.35em",color:V.textDim,fontFamily:SANS,fontWeight:500,textTransform:"uppercase",marginBottom:3}}>SHR · Signal Harmonics</div>
            <div style={{fontSize:isDesktop?22:17,fontFamily:DISPLAY,fontWeight:900,letterSpacing:"0.04em",color:V.text}}>WORLD ARRAY</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:9,color:V.textDim,fontFamily:SANS,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.15em"}}>Harmony</div>
            <div style={{fontSize:isDesktop?30:24,fontFamily:DISPLAY,fontWeight:900,color:hC,lineHeight:1}}>{Math.round(harmony*100)}%</div>
            <div style={{fontSize:10,color:hC,fontFamily:SANS,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.1em"}}>{hLabel}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:1}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:isDesktop?"11px 0":"9px 0",fontSize:isDesktop?11:10,letterSpacing:"0.12em",background:tab===t.id?V.gold:"transparent",border:"none",color:tab===t.id?"#000000":V.textDim,cursor:"pointer",fontFamily:SANS,fontWeight:tab===t.id?700:400,textTransform:"uppercase",transition:"background 150ms, color 150ms"}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CHART TAB ── */}
      {tab==="chart"&&(
        <div style={{display:isDesktop?"grid":"flex",gridTemplateColumns:isDesktop?"1fr 360px":undefined,flexDirection:isDesktop?undefined:"column",height:isDesktop?"calc(100dvh - 102px)":undefined}}>

          {/* Canvas column */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:isDesktop?"24px 24px":"12px 16px 0",overflowY:isDesktop?"auto":"visible",borderRight:isDesktop?`1px solid ${V.border}`:"none"}}>
            <div style={{display:"flex",gap:4,marginBottom:12,width:"100%"}}>
              {[["signals","By Signal"],["overlay","By Location"]].map(([id,lbl])=>(
                <button key={id} onClick={()=>setPerspective(id)} style={{flex:1,padding:"8px 0",fontSize:11,background:perspective===id?V.violet:"transparent",border:`1px solid ${perspective===id?V.violet:V.border}`,color:perspective===id?"#fff":V.textDim,cursor:"pointer",fontFamily:SANS,fontWeight:perspective===id?600:400,transition:"background 150ms"}}>
                  {lbl}
                </button>
              ))}
            </div>

            <RadialCanvas activeIds={activeIds} locations={locations} hoveredId={hoveredId} onHover={setHoveredId} onPointSelect={setPointIdx} pointIdx={pointIdx} time={time} size={canvasSize} timeRange={timeRange} perspective={perspective}/>

            <div style={{width:"100%",padding:"12px 0 6px"}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:V.textDim,fontFamily:SANS,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>
                <span>Time Window</span>
                <span style={{color:V.gold,fontFamily:MONO}}>{ALL_TIME_LABELS[t0]} → {ALL_TIME_LABELS[Math.min(t1-1,N-1)]}</span>
              </div>
              <div style={{display:"flex",gap:4,marginBottom:8}}>
                <input type="range" min={0} max={N-12} value={t0} onChange={e=>setTimeRange([+e.target.value,Math.min(+e.target.value+12,N)])} style={{flex:1,accentColor:V.violet,height:3}}/>
                <input type="range" min={12} max={N} value={t1} onChange={e=>setTimeRange([Math.max(0,+e.target.value-12),+e.target.value])} style={{flex:1,accentColor:V.gold,height:3}}/>
              </div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                <button onClick={()=>setTimeRange([0,N])} style={{padding:"4px 10px",fontSize:10,background:"rgba(255,255,255,0.05)",border:`1px solid ${V.border}`,color:V.textDim,cursor:"pointer",fontFamily:SANS,fontWeight:500}}>All</button>
                {ERAS.map(e=>(
                  <button key={e.label} onClick={()=>setTimeRange([e.start,e.end+1])} style={{padding:"4px 10px",fontSize:10,background:e.color,border:`1px solid rgba(255,255,255,0.12)`,color:"rgba(255,255,255,0.85)",cursor:"pointer",fontFamily:SANS,fontWeight:500}}>{e.label}</button>
                ))}
              </div>
            </div>

            {pointIdx!==null&&(
              <div style={{width:"100%",marginTop:8,padding:"12px 14px",border:`1px solid ${V.border}`,background:V.bgPanel}}>
                <div style={{fontSize:10,color:V.gold,fontFamily:SANS,fontWeight:600,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.1em"}}>
                  {ALL_TIME_LABELS[t0+pointIdx]||`PT ${pointIdx+1}`} · {activeLocs.map(l=>LOCATIONS[l.id]?.label).join(" / ")}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  {activeIds.slice(0,6).map((id,si)=>{
                    const def=SIGNAL_DEFS.find(d=>d.id===id);
                    const custom=customSignals.find(c=>c.id===id);
                    const label=def?.label||custom?.label||id;
                    const unit=def?.unit||custom?.unit||"";
                    const d=custom?custom.data:getSignalData(id,locId);
                    const v=d[t0+Math.min(pointIdx,d.length-1)];
                    const col=PALETTE[si%PALETTE.length];
                    return(
                      <div key={id} style={{textAlign:"center"}}>
                        <div style={{fontSize:10,color:col,fontFamily:SANS,fontWeight:600,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</div>
                        <div style={{fontSize:14,color:V.text,fontFamily:MONO}}>{v?.toFixed(1)}<span style={{fontSize:10,color:V.textFaint}}>{unit}</span></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center",padding:"12px 0 16px"}}>
              {perspective==="overlay"
                ?activeLocs.map(l=>(
                    <div key={l.id} style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:16,height:3,background:LOCATIONS[l.id].color}}/>
                      <span style={{fontSize:11,color:LOCATIONS[l.id].color,fontFamily:SANS,fontWeight:500}}>{LOCATIONS[l.id].flag} {LOCATIONS[l.id].label}</span>
                    </div>
                  ))
                :activeIds.map((id,si)=>{
                    const def=SIGNAL_DEFS.find(d=>d.id===id);
                    const custom=customSignals.find(c=>c.id===id);
                    const label=def?.label||custom?.label||id;
                    const col=PALETTE[si%PALETTE.length];
                    return(
                      <div key={id} style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:16,height:3,background:col}}/>
                        <span style={{fontSize:11,color:col,fontFamily:SANS,fontWeight:500}}>{label}</span>
                      </div>
                    );
                  })
              }
            </div>
          </div>

          {/* Right sidebar — signal list on desktop */}
          <div style={{padding:isDesktop?"24px":"16px",overflowY:"auto",borderTop:isDesktop?"none":`1px solid ${V.border}`}}>
            <SignalList/>
          </div>
        </div>
      )}

      {/* ── LATCH TAB ── */}
      {tab==="latch"&&(
        <div style={{padding:isDesktop?"24px 32px":"16px",display:"flex",flexDirection:"column",gap:20,maxWidth:isDesktop?900:"none",margin:"0 auto"}}>

          <div>
            <div style={{fontSize:10,letterSpacing:"0.15em",color:V.gold,fontFamily:SANS,fontWeight:700,textTransform:"uppercase",marginBottom:10}}>L — Location</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {Object.entries(LOCATIONS).map(([id,loc])=>{
                const active=locations.find(l=>l.id===id)?.active;
                return(
                  <button key={id} onClick={()=>toggleLocation(id)} style={{padding:"8px 14px",fontSize:12,background:active?hexToRgba(loc.color,0.15):"rgba(255,255,255,0.04)",border:`1px solid ${active?loc.color:V.border}`,color:active?loc.color:V.textDim,cursor:"pointer",fontFamily:SANS,fontWeight:active?600:400,transition:"background 150ms"}}>
                    {loc.flag} {loc.label}
                  </button>
                );
              })}
            </div>
            <div style={{fontSize:12,color:V.textFaint,fontFamily:MONO,marginTop:8,lineHeight:1.6}}>
              Switch to Array → By Location to see signals diverge across geographies.
            </div>
          </div>

          <div>
            <div style={{fontSize:10,letterSpacing:"0.15em",color:V.gold,fontFamily:SANS,fontWeight:700,textTransform:"uppercase",marginBottom:10}}>A — Alphabet Search</div>
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search signals by name or category..."
              style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${V.border}`,color:V.text,padding:"10px 14px",fontFamily:MONO,fontSize:13,boxSizing:"border-box",outline:"none"}}/>
          </div>

          <div>
            <div style={{fontSize:10,letterSpacing:"0.15em",color:V.gold,fontFamily:SANS,fontWeight:700,textTransform:"uppercase",marginBottom:10}}>T — Time Eras</div>
            <div style={{display:"grid",gridTemplateColumns:isDesktop?"repeat(4,1fr)":"1fr 1fr",gap:6}}>
              <button onClick={()=>setTimeRange([0,N])} style={{padding:"10px",fontSize:11,background:"rgba(255,255,255,0.05)",border:`1px solid ${V.border}`,color:V.textDim,cursor:"pointer",fontFamily:SANS,fontWeight:500,textAlign:"left"}}>
                All 2019–2024
              </button>
              {ERAS.map(e=>(
                <button key={e.label} onClick={()=>setTimeRange([e.start,e.end+1])} style={{padding:"10px",fontSize:11,background:e.color,border:`1px solid rgba(255,255,255,0.15)`,color:"rgba(255,255,255,0.9)",cursor:"pointer",fontFamily:SANS,fontWeight:500,textAlign:"left"}}>
                  <div style={{fontWeight:600}}>{e.label}</div>
                  <div style={{opacity:0.65,marginTop:2,fontSize:10,fontFamily:MONO}}>{ALL_TIME_LABELS[e.start].slice(-4)} – {ALL_TIME_LABELS[e.end].slice(-4)}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{fontSize:10,letterSpacing:"0.15em",color:V.gold,fontFamily:SANS,fontWeight:700,textTransform:"uppercase",marginBottom:10}}>C — Category</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {cats.map(c=>(
                <button key={c} onClick={()=>setCatFilter(c)} style={{padding:"6px 12px",fontSize:11,background:catFilter===c?V.gold:"rgba(255,255,255,0.04)",border:`1px solid ${catFilter===c?V.gold:V.border}`,color:catFilter===c?"#000":V.textDim,cursor:"pointer",fontFamily:SANS,fontWeight:catFilter===c?700:400,transition:"background 150ms"}}>{c}</button>
              ))}
            </div>
          </div>

          <div>
            <div style={{fontSize:10,letterSpacing:"0.15em",color:V.gold,fontFamily:SANS,fontWeight:700,textTransform:"uppercase",marginBottom:10}}>H — Hierarchy Sort</div>
            <div style={{display:"flex",gap:5}}>
              {[["category","By Category"],["harmony","By Harmony"],["alpha","Alphabetical"]].map(([id,lbl])=>(
                <button key={id} onClick={()=>setSortMode(id)} style={{flex:1,padding:"8px 6px",fontSize:11,background:sortMode===id?V.violet:"rgba(255,255,255,0.04)",border:`1px solid ${sortMode===id?V.violet:V.border}`,color:sortMode===id?"#fff":V.textDim,cursor:"pointer",fontFamily:SANS,fontWeight:sortMode===id?600:400,transition:"background 150ms"}}>{lbl}</button>
              ))}
            </div>
          </div>

          <SignalList/>
        </div>
      )}

      {/* ── HARMONICS TAB ── */}
      {tab==="harmonics"&&(
        <div style={{padding:isDesktop?"24px 32px":"16px",maxWidth:isDesktop?900:"none",margin:"0 auto"}}>
          <div style={{fontSize:10,letterSpacing:"0.15em",color:V.textDim,fontFamily:SANS,fontWeight:600,textTransform:"uppercase",marginBottom:16}}>Signal Relationships</div>
          {(()=>{
            const pairs=[];
            for(let i=0;i<activeIds.length;i++)for(let j=i+1;j<activeIds.length;j++){
              const da=getSignalData(activeIds[i],locId).slice(t0,t1);
              const db=getSignalData(activeIds[j],locId).slice(t0,t1);
              const r=pearson(da,db);pairs.push({a:activeIds[i],b:activeIds[j],r});
            }
            pairs.sort((a,b)=>Math.abs(b.r)-Math.abs(a.r));
            return pairs.map(({a,b,r})=>{
              const la=SIGNAL_DEFS.find(d=>d.id===a)?.label||a;
              const lb=SIGNAL_DEFS.find(d=>d.id===b)?.label||b;
              const ca=PALETTE[SIGNAL_DEFS.findIndex(d=>d.id===a)%PALETTE.length];
              const cb=PALETTE[SIGNAL_DEFS.findIndex(d=>d.id===b)%PALETTE.length];
              const hue=r>0?V.lime:V.red;
              const label=Math.abs(r)>0.7?"Strong":Math.abs(r)>0.4?"Moderate":"Weak";
              return(
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
                    <span style={{fontSize:10,color:hue,minWidth:80,fontFamily:SANS,fontWeight:600,textTransform:"uppercase"}}>{label} {r>0?"Sync":"Invert"}</span>
                  </div>
                </div>
              );
            });
          })()}
          {activeIds.length<2&&<div style={{fontSize:13,color:V.textFaint,fontFamily:MONO}}>Activate 2+ signals to see relationships.</div>}
        </div>
      )}

      {/* ── READ TAB ── */}
      {tab==="read"&&(
        <div style={{maxWidth:isDesktop?700:"none",margin:"0 auto"}}>
          <ReadPanel activeIds={activeIds} locations={locations} timeRange={timeRange} perspective={perspective} customSignals={customSignals} isDesktop={isDesktop}/>
        </div>
      )}

      {showAdd&&<AddModal onAdd={addCustom} onClose={()=>setShowAdd(false)} usedColors={Object.values(LOCATIONS).map(l=>l.color)}/>}
    </div>
  );
}
