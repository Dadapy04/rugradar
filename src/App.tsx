import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { scanToken, fmtPct, extractMintCandidate, BASE58_RE, type CheckResult, type ScanResult, type Verdict } from './lib/scanner';
import { buildRiskSummary } from './lib/summary';
import { LANGS, LANG_NAMES, LANG_STORAGE_KEY, LOCALES, STRINGS, detectLang, type Dict, type Lang } from './lib/i18n';
import './App.css';

const EXAMPLES = [
  { label: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
  { label: 'WIF', mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm' },
  { label: 'POPCAT', mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr' },
];

const VERDICT_CLASS: Record<Verdict, string> = {
  Aman: 'verdict-safe',
  Waspada: 'verdict-warn',
  'Berisiko Tinggi': 'verdict-danger',
};

function verdictLabel(v: Verdict, t: Dict): string {
  return v === 'Aman' ? t.verdictAman : v === 'Waspada' ? t.verdictWaspada : t.verdictBerisiko;
}

function verdictText(v: Verdict, t: Dict): string {
  return v === 'Aman'
    ? t.verdictTextAman
    : v === 'Waspada'
      ? t.verdictTextWaspada
      : t.verdictTextBerisiko;
}

function badgeLabel(c: CheckResult, t: Dict): string {
  // Unscored (extra) checks — every status maps explicitly, nothing
  // falls through to CAUTION by accident:
  //   pass → INFO (check ran, result fine)
  //   info → UNAVAILABLE / TIDAK TERSEDIA (data could not be read — not a risk signal)
  //   na   → N/A (check does not apply: bonding curve / Orca / Meteora)
  //   warn → CAUTION (genuinely concerning result)
  //   fail → DANGER (confirmed danger)
  if (!c.scored) {
    // v7.9.1 — the Sellable card is the one extra check whose 'pass' is a
    // positive verdict, not just information: a found sell route means the
    // token CAN be sold, so its badge reads SAFE (green pill comes from
    // the check-pass class, unchanged). Every other extra check keeps the
    // shared map (pass → INFO), including LP and Token Metadata.
    if (c.id === 'sellable' && c.status === 'pass') return t.badgePass;
    if (c.status === 'info') return t.badgeUnavailable;
    if (c.status === 'na') return t.badgeNa;
    if (c.status === 'pass') return t.badgeInfo;
    if (c.status === 'fail') return t.badgeFail;
    return t.badgeWarn;
  }
  // Holder check: show a concentration scale (Low/Medium/High), not a
  // generic SAFE/CAUTION/DANGER badge — more honest about what it measures.
  // Unread data shows UNAVAILABLE (grey), never a fake concentration level.
  if (c.id === 'holders') {
    if (c.status === 'info') return t.badgeUnavailable;
    return c.status === 'pass'
      ? t.holderLow
      : c.status === 'warn'
        ? t.holderMid
        : t.holderHigh;
  }
  return c.status === 'pass' ? t.badgePass : c.status === 'warn' ? t.badgeWarn : t.badgeFail;
}

/** Billions suffix per language (USD values). Only Indonesian uses 'M'
 *  (miliar); every other language uses the crypto-standard 'B'. */
const BILLION_SUFFIX: Record<Lang, string> = {
  id: 'M',
  en: 'B',
  zh: 'B',
  es: 'B',
  pt: 'B',
  ru: 'B',
  vi: 'B',
};

function fmtUsd(n: number | null | undefined, lang: Lang): string {
  if (n == null || Number.isNaN(n)) return '—';
  const t = STRINGS[lang];
  if (n > 0 && n < 0.01) {
    // Tiny memecoin prices must never render in scientific notation
    // ("$3.08e-9"): up to 10 decimal places, trailing zeros trimmed.
    return `$${n.toFixed(10).replace(/0+$/, '').replace(/\.$/, '')}`;
  }
  if (n > 0 && n < 1) return `$${Number(n.toPrecision(3))}`;
  if (n >= 1_000_000_000)
    return `$${(n / 1_000_000_000).toFixed(2)} ${BILLION_SUFFIX[lang]}`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)} ${t.million}`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)} ${t.thousand}`;
  return `$${n.toFixed(4)}`;
}

function fmtNum(n: number, lang: Lang): string {
  return n.toLocaleString(LOCALES[lang], { maximumFractionDigits: 0 });
}

function fmtChange(pct: number | null | undefined): string {
  if (pct == null || Number.isNaN(pct)) return '—';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

function shortAddr(a: string): string {
  return a.length > 8 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a;
}

/** Crypto-standard ticker: uppercase, keeping a leading "$" if present
 *  ("$WIF" stays "$WIF", "bonk" becomes "BONK"). */
function upperSymbol(s: string): string {
  return s.startsWith('$') ? `$${s.slice(1).toUpperCase()}` : s.toUpperCase();
}

/** Token logo from the Metaplex metadata image (or the DexScreener image
 *  fallback); always falls back to a plain letter avatar — the first letter
 *  of the symbol — when the image is missing or fails to load, never an
 *  empty gray box. `small` renders the ~20px version for recent-scan chips. */
function TokenLogo({
  url,
  symbol,
  small,
}: {
  url: string | null;
  symbol: string;
  small?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const letter = (symbol.replace(/^\$/, '') || '?').charAt(0).toUpperCase();
  const cls = small ? 'token-logo token-logo-sm' : 'token-logo';
  if (!url || failed) {
    return (
      <div className={`${cls} token-logo-fallback`} aria-hidden="true">
        {letter}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      className={cls}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

const THEME_STORAGE_KEY = 'rugradar-theme';
type Theme = 'light' | 'dark';

function detectTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // storage unavailable — fall back to light
  }
  return 'light';
}

interface RecentScan {
  mint: string;
  name: string;
  symbol: string;
  score: number;
  logoUrl: string | null;
}

const RECENT_KEY = 'rugradar-recent';
const RECENT_MAX = 8;

function loadRecent(): RecentScan[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(
        (e): e is RecentScan =>
          typeof e === 'object' &&
          e !== null &&
          typeof (e as RecentScan).mint === 'string' &&
          typeof (e as RecentScan).name === 'string' &&
          typeof (e as RecentScan).symbol === 'string' &&
          typeof (e as RecentScan).score === 'number',
      )
      // Entries saved before v7.3 have no logoUrl — default to null
      // (letter avatar) instead of dropping the entry.
      .map((e) => ({
        ...e,
        logoUrl: typeof e.logoUrl === 'string' ? e.logoUrl : null,
      }))
      .slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

/** Score gauge: SVG ring, 0-100. */
function Gauge({ score, ariaLabel }: { score: number; ariaLabel: string }) {
  const r = 78;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  // v7.10 (B8) — the ring color comes from the theme variables, not
  // hardcoded hex, so it matches the brighter dark palette too.
  const colorVar =
    score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--red)';
  const verdictClass =
    score >= 80 ? 'gauge-safe' : score >= 50 ? 'gauge-warn' : 'gauge-danger';
  // v7.10 (UI 2) — animate 0 → score on mount: start at a full offset,
  // then flip to the target after paint so the CSS transition runs.
  // On a rescan the same transition carries the ring to the new score.
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className={`gauge ${verdictClass}`}>
      <svg viewBox="0 0 200 200" role="img" aria-label={ariaLabel}>
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          className="gauge-track"
          strokeWidth="16"
        />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          className="gauge-ring"
          style={{ stroke: colorVar }}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={animated ? offset : c}
          transform="rotate(-90 100 100)"
        />
        <text x="100" y="98" textAnchor="middle" className="gauge-score" style={{ fill: colorVar }}>
          {score}
        </text>
        <text x="100" y="122" textAnchor="middle" className="gauge-max">
          / 100
        </text>
      </svg>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => detectLang());
  const [theme, setTheme] = useState<Theme>(() => detectTheme());
  const [mint, setMint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [copied, setCopied] = useState<'result' | 'link' | 'address' | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [pairNote, setPairNote] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentScan[]>(() => loadRecent());
  const [methodOpen, setMethodOpen] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const resultRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const t = STRINGS[lang];

  // Apply the theme to <html> so the CSS variables switch, and persist it.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // storage unavailable — non-fatal
    }
  }, [theme]);

  // Tick every 30s so the "updated X min ago" line stays fresh.
  useEffect(() => {
    if (!result) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [result]);

  // Methodology modal (v7.10 B10): Escape closes, Tab is trapped
  // inside the modal, and focus returns to the trigger on close.
  useEffect(() => {
    if (!methodOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const modal = modalRef.current;
    modal?.querySelector<HTMLButtonElement>('.modal-close')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMethodOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !modal) return;
      const focusables = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [methodOpen]);

  // Scroll the result into view when a scan finishes, so the verdict and
  // the reasons are visible on mobile without hunting for them.
  useEffect(() => {
    if (result && !loading) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result, loading]);

  // Keep the browser tab title in sync with the UI language.
  useEffect(() => {
    document.title = STRINGS[lang].pageTitle;
  }, [lang]);

  // Stepped loading checklist: 1/3 mint → 2/3 holders → 3/3 market,
  // advancing every ~3s while a scan is running. The step clamps at 3/3
  // (it used to cycle back to 1/3, which would un-check finished steps
  // on a long scan) — step 3 stays active until the scan finishes.
  useEffect(() => {
    if (!loading) return;
    setLoadingStep(0);
    const id = window.setInterval(() => setLoadingStep((s) => Math.min(s + 1, 2)), 3000);
    return () => window.clearInterval(id);
  }, [loading]);

  async function runScan(address: string, useLang: Lang = lang) {
    // A scan is already running (e.g. Enter pressed while the buttons
    // are disabled) — ignore the duplicate so two scans cannot race.
    if (loading) return;
    const tt = STRINGS[useLang];
    const raw = address.trim();
    if (!raw) {
      setError(tt.emptyMintError);
      return;
    }
    // An EVM address must never be fed to the URL extractor — a long hex
    // string can contain a 32+ char base58-looking run by accident.
    if (raw.startsWith('0x')) {
      setError(tt.evmError);
      return;
    }
    // Smart input: a pasted DexScreener / Pump.fun / Birdeye / Solscan
    // link (or any text containing an address) yields the mint inside it.
    const candidate = extractMintCandidate(raw);
    if (!candidate) {
      setError(tt.invalidError);
      return;
    }
    if (candidate !== raw) setMint(candidate); // show the extracted address
    const addr = candidate;
    if (!BASE58_RE.test(addr)) {
      setError(tt.invalidError);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setCopyFailed(false);
    setPairNote(null);
    try {
      const res = await scanToken(addr, useLang);
      setResult(res);
      // The scan may have resolved a pair address to its base token —
      // show the resolved mint in the input and the shareable link.
      setMint(res.mint);
      if (res.resolvedFromPair) {
        setPairNote(tt.pairConvertedNote(res.name, upperSymbol(res.symbol)));
      }
      // Recent scans: newest first, deduped by mint, max 8, persisted.
      const entry: RecentScan = {
        mint: res.mint,
        name: res.name,
        symbol: res.symbol,
        score: res.score,
        logoUrl: res.logoUrl,
      };
      setRecent((prev) => {
        const next = [entry, ...prev.filter((r) => r.mint !== res.mint)].slice(0, RECENT_MAX);
        try {
          window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        } catch {
          // storage unavailable — non-fatal
        }
        return next;
      });
      try {
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}?mint=${encodeURIComponent(res.mint)}`,
        );
      } catch {
        // history API unavailable (e.g. file://) — non-fatal
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : tt.genericError);
    } finally {
      setLoading(false);
    }
  }

  // Auto-run a scan when the page is opened with ?mint=<address> (shareable link).
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get('mint');
    if (m) {
      setMint(m);
      void runScan(m);
    }
    // Run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function switchLang(next: Lang) {
    if (next === lang) return;
    setLang(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // storage unavailable — non-fatal
    }
    document.documentElement.lang = next;
    // Re-scan the current token so check texts switch language too.
    if (result) {
      await runScan(result.mint, next);
    }
  }

  function flashCopied(which: 'result' | 'link' | 'address') {
    setCopied(which);
    window.setTimeout(() => setCopied((c) => (c === which ? null : c)), 2000);
  }

  function clearInput() {
    setMint('');
    setError(null);
    // The old result belongs to the cleared address — drop it too, so a
    // stale score does not stay on screen with an empty input.
    setResult(null);
    setPairNote(null);
    // Clearing the input also clears the shareable ?mint= link, so a stale
    // address is not re-scanned on the next reload.
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch {
      // history API unavailable — non-fatal
    }
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setMint(text.trim());
        setError(null);
      }
    } catch {
      // Clipboard read needs a user gesture + permission; on mobile
      // browsers it can be denied — show the friendly message instead.
      setError(t.pasteFailed);
    }
  }

  async function copyAddress() {
    if (!result) return;
    const ok = await copyText(result.mint);
    if (ok) {
      setCopyFailed(false);
      flashCopied('address');
    } else {
      setCopyFailed(true);
    }
  }

  async function shareResult() {
    if (!result) return;
    const url = `${window.location.origin}${window.location.pathname}?mint=${encodeURIComponent(result.mint)}`;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: t.shareTitle,
          text: t.shareText(result.name, upperSymbol(result.symbol), result.score),
          url,
        });
        return;
      } catch (e) {
        // User cancelled the share sheet — do nothing. Any other error
        // falls through to the copy-link fallback below.
        if (e instanceof Error && e.name === 'AbortError') return;
      }
    }
    const ok = await copyText(url);
    if (ok) {
      setCopyFailed(false);
      flashCopied('link');
    } else {
      setCopyFailed(true);
    }
  }

  async function copyResultText() {
    if (!result) return;
    const lines = sortedChecks
      .map((c) =>
        c.scored
          ? `• ${c.title}: ${c.score}/${c.maxScore}`
          : `• ${c.title}: ${c.status === 'pass' ? 'OK' : c.status === 'info' ? '?' : c.status === 'na' ? 'n/a' : '!'}`,
      )
      .join('\n');
    const ok = await copyText(
      t.copySummary({
        name: result.name,
        symbol: result.symbol,
        score: result.score,
        verdict: verdictLabel(result.verdict, t),
        checks: lines,
        mint: result.mint,
        summary: buildRiskSummary(result, lang),
      }),
    );
    if (ok) {
      setCopyFailed(false);
      flashCopied('result');
    } else {
      setCopyFailed(true);
    }
  }

  async function copyLink() {
    if (!result) return;
    const url = `${window.location.origin}${window.location.pathname}?mint=${encodeURIComponent(result.mint)}`;
    const ok = await copyText(url);
    if (ok) {
      setCopyFailed(false);
      flashCopied('link');
    } else {
      setCopyFailed(true);
    }
  }

  const change = result?.priceChange24hPct;
  const changeClass =
    change == null || change === 0 ? '' : change > 0 ? 'stat-pos' : 'stat-neg';
  // No trading pair found at all = the token has no market yet. A low score
  // from that alone should not read like a confirmed rug pull.
  const noMarket = result != null && result.pairUrl == null;
  // Risk level line under the gauge, derived from the verdict — the score
  // is a SAFETY score (100 = safest), so say the risk level explicitly.
  const riskLevelText =
    result == null
      ? ''
      : result.verdict === 'Aman'
        ? t.riskLow
        : result.verdict === 'Waspada'
          ? t.riskMid
          : t.riskHigh;
  // Which account types were actually excluded from the top-10
  // calculation (pool vault / burn address / exchange wallets).
  const excludedLabels = result
    ? [
        result.excludedKinds.pool ? t.excludedPool : null,
        result.excludedKinds.burn ? t.excludedBurn : null,
        result.excludedKinds.exchange ? t.excludedExchange : null,
      ].filter((s): s is string => s != null)
    : [];
  const holdersExcludedNote =
    excludedLabels.length > 0
      ? t.holdersExcludedNote(excludedLabels.join(', '))
      : t.holdersExcludedNone;

  // Market-context card: thin liquidity is dangerous even when the
  // authorities are revoked — the ratio is the honest signal for it.
  // The card shows the AGGREGATE liquidity/volume (all DEX pairs) and
  // the aggregate-based ratio, falling back to the top-pair ratio when
  // no aggregate is available. The scored liquidity check still uses
  // the top pair only — this is display-only.
  const displayRatioPct =
    result?.totalLiquidityRatioPct ?? result?.liquidityRatioPct ?? null;
  const thinLiquidity =
    result != null && displayRatioPct != null && displayRatioPct < 1;
  const pairAgeText =
    result == null || result.pairAgeDays == null
      ? '—'
      : result.pairAgeDays < 1
        ? `< 1 ${t.days}`
        : `${Math.floor(result.pairAgeDays)} ${t.days}`;
  const ratioText =
    result == null || displayRatioPct == null ? '—' : fmtPct(displayRatioPct);

  // v7.10.1 (UI 7b) — failed checks first, and within a status group
  // the biggest point loss leads, so a judge scanning a red token sees
  // the reason immediately: for PYUSD the Token-2022 DANGER card (−35)
  // now leads, then Holder (−30), then Mint/Freeze (−20 each, stable
  // order). Unscored checks lose 0 points, so they sort after scored
  // ones in their group. Stable otherwise (Array.sort is stable).
  // Used by the check list and the copied text alike.
  const CHECK_RANK: Record<string, number> = { fail: 0, warn: 1, pass: 2, info: 3, na: 4 };
  const sortedChecks = result
    ? [...result.checks].sort(
        (a, b) =>
          CHECK_RANK[a.status] - CHECK_RANK[b.status] ||
          (b.maxScore - b.score) - (a.maxScore - a.score),
      )
    : [];

  function relativeUpdated(scannedAt: string): string {
    const mins = Math.max(
      0,
      Math.floor((nowTick - new Date(scannedAt).getTime()) / 60_000),
    );
    if (mins < 1) return t.updatedJustNow;
    if (mins < 60) return t.updatedMinutes(mins);
    return t.updatedHours(Math.floor(mins / 60));
  }

  return (
    <div className="page">
      <header className="hero">
        <div className="lang-row">
          <button
            type="button"
            className="theme-toggle"
            aria-label={theme === 'dark' ? t.themeToLight : t.themeToDark}
            title={theme === 'dark' ? t.themeToLight : t.themeToDark}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          {/* v7.11 — 7-language select (was a 2-button ID/EN toggle).
            Native <select> keeps it compact in the header on mobile and
            works with keyboard/screen readers; switching re-scans. */}
          <select
            className="lang-select"
            value={lang}
            onChange={(e) => void switchLang(e.target.value as Lang)}
            disabled={loading}
            aria-label="Language / Bahasa"
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_NAMES[l]}
              </option>
            ))}
          </select>
        </div>
        <p className="eyebrow">{t.eyebrow}</p>
        <img src="/logo.png" className="brand-logo" alt="RugRadar logo" width={76} height={76} />
        <h1>
          Rug<span className="accent">Radar</span>
        </h1>
        <p className="tagline">{t.tagline}</p>
      </header>

      <main className="card">
        {/* v7.10 (UI 9) — the scan bar is sticky on mobile (≤560px), so
          the input + Scan button stay reachable after scrolling down to
          the results. */}
        <div className="scan-bar">
          <label className="field-label" htmlFor="mint">
            {t.fieldLabel}
          </label>
          <div className="input-row">
          <div className="input-wrap">
            <input
              id="mint"
              type="text"
              value={mint}
              onChange={(e) => {
                const v = e.target.value;
                setMint(v);
                if (!v.trim()) clearInput();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void runScan(mint);
              }}
              placeholder={t.placeholder}
              title={mint || undefined}
              spellCheck={false}
              autoComplete="off"
            />
            {/* Paste + clear live INSIDE the input (right side): on mobile
              the input row is then just input + Scan button, no extra
              full-width Paste button eating vertical space. Paste is
              always visible; × only when there is text to clear. */}
            <div className="input-icons">
              <button
                type="button"
                className="input-paste-icon"
                aria-label={t.pasteInput}
                title={t.pasteInput}
                onClick={() => void pasteFromClipboard()}
                disabled={loading}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                </svg>
              </button>
              {mint && (
                <button
                  type="button"
                  className="input-clear"
                  aria-label={t.clearInput}
                  title={t.clearInput}
                  onClick={clearInput}
                  disabled={loading}
                >
                  ×
                </button>
              )}
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={() => void runScan(mint)}
            disabled={loading}
          >
            {loading ? t.scanningButton : t.scanButton}
          </button>
          </div>
        </div>

        <div className="examples">
          <span>{t.tryExamples}</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              className="chip"
              onClick={() => {
                setMint(ex.mint);
                void runScan(ex.mint);
              }}
              disabled={loading}
            >
              {ex.label}
            </button>
          ))}
        </div>

        {recent.length > 0 && (
          <div className="recent">
            <span>{t.recentScansTitle}</span>
            <span className="recent-hint">{t.recentHint}</span>
            {recent.map((r) => (
              <button
                key={r.mint}
                className="chip chip-recent"
                onClick={() => {
                  setMint(r.mint);
                  void runScan(r.mint);
                }}
                disabled={loading}
                title={r.name}
              >
                <TokenLogo url={r.logoUrl} symbol={r.symbol} small />
                {upperSymbol(r.symbol)} · {r.score}
              </button>
            ))}
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {loading && (
          <div className="loading">
            {/* v7.10 (UI 8) — a live checklist instead of one cycling line:
              finished steps get a check, the current step a spinner. */}
            <ul className="load-steps" aria-live="polite">
              {[t.loadingStep1, t.loadingStep2, t.loadingStep3].map((label, i) => (
                <li
                  key={i}
                  className={
                    i < loadingStep ? 'load-done' : i === loadingStep ? 'load-active' : 'load-pending'
                  }
                >
                  <span className="load-mark" aria-hidden="true">
                    {i < loadingStep ? (
                      '✓'
                    ) : i === loadingStep ? (
                      <span className="load-spinner" />
                    ) : (
                      '○'
                    )}
                  </span>
                  {label}
                </li>
              ))}
            </ul>
            <div className="skeleton" aria-hidden="true">
              <div className="sk-gauge" />
              <div className="sk-line" />
              <div className="sk-line short" />
              <div className="sk-stats">
                <div className="sk-stat" />
                <div className="sk-stat" />
                <div className="sk-stat" />
                <div className="sk-stat" />
              </div>
              <div className="sk-line" />
              <div className="sk-line short" />
            </div>
          </div>
        )}

        {!loading && !result && !error && (
          <div className="how">
            <strong>{t.howTitle}</strong>
            {/* v7.10 (UI 10) — numbered steps with icons instead of plain
              gray paragraphs. */}
            <ol className="how-steps">
              <li>
                <span className="how-num" aria-hidden="true">
                  1
                </span>
                <span>{t.howStep1}</span>
              </li>
              <li>
                <span className="how-num" aria-hidden="true">
                  2
                </span>
                <span>{t.howStep2}</span>
              </li>
              <li>
                <span className="how-num" aria-hidden="true">
                  3
                </span>
                <span>{t.howStep3}</span>
              </li>
            </ol>
          </div>
        )}

        {result && (
          <section className="result" ref={resultRef}>
            <div className="result-head">
              <div className="token-id">
                <TokenLogo url={result.logoUrl} symbol={result.symbol} />
                <div>
                  <h2>
                    {result.name}{' '}
                    <span className="symbol">({upperSymbol(result.symbol)})</span>
                  </h2>
                  <p className="mint-line">
                    <code>{result.mint}</code>
                    <button
                      type="button"
                      className="mint-copy"
                      aria-label={t.copyAddress}
                      title={t.copyAddress}
                      onClick={() => void copyAddress()}
                    >
                      {copied === 'address' ? '✓' : '⧉'}
                    </button>
                  </p>
                  {result.isBondingCurve && (
                    <p>
                      <span className="bonding-badge">{t.bondingCurveLabel}</span>
                    </p>
                  )}
                </div>
              </div>
          </div>

          {pairNote && <p className="pair-note">{pairNote}</p>}

          {/* v7.10 (UI 1) — verdict-first hero banner: the verdict IS the
            page now, not a card inside it. Ring left, verdict + risk
            summary right on desktop; stacked on mobile. */}
          <div className={`verdict-hero ${VERDICT_CLASS[result.verdict]}`}>
            <div className="hero-gauge">
              <Gauge score={result.score} ariaLabel={t.gaugeLabel(result.score)} />
              <p className="gauge-label">{t.safetyScoreLabel}</p>
              <p className="risk-level">{t.riskLevelLine(riskLevelText)}</p>
              <button
                type="button"
                className="method-btn"
                onClick={() => setMethodOpen(true)}
              >
                ⓘ {t.methodTitle}
              </button>
            </div>
            <div className="hero-verdict">
              <strong className="hero-verdict-label">{verdictLabel(result.verdict, t)}</strong>
              <span className="hero-verdict-text">
                {result.verdict === 'Berisiko Tinggi' && noMarket
                  ? t.verdictTextBerisikoNoMarket
                  : verdictText(result.verdict, t)}
              </span>
              {/* v7.4 — plain-language risk summary: rule-based, no AI.
                "Clean or trap?" in 2–3 sentences. Never gives buy advice
                — risk facts only. Recomputed at render time from the scan
                result, so it follows the ID/EN switch. */}
              <p className="risk-summary">{buildRiskSummary(result, lang)}</p>
            </div>
          </div>

          {/* v7.10 (UI 3) — Market and Token are their own sub-cards now. */}
          <div className="subcards">
            <div className="subcard">
              {/* Pasar: satu blok gabungan — market cap sekali saja,
                likuiditas/volume TOTAL semua pair DEX dengan nilai pair
                utama sebagai sub-catatan, rasio, umur pair, perubahan
                24j, dan transaksi buy/sell (metrik pasar, bukan token). */}
              <h4>{t.statsGroupMarket}</h4>
              <div className="stats">
                <div className="stat">
                  <span>{t.statsMarketCap}</span>
                  <strong>{fmtUsd(result.marketCapUsd, lang)}</strong>
                </div>
                <div className="stat">
                  <span>{t.marketTotalLiquidityLabel}</span>
                  <strong>
                    {fmtUsd(result.totalLiquidityUsd ?? result.liquidityUsd, lang)}
                  </strong>
                  {result.totalLiquidityUsd != null && (
                    <span className="stat-sub">
                      {t.marketTopPairNote(fmtUsd(result.liquidityUsd, lang))}
                    </span>
                  )}
                </div>
                <div className="stat">
                  <span>{t.marketTotalVolumeLabel}</span>
                  <strong>
                    {fmtUsd(result.totalVolume24hUsd ?? result.volume24hUsd, lang)}
                  </strong>
                  {result.totalVolume24hUsd != null && (
                    <span className="stat-sub">
                      {t.marketTopPairNote(fmtUsd(result.volume24hUsd, lang))}
                    </span>
                  )}
                </div>
                <div className="stat">
                  <span>{t.marketRatioLabel}</span>
                  <strong>{ratioText}</strong>
                </div>
                <div className="stat">
                  <span>{t.marketAgeLabel}</span>
                  <strong>{pairAgeText}</strong>
                </div>
                <div className="stat">
                  <span>{t.statsPrice}</span>
                  <strong>{fmtUsd(result.priceUsd, lang)}</strong>
                </div>
                <div className="stat">
                  <span>{t.statsPriceChange24h}</span>
                  <strong className={changeClass}>{fmtChange(result.priceChange24hPct)}</strong>
                </div>
                <div className="stat">
                  <span>{t.statsTxns24h}</span>
                  <strong>
                    {result.txns24hBuys == null || result.txns24hSells == null
                      ? '—'
                      : (
                        <>
                          <span className="stat-pos">
                            {fmtNum(result.txns24hBuys, lang)} {t.txnsBuy}
                          </span>
                          {' / '}
                          <span className="stat-neg">
                            {fmtNum(result.txns24hSells, lang)} {t.txnsSell}
                          </span>
                        </>
                      )}
                  </strong>
                </div>
              </div>
              {thinLiquidity && (
                <p className="market-warn">
                  {t.marketThinWarning(fmtPct(displayRatioPct))}
                </p>
              )}
            </div>
            <div className="subcard">
              <h4>{t.statsGroupToken}</h4>
              <div className="stats">
                <div className="stat">
                  <span>{t.statsSupply}</span>
                  <strong>{fmtNum(result.supply, lang)}</strong>
                </div>
                <div className="stat">
                  <span>{t.statsTop10}</span>
                  <strong>{fmtPct(result.top10SharePct)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* v7.10 (UI 3) — the checks are their own sub-card too. */}
          <div className="subcard checks-card">
            <h3>{t.checksHeading}</h3>
            <ul className="checks">
              {sortedChecks.map((c, idx) => (
                <li
                  key={c.id}
                  className={`check check-${c.status}`}
                  style={{ '--i': idx } as CSSProperties}
                >
                  <div className="check-top">
                    <span className="check-badge">{badgeLabel(c, t)}</span>
                    <strong>{c.title}</strong>
                    <span className="check-points">
                      {c.scored
                        ? (c.scoreLabel ?? `${c.score}/${c.maxScore} ${t.points}`)
                        : t.extraCheck}
                    </span>
                  </div>
                  <p className="check-detail">{c.detail}</p>
                  {c.scored && c.lostReason && (
                    <p className="check-lost">
                      {t.lostLine(c.maxScore - c.score, c.lostReason)}
                    </p>
                  )}
                  <p className="check-expl">{c.explanation}</p>
                  {c.id === 'holders' && (
                    <p className="check-note">{holdersExcludedNote}</p>
                  )}
                  {c.id === 'holders' && result.topHolders && result.topHolders.length > 0 && (
                    <div className="top-holders">
                      <strong>{t.topHoldersHeading}</strong>
                      <ul>
                        {result.topHolders.map((h) => (
                          <li key={h.address}>
                            <a
                              href={`https://solscan.io/account/${h.address}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <code>{shortAddr(h.address)}</code>
                            </a>
                            <span>{fmtPct(h.sharePct)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {c.id === 'holders' && result.holdersUnavailable && (
                    <button
                      type="button"
                      className="btn-secondary check-retry"
                      onClick={() => void runScan(result.mint)}
                      disabled={loading}
                    >
                      {t.rescan}
                    </button>
                  )}
                  {c.id === 'bundle' && (
                    <span className="meta-links">
                      <a
                        href={`https://app.bubblemaps.io/sol/token/${result.mint}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Bubblemaps
                      </a>
                      <a
                        href={`https://rugcheck.xyz/tokens/${result.mint}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        RugCheck
                      </a>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

            <div className="share-row">
              <button type="button" className="btn-secondary" onClick={() => void copyResultText()}>
                {copied === 'result' ? t.copied : t.copyResult}
              </button>
              <button type="button" className="btn-secondary" onClick={() => void copyLink()}>
                {copied === 'link' ? t.copied : t.copyLink}
              </button>
              <button type="button" className="btn-secondary" onClick={() => void shareResult()}>
                {t.share}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => void runScan(result.mint)}
                disabled={loading}
              >
                {t.rescan}
              </button>
            </div>

            {copyFailed && <p className="copy-error">{t.copyFailed}</p>}

            <p className="meta">
              {relativeUpdated(result.scannedAt)} · {t.scannedAt}{' '}
              {new Date(result.scannedAt).toLocaleString(LOCALES[lang])} · RPC:{' '}
              {result.rpcUsed.replace('https://', '').split('?')[0].replace(/\/$/, '')}
              {' · '}
              <span className="meta-links">
                {result.pairUrl && (
                  <a href={result.pairUrl} target="_blank" rel="noreferrer">
                    {t.viewOnDexscreener}
                  </a>
                )}
                <a
                  href={`https://solscan.io/token/${result.mint}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t.viewOnSolscan}
                </a>
                <a
                  href={`https://bubblemaps.io/sol/token/${result.mint}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t.viewOnBubblemaps}
                </a>
              </span>
            </p>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>
          <strong>{t.footerScoring}</strong>
        </p>
        <p>{t.footerDisclaimer}</p>
        {/* v7.10 (B9) — build label, so a bug report can be tied to a version. */}
        <p className="version">RugRadar v7.11.1</p>
      </footer>

      {methodOpen && (
        <div className="modal-backdrop" onClick={() => setMethodOpen(false)}>
          <div
            className="modal"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.methodTitle}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <strong>{t.methodTitle}</strong>
              <button
                type="button"
                className="modal-close"
                aria-label={t.methodClose}
                onClick={() => setMethodOpen(false)}
              >
                ×
              </button>
            </div>
            <p>{t.methodIntro}</p>
            <h4>{t.methodWeightsTitle}</h4>
            <ul>
              <li>{t.methodWeightMint}</li>
              <li>{t.methodWeightFreeze}</li>
              <li>{t.methodWeightHolders}</li>
              <li>{t.methodWeightLiquidity}</li>
            </ul>
            <p>{t.methodHoldersNote}</p>
            <p>{t.methodLiquidityNote}</p>
            <h4>{t.methodPenaltyTitle}</h4>
            <p>{t.methodPenaltyText}</p>
            <h4>{t.methodBandsTitle}</h4>
            <ul>
              <li>{t.methodBandSafe}</li>
              <li>{t.methodBandCaution}</li>
              <li>{t.methodBandHigh}</li>
            </ul>
            <h4>{t.methodExclusionsTitle}</h4>
            <p>{t.methodExclusionsText}</p>
            <h4>{t.methodSourcesTitle}</h4>
            <p>{t.methodSourcesText}</p>
            <h4>{t.methodExtrasTitle}</h4>
            <p>{t.methodExtrasText}</p>
            <h4>{t.methodBundleTitle}</h4>
            <p>{t.methodBundleText}</p>
          </div>
        </div>
      )}
    </div>
  );
}
