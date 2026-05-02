# Signal Harmonics — Architecture

## Current State (April 2026)

Single-file React/JSX component. ~860 lines. Prototyped inside the Claude artifact sandbox. Source file: `dev/src/harmonic-latch.jsx` (to be committed — see note below). Transferring to Claude Code for real-environment development.

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| UI | React (functional components + hooks) | Single-file JSX component |
| Visualization | HTML5 Canvas (hand-drawn) | No external chart or viz libraries |
| Correlation | Pearson coefficient (custom implementation) | Applied pairwise across signal pairs |
| Fonts | Orbitron, Share Tech Mono | Google Fonts CDN |
| Data | Mock data (Phase 1) → real APIs (Phase 2+) | See `build-plan.md` |
| AI reading | Anthropic API (`claude-sonnet-4-6`) | READ THE SIGNALS feature — see `known-issues.md` |
| Hosting | TBD — likely Netlify or Vercel | Needs server-side proxy for API calls |

## Component Structure

Single default export with internal state via `useState` / `useEffect`. Key sections:

- **Data layer** — mock signal data, category definitions, region definitions
- **Correlation engine** — Pearson calculation applied to signal time-series pairs
- **Canvas renderer** — hand-drawn visualization of harmonic relationships
- **LATCH controls** — Location selector, time scrubber, category filter, sort toggle
- **Signal display** — per-signal readout with harmony score overlay
- **API bridge** — READ THE SIGNALS → Anthropic API call → intelligence briefing

## Data Model

```
Signal {
  id: string
  name: string
  category: Category
  region: Region
  timeSeries: Array<{ date: Date, value: number }>
  unit: string
  source: string  // Phase 2+
}

HarmonyScore {
  signal_a: Signal.id
  signal_b: Signal.id
  pearson: number  // -1.0 to 1.0
  computed_at: Date
}

Region = 'north-america' | 'europe' | 'asia-pacific' | 'latin-america' | 'middle-east-africa' | 'global'
Category = 'economy' | 'markets' | 'society' | 'environment' | 'digital' | 'crime'
```

## Source Files

Primary source: `dev/src/harmonic-latch.jsx`

**Note:** `harmonic-latch.jsx` was built in the Claude artifact sandbox in April 2026. It will be committed to `dev/src/` when Phase 1 work begins in Claude Code. The file does not yet exist in this repo.

## Environments

*To be defined once hosting is established (Phase 1).*

## Proxy Pattern

The READ THE SIGNALS feature requires a server-side proxy to hold the Anthropic API key. The same pattern was used in Weather Collage — see `../weather-collage/dev/my-proxy/functions/claude.js` as a reference implementation.
