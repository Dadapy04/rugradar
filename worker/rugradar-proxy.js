// RugRadar proxy — Cloudflare Worker (free tier)
// Menyembunyikan Helius API key + proxy RugCheck, supaya key tidak lagi
// tertanam di bundle publik dan scanner tidak kena CORS/rate-limit langsung.
// Secret yang harus diisi di dashboard: HELIUS_API_KEY
// Routes:
//   POST /rpc            -> Helius mainnet RPC (key disembunyikan server-side)
//   GET  /rugcheck/<mint> -> RugCheck report (insider networks)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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
      const res = await fetch(
        `https://mainnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: await request.text(),
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

    return json({ error: "RugRadar proxy: unknown route" }, 404);
  },
};
