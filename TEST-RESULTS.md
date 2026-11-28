# TEST-RESULTS.md — RugRadar

Tes dijalankan 27 Nov 2026 (~11:07–11:14 WIB) dengan perintah:

```bash
npx tsx scripts/test-scan.ts
```

Mint address diverifikasi dari beberapa sumber independen (Phantom, Codeflex,
CoinDesk, Gate) sebelum dipakai — bukan tebakan.

## Ringkasan

| Token | Mint | Skor | Verdict | Harga | Market Cap | Likuiditas | Vol 24j |
|---|---|---|---|---|---|---|---|
| BONK | `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263` | **63/100** | Waspada | $0,00000218 | $192,26 jt | $216,6 rb | $130,7 rb |
| WIF | `EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm` | **70/100** | Waspada | $0,137 | $136,94 jt | $3,98 jt | $565,6 rb |
| POPCAT | `7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr` | **70/100** | Waspada | $0,0276 | $27,00 jt | $2,32 jt | $268,4 rb |

3/3 token berhasil dipindai. Satu scan selesai ~10 detik setelah optimasi
timeout (sebelumnya ~4 menit karena retry backoff web3.js pada method yang
diblokir).

## Rincian per token

### BONK — 63/100 (Waspada)

- Mint Authority: **20/20 PASS** — revoked.
- Freeze Authority: **20/20 PASS** — revoked.
- Konsentrasi Holder: **0/30 WARN** — data tidak tersedia (lihat catatan di bawah).
- Likuiditas & Pasar: **23/30 WARN** — likuiditas $216,6 rb (8 poin),
  pool berumur 1.432 hari (8 poin), volume 24j $130,7 rb (7 poin). DEX: Orca.
- Supply: 87.994.285.707.763 (decimals 5).

### WIF (dogwifhat) — 70/100 (Waspada)

- Mint Authority: **20/20 PASS** — revoked.
- Freeze Authority: **20/20 PASS** — revoked.
- Konsentrasi Holder: **0/30 WARN** — data tidak tersedia.
- Likuiditas & Pasar: **30/30 PASS** — likuiditas $3,98 jt (15 poin),
  pool berumur 1.102 hari (8 poin), volume 24j $565,6 rb (7 poin). DEX: Raydium.
- Supply: 998.836.449,777 (decimals 6).

### POPCAT — 70/100 (Waspada)

- Mint Authority: **20/20 PASS** — revoked.
- Freeze Authority: **20/20 PASS** — revoked.
- Konsentrasi Holder: **0/30 WARN** — data tidak tersedia.
- Likuiditas & Pasar: **30/30 PASS** — likuiditas $2,32 jt (15 poin),
  pool berumur 1.080 hari (8 poin), volume 24j $268,4 rb (7 poin). DEX: Raydium.
- Supply: 979.930.741,138 (decimals 9).

## Catatan penting: kenapa ketiganya "hanya" Waspada

Cek konsentrasi holder (30 poin) mendapat 0 di semua token **bukan karena
holder-nya terkonsentrasi**, melainkan karena `getTokenLargestAccounts`
tidak bisa diambil dari RPC publik gratis saat tes:

- `api.mainnet-beta.solana.com` → HTTP 429 "Too many requests for a
  specific RPC call" (method ini memang dibatasi di endpoint publik).
- `solana.publicnode.com` → error -32602 "Request blocked".
- Ankr publik → 403. GenesysGo → tidak menjawab.

Aplikasi sudah menangani ini dengan benar: cek dilaporkan WARN "data tidak
tersedia" dan scan tetap selesai (tidak crash).

**Pembanding independen** (Codeflex SCOUT, 25–26 Nov 2026): top-10 holder
BONK 30,4%, WIF 33,1%, POPCAT 38,4% — ketiganya masuk bracket 30–40% =
**18 poin**. Dengan data itu skor menjadi **BONK 81, WIF 88, POPCAT 88 —
semuanya Aman**, yang sesuai dengan reputasi ketiga token besar ini.
Perbaikan termudah ke depan: RPC dedicated (mis. Helius free tier).

## Build & dev server

- `npm run build` — **BERHASIL** (`tsc -b && vite build`, dist ~474 KB JS).
- `npm run dev` — **BERHASIL**, HTTP 200, judul halaman benar.
- Tidak ada error TypeScript.

---

## Update v2 — 27 Nov 2026 ~13:13 WIB (6 fitur baru)

Perintah yang sama (`npx tsx scripts/test-scan.ts`) setelah 6 peningkatan:
Helius-ready untuk data holder, cek Bisa Dijual via Jupiter, link hasil
scan (`?mint=`) + tombol salin, data pasar tambahan (harga 24j + transaksi
24j), daftar Top 5 holder, toggle bahasa ID/EN. Model skor 100 poin TIDAK
berubah.

| Token | Skor | Verdict | Harga 24j | Txns 24j (beli/jual) | Bisa Dijual |
|---|---|---|---|---|---|
| BONK | **63/100** | Waspada | +0,2% | 3.989 / 3.988 | tidak diketahui* |
| WIF | **70/100** | Waspada | +5,2% | 1.561 / 1.589 | tidak diketahui* |
| POPCAT | **70/100** | Waspada | +16,0% | 753 / 1.215 | tidak diketahui* |

Skor tidak berubah dari v1 — benar, karena model skornya memang tidak
diubah. Data pasar baru (harga 24j + transaksi) tampil dengan benar.

\* **Cek Jupiter dari VM ini tidak bisa jalan** (curl ke
`quote-api.jup.ag` gagal total, HTTP:000 — egress VM memblokir host itu,
sementara `api.dexscreener.com` menjawab HTTP 200). Di aplikasi live,
cek ini jalan di browser pengunjung (jaringan mereka sendiri) sehingga
normalnya bisa mencapai Jupiter. Supaya tidak ada tuduhan honeypot palsu,
cek ini punya 3 status: rute ditemukan = BISA DIJUAL; Jupiter menjawab
tanpa rute = WASPADA (kemungkinan honeypot); API tidak merespons = WASPADA
dengan pesan "cek tidak bisa dijalankan saat ini", bukan honeypot.

**Holder masih 0/30** — jalur kode Helius sudah siap (Helius dicoba
pertama untuk `getTokenLargestAccounts`, fallback ke RPC publik), tapi
belum ada API key yang dipasang (`VITE_HELIUS_API_KEY` kosong saat build).
Begitu key gratis Helius dipasang dan di-deploy ulang, cek holder
seharusnya jalan dan skor naik ke kisaran 81/88/88 (lihat pembanding
Codeflex di atas). Top 5 holder tampil otomatis begitu datanya ada.

- `npm run build` v2 — **BERHASIL**, 83 modul, dist JS 484,76 KB.
- Toggle ID/EN: semua string UI + teks cek diterjemahkan (kamus di
  `src/lib/i18n.ts`), pilihan tersimpan di localStorage.

---

## Update v3 — 27 Nov 2026 ~13:23 WIB (build DENGAN key Helius)

Build yang sama dengan v2, tapi `VITE_HELIUS_API_KEY` terpasang saat build,
sehingga data holder akhirnya bisa dibaca (Helius dicoba pertama untuk
`getTokenLargestAccounts`). Model skor 100 poin TIDAK berubah.

| Token | Skor | Verdict | Top-10 | Top-1 | Poin holder |
|---|---|---|---|---|---|
| BONK | **73/100** | Waspada | 40,6% | — | 10/30 |
| WIF | **80/100** | Aman | 45,5% | — | 10/30 |
| POPCAT | **80/100** | Aman | 41,1% | — | 10/30 |

Skor = 20 (mint revoked) + 20 (freeze revoked) + 10 (top-10 40–50%) + 23
(BONK) / 30 (WIF, POPCAT) likuiditas. Inilah skor referensi demo live
(bundle `index-E7Turmrn.js` di gh-pages).

---

## Update v4 — 27 Nov 2026 ~13:45 WIB (fix batch audit + QA, TANPA key)

Perintah yang sama (`npx tsx scripts/test-scan.ts`) setelah batch perbaikan
audit eksternal + temuan QA. **Build ini TANPA `VITE_HELIUS_API_KEY`** (key
tidak ada di environment shell) — jadi holder kembali 0/30 dan skor kembali
ke 63/70/70. Build ini TIDAK di-deploy ke gh-pages supaya tidak me-regress
bundle live v3 yang memakai key.

| Token | Skor | Verdict | Holder | LP Burn/Lock | Metadata |
|---|---|---|---|---|---|
| BONK | **63/100** | Waspada | 0/30 (no data) | tidak bisa diperiksa* | WARN mutable |
| WIF | **70/100** | Waspada | 0/30 (no data) | tidak bisa diperiksa* | PASS immutable |
| POPCAT | **70/100** | Waspada | 0/30 (no data) | tidak bisa diperiksa* | PASS immutable |

\* **LP "tidak bisa diperiksa" di run ini BUKAN bug derivasi pool.**
Dicek manual 27 Nov ~13:47 WIB: pair teratas WIF (`EP2ib6dYdEeqD8MfE2ezHCxX3kP3K2eLKkirfPm5eyMx`)
dan POPCAT (`FRhB8L7Y9Qq41qZXYLtC2nw8An1RJfLLxRF2x9RwLLMo`) adalah pool
Raydium AMM v4 asli (owner `675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8`,
data 752 byte), baseMint cocok, LP mint + supply terbaca (WIF LP supply
8.083, POPCAT 642). Yang gagal adalah `getTokenLargestAccounts` untuk LP
mint — `api.mainnet-beta.solana.com` menjawab HTTP 429 (blokir method yang
sama seperti cek holder). BONK benar-benar tidak bisa diperiksa karena pair
teratasnya Orca (Whirlpool), bukan Raydium. Dengan key Helius, cek LP
seharusnya jalan karena Helius melayani method ini.

**Yang berubah di v4 (model skor 100 poin TIDAK berubah):**
- SEO meta + favicon radar merah; link Solscan + Bubblemaps; validasi input
  4 pesan (kosong / EVM 0x / base58 salah / bukan mint) + pesan baru "mint
  tidak ditemukan" (akun tidak ada) — semua diterjemahkan ID/EN.
- Alasan kehilangan poin di bawah tiap cek yang kehilangan poin.
- Status cek holder dihitung dari persentase langsung (<30% pass, <50%
  warn, ≥50% fail) — sebelumnya 10/30 poin menampilkan badge BAHAYA yang
  menyesatkan pada token legit.
- Top-10 holder kini mengecualikan: vault pool (terverifikasi), alamat pair
  DexScreener, dan akun token incinerator (ATA — bukan alamat wallet
  literal, karena `getTokenLargestAccounts` mengembalikan alamat akun
  token). Footnote "Termasuk akun pool likuiditas bila ada." hanya muncul
  bila vault tidak bisa diverifikasi.
- Probe Jupiter kini ~$1 (dari `priceUsd` DexScreener; fallback 1 token).
- `readMint` kini lewat helper `rpcCall` (timeout 10 detik), bukan
  `Connection.getParsedAccountInfo` (retry web3.js bisa menggantung scan).
- `src/index.css` DIHAPUS (blok dark-mode bikin h1/h2 putih-di-atas-putih;
  `#root` 1126px + `text-align: center` + border kolom di desktop).
- Perbaikan kecil: miliaran mode ID tampil "M" (bukan "B"); teks salin
  hasil menyertakan link `?mint=`; toggle bahasa nonaktif saat loading;
  `?mint=` terhapus dari URL saat input dikosongkan; perubahan harga 0%
  netral (tidak hijau).
- Polish: empty state "Cara kerja RugRadar"; teks loading bertahap
  1/3 mint → 2/3 holder → 3/3 pasar.
- Koreksi bug LP check: perbandingan burn sebelumnya membandingkan alamat
  akun token dengan alamat wallet incinerator literal — tidak pernah cocok.
  Sekarang memakai ATA incinerator (juga dipakai untuk eksklusi top-10).
- Catatan kompatibilitas: proyek memakai `@solana/web3.js` v3.2.1 —
  `findProgramAddressSync`, `TOKEN_PROGRAM_ID`, dan
  `ASSOCIATED_TOKEN_PROGRAM_ID` tidak ada di v3; derivasi PDA kini async
  (`PublicKey.findProgramAddress`) dan alamat program ditulis sebagai
  konstanta lokal. Build `tsc -b && vite build` v4 **BERHASIL** (82 modul,
  dist JS 354,51 KB, bundle `index-BtT8MB5j.js`).
- Cek Jupiter dari VM ini tetap tidak bisa jalan (egress memblokir
  `quote-api.jup.ag`, sama seperti v2) — status "tidak diketahui", bukan
  honeypot.

**Skor keyed yang diharapkan setelah rebuild DENGAN key (parent):**
73/80/80 (v3), dengan kemungkinan pergeseran kecil karena eksklusi ATA
incinerator di top-10 (bila incinerator masuk top-10, persentasenya turun
dan poin bisa naik satu bracket).

## v5 — polish tipografi + gaya tulisan (27 Nov ~14:00 WIB, BELUM deploy)

Perintah Yukka 13:30 WIB: "lanjut ke penyempurnaan website seperti gaya
tulisan dan lain lain". Yang diubah (hanya tampilan + copy, logika skor
tidak disentuh):
- Font: Space Grotesk (display: judul, skor gauge, verdict, h3) + Inter
  (body) via Google Fonts di `index.html`, fallback ke system-ui bila
  font gagal dimuat. CSS vars `--font-display` / `--font-body` di `App.css`.
- Hero: eyebrow "TOKEN SAFETY SCANNER · SOLANA" (merah, uppercase,
  letter-spacing), judul 48px/700, tagline dipersingkat jadi satu kalimat
  yang sama dengan tagline draf submit (ID + EN di `src/lib/i18n.ts`).
- Hierarki: h3 hasil jadi eyebrow section (13px uppercase), judul hasil
  26px display, verdict 22px display, stat 16px tabular-nums, label
  field 13px/700, judul cek 15px/600.
- Build `npm run build` BERHASIL (tsc + vite, 82 modul, JS 354,53 KB,
  bundle `index-CpCWX3E2.js`, font + eyebrow terverifikasi di `dist/`).
- PENTING: build lokal ini dibuat TANPA `VITE_HELIUS_API_KEY`, jadi
  JANGAN deploy `dist/` ini apa adanya. Deploy v5 harus rebuild dengan
  key yang sama seperti v4, baru push ke `gh-pages` — kalau tidak, skor
  holder di demo live turun lagi ke 0/30.

### Lanjutan — perbaikan bug kecil + polish elegan (27 Nov ~14:15 WIB, BELUM deploy)

Perintah Yukka ~14:08 WIB: "benerin bug bug dan sempurnain halaman web jadi
lebih elegant dan niat". Semua perubahan tampilan + copy; model skor dan
cek tidak disentuh.

**Bug kecil (semua selesai):**
1. Judul tab ikut bahasa: ID "RugRadar — Pemindai Keamanan Token Solana",
   EN "RugRadar — Solana Token Safety Scanner" (`document.title` di-update
   saat ganti bahasa, string `pageTitle` di `src/lib/i18n.ts`).
2. File mati dihapus setelah grep membuktikan tidak ada referensi:
   `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`,
   `public/icons.svg`. `src/assets/` kini kosong, `public/` tinggal
   `favicon.svg`.
3. Gagal menyalin kini tampil pesan, bukan diam: "Gagal menyalin — salin
   manual dari kolom alamat atau hasil di atas." (ID + EN, class
   `.copy-error`); pesan hilang saat scan baru dimulai atau salinan
   berikutnya berhasil.
