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
const BASE58_FIND_RE = /[1-9A-HJ-NP-Za-km-z]{32,44}/;

/** Extract a token mint address from pasted text: a bare address, or a
 *  link from DexScreener / Pump.fun / Birdeye / Solscan. Host-specific
 *  patterns win over the generic fallback, so a pair address inside a
 *  DexScreener link is extracted as-is and resolved by the pair check
 *  in scanToken. Returns null when nothing that looks like an address
 *  is found. The caller shows the extracted address in the input. */
export function extractMintCandidate(raw: string): string | null {
  const input = raw.trim();
  if (!input) return null;
  if (BASE58_RE.test(input)) return input;
  const hostPatterns = [
    /pump\.fun\/coin\/([1-9A-HJ-NP-Za-km-z]{32,44})/,
    /pump\.fun\/([1-9A-HJ-NP-Za-km-z]{32,44})/,
    /birdeye\.so\/token\/([1-9A-HJ-NP-Za-km-z]{32,44})/,
    /solscan\.io\/(?:token|account)\/([1-9A-HJ-NP-Za-km-z]{32,44})/,
    /dexscreener\.com\/solana\/([1-9A-HJ-NP-Za-km-z]{32,44})/,
  ];
  for (const re of hostPatterns) {
    const m = input.match(re);
    if (m) return m[1];
  }
  const m = input.match(BASE58_FIND_RE);
  return m ? m[0] : null;
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
 *  Returns null when every endpoint fails. */
async function getLargestAccounts(
  mint: string,
): Promise<{ address: string; amount: number }[] | null> {
  const endpoints = [PROXY_RPC, ...RPC_ENDPOINTS];
  for (const endpoint of endpoints) {
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
 *  scan on one throttled endpoint. */
async function rpcCallAny<T>(method: string, params: unknown[]): Promise<T> {
  const endpoints = [PROXY_RPC, ...RPC_ENDPOINTS];
  let lastError: unknown = null;
  for (const endpoint of endpoints) {
    try {
      return await rpcCall<T>(endpoint, method, params);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('RPC failed');
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
  excludedMatched: string[];
}> {
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
  return {
    top10SharePct: supplyRaw > 0 ? (top10 / supplyRaw) * 100 : 0,
    top1SharePct: supplyRaw > 0 ? (top1 / supplyRaw) * 100 : 0,
    top5: filtered.slice(0, 5).map((e) => ({
      address: e.address,
      amount: e.amount,
      sharePct: supplyRaw > 0 ? (e.amount / supplyRaw) * 100 : 0,
    })),
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

interface RaydiumPoolInfo {
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
): Promise<RaydiumPoolInfo | null> {
  const raw = await fetchRawAccount(poolAddress);
  if (!raw || raw.data.length < RAYDIUM_POOL_MIN_LEN) return null;
  const readPubkey = (off: number): string =>
    new PublicKey(raw.data.subarray(off, off + 32)).toBase58();
  const info: RaydiumPoolInfo = {
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
  pool: RaydiumPoolInfo | null,
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
  const amount = String(Math.max(1, Math.floor(tokens * 10 ** decimals)));
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
export async function scanToken(mintAddress: string, lang: Lang = 'en'): Promise<ScanResult> {
  const t = STRINGS[lang];
  // Map a malformed address to the friendly translated message instead of
  // web3.js's raw "Invalid public key input". (The UI validates base58 first,
  // so this is defense-in-depth for direct/CLI callers.)
  // 1) On-chain mint account (supply, decimals, authorities).
  // If the address is not a mint, it may be a pair/pool address — try to
  // resolve it to its base token via DexScreener and scan that instead
  // (one level only, no recursion). When the base token cannot be found,
  // the specific pair-guidance error is thrown — never a generic
  // "not found". A mint-not-found (no account at all) is NOT resolved:
  // a pair address always exists as an account.
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
    if (err instanceof Error && err.message === t.notMintError) {
      const base = await resolvePairBaseToken(mintAddress.trim());
      if (!base) throw new Error(t.pairGuidanceError);
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

  // 3) Raydium pool derivation (best effort): pool vault for the holder
  //    exclusion + LP mint for the burn/lock check. Only for Raydium pairs;
  //    anything else reports "cannot be checked" honestly.
  let poolInfo: RaydiumPoolInfo | null = null;
  let poolVaultAddress: string | null = null;
  if (pair?.dexId === 'raydium' && pair.pairAddress) {
    poolInfo = await readRaydiumPool(
      pair.pairAddress,
      pair.baseToken?.address,
      pair.quoteToken?.address,
    ).catch(() => null);
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
      lpCheckP,
      metadataDataP.then((d) => checkMetadataFromData(d, lang)),
      checkToken2022(mint, lang),
      metadataDataP.then((d) => fetchTokenLogoFromData(d)),
      metadataDataP.then((d) => (d ? parseMetadataFields(d) : null)),
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
            ? t.holdersLostNoData
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
      // Scored against the max penalty (35) so the existing lostReason
      // line renders the deducted points, e.g. "−15 poin karena
      // Permanent Delegate". Clean SPL mints show 35/35, no loss.
      score: TOKEN2022_MAX_PENALTY - token2022Penalty,
      maxScore: TOKEN2022_MAX_PENALTY,
      scored: true,
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
    verdict: verdictFor(score),
    checks,
    scannedAt: new Date().toISOString(),
    rpcUsed: mintData.rpcUsed,
    pairUrl: pair?.url ?? null,
  };
}
