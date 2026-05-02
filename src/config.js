// API endpoint for the Anthropic proxy.
// Set VITE_API_URL as a GitHub Actions secret — it gets baked in at build time.
// After deploying the Cloudflare Worker, paste its URL into the repo secret.
export const API_URL = import.meta.env.VITE_API_URL || "";
