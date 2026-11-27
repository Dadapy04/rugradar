// CLI test runner: scans the three reference memecoins with the same
// scanToken() logic the React UI uses, and prints a readable report.
// Usage: npx tsx scripts/test-scan.ts
import { scanToken, fmtPct, type ScanResult } from '../src/lib/scanner';

const TOKENS = [
  { label: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
  { label: 'WIF', mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm' },
  { label: 'POPCAT', mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr' },
  // v7.10 — the red demo token (Token-2022, expected 0) now has
  // regression coverage too; it was only verified by hand before.
  { label: 'PYUSD', mint: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo' },
];

function fmtUsd(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function printResult(label: string, r: ScanResult): void {
  console.log(`\n=== ${label} (${r.symbol}) — ${r.name} ===`);
  console.log(`Mint        : ${r.mint}`);
  console.log(`Score       : ${r.score}/100 — ${r.verdict}`);
  console.log(`Price       : ${fmtUsd(r.priceUsd)} | Market cap: ${fmtUsd(r.marketCapUsd)}`);
  console.log(`Liquidity   : ${fmtUsd(r.liquidityUsd)} | Vol 24h: ${fmtUsd(r.volume24hUsd)}`);
  console.log(
    `Total pairs : ${fmtUsd(r.totalLiquidityUsd)} liq | ${fmtUsd(r.totalVolume24hUsd)} vol 24h | ratio ${fmtPct(r.totalLiquidityRatioPct)} (top-pair ratio ${fmtPct(r.liquidityRatioPct)})`,
  );
  console.log(
    `Price chg 24h: ${r.priceChange24hPct != null ? `${r.priceChange24hPct.toFixed(1)}%` : '—'} | Txns 24h: buys ${r.txns24hBuys ?? '—'} / sells ${r.txns24hSells ?? '—'}`,
  );
  console.log(
    `Sellable    : ${r.sellable === true ? 'YES (Jupiter route found)' : r.sellable === false ? 'NO route — possible honeypot' : 'unknown (Jupiter API unavailable)'}`,
  );
  console.log(`Supply      : ${r.supply.toLocaleString('en-US')} (decimals ${r.decimals})`);
  console.log(`Top-10 hold : ${fmtPct(r.top10SharePct)} (top-1: ${fmtPct(r.top1SharePct)})`);
  if (r.topHolders && r.topHolders.length > 0) {
    for (const h of r.topHolders) {
      console.log(`  top holder: ${h.address} — ${fmtPct(h.sharePct)}`);
    }
  }
  console.log(`Mint auth   : ${r.mintAuthorityRevoked ? 'revoked' : 'ACTIVE'}`);
  console.log(`Freeze auth : ${r.freezeAuthorityRevoked ? 'revoked' : 'ACTIVE'}`);
  console.log(`Pair age    : ${r.pairAgeDays != null ? `${Math.floor(r.pairAgeDays)} days` : '—'}`);
  for (const c of r.checks) {
    const pts = c.scored ? `${c.score}/${c.maxScore}` : 'info';
    console.log(`  [${c.status.toUpperCase()}] ${c.title}: ${pts} — ${c.detail}`);
  }
  console.log(`Scanned at  : ${r.scannedAt} via ${r.rpcUsed}`);
}

async function main(): Promise<void> {
  // Optional args: scan only the named tokens, e.g. `npx tsx scripts/test-scan.ts BONK`
  const only = process.argv.slice(2).map((a) => a.toUpperCase());
  const targets = only.length > 0 ? TOKENS.filter((t) => only.includes(t.label)) : TOKENS;
  if (targets.length === 0) {
    console.error(`Unknown token(s): ${only.join(', ')}. Choices: ${TOKENS.map((t) => t.label).join(', ')}`);
    process.exit(1);
  }
  const results: { label: string; result: ScanResult }[] = [];
  for (const t of targets) {
    try {
      const r = await scanToken(t.mint);
      printResult(t.label, r);
      results.push({ label: t.label, result: r });
    } catch (err) {
      console.error(`\n=== ${t.label} FAILED ===`);
      console.error(err instanceof Error ? err.message : err);
    }
    // Small pause so the public RPC / DexScreener don't rate-limit us.
    await new Promise((res) => setTimeout(res, 1500));
  }
  console.log(`\nDone: ${results.length}/${TOKENS.length} tokens scanned successfully.`);
  // Machine-readable summary for TEST-RESULTS.md generation.
  console.log('\n---JSON---');
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
