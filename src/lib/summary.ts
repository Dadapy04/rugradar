// RugRadar v7.4 — plain-language risk summary (rule-based, no AI).
// Translates the scan's structured findings into "is this token clean or
// is there a trap?" for non-technical users, in 2–3 sentences under the
// score gauge. NEVER gives buy advice — only risk facts; the decision
// stays with the user. Every sentence fragment lives in i18n.ts (ID + EN);
// numbers are interpolated from the structured ScanResult fields, never
// parsed out of localized check text.
import { STRINGS, type Dict, type Lang } from './i18n';
import { fmtPct, fmtUsd, type ScanResult } from './scanner';

/** v7.5: when holder data could not be read, the score was capped at 79 —
 *  say so plainly so a Caution verdict on an otherwise clean token is
 *  never a mystery. Appended to every summary path where the cap actually
 *  binds — NOT on a Berisiko Tinggi verdict, where the score is already
 *  below 79 and the "(Waspada)" claim would contradict the verdict (M2). */
function appendHoldersNote(text: string, r: ScanResult, t: Dict): string {
  return r.holdersUnavailable && r.verdict !== 'Berisiko Tinggi'
    ? `${text} ${t.summaryHoldersUnavailable}`
    : text;
}

/** "A, B dan C" / "A, B and C" — natural list join in both languages. */
function joinList(items: string[], and: string): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

type MarketFlagKind =
  | 'top10'
  | 'bundle'
  | 'noMarket'
  | 'thinLiq'
  | 'mildLiq'
  | 'newPair'
  | 'youngPair'
  | 'lp'
  | 'metadata'
  | 'bonding';

interface MarketFlag {
  kind: MarketFlagKind;
  text: string;
  /** Strong flags (concentration, no market, thin liquidity, brand-new
   *  pair) get their own consequence sentence; mild flags do not. */
  strong: boolean;
}

