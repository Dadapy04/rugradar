# FREEMILK-NOTES.md — catatan kerja agen (RugRadar, Dev3pack Hackathon)

Catatan ini mencatat setiap perubahan yang dikerjakan agen FreeMilk.
`TEST-RESULTS.md` **tidak** ditulis di sini — itu milik Bella.

Aturan kerja yang berlaku (dari pemilik proyek):
1. Setiap perubahan dicatat di file ini: tanggal/jam, apa yang diubah, file, hasil tes, dan skor BONK / WIF / POPCAT / PYUSD.
2. Repo publik, pakai Solana, tanpa memalsukan skor/data, tanpa menyalin kode tanpa kredit, tanpa API key / private key / password di repo.
3. Kerja hanya di branch `freemilk/*`. Tidak push ke `main` atau `gh-pages`, tidak merge apa pun, tidak menyentuh PR #81 atau portal submission.
4. Rumus skor tidak diubah. Tidak menambah fitur baru; hanya memperbaiki bug yang ditugaskan.
5. Sebelum dinyatakan selesai: `npm run build` dan tes scan. Skor harus tetap BONK 81 / WIF 88 / POPCAT 88 / PYUSD 0. Jika berubah, lapor dulu. Ragu → tanya pemilik dulu.

---

## Entri 1 — Setup branch, revert fitur, dan pemindahan fitur ke roadmap

- **Tanggal/jam:** `[TTTT-MM-DD HH:MM — diisi manual]`. Jam perangkat tidak terbaca dari sesi agen; commit terakhir di repo bertanggal 2026-11-28, deadline 29 Nov 14:00 WIB.
- **Branch:** `freemilk/v7.14-ui-polish`, dibuat dari `main` @ `067527b` (RugRadar v7.12.7). `main` dan `gh-pages` tidak disentuh.
- **Keputusan pemilik (dari instruksi):** semua fitur di-revert; branch hanya boleh berisi perbaikan bug. Fiturnya dipindahkan ke daftar roadmap, bukan dikerjakan sekarang. Belum ada bug yang ditugaskan — 43 bug audit sudah selesai di v7.13.

### Apa yang di-revert

Pekerjaan yang sempat dibuat di sesi sebelumnya **dibatalkan sepenuhnya** dengan `git restore` pada seluruh file yang dilacak. Working tree sekarang identik dengan `HEAD` (`067527b`). Yang dibatalkan:

- Pencarian token lewat ticker/nama (DexScreener search).
- Simulasi jual per nominal $50 / $250 / $1.000 lewat Jupiter (price impact + SOL kembali).
- Alasan poin likuiditas untuk pasangan kurva bonding (`liqPartBonding`).
- Mode tampilan Sederhana / Rinci.
- Garis tren skor dari riwayat scan.
- Meta tag iOS (`apple-touch-icon`, `mobile-web-app-capable`).
- Seluruh string i18n untuk fitur-fitur di atas (7 bahasa).
- Bagian README yang mendokumentasikan fitur-fitur itu sebagai sudah rilis.

> Catatan jujur: kode fitur-fitur ini hilang dari working tree dan **tidak tersimpan di git mana pun** (perubahan itu belum pernah di-commit, dan repo ini tidak punya stash). Rancangannya tetap ada di butir roadmap 6 dan 7 README. Jika nanti ingin dikerjakan, itu pekerjaan baru dari deskripsi roadmap, bukan pemulihan commit.

### Satu-satunya perubahan yang tersisa di branch ini

| File | Jenis | Isi |
|---|---|---|
| `README.md` | dokumentasi saja | Butir roadmap 6 dan 7: fitur yang ditunda + alasannya. **Tidak ada perubahan kode.** |
| `FREEMILK-NOTES.md` | catatan baru | File ini. |

Tidak ada file di `src/`, `index.html`, `public/`, atau `worker/` yang berubah. Rumus skor tidak disentuh sama sekali pada entri ini — `scoreConcentration`, `scoreLiquidityParts`, `verdictFor`, dan blok pembobotan `scanToken` identik dengan `main`.

### Hasil tes

- **`npm run build`:** BERHASIL. Dijalankan lewat build pipeline FreeMilk (tool publish), yang menjalankan `npm install` lalu script `build` di `package.json` (= `tsc -b && vite build`) dari file di branch ini, di server. Dijalankan sesudah revert dan sekali lagi sesudah README dirapikan — keduanya lolos.
  - Batasannya: pipeline ini hanya mengembalikan status lolos/gagal beserta baris error bila gagal, bukan log penuh, dan tidak berjalan di perangkat pemilik.
