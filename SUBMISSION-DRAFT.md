# SUBMISSION-DRAFT.md — Draf isian portal Dev3pack (copy-paste)

> Siap tempel ke form submit proyek di app.dev3pack.xyz. Sesuaikan field
> nama proyek/deskripsi dengan kolom yang ada di portal.

## Project name

**RugRadar**

## Tagline (satu baris)

Cek keamanan memecoin Solana sebelum kamu beli — skor rug 0–100 dalam hitungan detik.

## Description (2–3 kalimat)

RugRadar adalah Token Safety Scanner untuk memecoin Solana: tempel alamat
mint, langsung dapat skor risiko 0–100 beserta verdict Aman / Waspada /
Berisiko Tinggi. Skor dihitung dari data on-chain langsung (mint authority,
freeze authority, konsentrasi holder top-10) dan data pasar live
(likuiditas, volume 24 jam, umur pool), semuanya dijelaskan dengan bahasa
yang mudah dipahami pemula. Dibangun untuk trader ritel Indonesia yang
sering jadi korban rug pull karena tidak tahu cara membaca data kontrak
token.

## Features

- Paste alamat mint Solana → skor risiko 0–100 + verdict dalam ~10 detik
- 4 pemeriksaan dengan penjelasan Bahasa Indonesia: Mint Authority (20),
  Freeze Authority (20), Konsentrasi Holder Top-10 (30), Likuiditas &
  Aktivitas Pasar (30)
- Gauge skor visual + rincian poin per cek (pass / warn / fail)
- Statistik token live: harga, market cap, likuiditas, volume 24j, supply
- Tombol contoh sekali klik: BONK, WIF, POPCAT
- UI mobile-friendly, tanpa wallet, tanpa login, tanpa API key

## Tech stack

- TypeScript + Vite + React 19
- @solana/web3.js — baca mint account dari Solana mainnet RPC (publik,
  dengan 3 fallback endpoint)
- DexScreener public API — data pasar live (tanpa API key)
- Tanpa on-chain program, tanpa backend, tanpa database, tanpa API key

## Yang ditunjukkan di demo

1. Tempel mint BONK → skor 63/100 (Waspada) dengan rincian: kedua authority
   sudah revoked, likuiditas sehat, dan satu cek yang jujur dilaporkan
   "data tidak tersedia" karena RPC publik membatasi method holder.
2. Tempel mint WIF / POPCAT → skor 70/100 (Waspada), likuiditas penuh 30/30.
3. Tempel mint token sembarangan → verdict Berisiko Tinggi dengan alasan
   yang jelas (mis. mint authority masih aktif / tidak ada likuiditas).
4. Semua angka terverifikasi live saat demo — hasil tes 27 Nov 2026 ada di
   `TEST-RESULTS.md`.

## Links (isi saat submit)

- Demo / repo: _tempel URL deploy atau repo GitHub di sini_
- Video demo (opsional): _link video bila ada_