4. Gauge punya `role="img"` + `aria-label` ("Skor keamanan token: X dari
   100" / "Token safety score: X out of 100").

**Polish elegan (semua selesai):**
5. Skala tipografi konsisten: body 16px / line-height 1.55; h1 40px desktop
   (dulu 48px) / 32px mobile (dulu 38px); h2 hasil 22px (dulu 26px);
   verdict 22px tetap.
6. Hierarki hasil: gauge 140px di mobile (dulu 180px), verdict langsung di
   bawahnya; 8 kartu statistik dikelompokkan jadi "Pasar" (harga, market
   cap, likuiditas, volume 24j) dan "Token" (supply, Top 10, harga 24j,
   transaksi 24j) dengan heading grup kecil uppercase, masing-masing grid
   2×2, ID + EN.
7. Copy verdict dilunakkan: teks "Berisiko Tinggi" tidak lagi bilang
   "kemungkinan besar ini rug pull" ("ini bisa jadi rug pull atau token
   yang tidak sehat"); token tanpa pair terdeteksi (`pairUrl == null`)
   dapat teks khusus "belum ada pasar" — bukan bukti rug pull, tapi harga
   tidak bisa dinilai dan token sulit dijual. Label verdict tidak berubah.
8. Badge cek holder pakai skala konsentrasi: RENDAH / SEDANG / TINGGI
   (EN: LOW / MEDIUM / HIGH) dari status persennya, bukan AMAN / WASPADA /
   BAHAYA. Poin (skor/maxScore) tidak berubah.
9. Polish visual (tema terang saja, tanpa dark mode): focus ring merah
   `:focus-visible` di semua tombol/input/link + ring halus saat input
   fokus; transisi hover di tombol dan chip; radius diseragamkan (kartu
   16, stat/cek 12, tombol 10); aksen merah #dc2626 konsisten
   (gauge/verdict/tombol/eyebrow).

**Verifikasi:**
- `npm run build` BERHASIL (tsc + vite, 82 modul, JS 356,36 KB, bundle
  `index-r3gcYHE2.js`; string baru + class `.stat-group`/`.copy-error`
  terverifikasi ada di `dist/`).
- `npx tsx scripts/test-scan.ts` (tanpa key): BONK 63 / WIF 70 / POPCAT 70,
  holder 0/30 (tanpa data) — sama seperti ekspektasi, tidak ada yang rusak.
- PENTING: build lokal ini dibuat TANPA `VITE_HELIUS_API_KEY`, jadi JANGAN
  deploy `dist/` ini apa adanya. Deploy v5 harus rebuild dengan key yang
  sama seperti v4, baru push ke `gh-pages`.

---

## v6 — Safety Score + CEX exclusion + mobile UX (27 Nov ~14:30 WIB, BELUM deploy)

Perintah Yukka ~14:17 WIB: audit eksternal kedua (berbasis screenshot).
Model skor dan bobot TIDAK berubah — yang berubah: terminologi, pengecualian
holder, dan UX.

**1. Terminologi "Safety Score" (selesai):** semua teks user-facing yang
dulu bilang "risk score"/"skor risiko" diganti "Safety Score"/"Skor
Keamanan" — tagline, `howStep3`, footer scoring, meta description + OG/
twitter di `index.html`, README.md, SUBMISSION-DRAFT.md. Di bawah lingkaran
gauge kini ada label "SKOR KEAMANAN" / "SAFETY SCORE" + baris "Tingkat
Risiko: Rendah/Sedang/Tinggi" (EN: "Risk Level: Low/Medium/High") dari
verdict. Skala 0–100 dan label verdict tidak berubah.

**2. Pengecualian dompet exchange (selesai, terverifikasi):** 6 alamat wallet
CEX diverifikasi SATU PER SATU lewat halaman Solscan
(`solscan.io/account/<address>` — public name + tag "#Exchange Wallet"):
Binance "Binance 2" `5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9`,
Binance "Binance 3" `9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM`,
Coinbase "Coinbase 4" `9obNtb5GyUegcs3a1CbBkLuc5hEWynWfJC6gjz5uWQkE`,
OKX "OKX Hot Wallet" `5VCwKtCXgCJ6kit5FybXjvriW3xELsFDhYrPSqtJNmcD`,
Kraken "Kraken Hot Wallet" `FWznbcNXWQuHTawe9RxvQ2LdCENssh12dsznf4RiouN5`,
Bybit "Bybit Hot Wallet" `AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2`.
ATA masing-masing wallet dihitung per mint dan dimasukkan ke daftar
pengecualian top-10 (mekanisme sama seperti vault pool + incinerator).
Derivasi ATA dibuktikan benar di on-chain (RPC `getMultipleAccounts`,
27 Nov ~14:25 WIB): ATA Binance 3 untuk BONK = `5hpfC9VB…` dengan saldo
8.346.946.754.592 BONK (~9,5% supply, holder #2) dan untuk WIF =
`7XX64f8U…` dengan saldo 109.101.533 WIF (~10,9% supply, holder #2) —
cocok dengan daftar largest accounts independen. Saldo ATA CEX lain:
BONK — Coinbase 37,7 Miliar, OKX 24,0 Miliar, Bybit 7,4 Miliar, Binance 2
3 token, Kraken 0,004; WIF — Coinbase 1,43 jt, OKX 55, Bybit 18,8,
Binance 2 3 token, Kraken 0; POPCAT — Coinbase 5,09 jt, Binance 2
1,35 jt, lainnya 0 / ATA belum ada.
Perkiraan skor keyed SETELAH pengecualian (perlu konfirmasi tes pakai key):
BONK top-10 ~40,6% → ~32% = 18 poin → **~81 (Aman, naik dari 73)**;
WIF top-10 ~45,3% → ~35% = 18 poin → **~88 (naik dari 80)**;
POPCAT ~38,4% praktis tetap → **88**. Di bawah cek holder kini ada baris
"Tidak dihitung: akun pool likuiditas, alamat burn, dompet exchange."
(hanya jenis yang benar-benar ketemu di top-10 yang disebut).

**3. Mobile below-the-fold (selesai):** gauge mobile 120px (dulu 140px);
padding halaman mobile 20px/12px, hero margin 16px, kartu 16px; hasil scan
otomatis di-scroll ke atas viewport (`scrollIntoView` smooth) begitu scan
selesai — verdict langsung terlihat tanpa scroll manual.

**4. Clear + Paste di input (selesai):** tombol × di dalam input (muncul
bila ada teks) + tombol "Tempel" (`navigator.clipboard.readText`; bila
ditolak browser, tampil pesan ramah "Tidak bisa membaca clipboard — tempel
alamat secara manual.").

**5. Identitas token + aksi cepat (selesai):** logo token dibaca dari URI
metadata Metaplex → fetch JSON (timeout 6 detik) → field `image`,
`ipfs://` diubah ke gateway `https://ipfs.io/ipfs/`; gagal/hilang →
avatar huruf pertama simbol (tidak pernah memblokir scan). Tombol salin
alamat (⧉) di samping alamat mint. Tombol "Bagikan" pakai
`navigator.share` (title + teks + link `?mint=`), fallback salin link
bila Web Share tidak tersedia / gagal; batal dari share sheet tidak
dianggap error.

**6. Header simetris (selesai):** toggle ID/EN kini di baris sendiri
(`.lang-row`, rata kanan) di atas judul — judul benar-benar di tengah di
semua lebar layar; `position: absolute` dihapus.

**7. Ticker huruf besar (selesai):** heading hasil tampil "Bonk (BONK)",
"$WIF" tetap "$WIF".

**8. Tombol utama navy (selesai):** tombol Scan kini `#0f172a` (warna kata
"Rug") + hover `#1e293b`; focus ring, border input fokus, spinner, dan
tombol aktif toggle bahasa ikut navy. Merah tinggal untuk sinyal bahaya
(gauge/verdict/badge fail) + aksen logo "Radar"/eyebrow.

**Verifikasi:**
- `npm run build` BERHASIL (tsc + vite, 82 modul, JS 361,20 KB, bundle
  `index-C70J0_mt.js`; string + class baru terverifikasi ada di `dist/`).
- `npx tsx scripts/test-scan.ts` (tanpa key): BONK 63 / WIF 70 / POPCAT 70,
  holder 0/30 (tanpa data) — sama seperti ekspektasi, tidak ada yang rusak.
- PENTING: build lokal ini dibuat TANPA `VITE_HELIUS_API_KEY`, jadi JANGAN
  deploy `dist/` ini apa adanya. Deploy v6 harus rebuild dengan key yang
  sama seperti v4/v5, baru push ke `gh-pages` — dan konfirmasi skor keyed
  baru (perkiraan BONK ~81, WIF ~88, POPCAT 88) lewat tes pakai key.

## v7 — audit #3: Smart Input, Pair detection, Market card, Token-2022, Bonding Curve, Dark Mode, Recent Scans, Timestamp, Skeleton, Methodology + agregat likuiditas, LP Orca, layout desktop 2 kolom (27 Nov ~14:30–15:00 WIB, BELUM deploy)

Model skor 100 poin TIDAK berubah (Mint 20 + Freeze 20 + Holder 30 +
Likuiditas 30). Semua fitur baru bersifat informatif / tampilan, kecuali
cek Token-2022 dan LP yang tampil sebagai check ekstra di luar skor.

### P1 — Smart Input Parser + Pair vs Mint + Kartu Likuiditas (selesai)

**1. Smart Input Parser (selesai):** input menerima URL lengkap, bukan
cuma alamat — `extractMintCandidate()` (regex, `src/lib/scanner.ts`)
mengekstrak mint dari `dexscreener.com/solana/<mint>`,
`pump.fun/coin/<mint>` dan `pump.fun/<mint>`, `birdeye.so/token/<mint>`,
`solscan.io/token/<mint>` dan `solscan.io/account/<mint>`, plus alamat
telanjang dan fallback substring base58. Whitespace di-trim dulu.
Alamat hasil ekstraksi ditampilkan kembali di input. Cek `0x...` (EVM)
dilakukan SEBELUM ekstraksi — string hex panjang bisa mengandung
potongan yang mirip base58. Verifikasi live: 11/11 kasus lolos
(4 format URL + query string + spasi + teks biasa → null + URL asing
→ null).

**2. Pair vs Mint detection (selesai):** bila alamat yang ditempel adalah
alamat pair/pool (bukan mint), `scanToken` menangkap `notMintError`
dari `readMint` lalu memanggil `resolvePairBaseToken()` (DexScreener
`GET /latest/dex/pairs/solana/<pair>`, timeout 8 detik) dan memindai
token dasarnya — satu level, tanpa rekursi. Hasil scan mencatat
`resolvedFromPair` dan UI menampilkan catatan singkat
(`pairConvertedNote`, ID+EN). Bila tidak bisa di-resolve, error
spesifik `pairGuidanceError` (ID+EN), bukan "not found" generik.
Verifikasi live: pair Raydium WIF
`EP2ib6dYdEeqD8MfE2ezHCxX3kP3K2eLKkirfPm5eyMx` → resolve ke mint WIF
`EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm`, scan jalan, skor 70
(tanpa key). Alamat dompet
`5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9` → error panduan
spesifik, lolos. Catatan: mint-not-found (tidak ada akun sama sekali)
TIDAK di-resolve — pair address selalu ada sebagai akun.

**3. Kartu Konteks Pasar (selesai, + agregat v7-A):** kartu kompak di
bawah statistik — Likuiditas, Market Cap, Usia Pair, Rasio
Likuiditas/Market Cap — semua dari data DexScreener yang sudah
diambil. Peringatan thin-liquidity bila rasio < 1% ("harga bisa
bergerak tajam dari trade kecil dan token bisa sulit dijual, meskipun
mint/freeze authority sudah dicabut", ID+EN). **Agregat (tambahan
v7-A):** kartu kini menampilkan TOTAL agregat — `liquidity.usd` +
`volume.h24` dijumlahkan dari SEMUA pair yang dikembalikan API
(`fetchDexPair` kini mengembalikan `totalLiquidityUsd` /
`totalVolume24hUsd` / `totalLiquidityRatioPct`) — dengan label jelas
"Likuiditas (total semua pair DEX)" / "Volume 24j (total semua pair
DEX)". Rasio + peringatan di kartu memakai rasio agregat (fallback ke
rasio pair teratas bila agregat tidak ada). Cek Likuiditas yang masuk
skor TIDAK berubah — tetap pair teratas. Contoh live BONK: pair teratas
Orca $217,3 rb, total 30 pair = $767,1 rb likuiditas, $271,4 rb volume
24j, rasio agregat 0,4% (rasio pair teratas 0,1%).

### P2 — Token-2022 + Bonding Curve + Dark Mode (selesai)

**4. Token-2022 detection (selesai, VERIFIKASI LIVE):** `checkToken2022()`
membaca owner akun mint — program SPL klasik → pass "Token SPL
standar"; program Token-2022 → parse ekstensi TLV dari raw account
(`fetchRawAccount`, tidak pernah throw). Ekstensi berbahaya yang
dilaporkan: Permanent Delegate (12), Transfer Fee (1), Transfer Hook
(14). Check informatif, di luar skor 100. **BUG KRITIS DITEMUKAN &
DIPERBAIKI SAAT VERIFIKASI:** parser awal membaca TLV dari offset 82
dan selalu melaporkan "tanpa ekstensi" (false negative). Layout asli
Token-2022 — DIVERIFIKASI on-chain 27 Nov pada mint PYUSD + USDG
(keduanya 866 byte, owner Token-2022): base mint 82 byte + padding nol
sampai byte 165, discriminator 1 byte (= Mint) di offset 165, entri
TLV mulai offset 166. Parser diperbaiki (166 bila byte 165 = 1,
fallback 83 bila byte 82 = 1, mint 82 byte telanjang = tanpa ekstensi).
Verifikasi live setelah perbaikan — PYUSD
`2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo` (alamat benar dari
solana.com, BUKAN varian salah ingat `...5d3qA5X6E` yang ditolak RPC
sebagai invalid): **Permanent Delegate + Transfer Fee + Transfer Hook
TERDETEKSI** (juga 5 ekstensi lain: MintCloseAuthority,
ConfidentialTransferMint, ConfidentialTransferFeeConfig, TokenMetadata,
GroupPointer — tidak dilaporkan karena di luar daftar berbahaya).
BONK/WIF/POPCAT → "Token SPL standar", lolos. **Rekomendasi ke parent:
jadikan penalti skor di rilis berikut — Permanent Delegate saja sudah
cukup untuk menguras holder (issuer bisa memindah/bakar token dari
dompet siapa pun); Transfer Fee + Transfer Hook bisa dipakai untuk
honeypot. Usulan: −15 Permanent Delegate, −10 Transfer Fee, −10
Transfer Hook (maks −35, dari total 100) — keputusan di tangan parent.**

**5. Bonding-curve status (selesai, VERIFIKASI LIVE):** token yang pair
teratasnya `dexId` `pumpfun`/`moonshot` diberi label "Masih di Bonding
Curve — belum migrasi ke DEX" (EN setara) di bawah nama token, dan cek
LP Burn/Lock di-skip sebagai tidak berlaku (pass, bukan warn yang
menyesatkan). **BUG DITEMUKAN & DIPERBAIKI SAAT VERIFIKASI:**
`fetchDexPair` memfilter pair tanpa `liquidity.usd` — padahal pair
pump.fun memang melaporkan `liquidity: null` (curve pegang SOL, bukan
pool USD) — sehingga label bonding curve TIDAK PERNAH bisa muncul.
Filter diperbaiki: pair bonding curve dipertahankan (diurutkan sebagai
likuiditas 0). Verifikasi live: token pump.fun
`5KUTPKGUxBAMnGzNPo4sZJRBLpfRa3fUiXd6cZKDpump` → `isBondingCurve=true`,
LP "Token masih di bonding curve — belum ada LP tradisional, jadi cek
LP burn tidak berlaku." Skor 42 (tanpa key).

**6. Dark Mode (selesai):** toggle Gelap/Terang di samping toggle
bahasa (ikon bulan/matahari SVG inline), tersimpan di localStorage
`rugradar-theme`, default terang. `index.html` punya script init kecil
di `<head>` yang menerapkan tema tersimpan sebelum React render (tanpa
flash tema salah). `App.css` ditulis ulang penuh dengan CSS variables
(`:root` terang + `[data-theme="dark"]` gelap) — SEMUA elemen bertema:
teks, kartu, input, chip, tombol, gauge (track pakai class
`gauge-track`, bukan hardcode `#e5e7eb`), verdict, link, footer, focus
ring (`#93c5fd` di gelap); tombol utama gelap = latar terang `#e2e8f0`
+ teks gelap supaya tetap terlihat; aksen merah gelap `#f87171`.
Template dark-mode Vite yang rusak (v4) TIDAK diperkenalkan kembali.
Verifikasi: build lolos; pengecekan visual di browser belum dilakukan
— parent perlu lihat langsung sekali sebelum demo.

### Tambahan v7 — A/B/C (selesai, 27 Nov ~14:40 WIB)

**A. Likuiditas agregat di kartu (selesai):** lihat poin 3 di atas —
total semua pair DEX ditampilkan di kartu dengan label jelas; skor
tetap pair teratas. Verifikasi live: BONK $767,1 rb / $271,4 rb; WIF
$4,16 jt / $688,3 rb; POPCAT $2,81 jt / $300,8 rb.

**B. LP check untuk pair Orca (selesai):** bila pair teratas `dexId`
`orca`, cek LP kini berbunyi "Tidak berlaku untuk pool Orca
(concentrated liquidity) — tidak ada LP token yang bisa di-burn, jadi
cek ini dilewati." (EN setara), status pass informatif — bukan lagi
"tidak bisa diperiksa". Alasan: Orca pakai concentrated liquidity
(posisi NFT), bukan LP token fungible. Verifikasi live BONK (pair
teratas Orca): pesan baru tampil. WIF/POPCAT (pair teratas Raydium)
tetap memakai jalur lama ("tidak bisa diperiksa") karena data pool
Raydium tidak terbaca dari VM — perilaku lama, di luar cakupan B.

**C. Layout desktop dua kolom (selesai, BELUM DIVERIFIKASI VISUAL):**
hasil scan kini memakai `.result-cols` — di layar ≥900px, grid 2 kolom
(300px + 1fr): gauge + verdict di kiri, statistik + kartu pasar di
kanan; checks + tombol share + meta tetap selebar penuh di bawahnya.
Mobile (<900px) tetap satu kolom (gauge di tengah atas, verdict,
statistik, kartu pasar). Verifikasi: build lolos + class ada di
`dist/`; tampilan visual desktop BELUM dicek di browser — parent perlu
lihat sekali sebelum demo.

### P3 — Recent Scans, Timestamp, Skeleton, Partial Fallback, Methodology, i18n (selesai)

**7. Recent Scans (selesai):** 8 scan terakhir tersimpan di localStorage
`rugradar-recent` (dedupe per mint), tampil sebagai chip kecil di bawah
contoh token (nama/simbol + skor bila diketahui). Klik chip memindai
ulang token itu.

**8. Timestamp + Rescan (selesai):** di bawah hasil tampil timestamp
relatif ("Diperbarui baru saja / X menit lalu / X jam lalu", EN setara,
diperbarui tiap 30 detik) + tombol "Pindai Ulang" (juga ada di baris
share) yang menjalankan ulang scan saat ini.

**9. Skeleton loading (selesai):** saat memindai, area hasil menampilkan
skeleton shimmer (gauge + baris + 4 placeholder statistik) BERSAMA
teks langkah (step text) yang sudah ada.

**10. Partial fallback (selesai — audit + 1 perbaikan):** audit aliran
scan: DexScreener gagal → `dexError`, hasil tetap tampil tanpa data
pasar; `readTopHolders` gagal → `.catch(() => null)`; Jupiter gagal →
`null` (unknown, bukan honeypot); metadata/logo gagal → warn + avatar
huruf; Token-2022 tidak terbaca → warn; LP tidak terbaca → warn;
`fetchRawAccount`/`getLargestAccounts`/`getTokenSupplyRaw` tidak pernah
throw (return null). **Perbaikan:** satu-satunya `await` tanpa pelindung
— derivasi ATA incinerator `burnTokenAccountAddress(mint)` — kini
dibalut `.catch(() => null)` (tipe `string | null`, downstream
null-safe). Satu-satunya kegagalan total yang tersisa adalah `readMint`
gagal di semua endpoint RPC — benar begitu, karena tanpa data mint
tidak ada token yang bisa dipindai (error diterjemahkan, lihat poin 12).

**11. Methodology (selesai):** tombol "ⓘ Cara Kerja Skor" di bawah gauge
membuka modal: bobot (Mint 20 + Freeze 20 + Holder 30 + Likuiditas
30 = 100), pita verdict, eksklusi yang diterapkan (pool/burn/CEX),
sumber data (Solana RPC/Helius, DexScreener, Jupiter), plus penjelasan
check ekstra. Tutup via ESC / backdrop / tombol ×. ID+EN.

**12. i18n verification (selesai — 1 kebocoran diperbaiki):** seluruh
string dinamis UI berasal dari `STRINGS[lang]`; `fmtUsd` memakai
`jt/rb/M` (ID) vs `M/K/B` (EN); langkah loading, badge holder, error
input/paste/share — semua diterjemahkan. Nama token/simbol dari
DexScreener/metadata tetap apa adanya (data, bukan UI). **Kebocoran
yang diperbaiki:** saat SEMUA endpoint RPC gagal, `readMint` melempar
`rpcErrorPrefix + pesan RPC mentah (Inggris)` yang tampil verbatim di
UI — kini hanya status HTTP yang dipertahankan (`... (HTTP 429)`),
sisanya prefix terjemahan saja.

### Verifikasi

- `npm run build` BERHASIL (tsc + vite, 82 modul, JS 376,91 KB, bundle
  `index-B_6kQKox.js`, CSS 15,17 KB).
- `npx tsx scripts/test-scan.ts` (tanpa key, 27 Nov ~15:00 WIB): BONK
  63 / WIF 70 / POPCAT 70, holder 0/30 — SAMA seperti ekspektasi, tidak
  ada yang rusak. Agregat: BONK $767,1 rb / $271,4 rb (rasio 0,4%);
  WIF $4,16 jt / $688,3 rb (3,0%); POPCAT $2,81 jt / $300,8 rb
  (10,5%). Skor keyed (dengan Helius) diperkirakan tetap BONK ~81,
  WIF ~88, POPCAT 88 seperti v6 — BELUM dites ulang dengan key.
- Verifikasi fitur baru (script `/tmp`, bukan bagian repo):
  `extractMintCandidate` 11/11; resolve pair WIF → mint WIF; scan pair
  address → `resolvedFromPair` terisi; alamat dompet → error panduan
  spesifik; PYUSD live → 3 ekstensi berbahaya terdeteksi; token
  pump.fun live → bonding curve + LP n/a; string EN (LP Orca,
  Token-2022) tampil benar.
- PENTING: build lokal ini dibuat TANPA `VITE_HELIUS_API_KEY`, jadi
  JANGAN deploy `dist/` ini apa adanya. Deploy v7 harus rebuild dengan
  key yang sama seperti v4/v5/v6, baru push ke `gh-pages` — dan
  konfirmasi skor keyed + tampilan desktop 2 kolom + dark mode lewat
  browser sebelum diumumkan.
- Caveat `moonshot` di `BONDING_CURVE_DEX_IDS`: dexId Moonshot belum
  terverifikasi live (hanya `pumpfun` yang dites) — asumsi dari nama
  dexId DexScreener, risiko kecil (bila salah, token Moonshot hanya
  tidak dapat label, bukan error).

### Penalti Token-2022 (27 Nov ~15:20 WIB, setelah v7)
- Cek Ekstensi Token-2022 bukan lagi informatif — jadi PENALTI pada total
  skor: Permanent Delegate −15, Transfer Fee −10, Transfer Hook −10
  (maks −35, total skor floor 0). Status: fail bila ada ekstensi, warn
  bila Token-2022 tanpa ekstensi berbahaya, pass untuk SPL standar.
  Baris kehilangan poin tampil via mekanisme lostReason yang sama
  ("−15 poin karena Permanent Delegate"). Modal methodology diperbarui
  (bagian penalti + extras tanpa Token-2022).
- Verifikasi: `npm run build` bersih (JS 377,88 KB, bundle
  `index-CvhwLKvW.js`). `test-scan.ts` tanpa key: BONK 63 / WIF 70 /
  POPCAT 70 — TIDAK berubah (ketiganya SPL standar, penalti 0). PYUSD
  live (`2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo`): ketiga ekstensi
  terdeteksi, cek token2022 FAIL 0/35, lostReason "Permanent Delegate,
  Transfer Fee, Transfer Hook" — penalti −35 penuh, skor total 0/100
  (base tanpa key 30 − 35, floor 0). Skor keyed BONK ~81 / WIF ~88 /
  POPCAT 88 diperkirakan tetap (belum dites ulang dengan key).
- Build lokal ini TANPA key — JANGAN deploy apa adanya; deploy harus
  rebuild dengan key seperti biasa.

### v7.1 — perbaikan layout hasil QA visual live (27 Nov ~14:56 WIB, CSS/layout saja)
- Defect 1 (KONTEKS PASAR): grid 4 kolom di desktop dihapus — kartu kembali
  2×2 di semua lebar (aturan `@media (min-width: 561px)` yang memaksa 4
  kolom dihapus). Label dipendekkan: "Likuiditas (total DEX)", "Volume 24j
  (total DEX)", "Likuiditas / Market Cap" (ID+EN). Nilai pakai
  `white-space: nowrap` supaya angka tidak terbelah ("$766.9 rb" tetap
  satu baris). 4 data point tetap sama.
- Defect 2 (TOKEN): nilai stat pakai `white-space: nowrap` — "3.871 / 3.869"
  (Transaksi 24j) tetap satu baris.
- Defect 3 (input): padding kanan input 34px → 46px supaya ujung alamat
  tidak tertutup tombol ×; input juga punya `title` = alamat lengkap
  (tooltip saat hover). Tombol × tetap jalan.
- Minor (tautan eksternal): ketiga link (DexScreener/Solscan/Bubblemaps)
  dibungkus `<span class="meta-links">` (inline-flex, gap, wrap per link,
  tiap link nowrap) — tidak lagi terpotong di tengah frasa.
- Verifikasi: `npm run build` bersih (JS 377,79 KB, bundle
  `index-DB3MdzTS.js`; string + class baru terverifikasi ada di `dist/`).
  Tidak ada perubahan logika/skor — tidak perlu tes ulang token.
- Build lokal ini TANPA key — JANGAN deploy apa adanya; deploy harus
  rebuild dengan key seperti biasa.

### v7.2 — ronde perbaikan audit kode (27 Nov ~15:40 WIB, tanpa perubahan skor)
- A (halaman terlalu sempit): `.page` di desktop (≥900px) kini `max-width: 980px`
  (dari 720px); `.stat` dan `.market-item` dapat `min-width: 0; overflow: hidden;`
  supaya nilai panjang tidak pernah keluar dari selnya.
- B (Enter = scan ganda): `runScan` kini early-return saat `loading` true —
  tidak ada lagi dua scan bersamaan yang bisa balapan.
- C (clear input = hasil basi): `clearInput` kini juga menghapus `result` dan
  `pairNote`, bukan cuma input + error + URL.
- D (harga kecil notasi ilmiah): `fmtUsd` di App.tsx kini format 0 < n < 0.01
  dengan `toFixed(10)` + buang nol di ujung — terverifikasi: 3.08e-9 →
  "$0.0000000031", 0.0000193 → "$0.0000193". Tidak ada lagi "$3.08e-9".
  (Catatan: `fmtUsd` di scanner.ts pakai `toFixed(2)` — tidak pernah notasi
  ilmiah, jadi tidak diubah.)
- E (nama/symbol fallback metadata): `parseMetadataFields` kini juga
  mengembalikan `name` + `symbol`; `scanToken` memakai nama/symbol Metaplex
  (NUL padding di ujung dibuang) saat DexScreener tidak punya pair — header
  tidak lagi "Unknown / (???)" untuk token baru tanpa pasar.
- F (pair resolve token salah): `resolvePairBaseToken` kini mengembalikan
  quote token bila base-nya SOL/USDC/USDT dan quote ada — pair TOKEN/USDC
  dengan token sebagai quote tidak lagi di-scan sebagai USDC.
- G (Token-2022 166 byte): akun tepat 166 byte dengan discriminator 1 di
  offset 165 kini mengembalikan set kosong (tanpa ekstensi), bukan null
  ("unavailable"). Diverifikasi lewat baca kode — fungsi tidak di-export,
  belum ada harness unit test.
- H (transparansi pair teratas vs agregat): modal metodologi dapat satu baris
  baru (ID+EN): kartu pasar = total semua pair DEX, cek skor = pair
  likuiditas terbesar saja.
- Verifikasi: `npm run build` bersih (JS 378,69 KB, bundle `index-D2vvDLNr.js`).
  `test-scan.ts` tanpa key: BONK 63 / WIF 70 / POPCAT 70 — TIDAK berubah
  (model skor, bobot, dan penalti Token-2022 tidak disentuh).
- Build lokal ini TANPA key — JANGAN deploy apa adanya; deploy harus
  rebuild dengan key seperti biasa.

### v7.3 — ronde perbaikan review user atas demo live (27 Nov ~15:45–16:00 WIB, BELUM deploy)

Perintah Yukka 15:39 WIB (review video demo live) + tambahan 15:48 WIB.
Model skor 100 poin, bobot, dan penalti Token-2022 TIDAK berubah.

**1. Label likuiditas pair utama vs total (selesai):** label statistik
kini "Likuiditas (pair utama)" / "Volume 24j (pair utama)" (ID+EN);
kartu pasar tetap "(total DEX)". Detail cek Likuiditas kini berbunyi
"Pair utama: likuiditas $…, volume 24 jam $…, umur pool … (DEX: …)"
(EN: "Primary pair: …"). Modal metodologi sudah punya baris penjelas
ini sejak v7.2 — dipertahankan.

**2. Status INFO netral untuk "tidak bisa dicek" (selesai):** tipe
`CheckStatus` kini punya `'info'` — Jupiter tidak merespons
(`sellable === null`), LP tidak bisa dibaca, dan metadata tidak bisa
dibaca kini berstatus `'info'`, bukan WASPADA. Badge-nya netral (lihat
poin C di bawah). Yang tetap WASPADA: Jupiter menjawab tanpa rute
(kemungkinan honeypot), LP terbakar <95% / tidak terbakar, metadata
mutable. Cek ber-skor (mint/freeze/holders/liquidity/token2022) TIDAK
diubah logika statusnya.

**3. LP tidak berlaku untuk Meteora (selesai):** seperti Orca, pair
Meteora (DLMM, concentrated liquidity) kini mendapat hasil LP "tidak
berlaku" (status `'na'`, string `lpMeteora` ID+EN) — tidak ada LP token
yang bisa di-burn.

**4. Logo fallback via DexScreener (selesai):** tipe `DexPair` kini
punya `info.imageUrl`; `scanToken` memakai logo Metaplex dulu, lalu
`info.imageUrl` DexScreener, lalu avatar huruf pertama simbol (tidak
pernah kotak abu-abu kosong). Chip recent-scan kini menampilkan logo
kecil ~20px (class `.token-logo-sm`); entri lama tanpa `logoUrl`
di localStorage tetap dimuat (default null → avatar huruf).

**5. Tombol Paste di dalam input (selesai):** tombol "Tempel" selebar
penuh di bawah input DIHAPUS. Ikon clipboard kini di dalam sisi kanan
input, berdampingan dengan × (paste selalu tampil, × hanya bila ada
teks; padding kanan input 76px supaya teks tidak tertutup ikon). Di
mobile baris input kini hanya input + tombol Scan. Tombol Scan tetap
navy/gelap.

**6. Tombol aksi grid 2×2 + tautan eksternal pill (selesai):** baris
share (Salin hasil, Salin link, Bagikan, Pindai Ulang) kini grid 2
kolom, tombol selebar penuh. Tautan DexScreener/Solscan/Bubblemaps kini
pill satu baris dengan label pendek nama platform saja, tiap pill utuh
(tidak terpotong di tengah kata).

**7. Helius dulu untuk mint + vault (selesai):** `readMint` dan
`getTokenAccountMint` kini mencoba Helius dulu bila key tersedia, lalu
RPC publik — sama seperti `getLargestAccounts`/`fetchRawAccount`.
**PENTING (keamanan):** `rpcUsed` kini disimpan TANPA query string
(`endpoint.replace(/\?.*$/, '')`) + tampilan di footer juga memotong
`?…` — URL Helius membawa API key di `?api-key=`, dan `rpcUsed`
ditampilkan di footer UI, jadi key TIDAK PERNAH bocor ke halaman.

**A. Label penalti Token-2022 (selesai, prioritas tertinggi):** kartu
Token-2022 tidak lagi menampilkan "35/35 pts" (yang membuat total
kartu jadi 123/135). Field baru `scoreLabel` di `CheckResult`:
penalti 0 → "Tanpa penalti" / "No penalty"; ada penalti → "−15 poin" /
"−35 poin" (EN: "−15 pts" / "−35 pts") — angka penaltinya saja.
LostReason ("−35 poin karena …") tetap tampil. Perhitungan skor TIDAK
berubah (field `score`/`maxScore` 35−penalti/35 tetap dipakai untuk
lostLine).

**B. Akar masalah kontradiksi LP POPCAT (selesai — verifikasi live):**
`getTokenSupplyRaw` kini juga Helius-dulu (sebelumnya satu-satunya
fungsi baca akun yang masih RPC-publik saja; `fetchRawAccount` dan
`getLargestAccounts` memang sudah Helius-dulu). **Bukti parse sudah
benar di run ini (tanpa key):** `poolVaultExcluded: true` untuk WIF
DAN POPCAT — derivasi pool Raydium + verifikasi vault jalan lewat RPC
publik; vault POPCAT `4Vc6N76UBu26c3jJDKBAbvSD7zPLuQWStBk7QgVEoeoS`
kini teridentifikasi dan akan terexclude dari top-10 begitu data holder
tersedia (dengan key). Perkiraan parent terkonfirmasi arahnya: top-10
POPCAT ~34,1% (tetap 18 pts, skor keyed tetap 88). Di run tanpa key,
cek LP WIF/POPCAT masih 'info' karena `getTokenLargestAccounts` untuk
LP mint diblokir RPC publik (429) — butuh key Helius untuk selesai;
dengan key, cek LP seharusnya jalan. BONK `poolVaultExcluded: false`
— benar, pair teratasnya Orca (bukan Raydium).

**C. Badge 'info' harus netral (selesai):** `badgeLabel` kini memetakan
setiap status unscored secara eksplisit — tidak ada yang jatuh ke
WASPADA secara diam-diam: `info` → "TIDAK TERSEDIA" / "UNAVAILABLE",
`na` → "N/A", `pass` → "INFO", `warn` → "WASPADA", `fail` →
"BAHAYA". Status baru `'na'` dipakai untuk LP tidak berlaku (bonding
curve, Orca, Meteora). CSS: `.check-info` dan `.check-na` pakai border
kiri + badge abu-abu netral (`var(--faint)` / `var(--muted)`), bukan
kuning/merah. Teks salin hasil: info → "?", na → "n/a".

**D. MARKET + MARKET CONTEXT digabung (selesai):** satu blok "Pasar":
Market Cap sekali saja; Likuiditas (total DEX) + sub-catatan nilai pair
utama; Volume 24j (total DEX) + sub-catatan nilai pair utama; rasio
Likuiditas/Market Cap; umur pair; Perubahan 24j; Transaksi 24j.
"Perubahan 24j" dan "Transaksi 24j" pindah dari kelompok TOKEN ke Pasar
(keduanya metrik pasar). Transaksi kini berlabel "720 Beli / 1.030
Jual" (EN: "720 Buy / 1.030 Sell") — Beli hijau, Jual merah. Harga
token tetap di kelompok TOKEN (bersama Total Supply + Top 10 Holder).
Blok `.market-card` terpisah DIHAPUS (CSS `.market-card` /
`.market-grid` / `.market-item` ikut dihapus); peringatan thin-liquidity
tetap tampil di bawah blok Pasar. String `marketCardTitle` di i18n
kini tidak terpakai (dibiarkan, tidak merusak apa pun).

**E. Top 5 Holders bisa diklik (selesai):** setiap alamat di daftar Top
5 Holders kini tautan ke `https://solscan.io/account/<address>` (tab
baru). `EeaEs5YjNndVRHscaxx1urBEQWe4bhrnVMhTz2ven61r` (holder terbesar
POPCAT, 16,8%) TIDAK ditambahkan ke pengecualian CEX — bukan salah satu
dari 6 wallet CEX terverifikasi dan identitasnya tidak terverifikasi;
tautan Solscan adalah perbaikan yang benar (pengguna memverifikasi
sendiri), bukan pengecualian tanpa bukti.

**F. Ikon copy sejajar pill alamat (selesai):** `.mint-line` kini
`flex-wrap: nowrap` + `code` flex: 1 — ikon copy-address tetap satu
baris di kanan pill alamat (tidak jatuh ke bawah di HP); alamat
membungkus di dalam pill-nya sendiri bila panjang.

**G. Jupiter: satu retry (selesai):** `checkSellable` kini mencoba 2
kali (timeout 10 detik per percobaan) sebelum mengembalikan
"unavailable" — retry pada error jaringan/timeout dan HTTP 429/5xx;
4xx langsung menyerah (retry tidak akan membantu). Gagal total tetap
status `'info'` (UNAVAILABLE), bukan indikasi honeypot. Tidak ada
investigasi CORS tambahan (quote-api.jup.ag tidak terjangkau dari VM
ini — diketahui, bukan bagian dari perbaikan).

**Verifikasi:**
- `npm run build` BERHASIL (tsc + vite, 82 modul, JS 380,40 KB,
  bundle `index-CRSHzJhg.js`, CSS 15,71 KB).
- `npx tsx scripts/test-scan.ts` (tanpa key, 27 Nov ~15:52 WIB):
  BONK **63** / WIF **70** / POPCAT **70** — TIDAK berubah.
  Status baru tampil benar: BONK LP `[NA]` (Orca), sellable `[INFO]`
  (Jupiter tidak terjangkau dari VM — diketahui); WIF/POPCAT LP
  `[INFO]` (tidak bisa diperiksa tanpa key); token2022
  `scoreLabel= "Tanpa penalti"` di ketiganya.
- Logo fallback terverifikasi: WIF memakai gambar DexScreener CDN
  (`cdn.dexscreener.com/...`) karena gambar metadata gagal; BONK dan
  POPCAT memakai gambar metadata (arweave).
- PYUSD live (script sekali pakai `/tmp/v73-pyusd.ts`): skor **0/100
  Berisiko Tinggi**, token2022 FAIL 0/35, `scoreLabel= "−35 poin"`,
  lostReason "Permanent Delegate, Transfer Fee, Transfer Hook" —
  label penalti tampil benar.
- Tidak ada referensi usang: `.market-card` / `.market-grid` /
  `.market-item` / `.input-paste` sudah tidak ada di kode; string
  `lpMeteora`, `badgeUnavailable`, `badgeNa` terpakai di ketiga file.
- PENTING: build lokal ini dibuat TANPA `VITE_HELIUS_API_KEY`, jadi
  JANGAN deploy `dist/` ini apa adanya. Deploy v7.3 harus rebuild
  dengan key seperti biasa, baru push ke `gh-pages` — dan konfirmasi
  skor keyed (perkiraan BONK ~81, WIF ~88, POPCAT 88, dengan top-10
  POPCAT kini ~34,1% setelah vault terexclude) lewat tes pakai key.

## v7.4 — ringkasan risiko berbahasa awam di bawah gauge (27 Nov ~16:05 WIB, BELUM deploy)

Fitur pembeda: kotak ringkasan 2–3 kalimat tepat di bawah gauge + verdict,
menjawab "token ini bersih atau ada jebakannya?" untuk pengguna non-teknis.
Rule-based murni di `src/lib/summary.ts` (`buildRiskSummary`) — tanpa AI,
tanpa API tambahan, instan (0 ms). TIDAK PERNAH memberi saran beli: hanya
fakta risiko, keputusan tetap di pengguna (dicek otomatis di probe: tidak
ada frasa "aman dibeli" / "rekomendasi buy" / "safe to buy" di semua hasil).

**Struktur data dulu (tidak pernah parse teks detail yang sudah diterjemahkan):**
- `ScanResult.token2022Found: ('permanent-delegate' | 'transfer-fee' | 'transfer-hook')[]`
  — `checkToken2022` kini mengembalikan `foundIds` di samping `foundNames`.
- `ScanResult.lpBurnedPct` / `lpTop1Pct` — `checkLpBurn` kini mengembalikan
  angka mentahnya (null bila LP tidak berlaku / tidak bisa dibaca).
- `ScanResult.metadataMutable: boolean | null` — dari `parseMetadataFields`
  yang sudah dibaca sekali per scan (tidak ada RPC tambahan).
- `fmtUsd` dari `scanner.ts` kini di-export untuk dipakai summary.
- Semua fragmen kalimat di `STRINGS[lang]` (ID + EN, paritas key ditegakkan
  TypeScript). Summary dihitung ulang saat render dari hasil scan, jadi
  ikut berubah saat toggle ID/EN. Teks ringkasan juga masuk ke "Salin hasil"
  sebagai baris pertama setelah baris skor.

**Logika prioritas (`buildRiskSummary`):**
1. Bahaya fatal WAJIB kalimat pertama (maks 3 item, diurutkan): tidak ada
   rute jual Jupiter → ekstensi Token-2022 berbahaya (dikelompokkan, nama
   ekstensi disebut + implikasi terburuknya) → Mint Authority aktif →
   Freeze Authority aktif → satu dompet > 50% suplai. Top-10 ≥ 50% ikut
   disebut di kalimat yang sama bila masih ada ruang. Kalimat kedua =
   konsekuensi (rug pull sangat tinggi / dana terjebak bila hanya tidak
   bisa dijual / satu dompet bisa menjatuhkan harga bila hanya top-1).
2. Kontrak bersih → sorot risiko pasar/distribusi, maks 2 teratas sesuai
   urutan: Top-10 ≥ 50% → tidak ada pasar → likuiditas tipis < $10 rb
   (atau kecil < $50 rb) → pair < 24 jam (atau < 7 hari) → LP belum
   dibakar (sebut % pemegang LP terbesar) → metadata mutable → bonding
   curve. Kalimat kedua = konsekuensi (slippage/dump, atau tanpa-pasar).
3. Semua hijau → kalimat positif (+ klausa likuiditas dalam bila total
   DEX ≥ $250 rb) + catatan dompet terbesar bila top-1 ≥ 10% ("cek di
   Solscan apakah itu dompet exchange/pool atau individu") + pengingat
   bahwa skor tidak menjamin pergerakan harga.

**Verifikasi:**
- `npm run build` BERHASIL (tsc + vite, JS 388,34 KB, bundle
  `index-KlbtzxfL.js`, CSS 15,97 KB).
- `npx tsx scripts/test-scan.ts` (tanpa key): BONK **63** / WIF **70** /
  POPCAT **70** — TIDAK berubah (model skor tidak disentuh).
- Probe live tanpa key (`scripts/probe-summary.ts`, sudah dihapus):
  - POPCAT 70/100 (ID): "Kontrak token bersih: dev tidak bisa mencetak token baru atau membekukan saldo, dan likuiditas pasarnya cukup dalam. Ingat: skor ini menilai kontrak dan pasarnya, bukan menjamin harga akan naik."
  - BONK 63/100 (ID): "Kontrak token bersih: dev tidak bisa mencetak token baru atau membekukan saldo, tetapi metadata token masih bisa diubah dev. Ingat: skor ini menilai kontrak dan pasarnya, bukan menjamin harga akan naik."
  - WIF 70/100 (ID): sama polanya dengan POPCAT.
  - PYUSD 0/100 (ID): "Bahaya terdeteksi: ekstensi Token-2022 berbahaya (Permanent Delegate, Transfer Fee, Transfer Hook) — dev bisa menarik token dari dompet holder mana pun, Mint Authority masih aktif — dev bisa mencetak suplai tambahan kapan saja dan Freeze Authority masih aktif — dev bisa membekukan token di dompet siapa pun. Risiko rug pull sangat tinggi." — ketiga ekstensi disebut namanya, bahaya fatal memimpin kalimat pertama.
  - Bonding-curve pump.fun `B2kLyhVr1Lay5Sz4WFxaK3keL5XGY5zPt9BBuFwUpump` 43/100 (ID): "Kontrak token bersih: dev tidak bisa mencetak token baru atau membekukan saldo, tetapi token masih di bonding curve dan belum punya LP di DEX. Ingat: skor ini menilai kontrak dan pasarnya, bukan menjamin harga akan naik."
  - Semua versi EN-nya juga dicek: 2 kalimat, tanpa saran beli.
  - Catatan probe tanpa key: data holder (top-1/top-10) dan angka LP null
    di VM (RPC publik memblokir `getTokenLargestAccounts`) — ringkasan
    tetap jalan dengan data yang tersedia; cabang top-1 ≥ 10% dan LP
    tidak dibakar diverifikasi lewat probe sintetis di bawah.
- Probe sintetis (`scripts/probe-summary-synthetic.ts`, sudah dihapus) —
  7 kasus, ID + EN, semuanya 2 kalimat, tanpa saran beli:
  - POPCAT keyed (top-1 16,8% + LP 70,6% belum dibakar): "…tetapi LP belum dibakar — pemegang LP terbesar memegang 70.6%…" + pengingat harga.
  - Pair baru < 24 jam + likuiditas $4.200: "…tetapi likuiditasnya tipis ($4.2 rb) dan token ini masih sangat baru (di bawah 24 jam). Rentan terkena slippage besar dan dump mendadak." — sesuai contoh pengguna.
  - Hanya tidak ada rute jual: "Bahaya terdeteksi: tidak ditemukan rute jual di Jupiter — token mungkin tidak bisa dijual. Token yang tidak bisa dijual kembali akan membuat danamu terjebak."
  - Hanya top-1 55%: "Bahaya terdeteksi: satu dompet menguasai mayoritas suplai (55.0%) dan 10 dompet teratas menguasai 65.0% suplai. Satu dompet bisa menjatuhkan harga kapan saja."
  - Tanpa pasar sama sekali: "…tetapi belum ada data pasar karena tidak ada pool yang terdeteksi. Tanpa pasar, harga token tidak bisa dinilai dan token sulit dijual."
  - Mint aktif + Top-10 62% (contoh pengguna): "Bahaya terdeteksi: Mint Authority masih aktif — dev bisa mencetak suplai tambahan kapan saja dan 10 dompet teratas menguasai 62.0% suplai. Risiko rug pull sangat tinggi."
  - Likuiditas tipis + pair 3 hari + metadata mutable: hanya 2 flag teratas yang disebut (likuiditas + umur pair), metadata tidak ikut — sesuai aturan maks 2.
- PENTING: build lokal ini dibuat TANPA `VITE_HELIUS_API_KEY`, jadi
  JANGAN deploy `dist/` ini apa adanya. Deploy v7.4 harus rebuild
  dengan key seperti biasa, baru push ke `gh-pages` — dan konfirmasi
  skor keyed (perkiraan BONK ~81, WIF ~88, POPCAT 88).

---

## Update — 27 Nov 2026 sore (v6–v7.4, terverifikasi live dengan Helius key)

Tabel di atas adalah hasil tes awal **sebelum** Helius key dipasang
(holder 0/30 karena RPC publik memblokir `getTokenLargestAccounts`).
Setelah key Helius gratis dipasang dan kalibrasi CEX diterapkan
(v6), skor terverifikasi live menjadi:

| Token | Skor | Verdict | Catatan |
|---|---|---|---|
| BONK | **81/100** | Aman | Top-10 40,6% → 32,2% setelah 6 wallet CEX terverifikasi di-exclude (Solscan) |
| WIF | **88/100** | Aman | Top-10 45,3% → 35,7% |
| POPCAT | **88/100** | Aman | Holder 18/30, Likuiditas 30/30; LP beneran belum dibakar (pemegang LP terbesar 70,6%) |
| PYUSD | **0/100** | Berisiko Tinggi | Token-2022: Permanent Delegate + Transfer Fee + Transfer Hook terdeteksi, penalti −35 penuh |

v7.4 menambah ringkasan risiko 2 kalimat di bawah lingkaran skor
(rule-based, tanpa AI, tanpa saran beli) — terverifikasi untuk POPCAT,
BONK, dan PYUSD, ID + EN. Skor 81/88/88 tidak berubah dari v6 ke v7.4.

---

## v7.5 — holder neutral-default + 79 cap (27 Nov 2026, ~19:45 WIB)

Holder gagal dibaca → netral 15/30 (bukan 0), total dibatasi maks 79 — verdict
tidak bisa Aman tanpa distribusi terverifikasi. Verified: no-key BONK 78 /
WIF 79 / POPCAT 79 Waspada (cap binds); keyed 81/88/88 unchanged; PYUSD
tetap 0/100. Live: bundle index-D1XyGZqC.js, BONK live scan 81/100 Safe.

## v7.6 — dev-bundle detection, Level 1 + Level 2 (27 Nov 2026, ~20:30 WIB)

Masalah: dev nakal sebar 20–60% suplai ke 10–30 dompet lewat satu Jito bundle
di slot peluncuran — tiap dompet cuma 2–3% jadi Top-10 tetap hijau dan token
dapat 85–95 Safe padahal satu orang siap dump serentak.

Yang dibangun:
- **Level 1 (links):** kartu "Bundle Dev / Dompet Terkoordinasi" selalu
  menampilkan tombol Bubblemaps (`app.bubblemaps.io/sol/token/<mint>`,
  terverifikasi load peta BONK) dan RugCheck (`rugcheck.xyz/tokens/<mint>`,
  terverifikasi via docs solana.com).
- **Level 2a (heuristik RPC):** hanya token muda (pair < 7 hari). Page mundur
  `getSignaturesForAddress` (maks 20×100) sampai awal riwayat, ambil 12 tx
  tertua, kelompokkan pembeli per slot — kalau ≥4 dompet berbeda membeli di
  satu slot yang sama dengan gabungan >15% suplai → dicurigai bundle.
  Pelajaran dari tes: `getSignaturesForAddress` mengembalikan array polos
  (bukan `{value}`); ada tx versi 1 (butuh `maxSupportedTransactionVersion: 1`);
  `limit: 100` saja tidak pernah mencapai launch token ramai; tx gagal
  (`meta.err`) harus dilewati; exclude harus membandingkan alamat TOKEN
  ACCOUNT via `accountIndex` → `accountKeys`, bukan owner; curve/creator
  (saldo puncak >50% suplai) harus di-exclude atau semua token false-positive.
- **Level 2b (RugCheck insider networks):** `api.rugcheck.xyz/v1/tokens/<mint>/report`
  tanpa key, CORS terbuka (`Access-Control-Allow-Origin: *`) — satu jaringan
  insider yang masih memegang >15% suplai → dicurigai bundle. Hanya dipanggil
  untuk token muda (report BONK 2,5 MB — tidak layak di-fetch).
- **Guardrail:** bundle dicurigai → total dibatasi maks 79 (pagar yang sama
  seperti v7.5) + kalimat di ringkasan risiko + catatan di modal metodologi.
  Token tua (>7 hari) otomatis N/A — tidak ada RPC tambahan sama sekali.

Verifikasi (keyed, Helius):
- BONK **81**, WIF **88**, POPCAT **88** — tidak berubah. (Catatan: dalam satu
  batch 3 token, satu token sempat 79 karena Helius 429 sesaat di holder read
  → cap 79 bekerja sesuai desain; scan ulang per token kembali ke 88.)
- Token muda (MINT, 0,02 hari): heuristik RPC jujur "terlalu dalam" (token
  Pump.fun panas punya >2000 tx dalam <1 jam — launch di luar jangkauan RPC
  murah) dan RugCheck belum punya cluster (insiderNetworks null) → kartu
  tampil UNAVAILABLE + link manual, bukan pass palsu. Semua 6 token segar
  yang dites berperilaku sama.
- Sinyal RugCheck: BONK → jaringan 48 dompet memegang 0,08% → bersih (pass,
  tanpa false positive); token muda → null (belum ada data cluster).
- Jalur "dicurigai" (warn + cap 79 + kalimat ringkasan) TERVERIFIKASI LIVE pada
  token asli 27 Nov ~20:45 WIB: **ChokingCat** tadinya 81 Aman — setelah sinyal
  RugCheck (jaringan insider 9 dompet memegang 40,1% suplai) skornya jadi
  **79 Waspada (cap mengikat)**. SAI juga kena (9 dompet, 15,8%). Republic
  bersih (jaringan terbesar 4 dompet, 3,0% — tanpa false positive). BONK
  bersih (48 dompet, 0,08%). Salecat kena (234 dompet) tapi angka RugCheck
  `currentHolding` melebihi suplai (214,6%) — tampilan di-clamp ke 100%,
  flag tetap jalan.
- Catatan: dalam satu batch 3 token, satu token sempat 79 karena Helius 429
  sesaat di holder read → cap 79 bekerja sesuai desain; scan ulang per token
  kembali ke 88.

Level 3 (proxy Cloudflare Workers ke RugCheck/Helius Enhanced API + sembunyikan
key) BELUM dibangun — butuh akun Cloudflare Yukka.

## v7.7 — Cloudflare Workers proxy (27 Nov ~21:15 WIB, DEPLOYED 21:16 WIB, gh-pages head 2eadeb84, bundle index-CEDeDpdx.js)

Semua RPC Solana dan laporan RugCheck kini lewat proxy
`https://rugradar-proxy.dadapy04.workers.dev` (Worker `rugradar-proxy`,
dideploy via API 21:06 WIB, secret `HELIUS_API_KEY` di-set server-side):
`POST /rpc` meneruskan ke Helius, `GET /rugcheck/<mint>` meneruskan ke
RugCheck. Perubahan kode hanya di `src/lib/scanner.ts` (konstanta
`PROXY_URL`/`PROXY_RPC`; keenam call site RPC kini `[PROXY_RPC,
...RPC_ENDPOINTS]`, fetch RugCheck via proxy dulu, fallback langsung ke
`api.rugcheck.xyz` kalau proxy gagal — termasuk saat RugCheck membalas
throttling dengan HTTP 200 + body `{"error": ...}`) + string metodologi
di `src/lib/i18n.ts` + `README.md`. Logika scoring, threshold, dan
verdict TIDAK berubah. Build tanpa `VITE_HELIUS_API_KEY`.

Verifikasi (via proxy, `npx tsx scripts/test-scan.ts` + `/tmp/check-v77.ts`,
27 Nov ~21:12 WIB, tanpa key di env):
- BONK **81 Aman** (20+20+18+23; Top-10 32,2%, top-1 10,4%), WIF **88
  Aman** (Top-10 35,6%), POPCAT **88 Aman** (Top-10 38,4%) — sama persis
  dengan skor keyed v7.6. Semua scan tercatat "via
  https://rugradar-proxy.dadapy04.workers.dev/rpc" — bukti RPC lewat
  proxy, bukan fallback RPC publik. (Jupiter tidak merespons dari VM —
  informational saja, tidak memengaruhi skor; sama seperti tes v7.6.)
- Jalur RugCheck via proxy terverifikasi lewat `checkRugCheckInsiders`
  langsung: BONK → jaringan 48 dompet, 0,086% suplai → pass bersih
  (sama seperti hasil live v7.6: 48 dompet, 0,08%).
- Proxy `/rugcheck` sempat kena rate-limit RugCheck (2× berturut-turut
  membalas `{"error":"rate limit exceeded"}` — RugCheck men-throttle IP
  egress bersama milik Workers; menit berikutnya kembali normal dan
  mengembalikan laporan lengkap). Fallback langsung ke `api.rugcheck.xyz`
  menutup celah ini; tanpa fallback, sinyal insider akan hilang selama
  throttling berlangsung.
- ChokingCat (mint `ExpdNM5YykDnGTmyxCH5B3s7mdWi1cEreDvK6ic8pump`): sinyal
  bundle TETAP jalan — `bundleSuspected: true`, kartu warn "RugCheck: satu
  jaringan insider berisi 9 dompet masih memegang 40,1% suplai" (persis
  angka v7.6). Skor total **47 Berisiko Tinggi**, BUKAN 79 — karena skor
  mentah sudah di bawah 79 (Top-10 99,9%: vault PumpSwap AMM memegang
  98,7% suplai dan belum di-exclude — scanner hanya mengecualikan vault
  Raydium; plus likuiditas cuma $1,6 rb, pair baru 0,08 hari). Ini
  perubahan keadaan token (lulus ke PumpSwap 19:21 WIB), BUKAN regresi
  wiring: proxy mengembalikan data identik dengan Helius langsung
  (terbukti dari skor BONK/WIF/POPCAT yang sama persis), dan logika
  scoring tidak disentuh. Cap 79 tetap aktif (`min(79, raw)`) — hanya
  tidak mengikat saat raw < 79. Perbaikan exclude vault PumpSwap adalah
  fitur baru, bukan bagian v7.7; verdict Berisiko Tinggi untuk token
  berumur 2 jam yang dicurigai bundle adalah arah konservatif yang benar
  (tidak ada false Safe).
- SAI: sinyal bundle TETAP jalan — `bundleSuspected: true` (9 dompet,
  15,8%, persis v7.6); skor 40 Berisiko Tinggi (Top-10 97,5%, pola vault
  AMM yang sama).
- PYUSD: **0/100 Berisiko Tinggi** — regresi nihil (Token-2022 fatal:
  Permanent Delegate + Transfer Fee + Transfer Hook; bundle N/A karena
  token tua).
- Republic: mint TIDAK tercatat di repo maupun catatan v7.6 — tidak bisa
  di-tes ulang. Hasil v7.6 (bersih, 4 dompet 3,0%) tidak berubah oleh
  v7.7 secara konstruksi: jalur RugCheck untuk token bersih terbukti
  lewat BONK (pass).
- Bundle baru `dist/assets/index-CEDeDpdx.js` (397.172 byte, build ulang
  setelah fallback RugCheck ditambahkan — menggantikan `index-D8S4IKL3.js`
  dari build v7.7 pertama): **0 UUID key, 0 `helius-rpc.com`, 0
  `mainnet.helius`** — key TIDAK ADA di bundle publik. `rugradar-proxy`
  muncul 1× (URL proxy); `api.rugcheck.xyz` muncul 1× (endpoint publik
  tanpa key, sebagai fallback). CSS `index-6_QjeHto.css` tidak berubah.
- Status deploy: **DEPLOYED + SHA-VERIFIED 27 Nov ~21:17 WIB**
  (gh-pages head `2eadeb84`; `index.html` blob `ec86fc0d…` + bundle
  `70c2f90b…`, keduanya cocok dengan file lokal; `index.html` server
  merujuk `index-CEDeDpdx.js`). CSS tidak di-push ulang (identik sejak
  v7.5). Verifikasi live (BONK 81 di situs) masih menunggu — BUKAN final
  sampai Yukka ngetes sendiri dari HP.

## v7.8 — 3 perbaikan dari tes HP Yukka: ambang LP 15%, Price pindah ke kartu Market, Jupiter lewat Worker proxy (27 Nov ~21:23–21:35 WIB, DEPLOYED)

1. **LP Burn/Lock — ambang 15% (`checkLpBurn` + `summary.ts` + i18n):**
   verdict kini ditentukan pemegang LP terbesar yang tersisa, bukan pita
   % terbakar. ≥95% terbakar = pass; pemegang terbesar >15% = CAUTION
   (`lpNotBurned`); ≤15% = INFO dengan teks baru `lpMostlySafe` ("X% LP
   sudah dibakar/dikunci; pemegang LP terbesar yang tersisa memegang Y%
   dan maksimal hanya bisa menarik Y% likuiditas"). String lama
   `lpPartial` dihapus (ID+EN+type). Ringkasan risiko ikut aturan yang
   sama: kalimat "LP belum dibakar" hanya muncul bila pemegang LP terbesar
   >15% — tidak pernah lagi untuk LP yang mayoritas sudah aman.
   Verifikasi (probe `/tmp/check-v78-lp.ts`, tanpa key, via proxy):
   - WIF (pemegang LP terbesar 8,0%, terbakar terukur 0,0%): kartu LP
     **[INFO]** "0.0% LP sudah dibakar/dikunci; pemegang LP terbesar yang
     tersisa memegang 8.0% dan maksimal hanya bisa menarik 8.0%
     likuiditas." — TIDAK ada CAUTION, dan ringkasan ID+EN tidak lagi
     menyebut "LP belum dibakar". Skor tetap **88 Aman**.
   - POPCAT (pemegang LP terbesar 70,6%): kartu LP tetap **[CAUTION]**
     "LP belum terbukti dibakar/dikunci — pemegang LP terbesar memegang
     70.6% dan bisa menarik likuiditas." + kalimat yang sama di ringkasan.
     Skor tetap **88 Aman**.
   - Catatan: angka "terbakar" yang diukur scanner hanya LP di incinerator;
     LP yang dikunci di program lock belum terdeteksi — teks memakai frasa
     "dibakar/dikunci" mengikuti contoh Yukka.
2. **Price pindah ke kartu Market (`App.tsx`):** stat Price keluar dari
   grup TOKEN (kini hanya Total Supply + Top 10 Holders) dan masuk grup
   MARKET tepat sebelum Price 24h (Market Cap, Total Liquidity, Total
   Volume, Ratio, Age, Price, Price 24h, Txns). Nilai dan format tidak
   berubah, hanya pengelompokan. Terverifikasi di source (Price di baris
   900, di antara Age 896 dan Price 24h 904, sebelum heading TOKEN di
   933) + build lolos; pengecekan render di browser menunggu verifikasi
   live.
3. **Jupiter lewat Worker proxy — DITERAPKAN, TAPI UPSTREAM V6 MATI
   (tidak terverifikasi live):**
   - Worker `rugradar-proxy.js` tambah rute `GET /jupiter/quote?...` →
     `quote-api.jup.ag/v6/quote` (query diteruskan utuh, CORS *). Rute
     lama `/rpc` + `/rugcheck` tidak disentuh. Worker di-redeploy via API
     (etag baru `9be521bf…`); isi script ter-deploy sama persis dengan
     file lokal (framing-strip check True, 2562 byte) dan `/rugcheck`
     tetap 200.
   - **Bukti upstream mati (4 sudut):** (a) Worker `/jupiter/quote`
     membalas HTTP 530 "error code: 1016" (Origin DNS error) 4×
     berturut-turut; (b) fetch langsung `quote-api.jup.ag` dari VM =
     http 000; (c) `browser.open` ke host itu gagal ("requires a
     resolvable public HTTP(S) URL"); (d) changelog resmi Jupiter Agu
     2025: "Old Quote API V6: quote-api.jup.ag/v6/" sedang di-sunset —
     "These hosts stop working as limits ratchet down" — gantinya
     `lite-api.jup.ag` / `api.jup.ag` (Swap V1).
   - **Probe pengganti (hanya cek, tanpa ubah kode):**
     `lite-api.jup.ag/swap/v1/quote` untuk BONK (1.000.000 BONK → SOL)
     mengembalikan quote valid: `outAmount: 301`, routePlan Whirlpool,
     priceImpactPct 0,0016. Format respons v1 BERBEDA dari v6: objek
     quote langsung di top-level (tanpa pembungkus `data: [...]`), jadi
     migrasi butuh ubah parsing `checkSellable` juga. **Rekomendasi:
     migrasi Worker + `checkSellable` ke `lite-api.jup.ag/swap/v1/quote`
     sebagai tindak lanjut (butuh keputusan parent/Yukka — di luar
     cakupan v7.8).**
   - `checkSellable` kini proxy dulu (`<proxy>/jupiter/quote?...`),
     fallback langsung `quote-api.jup.ag` — masing-masing maks 2
     percobaan; 4xx/body malformed pindah ke URL berikut. Karena upstream
     v6 mati di kedua jalur, status Sellable tetap UNAVAILABLE untuk
     sementara (sama seperti v7.7 — tidak ada regresi, tidak ada sinyal
     palsu).
   - File Worker di-push ke repo main (commit `d08fb3bf`, blob SHA
     `994ffa2a…` cocok dengan lokal) agar repo sinkron.

Verifikasi skor (keyed, `npx tsx scripts/test-scan.ts`, 27 Nov ~21:31 WIB,
tanpa key, semua via `rugradar-proxy…/rpc`): BONK **81 Aman**
(20+20+18+23), WIF **88 Aman**, POPCAT **88 Aman** — sama persis v7.7.
PYUSD **0/100 Berisiko Tinggi** (probe ulang: run pertama 10 karena flake
baca holder — `holdersUnavailable` → netral 15/30; run ulang 0 + baca
`getTokenLargestAccounts` langsung lewat proxy mengembalikan 20 akun, jadi
flake transient yang sudah dikenal, bukan regresi).
- Bundle baru `dist/assets/index-wFDc8I_F.js` (397.320 byte): **0 UUID key,
  0 `helius-rpc.com`, 0 `mainnet.helius`, 0 `api-key`** — key TIDAK ADA di
  bundle publik. URL proxy muncul 1×. CSS `index-6_QjeHto.css` tidak
  berubah.
- Status deploy: **DEPLOYED + SHA-VERIFIED 27 Nov ~21:34 WIB** (gh-pages
  head `4fed231c`; `index.html` blob `765ed19d…` + bundle `ff4c729a…`,
  keduanya cocok dengan file lokal; `index.html` server merujuk
  `index-wFDc8I_F.js`). Verifikasi live (BONK 81 + kartu LP WIF + posisi
  Price di situs) masih menunggu — BUKAN final sampai Yukka ngetes sendiri
  dari HP.

---

## v7.9 — Migrasi Jupiter ke lite-api v1 + 3 perbaikan (27 Nov ~21:43 WIB)

Perintah Yukka: "lanjutkan migrasi" (Jupiter v6 mati) + "fix everything that
can be fixed" (badge LP, teks LP, language flash). Semua dikirim dalam SATU
bundle v7.9.

### 1. Migrasi Jupiter sell-check: v6 (mati) → lite-api.jup.ag Swap V1

- **Worker** (`worker/rugradar-proxy.js`): route `GET /jupiter/quote` kini
  meneruskan ke `https://lite-api.jup.ag/swap/v1/quote` (query-string
  passthrough, CORS `*`). Route `/rpc` dan `/rugcheck` tidak disentuh.
  Deploy ulang via API: **etag `d3f75451…`** (2716 byte), script deployed
  byte-identical dengan lokal; didorong ke repo main
  (commit `1e773f5c`, blob SHA `a2f12800…` cocok).
- **Bukti quote LIVE via proxy** (egress forwarder): GET worker
  `/jupiter/quote` untuk BONK (1.000.000 BONK → SOL) mengembalikan quote v1
  valid: **outAmount 299, routePlan 1 entri, priceImpactPct 0.00816**,
  inputMint cocok.
- **`checkSellable` di scanner.ts**: parse bentuk v1 (top-level `outAmount`
  + `routePlan`, TANPA wrapper `data: [...]`); HTTP 400 "No routes found"
  dibaca sebagai false (bukan kegagalan API). **Baik jalur proxy MAUPUN
  fallback langsung memakai lite-api v1 — v6 tidak ada lagi di mana pun**
  (grep bersih di src/ + worker/ + scripts/; komentar header diperbarui ke
  "Jupiter Swap API V1 lite"). Retry dipertahankan (maks 2 percobaan per URL;
  4xx/body malformed → URL berikutnya).

### 2. Perbaikan badge kartu LP (temuan live check v7.8)

Kartu LP WIF menampilkan teks INFO yang benar tapi badge UNAVAILABLE, karena
`badgeLabel` memetakan status `info` → UNAVAILABLE (untuk data yang memang
tidak terbaca), sementara `pass` → INFO. Perbaikan minimal yang dipilih:
kasus LP mostly-safe kini mengembalikan status **`pass`** (bukan `info`),
satu kata + komentar. Kasus LP yang benar-benar tidak terbaca tetap `info`.

Verifikasi kedua sisi:
- (a) WIF LP: status `pass`, teks "Pemegang LP terbesar yang tersisa
  memegang 8.0% dan maksimal hanya bisa menarik 8.0% likuiditas." —
  badge INFO (bukan UNAVAILABLE).
- (b) Cabang holders tidak berubah: pada run pertama suite, status holders
  BONK `info` ("Data holder tidak bisa diambil dari RPC saat ini") → badge
  tetap UNAVAILABLE; baris 40 `badgeLabel` (info tanpa skor → UNAVAILABLE)
  tidak disentuh; return `checkLpBurn` yang tidak tersedia tetap `info`.

### 3. Perbaikan teks LP: tanpa klaim persentase burned

Teks `lpMostlySafe` (ID + EN) menghapus klausa burned-% sepenuhnya — angka
"0.0% burned/locked" hanya menghitung incinerator, bukan lock program, jadi
menyesatkan. Teks baru hanya kalimat residual-holder (pemegang LP terbesar
yang tersisa memegang Y% dan maksimal bisa menarik Y% likuiditas). Logika
CAUTION >15% dan threshold tidak berubah; paritas kunci i18n ID/EN dijaga
(tsc memaksanya).

Verifikasi: teks LP WIF tidak mengandung "0.0%" dan tidak ada klaim burned-%;
ringkasan WIF (ID + EN) tidak mengandung "LP belum dibakar". POPCAT (top1
70.6%) tetap CAUTION + baris ringkasan LP dipertahankan.

### 4. Perbaikan language flash

Inspeksi kode: initializer state React SUDAH membaca localStorage secara
sinkron (`useState(() => detectLang())`, App.tsx:243) dan tidak ada kode
post-mount yang membalik bahasa kecuali toggle manual — jadi label halaman
tidak bisa berkedip otomatis. Celah sebenarnya ada di shell statis:
`<html lang="id">` + `<title>` Indonesia yang hardcoded (judul tab baru
berubah setelah efek title React). Perbaikan: skrip inline pre-paint di
index.html (pola sama seperti skrip tema yang sudah ada) mengatur
`document.documentElement.lang` + `document.title` dari storage sebelum
first paint (judul EN 'RugRadar — Solana Token Safety Scanner'; ID/default
'RugRadar — Pemindai Keamanan Token Solana'). Terverifikasi ada di
dist/index.html yang dibangun. Cek render live adalah langkah parent.

### 5. Caching RugCheck di Worker — DICOBA, TIDAK TERVERIFIKASI, DIBATALKAN

Ditambahkan cache 60 detik khusus `GET /rugcheck/<mint>` via
`caches.default` (header `Cache-Control: max-age=60`; `/rpc` dan
`/jupiter/quote` tetap tanpa cache). Deploy sempat naik (etag `fbf5dcf0…`,
3934 byte). Verifikasi live via egress forwarder TIDAK bersih:
- Dua panggilan berurutan ke URL /rugcheck yang sama mengembalikan body
  IDENTIK (ChokingCat 11.791 byte, BONK 2.556.231 byte) — tapi itu tidak
  membuktikan cache, karena data upstream RugCheck stabil dari menit ke
  menit.
- Header `cf-cache-status` TIDAK MUNCUL sama sekali pada kedua panggilan
  (Workers Cache API tampaknya tidak mengeluarkan header itu).
- TTFB 5 panggilan berurutan: 0,90 / 0,35 / 0,57 / 0,47 / 0,66 dtk —
  berisik, tidak ada percepatan konsisten yang membuktikan HIT; jitter
  forwarder mendominasi.
Sesuai instruksi (jangan kirim caching yang tidak terverifikasi): **kode
cache DIHAPUS dan Worker di-redeploy ke versi tanpa cache** (etag kembali
`d3f75451…`, 2716 byte, byte-identical dengan file v7.9 sebelum cache;
didorong ke main, commit `729fd8bd`, blob SHA `a2f12800…` cocok).
**Deskripsi proyek TIDAK BOLEH mengklaim "light caching"** — lunakkan
wordingnya (proxy mencegah rate-limit lewat egress terpusat, tanpa klaim
cache) sampai caching bisa dibuktikan bersih.

### Hasil tes (keyed, tanpa key di env, semua via proxy)

| Token | Skor | Verdict | Sellable |
|---|---|---|---|
| BONK | **81/100** | Aman | **YES** (sebelumnya UNAVAILABLE) |
| WIF | **88/100** | Aman | **YES** |
| POPCAT | **88/100** | Aman | **YES** |
| PYUSD | **0/100** | Berisiko Tinggi | sellable=true |

- Skor BONK 81 / WIF 88 / POPCAT 88 TIDAK BERUBAH dari v7.6–v7.8.
  (Run pertama suite: BONK 78 = flake transient pembacaan holder yang
  sudah dikenal → re-run 81. PYUSD run pertama 10 = flake yang sama,
  re-run 0.)
- Bundle baru `dist/assets/index-CHlq26rS.js` (397.380 byte), dibangun TANPA
  `VITE_HELIUS_API_KEY`: **0 UUID key, 0 `helius-rpc.com`, 0 host v6 mati**;
  lite-api + URL proxy hadir. CSS `index-6_QjeHto.css` tidak berubah.
- Status deploy: **DEPLOYED + SHA-VERIFIED 27 Nov ~21:43 WIB** (gh-pages
  head `c607597f`; `index.html` blob `ad8b7de9…` + bundle `2743d6be…`,
  keduanya cocok dengan file lokal; halaman yang disajikan merujuk
  `index-CHlq26rS.js` — terverifikasi setelah CDN Pages menyusul, sempat
  masih menyajikan bundle v7.8 sesaat setelah push).
- Verifikasi live di browser + tes HP Yukka masih menunggu — BUKAN final
  sampai Yukka ngetes sendiri dari HP.

### 6. Bahasa default jadi Inggris (tambahan Yukka, bundle baru — menggantikan bundle di atas)

Perintah Yukka: "English is now the default language of the web app."
Perubahan (3 tempat default 'id' → 'en', preferensi tersimpan tetap
dihormati, toggle ID/EN tidak berubah):
- `src/lib/i18n.ts` — `detectLang()` kini mengembalikan `'en'` kalau tidak
  ada preferensi tersimpan (dan kalau storage tidak tersedia).
- `src/lib/scanner.ts` — `scanToken(mint, lang: Lang = 'en')` (sebelumnya
  `'id'`); app sendiri selalu meneruskan `lang` UI secara eksplisit, jadi
  ini terutama membuat test-script memakai default EN.
- `index.html` — `<html lang="en">`; skrip pre-paint kini hanya memaksa ID
  kalau tersimpan `'id'`, selebihnya (tersimpan `'en'` ATAU tidak ada)
  → EN + judul EN; `<title>` + og/twitter title + deskripsi meta jadi
  Inggris ("RugRadar — Solana Token Safety Scanner").

Verifikasi live di browser headless lokal (CDP, bundle baru disajikan dari
dist/ — sempat gagal dulu karena `base: '/rugradar/'` di vite config, jadi
server lokal harus memetakan `/rugradar/` → dist/; bukan bug aplikasi):
- **Fresh (tanpa preferensi): `lang=en`, judul EN, tombol "Scan Token",
  toggle ID/EN, tagline "Token Safety Scanner · Solana"** ✓
- **Tersimpan `'id'` lalu reload: `lang=id`, judul ID, tombol "Cek Token",
  tagline "Pemindai Keamanan Token · Solana"** ✓ (preferensi dihormati)
- **Tersimpan `'en'` lalu reload: `lang=en`, judul EN, tombol "Scan Token"** ✓
- Suite keyed diulang dengan default baru: **BONK 81 / WIF 88 / POPCAT 88
  Aman** (BONK run pertama 78 = flake holder yang sudah dikenal, re-run 81),
  **Sellable YES untuk ketiganya**, **PYUSD 0/100** (probe terpisah,
  sellable=true); semua teks cek di output suite kini Inggris
  ("Already revoked — nobody can mint new tokens.", "Jupiter found a sell
  route to SOL…", LP WIF "The largest remaining LP holder owns 8.0%…").

Deploy pengganti: bundle baru **`dist/assets/index-C5y_uTPl.js`
(397.387 byte)**, dibangun TANPA `VITE_HELIUS_API_KEY` (0 UUID, 0
helius-rpc.com, 0 host v6 mati). **DEPLOYED + SHA-VERIFIED 27 Nov ~22:05 WIB**
(gh-pages head **`02758e6b`**; `index.html` blob `7c18157e…` + bundle
`0b64105b…`, keduanya cocok dengan file lokal; halaman yang disajikan
merujuk `index-C5y_uTPl.js` dan `<html lang="en">`). Bundle
`index-CHlq26rS.js` (head `c607597f`) sudah digantikan.
- Verifikasi live di browser (cloud) + tes HP Yukka masih menunggu — BUKAN
  final sampai Yukka ngetes sendiri dari HP.

## v7.9.1 — Sellable badge SAFE + summary top-10 consistency check (27 Nov ~22:15 WIB)

Dua perbaikan label/konsistensi di atas v7.9. TIDAK ada perubahan bobot
skor, threshold, atau logika lain.

### FIX 1 — Badge kartu Sellable jadi SAFE (bukan INFO) saat rute jual ketemu

Temuan live check 22:09 WIB: kartu Sellable BONK + WIF menampilkan badge
INFO (pill hijau) dengan teks benar ("Jupiter found a sell route to SOL —
this token can be sold on a DEX."). Substansi benar, tapi kata badge harus
SAFE sesuai syarat anti-zonk (hijau SAFE).

Perubahan (satu tempat, `src/App.tsx` — fungsi `badgeLabel`, cabang
unscored): `c.id === 'sellable' && c.status === 'pass'` → `t.badgePass`
("SAFE" EN / "AMAN" ID). Map bersama TIDAK diubah: LP (id 'lp', pass) dan
Token Metadata (pass) tetap INFO; sellable false (status 'warn') tetap
CAUTION; sellable null (status 'info') tetap UNAVAILABLE. Pill hijau tidak
berubah (`.check-pass .check-badge { background: var(--green) }`).

Verifikasi:
- Suite keyed: **sellable=true + status PASS untuk BONK, WIF, POPCAT,
  PYUSD** (lihat bawah).
- Bundle baru terkompilasi mengandung logika ini, terverifikasi di file
  minified: ``e.id===`sellable`&&e.status===`pass`?t.badgePass``.
- **Render check di browser TIDAK selesai di sesi ini (jujur):** Chrome
  headless lokal tidak pernah memuat halaman — navigasi macet sebelum
  bundle JS terambil (server lokal menjawab 200 untuk HTML, tapi renderer
  tidak pernah meminta bundle; judul tab tetap kosong; IPC daemon harness
  juga timeout). Chrome di-restart bersih + navigasi CDP mentah dicoba
  ulang, tetap macet. Jadi kata "SAFE" yang ter-render LITERAL belum
  terverifikasi di browser — menunggu live check cloud / tes HP Yukka.
  Yang terverifikasi: logika badge di kode + data (sellable=true, status
  pass) + CSS pill hijau.

### FIX 2 — Ringkasan vs kartu holder: TIDAK ADA BUG, tidak ada perubahan kode

Laporan live check 22:09 WIB: BONK 81/100, kartu holder 32,2% (→ 18/30),
tapi ringkasan disebut berkata "top 10 holders control 21.5% of supply"
(21,5% akan bernilai 24/30 — tidak cocok dengan total 81).

Penyelidikan kode (bukan tebakan):
- `src/lib/scanner.ts:1628` — SATU panggilan `readTopHolders`; `:1649`
  dan `:1905` — `ScanResult.top10SharePct` = hasil panggilan itu.
- Kartu holder (`:1775`): `t.holdersDetail(fmtPct(top10SharePct), ...)`.
- Stat TOKEN (`src/App.tsx:940`): `fmtPct(result.top10SharePct)`.
- Ringkasan (`src/lib/summary.ts:77-79` fatal, `:94-100` market):
  `t.summaryFatalTop10(fmtPct(r.top10SharePct))` /
  `t.summaryFlagTop10(fmtPct(r.top10SharePct))` — field YANG SAMA,
  formatter YANG SAMA (`fmtPct` = `n.toFixed(1)%`, tanpa scaling).
- **Kedua kalimat top-10 ringkasan HANYA muncul bila
  `top10SharePct >= 50`.** Pada 32,2% kalimat itu TIDAK BISA muncul sama
  sekali.

Bukti empiris (dua run BONK live via proxy, barusan): top10 stabil
**32,2%**, top1 10,4%, skor **81**, ringkasan TIDAK mengandung kalimat
top-10 ("Clean contract: the dev cannot mint new tokens or freeze
balances, but the token metadata can still be changed by the dev.
Remember: ..."). WIF sama: 35,6% / 88, tanpa kalimat top-10.

Kesimpulan: ringkasan SUDAH memakai angka yang sama dengan kartu holder —
tidak ada yang diperbaiki, sesuai instruksi. Angka 21,5% di laporan live
tidak bisa dihasilkan kode v7.9 dari hasil BONK 81 — kemungkinan besar
laporan live mencampur data scan lain dalam sesi yang sama, atau salah
kutip baris detail kartu holder ("The top 10 wallets hold X% of total
supply"). Bukan bug kode.

### Skor keyed (tidak berubah)

| Token | Skor | Verdict | Sellable |
|---|---|---|---|
| BONK | **81/100** | Aman | YES |
| WIF | **88/100** | Aman | YES |
| POPCAT | **88/100** | Aman | YES |
| PYUSD | **0/100** | Berisiko Tinggi | YES (sellable=true) |

- Bundle baru `dist/assets/index-CnM0g8aP.js` (397.436 byte), dibangun TANPA
  `VITE_HELIUS_API_KEY`: **0 UUID key, 0 `helius-rpc.com`, 0 host v6 mati**.
  `tsc -b && vite build` lolos (strict).
- **DEPLOYED + SHA-VERIFIED 27 Nov ~22:20 WIB** (gh-pages head
  **`0491042f`**; `index.html` blob `d03b9c74…` + bundle `f486f079…`,
  keduanya cocok dengan file lokal; `index.html` remote merujuk
  `index-CnM0g8aP.js`; blob bundle dikonfirmasi ganda — via connector dan
  via GitHub API publik, size 397.436 byte cocok).
- Catatan: cache RugCheck 60 detik yang dititipkan ke v7.9 ternyata
  **DI-REVERT oleh builder v7.9** (commit main `729fd8bd`: "RugCheck
  caching reverted (unverifiable via forwarder, do not ship unverified
  caching)") — jadi Worker TIDAK punya caching; klaim "caching ringan" di
  kerangka deskripsi tetap belum terpenuhi. v7.9.1 tidak menyentuh Worker.
- Verifikasi live di browser (cloud) + tes HP Yukka masih menunggu — BUKAN
  final sampai Yukka ngetes sendiri dari HP.

## v7.10 — Modern UI + bug fixes B1–B11 (28 Nov 2026 ~01:00 WIB, DEPLOYED)

Perintah Yukka 27 Nov ~22:51 WIB: "per bagus lagi ui nya ala modern" —
modernisasi UI + perbaiki semua bug dari audit 27 Nov ~22:50 WIB. TIDAK ada
perubahan bobot skor, threshold, atau logika scoring — kecuali B7 (pair
guard) yang terbukti tidak mengubah skor demo token.

### Bug fixes

- **B1 (MAJOR) — DexScreener tanpa timeout.** `fetchDexPair`
  (`src/lib/scanner.ts`) adalah satu-satunya call tanpa batas; kalau
  DexScreener nge-hang, spinner scan muter selamanya. Sekarang
  `AbortController` 8 detik; abort dilempar dan caller sudah menanganinya
  sebagai `dexError` → kartu likuiditas WARN + pesan jujur.
- **B7 (MAJOR potensial) — pair guard.** `fetchDexPair` mengambil
  `pairs[0]` (likuiditas terbesar) tanpa cek `baseToken.address === mint`
  — pair di mana token adalah sisi QUOTE akan membuat harga/market cap/
  txns terbaca dari token lain. Sekarang: prefer pair base-side, fallback
  ke pair likuiditas terbesar. **Skor demo token tidak berubah**
  (BONK/WIF/POPCAT/PYUSD pair terdalamnya base-side) — terverifikasi
  di suite keyed di bawah.
- **B4 (Worker) — allowlist + rate limit.** `POST /rpc` di Worker dulu
  meneruskan SEMUA method JSON-RPC ke Helius — siapa pun bisa menguras
  kredit free tier. Sekarang: hanya 5 method yang dipakai app
  (`getAccountInfo`, `getTokenLargestAccounts`, `getSignaturesForAddress`,
  `getTransaction`, `getTokenSupply` — digrep dari `src/`, lengkap);
  method lain → 403 JSON. Rate limit per-IP 120 req/menit (rolling 60 dtk,
  best-effort per isolate) — scan normal (~20 call) tidak pernah kena.
  Worker di-redeploy via `cf.py` (etag `a1dcf6b8…`) dan diverifikasi live:
  `getTokenSupply` → 200 (supply BONK benar), `getSlot` → 403,
  `/rugcheck/<BONK>` → 200 (report 2,5 MB), `/jupiter/quote` → 200
  (outAmount valid). Scan BONK ulang lewat Worker baru: 81.
- **B2 — RugCheck timer per URL.** Satu timer 8 detik dipakai berdua
  untuk proxy + fallback; sekarang tiap URL punya timer 8 detik sendiri.
- **B3 — `checkSellable` terima `outAmount` string ATAU number** (dulu
  string saja — quote valid dengan outAmount angka akan kehitung gagal).
- **B5 — Modal metodologi** (`methodExtrasText`, ID+EN) sekarang menulis
  aturan LP 15%: pemegang LP terbesar >15% = CAUTION, ≤15% = aman.
- **B6 — `verdictTextAman` dilunakkan** (ID+EN): "No major red flags —
  the main checks look good. Still DYOR…" (dulu "passed all main checks",
  kelewat pede untuk skor 81).
- **B8 — Warna gauge dari variabel tema** (dulu hex hardcode `#16a34a`/
  `#d97706`/`#dc2626`; sekarang `var(--green/--amber/--red)` via inline
  style — di dark mode ring ikut palet terang).
- **B9 — Label versi di footer:** "RugRadar v7.10" (hardcode).
- **B10 — Modal focus trap:** Tab terkunci di dalam modal, Escape +
  backdrop-click tetap jalan, fokus kembali ke tombol pemicu saat tutup.
- **B11 — Tap target 40px:** `.theme-toggle` 32→40px, tombol
  `.lang-toggle` 10px padding (min-height 40px), ikon paste/clear input
  40px; padding-right input disesuaikan (76→92px).
- **B12 — Chip recent:** hint kecil "Tap a chip to rescan" /
  "Ketuk chip untuk memindai ulang" (key baru `recentHint`, ID+EN).
- **Test gap — PYUSD masuk `scripts/test-scan.ts`** (dulu hanya
  BONK/WIF/POPCAT; PYUSD 0 hanya dicek manual). Sekarang 4 token.

### Modernisasi UI (semua plain CSS, tanpa dependensi baru)

1. **Hero banner verdict-first:** hasil dibuka banner full-width —
   ring kiri, verdict + ringkasan kanan (desktop), stacked di mobile;
   background tinted warna verdict (hijau/kuning/merah). Verdict jadi
   halaman, bukan kartu di dalamnya.
2. **Gauge animasi + glow:** ring `stroke-dashoffset` 0→skor saat mount
   (transisi 1 detik), `drop-shadow` warna verdict, angka 44→56px
   (mobile 34→44px). `prefers-reduced-motion` mematikan animasi.
3. **Sub-card:** Market, Token, Checks masing-masing permukaannya
   sendiri (radius 18px, border 1px, shadow lebih kuat di light mode,
   `--surface-2` raised di dark mode). Market + Token 2 kolom di ≥900px.
4. **Tipografi:** nilai stat 16→19px, ringkasan 14→15px / line-height
   1.65, jarak antar-section 28→32px.
5. **Brand merah → indigo:** `--accent` `#dc2626` → `#4f46e5` (dark:
   `#818cf8`); merah sekarang strictly untuk danger. Tombol utama sudah
   navy (`--btn-bg`) — tidak diubah. `theme-color` meta ikut indigo.
6. **Micro-interactions:** `:active scale(0.98)` di tombol/chip,
   fade/slide-in section hasil, check card muncul berurutan (delay
   45ms/index via `--i`).
7. **Cek gagal duluan:** daftar check diurutkan fail → warn → pass →
   info → na (stabil); teks salinan ikut urutan yang sama. Kartu
   Token-2022 PYUSD yang fatal tidak lagi paling bawah.
8. **Loading checklist:** tiga tahap (mint → holder → market) sebagai
   checklist hidup (✓ / spinner / ○), bukan teks yang berputar tiap 3
   detik; step berhenti di 3/3 (dulu cycling kembali ke 1/3).
9. **Sticky scan bar (≤560px):** label + input + tombol Scan nempel di
   atas saat scroll ke hasil (background solid, z-index 10).
10. **Empty state visual:** 3 langkah bernomor dengan badge angka,
    bukan paragraf abu-abu.
11. **Share row 4 kolom di ≥900px** (dulu 2×2 di semua lebar).
12. **`<noscript>`** di `index.html` (satu baris).

### Skor keyed (tidak berubah)

| Token | Skor | Verdict | Sellable |
|---|---|---|---|
| BONK | **81/100** | Aman | YES |
| WIF | **88/100** | Aman | YES |
| POPCAT | **88/100** | Aman | YES |
| PYUSD | **0/100** | Berisiko Tinggi | YES (sellable=true) |

- `tsc -b && vite build` lolos (strict). Bundle baru
  `dist/assets/index-WAkIVl9d.js` (399.531 byte) + CSS
  `index-B5CLdD-I.css` (18.180 byte), dibangun TANPA key:
  **0 `helius-rpc.com`, 0 host v6 mati** di bundle (terverifikasi di
  blob remote). Catatan: build pertama v7.10 menghasilkan bundle
  `index-D-uhV8Jc.js` + CSS `index-BRCrAR_r.css` (gh-pages head
  `ba049139`, sempat ter-deploy); satu baris CSS tambahan
  (`.hero-verdict { flex: 1 }`) memaksa rebuild — JS hasil rebuild
  byte-identik (blob SHA sama `c2f63bbc…`), hanya nama file yang
  berubah karena hash Vite.
- **DEPLOYED + SHA-VERIFIED 28 Nov ~01:05 WIB** (gh-pages head
  **`55e74587`**; bundle blob `c2f63bbc…` cocok persis dengan file lokal
  via git blob SHA; `index.html` remote merujuk bundle + CSS baru,
  mengandung `noscript` + theme-color indigo). Live site sempat masih
  menyajikan file build pertama (cache GitHub Pages) — isi JS-nya
  identik, hanya CSS final yang menunggu refresh CDN.
- **Main head `e3dc7bfe`** — source v7.10 di-push ke main (8 file:
  `src/App.tsx`, `src/App.css`, `src/lib/scanner.ts`,
  `src/lib/i18n.ts`, `src/lib/summary.ts`, `scripts/test-scan.ts`,
  `worker/rugradar-proxy.js`, `index.html`). Catatan: `src/` di main
  ternyata masih versi SANGAT lama (scanner 13 KB, tanpa proxy;
  `index.html` 391 byte, `<html lang="id">`; `i18n.ts` dan `summary.ts`
  bahkan belum ada) — semua builder v7.x sebelumnya hanya push dist ke
  gh-pages + worker/README/program ke main. Push ini membawa main ke
  state v7.10 yang koheren (terverifikasi: marker `verdict-hero`,
  `recentHint`, `ALLOWED_RPC_METHODS` ada di file remote).
  `src/main.tsx` remote TIDAK di-push (beda 21 byte: remote import
  `./index.css` yang ada di main tapi tidak ada di lokal — keduanya
  self-consistent, di luar scope v7.10).
- **Live check browser + tes HP Yukka masih menunggu — BUKAN final
  sampai Yukka ngetes sendiri dari HP.**
- Flake pasca-deploy (jujur): satu run BONK ~01:05 WIB mencetak
  **78 Waspada, holder "—" (data tidak terbaca, cap 79 mengikat)** —
  signature persis flake Helius yang sudah didokumentasikan di v7.6
  (429 di `getTokenLargestAccounts`). Re-run langsung: **81, holder
  32,2%**. Untuk memastikan limiter Worker baru bukan penyebabnya:
  30 call cepat `getSlot` (method terlarang) → **30/30 HTTP 403, 0×
  429** — limiter tidak trip di volume seukuran scan (~20 call vs
  batas 120/menit). Jadi flake ini dari upstream Helius, bukan dari
  Worker baru.

## v7.10.1 — Indigo Scan button + failed-check sort by points lost (28 Nov 2026 ~01:15 WIB, BUILD + TESTED, DEPLOY BLOCKED — GitHub push approval expired)

Tiga isu dari live check v7.10 (~01:04 WIB).

### 1. Flake holder BONK — diinvestigasi, TIDAK ada retry yang ditambahkan
- Live check: 2 dari 4 scan BONK dalam satu sesi browser gagal baca holder
  → 78/100 Waspada (UNAVAILABLE 15/30, cap 79 mengikat); builder v7.10 juga
  flake sekali (78, lalu 81 di re-run).
- Limiter Worker dibaca ulang (`worker/rugradar-proxy.js:29-48`): rolling
  60 detik, batas 120 req/menit/IP; counter benar (`fresh.length >= 120`
  baru menolak); storage per-isolate hanya bisa membuat batas efektif LEBIH
  TINGGI, tidak pernah lebih rendah; satu scan ~10–25 call RPC. Limiter
  bersih — tidak mungkin men-throttle satu scan normal. (Tes builder
  "30 call getSlot → 30/30 HTTP 403" hanya membuktikan allowlist; tidak
  dipakai sebagai bukti limiter.)
- Pengukuran flake 28 Nov ~01:09–01:10 WIB: `npx tsx scripts/test-scan.ts
  BONK` 5× berurutan → **5/5 bersih, 0 flake** — semua 81/100 Aman,
  holder 18/30, top-10 32,2%, top-1 10,4%.
- Keputusan (sesuai aturan tugas: flake 0–1 dari 5 + limiter bersih → SKIP
  retry): **tidak ada retry, tidak ada perubahan Worker, tidak ada perubahan
  scanner.ts.** Flake adalah 429 upstream Helius yang sporadis; fail-safe
  (15/30 + cap 79) bekerja sesuai desain di setiap kejadian — skor tidak
  pernah salah, hanya terdegradasi, dan re-scan mengembalikan 81.
  Sisa risiko jujur: shot 1 video demo (BONK 81) bisa kena flake sesekali;
  mitigasinya re-scan, bukan retry di kode.

### 2. Tombol Scan jadi indigo (ISSUE 2, sudah)
- `src/App.css`: variabel baru `--btn-primary-bg` / `--btn-primary-bg-hover`
  / `--btn-primary-text` di kedua tema; `.btn-primary` sekarang memakai
  ketiganya. `--btn-bg` netral tidak disentuh (masih dipakai lang-toggle
  dan input focus).
- Light: `#4f46e5` + teks putih → kontras **6,29:1**. Dark: `#818cf8` +
  teks navy `#0f172a` → kontras **5,98:1** (teks putih di `#818cf8` hanya
  ~3:1, jadi sengaja tidak dipakai). Hover: `#4338ca` (light) / `#a5b4fc`
  (dark). Terverifikasi di CSS hasil build (kedua tema + rule
  `.btn-primary`); konfirmasi render menunggu live check parent.
- Logo "Radar" tetap indigo; tidak ada tombol lain yang berubah.

### 3. Urutan cek gagal: poin hilang terbesar dulu (ISSUE 3, sudah)
- `src/App.tsx`: comparator sort sekarang status dulu (fail → warn → pass
  → info → na), lalu di dalam grup yang sama poin hilang menurun
  (`maxScore − score`), stabil selebihnya. Isi cek tidak berubah.
- Verifikasi dengan data PYUSD asli (`/tmp/verify-sort-v7.10.1.ts`,
  comparator persis dari App.tsx): urutan jadi **token2022 (−35) →
  holders (−30) → mint (−20) → freeze (−20, stabil) → liquidity (pass
  30/30) → sellable (pass) → metadata (info) → bundle (na) → lp (na)**.
  Sebelumnya token2022 ada di posisi terakhir (ke-9).

### Skor keyed (tidak berubah oleh edit ini — hanya CSS + sort UI)
| Token | Skor | Verdict | Sellable |
|---|---|---|---|
| BONK | **81/100** | Aman | YES |
| WIF | **88/100** | Aman | YES |
| POPCAT | **86/100** | Aman | YES |
| PYUSD | **0/100** | Berisiko Tinggi | YES (sellable=true) |

- CATATAN POPCAT 86 (bukan 88): drift data live, BUKAN regresi —
  `scanner.ts` tidak disentuh di v7.10.1. Volume 24j POPCAT $97,3 rb
  (di bawah ambang $100 rb → bagian volume 5, bukan 7), jadi likuiditas
  28/30 (15 liq + 8 umur + 5 vol); 20+20+18+28 = 86. Holder tetap 18/30
  (top-10 38,3%). Saat volume kembali ≥$100 rb, skor kembali 88.
- PYUSD: top-10 85,2% (top-1 54,4%), holder 0/30 fail, mint/freeze 0/20
  fail, Token-2022 0/35 fail (Permanent Delegate + Transfer Fee +
  Transfer Hook), likuiditas 30/30 pass.
- `tsc -b && vite build` lolos (strict). Bundle baru
  `dist/assets/index-KiMgTF-L.js` (399.572 byte) + CSS
  `index-MoAjx8n5.css` (18.374 byte), dibangun TANPA key:
  **0 `helius-rpc.com`** di bundle. Comparator sort baru terkonfirmasi ada
  di JS hasil build.
- **DEPLOY BLOCKED 28 Nov ~01:40 WIB: `github push-files` ke gh-pages
  gagal — approval GitHub expired (`approval_expired`,
  `approval_id: connector-attempt-c30075c4661e16b2ab9c0bad4372d83f5ff6b0f16d4ce11654998b47ccc14c0c`,
  "egress approval timed out"). TIDAK ADA yang ter-push. Live site
  terverifikasi masih v7.10 (bundle `index-WAkIVl9d.js`, gh-pages head
  `55e74587`); bundle baru `index-KiMgTF-L.js` (blob
  `36dd954b6ef5e94fcc4231ad5a952820ab613717`) belum live. Push ke main
  (src/App.tsx + src/App.css) belum dicoba — menunggu approval baru dari
  Yukka, lalu ulangi dari langkah push gh-pages. JANGAN ulangi push tanpa
  go-ahead Yukka.**
- Worker TIDAK di-redeploy (tidak ada perubahan) — etag tetap `a1dcf6b8`.
- **Live check browser + tes HP Yukka masih menunggu — BUKAN final
  sampai Yukka ngetes sendiri dari HP.**

## v7.11 — 7 bahasa + tema cyberpunk + PumpSwap vault + holder retry (28 Nov 2026 ~11:40–12:00 WIB, BUILD + TESTED, BELUM DEPLOY)

> Koreksi catatan v7.10.1 di atas: redeploy label footer **BERHASIL 28 Nov ~11:03 WIB** setelah Yukka mengetuk Allow tepat waktu — gh-pages head `df090f7c` (bundle `index-PoEVSwW0.js`, SHA terverifikasi), main head `3e03e63c`; live-verified ~11:09 WIB: footer 'RugRadar v7.10.1', bundle PoEVSwW0, BONK 81 Aman.

### Bahasa — 7 bahasa (baru: zh, es, pt, ru, vi)
- `Lang` kini `'id' | 'en' | 'zh' | 'es' | 'pt' | 'ru' | 'vi'`; dict baru di file terpisah `src/lib/i18n.{zh,es,pt,ru,vi}.ts` (tiap file `export const <kode>: Dict`), dirakit di `STRINGS` (`src/lib/i18n.ts`). tsc strict menegakkan parity kunci — build lolos = 224/224 kunci per bahasa, 0 hilang/lebih.
- Toggle 2 tombol ID/EN diganti `<select class="lang-select">` berisi 7 bahasa dengan nama asli (Indonesia, English, 中文, Español, Português, Русский, Tiếng Việt); tetap persist di localStorage key yang sama, default tetap EN, `switchLang` tetap re-scan token aktif.
- `detectLang()` kini memvalidasi ke-7 kode; boot script di `index.html` ikut diperluas (atribut `lang` dokumen benar untuk ke-7 bahasa).
- Locale per bahasa (`LOCALES`): id-ID, en-US, zh-CN, es-ES, pt-BR, ru-RU, vi-VN — dipakai `fmtNum` dan timestamp `scannedAt`. `fmtUsd` kini memakai `t.million`/`t.thousand` dari dict (sama seperti `scanner.ts`) + suffix miliar per bahasa (id 'M', sisanya 'B' — standar kripto).
- Keputusan terjemahan: istilah teknis dipertahankan Inggris sesuai dict en (Mint Authority, Freeze Authority, Permanent Delegate, Transfer Fee, Transfer Hook, LP, Jito Bundle, DexScreener, Solscan, Bubblemaps, Jupiter, RugCheck, Raydium, Orca, Meteora, SOL, SPL, Token-2022, DYOR, RPC, DEX, N/A); verdict diterjemahkan (zh 安全/警惕/高风险, es Seguro/Precaución/Alto riesgo, pt Seguro/Cuidado/Alto risco, ru Безопасно/Осторожно/Высокий риск, vi An toàn/Thận trọng/Rủi ro cao); zh = Simplified, es = Spanyol LatAm netral, pt = Brasil. Unit singkat: zh 千/百万, es mil/M, pt mil/mi, ru тыс./млн, vi N/Tr.

### Tema — cyberpunk / modern
- Font display kini Orbitron (ditambah ke Google Fonts link di `index.html`) dengan fallback Space Grotesk → system-ui kalau CDN keblokir; body tetap Inter. H1 + angka gauge memakai Orbitron (letter-spacing 1px).
- Tombol Scan gaya cyberpunk: gradient indigo, huruf Orbitron uppercase + tracking 1.5px, sudut terpotong angular (clip-path), glow neon via `filter: drop-shadow` (mengikuti bentuk terpotong — box-shadow akan terpotong clip-path), hover glow membesar + naik 1px, active mengecil. Min-height 48px (tap target ≥44px). Gradient memakai dua indigo yang sama, jadi kontras teks tidak berubah (light putih 6.3:1, dark navy 5.9:1); kedua tema tetap jalan, sticky scan bar ≤560px tidak disentuh, semua komponen v7.10 utuh. Tidak ada perubahan skor/logika lewat tema ini.
- Footer: `RugRadar v7.11`.

### Bug (a) — PumpSwap AMM vault dikecualikan dari konsentrasi holder
- Layout Pool PumpSwap diverifikasi DUA arah: dokumen resmi pump-fun (program `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA`; field `pool_bump u8, index u16, creator, base_mint, quote_mint, lp_mint, pool_base_token_account, pool_quote_token_account, lp_supply u64, coin_creator`) + on-chain untuk pool ChokingCat `9Wjy7e5wtrNbtcregNHt9o8J8JMQUwzssKZmdg7FHdET` (owner = program PumpSwap, `base_mint @43` = mint ChokingCat, `pool_base_token_account @139` = `GSgQwqk4R97nbWjT3hcx9sXxgQPbVHxockVYpQC9BdQ5` = top-1 largest account 98.44%, akun Token-2022 bermint ChokingCat).
- Implementasi: `readPumpSwapPool()` di `src/lib/scanner.ts` (cek owner + panjang ≥243 + mints cocok pair), dipanggil saat `pair.dexId === 'pumpswap'`; vault diverifikasi via `getTokenAccountMint` sebelum dikecualikan — pola keamanan sama seperti Raydium. Interface `RaydiumPoolInfo` diganti nama jadi `AmmPoolInfo` (mencakup keduanya).
- Verifikasi ChokingCat (`ExpdNM5YykDnGTmyxCH5B3s7mdWi1cEreDvK6ic8pump`): **47 → 77/100 Waspada**; top-10 **98.7% → 1.43%** (top-1 0.68%), holder check **30/30 PASS**, `poolVaultExcluded: true`, `excludedKinds.pool: true`. Bukan 79 seperti ekspektasi awal karena likuiditas cuma 7/30 (pool umur 0 hari, likuiditas $1,6 rb) — cap bundle 79 tidak mengikat (raw 77 < 79); bundle tetap suspected (RugCheck 9 dompet, 40,1%). Skor keyed BONK 81 / WIF 88 / PYUSD 0 TIDAK berubah.
- Catatan kecil (tidak diperbaiki — butuh ubah 7 dict): teks `lpUnavailable` masih menyebut "(not a Raydium pool...)" untuk pool PumpSwap; faktual masih benar (cek LP hanya mendukung Raydium), hanya wording-nya.

### Bug (b) — retry holder fetch (flake BONK 78)
- `getLargestAccounts()` kini mencoba proxy 2x: gagal pertama → jeda 700ms → retry proxy sekali, baru fallback ke RPC publik. Fail-safe tetap jujur (cap 79 + badge UNAVAILABLE) saat data memang tidak tersedia.
- Verifikasi: **5x scan BONK berturut-turut = 81/100 semua, 0 flake**. Catatan jujur: flake sebelumnya sporadis (2x dalam cek live 11:09), jadi 5/5 bersih adalah bukti perbaikan, bukan bukti mutlak — retry hanya menutup jendela 429 sesaat, bukan menghilangkan penyebab upstream.

### Verifikasi akhir v7.11
- `npm run build` (tsc -b + vite, strict) **LOLOS**. Bundle baru `dist/assets/index-CgFrGNPh.js` (501,04 kB — naik dari 399,57 kB karena 5 bahasa; warning chunk >500 kB dari Vite, bukan error) + CSS `index-DuvmLmPB.css` (18,83 kB). **0 `helius-rpc.com`** di bundle; string `RugRadar v7.11` + `Orbitron` + `lang-select` terkonfirmasi di hasil build.
- `npx tsx scripts/test-scan.ts` (keyed, 28 Nov ~11:45 WIB): **BONK 81 Aman** (top-10 32,2%, top-1 10,4%), **WIF 88 Aman**, **POPCAT 88 Aman** (volume kembali ≥$100 rb — drift 86 kemarin pulih sendiri), **PYUSD 0 Berisiko Tinggi**. 4/4 sukses.
- Runtime check `STRINGS`: 7 kunci (id, en, zh, es, pt, ru, vi), verdict + unit + locale benar per bahasa; contoh terjemahan dibaca natural (zh tagline, ru summaryFatalMint, es holdersExplanation dicek manual).
- Script riset sementara (`scripts/research-pumpswap.ts`, `scripts/check-chokingcat.ts`) sudah dihapus — tidak masuk build.
- **BELUM DEPLOY / PUSH — build + test lokal saja. Live check browser + tes HP Yukka masih menunggu — BUKAN final sampai Yukka ngetes sendiri dari HP.**

## v7.11.1 — logo shield di website (28 Nov ~12:13 WIB, build lokal Bella)
- Logo shield v3 (pilihan Yukka, ganti v2 yang "jelek bner") kini jadi favicon + logo header website: `public/logo.png` (1600×1600), `<img class="brand-logo">` di atas H1 (76px desktop / 64px mobile, glow cyan), favicon + og:image pindah dari `favicon.svg` ke `logo.png`. Footer: `RugRadar v7.11.1`.
- `npm run build` (tsc -b + vite, strict) **LOLOS**. Bundle baru `dist/assets/index-DiqBUf3y.js` (501,14 kB) + CSS `index-t3yNhWsO.css`. **0 `helius-rpc.com`**; string `RugRadar v7.11.1` terkonfirmasi di bundle; `dist/logo.png` ada.
- `npx tsx scripts/test-scan.ts` (keyed, 28 Nov ~12:14 WIB): **BONK 81 Aman, WIF 88 Aman, POPCAT 88 Aman, PYUSD 0 Berisiko Tinggi** — tidak berubah.
- Deploy v7.11.1 via subagent (gh-pages + main), live check browser + tes HP Yukka masih menunggu — BUKAN final sampai Yukka ngetes sendiri dari HP.

## v7.11.2 — perbaikan path logo (28 Nov ~12:33 WIB, build lokal Bella)
- BUG (ketemu dari tes HP Yukka 12:31 + verifikasi live 12:31–12:32): logo header tampil ikon gambar rusak. Penyebab: `src/App.tsx` pakai path absolut literal `/logo.png` — di GitHub Pages itu mengarah ke root domain `dadapy04.github.io/logo.png` (404), padahal file ada di `dadapy04.github.io/rugradar/logo.png` (200, 1600×1600, shield benar). Vite TIDAK menulis ulang string src di JSX (hanya href di index.html yang ditulis ulang ke `/rugradar/logo.png` — jadi favicon sebenarnya sudah benar). Perbaikan: img src jadi `${import.meta.env.BASE_URL}logo.png`. Footer: `RugRadar v7.11.2`.
- `npm run build` (tsc -b + vite, strict) **LOLOS**. Bundle baru `dist/assets/index-B-lXy1el.js`; string `/rugradar/logo.png` terkonfirmasi 1× di bundle; `RugRadar v7.11.2` ada; **0 `helius-rpc.com`**.
- `npx tsx scripts/test-scan.ts` (keyed, 28 Nov ~12:33 WIB): **BONK 79 Waspada** (TURUN dari 81 — drift data live, BUKAN bug: top-10 tetap 32,2% = holder 18/30, mint 20 + freeze 20; volume 24h $99,0 rb baru saja turun di bawah band $100 rb → liquidity 21/30; pola sama seperti POPCAT 86→88 kemarin, akan balik 81 begitu volume ≥$100 rb), **WIF 88 Aman, POPCAT 88 Aman, PYUSD 0 Berisiko Tinggi**.
- Deploy v7.11.2 via subagent (teks saja — logo.png sudah ada di gh-pages), live check + tes HP Yukka masih menunggu — BUKAN final sampai Yukka ngetes sendiri dari HP.

## v7.12 — enam fitur baru (28 Nov ~12:46–13:20 WIB, build lokal Bella)

Enam fitur yang diminta Yukka ("kenapa ga semuanya?"), dikerjakan berurutan. Footer: `RugRadar v7.12`.

### F1 — Score history + diff — DONE
- `localStorage` key `rugradar-history` (maks 20 entri: mint, score, verdict, top-10 %, timestamp). Scan ulang mint yang dikenal menampilkan baris diff "Sejak scan terakhir" (delta skor ▲/▼, delta top-10, perubahan verdict) + panah tren di samping label gauge. Ganti bahasa yang memicu re-scan TIDAK mencatat entri duplikat tapi tetap menampilkan diff.
- i18n: `historyDiffLabel`, `historyNoChange`, `historyVerdictChanged` di 7 bahasa.
- Verifikasi: build LOLOS; keyed BONK 81 / WIF 88 / POPCAT 88 / PYUSD 0.

### F2 — Batch scan — DONE (favorit Yukka: "bneran kerasa semuanya seperti bneran canggih")
- Textarea (satu mint per baris, maks 10) + tombol Scan; scan berurutan dengan progress (`Memindai X/Y…`); tabel kompak (token, skor, verdict); tiap baris bisa diklik untuk memuat hasil lengkap. Batch scan tercatat di history (F1). Memakai `scanToken` yang sudah ada.
- i18n: `batchTitle`, `batchPlaceholder`, `batchScanButton`, `batchScanning`, `batchEmptyError`, `batchMaxError`, `batchColToken`, `batchColScore`, `batchColVerdict`, `batchClickHint`, `batchInvalidLines` di 7 bahasa.
- Verifikasi: build LOLOS; keyed BONK 81 / WIF 88 / POPCAT 88 / PYUSD 0.

### F3 — Share card — DONE
- Tombol "Bagikan Gambar" di kartu hasil: render PNG 1080×1080 via canvas (navy gelap `#0a0f1e`, cincin radar, cincin skor, verdict, footer `dadapy04.github.io/rugradar`; nama panjang dipotong 30 karakter). Prioritas `navigator.share` dengan file, fallback download; share sheet yang dibatalkan bukan error. Tanpa dependensi baru.
- i18n: `shareCardButton`, `shareCardSaved`, `shareCardFailed` di 7 bahasa.
- Verifikasi: build LOLOS; keyed BONK 81 / WIF 88 / POPCAT 88 / PYUSD 0.

### F4 — Fresh-wallet share di top holders — DONE
- `ScanResult.top10Holders` (alamat + share) diisi dari `readTopHolders`. Setelah skor utama tampil (secondary step, tidak memperlambat scan 3 detik), `checkFreshWallets(addresses)` mengecek umur tiap dompet top-10 via `getSignaturesForAddress` (proxy): paging mundur limit 100 sampai batch pendek membuktikan awal riwayat tercapai; fresh = aktivitas pertama < 7 hari. Cap: maks 3 halaman/dompet, 3 dompet paralel; riwayat > 300 tanda tangan = "unknown" (bukan fresh). UI: baris di bawah kartu holders ("X dari 10 holder utama adalah dompet baru (<7 hari)"); ≥3 fresh tampil sebagai warn amber; jumlah unknown ikut disebutkan.
- i18n: `freshChecking`, `freshLine`, `freshNone`, `freshUnknown` di 7 bahasa.
- Verifikasi: build LOLOS; keyed BONK 81 / WIF 88 / POPCAT 88 / PYUSD 0. Probe live BONK: `top10Holders` 10 alamat; `checkFreshWallets` → `{fresh: 0, checked: 5, unknown: 5, total: 10}` dalam 1,77 dtk (5 unknown = dompet dengan riwayat > 300 tx — benar untuk BONK yang holder-nya sudah mapan; 0 fresh sesuai ekspektasi). Catatan: dua probe pertama sempat dapat BONK 78 + `top10Holders: null` (holder fetch gagal sesaat, fail-safe 15 + cap 79 bekerja seperti dirancang) — probe ketiga berhasil 81; flake upstream yang sudah dikenal, bukan bug fitur ini.

### F5 — Dev track record — BLOCKED (spike dulu, build dibatalkan)
- Alamat creator BISA didapat: laporan RugCheck punya field `creator` (ChokingCat `7uZETupu1EZWiKfTnFj4u4czXsr8oZH3DJ1tvCzjLxGu`, BONK `9AhKqLR67hwapvG8SA2JFXaCshXc9nALJjpKaHZrsbkw`) — tapi `creatorTokens` = null di kedua laporan, jadi riwayat deployment creator TIDAK ada di laporan itu.
- Jalur lain juga buntu lewat proxy: Helius DAS `getAssetsByCreator` → HTTP 403 "RPC method not allowed: getAssetsByCreator" (allowlist proxy hanya 5 method); pump.fun `frontend-api.pump.fun/coins/user-created-coins/...` → HTTP 530 (error 1016); `frontend-api-v2.pump.fun` → `access_denied` (rule 0.18). Endpoint pump.fun juga tidak resmi + hanya mencakup token pump.
- Keputusan: **BLOCKED — riwayat deployment creator tidak bisa diambil secara andal lewat proxy yang ada; build dilewati, tidak ada data palsu/hardcode.** Yang dibutuhkan agar fitur ini bisa jalan: tambah `getAssetsByCreator` (atau `getAsset` dengan creators) ke allowlist Worker + secret Helius — itu perubahan server, bukan client; atau endpoint creator-history resmi dari pump.fun/RugCheck.

### F6 — LP unlock countdown — DONE
- `checkLpUnlocks(mint)` membaca `lockers` dari laporan RugCheck (URL sama dengan sinyal insider: proxy dulu, fallback langsung, timeout 10 dtk/URL) + parser murni `parseLpLockers` (nearest future unlock; `unlockDate` 0 = permanen, tanggal lewat = sudah unlock). UI: secondary step setelah hasil tampil, hanya bila token bukan bonding curve DAN LP belum efektif terbakar (burnedPct < 95% — garis "burned" milik cek LP sendiri). Warning amber di bawah kartu LP: "LP unlock dalam X hari (tanggal)".
- i18n: `lpUnlockTitle`, `lpUnlockWarning` di 7 bahasa.
- Verifikasi: build LOLOS; keyed BONK 81 / WIF 88 / POPCAT 88 / PYUSD 0. Probe live: **BONK → future unlock NYATA: Streamflow locker `Bv5HSLh4xf1NZGkKh4QjY3WyZc3aqX6gtpjdBEYPZ9X6`, unlockDate 1806757201 (~2 Mar 2027), $187 terkunci** (spike awal hanya melihat locker Jupiter + Raydium dan melewatkan yang ini — parser menemukannya; dump lengkap 14 locker BONK terverifikasi via proxy). ChokingCat → null (lockers `{}`), WIF → null, POPCAT → null, PYUSD → null (tidak ada future unlock — UI diam, benar). Parser sintetik: campuran future +3 hari / +10 hari / 0 / lewat → nearest +3 hari, count 2; `{}` dan null → null.
- **Perangkap gate yang diperbaiki saat verifikasi:** gate awal (`lpBurnedPct != null && < 100`) akan MELEWATKAN BONK — `lpBurnedPct` BONK = null karena pair teratasnya pool Orca (concentrated liquidity, tidak ada LP mint; cek LP = `na`) padahal RugCheck tetap melaporkan locker di pool Raydium-nya. Gate diubah: skip hanya bila bonding curve ATAU burnedPct ≥ 95%; null = jalankan (burn tidak terukur ≠ terbakar). WIF burnedPct 0 (top-1 LP 8,0%), POPCAT burnedPct 0 (warn, top-1 70,6%) — keduanya lolos gate dengan benar.
- Catatan: laporan token lama bisa besar (BONK ~2,5 MB) — fetch hanya sebagai secondary step, sekali per scan.

### Verifikasi akhir v7.12
- `npm run build` (tsc -b + vite, strict) **LOLOS** setelah tiap fitur (F1–F6). Bundle baru `dist/assets/index-1pCVt_eC.js` + CSS `index-BYJwYg41.css`. **0 `helius-rpc.com`** di bundle; string `RugRadar v7.12` terkonfirmasi di hasil build.
- `npx tsx scripts/test-scan.ts` (keyed, 28 Nov ~13:20 WIB): **BONK 81 Aman, WIF 88 Aman, POPCAT 88 Aman, PYUSD 0 Berisiko Tinggi** — tidak berubah. (BONK sempat 79 di tengah jalan karena drift volume 24h di sekitar band $100 rb — drift yang diharapkan, bukan bug.)
- Script probe sementara (`scripts/probe-f4-tmp.ts`, `probe-f6*-tmp.ts`) sudah dihapus — tidak masuk build.
- Shot list demo video diperbarui (`submission-assets/demo-video-script.md`): shot 5 baru = batch scan (paste 4 mint → tabel terisi 81/88/88/0), visual-only; skor ChokingCat diperbaiki 47 → 77.
- **BELUM DEPLOY / PUSH — build + test lokal saja. Live check browser + tes HP Yukka masih menunggu — BUKAN final sampai Yukka ngetes sendiri dari HP.**

## v7.12.1 — glow tombol Scan diperkuat (28 Nov ~13:35 WIB, build lokal Bella)
- BUG (laporan verifikasi live v7.11 + v7.12): glow neon tombol Scan tidak kelihatan — penyebab: satu layer `drop-shadow(0 0 8px)` warna indigo sama dengan tombol + alpha rendah. Perbaikan: glow 3 lapis cyan (`6px rgba(34,211,238,.9)` + `20px rgba(34,211,238,.55)` + `42px rgba(79,70,229,.4)`) + animasi denyut `scan-glow` 2,4 detik (hover/active/disabled matikan animasi; `prefers-reduced-motion` dihormati). Variabel `--glow` lama dihapus (hanya dipakai di 3 aturan itu). Footer: `RugRadar v7.12.1`. Kontras teks tombol tidak berubah (6,29:1 terang / 5,98:1 gelap — glow di luar tombol).
- `npm run build` (tsc -b + vite, strict) **LOLOS**. Bundle baru `dist/assets/index-C3mzHmRU.js`; `scan-glow` terkonfirmasi di CSS; `RugRadar v7.12.1` ada; **0 `helius-rpc.com`**.
- Keyed test: BONK / WIF / POPCAT / PYUSD (lihat output di atas — harus 81/88/88/0, toleransi drift volume BONK 79–81).
- Deploy v7.12.1 via subagent (teks saja), live check + tes HP Yukka masih menunggu — BUKAN final sampai Yukka ngetes sendiri dari HP.

## v7.12.2 — glow tombol Scan pindah ke wrapper (28 Nov ~13:40 WIB, build lokal Bella)
- BUG NYATA (verifikasi live v7.12.1, 13:38 WIB): glow TETAP tidak kelihatan di kedua tema, bahkan di zoom 3x — footer v7.12.1 + bundle C3mzHmRU benar, BONK 79 Waspada benar, tapi tombol indigo solid tanpa halo. PENYEBAB (ditemukan dari bukti): tombol pakai `clip-path` angular — menurut urutan render CSS, filter diterapkan SEBELUM clip-path, jadi drop-shadow di luar bentuk tombol langsung terpotong clip-path. Itu sebabnya glow v7.11 dan v7.12.1 sama-sama tak pernah tampak (logo perisai yang tanpa clip-path glow-nya justru kelihatan). PERBAIKAN: glow 3 lapis cyan + animasi `scan-glow` dipindah ke wrapper baru `<span class="btn-glow">` di sekeliling kedua tombol primer (CEK TOKEN + SCAN SEMUA); wrapper tidak punya clip-path, jadi drop-shadow-nya mengikuti bentuk angular tombol dan tidak terpotong. Hover: glow wrapper menguat; tombol disabled: glow mati (`:has()`); `prefers-reduced-motion` dihormati. Footer: `RugRadar v7.12.2`.
- `npm run build` (tsc -b + vite, strict) **LOLOS**. Bundle baru `dist/assets/index-C6jQu_lz.js`; `btn-glow` terkonfirmasi di CSS; `RugRadar v7.12.2` ada; **0 `helius-rpc.com`**.
- Keyed test: BONK / WIF / POPCAT / PYUSD (lihat output di atas — harus 79–81/88/88/0; BONK goyang 79–81 karena volume di sekitar $100K).
- Deploy v7.12.2 via subagent (teks saja), live check + tes HP Yukka masih menunggu — BUKAN final sampai Yukka ngetes sendiri dari HP.

## v7.12.3 — 3 polesan dari tes HP Yukka (28 Nov ~14:06 WIB, build lokal Bella)
- 1) Sticky scan bar di mobile DIMATIKAN (aturan `position: sticky` ≤560px dari v7.10 dihapus — di HP memakan ~1/3 layar saat scroll ke hasil; bar kini statis di semua ukuran, ruang hasil scan lebih lega untuk video demo).
- 2) Alamat mint di hasil scan: layar sempit kini tampil format singkat `7GCihg…YmW2hr` (helper `shortMint`, 6 awal + 4 akhir, alamat penuh di tooltip `title`); desktop tetap alamat penuh. Tombol salin tetap menyalin alamat penuh.
- 3) Disclaimer ganda di kotak Aman dihapus: ringkasan risiko tidak lagi mengulang pengingat "Remember: this score rates the contract…" saat verdict Aman — teks verdict-nya sendiri sudah bilang "Still DYOR — a score is not a guarantee". Waspada/Berisiko tetap menyimpan pengingat itu (teks verdict mereka tidak punya kalimat DYOR).
- Verifikasi ringkasan (live + sintetis): POPCAT 88 Aman → ringkasan berakhir setelah flag LP, tanpa pengingat ✓; BONK 81 Aman → berakhir setelah flag metadata ✓; ChokingCat 77 Waspada → jalur konsekuensi kuat tak berubah ✓; PYUSD 0 Berisiko Tinggi → jalur fatal tak berubah ✓; sintetis 4 kasus (Aman/Waspada × bersih/flag ringan) semua sesuai — pengingat hanya muncul di Waspada ✓.
- `npm run build` (tsc -b + vite, strict) **LOLOS**. Bundle baru `dist/assets/index-BB_dbhou.js`; `mint-short` terkonfirmasi di CSS; `RugRadar v7.12.3` ada; **0 `helius-rpc.com`**.
- Keyed test: BONK 81 Aman / WIF 88 / POPCAT 88 / PYUSD 0 (BONK kembali 81 — volume di atas $100K).
- Deploy v7.12.3 via subagent (teks saja), live check + tes HP Yukka masih menunggu — BUKAN final sampai Yukka ngetes sendiri dari HP.
