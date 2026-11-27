// RugRadar — core scanning logic (framework-free, used by the React UI and the CLI test script).
// All data sources are public and read-only: Solana mainnet RPC + DexScreener public API.
// No API keys, no secrets, no on-chain program.

import { Connection, PublicKey } from '@solana/web3.js';

// Public RPC endpoints, tried in order. The first one that answers wins.
// Note: getTokenLargestAccounts is rate-limited (429) on the mainnet-beta
// public endpoint and blocked on publicnode's free tier, so extra fallbacks
// matter for the holder-concentration check.
export const RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana.publicnode.com',
  'https://ssc-dao.genesysgo.net',
];

export type CheckStatus = 'pass' | 'warn' | 'fail';
export type Verdict = 'Aman' | 'Waspada' | 'Berisiko Tinggi';

export interface CheckResult {
  id: string;
  title: string;
  status: CheckStatus;
  score: number;
  maxScore: number;
  detail: string;
  explanation: string;
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
  pairAgeDays: number | null;
  top10SharePct: number | null;
  top1SharePct: number | null;
  mintAuthorityRevoked: boolean | null;
  freezeAuthorityRevoked: boolean | null;
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
  marketCap?: number;
  fdv?: number;
  pairCreatedAt?: number;
  dexId?: string;
  pairAddress?: string;
  url?: string;
  baseToken?: { name?: string; symbol?: string };
}

/** Fetch the best-liquidity DexScreener pair for a mint. Returns null when unknown. */
export async function fetchDexPair(mint: string): Promise<DexPair | null> {
  const res = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
    { headers: { Accept: 'application/json' } },
  );
  if (!res.ok) throw new Error(`DexScreener HTTP ${res.status}`);
  const json = (await res.json()) as { pairs?: DexPair[] };
  const pairs = (json.pairs ?? []).filter((p) => p.liquidity?.usd != null);
  if (pairs.length === 0) return null;
  pairs.sort((a, b) => (b.liquidity!.usd! ?? 0) - (a.liquidity!.usd! ?? 0));
  return pairs[0];
}

