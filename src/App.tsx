import { useState } from 'react';
import { scanToken, fmtPct, type ScanResult } from './lib/scanner';
import './App.css';

const EXAMPLES = [
  { label: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
  { label: 'WIF', mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm' },
  { label: 'POPCAT', mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr' },
];

const VERDICT_CLASS: Record<string, string> = {
  Aman: 'verdict-safe',
  Waspada: 'verdict-warn',
  'Berisiko Tinggi': 'verdict-danger',
};

const VERDICT_TEXT: Record<string, string> = {
  Aman: 'Token ini lolos semua pemeriksaan utama. Tetap DYOR — skor bukan jaminan.',
  Waspada:
    'Ada beberapa hal yang perlu diperhatikan sebelum membeli. Baca detail cek di bawah.',
  'Berisiko Tinggi':
    'Banyak lampu merah. Jangan beli sebelum memahami risikonya — kemungkinan besar ini rug pull atau token tidak sehat.',
};

function fmtUsd(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  if (n > 0 && n < 1) return `$${Number(n.toPrecision(3))}`;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)} M`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)} jt`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)} rb`;
  return `$${n.toFixed(4)}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString('id-ID', { maximumFractionDigits: 0 });
}

/** Score gauge: SVG ring, 0-100. */
function Gauge({ score }: { score: number }) {
  const r = 78;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';
  return (
    <div className="gauge">
      <svg viewBox="0 0 200 200" width="180" height="180">
        <circle cx="100" cy="100" r={r} fill="none" stroke="#e5e7eb" strokeWidth="16" />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 100 100)"
        />
        <text x="100" y="98" textAnchor="middle" className="gauge-score" fill={color}>
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
  const [mint, setMint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  async function runScan(address: string) {
    const addr = address.trim();
    if (!addr) {
      setError('Tempel dulu alamat mint token Solana-nya.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await scanToken(addr);
      setResult(res);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Gagal memindai token. Periksa alamat mint-nya dan coba lagi.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <h1>
          Rug<span className="accent">Radar</span>
        </h1>
        <p className="tagline">
          Cek keamanan memecoin Solana sebelum kamu beli. Tempel alamat mint,
          dapatkan skor risiko 0–100 dalam hitungan detik.
        </p>
      </header>

      <main className="card">
        <label className="field-label" htmlFor="mint">
          Alamat Mint Token (Solana)
        </label>
        <div className="input-row">
          <input
            id="mint"
            type="text"
            value={mint}
            onChange={(e) => setMint(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runScan(mint);
            }}
            placeholder="Contoh: DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
            spellCheck={false}
            autoComplete="off"
          />
          <button
            className="btn-primary"
            onClick={() => runScan(mint)}
            disabled={loading}
          >
            {loading ? 'Memindai…' : 'Cek Token'}
          </button>
        </div>

        <div className="examples">
          <span>Coba contoh:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              className="chip"
              onClick={() => {
                setMint(ex.mint);
                runScan(ex.mint);
              }}
              disabled={loading}
            >
              {ex.label}
            </button>
          ))}
        </div>

        {error && <div className="error">{error}</div>}

        {loading && (
          <div className="loading">
            <div className="spinner" />
            <p>
              Membaca data on-chain dari Solana + data pasar dari DexScreener…
            </p>
          </div>
        )}

        {result && (
          <section className="result">
            <div className="result-head">
              <div>
                <h2>
                  {result.name} <span className="symbol">({result.symbol})</span>
                </h2>
                <p className="mint-line">
                  <code>{result.mint}</code>
                </p>
              </div>
              <Gauge score={result.score} />
            </div>

            <div className={`verdict ${VERDICT_CLASS[result.verdict]}`}>
              <strong>{result.verdict}</strong>
              <span>{VERDICT_TEXT[result.verdict]}</span>
            </div>

            <div className="stats">
              <div className="stat">
                <span>Harga</span>
                <strong>{fmtUsd(result.priceUsd)}</strong>
              </div>
              <div className="stat">
                <span>Market Cap</span>
                <strong>{fmtUsd(result.marketCapUsd)}</strong>
              </div>
              <div className="stat">
                <span>Likuiditas</span>
                <strong>{fmtUsd(result.liquidityUsd)}</strong>
              </div>
              <div className="stat">
                <span>Volume 24j</span>
                <strong>{fmtUsd(result.volume24hUsd)}</strong>
              </div>
              <div className="stat">
                <span>Total Supply</span>
                <strong>{fmtNum(result.supply)}</strong>
              </div>
              <div className="stat">
                <span>Top 10 Holder</span>
                <strong>{fmtPct(result.top10SharePct)}</strong>
              </div>
            </div>

            <h3>Detail Pemeriksaan</h3>
            <ul className="checks">
              {result.checks.map((c) => (
                <li key={c.id} className={`check check-${c.status}`}>
                  <div className="check-top">
                    <span className="check-badge">
                      {c.status === 'pass'
                        ? 'AMAN'
                        : c.status === 'warn'
                          ? 'WASPADA'
                          : 'BAHAYA'}
                    </span>
                    <strong>{c.title}</strong>
                    <span className="check-points">
                      {c.score}/{c.maxScore} poin
                    </span>
                  </div>
                  <p className="check-detail">{c.detail}</p>
                  <p className="check-expl">{c.explanation}</p>
                </li>
              ))}
            </ul>

            <p className="meta">
              Dipindai {new Date(result.scannedAt).toLocaleString('id-ID')} · RPC:{' '}
              {result.rpcUsed.replace('https://', '')}
              {result.pairUrl && (
                <>
                  {' · '}
                  <a href={result.pairUrl} target="_blank" rel="noreferrer">
                    Lihat di DexScreener
                  </a>
                </>
              )}
            </p>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>
          <strong>Cara skor dihitung (total 100):</strong> Mint Authority 20 ·
          Freeze Authority 20 · Konsentrasi Holder 30 · Likuiditas &amp; Pasar 30.
        </p>
        <p>
          RugRadar hanya membaca data publik (Solana RPC + DexScreener). Ini
          bukan nasihat keuangan — selalu DYOR sebelum membeli token apa pun.
        </p>
      </footer>
    </div>
  );
}
