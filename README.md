# RugRadar — Token Safety Scanner untuk Memecoin Solana

**Dev3pack Global Hackathon 2026 · Solo entry · Yukka Aulia**

Tempel alamat mint token Solana → dapatkan skor risiko rug 0–100, verdict
**Aman / Waspada / Berisiko Tinggi**, dan rincian per pemeriksaan — dalam
hitungan detik, langsung di browser. Semua data dibaca dari sumber publik
dan read-only; tidak ada wallet, tidak ada transaksi, tidak ada API key.

## Cara menjalankan

```bash
npm install
npm run dev      # buka http://localhost:5173
npm run build    # build produksi ke dist/
npm run preview  # sajikan hasil build
```

Uji pemindaian lewat CLI (logika yang sama dengan UI):

```bash
npx tsx scripts/test-scan.ts            # BONK, WIF, POPCAT
npx tsx scripts/test-scan.ts BONK       # satu token saja
```

## Cara skor dihitung (total 100 — makin tinggi makin aman)

| Pemeriksaan | Bobot | Aturan |
|---|---|---|
| Mint Authority | 20 | Dicabut (revoked) = 20, masih aktif = 0. Authority aktif berarti developer bisa mencetak token baru kapan saja. |
| Freeze Authority | 20 | Dicabut = 20, masih aktif = 0. Authority aktif berarti ada pihak yang bisa membekukan token di dompet siapa pun. |
| Konsentrasi Holder (Top 10) | 30 | Top-10 <20% = 30, <30% = 24, <40% = 18, <50% = 10, <70% = 5, ≥70% = 0. Top-1 >50% langsung 0. |
| Likuiditas & Pasar | 30 | Likuiditas (15): ≥$1jt = 15, ≥$250rb = 12, ≥$50rb = 8, ≥$10rb = 4. Umur pool (8): ≥90 hari = 8, ≥30 = 6, ≥7 = 3. Volume 24j (7): ≥$100rb = 7, ≥$10rb = 5, ≥$1rb = 2. |

**Verdict:** ≥80 Aman · 50–79 Waspada · <50 Berisiko Tinggi.

## Arsitektur

```
src/
  lib/scanner.ts   # seluruh logika: RPC + DexScreener + scoring (tanpa React)
  App.tsx          # UI: input, gauge skor, kartu statistik, daftar cek
  App.css          # styling responsif (mobile-friendly)
scripts/
  test-scan.ts     # CLI test runner, memakai scanToken() yang sama dengan UI
```

**Alur satu pemindaian (`scanToken`):**
1. **On-chain** — `getParsedAccountInfo` pada mint: supply, decimals,
   mint authority, freeze authority. RPC dicoba berurutan:
   `api.mainnet-beta.solana.com` → `solana.publicnode.com` →
   `ssc-dao.genesysgo.net`.
2. **Konsentrasi holder** — `getTokenLargestAccounts` (top-10 + top-1)
   dibagi total supply. Dipanggil via JSON-RPC mentah dengan timeout 10
   detik dan tanpa retry, supaya satu method yang diblokir tidak menggantung
   seluruh scan.
3. **Pasar** — DexScreener public API
   (`/latest/dex/tokens/{mint}`, tanpa key): pair dengan likuiditas
   tertinggi → harga, market cap, likuiditas USD, volume 24j, umur pool,
   nama/symbol token.
4. **Scoring** — tiap cek diberi poin + status pass/warn/fail + penjelasan
   Bahasa Indonesia yang bisa dipahami pemula.

Kegagalan satu sumber data tidak menggagalkan scan: cek yang datanya tidak
didapat dilaporkan sebagai "data tidak tersedia" (warn, 0 poin).

## Keterbatasan yang diketahui (jujur, bukan disembunyikan)

- **`getTokenLargestAccounts` diblokir/dibatasi di semua RPC publik gratis
  yang diuji** (mainnet-beta: HTTP 429 khusus method ini; publicnode:
  "Request blocked"; Ankr publik: 403; GenesysGo: tidak menjawab).
  Akibatnya, pada tes 27 Nov 2026 ketiga token mendapat 0/30 untuk cek
  konsentrasi holder dan skor totalnya 63–70 (Waspada) — padahal authority
  dan likuiditasnya lolos. Dengan data holder dari scanner independen
  (Codeflex, 25–26 Nov 2026: BONK top-10 30,4%, WIF 33,1%, POPCAT 38,4%),
  ketiganya akan mendapat +18 poin → **81–88 (Aman)**. Lihat
  `TEST-RESULTS.md`. Perbaikan termudah: RPC dedicated (mis. Helius free
  tier) — tidak dipakai di sini supaya tetap tanpa API key.
- Harga token sangat kecil (mis. BONK ~$0,000002) ditampilkan dengan 3
  angka signifikan.
- Skor ini alat bantu screening, bukan nasihat keuangan dan bukan jaminan
  token aman. Selalu DYOR.

## Tech stack

- TypeScript + Vite + React 19
- `@solana/web3.js` (baca mint account)
- DexScreener public API (data pasar, tanpa key)
- Tanpa program on-chain, tanpa wallet, tanpa API key, tanpa backend.