export function buildRiskSummary(r: ScanResult, lang: Lang): string {
  const t = STRINGS[lang];

  // ---- 1) Fatal dangers — they MUST be sentence 1, even if the other
  // metrics look good. Checked in priority order, up to 3 items. ----
  const fatal: string[] = [];
  if (r.sellable === false) fatal.push(t.summaryFatalNoSell);
  if (r.token2022Found.length > 0) {
    const names = r.token2022Found
      .map((id) =>
        id === 'permanent-delegate'
          ? t.extPermanentDelegate
          : id === 'transfer-fee'
            ? t.extTransferFee
            : t.extTransferHook,
      )
      .join(', ');
    const impl = r.token2022Found.includes('permanent-delegate')
      ? t.summaryFatalExtImplDelegate
      : r.token2022Found.includes('transfer-hook')
        ? t.summaryFatalExtImplHook
        : t.summaryFatalExtImplFee;
    fatal.push(t.summaryFatalExt(names, impl));
  }
  if (r.mintAuthorityRevoked === false) fatal.push(t.summaryFatalMint);
  if (r.freezeAuthorityRevoked === false) fatal.push(t.summaryFatalFreeze);
  if (r.top1SharePct != null && r.top1SharePct > 50)
    fatal.push(t.summaryFatalTop1(fmtPct(r.top1SharePct)));

  if (fatal.length > 0) {
    const items = fatal.slice(0, 3);
    // A very concentrated top-10 joins the danger sentence too (as in
    // "mint aktif dan Top 10 menguasai 62%") — only when there is room.
    if (items.length < 3 && r.top10SharePct != null && r.top10SharePct >= 50) {
      items.push(t.summaryFatalTop10(fmtPct(r.top10SharePct)));
    }
    const s1 = `${t.summaryFatalLead} ${joinList(items, t.summaryAnd)}.`;
    const hasControlDanger =
      r.token2022Found.length > 0 ||
      r.mintAuthorityRevoked === false ||
      r.freezeAuthorityRevoked === false;
    const s2 = hasControlDanger
      ? t.summaryFatalConsequence
      : r.sellable === false
        ? t.summaryFatalNoSellConsequence
        : t.summaryFatalTop1Consequence;
    // M1 — the fatal branch is always a non-Aman verdict, so append the
    // DYOR/price reminder after the consequence sentence, matching the
    // all-green and mild-flag branches.
    const reminder = r.verdict !== 'Aman' ? ` ${t.summaryPriceReminder}` : '';
    return appendHoldersNote(`${s1} ${s2}${reminder}`, r, t);
  }

  // ---- 2) Market / distribution risks, in priority order. ----
  const flags: MarketFlag[] = [];
  if (r.top10SharePct != null && r.top10SharePct >= 50)
    flags.push({
      kind: 'top10',
      text: t.summaryFlagTop10(fmtPct(r.top10SharePct)),
      strong: true,
    });
  // v7.6 — a suspected dev bundle is a distribution risk as serious as a
  // concentrated top-10: the "small holders" may all be one person.
  if (r.bundleSuspected)
    flags.push({ kind: 'bundle', text: t.summaryFlagBundle, strong: true });
  if (r.pairUrl == null) {
    flags.push({ kind: 'noMarket', text: t.summaryNoMarket, strong: true });
  } else {
    if (r.liquidityUsd != null && r.liquidityUsd < 10_000)
      flags.push({
        kind: 'thinLiq',
        text: t.summaryFlagThinLiq(fmtUsd(r.liquidityUsd, lang)),
        strong: true,
      });
    else if (r.liquidityUsd != null && r.liquidityUsd < 50_000)
      flags.push({
        kind: 'mildLiq',
        text: t.summaryFlagMildLiq(fmtUsd(r.liquidityUsd, lang)),
        strong: false,
      });
    if (r.pairAgeDays != null && r.pairAgeDays < 1)
      flags.push({ kind: 'newPair', text: t.summaryFlagNewPair, strong: true });
    else if (r.pairAgeDays != null && r.pairAgeDays < 7)
      flags.push({
        kind: 'youngPair',
        text: t.summaryFlagYoungPair(`${Math.floor(r.pairAgeDays)} ${t.days}`),
        strong: false,
      });
  }
  // v7.8 — the summary must match the LP card: flag only when the largest
  // remaining LP holder could pull >15% of liquidity. A mostly
  // burned/locked LP (e.g. WIF, top holder 8%) is not a "LP is not
  // burned" risk, so it must never produce that sentence.
  if (r.lpTop1Pct != null && r.lpTop1Pct > 15)
    flags.push({
      kind: 'lp',
      text: t.summaryFlagLpNotBurned(fmtPct(r.lpTop1Pct)),
      strong: false,
    });
  if (r.metadataMutable === true)
    flags.push({ kind: 'metadata', text: t.summaryFlagMetadataMutable, strong: false });
  if (r.isBondingCurve)
    flags.push({ kind: 'bonding', text: t.summaryFlagBonding, strong: false });

  // ---- 3) Contract clean — the opener for the remaining cases. ----
  const contractClean =
    r.mintAuthorityRevoked === true && r.freezeAuthorityRevoked === true;
  const opener = contractClean ? t.summaryCleanOpener : t.summaryCleanOpenerUnknown;

  if (flags.length === 0) {
    // Everything green: positive sentence (+ deep-liquidity clause when
    // the total DEX liquidity is deep) + top-1 note when notable +
    // reminder that the score does not guarantee price movement.
    const totalLiq = r.totalLiquidityUsd ?? r.liquidityUsd;
    const deep =
      totalLiq != null && totalLiq >= 250_000
        ? `, ${t.summaryAnd} ${t.summaryDeepLiquidity}`
        : '';
    const sentences = [`${opener}${deep}.`];
    if (r.top1SharePct != null && r.top1SharePct >= 10)
      sentences.push(t.summaryTop1Note(fmtPct(r.top1SharePct)));
    // v7.12.3 — no second DYOR line when the verdict is Aman: the verdict
    // text itself already says "Still DYOR — a score is not a guarantee".
    // Waspada/Berisiko keep the reminder (their verdict text has none).
    if (r.verdict !== 'Aman') sentences.push(t.summaryPriceReminder);
    return appendHoldersNote(sentences.join(' '), r, t);
  }

  // Contract clean but market/distribution risks: opener + top 1–2 flags.
  const top = flags.slice(0, 2);
  const s1 = `${opener}, ${t.summaryBut} ${joinList(
    top.map((f) => f.text),
    t.summaryAnd,
  )}.`;
  const strongTop = top.find((f) => f.strong);
  // v7.12.3 — same dedup as the all-green branch: when the verdict is
  // Aman the verdict text already carries the DYOR line, so the summary
  // ends after the flags instead of repeating the reminder. M1: when a
  // strong flag is present AND the verdict is not Aman, the reminder
  // goes after the consequence sentence (it was previously missing here).
  const s2 =
    strongTop?.kind === 'noMarket'
      ? t.summaryNoMarketConsequence
      : strongTop
        ? t.summaryMarketConsequence
        : r.verdict === 'Aman'
          ? ''
          : t.summaryPriceReminder;
  const reminder =
    strongTop && r.verdict !== 'Aman' ? ` ${t.summaryPriceReminder}` : '';
  return appendHoldersNote(s2 ? `${s1} ${s2}${reminder}` : s1, r, t);
}