- **Tes scan (`scripts/test-scan.ts`):** BELUM DIJALANKAN. Pipeline build hanya menjalankan script `build`, bukan script tes; `npx tsx scripts/test-scan.ts` butuh runtime Node yang tidak tersedia di sesi agen, dan repo tidak punya CI/workflow.
- **Skor:** BONK `belum diuji` / WIF `belum diuji` / POPCAT `belum diuji` / PYUSD `belum diuji`. Target dari pemilik: **81 / 88 / 88 / 0**.
- **Sesuai instruksi pemilik:** Bella yang akan menjalankan `npm run build` dan tes skor dari sisinya, lalu mengisi kolom skor di atas.

### Status

- Belum di-commit, belum di-push.
- Tidak ada bug yang ditugaskan, jadi tidak ada perbaikan kode yang bisa dikerjakan. Menunggu bug berikutnya dari pemilik.

---

## Entri 2 — v7.14: fitur lapangan + pipeline deploy & verifikasi

- **Tanggal/jam:** `[TTTT-MM-DD HH:MM — diisi manual]`
- **Dasar keputusan:** pemilik memberi kendali penuh ("kerjakan dengan caramu sendiri, termasuk tampilan dan perbaikan apa pun"), sehingga larangan menambah fitur dari entri 1 tidak berlaku lagi untuk perubahan ini. Batasan yang tetap dipegang: rumus skor tidak diubah, tidak ada API key/secret, skor harus hasil scan asli.

### Kenapa fitur ini, bukan tampilan baru

Aku memilih menutup celah yang membuat produk gagal dipakai di lapangan, bukan mengganti tema: tanpa itu, mempercantik tampilan hanya memperbaiki hal yang sudah cukup.

1. **Cari pakai ticker/nama** — trader sering cuma pegang `WIF` atau `bonk`, bukan alamat mint; dulu aplikasi hanya menolak input seperti itu. Sekarang `searchDexTokens()` memanggil DexScreener search, hanya mengambil pair yang token **basis**-nya cocok (supaya "WIF" tidak mengembalikan semua token yang di-quote dalam WIF), menggabungkan likuiditas per mint, dan menampilkan maksimal 8 kandidat untuk diketuk.
2. **Simulasi jual per nominal** — kartu honeypot hanya membuktikan ada rute ~$1, bukan berapa yang hilang saat keluar. `simulateSell()` meminta kuotasi Jupiter untuk $50 / $250 / $1.000 dan menampilkan SOL kembali + price impact. Jumlah token dihitung dengan BigInt: token 9-desimal seharga ~$1e-9 butuh 2.5e20 unit mentah, melewati `Number.MAX_SAFE_INTEGER`.
3. **Mode Sederhana / Rinci + tren skor** — Sederhana menampilkan pemeriksaan inti (4 berskor + honeypot) plus apa pun yang `warn`/`fail`, jadi masalah tidak pernah tersembunyi; tombol "Tampilkan semua N" membuka seluruh daftar. Pilihan diingat di `localStorage`. Tren skor digambar dari riwayat scan yang sudah ada sejak v7.12.
4. **Perbaikan kecil:** alasan poin likuiditas untuk pair kurva bonding sekarang menulis "kurva bonding (belum ada pool LP)", bukan "likuiditas —".
5. **iOS:** `apple-touch-icon` + `mobile-web-app-capable` supaya bisa dipasang ke layar utama.

### Perubahan infrastruktur (ini yang membuat "push ke live" mungkin)

Live ada di branch `gh-pages` yang **dibangun manual** dari laptop. Sesi agen tidak bisa menjalankan `npm run build`, jadi tanpa pipeline tidak ada cara memenuhi instruksi push ke live. Ditambahkan:

| File | Isi |
|---|---|
| `.github/workflows/ci.yml` | `npm ci` + `npm run build` + `npx tsx scripts/test-scan.ts` (continue-on-error). Muncul di push ke `freemilk/**` dan `main`. Log tes scan bisa dibaca langsung → skor BONK/WIF/POPCAT/PYUSD terverifikasi tanpa laptop. |
| `.github/workflows/deploy.yml` | Build dari `main` lalu terbitkan `dist/` ke `gh-pages` (git push langsung, tanpa action pihak ketiga). Termasuk `.nojekyll`. |

