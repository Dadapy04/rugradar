// RugRadar — core scanning logic (framework-free, used by the React UI and the CLI test script).
// All data sources are public and read-only: Solana mainnet RPC + DexScreener public API
// + Jupiter Swap API V1 lite (sellability check). No secrets, no on-chain program.
//
// v7.7: all Solana RPC reads go through the Cloudflare Workers proxy
// (POST <proxy>/rpc), which forwards to Helius with the API key held
// server-side as a Worker secret — the public bundle contains no key.
// The proxy is tried FIRST; the free public RPCs remain as fallbacks
// (they rate-limit or block getTokenLargestAccounts, so without the proxy
// the holder check degrades honestly to "data unavailable").

import { PublicKey } from '@solana/web3.js';
import { STRINGS, type Lang } from './i18n';

// Public RPC endpoints, tried in order. The first one that answers wins.
// Note: getTokenLargestAccounts is rate-limited (429) on the mainnet-beta
// public endpoint and blocked on publicnode's free tier, so extra fallbacks
// matter for the holder-concentration check.
export const RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana.publicnode.com',
  'https://ssc-dao.genesysgo.net',
];

const SOL_MINT = 'So11111111111111111111111111111111111111112';

/** Cloudflare Workers proxy (v7.7): all Solana RPC reads go through
 *  POST <proxy>/rpc, which forwards to Helius with the API key held
 *  server-side as a Worker secret. The public bundle contains no key,
 *  so there is no build-time secret to configure anymore. */
export const PROXY_URL = 'https://rugradar-proxy.dadapy04.workers.dev';
const PROXY_RPC = `${PROXY_URL}/rpc`;

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'info' | 'na';
export type Verdict = 'Aman' | 'Waspada' | 'Berisiko Tinggi';

export interface CheckResult {
  id: string;
  title: string;
  status: CheckStatus;
  score: number;
  maxScore: number;
  /** false for informational checks that do not count toward the 100-point total. */
  scored: boolean;
  /** Short reason for lost points (scored checks only); null when nothing was lost. */
  lostReason: string | null;
  /** Optional display override for the "score/maxScore pts" line — used
   *  by the Token-2022 check, whose mechanism is a penalty subtracted
   *  from the 100-point total, not a 35-point sub-score ("35/35 pts"
   *  would wrongly suggest the checks add up to 135). */
  scoreLabel?: string | null;
  detail: string;
  explanation: string;
}

export interface TopHolder {
  address: string;
  amount: number; // raw units
  sharePct: number; // % of total supply
}

export interface ScanResult {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: number; // human-readable (already divided by 10^decimals)
  priceUsd: number | null;
  marketCapUsd: number | null;
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  priceChange24hPct: number | null;
  txns24hBuys: number | null;
  txns24hSells: number | null;
  pairAgeDays: number | null;
  top10SharePct: number | null;
  top1SharePct: number | null;
  topHolders: TopHolder[] | null;
  /** Top-10 holder addresses + shares (same source as topHolders, which
   *  keeps only the top 5 for display) — v7.12 feeds the fresh-wallet
   *  check (wallet age of each of the 10 largest holders). */
  top10Holders: TopHolder[] | null;
  /** True when the holder-concentration data could not be read (RPC failure)
   *  — the holder check then scores a neutral 15/30 and the total score is
   *  capped at 79, so the verdict can never be Safe on unverified data. */
  holdersUnavailable: boolean;
  /** True when the launch looks coordinated (v7.6 bundle heuristic: ≥4
   *  wallets bought in the launch slot with a combined >15% of supply) —
   *  the total score is capped at 79, same guardrail as unverified data. */
  bundleSuspected: boolean;
  /** True when the liquidity-pool vault account was identified and excluded
   *  from the top-10 holder calculation. */
  poolVaultExcluded: boolean;
  /** Which account types were actually found among the largest accounts
   *  and excluded from the top-10 calculation (pool vault / burn address /
   *  verified exchange wallets) — shown under the holder check. */
  excludedKinds: { pool: boolean; burn: boolean; exchange: boolean };
  /** Token logo URL from the Metaplex metadata URI (null when unavailable —
   *  the UI shows a letter avatar instead). Never blocks the scan. */
  logoUrl: string | null;
  /** The address the user pasted, when it turned out to be a pair/pool
   *  address that was resolved to this base token mint (null otherwise). */
  resolvedFromPair: string | null;
  /** True when the top pair is a launchpad bonding curve (Pump.fun /
   *  Moonshot) — the token has no traditional LP yet. */
  isBondingCurve: boolean;
  /** Liquidity as a percentage of market cap (null when either is
   *  unknown) — the thin-liquidity signal for the market-context card. */
  liquidityRatioPct: number | null;
  /** Aggregate liquidity (USD) summed across ALL DexScreener pairs for
   *  this mint — display-only for the market card. The scored liquidity
   *  check still uses the single top pair (liquidityUsd). */
  totalLiquidityUsd: number | null;
  /** Aggregate 24h volume (USD) summed across ALL DexScreener pairs —
   *  display-only for the market card. */
  totalVolume24hUsd: number | null;
  /** Liquidity as a percentage of market cap using the AGGREGATE
   *  liquidity — the ratio shown in the market card (null when either
   *  is unknown; falls back to liquidityRatioPct). */
  totalLiquidityRatioPct: number | null;
  mintAuthorityRevoked: boolean | null;
  freezeAuthorityRevoked: boolean | null;
  sellable: boolean | null; // Jupiter route to SOL found? null = check unavailable
  /** Dangerous Token-2022 extensions present on this mint, as
   *  language-independent ids (used by the plain-language risk summary —
   *  never parse the localized check text). Empty for standard SPL mints. */
  token2022Found: Token2022ExtensionId[];
  /** LP burn probe numbers (null when the LP check did not apply or could
   *  not be read): % of LP supply burned + largest LP holder's share. */
  lpBurnedPct: number | null;
  lpTop1Pct: number | null;
  /** Metaplex metadata mutability (null when no metadata account could be
   *  read). True = dev can still change name/symbol/URI. */
  metadataMutable: boolean | null;
  score: number; // 0-100, higher = safer
  verdict: Verdict;
  checks: CheckResult[];
  scannedAt: string;
  rpcUsed: string;
  pairUrl: string | null;
}

export interface DexPair {
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  priceUsd?: string;
  priceChange?: { h24?: number };
  txns?: { h24?: { buys?: number; sells?: number } };
  marketCap?: number;
  fdv?: number;
  pairCreatedAt?: number;
  dexId?: string;
  pairAddress?: string;
  url?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  quoteToken?: { address?: string; name?: string; symbol?: string };
  /** DexScreener token info — imageUrl is the second logo source when the
   *  Metaplex metadata image is missing or fails (e.g. POPCAT). */
  info?: { imageUrl?: string };
}

/** Fetch the best-liquidity DexScreener pair for a mint, plus the
 *  AGGREGATE liquidity and 24h volume summed across ALL pairs the API
 *  returns for the mint. The aggregates are display-only (market card);
 *  the scored liquidity check still uses the single top pair.
 *  Returns pair null when no usable pair is known (the aggregates may
 *  still be set — they are computed from the raw pair list). */
export async function fetchDexPair(mint: string): Promise<{
  pair: DexPair | null;
  totalLiquidityUsd: number | null;
  totalVolume24hUsd: number | null;
}> {
  // v7.10 (B1) — this was the only unbounded network call in the scan
  // path: if DexScreener hangs, the scan spinner ran forever. Abort at
  // 8s; the caller treats the throw as dexError (liquidity WARN).
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8_000);
  let res: Response;
  try {
    res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, {
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`DexScreener HTTP ${res.status}`);
  const json = (await res.json()) as { pairs?: DexPair[] };
  const allPairs = json.pairs ?? [];
  let totalLiquidityUsd = 0;
  let totalVolume24hUsd = 0;
  let hasLiquidity = false;
  let hasVolume = false;
  for (const p of allPairs) {
    if (p.liquidity?.usd != null) {
      totalLiquidityUsd += p.liquidity.usd;
      hasLiquidity = true;
    }
    if (p.volume?.h24 != null) {
      totalVolume24hUsd += p.volume.h24;
      hasVolume = true;
    }
  }
  const totals = {
    totalLiquidityUsd: hasLiquidity ? totalLiquidityUsd : null,
    totalVolume24hUsd: hasVolume ? totalVolume24hUsd : null,
  };
  // Bonding-curve pairs (Pump.fun / Moonshot) report NO liquidity.usd —
  // the curve holds SOL, not a USD-quoted pool — so they must NOT be
  // filtered out here, or the bonding-curve label can never fire (a real
  // pump.fun token's only pair has liquidity: null). Keep them; they
  // sort as 0 liquidity below any real pool.
  const pairs = allPairs.filter(
    (p) => p.liquidity?.usd != null || BONDING_CURVE_DEX_IDS.has(p.dexId ?? ''),
  );
  if (pairs.length === 0) return { pair: null, ...totals };
  pairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
  // v7.10 (B7) — prefer a pair where the scanned token is the BASE
  // token. /tokens/{mint} also returns pairs where the token is the
  // QUOTE side; taking the deepest of those would read the OTHER token's
  // price / market cap / txns as this token's. Fall back to the deepest
  // pair when no base-side pair exists.
  const basePair = pairs.find((p) => p.baseToken?.address === mint);
  return { pair: basePair ?? pairs[0], ...totals };
}

/** Resolve a DexScreener pair/pool address to the token that was scanned.
 *  Returns the base token mint address, or null when the address is not
 *  a known Solana pair (or DexScreener is unreachable). When the scanned
 *  token is the QUOTE token (e.g. TOKEN/USDC with the token as quote),
 *  the base is the numeraire (SOL / USDC / USDT) — return the quote
 *  token instead, or the wrong token would be scanned. */
