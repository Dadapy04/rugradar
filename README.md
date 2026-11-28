# RugRadar — Token Safety Scanner untuk Memecoin Solana

**Dev3pack Global Hackathon 2026 · Solo entry · Yukka Aulia**

**Penerjemah risiko 3 detik.** Korban rug pull biasanya bukan tidak peduli
keamanan — mereka kalah cepat oleh FOMO dan tidak paham istilah teknis
seperti Permanent Delegate, LP lock, atau dev bundle. RugRadar merangkum
belasan parameter kontrak dan likuiditas menjadi **vonis 2 kalimat dalam
bahasa manusia (Bahasa Indonesia & Inggris)** dalam hitungan detik, tepat
sebelum trader menekan tombol buy.

Tempel alamat mint token Solana → dapatkan skor keamanan 0–100, verdict
**Aman / Waspada / Berisiko Tinggi**, dan rincian per pemeriksaan — langsung
di browser. Semua data dibaca dari sumber publik dan read-only; tidak ada
wallet, tidak ada transaksi. Data on-chain dibaca lewat proxy Cloudflare
Workers (API key Helius disimpan server-side sebagai Worker secret — bundle
publik tidak mengandung key); bila proxy tidak terjangkau, aplikasi fallback
ke RPC publik.

Demo live: https://dadapy04.github.io/rugradar/

## Coba sendiri (kontras hijau vs merah)

| Token | Mint | Skor | Verdict |
|---|---|---|---|
| BONK | `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263` | 81 | Aman |
| WIF | `EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm` | 88 | Aman |
| POPCAT | `7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr` | 88 | Aman |
| PYUSD | `2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo` | 0 | Berisiko Tinggi |

PYUSD adalah contoh merah yang paling jelas: token Token-2022 dengan
Permanent Delegate aktif — developer bisa mencetak dan membekukan token
siapa pun. Skor 0/100, dan ringkasan langsung menyebut flag fatalnya.

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

## Cari pakai ticker, dan simulasi jual

Dua hal yang trader pegang saat FOMO tapi tidak dijawab skor saja:

- **Tanpa alamat mint.** Tulis `WIF` atau `bonk` di kolom yang sama. Kalau
  teksnya bukan alamat, RugRadar mencari tokennya di DexScreener dan
  menampilkan daftar kandidat (logo, nama, likuiditas gabungan) — ketuk
  yang benar untuk memindai. Likuiditas ditampilkan karena ticker yang sama
  sering dipakai ulang oleh token tiruan.
- **Simulasi jual.** Kartu *Bisa Dijual* membuktikan ada rute jual untuk
  ~$1 — itu belum menjawab berapa yang hilang saat keluar dengan nominal
  sungguhan. Tombol $50 / $250 / $1.000 meminta kuotasi jual ke Jupiter
  untuk nominal itu dan menampilkan SOL yang kembali plus price impact-nya.

Keduanya jalan di browser, tanpa key, dan tidak mengubah skor 100 poin.

## Sederhana atau rinci, dan tren skor

Supaya hasil scan terbaca oleh orang yang baru pertama kali melihat token,
tanpa mengurangi apa pun untuk yang sudah biasa:

- **Tampilan bisa dipilih.** *Sederhana* (default) hanya menampilkan empat
  pemeriksaan berskor, cek honeypot, dan pemeriksaan apa pun yang
  benar-benar bermasalah — masalah tidak pernah disembunyikan. Tombol
  "Tampilkan semua N pemeriksaan" membuka seluruh daftar (*Rinci*), dan
  pilihan itu diingat di perangkat.
- **Riwayat skor token ini.** Setiap scan disimpan; begitu ada dua scan
  untuk token yang sama, muncul garis tren skor di bawah verdict, jadi
  terlihat apakah tokennya membaik atau memburuk sejak terakhir kamu cek.
- **Bisa dipasang di layar utama.** Di iOS dan Android, "Tambahkan ke Layar
  Utama" membuka RugRadar sebagai aplikasi penuh tanpa address bar.

## Cara skor dihitung (total 100 — makin tinggi makin aman)

