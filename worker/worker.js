// Signal Harmonics — Cloudflare Worker proxy
// Keeps ANTHROPIC_API_KEY off the client and out of the GitHub repo.
// Deploy: wrangler deploy worker/worker.js --name signal-harmonics-proxy
// Secret: wrangler secret put ANTHROPIC_API_KEY

const ALLOWED_ORIGINS = [
  "https://signalharmonics.paschkastudio.com",
  "http://localhost:3000",
  "http://localhost:5173",
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    // Allow GitHub Pages origin dynamically (any *.github.io subdomain)
    const allowed =
      ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".github.io");

    const corsHeaders = {
      "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Content-Type": "application/json",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: body.model || "claude-haiku-4-5-20251001",
          max_tokens: body.max_tokens || 1000,
          messages: body.messages,
        }),
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });

    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Proxy failed", detail: err.message }),
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