const NUMERAIRE_MINTS = new Set([
  SOL_MINT,
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
]);
export async function resolvePairBaseToken(pairAddress: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8_000);
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/pairs/solana/${pairAddress}`,
      { headers: { Accept: 'application/json' }, signal: ctrl.signal },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { pair?: DexPair | null };
    const pair = json.pair;
    const base = pair?.baseToken?.address ?? null;
    if (base == null) return null;
    if (NUMERAIRE_MINTS.has(base) && pair?.quoteToken?.address) {
      return pair.quoteToken.address;
    }
    return base;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/** True when the string decodes to exactly 32 bytes — i.e. it is a real
 *  Solana address, not just a base58-looking run. M8: a 44-char slice of
 *  an 88-char tx signature can look like an address, so length alone is
 *  never enough. */
function isValidAddress(s: string): boolean {
  try {
    // PublicKey throws unless the base58 decodes to exactly 32 bytes.
    new PublicKey(s);
    return true;
  } catch {
    return false;
  }
}

/** Extract a token mint address from pasted text: a bare address, or a
 *  link from DexScreener / Pump.fun / Birdeye / Solscan. Host-specific
 *  patterns win over the generic fallback, so a pair address inside a
 *  DexScreener link is extracted as-is and resolved by the pair check
 *  in scanToken. Returns null when nothing that looks like an address
 *  is found. The caller shows the extracted address in the input.
 *  M8 — rejects `0x…` (EVM) input outright, requires every candidate to
 *  decode to exactly 32 bytes, and only matches a generic candidate at
 *  a non-base58 boundary, so a long base58 run (e.g. an 88-char tx
 *  signature) never yields its first 44 chars as a "mint". */
export function extractMintCandidate(raw: string): string | null {
  const input = raw.trim();
  if (!input) return null;
  // EVM address (bare or embedded) — never a Solana mint.
  if (/^0x/i.test(input) || /\b0x[0-9a-fA-F]{40}\b/.test(input)) return null;
  if (BASE58_RE.test(input)) return isValidAddress(input) ? input : null;
  const hostPatterns = [
    /pump\.fun\/coin\/([1-9A-HJ-NP-Za-km-z]{32,44})/,
    /pump\.fun\/([1-9A-HJ-NP-Za-km-z]{32,44})/,
    /birdeye\.so\/token\/([1-9A-HJ-NP-Za-km-z]{32,44})/,
    /solscan\.io\/(?:token|account)\/([1-9A-HJ-NP-Za-km-z]{32,44})/,
    /dexscreener\.com\/solana\/([1-9A-HJ-NP-Za-km-z]{32,44})/,
  ];
  for (const re of hostPatterns) {
    const m = input.match(re);
    if (m && isValidAddress(m[1])) return m[1];
  }
  // Generic fallback: the candidate must be a whole base58 token, not a
  // slice of a longer base58 run — the boundary guards reject an 88-char
  // signature (no boundary inside it) and the 32-byte check rejects any
  // 32–44-char run that is not a real address.
  const m = input.match(/(?:^|[^1-9A-HJ-NP-Za-km-z])([1-9A-HJ-NP-Za-km-z]{32,44})(?:$|[^1-9A-HJ-NP-Za-km-z])/);
  return m && isValidAddress(m[1]) ? m[1] : null;
}

/** Read the on-chain mint account (supply, decimals, authorities) via the
 *  raw JSON-RPC helper (10s timeout, no retry) — never via
 *  Connection.getParsedAccountInfo, whose web3.js retries can hang a scan
 *  for minutes on a rate-limited method.
 *  A definitive answer throws a translated error immediately: no account at
 *  the address = mint-not-found; account exists but is not a mint (e.g. a
 *  wallet address) = not-a-mint. Network errors fall through to the next
 *  endpoint and only then become an RPC error. */
async function readMint(mint: PublicKey, lang: Lang): Promise<{
  decimals: number;
  supply: number;
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
  rpcUsed: string;
}> {
  type ParsedMint = {
    value: {
      data:
        | {
            parsed: {
              info: {
                decimals?: number;
                supply?: string;
                mintAuthority?: string | null;
                freezeAuthority?: string | null;
              };
              type: string;
            };
            program: string;
            space: number;
          }
        | [string, string];
    } | null;
  };
  let lastError: unknown = null;
  // Proxy first (same pattern as getLargestAccounts / fetchRawAccount):
  // the public RPCs rate-limit getAccountInfo under load, and a throttled
  // mint read stalls the whole scan. rpcUsed is stored WITHOUT the query
  // string, so no credential can ever leak into the UI footer.
  const endpoints = [PROXY_RPC, ...RPC_ENDPOINTS];
  for (const endpoint of endpoints) {
    try {
      const res = await rpcCall<ParsedMint>(endpoint, 'getAccountInfo', [
        mint.toBase58(),
        { encoding: 'jsonParsed', commitment: 'confirmed' },
      ]);
      if (res.value == null) {
        // Definitive: no account at this address.
        throw new Error(STRINGS[lang].mintNotFoundError);
      }
      const data = res.value.data;
      if (Array.isArray(data) || data.parsed?.type !== 'mint') {
        // Definitive: the account exists but is not a token mint
        // (wallet / token account / program account).
        throw new Error(STRINGS[lang].notMintError);
      }
      const mintInfo = data.parsed.info;
      if (mintInfo?.decimals == null || mintInfo?.supply == null) {
        // Definitive: the account exists but is not a token mint.
        throw new Error(STRINGS[lang].notMintError);
      }
      return {
        decimals: mintInfo.decimals,
        supply: Number(mintInfo.supply) / 10 ** mintInfo.decimals,
        mintAuthorityRevoked: mintInfo.mintAuthority == null,
        freezeAuthorityRevoked: mintInfo.freezeAuthority == null,
        rpcUsed: endpoint.replace(/\?.*$/, ''),
      };
    } catch (err) {
      // A definitive not-mint / not-found answer — do not retry other endpoints.
      if (
        err instanceof Error &&
        (err.message === STRINGS[lang].notMintError ||
          err.message === STRINGS[lang].mintNotFoundError)
      ) {
        throw err;
      }
      lastError = err;
    }
  }
  // The raw RPC error text is English API output — never show it verbatim
  // (in ID mode it would leak untranslated). Keep only the
  // language-neutral HTTP status when there is one; otherwise the
  // translated prefix alone is the honest message.
  const rawMsg = lastError instanceof Error ? lastError.message : '';
  const httpStatus = /RPC HTTP (\d+)/.exec(rawMsg)?.[1];
  throw new Error(
    httpStatus != null
      ? `${STRINGS[lang].rpcErrorPrefix} (HTTP ${httpStatus})`
      : STRINGS[lang].rpcErrorPrefix,
  );
}

/** Raw JSON-RPC call with a hard timeout and NO retries.
 *  web3.js Connection retries 429s with exponential backoff (up to minutes),
 *  which makes a blocked method hang the whole scan. A fast, single attempt
 *  per endpoint keeps the UI responsive; the check degrades gracefully. */
async function rpcCall<T>(
  endpoint: string,
  method: string,
  params: unknown[],
  timeoutMs = 10_000,
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
    const json = (await res.json()) as { result?: T; error?: { message?: string } };
    if (json.error) throw new Error(json.error.message ?? 'RPC error');
    if (json.result == null) throw new Error('Empty RPC result');
    return json.result;
  } finally {
    clearTimeout(timer);
  }
}

/** Largest token accounts for a mint, via getTokenLargestAccounts.
 *  The proxy is tried FIRST, then the public RPCs.
 *  v7.11 — ONE retry of the proxy with a short backoff: transient Helius
 *  429s made BONK flake to 78 on re-scans (holder data unavailable → 79
 *  cap). A single retry recovers most of them; when the data really
 *  cannot be read the fail-safe (cap 79 + UNAVAILABLE badge) still
 *  applies honestly. H2 — a 429 waits 2s before the retry / fallback
 *  (no immediate re-hit in the same window); other failures keep the
 *  700ms retry. M11 — a default 30s deadline: on a total RPC outage
 *  this returns null (UNAVAILABLE) instead of stalling for ~50s across
 *  five 10s-timeout attempts. Returns null when every endpoint fails. */
async function getLargestAccounts(
  mint: string,
  deadlineMs: number = Date.now() + 30_000,
): Promise<{ address: string; amount: number }[] | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    if (Date.now() > deadlineMs) return null;
    try {
      const result = await rpcCall<{
        value: { address: string; amount: string }[];
      }>(PROXY_RPC, 'getTokenLargestAccounts', [mint, { commitment: 'confirmed' }]);
      return result.value.map((a) => ({ address: a.address, amount: Number(a.amount) }));
    } catch (err) {
      // First proxy failure: wait briefly — a transient 429 often clears
      // within a second — then retry the proxy once before falling back.
      // A 429 waits longer (2s): the window is exhausted, so an
      // immediate retry would only burn another quota hit.
      if (attempt === 0) {
        await sleep(isRateLimitError(err) ? 2_000 : 700);
      } else if (isRateLimitError(err)) {
        // Proxy exhausted twice — wait before falling back to the
        // public RPCs in the same window.
        await sleep(2_000);
      }
    }
  }
  for (const endpoint of RPC_ENDPOINTS) {
    if (Date.now() > deadlineMs) return null;
    try {
      const result = await rpcCall<{
        value: { address: string; amount: string }[];
      }>(endpoint, 'getTokenLargestAccounts', [mint, { commitment: 'confirmed' }]);
      return result.value.map((a) => ({ address: a.address, amount: Number(a.amount) }));
    } catch {
      // try the next endpoint
    }
  }
  return null;
}

/** Generic single-attempt JSON-RPC call across endpoints (proxy first,
 *  then the public RPCs): returns the first success, throws when all fail.
 *  Used by the bundle heuristic, whose many small calls must not stall the
 *  scan on one throttled endpoint.
 *  H2 — 429 backoff: when an endpoint answers 429 (proxy's 120 req/min
 *  limit), wait 2s before trying the next endpoint instead of
 *  immediately re-hitting another endpoint in the same window. */
async function rpcCallAny<T>(method: string, params: unknown[]): Promise<T> {
  const endpoints = [PROXY_RPC, ...RPC_ENDPOINTS];
  let lastError: unknown = null;
  for (let i = 0; i < endpoints.length; i++) {
    try {
      return await rpcCall<T>(endpoints[i], method, params);
    } catch (err) {
      lastError = err;
      if (isRateLimitError(err) && i < endpoints.length - 1) {
        await sleep(2_000);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('RPC failed');
}

/** True when an error is an HTTP 429 rate-limit response (proxy or RPC). */
function isRateLimitError(err: unknown): boolean {
  return err instanceof Error && err.message.includes('429');
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Cancellation / deadline options for the secondary checks (H2): the
 *  App passes these from its result effect so a new scan (or a deadline)
 *  aborts in-flight loops promptly instead of burning RPC budget on a
 *  stale result. `deadlineMs` is an absolute `Date.now()` timestamp. */
export interface CheckAbortOpts {
  isCancelled?: () => boolean;
  deadlineMs?: number;
}

function shouldStop(opts?: CheckAbortOpts): boolean {
  if (opts?.isCancelled?.()) return true;
  if (opts?.deadlineMs != null && Date.now() > opts.deadlineMs) return true;
  return false;
}

/** Top-10 holders share of total supply.
 *  Optionally excludes a list of token accounts from the calculation
 *  (the liquidity-pool vault, the DexScreener pair account, the incinerator's
 *  token account, verified exchange wallets): pool/burned/exchange supply is
 *  not a whale, so counting it would inflate the concentration number.
 *  Also returns the top 5 holders (address + share) for display, and which
 *  of the excluded addresses actually appeared among the largest accounts. */
async function readTopHolders(
  mint: PublicKey,
  supplyRaw: number,
  excludeAddresses: string[] | null = null,
): Promise<{
  top10SharePct: number;
  top1SharePct: number;
  top5: TopHolder[];
  top10: TopHolder[];
  excludedMatched: string[];
}> {
  // L19 — a zero-supply mint has no meaningful holder shares: supply 0
  // would make every share 0% and score a full 30/30. Treat it as
  // unavailable instead (the caller degrades to neutral 15 + 79 cap).
  if (supplyRaw <= 0) throw new Error('zero supply — holder shares undefined');
  const entries = await getLargestAccounts(mint.toBase58());
  if (entries == null) throw new Error('getTokenLargestAccounts failed on all endpoints');
  const exclude = new Set(excludeAddresses ?? []);
  const excludedMatched = entries
    .filter((e) => exclude.has(e.address))
    .map((e) => e.address);
  const filtered =
    exclude.size > 0 ? entries.filter((e) => !exclude.has(e.address)) : entries;
  const top10 = filtered.slice(0, 10).reduce((s, a) => s + a.amount, 0);
  const top1 = filtered[0]?.amount ?? 0;
  const toHolder = (e: { address: string; amount: number }): TopHolder => ({
    address: e.address,
    amount: e.amount,
    sharePct: supplyRaw > 0 ? (e.amount / supplyRaw) * 100 : 0,
  });
  return {
    top10SharePct: supplyRaw > 0 ? (top10 / supplyRaw) * 100 : 0,
    top1SharePct: supplyRaw > 0 ? (top1 / supplyRaw) * 100 : 0,
    top5: filtered.slice(0, 5).map(toHolder),
    top10: filtered.slice(0, 10).map(toHolder),
    excludedMatched,
  };
}

/** Raw (base64) account fetch, best effort. Returns null when the account
 *  does not exist OR when every RPC endpoint fails — callers treat both as
 *  "cannot be checked" (honest warn), never as a pass. */
async function fetchRawAccount(
  address: string,
): Promise<{ owner: string; data: Uint8Array } | null> {
  const endpoints = [PROXY_RPC, ...RPC_ENDPOINTS];
  for (const endpoint of endpoints) {
    try {
      const res = await rpcCall<{
        value: { owner: string; data: [string, string] } | null;
      }>(endpoint, 'getAccountInfo', [address, { encoding: 'base64', commitment: 'confirmed' }]);
      if (!res.value) return null;
      const [b64] = res.value.data;
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return { owner: res.value.owner, data: bytes };
    } catch {
      // try the next endpoint
    }
  }
  return null;
}

/** The mint of a token account, via parsed getAccountInfo — or null when the
 *  account is not a token account / cannot be read. Used to verify that a
 *  Raydium vault really holds the scanned token before excluding it.
 *  Proxy first (same pattern as readMint): public RPCs throttle under load. */
async function getTokenAccountMint(address: string): Promise<string | null> {
  const endpoints = [PROXY_RPC, ...RPC_ENDPOINTS];
  for (const endpoint of endpoints) {
    try {
      const res = await rpcCall<{
        value: {
          data:
            | { parsed: { info: { mint?: string }; type: string }; program: string; space: number }
            | [string, string];
        } | null;
      }>(endpoint, 'getAccountInfo', [
        address,
        { encoding: 'jsonParsed', commitment: 'confirmed' },
      ]);
      const data = res.value?.data;
      if (data && !Array.isArray(data) && data.parsed?.type === 'account') {
        return data.parsed.info.mint ?? null;
      }
      return null; // definitive: not a token account
    } catch {
      // try the next endpoint
    }
  }
  return null;
}

/** The OWNER (wallet) of a token account, via parsed getAccountInfo — or
 *  null when the account is not a token account / cannot be read. M10:
 *  getTokenLargestAccounts returns TOKEN ACCOUNT addresses, not wallets,
 *  so the fresh-wallet check must resolve the owner first and page the
 *  WALLET's history, not the token account's. Same endpoint pattern as
 *  getTokenAccountMint. */
async function getTokenAccountOwner(address: string): Promise<string | null> {
  const endpoints = [PROXY_RPC, ...RPC_ENDPOINTS];
  for (const endpoint of endpoints) {
    try {
      const res = await rpcCall<{
        value: {
          data:
            | { parsed: { info: { owner?: string }; type: string }; program: string; space: number }
            | [string, string];
        } | null;
      }>(endpoint, 'getAccountInfo', [
        address,
        { encoding: 'jsonParsed', commitment: 'confirmed' },
      ]);
      const data = res.value?.data;
      if (data && !Array.isArray(data) && data.parsed?.type === 'account') {
        return data.parsed.info.owner ?? null;
      }
      return null; // definitive: not a token account
    } catch {
      // try the next endpoint
    }
  }
  return null;
}

/** Raw token supply of a mint, best effort. Proxy first: the public
 *  RPCs throttle under load, and this read feeds the LP burn check. */
async function getTokenSupplyRaw(mint: string): Promise<number | null> {
  const endpoints = [PROXY_RPC, ...RPC_ENDPOINTS];
  for (const endpoint of endpoints) {
    try {
      const res = await rpcCall<{ value: { amount: string } }>(endpoint, 'getTokenSupply', [
        mint,
        { commitment: 'confirmed' },
      ]);
      return Number(res.value.amount);
    } catch {
      // try the next endpoint
    }
  }
  return null;
}

// ---------- Raydium AMM v4 pool state ----------
// Layout (program state, no Anchor discriminator):
// status u64, nonce u64, maxOrder u64, depth u64, baseDecimal u64,
// quoteDecimal u64, state u64, resetFlag u64, minSize u64, volMaxCutRatio u64,
// amountWaveRatio u64, baseLotSize u64, quoteLotSize u64, minPriceMultiplier u64,
// maxPriceMultiplier u64, systemDecimalValue u64, minSeparateNumerator u64,
// minSeparateDenominator u64, tradeFeeNumerator u64, tradeFeeDenominator u64,
// pnlNumerator u64, pnlDenominator u64, swapFeeNumerator u64, swapFeeDenominator u64,
// baseNeedTakePnl u64, quoteNeedTakePnl u64, quoteTotalPnl u64, baseTotalPnl u64,
// poolOpenTime u64, punishPcAmount u64, punishCoinAmount u64, orderbookToInitTime u64,
// swapBaseInAmount u128, swapQuoteOutAmount u128, swapBase2QuoteFee u64,
// swapQuoteInAmount u128, swapBaseOutAmount u128, swapQuote2BaseFee u64,
// baseVault Pubkey @336, quoteVault Pubkey @368, baseMint Pubkey @400,
// quoteMint Pubkey @432, lpMint Pubkey @464, openOrders @496, ...
const RAYDIUM_POOL_MIN_LEN = 496;
const RAYDIUM_BASE_VAULT_OFFSET = 336;
const RAYDIUM_QUOTE_VAULT_OFFSET = 368;
const RAYDIUM_BASE_MINT_OFFSET = 400;
const RAYDIUM_QUOTE_MINT_OFFSET = 432;
const RAYDIUM_LP_MINT_OFFSET = 464;
const INCINERATOR = '1nc1nerator11111111111111111111111111111111';
// Well-known protocol program addresses (web3.js v3 does not export these).
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);

/** Associated token account of a wallet for a mint.
 *  (web3.js v3 has no sync PDA derivation, so this is async.) */
async function associatedTokenAccountAddress(
  owner: PublicKey,
  mint: PublicKey,
): Promise<string> {
  const [ata] = await PublicKey.findProgramAddress(
    [owner.toBytes(), TOKEN_PROGRAM_ID.toBytes(), mint.toBytes()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return ata.toBase58();
}

/** The incinerator's token account for a mint — its associated token account.
 *  getTokenLargestAccounts returns TOKEN ACCOUNT addresses, not wallet
 *  addresses, so a burned balance is found at the incinerator's ATA, never
 *  at the literal '1nc1nerator...' wallet address. Comparing a largest-
 *  account entry against the wallet address would never match. */
async function burnTokenAccountAddress(mint: PublicKey): Promise<string> {
  return associatedTokenAccountAddress(new PublicKey(INCINERATOR), mint);
}

/**
 * Centralized-exchange wallets on Solana, VERIFIED against Solscan public
 * names + "#Exchange Wallet" tags on 27 Nov 2026
 * (https://solscan.io/account/<address>):
 * - Binance "Binance 2" 5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9
 * - Binance "Binance 3" 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
 * - Coinbase "Coinbase 4" 9obNtb5GyUegcs3a1CbBkLuc5hEWynWfJC6gjz5uWQkE
 * - OKX "OKX Hot Wallet" 5VCwKtCXgCJ6kit5FybXjvriW3xELsFDhYrPSqtJNmcD
 * - Kraken "Kraken Hot Wallet" FWznbcNXWQuHTawe9RxvQ2LdCENssh12dsznf4RiouN5
 * - Bybit "Bybit Hot Wallet" AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2
 * An exchange wallet holds tokens on behalf of thousands of users, so its
 * balance is not a single whale — it is excluded from the top-10
 * concentration like the pool vault and the burn address. Only wallets whose
 * Solscan label was checked are listed here; never add an address from
 * memory or an unverified source. Exchanges rotate wallets over time, so
 * this list needs periodic re-checking.
 */
const CEX_WALLETS: { exchange: string; address: string }[] = [
  { exchange: 'Binance', address: '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9' },
  { exchange: 'Binance', address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' },
  { exchange: 'Coinbase', address: '9obNtb5GyUegcs3a1CbBkLuc5hEWynWfJC6gjz5uWQkE' },
  { exchange: 'OKX', address: '5VCwKtCXgCJ6kit5FybXjvriW3xELsFDhYrPSqtJNmcD' },
  { exchange: 'Kraken', address: 'FWznbcNXWQuHTawe9RxvQ2LdCENssh12dsznf4RiouN5' },
  { exchange: 'Bybit', address: 'AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2' },
];

/** Pool vaults + LP mint for one AMM pool (Raydium AMM v4 or PumpSwap AMM —
 *  both expose the same fields: the two reserve vaults, the two mints and
 *  the LP mint). Used for the holder top-10 vault exclusion and the LP
 *  burn/lock probe. */
interface AmmPoolInfo {
  baseVault: string;
  quoteVault: string;
  baseMint: string;
  quoteMint: string;
  lpMint: string;
}

/** Read a Raydium AMM v4 pool state account and extract its vaults + LP mint.
 *  Returns null when the account is not a v4 pool state (wrong length, or the
 *  embedded base/quote mints do not match the DexScreener pair) — callers
 *  then report "cannot be checked" instead of guessing. */
async function readRaydiumPool(
  poolAddress: string,
  baseTokenAddress: string | undefined,
  quoteTokenAddress: string | undefined,
): Promise<AmmPoolInfo | null> {
  const raw = await fetchRawAccount(poolAddress);
  if (!raw || raw.data.length < RAYDIUM_POOL_MIN_LEN) return null;
  const readPubkey = (off: number): string =>
    new PublicKey(raw.data.subarray(off, off + 32)).toBase58();
  const info: AmmPoolInfo = {
    baseVault: readPubkey(RAYDIUM_BASE_VAULT_OFFSET),
    quoteVault: readPubkey(RAYDIUM_QUOTE_VAULT_OFFSET),
    baseMint: readPubkey(RAYDIUM_BASE_MINT_OFFSET),
    quoteMint: readPubkey(RAYDIUM_QUOTE_MINT_OFFSET),
    lpMint: readPubkey(RAYDIUM_LP_MINT_OFFSET),
  };
  const zero = '11111111111111111111111111111111';
  if (info.baseVault === zero || info.lpMint === zero) return null;
  // Sanity check: the pool's own mints must match the pair's tokens,
  // otherwise this is not a v4 pool state (e.g. a CPMM/Whirlpool account).
  if (baseTokenAddress && info.baseMint !== baseTokenAddress) return null;
  if (quoteTokenAddress && info.quoteMint !== quoteTokenAddress) return null;
  return info;
}

// ---------- PumpSwap AMM pool state (v7.11) ----------
// Layout (Anchor account, 8-byte discriminator, then the Pool fields in
// IDL order — verified against pump-fun/pump-public-docs AND on-chain
// for ChokingCat's pool 9Wjy7e5wtrNbtcregNHt9o8J8JMQUwzssKZmdg7FHdET):
// pool_bump u8 @8, index u16 @9, creator Pubkey @11, base_mint Pubkey @43,
// quote_mint Pubkey @75, lp_mint Pubkey @107,
// pool_base_token_account Pubkey @139, pool_quote_token_account Pubkey @171,
// lp_supply u64 @203, coin_creator Pubkey @211 (data len 301).
// Program: pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA.
// Why it matters: a graduated pump token's whole curve supply sits in the
// pool's base vault (ChokingCat: 98.44% of supply), so without this the
// top-10 check reads the pool as one giant whale. Same safety pattern as
// Raydium: owner + length + mint-match checks, then the caller verifies
// the vault really holds the scanned mint before excluding it.
const PUMPSWAP_PROGRAM_ID = 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA';
const PUMPSWAP_POOL_MIN_LEN = 243;
const PUMPSWAP_BASE_MINT_OFFSET = 43;
const PUMPSWAP_QUOTE_MINT_OFFSET = 75;
const PUMPSWAP_LP_MINT_OFFSET = 107;
const PUMPSWAP_BASE_VAULT_OFFSET = 139;
const PUMPSWAP_QUOTE_VAULT_OFFSET = 171;

/** Read a PumpSwap AMM pool state account and extract its vaults + LP mint.
 *  Returns null when the account is not a PumpSwap pool (wrong owner,
 *  wrong length, or the embedded base/quote mints do not match the
 *  DexScreener pair) — callers then report "cannot be checked" instead
 *  of guessing. */
async function readPumpSwapPool(
  poolAddress: string,
  baseTokenAddress: string | undefined,
  quoteTokenAddress: string | undefined,
): Promise<AmmPoolInfo | null> {
  const raw = await fetchRawAccount(poolAddress);
  if (!raw || raw.owner !== PUMPSWAP_PROGRAM_ID) return null;
  if (raw.data.length < PUMPSWAP_POOL_MIN_LEN) return null;
  const readPubkey = (off: number): string =>
    new PublicKey(raw.data.subarray(off, off + 32)).toBase58();
  const info: AmmPoolInfo = {
    baseVault: readPubkey(PUMPSWAP_BASE_VAULT_OFFSET),
    quoteVault: readPubkey(PUMPSWAP_QUOTE_VAULT_OFFSET),
    baseMint: readPubkey(PUMPSWAP_BASE_MINT_OFFSET),
    quoteMint: readPubkey(PUMPSWAP_QUOTE_MINT_OFFSET),
    lpMint: readPubkey(PUMPSWAP_LP_MINT_OFFSET),
  };
  const zero = '11111111111111111111111111111111';
  if (info.baseVault === zero || info.lpMint === zero) return null;
  // Sanity check: the pool's own mints must match the pair's tokens,
  // otherwise this is not a PumpSwap pool state.
  if (baseTokenAddress && info.baseMint !== baseTokenAddress) return null;
  if (quoteTokenAddress && info.quoteMint !== quoteTokenAddress) return null;
  return info;
}

// ---------- Orca Whirlpool state (M12) ----------
// Layout (Anchor account, verified against the official client codec in
// @orca-so/whirlpools-client v7.0.0 `getWhirlpoolDecoder`, total size
// 653 bytes): discriminator 8 | whirlpoolsConfig Pubkey @8 |
// whirlpoolBump u8 @40 | tickSpacing u16 @41 | feeTierIndexSeed [u8;2]
// @43 | feeRate u16 @45 | protocolFeeRate u16 @47 | liquidity u128 @49 |
// sqrtPrice u128 @65 | tickCurrentIndex i32 @81 |
// protocolFeeOwedA u64 @85 | protocolFeeOwedB u64 @93 |
// tokenMintA Pubkey @101 | tokenVaultA Pubkey @133 |
// feeGrowthGlobalA u128 @165 | tokenMintB Pubkey @181 |
// tokenVaultB Pubkey @213 | feeGrowthGlobalB u128 @245 | ...
// Program: whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc.
// Concentrated liquidity has NO fungible LP mint, so lpMint is the zero
// address (the LP burn check never runs for Orca pairs — it is 'na').
// The vault of the scanned token is what the holder exclusion needs.
const ORCA_PROGRAM_ID = 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc';
const ORCA_POOL_MIN_LEN = 245;
const ORCA_MINT_A_OFFSET = 101;
const ORCA_VAULT_A_OFFSET = 133;
const ORCA_MINT_B_OFFSET = 181;
const ORCA_VAULT_B_OFFSET = 213;
const ZERO_ADDRESS = '11111111111111111111111111111111';

/** Read an Orca Whirlpool account and extract its vaults. Returns null
 *  when the account is not a Whirlpool (wrong owner, wrong length, or
 *  the embedded mints do not match the DexScreener pair) — callers then
 *  report "cannot be checked" instead of guessing. */
async function readOrcaPool(
  poolAddress: string,
  baseTokenAddress: string | undefined,
  quoteTokenAddress: string | undefined,
): Promise<AmmPoolInfo | null> {
  const raw = await fetchRawAccount(poolAddress);
  if (!raw || raw.owner !== ORCA_PROGRAM_ID) return null;
  if (raw.data.length < ORCA_POOL_MIN_LEN) return null;
  const readPubkey = (off: number): string =>
    new PublicKey(raw.data.subarray(off, off + 32)).toBase58();
  const mintA = readPubkey(ORCA_MINT_A_OFFSET);
  const mintB = readPubkey(ORCA_MINT_B_OFFSET);
  const vaultA = readPubkey(ORCA_VAULT_A_OFFSET);
  const vaultB = readPubkey(ORCA_VAULT_B_OFFSET);
  if (vaultA === ZERO_ADDRESS || vaultB === ZERO_ADDRESS) return null;
  // Map A/B onto base/quote so baseVault always holds the base token
  // (Whirlpool sorts A < B as pubkeys; DexScreener does not). The
  // pool's own mints must include the pair's known token(s), otherwise
  // this is not the pair's pool.
  let baseMint: string;
  let quoteMint: string;
  let baseVault: string;
  let quoteVault: string;
  if (baseTokenAddress != null) {
    if (mintA === baseTokenAddress) {
      baseMint = mintA; baseVault = vaultA; quoteMint = mintB; quoteVault = vaultB;
    } else if (mintB === baseTokenAddress) {
      baseMint = mintB; baseVault = vaultB; quoteMint = mintA; quoteVault = vaultA;
    } else {
      return null;
    }
    if (quoteTokenAddress != null && quoteMint !== quoteTokenAddress) return null;
  } else if (quoteTokenAddress != null) {
    if (mintA === quoteTokenAddress) {
      quoteMint = mintA; quoteVault = vaultA; baseMint = mintB; baseVault = vaultB;
    } else if (mintB === quoteTokenAddress) {
      quoteMint = mintB; quoteVault = vaultB; baseMint = mintA; baseVault = vaultA;
    } else {
      return null;
    }
  } else {
    baseMint = mintA; baseVault = vaultA; quoteMint = mintB; quoteVault = vaultB;
  }
  return { baseVault, quoteVault, baseMint, quoteMint, lpMint: ZERO_ADDRESS };
}

// ---------- Meteora DLMM LbPair state (M12) ----------
// Layout (Anchor account, verified against the published IDL in
// @meteora-ag/dlmm v1.9.14): discriminator 8 | parameters
// (StaticParameters, 32 bytes) @8 | v_parameters (VariableParameters,
// 32 bytes) @40 | bump_seed u8 @72 | bin_step_seed [u8;2] @73 |
// pair_type u8 @75 | active_id i32 @76 | bin_step u16 @80 | status u8
// @82 | require_base_factor_seed u8 @83 | base_factor_seed [u8;2] @84 |
// activation_type u8 @86 | creator_pool_on_off_control u8 @87 |
// token_x_mint Pubkey @88 | token_y_mint Pubkey @120 |
// reserve_x Pubkey @152 | reserve_y Pubkey @184 | protocol_fee @216 ...
// The active_id @76 / bin_step @80 anchors are independently confirmed
// by Meteora's own swap-parsing guide (mainnet-sampled, Oct 2026).
// Program: LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo (current);
// M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K is the legacy DLMM
// program — old pools still live under it, so both owners are accepted.
// DLMM header fields grew over versions (activation_type /
// creator_pool_on_off_control were added after launch), so fixed
// offsets alone would misread pre-2024 pools: the reader first tries
// the current offsets, then falls back to scanning for the two pair
// mints as consecutive pubkeys — token_x_mint, token_y_mint,
// reserve_x, reserve_y are consecutive in every version. Either path
// still needs the mint-match, and the caller verifies the vault really
// holds the scanned mint before excluding it.
// Like Orca, DLMM has NO fungible LP mint (lpMint = zero address).
const METEORA_DLMM_PROGRAM_IDS = new Set([
  'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
  'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K',
]);
const METEORA_POOL_MIN_LEN = 216;
const METEORA_MINT_X_OFFSET = 88;
const METEORA_MINT_Y_OFFSET = 120;
const METEORA_RESERVE_X_OFFSET = 152;
const METEORA_RESERVE_Y_OFFSET = 184;

/** Read a Meteora DLMM LbPair account and extract its reserve vaults.
 *  Returns null when the account is not an LbPair for this pair (wrong
 *  owner, wrong length, or the embedded mints do not match the
 *  DexScreener pair) — callers then report "cannot be checked" instead
 *  of guessing. */
async function readMeteoraPool(
  poolAddress: string,
  baseTokenAddress: string | undefined,
  quoteTokenAddress: string | undefined,
): Promise<AmmPoolInfo | null> {
  const raw = await fetchRawAccount(poolAddress);
  if (!raw || !METEORA_DLMM_PROGRAM_IDS.has(raw.owner)) return null;
  if (raw.data.length < METEORA_POOL_MIN_LEN) return null;
  const readPubkey = (off: number): string =>
    new PublicKey(raw.data.subarray(off, off + 32)).toBase58();
  // The pair's two mints, as raw bytes, for the scan fallback.
  const mintBytes = (addr: string | undefined): Uint8Array | null => {
    if (addr == null) return null;
    try {
      return new PublicKey(addr).toBytes();
    } catch {
      return null;
    }
  };
  const baseBytes = mintBytes(baseTokenAddress);
  const quoteBytes = mintBytes(quoteTokenAddress);
  const bytesEqual = (off: number, want: Uint8Array | null): boolean => {
    if (want == null || off + 32 > raw.data.length) return false;
    for (let i = 0; i < 32; i++) if (raw.data[off + i] !== want[i]) return false;
    return true;
  };
  // Candidate (mintX, mintY, reserveX, reserveY) offset quadruples:
  // current-IDL fixed offsets first, then a scan for the two pair mints
  // sitting consecutively (old-layout pools).
  const candidates: [number, number, number, number][] = [
    [
      METEORA_MINT_X_OFFSET,
      METEORA_MINT_Y_OFFSET,
      METEORA_RESERVE_X_OFFSET,
      METEORA_RESERVE_Y_OFFSET,
    ],
  ];
  if (baseBytes && quoteBytes) {
    for (let off = 8; off + 128 <= raw.data.length; off++) {
      const xIsBase = bytesEqual(off, baseBytes) && bytesEqual(off + 32, quoteBytes);
      const xIsQuote = bytesEqual(off, quoteBytes) && bytesEqual(off + 32, baseBytes);
      if (xIsBase || xIsQuote) {
        candidates.push([off, off + 32, off + 64, off + 96]);
        break;
      }
    }
  }
  for (const [mintXOff, mintYOff, reserveXOff, reserveYOff] of candidates) {
    const mintX = readPubkey(mintXOff);
    const mintY = readPubkey(mintYOff);
    const reserveX = readPubkey(reserveXOff);
    const reserveY = readPubkey(reserveYOff);
    if (reserveX === ZERO_ADDRESS || reserveY === ZERO_ADDRESS) continue;
    // Map X/Y onto base/quote so baseVault always holds the base token
    // (DLMM sorts X < Y as pubkeys; DexScreener does not). The pool's
    // own mints must include the pair's known token(s), otherwise this
    // candidate offset set is not the pair's pool.
    let baseMint: string;
    let quoteMint: string;
    let baseVault: string;
    let quoteVault: string;
    if (baseTokenAddress != null) {
      if (mintX === baseTokenAddress) {
        baseMint = mintX; baseVault = reserveX; quoteMint = mintY; quoteVault = reserveY;
      } else if (mintY === baseTokenAddress) {
        baseMint = mintY; baseVault = reserveY; quoteMint = mintX; quoteVault = reserveX;
      } else {
        continue;
      }
      if (quoteTokenAddress != null && quoteMint !== quoteTokenAddress) continue;
    } else if (quoteTokenAddress != null) {
      if (mintX === quoteTokenAddress) {
        quoteMint = mintX; quoteVault = reserveX; baseMint = mintY; baseVault = reserveY;
      } else if (mintY === quoteTokenAddress) {
        quoteMint = mintY; quoteVault = reserveY; baseMint = mintX; baseVault = reserveX;
      } else {
        continue;
      }
    } else {
      baseMint = mintX; baseVault = reserveX; quoteMint = mintY; quoteVault = reserveY;
    }
    return { baseVault, quoteVault, baseMint, quoteMint, lpMint: ZERO_ADDRESS };
  }
  return null;
}

/** Language-independent ids for the dangerous Token-2022 extensions
 *  (used by the risk summary; the localized names live in i18n.ts). */
export type Token2022ExtensionId =
  | 'permanent-delegate'
  | 'transfer-fee'
  | 'transfer-hook';

/** LP Burn/Lock probe (informational only). For a Raydium pool: read the LP
 *  mint supply + largest LP holders; LP sitting in the incinerator counts as
 *  burned. >=95% burned = pass. Otherwise the verdict turns on the LARGEST
 *  REMAINING LP holder (v7.8): CAUTION only when that holder owns MORE
 *  THAN 15% of LP — they could pull that much liquidity in one move.
 *  At or below 15% the check is INFO: most LP is burned/locked or widely
 *  spread, so the largest holder can pull at most their own small share
 *  (the old burned-share bands wrongly flagged e.g. WIF, whose top LP
 *  holder owns only 8%). Anything underivable = INFO "cannot be checked"
 *  — an unreadable pool is NOT evidence of risk, so it must not wear the
 *  same CAUTION badge as a genuinely unburned LP. Never guesses.
 *  Also returns the raw numbers (burnedPct / top1Pct) so the risk summary
 *  can state them from structured data instead of parsing the detail text. */
async function checkLpBurn(
  pool: AmmPoolInfo | null,
  lang: Lang,
): Promise<{
  status: CheckStatus;
  detail: string;
  burnedPct: number | null;
  top1Pct: number | null;
}> {
  const t = STRINGS[lang];
  const unavailable = { status: 'info' as CheckStatus, detail: t.lpUnavailable };
  if (!pool) return { ...unavailable, burnedPct: null, top1Pct: null };
  const supply = await getTokenSupplyRaw(pool.lpMint);
  if (supply == null || supply <= 0)
    return { ...unavailable, burnedPct: null, top1Pct: null };
  const holders = await getLargestAccounts(pool.lpMint);
  if (holders == null || holders.length === 0) {
    return { ...unavailable, burnedPct: null, top1Pct: null };
  }
  const burnAccount = await burnTokenAccountAddress(new PublicKey(pool.lpMint));
  const burned = holders.find((h) => h.address === burnAccount)?.amount ?? 0;
  const burnedPct = (burned / supply) * 100;
  const top1Pct = ((holders[0]?.amount ?? 0) / supply) * 100;
  if (burnedPct >= 95)
    return { status: 'pass', detail: t.lpBurned(fmtPct(burnedPct)), burnedPct, top1Pct };
  // v7.8 — the warning is about how much ONE holder could pull, not the
  // burned share alone: a top holder at or below 15% can pull at most 15%
  // of liquidity, so the card is INFO with the burned share stated.
  // v7.9 — status must be 'pass', NOT 'info': the badge map renders
  // 'info' as UNAVAILABLE (grey, "data could not be read"), which is wrong
  // for a successful read with a fine result — the WIF card showed
  // UNAVAILABLE with correct text. 'pass' renders the green INFO badge.
  // Genuinely-unread LP data (no pool/supply/holders above) keeps 'info'
  // and its UNAVAILABLE badge — only the mostly-safe case changes.
  if (top1Pct > 15)
    return { status: 'warn', detail: t.lpNotBurned(fmtPct(top1Pct)), burnedPct, top1Pct };
  return {
    status: 'pass',
    // v7.9 — the text states NO burned share: the measured figure only
    // counts incinerator burns (lock programs are not detected), so any
    // burned-% claim here would be misleading. Only the residual holder.
    detail: t.lpMostlySafe(fmtPct(top1Pct)),
    burnedPct,
    top1Pct,
  };
}

// ---------- Dev-bundle heuristic (v7.6, Level 2) ----------
/** Dev-bundle heuristic — informational only, but a suspected bundle caps
 *  the total at 79 (same guardrail as unverified holder data): a token can
 *  never read Safe while a coordinated launch dump is possible.
 *
 *  Why it exists: rogue devs split 20–60% of supply across 10–30 wallets
 *  in ONE Jito bundle in the launch slot, so each wallet looks like 2–3%
 *  and the Top-10 check stays green. This looks at the earliest
 *  transactions instead: if ≥4 different wallets bought in the launch
 *  slot(s) with a combined >15% of supply, the launch was coordinated.
 *
 *  Rate-limit safety (the whole point): it runs ONLY for young tokens
 *  (pair age < 7 days — bundles only matter at launch), pages back at most
 *  20×100 signatures to reach the first transaction, reads at most 12
 *  transactions in batches of 4, skips failed transactions (they changed
 *  nothing), and any failure degrades to UNAVAILABLE instead of retrying.
 *  Old/busy tokens (BONK, POPCAT) are skipped outright, so their
 *  million-transaction histories are never touched. */
async function checkBundle(
  mint: string,
  supplyRaw: number,
  pairCreatedAt: number | null | undefined,
  excludeAddresses: string[],
  lang: Lang,
  opts?: CheckAbortOpts,
): Promise<{
  status: CheckStatus;
  detail: string;
  suspected: boolean;
  buyerCount: number | null;
  buyerSharePct: number | null;
}> {
  const t = STRINGS[lang];
  const skipped = {
    status: 'na' as CheckStatus,
    detail: t.bundleSkipped,
    suspected: false,
    buyerCount: null,
    buyerSharePct: null,
  };
  const unavailable = {
    status: 'info' as CheckStatus,
    detail: t.bundleUnavailable,
    suspected: false,
    buyerCount: null,
    buyerSharePct: null,
  };
  // Gate: only young tokens with a detected pair. Without a pair age we
  // cannot tell young from old — skip rather than burn RPC budget.
  if (pairCreatedAt == null) return skipped;
  const pairAgeDays = (Date.now() - pairCreatedAt) / 86_400_000;
  if (pairAgeDays >= 7) return skipped;
  if (supplyRaw <= 0) return unavailable;
  // M11 — global deadline (H2: abort promptly when the App cancels or
  // the deadline passes). Default 45s from the start of this check, so
  // a total RPC outage degrades to UNAVAILABLE instead of stalling for
  // minutes across 20 sig pages + 12 tx fetches × 4 endpoints × 10s.
  const effectiveOpts: CheckAbortOpts = {
    isCancelled: opts?.isCancelled,
    deadlineMs: opts?.deadlineMs ?? Date.now() + 45_000,
  };
  try {
    type SigInfo = { signature: string; slot: number };
    // Page backward to the TRUE beginning of history: getSignaturesForAddress
    // returns newest-first, so `limit: 100` alone never reaches the launch
    // of a busy token — `before` walks older. We page until a short batch
    // proves we reached the first transaction; if the cap (20 pages = 2000
    // signatures) is hit first, the launch is out of cheap reach and the
    // check honestly reports "too deep" instead of a false "no bundle".
    const allSigs: SigInfo[] = [];
    let before: string | undefined;
    let reachedBeginning = false;
    for (let page = 0; page < 20; page++) {
      if (shouldStop(effectiveOpts)) return unavailable;
      const batch = (await rpcCallAny<SigInfo[]>('getSignaturesForAddress', [
        mint,
        { limit: 100, before, commitment: 'confirmed' },
      ])) ?? [];
      if (batch.length === 0) {
        reachedBeginning = true;
        break;
      }
      allSigs.push(...batch);
      before = batch[batch.length - 1].signature;
      if (batch.length < 100) {
        reachedBeginning = true;
        break;
      }
    }
    if (allSigs.length === 0) return unavailable;
    if (!reachedBeginning) {
      return {
        status: 'info' as CheckStatus,
        detail: t.bundleTooDeep,
        suspected: false,
        buyerCount: null,
        buyerSharePct: null,
      };
    }
    // The launch window is the 12 oldest transactions. Group their buyers
    // by slot — a Jito bundle lands atomically in ONE slot, so the slot
    // with the most distinct buyers is the candidate bundle slot.
    const oldest = [...allSigs].sort((a, b) => a.slot - b.slot).slice(0, 12);
    // Fetch transactions in small batches (Helius free tier: 10 RPS).
    type BalanceEntry = {
      accountIndex?: number;
      mint: string;
      owner: string;
      uiTokenAmount: { amount: string };
    };
    type TxParsed = {
      slot: number;
      transaction?: {
        message?: { accountKeys?: ({ pubkey: string } | string)[] };
      };
      meta?: {
        err?: unknown;
        preTokenBalances?: BalanceEntry[];
        postTokenBalances?: BalanceEntry[];
      } | null;
    };
    const txs: TxParsed[] = [];
    for (let i = 0; i < oldest.length; i += 4) {
      if (shouldStop(effectiveOpts)) return unavailable;
      const batch = oldest.slice(i, i + 4);
      const results = await Promise.all(
        batch.map((s) =>
          rpcCallAny<TxParsed>('getTransaction', [
            s.signature,
            {
              encoding: 'jsonParsed',
              // v1 transactions exist on modern launches; 0 would reject them.
              maxSupportedTransactionVersion: 1,
              commitment: 'confirmed',
            },
          ]).catch(() => null),
        ),
      );
      for (const r of results) if (r) txs.push(r);
    }
    if (txs.length === 0) return unavailable;
    // The exclude set holds TOKEN ACCOUNT addresses (pool vault, pair
    // account, burn ATA, CEX ATAs) — resolve each balance entry's token
    // account via its accountIndex into the transaction's accountKeys.
    // (Comparing the entry's owner — a wallet — against token-account
    // addresses would never match.)
    const exclude = new Set(excludeAddresses);
    const tokenAccountOf = (tx: TxParsed, entry: BalanceEntry): string | null => {
      const idx = entry.accountIndex;
      if (idx == null) return null;
      const key = tx.transaction?.message?.accountKeys?.[idx];
      if (key == null) return null;
      return typeof key === 'string' ? key : (key.pubkey ?? null);
    };
    // Buyers per slot, with their bought amounts — plus each owner's peak
    // balance in the window. A failed transaction never changed any balance,
    // so it carries no evidence and is skipped.
    const bySlot = new Map<number, Map<string, number>>();
    const peakBalance = new Map<string, number>();
    let analyzedTxs = 0;
    for (const tx of txs) {
      if (tx.meta?.err) continue;
      let sawMint = false;
      const pre = new Map<string, number>();
      for (const b of tx.meta?.preTokenBalances ?? []) {
        if (b.mint !== mint) continue;
        sawMint = true;
        pre.set(b.owner, Number(b.uiTokenAmount.amount));
      }
      const slotBuyers = bySlot.get(tx.slot) ?? new Map<string, number>();
      bySlot.set(tx.slot, slotBuyers);
      for (const b of tx.meta?.postTokenBalances ?? []) {
        if (b.mint !== mint) continue;
        sawMint = true;
        // Skip known pool/burn/exchange token accounts.
        const acct = tokenAccountOf(tx, b);
        if (acct != null && exclude.has(acct)) continue;
        const post = Number(b.uiTokenAmount.amount);
        peakBalance.set(b.owner, Math.max(peakBalance.get(b.owner) ?? 0, post));
        const delta = post - (pre.get(b.owner) ?? 0);
        if (delta > 0) slotBuyers.set(b.owner, (slotBuyers.get(b.owner) ?? 0) + delta);
      }
      if (sawMint) analyzedTxs++;
    }
    // Too little real data to judge — do not report a clean pass.
    if (analyzedTxs < 3) return unavailable;
    // A single buyer taking >50% in one go, or any wallet PEAKING above
    // 50% of supply in the window, is the mint recipient / curve vault /
    // creator — not a bundle wallet. Without this, every token
    // false-positives (the curve alone holds ~half the supply at launch).
    let bestBuyers: [string, number][] = [];
    for (const [, buyers] of bySlot) {
      const filtered = [...buyers.entries()].filter(
        ([owner, amt]) =>
          amt / supplyRaw < 0.5 && (peakBalance.get(owner) ?? 0) / supplyRaw < 0.5,
      );
      if (filtered.length > bestBuyers.length) bestBuyers = filtered;
    }
    const buyerCount = bestBuyers.length;
    const combined = bestBuyers.reduce((sum, [, amt]) => sum + amt, 0);
    const buyerSharePct = (combined / supplyRaw) * 100;
    if (buyerCount >= 4 && buyerSharePct > 15) {
      return {
        status: 'warn',
        detail: t.bundleSuspected(String(buyerCount), fmtPct(buyerSharePct)),
        suspected: true,
        buyerCount,
        buyerSharePct,
      };
    }
    return {
      status: 'pass',
      detail: t.bundleOk(String(buyerCount), fmtPct(buyerSharePct)),
      suspected: false,
      buyerCount,
      buyerSharePct,
    };
  } catch {
    return unavailable;
  }
}

/** RugCheck insider-network signal (v7.6, Level 2b) — the indexed
 *  complement to the RPC heuristic: RugCheck's backend already clusters
 *  insider wallets, so a hot launch whose first 2000 transactions are out
 *  of cheap RPC reach can still be judged. Since v7.7 the report is
 *  fetched through the Cloudflare proxy (GET <proxy>/rugcheck/<mint>)
 *  first, with the direct public endpoint as fallback, so the browser
 *  makes one same-origin-style call and RugCheck rate limits hit the
 *  proxy, not the user's IP. Returns null
 *  when the report has no cluster data yet (very fresh tokens), the token
 *  is unindexed, or the fetch fails — the RPC heuristic then decides alone.
 *  The caller gates this to young tokens (pair age < 7 days): the full
 *  report of an old, busy token is megabytes (BONK: 2.5 MB) and the bundle
 *  question is moot for it anyway. */
export async function checkRugCheckInsiders(
  mint: string,
  supplyRaw: number,
  lang: Lang,
): Promise<{
  suspected: boolean;
  status: CheckStatus;
  detail: string;
  networkSize: number | null;
  networkSharePct: number | null;
} | null> {
  const t = STRINGS[lang];
  try {
    // Proxy first (v7.7), direct api.rugcheck.xyz as fallback (v7.6
    // behaviour — the public endpoint is keyless and CORS-open, so a
    // proxy outage must not blind the insider signal; the RPC heuristic
    // alone would then decide only if BOTH fetches fail).
    const REPORT_URLS = [
      `${PROXY_URL}/rugcheck/${mint}`,
      `https://api.rugcheck.xyz/v1/tokens/${mint}/report`,
    ];
    type RugCheckReport = {
      insiderNetworks?: {
        size?: number;
        activeAccounts?: number;
        currentHolding?: number;
      }[] | null;
      error?: unknown;
    };
    let json: RugCheckReport | null = null;
    for (const url of REPORT_URLS) {
      // v7.10 (B2) — a FRESH 8s timer per URL. One shared timer let a
      // slow-but-alive proxy (e.g. 7s) starve the direct fallback to ~1s.
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8_000);
      try {
        const res = await fetch(url, {
          headers: { Accept: 'application/json' },
          signal: ctrl.signal,
        });
        if (!res.ok) continue;
        const parsed = (await res.json()) as RugCheckReport;
        // RugCheck answers throttling with HTTP 200 + {"error": ...} —
        // that is a failure, not an empty report; try the next URL.
        if (parsed != null && typeof parsed === 'object' && parsed.error != null) continue;
        json = parsed;
        break;
      } catch {
        // try the next URL
      } finally {
        clearTimeout(timer);
      }
    }
    if (json == null) return null;
    const networks = json.insiderNetworks ?? [];
    if (networks.length === 0) return null; // no cluster data (yet)
    let best: { size: number; share: number } | null = null;
    for (const n of networks) {
      const holding = typeof n.currentHolding === 'number' ? n.currentHolding : 0;
      const share = supplyRaw > 0 ? (holding / supplyRaw) * 100 : 0;
      const size = n.size ?? n.activeAccounts ?? 0;
      if (!best || share > best.share) best = { size, share };
    }
    if (!best) return null;
    if (best.share > 15) {
      return {
        suspected: true,
        status: 'warn',
        // RugCheck's currentHolding can exceed the supply (stale snapshot
        // vs. a still-minting token, or a network that includes the curve)
        // — clamp the displayed share at 100% so the card never reads
        // "214% of supply". The flag itself is unaffected.
        detail: t.bundleSuspectedRc(String(best.size), fmtPct(Math.min(best.share, 100))),
        networkSize: best.size,
        networkSharePct: best.share,
      };
    }
    return {
      suspected: false,
      status: 'pass',
      detail: t.bundleOkRc(String(best.size), fmtPct(Math.min(best.share, 100))),
      networkSize: best.size,
      networkSharePct: best.share,
    };
  } catch {
    return null;
  }
}

