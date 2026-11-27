// RugRadar proxy — Cloudflare Worker (free tier)
// Menyembunyikan Helius API key + proxy RugCheck, supaya key tidak lagi
// tertanam di bundle publik dan scanner tidak kena CORS/rate-limit langsung.
// Secret yang harus diisi di dashboard: HELIUS_API_KEY
// Routes:
//   POST /rpc            -> Helius mainnet RPC (key disembunyikan server-side)
//   GET  /rugcheck/<mint> -> RugCheck report (insider networks)
//   GET  /jupiter/quote?... -> Jupiter Swap API V1 lite (sellability check)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// v7.10 (B4) — the /rpc route used to forward ANY JSON-RPC method to
// Helius with the key, so anyone who found the Worker URL could burn
// the free-tier credits (e.g. getProgramAccounts loops) and take the
// scanner down. Only the methods the app actually uses are allowed.
const ALLOWED_RPC_METHODS = new Set([
  "getAccountInfo",
  "getTokenLargestAccounts",
  "getSignaturesForAddress",
  "getTransaction",
  "getTokenSupply",
]);

// v7.10 (B4) — simple per-IP rate limit for /rpc, generous on purpose:
// a judge doing several scans in a row (~20 RPC calls per scan) never
// hits it; only abuse loops do. Best-effort per isolate (Workers run
// many isolates, so a determined abuser could spread across them — the
// allowlist above is the real protection, this just stops naive loops).
// 120 requests per rolling 60s window, per client IP.
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 60_000;
const rateBuckets = new Map(); // ip -> number[] (request timestamps)

function rateLimited(ip) {
  const now = Date.now();
  const bucket = rateBuckets.get(ip) ?? [];
  const fresh = bucket.filter((ts) => now - ts < RATE_WINDOW_MS);
  if (fresh.length >= RATE_LIMIT) {
    rateBuckets.set(ip, fresh);
    return true;
  }
  fresh.push(now);
  rateBuckets.set(ip, fresh);
  return false;
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    // POST /rpc -> Helius mainnet RPC
    if (url.pathname === "/rpc" && request.method === "POST") {
      const ip =
        request.headers.get("CF-Connecting-IP") ||
        request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
        "unknown";
      if (rateLimited(ip)) {
        return json({ error: "RugRadar proxy: rate limit exceeded, try again shortly" }, 429);
      }
      const bodyText = await request.text();
      let parsed;
      try {
        parsed = JSON.parse(bodyText);
      } catch {
        return json({ error: "RugRadar proxy: invalid JSON-RPC body" }, 400);
      }
      // The app never sends batch requests — a JSON array is not a
      // single method call, reject it rather than forwarding blindly.
      if (Array.isArray(parsed) || typeof parsed !== "object" || parsed === null) {
        return json({ error: "RugRadar proxy: expected a single JSON-RPC object" }, 400);
      }
      if (!ALLOWED_RPC_METHODS.has(parsed.method)) {
        return json({ error: `RugRadar proxy: RPC method not allowed: ${parsed.method}` }, 403);
      }
      const res = await fetch(
        `https://mainnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: bodyText,
        }
      );
      return new Response(await res.text(), {
        status: res.status,
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    // GET /rugcheck/<mint> -> RugCheck report
    const rc = url.pathname.match(/^\/rugcheck\/([A-Za-z0-9]{32,44})$/);
    if (rc && request.method === "GET") {
      const res = await fetch(
        `https://api.rugcheck.xyz/v1/tokens/${rc[1]}/report`
      );
      return new Response(await res.text(), {
        status: res.status,
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    // GET /jupiter/quote?... -> Jupiter Swap API V1 lite (sellability check).
    // Query string passed through untouched; the browser calls the Worker
    // instead of lite-api.jup.ag directly to avoid CORS/timeouts.
    // (The old v6 Quote API is sunset/dead; V1 lite is its replacement —
    // the response is a top-level quote object, no data wrapper.)
    if (url.pathname === "/jupiter/quote" && request.method === "GET") {
      const res = await fetch(
        `https://lite-api.jup.ag/swap/v1/quote${url.search}`
      );
      return new Response(await res.text(), {
        status: res.status,
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    return json({ error: "RugRadar proxy: unknown route" }, 404);
  },
};