/** Read the on-chain mint account (supply, decimals, authorities) from the first working RPC. */
async function readMint(mint: PublicKey): Promise<{
  decimals: number;
  supply: number;
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
  rpcUsed: string;
}> {
  let lastError: unknown = null;
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const conn = new Connection(endpoint, 'confirmed');
      const info = await conn.getParsedAccountInfo(mint);
      const parsed = info.value?.data as
        | { parsed?: { info?: { decimals?: number; supply?: string; mintAuthority?: string | null; freezeAuthority?: string | null }; type?: string } }
        | undefined;
      const mintInfo = parsed?.parsed?.info;
      if (!mintInfo || mintInfo.decimals == null || mintInfo.supply == null) {
        throw new Error('Mint account not found or not a token mint');
      }
      return {
        decimals: mintInfo.decimals,
        supply: Number(mintInfo.supply) / 10 ** mintInfo.decimals,
        mintAuthorityRevoked: mintInfo.mintAuthority == null,
        freezeAuthorityRevoked: mintInfo.freezeAuthority == null,
        rpcUsed: endpoint,
      };
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    `Gagal membaca mint dari RPC Solana: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
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

/** Top-10 holders share of total supply, via getTokenLargestAccounts.
 *  Tries every configured RPC — the public mainnet endpoint rate-limits
 *  this heavier call (HTTP 429) and publicnode's free tier blocks it,
 *  so extra fallbacks matter for the holder-concentration check. */
async function readTopHolders(
  mint: PublicKey,
  supplyRaw: number,
): Promise<{ top10SharePct: number; top1SharePct: number }> {
  let lastError: unknown = null;
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const result = await rpcCall<{
        value: { amount: string }[];
      }>(endpoint, 'getTokenLargestAccounts', [
        mint.toBase58(),
        { commitment: 'confirmed' },
      ]);
      const amounts = result.value.map((a) => Number(a.amount));
      const top10 = amounts.slice(0, 10).reduce((s, a) => s + a, 0);
      const top1 = amounts[0] ?? 0;
      return {
        top10SharePct: supplyRaw > 0 ? (top10 / supplyRaw) * 100 : 0,
        top1SharePct: supplyRaw > 0 ? (top1 / supplyRaw) * 100 : 0,
      };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

// ---------- Scoring ----------
// Total 100 points. Higher = safer.
//   Mint authority    20 pts  — revoked = safe, active = dev can print more tokens.
//   Freeze authority  20 pts  — revoked = safe, active = dev can freeze any wallet.
//   Holder spread     30 pts  — top-10 share of supply.
//   Liquidity/market  30 pts  — pool liquidity (15) + pair age (8) + 24h volume (7).

function scoreConcentration(top10Pct: number | null, top1Pct: number | null): number {
  if (top10Pct == null) return 0;
  if (top1Pct != null && top1Pct > 50) return 0; // single wallet controls the majority
  if (top10Pct < 20) return 30;
  if (top10Pct < 30) return 24;
  if (top10Pct < 40) return 18;
  if (top10Pct < 50) return 10;
  if (top10Pct < 70) return 5;
  return 0;
}

function scoreLiquidity(
  liquidityUsd: number | null,
  pairAgeDays: number | null,
  volume24hUsd: number | null,
): number {
  let s = 0;
  if (liquidityUsd != null) {
    if (liquidityUsd >= 1_000_000) s += 15;
    else if (liquidityUsd >= 250_000) s += 12;
    else if (liquidityUsd >= 50_000) s += 8;
    else if (liquidityUsd >= 10_000) s += 4;
  }
  if (pairAgeDays != null) {
    if (pairAgeDays >= 90) s += 8;
    else if (pairAgeDays >= 30) s += 6;
    else if (pairAgeDays >= 7) s += 3;
  }
  if (volume24hUsd != null) {
    if (volume24hUsd >= 100_000) s += 7;
    else if (volume24hUsd >= 10_000) s += 5;
    else if (volume24hUsd >= 1_000) s += 2;
  }
  return s;
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

function fmtUsd(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)} jt`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)} rb`;
  return `$${n.toFixed(2)}`;
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toFixed(1)}%`;
}

