// netlify/functions/claude.js
// Server-side proxy for Anthropic API — keeps API key off the client
// Pattern from weather-collage/dev/my-proxy/functions/claude.js

export async function handler(event) {

  const allowedOrigins = [
    "https://signal-harmonics.netlify.app",
    "https://www.signalharmonics.com",
    "https://signalharmonics.com",
    "http://localhost:3000",
    "http://localhost:5173",
  ];
  const requestOrigin = event.headers.origin || "";
  const allowedOrigin = allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0];

  const headers = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: body.model || "claude-sonnet-4-6",
        max_tokens: body.max_tokens || 1024,
        messages: body.messages,
      }),
    });

    const data = await response.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (err) {
    console.error("Signal Harmonics proxy error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Proxy failed", detail: err.message }),
    };
  }
}
