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
