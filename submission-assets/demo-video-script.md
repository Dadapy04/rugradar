# Demo Video RugRadar — naskah + rencana shot (60–90 detik)

Target: ≤ 90 detik (maks portal 3 menit). Narasi Bahasa INGGRIS
(Yukka 27 Nov ~21:55: "ini nanti pake bahasa inggris aja"),
suara `avocado_v2:MAI_01` (Aria, perempuan), speed 110.
Audio: `demo-narration-en-aria-v2.mp3` (dibangkitkan 27 Nov 2026).
UI direkam dalam Bahasa Inggris (toggle EN sebelum scan).
Rekam SETELAH v7.12 live + terverifikasi (batch scan adalah shot kunci;
narasi yang sudah direkam TIDAK menyebut batch scan — shot batch scan
jalan visual-only di atas musik penutup).

## Naskah narasi (English)

This token is up three hundred percent in one hour. Buy it — or is it
a trap? RugRadar answers in three seconds. Paste the contract address —
and here is the result: a score of eighty-one, Safe. Mint authority is
revoked, nobody can print new tokens. Holders are spread out, liquidity
is deep. Now compare it with this one: a score of zero, High Risk.
Permanent Delegate is still active — the developer can freeze tokens in
anyone's wallet. RugRadar also reads bundle patterns: if many wallets
buy at the exact same second, you get warned right away. Two tokens, two
verdicts. RugRadar: the three-second risk translator for Solana memecoins.

## Shot list

1. (0–8 dtk) Hook — paste mint BONK di input, tekan scan.
   `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`
2. (8–32 dtk) Hasil BONK 81 Aman — gauge hijau, Mint/Freeze revoked,
   holder tersebar, likuiditas dalam, Sellable SAFE (v7.9).
3. (32–55 dtk) Paste mint PYUSD, scan → 0 Berisiko Tinggi, flag
   Permanent Delegate merah di ringkasan.
   `2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo`
4. (55–68 dtk) Kartu Bundle Dev — token muda (ChokingCat,
   `ExpdNM5YykDnGTmyxCH5B3s7mdWi1cEreDvK6ic8pump`, 77 Waspada setelah
   fix PumpSwap v7.11): jaringan 9 dompet, 40,1% suplai.
5. (68–80 dtk) **Batch scan (v7.12, shot kunci — favorit Yukka)** —
   paste 4 mint sekaligus di textarea batch (BONK, WIF, POPCAT, PYUSD,
   satu per baris), tekan Scan → tabel terisi berurutan: BONK 81 Aman,
   WIF 88 Aman, POPCAT 88 Aman, PYUSD 0 Berisiko Tinggi. Klik satu
   baris → hasil lengkap token itu. Visual-only, tanpa narasi.
6. (80–90 dtk) Kartu penutup: "RugRadar — 3-Second Solana Memecoin
   Risk Translator" + https://dadapy04.github.io/rugradar/

## Perakitan

- Rekam layar dist lokal (atau demo live) via Playwright video capture;
  API eksternal lewat egress forwarder 127.0.0.1:18080.
- Gabung klip + narasi dengan ffmpeg; output:
  `submission-assets/rugradar-demo-video.mp4`.
- Upload: Unlisted ke channel YouTube @SemestaKita-000 (asumsi kerja;
  konfirmasi rute saat eksekusi) → URL dipakai untuk Step 3 form.