/** Merge the two bundle signals (v7.6): a suspicion from EITHER source
 *  flags the token (RugCheck's indexed clusters win when both suspect);
 *  a clean verdict from RugCheck covers a hot launch the RPC heuristic
 *  could not reach; otherwise the RPC heuristic's verdict stands. */
function mergeBundleChecks(
  rpc: { status: CheckStatus; detail: string; suspected: boolean },
  rc: { status: CheckStatus; detail: string; suspected: boolean } | null,
): { status: CheckStatus; detail: string; suspected: boolean } {
  if (rc?.suspected) return { status: 'warn', detail: rc.detail, suspected: true };
  if (rpc.suspected) return { status: 'warn', detail: rpc.detail, suspected: true };
  if (rc) return { status: rc.status, detail: rc.detail, suspected: false };
  return { status: rpc.status, detail: rpc.detail, suspected: false };
}

// ---------- Metaplex Token Metadata ----------
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

/** PDA of the Metaplex metadata account for a mint.
 *  (web3.js v3 has no sync PDA derivation, so this is async.) */
async function metadataPda(mint: PublicKey): Promise<PublicKey> {
  const [pda] = await PublicKey.findProgramAddress(
    [new TextEncoder().encode('metadata'), METADATA_PROGRAM_ID.toBytes(), mint.toBytes()],
    METADATA_PROGRAM_ID,
  );
  return pda;
}

