// RugRadar — Indonesian / English strings.
// All user-visible text lives here so the header toggle can switch the whole
// UI (and the scanner's check text) without a library.
// v7.11 — 7 languages: id, en, zh (Simplified Chinese), es (Latin American
// Spanish), pt (Brazilian Portuguese), ru (Russian), vi (Vietnamese).
// The 5 non-id/en dicts live in sibling files (i18n.zh.ts etc.) so each
// language stays independently reviewable; STRINGS assembles them here.

import { zh } from './i18n.zh';
import { es } from './i18n.es';
import { pt } from './i18n.pt';
import { ru } from './i18n.ru';
import { vi } from './i18n.vi';

export type Lang = 'id' | 'en' | 'zh' | 'es' | 'pt' | 'ru' | 'vi';

/** All supported languages, in toggle order. */
export const LANGS: Lang[] = ['id', 'en', 'zh', 'es', 'pt', 'ru', 'vi'];

/** Native display name per language (used by the header language select). */
export const LANG_NAMES: Record<Lang, string> = {
  id: 'Indonesia',
  en: 'English',
  zh: '中文',
  es: 'Español',
  pt: 'Português',
  ru: 'Русский',
  vi: 'Tiếng Việt',
};

/** BCP 47 locale per language (number/date formatting). */
export const LOCALES: Record<Lang, string> = {
  id: 'id-ID',
  en: 'en-US',
  zh: 'zh-CN',
  es: 'es-ES',
  pt: 'pt-BR',
  ru: 'ru-RU',
  vi: 'vi-VN',
};

export const LANG_STORAGE_KEY = 'rugradar-lang';

export function detectLang(): Lang {
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved != null && (LANGS as string[]).includes(saved)) return saved as Lang;
  } catch {
    // storage unavailable — fall back to English (the default language)
  }
  return 'en';
}

export interface CheckTexts {
  title: string;
  detailRevoked: string;
  detailActive: string;
  explanation: string;
}

export interface Dict {
  tagline: string;
  pageTitle: string;
  fieldLabel: string;
  placeholder: string;
  scanButton: string;
  scanningButton: string;
  tryExamples: string;
  emptyMintError: string;
  evmError: string;
  invalidError: string;
  notMintError: string;
  mintNotFoundError: string;
  genericError: string;
  rpcErrorPrefix: string;
  loadingText: string;
  loadingStep1: string;
  loadingStep2: string;
  loadingStep3: string;
  howTitle: string;
  howStep1: string;
  howStep2: string;
  howStep3: string;
  verdictAman: string;
  verdictWaspada: string;
  verdictBerisiko: string;
  verdictTextAman: string;
  verdictTextWaspada: string;
  verdictTextBerisiko: string;
  verdictTextBerisikoNoMarket: string;
  badgePass: string;
  badgeWarn: string;
  badgeFail: string;
  badgeInfo: string;
  badgeUnavailable: string;
  badgeNa: string;
  holderLow: string;
  holderMid: string;
  holderHigh: string;
  extraCheck: string;
  points: string; // "poin" / "pts"
  gaugeLabel: (score: number) => string;
  statsPrice: string;
  statsMarketCap: string;
  statsLiquidity: string;
  statsVolume24h: string;
  statsPriceChange24h: string;
  statsTxns24h: string;
  statsSupply: string;
  statsTop10: string;
  statsGroupMarket: string;
  statsGroupToken: string;
  checksHeading: string;
  topHoldersHeading: string;
  scannedAt: string;
  viewOnDexscreener: string;
  viewOnSolscan: string;
  viewOnBubblemaps: string;
  lostLine: (lost: number, reason: string) => string;
  safetyScoreLabel: string;
  riskLevelLine: (level: string) => string;
  riskLow: string;
  riskMid: string;
  riskHigh: string;
  holdersExcludedNote: (kinds: string) => string;
  holdersExcludedNone: string;
  excludedPool: string;
  excludedBurn: string;
  excludedExchange: string;
  clearInput: string;
  pasteInput: string;
  pasteFailed: string;
  copyAddress: string;
  addressCopied: string;
  share: string;
  shareTitle: string;
  shareText: (name: string, symbol: string, score: number) => string;
  copyResult: string;
  copyLink: string;
  copied: string;
  copyFailed: string;
  copySummary: (s: {
    name: string;
    symbol: string;
    score: number;
    verdict: string;
    checks: string;
    mint: string;
    summary?: string;
  }) => string;
  footerScoring: string;
  footerDisclaimer: string;
  // Check text (used by scanner.ts, parameterised with formatted values)
  mint: CheckTexts;
  freeze: CheckTexts;
  holdersTitle: string;
  holdersUnavailable: string;
  holdersScoreDefault: string;
  holdersDetail: (top10: string, top1: string) => string;
  holdersExplanation: string;
  liquidityTitle: string;
  liquidityNoPair: string;
  liquidityDexError: string;
  liquidityDetail: (liq: string, vol: string, ageDays: string, dex: string) => string;
  liquidityExplanation: string;
  sellableTitle: string;
  sellableOk: string;
  sellableWarn: string;
  sellableUnavailable: string;
  sellableExplanation: string;
  // Lost-points reasons (one short line under a check that lost points)
  mintLostReason: string;
  freezeLostReason: string;
  holdersLostNoData: string;
  holdersLostDetail: (top10: string) => string;
  // v7.6 — dev-bundle heuristic (young tokens only)
  bundleTitle: string;
  bundleOk: (buyers: string, share: string) => string;
  bundleSuspected: (buyers: string, share: string) => string;
  bundleSuspectedRc: (wallets: string, share: string) => string;
  bundleOkRc: (wallets: string, share: string) => string;
  bundleSkipped: string;
  bundleUnavailable: string;
  bundleTooDeep: string;
  bundleExplanation: string;
  liquidityLostNoPair: string;
  liqPartLow: (v: string) => string;
  agePartLow: (v: string) => string;
  volPartLow: (v: string) => string;
  // LP Burn/Lock check (informational)
  lpTitle: string;
  lpBurned: (pct: string) => string;
  lpMostlySafe: (top1: string) => string;
  lpNotBurned: (top1: string) => string;
  lpUnavailable: string;
  lpExplanation: string;
  // Token metadata check (informational)
  metadataTitle: string;
  metadataImmutable: string;
  metadataMutable: string;
  metadataUnavailable: string;
  metadataExplanation: string;
  // Number formatting
  thousand: string; // "rb" / "K"
  million: string; // "jt" / "M"
  days: string; // "hari" / "days"
  unknownName: string;
  // v7 — smart input / pair resolution
  eyebrow: string;
  pairConvertedNote: (name: string, symbol: string) => string;
  pairGuidanceError: string;
  // v7 — market context card
  marketCardTitle: string;
  marketRatioLabel: string;
  marketAgeLabel: string;
  marketTotalLiquidityLabel: string;
  marketTotalVolumeLabel: string;
  marketTopPairNote: (value: string) => string;
  marketThinWarning: (ratio: string) => string;
  txnsBuy: string;
  txnsSell: string;
  // v7 — bonding curve
  bondingCurveLabel: string;
  lpBondingCurve: string;
  lpOrca: string;
  lpMeteora: string;
  // v7 — Token-2022 extensions (informational)
  token2022Title: string;
  token2022Standard: string;
  token2022Clean: string;
  token2022Found: (names: string) => string;
  token2022Unavailable: string;
  token2022Explanation: string;
  token2022NoPenalty: string;
  token2022PenaltyLabel: (penalty: number) => string;
  extPermanentDelegate: string;
  extTransferFee: string;
  extTransferHook: string;
  // v7 — recent scans / timestamp / rescan
  recentScansTitle: string;
  recentHint: string;
  rescan: string;
  updatedJustNow: string;
  updatedMinutes: (n: number) => string;
  updatedHours: (n: number) => string;
  // v7 — methodology modal
  methodTitle: string;
  methodClose: string;
  methodIntro: string;
  methodWeightsTitle: string;
  methodWeightMint: string;
  methodWeightFreeze: string;
  methodWeightHolders: string;
  methodHoldersNote: string;
  methodBundleTitle: string;
  methodBundleText: string;
  methodWeightLiquidity: string;
  methodLiquidityNote: string;
  methodPenaltyTitle: string;
  methodPenaltyText: string;
  methodBandsTitle: string;
  methodBandSafe: string;
  methodBandCaution: string;
  methodBandHigh: string;
  methodExclusionsTitle: string;
  methodExclusionsText: string;
  methodSourcesTitle: string;
  methodSourcesText: string;
  methodExtrasTitle: string;
  methodExtrasText: string;
  // v7 — theme toggle
  themeToDark: string;
  themeToLight: string;
  // v7.4 — plain-language risk summary (rule-based, no AI)
  summaryBut: string; // "tetapi" / "but"
  summaryAnd: string; // "dan" / "and"
  summaryFatalLead: string;
  summaryFatalNoSell: string;
  summaryFatalExt: (names: string, implication: string) => string;
  summaryFatalExtImplDelegate: string;
  summaryFatalExtImplHook: string;
  summaryFatalExtImplFee: string;
  summaryFatalMint: string;
  summaryFatalFreeze: string;
  summaryFatalTop1: (pct: string) => string;
  summaryFatalTop10: (pct: string) => string;
  summaryFatalConsequence: string;
  summaryFatalNoSellConsequence: string;
  summaryFatalTop1Consequence: string;
  summaryCleanOpener: string;
  summaryCleanOpenerUnknown: string;
  summaryDeepLiquidity: string;
  summaryTop1Note: (pct: string) => string;
  summaryPriceReminder: string;
  summaryHoldersUnavailable: string;
  summaryMarketConsequence: string;
  summaryNoMarket: string;
  summaryNoMarketConsequence: string;
  summaryFlagTop10: (pct: string) => string;
  summaryFlagBundle: string;
  summaryFlagThinLiq: (v: string) => string;
  summaryFlagMildLiq: (v: string) => string;
  summaryFlagNewPair: string;
  summaryFlagYoungPair: (days: string) => string;
  summaryFlagLpNotBurned: (pct: string) => string;
  summaryFlagMetadataMutable: string;
  summaryFlagBonding: string;
}