/** Full scan: on-chain mint data + holder concentration + DexScreener market data. */
export async function scanToken(mintAddress: string): Promise<ScanResult> {
  const mint = new PublicKey(mintAddress.trim()); // throws on invalid base58 address

  // 1) On-chain mint account (supply, decimals, authorities).
  const mintData = await readMint(mint);
  const supplyRaw = mintData.supply * 10 ** mintData.decimals;

  // 2) Holder concentration (best effort — a failure here must not kill the whole scan).
  let top10SharePct: number | null = null;
  let top1SharePct: number | null = null;
  try {
    const holders = await readTopHolders(mint, supplyRaw);
    top10SharePct = holders.top10SharePct;
    top1SharePct = holders.top1SharePct;
  } catch {
    // leave null; the concentration check will report "data tidak tersedia"
  }

  // 3) Market data from DexScreener (best effort).
  let pair: DexPair | null = null;
  let dexError = false;
  try {
    pair = await fetchDexPair(mintAddress.trim());
  } catch {
    dexError = true;
  }
  const liquidityUsd = pair?.liquidity?.usd ?? null;
  const volume24hUsd = pair?.volume?.h24 ?? null;
  const priceUsd = pair?.priceUsd != null ? Number(pair.priceUsd) : null;
  const marketCapUsd = pair?.marketCap ?? pair?.fdv ?? null;
  const pairAgeDays =
    pair?.pairCreatedAt != null
      ? Math.max(0, (Date.now() - pair.pairCreatedAt) / 86_400_000)
      : null;

  const name = pair?.baseToken?.name ?? 'Tidak diketahui';
  const symbol = pair?.baseToken?.symbol ?? '???';

  // 4) Score each check.
  const mintPts = mintData.mintAuthorityRevoked ? 20 : 0;
  const freezePts = mintData.freezeAuthorityRevoked ? 20 : 0;
  const concPts = scoreConcentration(top10SharePct, top1SharePct);
  const liqPts = scoreLiquidity(liquidityUsd, pairAgeDays, volume24hUsd);
  const score = mintPts + freezePts + concPts + liqPts;

  const checks: CheckResult[] = [
    {
      id: 'mint',
      title: 'Mint Authority',
      status: statusFor(mintPts, 20),
      score: mintPts,
      maxScore: 20,
      detail: mintData.mintAuthorityRevoked
        ? 'Sudah dicabut (revoked) — tidak ada yang bisa mencetak token baru.'
        : 'MASIH AKTIF — pemilik bisa mencetak token baru kapan saja dan mengencerkan harga.',
      explanation:
        'Kalau mint authority masih aktif, developer bisa menambah supply seenaknya. Token yang aman biasanya sudah mencabutnya.',
    },
    {
      id: 'freeze',
      title: 'Freeze Authority',
      status: statusFor(freezePts, 20),
      score: freezePts,
      maxScore: 20,
      detail: mintData.freezeAuthorityRevoked
        ? 'Sudah dicabut (revoked) — tidak ada yang bisa membekukan dompet holder.'
        : 'MASIH AKTIF — pemilik bisa membekukan token di dompet siapa pun.',
      explanation:
        'Freeze authority aktif berarti ada pihak yang bisa mengunci tokenmu sehingga tidak bisa dijual. Token yang aman sudah mencabutnya.',
    },
    {
      id: 'holders',
      title: 'Konsentrasi Holder (Top 10)',
      status:
        top10SharePct == null ? 'warn' : statusFor(concPts, 30),
      score: concPts,
      maxScore: 30,
      detail:
        top10SharePct == null
          ? 'Data holder tidak bisa diambil dari RPC saat ini.'
          : `Top 10 dompet memegang ${fmtPct(top10SharePct)} dari total supply (dompet terbesar: ${fmtPct(top1SharePct)}).`,
      explanation:
        'Semakin kecil porsi yang dipegang segelintir dompet, semakin kecil risiko satu paus menjual besar-besaran dan menjatuhkan harga. Di atas 50% itu lampu merah.',
    },
    {
      id: 'liquidity',
      title: 'Likuiditas & Aktivitas Pasar',
      status:
        pair == null
          ? dexError
            ? 'warn'
            : 'fail'
          : statusFor(liqPts, 30),
      score: liqPts,
      maxScore: 30,
      detail:
        pair == null
          ? dexError
            ? 'Data pasar (DexScreener) tidak bisa diambil saat ini — cek ini dilewati.'
            : 'Tidak ditemukan pool trading untuk token ini — kemungkinan belum ada pasar atau token sudah mati.'
          : `Likuiditas ${fmtUsd(liquidityUsd)} · volume 24 jam ${fmtUsd(volume24hUsd)} · pool berumur ${pairAgeDays != null ? `${Math.floor(pairAgeDays)} hari` : '—'} (DEX: ${pair.dexId ?? '—'}).`,
      explanation:
        'Likuiditas rendah berarti harga gampang dimanipulasi dan kamu bisa sulit menjual. Pool yang sudah lama + volume harian sehat adalah tanda pasar yang hidup.',
    },
  ];

  return {
    mint: mintAddress.trim(),
    name,
    symbol,
    decimals: mintData.decimals,
    supply: mintData.supply,
    priceUsd,
    marketCapUsd,
    liquidityUsd,
    volume24hUsd,
    pairAgeDays,
    top10SharePct,
    top1SharePct,
    mintAuthorityRevoked: mintData.mintAuthorityRevoked,
    freezeAuthorityRevoked: mintData.freezeAuthorityRevoked,
    score,
    verdict: verdictFor(score),
    checks,
    scannedAt: new Date().toISOString(),
    rpcUsed: mintData.rpcUsed,
    pairUrl: pair?.url ?? null,
  };
}