/** Parse the name, symbol, isMutable flag and the off-chain metadata URI
 *  out of a Metaplex Metadata account (Borsh):
 *  key u8 (=4 MetadataV1) | updateAuthority 32 | mint 32 | name String |
 *  symbol String | uri String | sellerFeeBasisPoints u16 |
 *  creators Option<Vec<Creator>> | primarySaleHappened bool | isMutable bool.
 *  Returns null when the layout does not parse (not a metadata account). */
function parseMetadataFields(data: Uint8Array): {
  isMutable: boolean;
  uri: string;
  name: string;
  symbol: string;
} | null {
  let off = 0;
  const need = (n: number): boolean => off + n <= data.length;
  const u8 = (): number => {
    if (!need(1)) throw new Error('oob');
    return data[off++];
  };
  const u16 = (): number => {
    if (!need(2)) throw new Error('oob');
    const v = data[off] | (data[off + 1] << 8);
    off += 2;
    return v;
  };
  const u32 = (): number => {
    if (!need(4)) throw new Error('oob');
    const v = data[off] | (data[off + 1] << 8) | (data[off + 2] << 16) | (data[off + 3] << 24);
    off += 4;
    return v >>> 0;
  };
  const skip = (n: number): void => {
    if (!need(n)) throw new Error('oob');
    off += n;
  };
  const readString = (): string => {
    const len = u32();
    if (!need(len)) throw new Error('oob');
    const s = new TextDecoder().decode(data.subarray(off, off + len));
    off += len;
    return s;
  };
  try {
    if (u8() !== 4) return null;
    skip(32); // update authority
    skip(32); // mint
    const name = readString();
    const symbol = readString();
    const uri = readString();
    u16(); // seller fee basis points
    const hasCreators = u8();
    if (hasCreators === 1) {
      skip(u32() * 34); // address 32 + verified 1 + share 1, per creator
    } else if (hasCreators !== 0) {
      return null;
    }
    u8(); // primarySaleHappened
    return { isMutable: u8() === 1, uri, name, symbol };
  } catch {
    return null;
  }
}

