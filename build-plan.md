# Signal Harmonics — Build Plan

---

## Phase 1: Fix / Run
**Goal:** Get the existing component running in a real environment outside the artifact sandbox.

### Tasks
- [ ] Commit `harmonic-latch.jsx` to `dev/src/`
- [ ] Set up project scaffold (Vite — preferred for single-component React builds)
- [ ] Resolve any artifact-sandbox-specific code
- [ ] Create server-side API route for Anthropic API calls (Netlify function or Express endpoint)
- [ ] Test READ THE SIGNALS end-to-end in real environment
- [ ] Deploy to staging URL

### Success Criteria
The component runs locally and on a staging URL. READ THE SIGNALS returns a live Anthropic API response. The harmonic visualization renders correctly on mobile.

### Reference
The proxy pattern is already solved in Weather Collage — see `../weather-collage/dev/my-proxy/functions/claude.js`.

---

## Phase 2: Real Data
**Goal:** Replace mock signal data with live data sources.

### Tasks
- [ ] Identify and connect data APIs for each category (Economy, Markets, Society, Environment, Digital, Crime)
- [ ] Build a data normalization layer — each source maps to the Signal data model
- [ ] Implement caching / refresh strategy — signals don't need real-time, but should be < 24h stale
- [ ] Wire region filter to actual geographic data from each source
- [ ] Test Pearson correlation on real data — validate that meaningful harmonics surface

### Success Criteria
All six signal categories populated with real data. Harmony scores reflect actual cross-domain correlations. At least one genuinely interesting harmonic surfaces on first load.

---

## Phase 3: Location Intelligence
**Goal:** Make location a first-class input — GPS, local signal sources, regional specificity.

### Tasks
- [ ] Implement GPS / browser location detection
- [ ] Map detected location to the six-region model
- [ ] Identify local-level signal sources where available (city/state crime data, local weather, regional economic indicators)
- [ ] Personalize the opening view to the user's detected region
- [ ] Handle location permission denied gracefully — default to Global

### Success Criteria
Opening the app in Grand Rapids shows signals specific to North America, with local signal sources where available. Opening it in Berlin shows European signals. The instrument knows where you are.

---

## Phase 4: Extended Features
**Goal:** Deepen the instrument — saved views, alerts, history, deeper interpretation.

### Candidates
- Saved harmonic views (named, shareable)
- Harmony alerts — notify when a signal pair crosses a threshold
- Historical comparison — overlay current harmonics against a selected past period
- Deeper READ THE SIGNALS — multi-turn context, longer briefings, domain-specific interpretation
- Export — harmonic snapshot as image or shareable report

### Decision Point
Phase 4 is a menu, not a plan. Prioritize after Phase 2/3 reveals what people actually use.

---

## Context

The component was built in April 2026 inside the Claude artifact sandbox. It runs and renders correctly in that environment. The primary blocker to Phase 1 is the Anthropic API route — client-side API calls don't work in real deployment. That's the first thing Phase 1 resolves. See `known-issues.md` for the full bug description.
