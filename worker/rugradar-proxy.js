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

// v7.10 (B4) — simple per-IP rate limit, generous on purpose: a judge
// doing several scans in a row (~20 RPC calls per scan) never hits it;
// only abuse loops do. Best-effort per isolate (Workers run many
// isolates, so a determined abuser could spread across them — the
// allowlist above is the real protection, this just stops naive loops).
// 120 requests per rolling 60s window, per client IP. The limit number
// itself is frozen (H2's client-side fix is separate work) — do not change.
// v7.13 (M15) — the bucket map is now pruned: idle-IP buckets are swept
// out once a minute and the map is hard-capped (oldest evicted first),
// so entries can no longer grow unboundedly. Still no KV / Durable
// Objects — pruning is the accepted fix for this scope.
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 60_000;
const MAX_BUCKETS = 10_000;
const rateBuckets = new Map(); // ip -> number[] (request timestamps)
let lastSweep = 0;

function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function rateLimited(ip) {
  const now = Date.now();
  // M15: periodic sweep — drop buckets whose newest request is older
  // than the window, so idle IPs never accumulate.
  if (now - lastSweep >= RATE_WINDOW_MS) {
    lastSweep = now;
    for (const [key, bucket] of rateBuckets) {
      if (bucket.length === 0 || now - bucket[bucket.length - 1] >= RATE_WINDOW_MS) {
        rateBuckets.delete(key);
      }
    }
  }
  const bucket = rateBuckets.get(ip) ?? [];
  const fresh = bucket.filter((ts) => now - ts < RATE_WINDOW_MS);
  if (fresh.length >= RATE_LIMIT) {
    rateBuckets.set(ip, fresh);
    return true;
  }
  fresh.push(now);
  rateBuckets.set(ip, fresh);
  // M15: hard cap on map size — evict oldest-inserted IPs first
  // (Map preserves insertion order; re-setting an existing key does not
  // move it, so this evicts the stalest buckets).
  while (rateBuckets.size > MAX_BUCKETS) {
    const oldest = rateBuckets.keys().next().value;
    if (oldest === undefined) break;
    rateBuckets.delete(oldest);
  }
  return false;
}

// v7.13 (L14) — params are validated/clamped per method before
// forwarding: the app's real call sites (src/lib/scanner.ts) send only
// the shapes below, so anything outside them is clamped to the app's
// maxima where the call stays meaningful, or rejected as nonsense.
// The forwarded body is rebuilt from the clamped params — the raw
// request body is never forwarded verbatim.
const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]+$/;
const COMMITMENTS = new Set(["processed", "confirmed", "finalized"]);

function isAddress(v) {
  return typeof v === "string" && v.length >= 32 && v.length <= 44 && BASE58_RE.test(v);
}

function isSignature(v) {
  return typeof v === "string" && v.length >= 64 && v.length <= 88 && BASE58_RE.test(v);
}

function clampParams(method, params) {
  const fail = (msg) => ({ ok: false, error: `RugRadar proxy: invalid params: ${msg}` });
  if (!Array.isArray(params) || params.length < 1 || params.length > 2) {
    return fail("expected 1 or 2 params");
  }
  const [first, rawOpts] = params;
  let opts = {};
  if (rawOpts !== undefined) {
    if (typeof rawOpts !== "object" || rawOpts === null || Array.isArray(rawOpts)) {
      return fail("options must be an object");
    }
    opts = rawOpts;
  }
  // The app only ever sends 'confirmed'; accept the standard set,
  // reject anything else.
  let commitment = "confirmed";
  if (opts.commitment !== undefined) {
    if (typeof opts.commitment !== "string" || !COMMITMENTS.has(opts.commitment)) {
      return fail("bad commitment");
    }
    commitment = opts.commitment;
  }

  switch (method) {
    case "getAccountInfo": {
      if (!isAddress(first)) return fail("bad address");
      // App sends jsonParsed (mint reads) or base64 (raw reads) only.
      const encoding = opts.encoding ?? "jsonParsed";
      if (encoding !== "jsonParsed" && encoding !== "base64") return fail("bad encoding");
      // dataSlice / minContextSlot are never sent by the app — dropped.
      return { ok: true, params: [first, { encoding, commitment }] };
    }
    case "getTokenLargestAccounts": {
      if (!isAddress(first)) return fail("bad mint address");
      return { ok: true, params: [first, { commitment }] };
    }
    case "getSignaturesForAddress": {
      if (!isAddress(first)) return fail("bad address");
      // App sends limit 10 or 100; clamp to 100 max.
      let limit = 100;
      if (opts.limit !== undefined) {
        if (typeof opts.limit !== "number" || !Number.isFinite(opts.limit)) {
          return fail("bad limit");
        }
        limit = Math.min(Math.max(Math.floor(opts.limit), 1), 100);
      }
      const out = { limit, commitment };
      if (opts.before !== undefined) {
        if (!isSignature(opts.before)) return fail("bad before signature");
        out.before = opts.before;
      }
      // until / minContextSlot never sent by the app — dropped.
      return { ok: true, params: [first, out] };
    }
    case "getTransaction": {
      if (!isSignature(first)) return fail("bad signature");
      const encoding = opts.encoding ?? "jsonParsed";
      if (encoding !== "jsonParsed") return fail("bad encoding");
      // App sends maxSupportedTransactionVersion 1; clamp to 0-1.
      let maxVer = 1;
      if (opts.maxSupportedTransactionVersion !== undefined) {
        const v = opts.maxSupportedTransactionVersion;
        if (typeof v !== "number" || !Number.isInteger(v)) {
          return fail("bad maxSupportedTransactionVersion");
        }
        maxVer = Math.min(Math.max(v, 0), 1);
      }
      return {
        ok: true,
        params: [first, { encoding, commitment, maxSupportedTransactionVersion: maxVer }],
      };
    }
    case "getTokenSupply": {
      if (!isAddress(first)) return fail("bad mint address");
      return { ok: true, params: [first, { commitment }] };
    }
    default:
      return fail("unknown method");
  }
}