/** Read the Metaplex metadata account of a mint (raw bytes), or null when
 *  there is none / it cannot be read. Shared by the mutability check and
 *  the logo fetch so the account is only read once per scan. */
async function readMetadataAccount(mint: PublicKey): Promise<Uint8Array | null> {
  const pda = await metadataPda(mint);
  const raw = await fetchRawAccount(pda.toBase58());
  if (!raw || raw.owner !== METADATA_PROGRAM_ID.toBase58()) return null;
  return raw.data;
}

/** Token metadata mutability probe (informational only). Immutable = pass;
 *  mutable = warn. Missing/unreadable metadata = INFO, not warn — an
 *  unreadable metadata account says nothing about the token's risk.
 *  Never guesses. */
async function checkMetadataFromData(
  data: Uint8Array | null,
  lang: Lang,
): Promise<{ status: CheckStatus; detail: string }> {
  const t = STRINGS[lang];
  if (data == null) return { status: 'info', detail: t.metadataUnavailable };
  const fields = parseMetadataFields(data);
  if (fields == null) return { status: 'info', detail: t.metadataUnavailable };
  return fields.isMutable
    ? { status: 'warn', detail: t.metadataMutable }
    : { status: 'pass', detail: t.metadataImmutable };
}

/** Token logo URL from the Metaplex metadata URI (best effort, never blocks
 *  the scan). Fetches the off-chain JSON, takes its `image` field, and
 *  converts ipfs:// URIs to an https gateway URL. Returns null when
 *  anything is missing or unreachable — the UI then shows a letter avatar. */
