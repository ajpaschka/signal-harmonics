# Signal Harmonics — Changelog

---

## April 2026 · Initial build · Artifact prototype

**Context:** Prototyped as a single-file React/JSX component (~860 lines) inside the Claude artifact sandbox. First working version of the harmonic visualization and LATCH interface.

**What's in:**
- Full LATCH interface: Location (6 regions), Time (scrubber + era quick-select), Category filter (6 domains), Hierarchy sort (category / harmony / alpha)
- Pearson correlation engine for cross-signal harmony scoring
- Hand-drawn Canvas visualization of harmonic relationships
- Signal display with per-signal readout and harmony score overlay
- READ THE SIGNALS — Anthropic API call → intelligence briefing (works in artifact sandbox; blocked in real deployment — see `known-issues.md`)
- CRT/sci-fi aesthetic: scanline texture, phosphor glow, Versace SS25/FW24 color palette, Orbitron + Share Tech Mono
- Mobile-first layout, max-width 540px
- Mock data for all six signal categories and six regions

**Not yet in:**
- Server-side API proxy (Phase 1 blocker)
- Real data sources (Phase 2)
- GPS / location detection (Phase 3)

**Source file:** `dev/src/harmonic-latch.jsx` — to be committed at Phase 1 start

---

---

## April 2026 · Phase 1 scaffold complete · Pre-deploy

**Context:** Transferred from artifact sandbox to real Vite/Netlify environment. All Phase 1 code is in place. Awaiting `netlify deploy --prod` and API key set in Netlify dashboard.

**What's in:**
- Vite scaffold: `index.html`, `vite.config.js`, `package.json`, `src/main.jsx`
- `src/harmonic-latch.jsx` committed — the full artifact prototype (~860 lines)
- Netlify function: `netlify/functions/claude.js` — proxy pattern from Weather Collage
- `netlify.toml` — build command, publish dir, functions dir all set
- `dist/` built — `npm run build` has been run, output is ready
- Netlify site registered — siteId `4bc179c7-dc34-4215-b9cb-6dd1db4018eb` in `.netlify/state.json`
- `ANTHROPIC_API_KEY` in `.env` for local reference (gitignored — must be set in Netlify dashboard)

**FSM SKILL violations fixed (2026-04-28):**
- All table insets reduced to y: 6pt max per SKILL overflow rules
- v(sp-lg) before tables replaced with v(sp-sm) across Leon and FavaJava

**To deploy:**
```bash
cd "/Users/alexanderpaschka/Claude Code/AJAI/signal-harmonics/dev"
netlify deploy --prod
```
Then set `ANTHROPIC_API_KEY` in Netlify dashboard → Site settings → Environment variables.

**Local dev:**
Use `netlify dev` (not `npm run dev`) to get Netlify functions available at `/.netlify/functions/claude`.

<!-- Log new versions below this line -->