export const STRINGS: Record<Lang, Dict> = {
  id: {
    tagline:
      'Cek keamanan memecoin Solana sebelum beli — skor keamanan 0–100 dalam hitungan detik.',
    pageTitle: 'RugRadar — Pemindai Keamanan Token Solana',
    fieldLabel: 'Alamat Mint Token (Solana)',
    placeholder: 'Contoh: DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    scanButton: 'Cek Token',
    scanningButton: 'Memindai…',
    tryExamples: 'Coba contoh:',
    emptyMintError: 'Tempel dulu alamat mint token Solana-nya.',
    evmError: 'Ini alamat EVM (0x…), bukan alamat Solana. Tempel alamat mint Solana.',
    invalidError:
      'Alamat tidak valid — alamat mint Solana berupa huruf/angka base58, 32–44 karakter.',
    notMintError: 'Alamat ini bukan mint token — ini alamat dompet/akun biasa.',
    mintNotFoundError:
      'Tidak ditemukan akun di alamat ini — mint belum pernah dibuat, atau alamatnya salah.',
    genericError: 'Gagal memindai token. Periksa alamat mint-nya dan coba lagi.',
    rpcErrorPrefix: 'Gagal membaca mint dari RPC Solana',
    loadingText: 'Membaca data on-chain dari Solana + data pasar dari DexScreener…',
    loadingStep1: '1/3 Membaca data mint dari Solana…',
    loadingStep2: '2/3 Menghitung konsentrasi holder…',
    loadingStep3: '3/3 Mengambil data pasar dari DexScreener…',
    howTitle: 'Cara kerja RugRadar',
    howStep1: 'Tempel alamat mint token Solana (bukan alamat dompet).',
    howStep2:
      'RugRadar membaca data on-chain + pasar: authority, holder, likuiditas.',
    howStep3: 'Dapat skor keamanan 0–100 + verdict — gratis, tanpa wallet, tanpa login.',
    verdictAman: 'Aman',
    verdictWaspada: 'Waspada',
    verdictBerisiko: 'Berisiko Tinggi',
    verdictTextAman: 'Tidak ada lampu merah besar — pemeriksaan utamanya terlihat bagus. Tetap DYOR — skor bukan jaminan.',
    verdictTextWaspada:
      'Ada beberapa hal yang perlu diperhatikan sebelum membeli. Baca detail cek di bawah.',
    verdictTextBerisiko:
      'Banyak lampu merah. Jangan beli sebelum memahami risikonya — ini bisa jadi rug pull atau token yang tidak sehat.',
    verdictTextBerisikoNoMarket:
      'Belum ada pool atau likuiditas yang terdeteksi untuk token ini. Itu bukan bukti rug pull — token bisa saja baru diluncurkan — tapi tanpa pasar, harga tidak bisa dinilai dan token sulit dijual. Tunggu sampai ada pool aktif, atau lewati saja.',
    badgePass: 'AMAN',
    badgeWarn: 'WASPADA',
    badgeFail: 'BAHAYA',
    badgeInfo: 'INFO',
    badgeUnavailable: 'TIDAK TERSEDIA',
    badgeNa: 'N/A',
    holderLow: 'RENDAH',
    holderMid: 'SEDANG',
    holderHigh: 'TINGGI',
    extraCheck: 'cek ekstra',
    points: 'poin',
    gaugeLabel: (s) => `Skor keamanan token: ${s} dari 100`,
    statsPrice: 'Harga',
    statsMarketCap: 'Market Cap',
    statsLiquidity: 'Likuiditas (pair utama)',
    statsVolume24h: 'Volume 24j (pair utama)',
    statsPriceChange24h: 'Harga 24j',
    statsTxns24h: 'Transaksi 24j',
    statsSupply: 'Total Supply',
    statsTop10: 'Top 10 Holder',
    statsGroupMarket: 'Pasar',
    statsGroupToken: 'Token',
    checksHeading: 'Detail Pemeriksaan',
    topHoldersHeading: 'Top 5 Holder',
    scannedAt: 'Dipindai',
    viewOnDexscreener: 'DexScreener',
    viewOnSolscan: 'Solscan',
    viewOnBubblemaps: 'Bubblemaps',
    lostLine: (lost, reason) => `−${lost} poin karena ${reason}`,
    safetyScoreLabel: 'Skor Keamanan',
    riskLevelLine: (level) => `Tingkat Risiko: ${level}`,
    riskLow: 'Rendah',
    riskMid: 'Sedang',
    riskHigh: 'Tinggi',
    holdersExcludedNote: (kinds) => `Tidak dihitung: ${kinds}.`,
    holdersExcludedNone: 'Termasuk akun pool likuiditas bila ada.',
    excludedPool: 'akun pool likuiditas',
    excludedBurn: 'alamat burn',
    excludedExchange: 'dompet exchange',
    clearInput: 'Bersihkan input',
    pasteInput: 'Tempel',
    pasteFailed: 'Tidak bisa membaca clipboard — tempel alamat secara manual.',
    copyAddress: 'Salin alamat mint',
    addressCopied: 'Alamat disalin ✓',
    share: 'Bagikan',
    shareTitle: 'RugRadar — hasil scan token',
    shareText: (name, symbol, score) =>
      `RugRadar: ${name} (${symbol}) — skor keamanan ${score}/100`,
    copyResult: 'Salin hasil',
    copyLink: 'Salin link',
    copied: 'Disalin ✓',
    copyFailed: 'Gagal menyalin — salin manual dari kolom alamat atau hasil di atas.',
    copySummary: (s) =>
      `RugRadar — ${s.name} (${s.symbol}): ${s.score}/100 ${s.verdict}\n${s.summary ? `${s.summary}\n` : ''}${s.checks}\nhttps://dadapy04.github.io/rugradar/?mint=${s.mint}`,
    footerScoring:
      'Cara skor keamanan dihitung (total 100): Mint Authority 20 · Freeze Authority 20 · Konsentrasi Holder 30 · Likuiditas & Pasar 30.',
    footerDisclaimer:
      'RugRadar hanya membaca data publik (Solana RPC + DexScreener). Ini bukan nasihat keuangan — selalu DYOR sebelum membeli token apa pun.',
    mint: {
      title: 'Mint Authority',
      detailRevoked: 'Sudah dicabut (revoked) — tidak ada yang bisa mencetak token baru.',
      detailActive:
        'MASIH AKTIF — pemilik bisa mencetak token baru kapan saja dan mengencerkan harga.',
      explanation:
        'Kalau mint authority masih aktif, developer bisa menambah supply seenaknya. Token yang aman biasanya sudah mencabutnya.',
    },
    freeze: {
      title: 'Freeze Authority',
      detailRevoked: 'Sudah dicabut (revoked) — tidak ada yang bisa membekukan dompet holder.',
      detailActive: 'MASIH AKTIF — pemilik bisa membekukan token di dompet siapa pun.',
      explanation:
        'Freeze authority aktif berarti ada pihak yang bisa mengunci tokenmu sehingga tidak bisa dijual. Token yang aman sudah mencabutnya.',
    },
    holdersTitle: 'Konsentrasi Holder (Top 10)',
    holdersUnavailable: 'Data holder tidak bisa diambil dari RPC saat ini.',
    holdersScoreDefault: '15/30 (nilai default — data belum terverifikasi)',
    holdersDetail: (top10, top1) =>
      `Top 10 dompet memegang ${top10} dari total supply (dompet terbesar: ${top1}).`,
    holdersExplanation:
      'Semakin kecil porsi yang dipegang segelintir dompet, semakin kecil risiko satu paus menjual besar-besaran dan menjatuhkan harga. Di atas 50% itu lampu merah.',
    liquidityTitle: 'Likuiditas & Aktivitas Pasar',
    liquidityNoPair:
      'Tidak ditemukan pool trading untuk token ini — kemungkinan belum ada pasar atau token sudah mati.',
    liquidityDexError:
      'Data pasar (DexScreener) tidak bisa diambil saat ini — cek ini dilewati.',
    liquidityDetail: (liq, vol, ageDays, dex) =>
      `Pair utama: likuiditas ${liq}, volume 24 jam ${vol}, umur pool ${ageDays} (DEX: ${dex}).`,
    liquidityExplanation:
      'Likuiditas rendah berarti harga gampang dimanipulasi dan kamu bisa sulit menjual. Pool yang sudah lama + volume harian sehat adalah tanda pasar yang hidup.',
    sellableTitle: 'Bisa Dijual (Honeypot Check)',
    sellableOk: 'Jupiter menemukan rute jual ke SOL — token ini bisa dijual di DEX.',
    sellableWarn:
      'Jupiter tidak menemukan rute jual ke SOL — kemungkinan honeypot atau token belum punya pasar yang bisa dijual.',
    sellableUnavailable:
      'Cek jual tidak bisa dijalankan saat ini (Jupiter tidak merespons) — ini bukan berarti token tidak bisa dijual, coba scan ulang.',
    sellableExplanation:
      'Cek ekstra (di luar skor 100): token honeypot bisa dibeli tapi tidak bisa dijual kembali. Kalau tidak ada rute jual, jangan beli.',
    mintLostReason: 'mint authority masih aktif',
    freezeLostReason: 'freeze authority masih aktif',
    holdersLostNoData: 'data holder belum terverifikasi — skor total dibatasi maks 79 (Waspada)',
    holdersLostDetail: (top10) => `Top 10 memegang ${top10} suplai`,
    // v7.6 — dev-bundle heuristic
    bundleTitle: 'Bundle Dev / Dompet Terkoordinasi',
    bundleOk: (buyers, share) =>
      `Tidak ada pola bundle terdeteksi pada transaksi awal (${buyers} dompet di slot peluncuran, gabungan ${share} suplai).`,
    bundleSuspected: (buyers, share) =>
      `Kemungkinan bundle dev: ${buyers} dompet berbeda membeli di slot peluncuran dengan gabungan ${share} suplai — bisa jadi satu orang yang siap dump serentak.`,
    bundleSuspectedRc: (wallets, share) =>
      `Kemungkinan bundle dev (RugCheck): satu jaringan insider berisi ${wallets} dompet masih memegang ${share} suplai — bisa jadi satu orang yang siap dump serentak.`,
    bundleOkRc: (wallets, share) =>
      `Tidak ada jaringan insider besar terdeteksi (RugCheck): jaringan terbesar berisi ${wallets} dompet dan memegang ${share} suplai.`,
    bundleSkipped:
      'Hanya dicek untuk token muda (pair < 7 hari) — token ini terlalu tua untuk pola bundle peluncuran.',
    bundleUnavailable:
      'Data transaksi awal tidak bisa dibaca — pola bundle tidak terverifikasi.',
    bundleTooDeep:
      'Riwayat transaksi token ini terlalu panjang untuk dibaca dari browser — pola bundle tidak terverifikasi, cek manual di Bubblemaps / RugCheck.',
    bundleExplanation:
      'Dev nakal menyebar suplai ke banyak dompet lewat satu Jito bundle di slot peluncuran, supaya tiap dompet terlihat kecil. Cek peta klaster di Bubblemaps / RugCheck sebelum percaya skor holder.',
    liquidityLostNoPair: 'tidak ada pool / data pasar',
    liqPartLow: (v) => `likuiditas ${v}`,
    agePartLow: (v) => `pool berumur ${v}`,
    volPartLow: (v) => `volume 24j ${v}`,
    lpTitle: 'LP Burn/Lock',
    lpBurned: (pct) =>
      `${pct} LP sudah dibakar (incinerator) — likuiditas tidak bisa ditarik dev.`,
    lpMostlySafe: (top1) =>
      `Pemegang LP terbesar yang tersisa memegang ${top1} dan maksimal hanya bisa menarik ${top1} likuiditas.`,
    lpNotBurned: (top1) =>
      `LP belum terbukti dibakar/dikunci — pemegang LP terbesar memegang ${top1} dan bisa menarik likuiditas.`,
    lpUnavailable:
      'LP tidak bisa diperiksa untuk pool ini (bukan pool Raydium atau data LP tidak bisa dibaca).',
    lpExplanation:
      'Cek ekstra (di luar skor 100): kalau LP token dibakar, developer tidak bisa menarik likuiditas dan melakukan rug pull. Kalau LP masih dipegang dompet, risikonya tetap ada.',
    metadataTitle: 'Metadata Token',
    metadataImmutable:
      'Metadata sudah dikunci (immutable) — nama, simbol, dan URI tidak bisa diubah lagi.',
    metadataMutable:
      'Metadata masih bisa diubah (mutable) — developer bisa mengganti nama, simbol, atau URI token.',
    metadataUnavailable: 'Tidak ada akun metadata / tidak bisa dibaca untuk token ini.',
    metadataExplanation:
      'Cek ekstra (di luar skor 100): metadata yang masih mutable berarti tampilan token (nama, logo, deskripsi) masih bisa diubah setelah peluncuran.',
    thousand: 'rb',
    million: 'jt',
    days: 'hari',
    unknownName: 'Tidak diketahui',
    eyebrow: 'Pemindai Keamanan Token · Solana',
    pairConvertedNote: (name, symbol) =>
      `Alamat pair terdeteksi — token dasarnya adalah ${name} (${symbol}), itu yang dipindai.`,
    pairGuidanceError:
      'Alamat ini bukan mint token (kemungkinan alamat pair/pool atau dompet), dan token dasarnya tidak bisa ditemukan di DexScreener. Tempel alamat mint token — bukan alamat pool.',
    marketCardTitle: 'Konteks Pasar',
    marketRatioLabel: 'Likuiditas / Market Cap',
    marketAgeLabel: 'Usia Pair',
    marketTotalLiquidityLabel: 'Likuiditas (total DEX)',
    marketTotalVolumeLabel: 'Volume 24j (total DEX)',
    marketTopPairNote: (v) => `pair utama: ${v}`,
    marketThinWarning: (ratio) =>
      `Likuiditas sangat tipis — hanya ${ratio} dari market cap. Harga bisa bergerak tajam dari trade kecil dan token bisa sulit dijual, meskipun mint/freeze authority sudah dicabut.`,
    txnsBuy: 'Beli',
    txnsSell: 'Jual',
    bondingCurveLabel: 'Masih di Bonding Curve — belum migrasi ke DEX',
    lpBondingCurve:
      'Token masih di bonding curve — belum ada LP tradisional, jadi cek LP burn tidak berlaku.',
    lpOrca:
      'Tidak berlaku untuk pool Orca (concentrated liquidity) — tidak ada LP token yang bisa di-burn, jadi cek ini dilewati.',
    lpMeteora:
      'Tidak berlaku untuk pool Meteora (concentrated liquidity / DLMM) — tidak ada LP token yang bisa di-burn, jadi cek ini dilewati.',
    token2022Title: 'Ekstensi Token-2022',
    token2022Standard:
      'Token SPL standar (bukan Token-2022) — tidak ada ekstensi berbahaya.',
    token2022Clean: 'Token-2022 tanpa ekstensi berbahaya yang terdeteksi.',
    token2022Found: (names) =>
      `Token-2022 dengan ekstensi berbahaya terdeteksi: ${names}.`,
    token2022Unavailable: 'Ekstensi Token-2022 tidak bisa diperiksa saat ini.',
    token2022NoPenalty: 'Tanpa penalti',
    token2022PenaltyLabel: (n) => `−${n} poin`,
    token2022Explanation:
      'Penalti skor: ekstensi Token-2022 yang berbahaya mengurangi total skor — Permanent Delegate −15 poin, Transfer Fee −10 poin, Transfer Hook −10 poin (maks −35). Permanent Delegate berarti dev bisa menarik/bakar token dari dompet holder, Transfer Fee adalah pajak yang bisa dinaikkan sepihak, dan Transfer Hook bisa dipakai untuk honeypot.',
    extPermanentDelegate: 'Permanent Delegate',
    extTransferFee: 'Transfer Fee',
    extTransferHook: 'Transfer Hook',
    recentScansTitle: 'Terakhir dipindai:',
    recentHint: 'Ketuk chip untuk memindai ulang.',
    rescan: 'Pindai Ulang',
    updatedJustNow: 'Diperbarui baru saja',
    updatedMinutes: (n) => `Diperbarui ${n} menit lalu`,
    updatedHours: (n) => `Diperbarui ${n} jam lalu`,
    methodTitle: 'Cara Kerja Skor',
    methodClose: 'Tutup',
    methodIntro:
      'RugRadar memberi skor keamanan 0–100. Semakin tinggi, semakin aman. Skor dihitung dari data publik on-chain dan pasar.',
    methodWeightsTitle: 'Bobot penilaian (total 100)',
    methodWeightMint: 'Mint Authority — 20 poin',
    methodWeightFreeze: 'Freeze Authority — 20 poin',
    methodWeightHolders: 'Konsentrasi Holder (Top 10) — 30 poin',
    methodHoldersNote:
      'Kalau data holder gagal dibaca: nilainya netral 15/30 dan skor total dibatasi maksimal 79 — tidak bisa berlabel Aman.',
    methodBundleTitle: 'Deteksi Bundle (Level 2)',
    methodBundleText:
      'Hanya untuk token muda (pair < 7 hari). Dua sinyal: heuristik RPC (≥4 dompet berbeda membeli di slot peluncuran dengan gabungan >15% suplai) dan jaringan insider RugCheck (satu jaringan memegang >15% suplai). Kalau salah satu kena, token dicurigai bundle dan skor total dibatasi maksimal 79. Bukan bukti pasti — konfirmasi di Bubblemaps / RugCheck.',
    methodWeightLiquidity: 'Likuiditas & Pasar — 30 poin',
    methodLiquidityNote:
      'Catatan: kartu konteks pasar menampilkan total likuiditas dan volume 24j dari semua pair DEX, sedangkan cek Likuiditas & Pasar yang masuk skor hanya memakai pair dengan likuiditas terbesar.',
    methodPenaltyTitle: 'Penalti Token-2022 (maks −35 poin)',
    methodPenaltyText:
      'Token dengan ekstensi Token-2022 yang berbahaya kena penalti dari total skor: Permanent Delegate −15, Transfer Fee −10, Transfer Hook −10. Token SPL standar tidak kena penalti.',
    methodBandsTitle: 'Arti skor',
    methodBandSafe: '80–100 Aman — lolos semua pemeriksaan utama.',
    methodBandCaution: '50–79 Waspada — ada hal yang perlu diperhatikan.',
    methodBandHigh: '0–49 Berisiko Tinggi — banyak lampu merah.',
    methodExclusionsTitle: 'Yang tidak dihitung sebagai whale',
    methodExclusionsText:
      'Akun pool likuiditas (terverifikasi), alamat burn, dan dompet exchange terverifikasi dikeluarkan dari hitungan Top 10 — supply itu bukan satu paus.',
    methodSourcesTitle: 'Sumber data',
    methodSourcesText:
      'Solana RPC (via proxy Cloudflare ke Helius) untuk data on-chain, DexScreener untuk data pasar, Jupiter untuk cek bisa dijual.',
    methodExtrasTitle: 'Cek ekstra (di luar skor 100)',
    methodExtrasText:
      'Bisa Dijual (Jupiter), LP Burn/Lock, dan Metadata Token — informatif, tidak menambah atau mengurangi skor. Aturan LP: pemegang LP terbesar di atas 15% = Waspada, 15% ke bawah = aman.',
    themeToDark: 'Ganti ke mode gelap',
    themeToLight: 'Ganti ke mode terang',
    // v7.4 — plain-language risk summary
    summaryBut: 'tetapi',
    summaryAnd: 'dan',
    summaryFatalLead: 'Bahaya terdeteksi:',
    summaryFatalNoSell: 'tidak ditemukan rute jual di Jupiter — token mungkin tidak bisa dijual',
    summaryFatalExt: (names, impl) => `ekstensi Token-2022 berbahaya (${names}) — ${impl}`,
    summaryFatalExtImplDelegate: 'dev bisa menarik token dari dompet holder mana pun',
    summaryFatalExtImplHook: 'transfer bisa dicegat atau diblokir',
    summaryFatalExtImplFee: 'pajak transfer bisa dinaikkan sepihak oleh dev',
    summaryFatalMint:
      'Mint Authority masih aktif — dev bisa mencetak suplai tambahan kapan saja',
    summaryFatalFreeze:
      'Freeze Authority masih aktif — dev bisa membekukan token di dompet siapa pun',
    summaryFatalTop1: (pct) => `satu dompet menguasai mayoritas suplai (${pct})`,
    summaryFatalTop10: (pct) => `10 dompet teratas menguasai ${pct} suplai`,
    summaryFatalConsequence: 'Risiko rug pull sangat tinggi.',
    summaryFatalNoSellConsequence:
      'Token yang tidak bisa dijual kembali akan membuat danamu terjebak.',
    summaryFatalTop1Consequence: 'Satu dompet bisa menjatuhkan harga kapan saja.',
    summaryCleanOpener:
      'Kontrak token bersih: dev tidak bisa mencetak token baru atau membekukan saldo',
    summaryCleanOpenerUnknown:
      'Dari data yang tersedia, tidak ada bahaya fatal yang terdeteksi pada kontrak',
    summaryDeepLiquidity: 'likuiditas pasarnya cukup dalam',
    summaryTop1Note: (pct) =>
      `Catatan: dompet terbesar memegang ${pct} suplai — cek di Solscan apakah itu dompet exchange/pool atau individu.`,
    summaryPriceReminder:
      'Ingat: skor ini menilai kontrak dan pasarnya, bukan menjamin harga akan naik.',
    summaryHoldersUnavailable:
      'Distribusi holder belum terverifikasi, jadi skor dibatasi maksimal 79 (Waspada) sampai datanya berhasil dibaca.',
    summaryMarketConsequence: 'Rentan terkena slippage besar dan dump mendadak.',
    summaryNoMarket: 'belum ada data pasar karena tidak ada pool yang terdeteksi',
    summaryNoMarketConsequence:
      'Tanpa pasar, harga token tidak bisa dinilai dan token sulit dijual.',
    summaryFlagTop10: (pct) => `10 dompet teratas menguasai ${pct} suplai`,
    summaryFlagBundle: 'kemungkinan bundle dev / jaringan insider terdeteksi',
    summaryFlagThinLiq: (v) => `likuiditasnya tipis (${v})`,
    summaryFlagMildLiq: (v) => `likuiditasnya masih tergolong kecil (${v})`,
    summaryFlagNewPair: 'token ini masih sangat baru (di bawah 24 jam)',
    summaryFlagYoungPair: (days) => `pair ini baru berumur ${days}`,
    summaryFlagLpNotBurned: (pct) =>
      `LP belum dibakar — pemegang LP terbesar memegang ${pct}`,
    summaryFlagMetadataMutable: 'metadata token masih bisa diubah dev',
    summaryFlagBonding: 'token masih di bonding curve dan belum punya LP di DEX',
  },
  en: {
    tagline:
      'Check a Solana memecoin’s safety before you buy — a 0–100 safety score in seconds.',
    pageTitle: 'RugRadar — Solana Token Safety Scanner',
    fieldLabel: 'Token Mint Address (Solana)',
    placeholder: 'Example: DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    scanButton: 'Scan Token',
    scanningButton: 'Scanning…',
    tryExamples: 'Try an example:',
    emptyMintError: 'Paste a Solana token mint address first.',
    evmError:
      'This is an EVM address (0x…), not a Solana address. Paste a Solana mint address.',
    invalidError:
      'Invalid address — a Solana mint address is base58 letters/digits, 32–44 characters.',
    notMintError: 'This address is not a token mint — it is a regular wallet/account address.',
    mintNotFoundError:
      'No account found at this address — the mint may not exist, or the address is wrong.',
    genericError: 'Failed to scan the token. Check the mint address and try again.',
    rpcErrorPrefix: 'Failed to read the mint from the Solana RPC',
    loadingText: 'Reading on-chain data from Solana + market data from DexScreener…',
    loadingStep1: '1/3 Reading mint data from Solana…',
    loadingStep2: '2/3 Computing holder concentration…',
    loadingStep3: '3/3 Fetching market data from DexScreener…',
    howTitle: 'How RugRadar works',
    howStep1: 'Paste a Solana token mint address (not a wallet address).',
    howStep2: 'RugRadar reads on-chain + market data: authorities, holders, liquidity.',
    howStep3: 'Get a 0–100 safety score + verdict — free, no wallet, no login.',
    verdictAman: 'Safe',
    verdictWaspada: 'Caution',
    verdictBerisiko: 'High Risk',
    verdictTextAman: 'No major red flags — the main checks look good. Still DYOR — a score is not a guarantee.',
    verdictTextWaspada:
      'There are a few things to watch before buying. Read the check details below.',
    verdictTextBerisiko:
      'Many red flags. Do not buy before understanding the risks — this could be a rug pull or an unhealthy token.',
    verdictTextBerisikoNoMarket:
      'No pool or liquidity was detected for this token. That is not proof of a rug pull — it may have just launched — but without a market the price cannot be assessed and the token is hard to sell. Wait for an active pool, or skip it.',
    badgePass: 'SAFE',
    badgeWarn: 'CAUTION',
    badgeFail: 'DANGER',
    badgeInfo: 'INFO',
    badgeUnavailable: 'UNAVAILABLE',
    badgeNa: 'N/A',
    holderLow: 'LOW',
    holderMid: 'MEDIUM',
    holderHigh: 'HIGH',
    extraCheck: 'extra check',
    points: 'pts',
    gaugeLabel: (s) => `Token safety score: ${s} out of 100`,
    statsPrice: 'Price',
    statsMarketCap: 'Market Cap',
    statsLiquidity: 'Liquidity (primary pair)',
    statsVolume24h: 'Volume 24h (primary pair)',
    statsPriceChange24h: 'Price 24h',
    statsTxns24h: 'Txns 24h',
    statsSupply: 'Total Supply',
    statsTop10: 'Top 10 Holders',
    statsGroupMarket: 'Market',
    statsGroupToken: 'Token',
    checksHeading: 'Check Details',
    topHoldersHeading: 'Top 5 Holders',
    scannedAt: 'Scanned',
    viewOnDexscreener: 'DexScreener',
    viewOnSolscan: 'Solscan',
    viewOnBubblemaps: 'Bubblemaps',
    lostLine: (lost, reason) => `−${lost} pts: ${reason}`,
    safetyScoreLabel: 'Safety Score',
    riskLevelLine: (level) => `Risk Level: ${level}`,
    riskLow: 'Low',
    riskMid: 'Medium',
    riskHigh: 'High',
    holdersExcludedNote: (kinds) => `Excluded: ${kinds}.`,
    holdersExcludedNone: 'Includes the liquidity-pool account if present.',
    excludedPool: 'liquidity-pool account',
    excludedBurn: 'burn address',
    excludedExchange: 'exchange wallets',
    clearInput: 'Clear input',
    pasteInput: 'Paste',
    pasteFailed: 'Could not read the clipboard — paste the address manually.',
    copyAddress: 'Copy mint address',
    addressCopied: 'Address copied ✓',
    share: 'Share',
    shareTitle: 'RugRadar — token scan result',
    shareText: (name, symbol, score) =>
      `RugRadar: ${name} (${symbol}) — safety score ${score}/100`,
    copyResult: 'Copy result',
    copyLink: 'Copy link',
    copied: 'Copied ✓',
    copyFailed: 'Copy failed — copy manually from the address or result above.',
    copySummary: (s) =>
      `RugRadar — ${s.name} (${s.symbol}): ${s.score}/100 ${s.verdict}\n${s.summary ? `${s.summary}\n` : ''}${s.checks}\nhttps://dadapy04.github.io/rugradar/?mint=${s.mint}`,
    footerScoring:
      'How the safety score works (total 100): Mint Authority 20 · Freeze Authority 20 · Holder Concentration 30 · Liquidity & Market 30.',
    footerDisclaimer:
      'RugRadar only reads public data (Solana RPC + DexScreener). This is not financial advice — always DYOR before buying any token.',
    mint: {
      title: 'Mint Authority',
      detailRevoked: 'Already revoked — nobody can mint new tokens.',
      detailActive:
        'STILL ACTIVE — the owner can mint new tokens at any time and dilute the price.',
      explanation:
        'If the mint authority is still active, the developer can increase the supply at will. Safe tokens usually have it revoked.',
    },
    freeze: {
      title: 'Freeze Authority',
      detailRevoked: 'Already revoked — nobody can freeze holder wallets.',
      detailActive: 'STILL ACTIVE — the owner can freeze the tokens in anyone’s wallet.',
      explanation:
        'An active freeze authority means someone can lock your tokens so you cannot sell them. Safe tokens have it revoked.',
    },
    holdersTitle: 'Holder Concentration (Top 10)',
    holdersUnavailable: 'Holder data could not be fetched from the RPC right now.',
    holdersScoreDefault: '15/30 (neutral default — data unverified)',
    holdersDetail: (top10, top1) =>
      `The top 10 wallets hold ${top10} of total supply (largest wallet: ${top1}).`,
    holdersExplanation:
      'The smaller the share held by a few wallets, the lower the risk of one whale dumping and crashing the price. Above 50% is a red flag.',
    liquidityTitle: 'Liquidity & Market Activity',
    liquidityNoPair:
      'No trading pool found for this token — it may have no market yet or the token is dead.',
    liquidityDexError:
      'Market data (DexScreener) could not be fetched right now — this check was skipped.',
    liquidityDetail: (liq, vol, ageDays, dex) =>
      `Primary pair: liquidity ${liq}, 24h volume ${vol}, pool age ${ageDays} (DEX: ${dex}).`,
    liquidityExplanation:
      'Low liquidity means the price is easy to manipulate and you may struggle to sell. An old pool plus healthy daily volume is a sign of a live market.',
    sellableTitle: 'Sellable (Honeypot Check)',
    sellableOk: 'Jupiter found a sell route to SOL — this token can be sold on a DEX.',
    sellableWarn:
      'Jupiter found no sell route to SOL — possible honeypot, or the token has no sellable market yet.',
    sellableUnavailable:
      'The sell check could not run right now (Jupiter did not respond) — this does not mean the token cannot be sold, try scanning again.',
    sellableExplanation:
      'Extra check (outside the 100-point score): honeypot tokens can be bought but not sold back. If there is no sell route, do not buy.',
    mintLostReason: 'mint authority is still active',
    freezeLostReason: 'freeze authority is still active',
    holdersLostNoData: 'holder data unverified — total score capped at 79 (Caution)',
    holdersLostDetail: (top10) => `Top 10 hold ${top10} of supply`,
    // v7.6 — dev-bundle heuristic
    bundleTitle: 'Dev Bundle / Coordinated Wallets',
    bundleOk: (buyers, share) =>
      `No bundle pattern detected in early transactions (${buyers} wallets in the launch slot, combined ${share} of supply).`,
    bundleSuspected: (buyers, share) =>
      `Possible dev bundle: ${buyers} different wallets bought in the launch slot with a combined ${share} of supply — possibly one person ready to dump together.`,
    bundleSuspectedRc: (wallets, share) =>
      `Possible dev bundle (RugCheck): one insider network of ${wallets} wallets still holds ${share} of supply — possibly one person ready to dump together.`,
    bundleOkRc: (wallets, share) =>
      `No large insider network detected (RugCheck): the largest network holds ${share} of supply across ${wallets} wallets.`,
    bundleSkipped:
      'Only checked for young tokens (pair < 7 days) — this token is too old for a launch-bundle pattern.',
    bundleUnavailable:
      'Early transaction data could not be read — bundle pattern unverified.',
    bundleTooDeep:
      'This token has too much transaction history to read from the browser — bundle pattern unverified, check manually on Bubblemaps / RugCheck.',
    bundleExplanation:
      'Rogue devs spread supply across many wallets via a single Jito bundle in the launch slot, so each wallet looks small. Check the cluster map on Bubblemaps / RugCheck before trusting the holder score.',
    liquidityLostNoPair: 'no pool or market data',
    liqPartLow: (v) => `liquidity ${v}`,
    agePartLow: (v) => `pool age ${v}`,
    volPartLow: (v) => `24h volume ${v}`,
    lpTitle: 'LP Burn/Lock',
    lpBurned: (pct) =>
      `${pct} of LP tokens are burned (incinerator) — the dev cannot pull the liquidity.`,
    lpMostlySafe: (top1) =>
      `The largest remaining LP holder owns ${top1} and could pull at most ${top1} of liquidity.`,
    lpNotBurned: (top1) =>
      `LP is not proven burned or locked — the largest LP holder owns ${top1} and could pull the liquidity.`,
    lpUnavailable:
      'LP cannot be checked for this pool (not a Raydium pool, or LP data could not be read).',
    lpExplanation:
      'Extra check (outside the 100-point score): when LP tokens are burned, the developer cannot withdraw the liquidity and rug. If LP is still held by a wallet, the risk remains.',
    metadataTitle: 'Token Metadata',
    metadataImmutable:
      'Metadata is locked (immutable) — name, symbol, and URI cannot be changed.',
    metadataMutable:
      'Metadata is still mutable — the developer can change the token name, symbol, or URI.',
    metadataUnavailable: 'No metadata account / unreadable metadata for this token.',
    metadataExplanation:
      'Extra check (outside the 100-point score): mutable metadata means the token’s display (name, logo, description) can still be changed after launch.',
    thousand: 'K',
    million: 'M',
    days: 'days',
    unknownName: 'Unknown',
    eyebrow: 'Token Safety Scanner · Solana',
    pairConvertedNote: (name, symbol) =>
      `Pair address detected — its base token is ${name} (${symbol}), which is what was scanned.`,
    pairGuidanceError:
      'This address is not a token mint (it may be a pair/pool or wallet address), and its base token could not be found on DexScreener. Paste the token mint address — not a pool address.',
    marketCardTitle: 'Market Context',
    marketRatioLabel: 'Liquidity / Market Cap',
    marketAgeLabel: 'Pair Age',
    marketTotalLiquidityLabel: 'Liquidity (total DEX)',
    marketTotalVolumeLabel: 'Volume 24h (total DEX)',
    marketTopPairNote: (v) => `primary pair: ${v}`,
    marketThinWarning: (ratio) =>
      `Very thin liquidity — only ${ratio} of market cap. The price can move sharply on small trades and the token may be hard to sell, even with mint/freeze authority revoked.`,
    txnsBuy: 'Buy',
    txnsSell: 'Sell',
    bondingCurveLabel: 'Still on the Bonding Curve — not yet migrated to a DEX',
    lpBondingCurve:
      'This token is still on the bonding curve — there is no traditional LP yet, so the LP burn check does not apply.',
    lpOrca:
      'Not applicable to Orca pools (concentrated liquidity) — there is no LP token to burn, so this check is skipped.',
    lpMeteora:
      'Not applicable to Meteora pools (concentrated liquidity / DLMM) — there is no LP token to burn, so this check is skipped.',
    token2022Title: 'Token-2022 Extensions',
    token2022Standard:
      'Standard SPL token (not Token-2022) — no dangerous extensions.',
    token2022Clean: 'Token-2022 with no dangerous extensions detected.',
    token2022Found: (names) =>
      `Token-2022 with dangerous extensions detected: ${names}.`,
    token2022Unavailable: 'Token-2022 extensions could not be checked right now.',
    token2022NoPenalty: 'No penalty',
    token2022PenaltyLabel: (n) => `−${n} pts`,
    token2022Explanation:
      'Score penalty: dangerous Token-2022 extensions subtract from the total score — Permanent Delegate −15 pts, Transfer Fee −10 pts, Transfer Hook −10 pts (max −35). Permanent Delegate lets the dev pull/burn tokens from holder wallets, Transfer Fee is a tax that can be raised unilaterally, and Transfer Hook can be used for honeypots.',
    extPermanentDelegate: 'Permanent Delegate',
    extTransferFee: 'Transfer Fee',
    extTransferHook: 'Transfer Hook',
    recentScansTitle: 'Recently scanned:',
    recentHint: 'Tap a chip to rescan.',
    rescan: 'Rescan',
    updatedJustNow: 'Updated just now',
    updatedMinutes: (n) => `Updated ${n} min ago`,
    updatedHours: (n) => `Updated ${n} hr ago`,
    methodTitle: 'How the Score Works',
    methodClose: 'Close',
    methodIntro:
      'RugRadar gives a 0–100 safety score. Higher is safer. The score is computed from public on-chain and market data.',
    methodWeightsTitle: 'Score weights (total 100)',
    methodWeightMint: 'Mint Authority — 20 pts',
    methodWeightFreeze: 'Freeze Authority — 20 pts',
    methodWeightHolders: 'Holder Concentration (Top 10) — 30 pts',
    methodHoldersNote:
      'If holder data cannot be read: it scores a neutral 15/30 and the total is capped at 79 — never Safe.',
    methodBundleTitle: 'Bundle Detection (Level 2)',
    methodBundleText:
      'Only for young tokens (pair < 7 days). Two signals: the RPC heuristic (≥4 different wallets bought in the launch slot with a combined >15% of supply) and RugCheck insider networks (one network holding >15% of supply). If either fires, the token is flagged as a possible bundle and the total is capped at 79. Not proof — confirm on Bubblemaps / RugCheck.',
    methodWeightLiquidity: 'Liquidity & Market — 30 pts',
    methodLiquidityNote:
      'Note: the market card shows total liquidity and 24h volume summed across all DEX pairs, while the scored Liquidity & Market check only uses the single highest-liquidity pair.',
    methodPenaltyTitle: 'Token-2022 penalty (max −35 pts)',
    methodPenaltyText:
      'Tokens with dangerous Token-2022 extensions lose points from the total score: Permanent Delegate −15, Transfer Fee −10, Transfer Hook −10. Standard SPL tokens are not penalized.',
    methodBandsTitle: 'What the score means',
    methodBandSafe: '80–100 Safe — passed all main checks.',
    methodBandCaution: '50–79 Caution — things to watch.',
    methodBandHigh: '0–49 High Risk — many red flags.',
    methodExclusionsTitle: 'What is not counted as a whale',
    methodExclusionsText:
      'Verified liquidity-pool accounts, the burn address, and verified exchange wallets are excluded from the Top 10 — that supply is not a single whale.',
    methodSourcesTitle: 'Data sources',
    methodSourcesText:
      'Solana RPC (via the Cloudflare proxy to Helius) for on-chain data, DexScreener for market data, Jupiter for the sellability check.',
    methodExtrasTitle: 'Extra checks (outside the 100-point score)',
    methodExtrasText:
      'Sellable (Jupiter), LP Burn/Lock, and Token Metadata — informational, they do not add or subtract points. LP rule: largest LP holder above 15% = Caution, 15% or below = safe.',
    themeToDark: 'Switch to dark mode',
    themeToLight: 'Switch to light mode',
    // v7.4 — plain-language risk summary
    summaryBut: 'but',
    summaryAnd: 'and',
    summaryFatalLead: 'Danger detected:',
    summaryFatalNoSell: 'no sell route found on Jupiter — the token may not be sellable',
    summaryFatalExt: (names, impl) => `dangerous Token-2022 extensions (${names}) — ${impl}`,
    summaryFatalExtImplDelegate: 'the dev can pull tokens from any holder wallet',
    summaryFatalExtImplHook: 'transfers can be intercepted or blocked',
    summaryFatalExtImplFee: 'the transfer tax can be raised unilaterally by the dev',
    summaryFatalMint:
      'Mint Authority is still active — the dev can mint extra supply at any time',
    summaryFatalFreeze:
      'Freeze Authority is still active — the dev can freeze tokens in anyone’s wallet',
    summaryFatalTop1: (pct) => `a single wallet controls the majority of supply (${pct})`,
    summaryFatalTop10: (pct) => `the top 10 wallets control ${pct} of supply`,
    summaryFatalConsequence: 'Rug-pull risk is very high.',
    summaryFatalNoSellConsequence: 'A token that cannot be sold back traps your funds.',
    summaryFatalTop1Consequence: 'A single wallet could crash the price at any time.',
    summaryCleanOpener:
      'Clean contract: the dev cannot mint new tokens or freeze balances',
    summaryCleanOpenerUnknown:
      'From the available data, no fatal danger was detected in the contract',
    summaryDeepLiquidity: 'market liquidity is deep enough',
    summaryTop1Note: (pct) =>
      `Note: the largest wallet holds ${pct} of supply — check on Solscan whether it is an exchange/pool wallet or an individual.`,
    summaryPriceReminder:
      'Remember: this score rates the contract and the market — it does not guarantee the price will go up.',
    summaryHoldersUnavailable:
      'Holder distribution is unverified, so the score is capped at 79 (Caution) until the data can be read.',
    summaryMarketConsequence: 'Vulnerable to large slippage and sudden dumps.',
    summaryNoMarket: 'there is no market data yet because no pool was detected',
    summaryNoMarketConsequence:
      'Without a market, the token price cannot be assessed and the token is hard to sell.',
    summaryFlagTop10: (pct) => `the top 10 wallets control ${pct} of supply`,
    summaryFlagBundle: 'a possible dev bundle / insider network was detected',
    summaryFlagThinLiq: (v) => `liquidity is thin (${v})`,
    summaryFlagMildLiq: (v) => `liquidity is still small (${v})`,
    summaryFlagNewPair: 'this token is still very new (under 24 hours)',
    summaryFlagYoungPair: (days) => `this pair is only ${days} old`,
    summaryFlagLpNotBurned: (pct) =>
      `LP is not burned — the largest LP holder owns ${pct}`,
    summaryFlagMetadataMutable: 'the token metadata can still be changed by the dev',
    summaryFlagBonding: 'the token is still on the bonding curve and has no DEX LP yet',
  },
  zh,
  es,
  pt,
  ru,
  vi,
};