// v7.13 (M14) — Jupiter quote: only the params the app actually sends
// (inputMint, outputMint, amount, slippageBps) are accepted; anything
// else is rejected. Values are validated (base58 mints, u64 amount,
// 0-10000 slippageBps) and the query string is rebuilt from the clean
// values — the raw query string is never passed through untouched.
const JUPITER_PARAMS = ["inputMint", "outputMint", "amount", "slippageBps"];
const U64_MAX = 18446744073709551615n;

function validJupiterQuery(searchParams) {
  for (const key of searchParams.keys()) {
    if (!JUPITER_PARAMS.includes(key)) return `unknown query param: ${key}`;
  }
  for (const key of JUPITER_PARAMS) {
    if (searchParams.getAll(key).length > 1) return `duplicate query param: ${key}`;
  }
  const inputMint = searchParams.get("inputMint");
  const outputMint = searchParams.get("outputMint");
  const amount = searchParams.get("amount");
  const slippageBps = searchParams.get("slippageBps");
  if (!inputMint || !isAddress(inputMint)) return "bad inputMint";
  if (!outputMint || !isAddress(outputMint)) return "bad outputMint";
  if (!amount || !/^[0-9]+$/.test(amount)) return "bad amount";
  let amt;
  try {
    amt = BigInt(amount);
  } catch {
    return "bad amount";
  }
  if (amt < 1n || amt > U64_MAX) return "amount out of range";
  if (slippageBps !== null) {
    if (!/^[0-9]+$/.test(slippageBps)) return "bad slippageBps";
    const bps = Number(slippageBps);
    if (!Number.isInteger(bps) || bps < 0 || bps > 10000) return "bad slippageBps";
  }
  return null;
}

// v7.13 (M14) — response-size caps. The BONK RugCheck report is ~2.5 MB
// legitimately, so its cap sits above that; Jupiter quotes are a few KB.
// The stream is aborted as soon as the cap is exceeded, so an oversized
// upstream body is never buffered or relayed in full.
const RUGCHECK_MAX_BYTES = 5 * 1024 * 1024;
const JUPITER_MAX_BYTES = 1 * 1024 * 1024;

async function fetchCapped(url, maxBytes) {
  const res = await fetch(url);
  if (!res.body) {
    return new Response(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return json({ error: "RugRadar proxy: upstream response too large" }, 502);
      }
      chunks.push(value);
    }
  } catch {
    return json({ error: "RugRadar proxy: upstream read failed" }, 502);
  }
  const buf = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    buf.set(c, off);
    off += c.byteLength;
  }
  return new Response(buf, {
    status: res.status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
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
    const ip = clientIp(request);

    // POST /rpc -> Helius mainnet RPC
    if (url.pathname === "/rpc" && request.method === "POST") {
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
      // L14: validate/clamp params, then forward the REBUILT body —
      // never the raw request body.
      const clamped = clampParams(parsed.method, parsed.params);
      if (!clamped.ok) {
        return json({ error: clamped.error }, 400);
      }
      const id =
        typeof parsed.id === "string" || typeof parsed.id === "number" ? parsed.id : 1;
      const forwarded = JSON.stringify({
        jsonrpc: typeof parsed.jsonrpc === "string" ? parsed.jsonrpc : "2.0",
        id,
        method: parsed.method,
        params: clamped.params,
      });
      const res = await fetch(
        `https://mainnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: forwarded,
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
      // M14: same per-IP rate limit as /rpc + response-size cap.
      if (rateLimited(ip)) {
        return json({ error: "RugRadar proxy: rate limit exceeded, try again shortly" }, 429);
      }
      return fetchCapped(
        `https://api.rugcheck.xyz/v1/tokens/${rc[1]}/report`,
        RUGCHECK_MAX_BYTES
      );
    }

    // GET /jupiter/quote?... -> Jupiter Swap API V1 lite (sellability check).
    // (The old v6 Quote API is sunset/dead; V1 lite is its replacement —
    // the response is a top-level quote object, no data wrapper.)
    if (url.pathname === "/jupiter/quote" && request.method === "GET") {
      // M14: same per-IP rate limit as /rpc, allowlisted + validated
      // query string, and a response-size cap.
      if (rateLimited(ip)) {
        return json({ error: "RugRadar proxy: rate limit exceeded, try again shortly" }, 429);
      }
      const badQuery = validJupiterQuery(url.searchParams);
      if (badQuery) {
        return json({ error: `RugRadar proxy: invalid Jupiter query: ${badQuery}` }, 400);
      }
      const q = url.searchParams;
      const cleanQuery =
        `inputMint=${encodeURIComponent(q.get("inputMint"))}` +
        `&outputMint=${encodeURIComponent(q.get("outputMint"))}` +
        `&amount=${encodeURIComponent(q.get("amount"))}` +
        (q.get("slippageBps") !== null
          ? `&slippageBps=${encodeURIComponent(q.get("slippageBps"))}`
          : "");
      return fetchCapped(
        `https://lite-api.jup.ag/swap/v1/quote?${cleanQuery}`,
        JUPITER_MAX_BYTES
      );
    }

    return json({ error: "RugRadar proxy: unknown route" }, 404);
  },
};