| Pemeriksaan | Bobot | Aturan |
|---|---|---|
| Mint Authority | 20 | Dicabut (revoked) = 20, masih aktif = 0. Authority aktif berarti developer bisa mencetak token baru kapan saja. |
| Freeze Authority | 20 | Dicabut = 20, masih aktif = 0. Authority aktif berarti ada pihak yang bisa membekukan token di dompet siapa pun. |
| Konsentrasi Holder (Top 10) | 30 | Top-10 <20% = 30, <30% = 24, <40% = 18, <50% = 10, <70% = 5, ≥70% = 0. Top-1 >50% langsung 0. |
| Likuiditas & Pasar | 30 | Likuiditas (15): ≥$1jt = 15, ≥$250rb = 12, ≥$50rb = 8, ≥$10rb = 4. Umur pool (8): ≥90 hari = 8, ≥30 = 6, ≥7 = 3. Volume 24j (7): ≥$100rb = 7, ≥$10rb = 5, ≥$1rb = 2. |

**Verdict:** ≥80 Aman · 50–79 Waspada · <50 Berisiko Tinggi.

**Penalti Token-2022 (maks −35, skor tidak pernah di bawah 0):**
Permanent Delegate −15, Transfer Fee −10, Transfer Hook −10.

**Aturan fail-safe:** kalau data holder tidak bisa dibaca, skor holder
diberi nilai netral 15/30 dan total skor dibatasi maksimal 79 — tidak ada
token yang lolos sebagai "Aman" berdasarkan data yang belum terverifikasi.

## Arsitektur

```
src/
  lib/scanner.ts   # seluruh logika: RPC + DexScreener + scoring (tanpa React)
  App.tsx          # UI: input, gauge skor, kartu statistik, daftar cek
  App.css          # styling responsif (mobile-friendly)
worker/
  rugradar-proxy.js  # Cloudflare Worker: /rpc, /rugcheck, /jupiter/quote
scripts/
  test-scan.ts     # CLI test runner, memakai scanToken() yang sama dengan UI
programs/
  rugradar-registry/  # program Anchor (devnet): mencatat hasil scan on-chain
```

**Kenapa ada proxy Cloudflare Workers (`worker/rugradar-proxy.js`)?**
RPC publik Solana membatasi method tertentu (`getTokenLargestAccounts`
diblokir: mainnet-beta 429, publicnode "Request blocked", Ankr 403) dan
API key tidak boleh bocor ke bundle publik. Worker adalah pipa tipis yang
meneruskan tiga hal: `POST /rpc` → Helius (key sebagai Worker secret),
`GET /rugcheck/<mint>` → RugCheck API, `GET /jupiter/quote` → Jupiter
Swap API v1 (lite-api). Scoring tetap 100% client-side di repo publik ini.

**Alur satu pemindaian (`scanToken`):**
1. **On-chain** — `getAccountInfo` (jsonParsed) pada mint: supply, decimals,
   mint authority, freeze authority. Dipanggil lewat JSON-RPC mentah dengan
   timeout 10 detik dan tanpa retry; proxy Cloudflare dicoba pertama
   (meneruskan ke Helius), lalu RPC publik:
   `api.mainnet-beta.solana.com` → `solana.publicnode.com` →
   `ssc-dao.genesysgo.net`.
2. **Token-2022** — ekstensi berbahaya dibaca dari layout TLV akun mint:
   Permanent Delegate, Transfer Fee, Transfer Hook.
3. **Konsentrasi holder** — `getTokenLargestAccounts` (top-10 + top-1)
   dibagi total supply. Dompet exchange terverifikasi (Binance, Coinbase,
   OKX, Kraken, Bybit) dikeluarkan dari top-10.
4. **Dev bundle (hanya pair < 7 hari)** — dua sinyal independen:
   heuristik RPC (≥4 dompet membeli di satu slot peluncuran yang sama,
   gabungan >15% suplai) dan jaringan insider RugCheck (>15% suplai).
   Token yang dicurigai bundle dibatasi skor maksimal 79. Token tua tidak
   diperiksa — hemat RPC, tanpa false positive.
5. **Pasar** — DexScreener public API
   (`/latest/dex/tokens/{mint}`, tanpa key): pair dengan likuiditas
   tertinggi → harga, market cap, likuiditas USD, volume 24j, umur pool,
   nama/symbol token.
6. **Sellability (informatif, di luar 100 poin)** — simulasi jual ~$1
   token ke SOL lewat Jupiter Swap API v1 (lite-api). Ada rute = bisa
   dijual; tidak ada rute = kemungkinan honeypot.
