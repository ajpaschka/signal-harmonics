# SIGNAL HARMONICS

**A cross-domain signal correlation instrument.**

Reads Pearson correlations between economy, markets, environment, society, and crime — and surfaces the patterns they form together. Not a dashboard. Not a data visualization tool. An instrument for reading the world.

Live at [signalharmonics.paschkastudio.com](https://signalharmonics.paschkastudio.com)

---

## What It Does

Signal Harmonics treats global data domains as oscilloscope channels. When two channels are active, it calculates their Pearson correlation coefficient and renders the relationship as a radial waveform. The center orb reflects the overall harmony score across all active signals. The **READ THE SIGNALS** trigger sends the current signal state to Claude for AI interpretation and historical pattern matching.

The interface is organized by [LATCH](https://www.wurman.com/) — Richard Saul Wurman's five axes of information architecture:

| Axis | Control |
|------|---------|
| **L**ocation | Region selector (Global, USA, Europe, China, India, Brazil) |
| **A**lphabet | Signal search |
| **T**ime | Era scrubber (Pre-COVID → New Normal) |
| **C**ategory | Signal category filter |
| **H**ierarchy | Sort by harmony score, category, or alphabet |

---

## Stack

- **React 18** + **Vite 5** — no framework overhead
- **HTML Canvas** — all visualization is hand-drawn, no chart libraries
- **Cloudflare Workers** — serverless proxy keeps the Anthropic API key off the client
- **GitHub Pages** — static hosting via GitHub Actions
- **Claude (Haiku)** — AI signal interpretation via Anthropic API

---

## Data

Current version uses a curated static dataset: 16 signals × 6 regions × 72 months (2019–2024). Live data integration is in progress.

| Channel | Signals | Source (roadmap) |
|---------|---------|-----------------|
| Economy | GDP, Inflation, Unemployment, Sentiment | FRED API |
| Markets | S&P 500, Oil Price | Finnhub |
| Society | Social Mood, Polarization, Wellbeing | FRED proxy |
| Environment | Temp Anomaly | Open-Meteo |
| Digital | Internet Index, Cybercrime | Cloudflare Radar |
| Crime | Violent, Property, Drug, Homicide | FBI UCR |

---

## Deploy Your Own

Fork this repo. Then:

### 1. Deploy the Cloudflare Worker

```bash
npm install -g wrangler
wrangler login
cd worker
wrangler deploy
wrangler secret put ANTHROPIC_API_KEY
```

Copy the Worker URL Cloudflare gives you — you'll need it in the next step.

### 2. Add the Worker URL to GitHub

In your forked repo: **Settings → Secrets and variables → Actions → New repository secret**

- Name: `VITE_API_URL`
- Value: your Worker URL

### 3. Enable GitHub Pages

In your forked repo: **Settings → Pages → Source → GitHub Actions**

Push any commit to `main`. The Actions workflow builds and deploys automatically.

### 4. Custom domain (optional)

In your DNS provider, add a CNAME record pointing your subdomain to `YOUR-USERNAME.github.io`. Then set the custom domain in **Settings → Pages → Custom domain**.

Update the allowed origins in `worker/worker.js` to include your domain.

---

## Built By

[Alexander Paschka](https://paschkastudio.com) / [Paschka Studio](https://paschkastudio.com) — Grand Rapids, MI

---

## License

MIT