async function fetchTokenLogoFromData(data: Uint8Array | null): Promise<string | null> {
  try {
    if (data == null) return null;
    const fields = parseMetadataFields(data);
    const uri = fields?.uri?.trim();
    if (!uri) return null;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6_000);
    try {
      const res = await fetch(uri, {
        headers: { Accept: 'application/json' },
        signal: ctrl.signal,
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { image?: unknown };
      const image = typeof json.image === 'string' ? json.image.trim() : '';
      if (!image) return null;
      if (image.startsWith('ipfs://')) {
        return `https://ipfs.io/ipfs/${image.slice('ipfs://'.length)}`;
      }
      return image;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

/** Token-2022 extension probe — a PENALTY on the 100-point total.
 *  The mint account's owner tells the program: classic SPL Token program
 *  = no extensions possible (pass). Token-2022 program = parse the TLV
 *  extension list (82-byte base mint + padding, 1-byte discriminator at
 *  offset 165, TLV from 166 — verified on-chain on PYUSD + USDG).
 *  Only the dangerous extensions are reported (spl-token-2022
 *  ExtensionType ids):
 *  1 TransferFeeConfig, 12 PermanentDelegate, 14 TransferHook.
 *  Penalty: Permanent Delegate −15, Transfer Fee −10, Transfer Hook −10
 *  (max −35 when all three are present). Status: fail when any dangerous
 *  extension is present, warn for a Token-2022 mint with no dangerous
 *  extension, pass for a standard SPL mint. An unreadable account or an
 *  unknown owner is a warn with no penalty. Never guesses. */
const TOKEN2022_MAX_PENALTY = 35;
const PENALTY_PERMANENT_DELEGATE = 15;
const PENALTY_TRANSFER_FEE = 10;
const PENALTY_TRANSFER_HOOK = 10;
const TOKEN_2022_PROGRAM_ID = new PublicKey(
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
);
const EXT_TRANSFER_FEE_CONFIG = 1;
const EXT_PERMANENT_DELEGATE = 12;
const EXT_TRANSFER_HOOK = 14;

function parseToken2022Extensions(data: Uint8Array): Set<number> | null {
  try {
    // Layout (VERIFIED on-chain 27 Nov 2026, PYUSD + USDG mints, both
    // 866 bytes, owner Token-2022): base mint 82 bytes, zero padding up
    // to byte 165, a 1-byte account-type discriminator (1 = Mint) at
    // offset 165, then TLV entries from offset 166. Starting at 82
    // reads only zeros and reports "no extensions" — a false negative
    // on exactly the tokens this check exists for. Defensive fallback:
    // if byte 82 is the discriminator instead, TLV starts at 83.
    // A bare 82-byte mint has no extensions at all.
    let off: number;
    if (data.length === 82) return new Set<number>();
    // Exactly 166 bytes with the Mint discriminator at 165 and no TLV
    // entries = a Token-2022 mint with NO extensions — not "unavailable".
    if (data.length === 166 && data[165] === 1) return new Set<number>();
    // L17 — exactly 83 bytes with the Mint discriminator at 82 and no
    // TLV entries = the same clean case one byte shorter (discriminator
    // directly after the 82-byte base mint). It previously fell through
    // to null ("unavailable", warn) instead of an empty set (clean).
    if (data.length === 83 && data[82] === 1) return new Set<number>();
    if (data.length > 166 && data[165] === 1) {
      off = 166;
    } else if (data.length > 83 && data[82] === 1) {
      off = 83;
    } else {
      return null;
    }
    const types = new Set<number>();
    while (off + 4 <= data.length) {
      const type = data[off] | (data[off + 1] << 8);
      const len = data[off + 2] | (data[off + 3] << 8);
      if (type === 0 && len === 0) break; // uninitialized padding
      types.add(type);
      off += 4 + len;
    }
    return types;
  } catch {
    return null;
  }
}

async function checkToken2022(
  mint: PublicKey,
  lang: Lang,
): Promise<{
  status: CheckStatus;
  detail: string;
  penalty: number;
  foundNames: string | null;
  /** Language-independent ids of the dangerous extensions found (used by
   *  the risk summary — never parse the localized detail text). */
  foundIds: Token2022ExtensionId[];
}> {
  const t = STRINGS[lang];
  const unavailable = {
    status: 'warn' as CheckStatus,
    detail: t.token2022Unavailable,
    penalty: 0,
    foundNames: null as string | null,
    foundIds: [] as Token2022ExtensionId[],
  };
  const raw = await fetchRawAccount(mint.toBase58());
  if (raw == null) return unavailable;
  if (raw.owner === TOKEN_PROGRAM_ID.toBase58()) {
    return {
      status: 'pass',
      detail: t.token2022Standard,
      penalty: 0,
      foundNames: null,
      foundIds: [],
    };
  }
  if (raw.owner !== TOKEN_2022_PROGRAM_ID.toBase58()) {
    return unavailable;
  }
  const types = parseToken2022Extensions(raw.data);
  if (types == null) return unavailable;
  let penalty = 0;
  const found: string[] = [];
  const foundIds: Token2022ExtensionId[] = [];
  if (types.has(EXT_PERMANENT_DELEGATE)) {
    found.push(t.extPermanentDelegate);
    foundIds.push('permanent-delegate');
    penalty += PENALTY_PERMANENT_DELEGATE;
  }
  if (types.has(EXT_TRANSFER_FEE_CONFIG)) {
    found.push(t.extTransferFee);
    foundIds.push('transfer-fee');
    penalty += PENALTY_TRANSFER_FEE;
  }
  if (types.has(EXT_TRANSFER_HOOK)) {
    found.push(t.extTransferHook);
    foundIds.push('transfer-hook');
    penalty += PENALTY_TRANSFER_HOOK;
  }
  if (found.length === 0)
    return {
      status: 'warn',
      detail: t.token2022Clean,
      penalty: 0,
      foundNames: null,
      foundIds: [],
    };
  return {
    status: 'fail',
    detail: t.token2022Found(found.join(', ')),
    penalty,
    foundNames: found.join(', '),
    foundIds,
  };
}

// DexScreener dexIds for launchpads whose tokens still sit on a bonding
// curve (no traditional LP yet) — for those, the LP Burn/Lock check does
// not apply and is skipped instead of reporting a misleading warn.
const BONDING_CURVE_DEX_IDS = new Set(['pumpfun', 'moonshot']);

/** Sellability / honeypot probe via the Jupiter Swap API V1 (lite-api.jup.ag,
 *  free, no key). Asks Jupiter for a route selling ~$1 worth of the token
 *  for SOL (priceUsd from DexScreener; falls back to 1 whole token when no
 *  price is known). A fixed 1-token probe is dust for cheap memecoins and
 *  can return "no route" for a perfectly sellable token — a false honeypot
 *  flag. Since v7.8 the Cloudflare proxy is tried FIRST
 *  (GET <proxy>/jupiter/quote?...), so the browser never calls
 *  lite-api.jup.ag directly (CORS/timeouts); the direct lite-api endpoint
 *  is the fallback. Each URL gets up to 2 attempts: a transient 429/5xx
 *  is retried once on the same URL, a 4xx or malformed body moves on to
 *  the next URL. Returns true when at least one route exists, false when
 *  Jupiter answers with no route, and null when the API itself is
 *  unreachable/errors. Informational only — never affects the 100-point
 *  score. NOTE: v1 (lite-api) returns the quote object at the TOP LEVEL
 *  (outAmount / routePlan / priceImpactPct), with no `data: [...]`
 *  wrapper — unlike the sunset v6 API. A "no route" answer is an HTTP 400
 *  whose error mentions routes, and must be read as false, not as an
 *  API failure. */
async function checkSellable(
  mint: string,
  decimals: number,
  priceUsd: number | null,
): Promise<boolean | null> {
  const tokens =
    priceUsd != null && priceUsd > 0 ? 1 / priceUsd : 1; // ~$1 worth, or 1 token
  // L18 — BigInt amount, clamped to u64 max: the old
  // String(Math.max(1, Math.floor(tokens * 10 ** decimals))) overflowed
  // Jupiter's u64 for prices ≲5e-11 and produced exponential notation
  // ("1e+21") at ≲1e-12, so Jupiter 400'd exactly for the near-dead
  // tokens this check matters most for. A non-finite product clamps to
  // u64 max as well (never BigInt(Infinity), which throws).
  const U64_MAX = (1n << 64n) - 1n;
  const approx = tokens * 10 ** decimals;
  let amountBig: bigint;
  if (!Number.isFinite(approx)) amountBig = U64_MAX;
  else if (approx < 1) amountBig = 1n;
  else amountBig = BigInt(Math.floor(approx));
  if (amountBig > U64_MAX) amountBig = U64_MAX;
  const amount = amountBig.toString();
  const query =
    `inputMint=${mint}&outputMint=${SOL_MINT}&amount=${amount}&slippageBps=100`;
  const urls = [
    `${PROXY_URL}/jupiter/quote?${query}`,
    `https://lite-api.jup.ag/swap/v1/quote?${query}`,
  ];
  for (const url of urls) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10_000);
      try {
        const res = await fetch(url, {
          headers: { Accept: 'application/json' },
          signal: ctrl.signal,
        });
        if (res.ok) {
          const json = (await res.json()) as {
            outAmount?: unknown;
            routePlan?: unknown;
          };
          if (
            // v7.10 (B3) — accept outAmount as a string OR a JSON number;
            // a numeric outAmount is still a valid quote, not malformed.
            (typeof json.outAmount !== 'string' && typeof json.outAmount !== 'number') ||
            !Array.isArray(json.routePlan)
          )
            break; // malformed — try the next URL
          return json.routePlan.length > 0;
        }
        // Non-2xx: a 400 "No routes found" is a real answer (unsellable),
        // not an API failure — read the body before deciding.
        if (res.status === 400) {
          const text = await res.text().catch(() => '');
          if (/no\s*routes?/i.test(text)) return false;
          break; // other 4xx is a bad request — move to the next URL
        }
        // HTTP error: retry a transient 429/5xx once; a 4xx is a bad
        // request that a retry will not fix — move to the next URL.
        if (res.status !== 429 && res.status < 500) break;
      } catch {
        // Network error / timeout — retry once, then next URL.
      } finally {
        clearTimeout(timer);
      }
    }
  }
  return null;
}

// ---------- Scoring ----------
// Total 100 points. Higher = safer.
//   Mint authority    20 pts  — revoked = safe, active = dev can print more tokens.
//   Freeze authority  20 pts  — revoked = safe, active = dev can freeze any wallet.
//   Holder spread     30 pts  — top-10 share of supply.
//   Liquidity/market  30 pts  — pool liquidity (15) + pair age (8) + 24h volume (7).
// The Jupiter sellability check is INFORMATIONAL and does not add points.

function scoreConcentration(top10Pct: number | null, top1Pct: number | null): number {
  // v7.5 — neutral default: when holder data cannot be read (RPC rate
  // limit / outage), that is the RPC's failure, not the token's — a solid
  // token must not crash to 0/30 for it. The 79-point total cap in
  // scanToken() is the guardrail that keeps this honest: the token can
  // never show a green Safe verdict on unverified distribution.
  if (top10Pct == null) return 15;
  if (top1Pct != null && top1Pct > 50) return 0; // single wallet controls the majority
  if (top10Pct < 20) return 30;
  if (top10Pct < 30) return 24;
  if (top10Pct < 40) return 18;
  if (top10Pct < 50) return 10;
  if (top10Pct < 70) return 5;
  return 0;
}

/** Liquidity/market sub-scores: pool liquidity (15) + pair age (8) + 24h volume (7). */
function scoreLiquidityParts(
  liquidityUsd: number | null,
  pairAgeDays: number | null,
  volume24hUsd: number | null,
): { total: number; liq: number; age: number; vol: number } {
  let liq = 0;
  if (liquidityUsd != null) {
    if (liquidityUsd >= 1_000_000) liq = 15;
    else if (liquidityUsd >= 250_000) liq = 12;
    else if (liquidityUsd >= 50_000) liq = 8;
    else if (liquidityUsd >= 10_000) liq = 4;
  }
  let age = 0;
  if (pairAgeDays != null) {
    if (pairAgeDays >= 90) age = 8;
    else if (pairAgeDays >= 30) age = 6;
    else if (pairAgeDays >= 7) age = 3;
  }
  let vol = 0;
  if (volume24hUsd != null) {
    if (volume24hUsd >= 100_000) vol = 7;
    else if (volume24hUsd >= 10_000) vol = 5;
    else if (volume24hUsd >= 1_000) vol = 2;
  }
  return { total: liq + age + vol, liq, age, vol };
}

function verdictFor(score: number): Verdict {
  if (score >= 80) return 'Aman';
  if (score >= 50) return 'Waspada';
  return 'Berisiko Tinggi';
}

function statusFor(points: number, max: number): CheckStatus {
  if (points >= max) return 'pass';
  if (points >= max * 0.4) return 'warn';
  return 'fail';
}

export function fmtUsd(n: number | null | undefined, lang: Lang): string {
  if (n == null || Number.isNaN(n)) return '—';
  const t = STRINGS[lang];
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)} ${t.million}`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)} ${t.thousand}`;
  // M18 — tiny prices must never render as "$0.00": below $0.01 use up
  // to 10 decimal places with trailing zeros trimmed (same shape as the
  // App's formatter), and below 1e-10 use 3 significant digits so a
  // nonzero price never collapses to "$0". Normal prices (≥ $0.01) are
  // byte-identical to before.
  if (n > 0 && n < 0.01) {
    if (n < 1e-10) {
      const decimals = 2 - Math.floor(Math.log10(n)); // 3 significant digits
      return `$${n.toFixed(decimals).replace(/0+$/, '').replace(/\.$/, '')}`;
    }
    return `$${n.toFixed(10).replace(/0+$/, '').replace(/\.$/, '')}`;
  }
  return `$${n.toFixed(2)}`;
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toFixed(1)}%`;
}

/** Full scan: on-chain mint data + holder concentration + DexScreener market
 *  data + Jupiter sellability + Raydium LP burn/lock + metadata mutability
 *  + Token-2022 extensions + token logo. A pasted pair/pool address is
 *  resolved to its base token mint first (reported via resolvedFromPair).
 *  The 100-point scoring model is mint 20 + freeze 20 + holders 30 +
 *  liquidity 30, MINUS the Token-2022 penalty (max −35, floor 0); the LP
 *  and metadata checks are informational only. The top-10 holder calculation excludes the verified
 *  pool vault, the DexScreener pair account, the incinerator's token
 *  account, and the associated token accounts of verified centralized-
 *  exchange wallets (Solscan-labeled) — pool/burned/exchange supply is not
 *  a single whale. */
/** v7.12 — fresh-wallet share among the top holders (secondary step,
 *  runs AFTER the main score renders — never on the scan's critical
 *  path). A holder is "fresh" when its FIRST on-chain activity is less
 *  than 7 days ago: getSignaturesForAddress returns newest-first, so we
 *  page backward (limit 100) until a short batch proves we reached the
 *  beginning. Wallets whose history is deeper than the page cap (3
 *  pages = 300 signatures) count as "unknown", not fresh — a wallet
 *  with 300+ lifetime transactions is not a throwaway fresh wallet, but
 *  its exact first-activity date is out of cheap reach.
 *  M10 — the input addresses are TOKEN ACCOUNTS (from
 *  getTokenLargestAccounts), not wallets: each account's OWNER wallet
 *  is resolved first (getAccountInfo → owner) and the WALLET's history
 *  is paged. A 5-year-old wallet that first bought 3 days ago is not
 *  "fresh" — the old code measured the token account's age instead.
 *  H2 — only the TOP 5 holders are checked (was 10): 5 wallets ×
 *  (1 owner read + ≤3 sig pages) ≈ 20 calls worst case, and the
 *  secondaries are staggered behind the main scan. H2 — `opts` aborts
 *  the loops promptly on cancellation / deadline (a default 60s
 *  deadline applies when the caller passes none). Cost: usually 1–2
 *  calls per wallet (fresh/insider wallets have short histories);
 *  capped at 3 sig pages per wallet, wallets checked one at a time so
 *  the burst stays small. */
export async function checkFreshWallets(
  addresses: string[],
  opts?: CheckAbortOpts,
): Promise<{ fresh: number; checked: number; unknown: number; total: number }> {
  const FRESH_DAYS = 7;
  const MAX_PAGES = 3;
  const PAGE_SIZE = 100;
  const cutoff = Date.now() - FRESH_DAYS * 86_400_000;
  // H2 — top 5 only, even if the caller passes all 10.
  const list = addresses.slice(0, 5);
  const effectiveOpts: CheckAbortOpts = {
    isCancelled: opts?.isCancelled,
    deadlineMs: opts?.deadlineMs ?? Date.now() + 60_000,
  };

  async function firstActivity(
    address: string,
  ): Promise<number | null | 'unknown'> {
    try {
      let before: string | undefined;
      for (let page = 0; page < MAX_PAGES; page++) {
        if (shouldStop(effectiveOpts)) return 'unknown';
        const batch =
          (await rpcCallAny<{ signature: string; blockTime?: number | null }[]>(
            'getSignaturesForAddress',
            [address, { limit: PAGE_SIZE, before, commitment: 'confirmed' }],
          )) ?? [];
        if (batch.length === 0) {
          // No signatures at all — no on-chain activity to judge.
          return null;
        }
        if (batch.length < PAGE_SIZE) {
          // Reached the beginning — the LAST tx of this batch is the
          // first activity. M10 sub-bug: a null blockTime there means
          // the first-activity date is UNKNOWN — it must not keep an
          // older page's newer timestamp (that read as false "fresh").
          const last = batch[batch.length - 1];
          return last.blockTime != null ? last.blockTime * 1000 : 'unknown';
        }
        before = batch[batch.length - 1].signature;
      }
      return 'unknown'; // history deeper than the cap
    } catch {
      return 'unknown';
    }
  }

  // Resolve each token account to its owner wallet first (M10) — one
  // read per holder, in parallel; an unresolvable owner is "unknown",
  // never silently scored as the token account's age.
  if (shouldStop(effectiveOpts)) {
    return { fresh: 0, checked: 0, unknown: list.length, total: list.length };
  }
  const owners = await Promise.all(
    list.map((a) => getTokenAccountOwner(a).catch(() => null)),
  );
  let fresh = 0;
  let checked = 0;
  let unknown = 0;
  for (let i = 0; i < list.length; i++) {
    if (shouldStop(effectiveOpts)) break;
    const owner = owners[i];
    if (owner == null) {
      unknown++;
      continue;
    }
    const r = await firstActivity(owner);
    if (r === 'unknown') unknown++;
    else {
      checked++;
      if (r != null && r >= cutoff) fresh++;
    }
    if (shouldStop(effectiveOpts)) break;
  }
  return { fresh, checked, unknown, total: list.length };
}

/** One inter-wallet transfer of the scanned mint (owner → owner). */
export interface InterWalletTransfer {
  from: string;
  to: string;
  /** True when `from` funded 2+ of the checked top holders — the
   *  shared-source pattern behind a slow-split cluster. */
  sharedSource: boolean;
  /** Block time (ms) of the EARLIEST transaction this edge was seen in
   *  (v7.12.6: the "within 7 days of launch" amber rule needs it). */
  blockTimeMs: number | null;
}

export interface InterWalletResult {
  /** Distinct checked holders appearing in a transfer (sender or receiver). */
  involved: number;
  /** Holders whose history could be read (sig list fetched). */
  checked: number;
  /** Holders whose history could not be read at all. */
  unknown: number;
  total: number;
  /** v7.12.6 — true ONLY when the shared-source pattern is genuinely
   *  suspicious: the shared source IS the token creator, or ≥2 holders
   *  received tokens from the shared source within 7 days of pair
   *  creation. Otherwise a shared source is a common distributor /
   *  market-maker pattern on large tokens — neutral, never amber. */
  suspicious: boolean;
  /** Up to 3 concrete edges, shared-source edges first. */
  examples: InterWalletTransfer[];
}

/** v7.12.5 — post-launch inter-wallet transfers (wallet clustering,
 *  limited scope, secondary step: runs AFTER the main score renders,
 *  never blocks the scan, informational only, never changes the score).
 *  The v7.6 bundle check only sees simultaneous buys AT launch; this
 *  covers the slow-split pattern: a top holder quietly moving the token
 *  to other wallets after launch so the split evades the Top Holders
 *  radar.
 *
 *  Method: for each of the top-5 holder TOKEN ACCOUNTS (already
 *  CEX/pool-vault/burn-filtered by readTopHolders), read its 10 most
 *  recent signatures, fetch those transactions (jsonParsed), and look
 *  for TOP-LEVEL token-program `transfer` / `transferChecked`
 *  instructions of this mint involving that account. A genuine
 *  wallet-to-wallet transfer is a top-level token instruction; swaps
 *  move tokens via CPI (inner instructions under the AMM/aggregator
 *  program), so buying from a pool never looks like a split — no
 *  program denylist needed. Owners come from the transaction's token
 *  balance entries (account → owner).
 *  Only transactions at/after `sinceMs` (pair creation, when known)
 *  count, so pre-launch funding is not mistaken for post-launch splits.
 *  A sender that funded 2+ checked holders is flagged as a shared
 *  source.
 *  v7.12.6 — the card NO LONGER goes amber on any shared source: that
 *  cried wolf on legit large tokens (BONK probed 5/5 from one shared
 *  source — most likely a distributor/market maker). Amber ONLY when
 *  the pattern is genuinely suspicious: (a) the shared source IS the
 *  token creator (`creator` param, from RugCheck), or (b) ≥2 holders
 *  received tokens from the shared source within 7 days of pair
 *  creation. Otherwise the same count shows as neutral/informational.
 *  Cost: 5 holders × (1 sig call + ≤10 tx calls) ≈ 55 calls worst case,
 *  holders 2 at a time, tx fetches in batches of 3 — inside the proxy's
 *  120 req/min limit. Returns null when nothing could be read. */
export async function checkInterWalletTransfers(
  mint: string,
  holderAccounts: string[],
  sinceMs: number | null,
  creator: string | null = null,
  opts?: CheckAbortOpts,
): Promise<InterWalletResult | null> {
  type BalanceEntry = {
    accountIndex?: number;
    mint: string;
    owner: string;
    uiTokenAmount: { amount: string };
  };
  type TxParsed = {
    blockTime?: number | null;
    transaction?: {
      message?: {
        accountKeys?: ({ pubkey: string } | string)[];
        instructions?: {
          programId: string;
          parsed?: {
            type?: string;
            info?: { mint?: string; source?: string; destination?: string };
          };
        }[];
      };
    };
    meta?: {
      err?: unknown;
      preTokenBalances?: BalanceEntry[];
      postTokenBalances?: BalanceEntry[];
    } | null;
  };

  const edges = new Map<string, InterWalletTransfer>();
  // Owner of each checked holder account (resolved from the balance
  // entries of its own transactions — a token account's owner is the
  // wallet that holds it).
  const ownerOfHolder = new Map<string, string>();
  let checked = 0;
  let unknown = 0;
  // H2 — abort promptly on cancellation / deadline (default 60s when
  // the caller passes none); a stopped run returns null (unavailable)
  // instead of burning the rest of the RPC budget on a stale result.
  const effectiveOpts: CheckAbortOpts = {
    isCancelled: opts?.isCancelled,
    deadlineMs: opts?.deadlineMs ?? Date.now() + 60_000,
  };
  let stopped = false;

  // Per-holder: sig list → txs → owner deltas → edges. Holders 2 at a
  // time so the burst stays small; tx fetches in batches of 3.
  async function checkHolder(account: string): Promise<void> {
    if (shouldStop(effectiveOpts)) {
      stopped = true;
      return;
    }
    let sigs: { signature: string }[];
    try {
      sigs =
        (await rpcCallAny<{ signature: string }[]>('getSignaturesForAddress', [
          account,
          { limit: 10, commitment: 'confirmed' },
        ])) ?? [];
    } catch {
      unknown++;
      return;
    }
    checked++;
    if (sigs.length === 0) return;
    const txs: TxParsed[] = [];
    for (let i = 0; i < sigs.length; i += 3) {
      if (shouldStop(effectiveOpts)) {
        stopped = true;
        return;
      }
      const results = await Promise.all(
        sigs.slice(i, i + 3).map((s) =>
          rpcCallAny<TxParsed>('getTransaction', [
            s.signature,
            {
              encoding: 'jsonParsed',
              maxSupportedTransactionVersion: 1,
              commitment: 'confirmed',
            },
          ]).catch(() => null),
        ),
      );
      for (const r of results) if (r) txs.push(r);
    }
    // A genuine wallet-to-wallet transfer is a TOP-LEVEL token-program
    // `transfer` / `transferChecked` instruction of this mint involving
    // this holder account. Swaps move tokens via CPI (inner instructions
    // under the AMM/aggregator program), so a buy from a pool never
    // looks like a split. Owners come from the tx's token balances.
    const TOKEN_PROGRAMS = new Set([
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // SPL Token
      'TokenzQdBNbLqP5VEhdkAS6EPFlC1PHnBqCXEpPxuEb', // Token-2022
    ]);
    for (const tx of txs) {
      if (tx.meta?.err) continue; // failed tx changed no balance
      if (
        sinceMs != null &&
        tx.blockTime != null &&
        tx.blockTime * 1000 < sinceMs
      )
        continue; // pre-launch — funding, not a post-launch split
      const keys = tx.transaction?.message?.accountKeys ?? [];
      const accountOf = (idx: number | undefined): string | null => {
        if (idx == null) return null;
        const key = keys[idx];
        if (key == null) return null;
        return typeof key === 'string' ? key : (key.pubkey ?? null);
      };
      // Token account → owner, from this mint's balance entries.
      const ownerOf = new Map<string, string>();
      for (const b of [
        ...(tx.meta?.preTokenBalances ?? []),
        ...(tx.meta?.postTokenBalances ?? []),
      ]) {
        if (b.mint !== mint) continue;
        const acct = accountOf(b.accountIndex);
        if (acct != null) ownerOf.set(acct, b.owner);
      }
      const holderOwner = ownerOf.get(account);
      if (holderOwner) ownerOfHolder.set(account, holderOwner);
      // v7.12.6 — the tx's block time, for the "within 7 days of launch"
      // amber rule (earliest transfer per edge wins — see below).
      const txMs = tx.blockTime != null ? tx.blockTime * 1000 : null;
      for (const ix of tx.transaction?.message?.instructions ?? []) {
        if (!TOKEN_PROGRAMS.has(ix.programId)) continue;
        const parsed = ix.parsed;
        if (
          !parsed ||
          (parsed.type !== 'transfer' && parsed.type !== 'transferChecked')
        )
          continue;
        const info = parsed.info ?? {};
        // `transfer` (legacy) carries no mint — the holder-account match
        // below already proves it is this mint's token account.
        if (parsed.type === 'transferChecked' && info.mint !== mint) continue;
        const source = info.source;
        const dest = info.destination;
        if (typeof source !== 'string' || typeof dest !== 'string') continue;
        if (source !== account && dest !== account) continue;
        const from = ownerOf.get(source);
        const to = ownerOf.get(dest);
        if (!from || !to || from === to) continue; // unknown / self-transfer
        const key = `${from}>${to}`;
        const existing = edges.get(key);
        if (!existing) {
          edges.set(key, { from, to, sharedSource: false, blockTimeMs: txMs });
        } else if (
          txMs != null &&
          (existing.blockTimeMs == null || txMs < existing.blockTimeMs)
        ) {
          // Same pair, earlier transfer: the earliest receipt is the
          // signal for the 7-day rule, so keep the oldest timestamp.
          existing.blockTimeMs = txMs;
        }
      }
    }
  }

  for (let i = 0; i < holderAccounts.length; i += 2) {
    if (shouldStop(effectiveOpts)) {
      stopped = true;
      break;
    }
    await Promise.all(holderAccounts.slice(i, i + 2).map((a) => checkHolder(a)));
  }
  if (stopped) return null;
  if (checked === 0) return null;

  // Shared source: one sender that funded 2+ distinct checked holder
  // accounts. M13 — holder senders are NOT exempt: a creator / top
  // holder that split to 2+ other top holders is exactly the pattern
  // this rule exists to catch, and the old exemption hid it.
  const fundedBy = new Map<string, Set<string>>();
  for (const e of edges.values()) {
    const set = fundedBy.get(e.from) ?? new Set<string>();
    for (const [acct, owner] of ownerOfHolder) {
      if (owner === e.to) set.add(acct);
    }
    fundedBy.set(e.from, set);
  }
  for (const e of edges.values()) {
    if ((fundedBy.get(e.from)?.size ?? 0) >= 2) e.sharedSource = true;
  }
  // v7.12.6 — amber ONLY when genuinely suspicious:
  // (a) the shared source IS the token creator, or
  // (b) ≥2 distinct holders received tokens from a shared source within
  // 7 days of pair creation. Anything else — e.g. a distributor or
  // market maker feeding a large token's top holders years after launch —
  // is neutral, never amber.
  const sharedSenders = new Set<string>();
  for (const e of edges.values()) if (e.sharedSource) sharedSenders.add(e.from);
  let suspicious = creator != null && sharedSenders.has(creator);
  if (!suspicious && sinceMs != null) {
    const windowEndMs = sinceMs + 7 * 86_400_000;
    const earlyReceivers = new Set<string>();
    for (const e of edges.values()) {
      if (!e.sharedSource) continue;
      if (e.blockTimeMs == null || e.blockTimeMs > windowEndMs) continue;
      earlyReceivers.add(e.to);
    }
    suspicious = earlyReceivers.size >= 2;
  }
  // Distinct checked holder accounts appearing in an edge.
  const involvedAccounts = new Set<string>();
  for (const e of edges.values()) {
    for (const [acct, owner] of ownerOfHolder) {
      if (owner === e.from || owner === e.to) involvedAccounts.add(acct);
    }
  }
  const sorted = [...edges.values()].sort(
    (a, b) => Number(b.sharedSource) - Number(a.sharedSource),
  );
  return {
    involved: involvedAccounts.size,
    checked,
    unknown,
    total: holderAccounts.length,
    suspicious,
    examples: sorted.slice(0, 3),
  };
}

/** v7.12.6 — token creator wallet from the RugCheck report (the
 *  `creator` field). Secondary-step helper for the inter-wallet check:
 *  the main scan fetches RugCheck only for young tokens, so old tokens
 *  (e.g. BONK) have no creator on hand — this fetches it on demand.
 *  Proxy first, direct fallback, 8s per URL (same pattern as
 *  checkLpUnlocks). Null when the report cannot be read or has no
 *  creator — the amber rule then simply never fires on (a). */
export async function fetchRugCheckCreator(mint: string): Promise<string | null> {
  type RugCheckReport = {
    creator?: string | null;
    error?: unknown;
  };
  const REPORT_URLS = [
    `${PROXY_URL}/rugcheck/${mint}`,
    `https://api.rugcheck.xyz/v1/tokens/${mint}/report`,
  ];
  for (const url of REPORT_URLS) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8_000);
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: ctrl.signal,
      });
      if (!res.ok) continue;
      const parsed = (await res.json()) as RugCheckReport;
      if (parsed != null && typeof parsed === 'object' && parsed.error != null) continue;
      return typeof parsed.creator === 'string' && parsed.creator.length > 0
        ? parsed.creator
        : null;
    } catch {
      // try the next URL
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

/** v7.12 — LP unlock countdown: pure parser for a RugCheck report's
 *  `lockers` map. Returns the NEAREST future unlock (unlockDate is a
 *  unix-seconds timestamp). unlockDate 0 = no unlock date (permanent
 *  lock); past dates = already unlocked. Null = no future unlock.
 *  Kept pure so the warning path is unit-testable without a network
 *  fetch (see scripts/probe-f6-tmp.ts evidence in TEST-RESULTS.md). */
export function parseLpLockers(
  lockers: Record<string, { unlockDate?: number; type?: string }> | null | undefined,
  nowMs = Date.now(),
): { unlockAtMs: number; lockerType: string; lockerCount: number } | null {
  if (lockers == null) return null;
  let best: { unlockAtMs: number; lockerType: string } | null = null;
  let futureCount = 0;
  // L21 — seconds-range validation: RugCheck's unlockDate is unix
  // SECONDS, but a millisecond value would be multiplied by 1000 again
  // (year ~59000 countdown). Values ≥1e12 are treated as milliseconds
  // (a seconds value that large is year 33658+); values between the
  // year-2100 seconds bound and 1e12 are absurd in either unit and are
  // rejected; anything past year 2100 even as milliseconds is rejected.
  // Live RugCheck data is clean — this is defensive only.
  const MAX_SECONDS = 4_102_444_800; // 2100-01-01T00:00:00Z
  for (const l of Object.values(lockers)) {
    const ud = typeof l.unlockDate === 'number' ? l.unlockDate : 0;
    if (ud <= 0) continue; // no unlock date (permanent lock)
    let ms: number;
    if (ud >= 1e12) {
      ms = ud; // already milliseconds
    } else if (ud > MAX_SECONDS) {
      continue; // absurd: past 2100 as seconds, before 2001 as ms
    } else {
      ms = ud * 1000;
    }
    if (ms > MAX_SECONDS * 1000) continue; // past year 2100 — absurd
    if (ms <= nowMs) continue; // already unlocked
    futureCount++;
    if (!best || ms < best.unlockAtMs)
      best = { unlockAtMs: ms, lockerType: l.type ?? 'locker' };
  }
  if (!best) return null;
  return { unlockAtMs: best.unlockAtMs, lockerType: best.lockerType, lockerCount: futureCount };
}

/** v7.12 — LP unlock countdown (secondary step): fetches the RugCheck
 *  report (same URLs as the insider signal — proxy first, direct
 *  fallback, 10s per URL) and returns the nearest future LP unlock.
 *  Null when there is no future unlock, no lockers, or the report
 *  cannot be read — the UI then shows nothing (no noise). The caller
 *  gates this to tokens whose LP is not effectively burned (≥95% per
 *  the LP check's own line) and not on a bonding curve. */
export async function checkLpUnlocks(
  mint: string,
  opts?: CheckAbortOpts,
): Promise<{ unlockAtMs: number; lockerType: string; lockerCount: number } | null> {
  // v7.13 (H2) — honour the same cancellation/deadline opts as the other
  // secondary checks; a stale LP fetch must not overwrite a newer result.
  type RugCheckReport = {
    lockers?: Record<string, { unlockDate?: number; type?: string }> | null;
    error?: unknown;
  };
  const REPORT_URLS = [
    `${PROXY_URL}/rugcheck/${mint}`,
    `https://api.rugcheck.xyz/v1/tokens/${mint}/report`,
  ];
  if (shouldStop(opts)) return null;
  let json: RugCheckReport | null = null;
  for (const url of REPORT_URLS) {
    if (shouldStop(opts)) return null;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10_000);
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: ctrl.signal,
      });
      if (!res.ok) continue;
      const parsed = (await res.json()) as RugCheckReport;
      if (parsed != null && typeof parsed === 'object' && parsed.error != null) continue;
      json = parsed;
      break;
    } catch {
      // try the next URL
    } finally {
      clearTimeout(timer);
    }
  }
  if (json == null) return null;
  return parseLpLockers(json.lockers);
}