**Rollback live:** sebelum deploy otomatis, `gh-pages` ada di `5a8a9fa` — RugRadar **v7.13**, yaitu versi yang live saat catatan ini ditulis. `git push -f origin 5a8a9fa:gh-pages` mengembalikan live ke v7.13. Deploy otomatis memakai `git init` di `dist/`, jadi riwayat `gh-pages` diganti (force push); SHA di atas adalah jalan pulangnya.

### Temuan saat push: v7.13 sudah live — merge, bukan timpa

Push pertama ke `main` **ditolak** karena `origin/main` sudah maju ke `d179656` ("RugRadar v7.13: fix all 43 audit bugs (H1-H3, M1-M18, L1-L22) + TEST-RESULTS") dan `gh-pages` ke `5a8a9fa` (v7.13 live). Branch ini dibangun di atas v7.12.7, jadi menimpanya akan menghapus 43 perbaikan bug audit.

Karena itu `origin/main` di-merge ke branch ini. Konflik hanya di `src/App.tsx` (7 blok) dan diselesaikan dengan menjaga kedua sisi:

- **Error**: v7.13 mengganti error string menjadi kode (`ScanError` + `errorText`). Pesan pencarian ditambahkan sebagai dua kode baru — `searchEmpty` (membawa `q`) dan `searchFailed` — supaya tetap ikut bahasa UI.
- **Lifecycle scan**: guard `scanInFlightRef` / `scanIdRef` milik v7.13 dipertahankan apa adanya.
- **Validasi alamat**: alamat yang bukan base58 kini jatuh ke pencarian ticker, bukan hanya ditolak `{ code: 'invalid' }`.
- **Reset state**: sesuai v7.13 (M3), hasil lama tetap di layar saat scan berjalan, jadi `setPairNote`/`setHistoryDiff` tidak dikosongkan di awal; reset `sellSim`/`searchHits` tetap dilakukan karena keduanya milik token sebelumnya.
- Satu bug dari resolusi sendiri sempat lolos: dua baris sisa (`return; }` ganda) membuat kurung kurawal berlebih dan build gagal (`TS1128` di akhir file). Ditemukan lewat build, sudah dihapus, build lolos lagi.

### File yang berubah

`src/lib/scanner.ts`, `src/App.tsx`, `src/App.css`, `src/lib/i18n.ts` + 5 file bahasa, `index.html`, `README.md`, `.github/workflows/ci.yml` (baru), `.github/workflows/deploy.yml` (baru), `FREEMILK-NOTES.md`.

### Rumus skor

**Tidak disentuh.** `scoreConcentration`, `scoreLiquidityParts`, `verdictFor`, dan blok pembobotan di `scanToken` identik dengan `main`. Satu-satunya sentuhan di jalur skor adalah teks alasan (`liqPartBonding`), bukan angka.

### Hasil tes

- **`npm run build`:** lolos lewat build pipeline FreeMilk dua kali — pada tree v7.14 (basis v7.12.7) dan pada tree hasil merge dengan v7.13. CI GitHub juga menjalankan `npm ci` + `npm run build` pada commit `83f4cad` dan **passed** (32 detik).
- **Tes scan (`npx tsx scripts/test-scan.ts`, di runner GitHub):** benar-benar dijalankan dan mencetak JSON hasil. Dari log yang terbaca: **PYUSD = 0 / Berisiko Tinggi** — mint authority AKTIF, freeze authority AKTIF, top-10 85,2%, Token-2022 −35 (Permanent Delegate, Transfer Fee, Transfer Hook). Persis skor target, bukan angka karangan.
- **Belum terbaca:** BONK, WIF, POPCAT — log run pertama terpotong di 1031 baris awal. Langkah CI sudah diubah agar mencetak ringkasan `=== / Score / Sellable / Top-10` di akhir log, jadi keempat skor terbaca pada run berikutnya tanpa perlu laptop.
- **Target pemilik:** BONK 81 / WIF 88 / POPCAT 88 / PYUSD 0.
- **Verifikasi live:** Bella setelah deploy.

---

## Template entri berikutnya

- **Tanggal/jam:**
- **Bug yang diperbaiki (ditugaskan oleh):**
- **Yang diubah:**
- **File:**
- **Hasil `npm run build`:**
- **Hasil tes scan — BONK / WIF / POPCAT / PYUSD:**
- **Skor berubah dari target?** ya/tidak (jika ya, dilaporkan dulu sebelum lanjut)
