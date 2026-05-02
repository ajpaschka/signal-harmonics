# Signal Harmonics — Known Issues

Log bugs and friction points here before fixing them. Check this before every dev session.

Format: date logged · description · priority (high / medium / low) · status (open / in progress / fixed)

---

## 2026-04-06 · Anthropic API call fails outside artifact sandbox · HIGH · FIXED

**Description:** The READ THE SIGNALS feature calls the Anthropic API client-side. This works inside the Claude artifact sandbox (which provides native API access) but will not work in a real deployed environment — browser-based API calls expose the API key and are blocked by CORS in most deployment contexts.

**Root cause:** The component was prototyped in an artifact, where API access is provided transparently by the sandbox environment. Real deployment requires a server-side proxy to hold the API key and relay calls to the Anthropic API.

**Resolution path:** Phase 1 task — create a server-side Netlify function (or equivalent) that accepts the current harmonic state payload, calls the Anthropic API, and returns the briefing response. Reference implementation: `../weather-collage/dev/my-proxy/functions/claude.js`.

**Resolution applied 2026-04-06:** Redirected fetch in `harmonic-latch.jsx` from `https://api.anthropic.com/v1/messages` to `/.netlify/functions/claude`. Netlify function created at `netlify/functions/claude.js` using Weather Collage proxy as reference. `ANTHROPIC_API_KEY` must be set as an environment variable in Netlify dashboard before deploy.

**Blocked:** No — proxy is in place. Needs `npm install`, deploy to Netlify, and API key set in dashboard.

---

<!-- Add new issues below this line -->