export async function scanToken(mintAddress: string, lang: Lang = 'en'): Promise<ScanResult> {
  const t = STRINGS[lang];
  // Map a malformed address to the friendly translated message instead of
  // web3.js's raw "Invalid public key input". (The UI validates base58 first,
  // so this is defense-in-depth for direct/CLI callers.)
  // 1) On-chain mint account (supply, decimals, authorities).
  // If the address is not a mint, it may be a pair/pool address — try to
  // resolve it to its base token via DexScreener and scan that instead
  // (one level only, no recursion). H3 — this ALSO runs on
  // mint-not-found, not only on not-a-mint: DexScreener lowercases the
  // pair address in its URLs, so a pasted pair link extracts a
  // lowercased address that exists as no account on-chain, and the pair
  // lookup (by URL) is the only way to recover the real mint. When the
  // base token cannot be found, a not-a-mint keeps the specific
  // pair-guidance error while a genuinely missing mint keeps the
  // original "no account" error — never a generic "not found".
  let mint: PublicKey;
  try {
    mint = new PublicKey(mintAddress.trim());
  } catch {
    throw new Error(t.invalidError);
  }
  let resolvedFromPair: string | null = null;
  let mintData: Awaited<ReturnType<typeof readMint>>;
  try {
    mintData = await readMint(mint, lang);
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === t.notMintError || err.message === t.mintNotFoundError)
    ) {
      const base = await resolvePairBaseToken(mintAddress.trim());
      if (!base) {
        // Pair lookup failed: a not-a-mint address gets the
        // pair-guidance error; a genuinely missing mint keeps the
        // original "no account" error.
        throw err.message === t.notMintError ? new Error(t.pairGuidanceError) : err;
      }
      resolvedFromPair = mintAddress.trim();
      mint = new PublicKey(base);
      mintData = await readMint(mint, lang);
    } else {
      throw err;
    }
  }
  const effectiveMint = mint.toBase58();
  const supplyRaw = mintData.supply * 10 ** mintData.decimals;

  // 2) Market data from DexScreener (best effort) — needed before the pool
  //    derivation, because the pool vault exclusion depends on the pair.
  let pair: DexPair | null = null;
  let totalLiquidityUsd: number | null = null;
  let totalVolume24hUsd: number | null = null;
  let dexError = false;
  try {
    const market = await fetchDexPair(effectiveMint);
    pair = market.pair;
    totalLiquidityUsd = market.totalLiquidityUsd;
    totalVolume24hUsd = market.totalVolume24hUsd;
  } catch {
    dexError = true;
  }
  // Price now, because the Jupiter probe (step 4) is sized to ~$1 of it.
  const priceUsd = pair?.priceUsd != null ? Number(pair.priceUsd) : null;

  // 3) AMM pool derivation (best effort): pool vault for the holder
  //    exclusion + LP mint for the burn/lock check. Raydium AMM v4,
  //    PumpSwap AMM, Orca Whirlpool and Meteora DLMM all expose their
  //    reserve vaults; anything else reports "cannot be checked"
  //    honestly.
  let poolInfo: AmmPoolInfo | null = null;
  let poolVaultAddress: string | null = null;
  if (pair?.pairAddress) {
    if (pair.dexId === 'raydium') {
      poolInfo = await readRaydiumPool(
        pair.pairAddress,
        pair.baseToken?.address,
        pair.quoteToken?.address,
      ).catch(() => null);
    } else if (pair.dexId === 'pumpswap') {
      poolInfo = await readPumpSwapPool(
        pair.pairAddress,
        pair.baseToken?.address,
        pair.quoteToken?.address,
      ).catch(() => null);
    } else if (pair.dexId === 'orca') {
      // M12 — Orca Whirlpool vaults were never excluded from the top-10
      // (only Raydium/PumpSwap derived vaults); a Whirlpool vault can
      // hold a large share and read as a whale.
      poolInfo = await readOrcaPool(
        pair.pairAddress,
        pair.baseToken?.address,
        pair.quoteToken?.address,
      ).catch(() => null);
    } else if (pair.dexId === 'meteora') {
      // M12 — same for Meteora DLMM reserve vaults.
      poolInfo = await readMeteoraPool(
        pair.pairAddress,
        pair.baseToken?.address,
        pair.quoteToken?.address,
      ).catch(() => null);
    }
    if (poolInfo) {
      // Which vault holds the scanned token?
      const vault =
        pair.baseToken?.address === effectiveMint
          ? poolInfo.baseVault
          : pair.quoteToken?.address === effectiveMint
            ? poolInfo.quoteVault
            : null;
      if (vault) {
        // Verify the vault really is a token account of the scanned mint
        // before excluding it — never exclude on an unverified guess.
        const vaultMint = await getTokenAccountMint(vault).catch(() => null);
        if (vaultMint === effectiveMint) poolVaultAddress = vault;
      }
    }
  }

  // Bonding-curve launchpad tokens have no traditional LP yet — the LP
  // Burn/Lock check does not apply and is skipped (INFO, not a warn).
  // Same for Orca and Meteora pairs: both use concentrated liquidity
  // (NFT positions / DLMM), not a fungible LP token, so there is no LP
  // token that could be burned.
  const isBondingCurve = pair != null && BONDING_CURVE_DEX_IDS.has(pair.dexId ?? '');
  const isOrcaPair = pair?.dexId === 'orca';
  const isMeteoraPair = pair?.dexId === 'meteora';
  const lpCheckP: Promise<{
    status: CheckStatus;
    detail: string;
    burnedPct: number | null;
    top1Pct: number | null;
  }> = isBondingCurve
    ? Promise.resolve({
        status: 'na' as CheckStatus,
        detail: t.lpBondingCurve,
        burnedPct: null,
        top1Pct: null,
      })
    : isOrcaPair
      ? Promise.resolve({
          status: 'na' as CheckStatus,
          detail: t.lpOrca,
          burnedPct: null,
          top1Pct: null,
        })
      : isMeteoraPair
        ? Promise.resolve({
            status: 'na' as CheckStatus,
            detail: t.lpMeteora,
            burnedPct: null,
            top1Pct: null,
          })
        : checkLpBurn(poolInfo, lang);

  // 4) Holder concentration + sellability + LP + metadata + logo +
  //    Token-2022 extensions — best effort, in parallel; a failure in any
  //    one must not kill the whole scan. Top-10 exclusions: the verified
  //    pool vault, the DexScreener pair account, the incinerator's token
  //    account (burned supply is not a whale), and the associated token
  //    accounts of verified exchange wallets (an exchange holds tokens
  //    for thousands of users). The vault exclusion is only attempted
  //    when the vault was verified; otherwise the holder check shows the
  //    pool footnote. The metadata account is read once and shared by the
  //    mutability check and the logo fetch.
  // Pure local PDA derivation (constant seeds + a valid mint) — cannot
  // fail in practice, but guarded anyway: one source must never block
  // the whole result (item 10, partial fallback).
  const burnAta: string | null = await burnTokenAccountAddress(mint).catch(() => null);
  const cexAtas = (
    await Promise.all(
      CEX_WALLETS.map((w) =>
        associatedTokenAccountAddress(new PublicKey(w.address), mint).catch(() => null),
      ),
    )
  ).filter((a): a is string => a != null);
  const excludeAddresses = [
    poolVaultAddress,
    pair?.pairAddress ?? null,
    burnAta,
    ...cexAtas,
  ].filter((a): a is string => a != null);
  const metadataDataP = readMetadataAccount(mint);
  // v7.6 — RugCheck insider signal, young tokens only (the full report of
  // an old, busy token is megabytes and the bundle question is moot for it).
  const isYoungToken =
    pair?.pairCreatedAt != null && Date.now() - pair.pairCreatedAt < 7 * 86_400_000;
  const [holders, sellable, lpCheck, metadataCheck, token2022Check, metaLogoUrl, metadataFields, bundleCheckRpc, bundleCheckRc] =
    await Promise.all([
      readTopHolders(mint, supplyRaw, excludeAddresses).catch(() => null),
      checkSellable(effectiveMint, mintData.decimals, priceUsd),
      // L20 — every branch is guarded: lpCheckP and the three
      // metadataDataP branches previously had no .catch, so a throw
      // there (e.g. PDA derivation) rejected the whole Promise.all
      // and killed the scan instead of degrading one card.
      lpCheckP.catch(() => ({
        status: 'info' as CheckStatus,
        detail: t.lpUnavailable,
        burnedPct: null,
        top1Pct: null,
      })),
      metadataDataP
        .then((d) => checkMetadataFromData(d, lang))
        .catch(() => ({ status: 'info' as CheckStatus, detail: t.metadataUnavailable })),
      checkToken2022(mint, lang),
      metadataDataP.then((d) => fetchTokenLogoFromData(d)).catch(() => null),
      metadataDataP.then((d) => (d ? parseMetadataFields(d) : null)).catch(() => null),
      // v7.6 — bundle heuristic (young tokens only; old tokens skip it).
      checkBundle(mint.toBase58(), supplyRaw, pair?.pairCreatedAt ?? null, excludeAddresses, lang),
      isYoungToken
        ? checkRugCheckInsiders(mint.toBase58(), supplyRaw, lang)
        : Promise.resolve(null),
    ]);
  const bundleCheck = mergeBundleChecks(bundleCheckRpc, bundleCheckRc);

  // Logo: Metaplex metadata image first, DexScreener info.imageUrl as the
  // second source (some tokens' metadata image fails or is missing — e.g.
  // POPCAT showed an empty gray box). The UI still falls back to a letter
  // avatar when both are missing.
  const logoUrl = metaLogoUrl ?? pair?.info?.imageUrl ?? null;

  const top10SharePct = holders?.top10SharePct ?? null;
  const top1SharePct = holders?.top1SharePct ?? null;
  const topHolders = holders?.top5 ?? null;
  const top10Holders = holders?.top10 ?? null;
  const poolVaultExcluded = poolVaultAddress != null;
  const matchedExcluded = new Set(holders?.excludedMatched ?? []);
  const excludedKinds = {
    pool: poolVaultAddress != null && matchedExcluded.has(poolVaultAddress),
    burn: burnAta != null && matchedExcluded.has(burnAta),
    exchange: cexAtas.some((a) => matchedExcluded.has(a)),
  };

  const liquidityUsd = pair?.liquidity?.usd ?? null;
  const volume24hUsd = pair?.volume?.h24 ?? null;
  const marketCapUsd = pair?.marketCap ?? pair?.fdv ?? null;
  const priceChange24hPct = pair?.priceChange?.h24 ?? null;
  const txns24hBuys = pair?.txns?.h24?.buys ?? null;
  const txns24hSells = pair?.txns?.h24?.sells ?? null;
  const pairAgeDays =
    pair?.pairCreatedAt != null
      ? Math.max(0, (Date.now() - pair.pairCreatedAt) / 86_400_000)
      : null;

  // Metaplex name/symbol are the fallback when DexScreener has no pair
  // for the mint (brand-new token, no market yet): the metadata account
  // is already read for the logo, so a real name beats "Unknown / (???)".
  // On-chain names can carry trailing NUL padding — strip it, and ignore
  // an empty result.
  const cleanMetaName = (s: string | undefined): string | undefined => {
    const c = s?.replace(/\0+$/, '').trim();
    return c ? c : undefined;
  };
  const name = pair?.baseToken?.name ?? cleanMetaName(metadataFields?.name) ?? t.unknownName;
  const symbol =
    pair?.baseToken?.symbol ?? cleanMetaName(metadataFields?.symbol) ?? '???';

  // 5) Score each check (100-point total, unchanged) + why points were lost.
  const mintPts = mintData.mintAuthorityRevoked ? 20 : 0;
  const freezePts = mintData.freezeAuthorityRevoked ? 20 : 0;
  const concPts = scoreConcentration(top10SharePct, top1SharePct);
  const liqParts = scoreLiquidityParts(liquidityUsd, pairAgeDays, volume24hUsd);
  const liqPts = liqParts.total;
  // Token-2022 penalty (max −35): dangerous extensions subtract from the
  // 100-point total; the total never goes below 0.
  const token2022Penalty = token2022Check.penalty;
  const holdersUnavailable = top10SharePct == null;
  const bundleSuspected = bundleCheck.suspected;
  const rawScore = Math.max(0, mintPts + freezePts + concPts + liqPts - token2022Penalty);
  // v7.5 + v7.6 — false-safe guardrails: with holder data unread, the token
  // scores a neutral 15/30 for concentration; with a suspected dev bundle,
  // the launch may have been coordinated. Either way the TOTAL is capped at
  // 79, so the verdict can never be Aman (Safe starts at 80) while a hidden
  // whale — e.g. a dev wallet quietly holding 75%, or a bundle ready to dump
  // in unison — has not been ruled out.
  const score = holdersUnavailable || bundleSuspected ? Math.min(79, rawScore) : rawScore;
  const verdict = verdictFor(score);

  const liquidityLostReason: string | null =
    liqPts >= 30
      ? null
      : pair == null
        ? t.liquidityLostNoPair
        : [
            liqParts.liq < 15 ? t.liqPartLow(fmtUsd(liquidityUsd, lang)) : null,
            liqParts.age < 8 && pairAgeDays != null
              ? t.agePartLow(`${Math.floor(pairAgeDays)} ${t.days}`)
              : null,
            liqParts.vol < 7 ? t.volPartLow(fmtUsd(volume24hUsd, lang)) : null,
          ]
            .filter((s): s is string => s != null)
            .join(' · ') || t.liquidityLostNoPair;

  const checks: CheckResult[] = [
    {
      id: 'mint',
      title: t.mint.title,
      status: statusFor(mintPts, 20),
      score: mintPts,
      maxScore: 20,
      scored: true,
      lostReason: mintPts < 20 ? t.mintLostReason : null,
      detail: mintData.mintAuthorityRevoked ? t.mint.detailRevoked : t.mint.detailActive,
      explanation: t.mint.explanation,
    },
    {
      id: 'freeze',
      title: t.freeze.title,
      status: statusFor(freezePts, 20),
      score: freezePts,
      maxScore: 20,
      scored: true,
      lostReason: freezePts < 20 ? t.freezeLostReason : null,
      detail: mintData.freezeAuthorityRevoked
        ? t.freeze.detailRevoked
        : t.freeze.detailActive,
      explanation: t.freeze.explanation,
    },
    {
      id: 'holders',
      title: t.holdersTitle,
      // Status from the percentage itself (<30% pass, <50% warn, ≥50% fail) —
      // NOT from points: 10/30 points is a mid-range concentration and must
      // never show a BAHAYA badge on an otherwise legit token.
      // Unread data is 'info' (UNAVAILABLE badge, grey) — not a risk signal
      // and never a fake Low/Medium/High concentration reading.
      status:
        top10SharePct == null
          ? 'info'
          : top10SharePct < 30
            ? 'pass'
            : top10SharePct < 50
              ? 'warn'
              : 'fail',
      score: concPts,
      maxScore: 30,
      // Show the neutral default as a label, not a bare "15/30" that reads
      // like a measured result.
      scoreLabel: top10SharePct == null ? t.holdersScoreDefault : undefined,
      scored: true,
      lostReason:
        concPts >= 30
          ? null
          : top10SharePct == null
            ? // M2b — the "(Caution)" cap claim is only true when the
              // verdict actually IS Caution: on a Berisiko Tinggi
              // verdict (score already below 79) the cap line would
              // contradict the verdict, so the note is dropped entirely
              // — same gate as summary.ts's appendHoldersNote (M2).
              // The card's detail line still states the data is
              // unverified, so nothing is lost.
              verdict === 'Berisiko Tinggi'
              ? null
              : t.holdersLostNoData
            : t.holdersLostDetail(fmtPct(top10SharePct)),
      detail:
        top10SharePct == null
          ? t.holdersUnavailable
          : t.holdersDetail(fmtPct(top10SharePct), fmtPct(top1SharePct)),
      explanation: t.holdersExplanation,
    },
    {
      id: 'bundle',
      title: t.bundleTitle,
      status: bundleCheck.status,
      score: 0,
      maxScore: 0,
      scored: false,
      lostReason: null,
      detail: bundleCheck.detail,
      explanation: t.bundleExplanation,
    },
    {
      id: 'liquidity',
      title: t.liquidityTitle,
      status:
        pair == null
          ? dexError
            ? 'warn'
            : 'fail'
          : statusFor(liqPts, 30),
      score: liqPts,
      maxScore: 30,
      scored: true,
      lostReason: liquidityLostReason,
      detail:
        pair == null
          ? dexError
            ? t.liquidityDexError
            : t.liquidityNoPair
          : t.liquidityDetail(
              fmtUsd(liquidityUsd, lang),
              fmtUsd(volume24hUsd, lang),
              pairAgeDays != null ? `${Math.floor(pairAgeDays)} ${t.days}` : '—',
              pair.dexId ?? '—',
            ),
      explanation: t.liquidityExplanation,
    },
    {
      id: 'sellable',
      title: t.sellableTitle,
      // Jupiter unreachable (null) is INFO, not CAUTION: an API timeout
      // says nothing about the token. Only a confirmed "no route"
      // (false) is a genuine warn.
      status: sellable === true ? 'pass' : sellable === null ? 'info' : 'warn',
      score: 0,
      maxScore: 0,
      scored: false,
      lostReason: null,
      detail:
        sellable === true
          ? t.sellableOk
          : sellable === false
            ? t.sellableWarn
            : t.sellableUnavailable,
      explanation: t.sellableExplanation,
    },
    {
      id: 'lp',
      title: t.lpTitle,
      status: lpCheck.status,
      score: 0,
      maxScore: 0,
      scored: false,
      lostReason: null,
      detail: lpCheck.detail,
      explanation: t.lpExplanation,
    },
    {
      id: 'metadata',
      title: t.metadataTitle,
      status: metadataCheck.status,
      score: 0,
      maxScore: 0,
      scored: false,
      lostReason: null,
      detail: metadataCheck.detail,
      explanation: t.metadataExplanation,
    },
    {
      id: 'token2022',
      title: t.token2022Title,
      status: token2022Check.status,
      // M9 — this is a PENALTY, not a 35-point sub-score: scored checks
      // must sum to 100, and with scored: true they summed to 135
      // (PYUSD's cards summed to 30 while the total was 0). The score
      // field below is display-only now; rawScore still subtracts the
      // penalty exactly as before — NO score change.
      score: TOKEN2022_MAX_PENALTY - token2022Penalty,
      maxScore: TOKEN2022_MAX_PENALTY,
      scored: false,
      // Display the penalty itself, not "35/35 pts": the card's mechanism
      // is a deduction from the 100-point total (20+20+30+30), so showing
      // a 35-point sub-score would make the cards add up to 123/135.
      scoreLabel:
        token2022Penalty > 0
          ? t.token2022PenaltyLabel(token2022Penalty)
          : t.token2022NoPenalty,
      lostReason: token2022Penalty > 0 ? token2022Check.foundNames : null,
      detail: token2022Check.detail,
      explanation: t.token2022Explanation,
    },
  ];

  const liquidityRatioPct =
    liquidityUsd != null && marketCapUsd != null && marketCapUsd > 0
      ? (liquidityUsd / marketCapUsd) * 100
      : null;
  // Aggregate-based ratio for the market card (same market cap — it is
  // per-token, identical across pairs). The scored liquidity check above
  // still uses the top-pair ratio only.
  const totalLiquidityRatioPct =
    totalLiquidityUsd != null && marketCapUsd != null && marketCapUsd > 0
      ? (totalLiquidityUsd / marketCapUsd) * 100
      : null;

  return {
    mint: effectiveMint,
    name,
    symbol,
    decimals: mintData.decimals,
    supply: mintData.supply,
    priceUsd,
    marketCapUsd,
    liquidityUsd,
    volume24hUsd,
    priceChange24hPct,
    txns24hBuys,
    txns24hSells,
    pairAgeDays,
    top10SharePct,
    top1SharePct,
    topHolders,
    top10Holders,
    holdersUnavailable,
    bundleSuspected,
    poolVaultExcluded,
    excludedKinds,
    logoUrl,
    resolvedFromPair,
    isBondingCurve,
    liquidityRatioPct,
    totalLiquidityUsd,
    totalVolume24hUsd,
    totalLiquidityRatioPct,
    mintAuthorityRevoked: mintData.mintAuthorityRevoked,
    freezeAuthorityRevoked: mintData.freezeAuthorityRevoked,
    sellable,
    token2022Found: token2022Check.foundIds,
    lpBurnedPct: lpCheck.burnedPct,
    lpTop1Pct: lpCheck.top1Pct,
    metadataMutable: metadataFields ? metadataFields.isMutable : null,
    score,
    verdict,
    checks,
    scannedAt: new Date().toISOString(),
    rpcUsed: mintData.rpcUsed,
    pairUrl: pair?.url ?? null,
  };
}