7. **Ringkasan risiko (rule-based, tanpa AI)** — mesin aturan prioritas
   menulis vonis 2–3 kalimat dari flag terberat (honeypot, Permanent
   Delegate, mint/freeze aktif, top-1 >50%, LP belum dibakar). Latensi
   0 ms, gratis, konsisten — tanpa ketergantungan API AI yang lambat.

Kegagalan satu sumber data tidak menggagalkan scan: cek yang datanya tidak
didapat dilaporkan sebagai "data tidak tersedia" (bukan lolos diam-diam).

**Program Scan Registry (devnet):** hasil scan bisa dicatat on-chain
lewat program Anchor `record_scan` (PDA per mint + scanner). Program
address: `AdyPd6VJETKJTotVTYPPKBZKB3CeVaUpqiC3L9FKPNeR`.

## Keterbatasan yang diketahui (jujur, bukan disembunyikan)

- **Data holder tidak selalu bisa dibaca** (lihat fail-safe di atas:
  netral 15/30 + cap 79). Rescan biasanya memperbaiki karena penyebabnya
  fluktuasi rate limit, bukan data tokennya.
- **"LP dibakar/dikunci" hanya mengukur incinerator.** LP yang dikunci di
  program lock belum terdeteksi, jadi teks kartu LP tidak pernah mengklaim
  persentase bakar — yang dilaporkan hanya risiko sisa pemegang LP terbesar.
- **Vault AMM PumpSwap belum dikecualikan** dari konsentrasi holder
  (vault Raydium sudah). Token yang likuiditasnya masih di PumpSwap bisa
  terlihat lebih terkonsentrasi dari kenyataannya.
- Harga token sangat kecil (mis. BONK ~$0,000002) ditampilkan dengan 3
  angka signifikan.
- Skor ini alat bantu screening, bukan nasihat keuangan dan bukan jaminan
  token aman. Selalu DYOR.

## Tech stack

- TypeScript + Vite + React 19
- `@solana/web3.js` (baca mint account)
- DexScreener public API (data pasar, tanpa key)
- RugCheck public API (jaringan insider, tanpa key)
- Jupiter Swap API v1 / lite-api (cek sellability, tanpa key)
- Cloudflare Workers (proxy RPC + RugCheck + Jupiter; key server-side)
- Anchor (program Scan Registry, devnet)

## Roadmap (setelah hackathon)

Setiap item menjawab satu kelemahan yang kami akui secara terbuka:

1. **Telegram Group Bot** — menjawab gesekan terbesar: trader yang lagi FOMO
   tidak mau keluar dari Telegram cuma buat buka browser. Bot masuk ke grup
   call/sinyal; begitu ada yang melempar contract address, bot membalas
   otomatis dalam ~2 detik berisi skor + vonis 2 kalimat + tautan laporan
   detail (`rugradar/?mint=...`). Trader tidak perlu pindah aplikasi.
2. **Browser Extension** — jawaban yang sama untuk trader yang hidup di
   DexScreener/Pump.fun: peringatan otomatis saat contract address muncul
   di X atau Telegram Web.
3. **Pemantauan real-time + alert** — menjawab "snapshot, bukan pelindung":
   bot mengawasi token yang sudah di-scan dan memperingatkan saat kondisi
   memburuk (unlock LP, perubahan holder, tarikan likuiditas).
4. **Dev Track Record + pemetaan klaster** — menjawab rugger serial yang
   mendanai 15–20 dompet dari CEX sebelum launch: riwayat token sebelumnya
   dari satu creator + visualisasi klaster. Versi lanjutannya menangkap
   pola yang lebih licin: dev yang memecah tokennya perlahan ke puluhan
   dompet *setelah* peluncuran agar lolos dari radar Top Holders — jadi
   yang dicek bukan cuma pembelian serentak di awal, tapi juga transfer
   antar-dompet pasca-peluncuran. Sudah dirancang; terhambat akses data
   (Helius menolak method-nya dengan 403, pump.fun memblokir) — butuh
   izin method read-only di Worker.
5. **Sinyal sosial & daur ulang akun** — menjawab scam yang lolos cek
   on-chain tapi ketahuan dari luar chain: akun X yang berulang kali ganti
   username untuk meluncurkan koin rug baru, atau tautan website/Telegram
   yang dipakai ulang untuk proyek scam berikutnya.

Mesin analisisnya sudah terisolasi di Cloudflare Worker, jadi saluran baru
tinggal menyambung ke API yang sama — tanpa mengubah mesin skornya.

Lihat `TEST-RESULTS.md` untuk hasil tes kunci per versi.
