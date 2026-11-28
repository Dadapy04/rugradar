import type { Dict } from './i18n';

export const vi: Dict = {
  tagline:
    'Kiểm tra độ an toàn của memecoin Solana trước khi mua — điểm an toàn 0–100 chỉ trong vài giây.',
  pageTitle: 'RugRadar — Trình Quét An Toàn Token Solana',
  fieldLabel: 'Địa Chỉ Mint Token (Solana)',
  placeholder: 'Ví dụ: DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  scanButton: 'Quét Token',
  scanningButton: 'Đang quét…',
  tryExamples: 'Thử ví dụ:',
  emptyMintError: 'Hãy dán địa chỉ mint token Solana trước.',
  evmError:
    'Đây là địa chỉ EVM (0x…), không phải địa chỉ Solana. Hãy dán địa chỉ mint Solana.',
  invalidError:
    'Địa chỉ không hợp lệ — địa chỉ mint Solana gồm ký tự base58, dài 32–44 ký tự.',
  notMintError: 'Địa chỉ này không phải mint token — đây là địa chỉ ví/tài khoản thông thường.',
  mintNotFoundError:
    'Không tìm thấy tài khoản tại địa chỉ này — mint có thể chưa tồn tại, hoặc địa chỉ bị sai.',
  genericError: 'Không quét được token. Kiểm tra lại địa chỉ mint rồi thử lại.',
  rpcErrorPrefix: 'Không đọc được mint từ Solana RPC',
  loadingText: 'Đang đọc dữ liệu on-chain từ Solana + dữ liệu thị trường từ DexScreener…',
  loadingStep1: '1/3 Đang đọc dữ liệu mint từ Solana…',
  loadingStep2: '2/3 Đang tính mức độ tập trung holder…',
  loadingStep3: '3/3 Đang lấy dữ liệu thị trường từ DexScreener…',
  howTitle: 'RugRadar hoạt động như thế nào',
  howStep1: 'Dán địa chỉ mint token Solana (không phải địa chỉ ví).',
  howStep2: 'RugRadar đọc dữ liệu on-chain + thị trường: quyền hạn, holder, thanh khoản.',
  howStep3: 'Nhận điểm an toàn 0–100 + kết luận — miễn phí, không cần ví, không cần đăng nhập.',
  verdictAman: 'An toàn',
  verdictWaspada: 'Thận trọng',
  verdictBerisiko: 'Rủi ro cao',
  verdictTextAman: 'Không có dấu hiệu nguy hiểm lớn — các kiểm tra chính đều tốt. Hãy DYOR — điểm số không phải là bảo đảm.',
  verdictTextWaspada:
    'Có một vài điểm cần lưu ý trước khi mua. Hãy đọc chi tiết các kiểm tra bên dưới.',
  verdictTextBerisiko:
    'Có nhiều dấu hiệu nguy hiểm. Đừng mua trước khi hiểu rõ rủi ro — đây có thể là rug pull hoặc token không lành mạnh.',
  verdictTextBerisikoNoMarket:
    'Không phát hiện pool hay thanh khoản nào cho token này. Đó không phải bằng chứng rug pull — token có thể vừa mới ra mắt — nhưng không có thị trường thì không thể định giá và token rất khó bán. Hãy đợi pool hoạt động, hoặc bỏ qua.',
  badgePass: 'AN TOÀN',
  badgeWarn: 'THẬN TRỌNG',
  badgeFail: 'NGUY HIỂM',
  badgeInfo: 'THÔNG TIN',
  badgeUnavailable: 'KHÔNG CÓ SẴN',
  badgeNa: 'N/A',
  holderLow: 'THẤP',
  holderMid: 'TRUNG BÌNH',
  holderHigh: 'CAO',
  extraCheck: 'kiểm tra bổ sung',
  points: 'điểm',
  gaugeLabel: (s) => `Điểm an toàn của token: ${s} trên 100`,
  statsPrice: 'Giá',
  statsMarketCap: 'Vốn Hóa Thị Trường',
  statsLiquidity: 'Thanh Khoản (cặp chính)',
  statsVolume24h: 'Khối Lượng 24h (cặp chính)',
  statsPriceChange24h: 'Giá 24h',
  statsTxns24h: 'Giao Dịch 24h',
  statsSupply: 'Tổng Cung',
  statsTop10: 'Top 10 Holder',
  statsGroupMarket: 'Thị Trường',
  statsGroupToken: 'Token',
  checksHeading: 'Chi Tiết Kiểm Tra',
  topHoldersHeading: 'Top 5 Holder',
  scannedAt: 'Đã quét',
  viewOnDexscreener: 'DexScreener',
  viewOnSolscan: 'Solscan',
  viewOnBubblemaps: 'Bubblemaps',
  lostLine: (lost, reason) => `−${lost} điểm: ${reason}`,
  safetyScoreLabel: 'Điểm An Toàn',
  riskLevelLine: (level) => `Mức Rủi Ro: ${level}`,
  riskLow: 'Thấp',
  riskMid: 'Trung bình',
  riskHigh: 'Cao',
  holdersExcludedNote: (kinds) => `Không tính: ${kinds}.`,
  holdersExcludedNone: 'Bao gồm tài khoản pool thanh khoản nếu có.',
  excludedPool: 'tài khoản pool thanh khoản',
  excludedBurn: 'địa chỉ burn',
  excludedExchange: 'ví sàn giao dịch',
  clearInput: 'Xóa nội dung',
  pasteInput: 'Dán',
  pasteFailed: 'Không đọc được clipboard — hãy dán địa chỉ thủ công.',
  copyAddress: 'Sao chép địa chỉ mint',
  addressCopied: 'Đã sao chép địa chỉ ✓',
  share: 'Chia sẻ',
  shareTitle: 'RugRadar — kết quả quét token',
  shareText: (name, symbol, score) =>
    `RugRadar: ${name} (${symbol}) — điểm an toàn ${score}/100`,
  copyResult: 'Sao chép kết quả',
  copyLink: 'Sao chép liên kết',
  copied: 'Đã sao chép ✓',
  copyFailed: 'Sao chép thất bại — hãy sao chép thủ công từ ô địa chỉ hoặc kết quả phía trên.',
  copySummary: (s) =>
    `RugRadar — ${s.name} (${s.symbol}): ${s.score}/100 ${s.verdict}\n${s.summary ? `${s.summary}\n` : ''}${s.checks}\nhttps://dadapy04.github.io/rugradar/?mint=${s.mint}`,
  footerScoring:
    'Cách tính điểm an toàn (tổng 100): Mint Authority 20 · Freeze Authority 20 · Mức Độ Tập Trung Holder 30 · Thanh Khoản & Thị Trường 30.',
  footerDisclaimer:
    'RugRadar chỉ đọc dữ liệu công khai (Solana RPC + DexScreener). Đây không phải lời khuyên tài chính — hãy luôn DYOR trước khi mua bất kỳ token nào.',
  mint: {
    title: 'Mint Authority',
    detailRevoked: 'Đã thu hồi — không ai có thể mint thêm token mới.',
    detailActive:
      'VẪN ĐANG HOẠT ĐỘNG — chủ sở hữu có thể mint thêm token bất cứ lúc nào và làm loãng giá.',
    explanation:
      'Nếu mint authority vẫn còn hoạt động, dev có thể tăng nguồn cung tùy ý. Token an toàn thường đã thu hồi quyền này.',
  },
  freeze: {
    title: 'Freeze Authority',
    detailRevoked: 'Đã thu hồi — không ai có thể đóng băng ví của holder.',
    detailActive: 'VẪN ĐANG HOẠT ĐỘNG — chủ sở hữu có thể đóng băng token trong ví của bất kỳ ai.',
    explanation:
      'Freeze authority đang hoạt động nghĩa là có người có thể khóa token của bạn khiến bạn không thể bán. Token an toàn đã thu hồi quyền này.',
  },
  holdersTitle: 'Mức Độ Tập Trung Holder (Top 10)',
  holdersUnavailable: 'Không lấy được dữ liệu holder từ RPC lúc này.',
  holdersScoreDefault: '15/30 (mặc định trung lập — dữ liệu chưa xác minh)',
  holdersDetail: (top10, top1) =>
    `Top 10 ví nắm giữ ${top10} tổng cung (ví lớn nhất: ${top1}).`,
  holdersExplanation:
    'Tỷ lệ nắm giữ bởi một vài ví càng nhỏ thì nguy cơ một cá voi xả hàng làm sập giá càng thấp. Trên 50% là dấu hiệu nguy hiểm.',
  liquidityTitle: 'Thanh Khoản & Hoạt Động Thị Trường',
  liquidityNoPair:
    'Không tìm thấy pool giao dịch cho token này — có thể chưa có thị trường hoặc token đã chết.',
  liquidityDexError:
    'Không lấy được dữ liệu thị trường (DexScreener) lúc này — kiểm tra này đã được bỏ qua.',
  liquidityDetail: (liq, vol, ageDays, dex) =>
    `Cặp chính: thanh khoản ${liq}, khối lượng 24 giờ ${vol}, tuổi pool ${ageDays} (DEX: ${dex}).`,
  liquidityExplanation:
    'Thanh khoản thấp nghĩa là giá dễ bị thao túng và bạn có thể khó bán. Pool đã tồn tại lâu cộng với khối lượng giao dịch hàng ngày tốt là dấu hiệu của một thị trường đang sống.',
  sellableTitle: 'Có Bán Được Không (Kiểm Tra Honeypot)',
  sellableOk: 'Jupiter đã tìm thấy đường bán sang SOL — token này có thể bán trên DEX.',
  sellableWarn:
    'Jupiter không tìm thấy đường bán sang SOL — có thể là honeypot, hoặc token chưa có thị trường để bán.',
  sellableUnavailable:
    'Không chạy được kiểm tra bán lúc này (Jupiter không phản hồi) — điều này không có nghĩa là token không bán được, hãy thử quét lại.',
  sellableExplanation:
    'Kiểm tra bổ sung (ngoài thang điểm 100): token honeypot mua được nhưng không bán lại được. Nếu không có đường bán, đừng mua.',
  mintLostReason: 'mint authority vẫn đang hoạt động',
  freezeLostReason: 'freeze authority vẫn đang hoạt động',
  holdersLostNoData: 'dữ liệu holder chưa xác minh — tổng điểm giới hạn tối đa 79 (Thận trọng)',
  holdersLostDetail: (top10) => `Top 10 nắm giữ ${top10} nguồn cung`,
  // v7.6 — dev-bundle heuristic
  bundleTitle: 'Bundle Dev / Ví Phối Hợp',
  bundleOk: (buyers, share) =>
    `Không phát hiện mẫu bundle trong các giao dịch đầu (${buyers} ví ở slot ra mắt, tổng cộng ${share} nguồn cung).`,
  bundleSuspected: (buyers, share) =>
    `Có thể là bundle dev: ${buyers} ví khác nhau đã mua ở slot ra mắt với tổng cộng ${share} nguồn cung — có thể là một người chuẩn bị xả cùng lúc.`,
  bundleSuspectedRc: (wallets, share) =>
    `Có thể là bundle dev (RugCheck): một mạng lưới insider gồm ${wallets} ví vẫn nắm giữ ${share} nguồn cung — có thể là một người chuẩn bị xả cùng lúc.`,
  bundleOkRc: (wallets, share) =>
    `Không phát hiện mạng lưới insider lớn (RugCheck): mạng lưới lớn nhất nắm giữ ${share} nguồn cung trên ${wallets} ví.`,
  bundleSkipped:
    'Chỉ kiểm tra với token trẻ (cặp < 7 ngày) — token này quá cũ để có mẫu bundle lúc ra mắt.',
  bundleUnavailable:
    'Không đọc được dữ liệu giao dịch đầu — mẫu bundle chưa xác minh.',
  bundleTooDeep:
    'Token này có quá nhiều lịch sử giao dịch để đọc từ trình duyệt — mẫu bundle chưa xác minh, hãy kiểm tra thủ công trên Bubblemaps / RugCheck.',
  bundleExplanation:
    'Dev xấu chia nguồn cung ra nhiều ví qua một Jito Bundle duy nhất ở slot ra mắt, để mỗi ví trông nhỏ. Hãy xem bản đồ cụm ví trên Bubblemaps / RugCheck trước khi tin điểm holder.',
  liquidityLostNoPair: 'không có pool hay dữ liệu thị trường',
  liqPartLow: (v) => `thanh khoản ${v}`,
  agePartLow: (v) => `tuổi pool ${v}`,
  volPartLow: (v) => `khối lượng 24h ${v}`,
  lpTitle: 'LP Burn/Lock',
  lpBurned: (pct) =>
    `${pct} LP đã bị burn (incinerator) — dev không thể rút thanh khoản.`,
  lpMostlySafe: (top1) =>
    `Holder LP còn lại lớn nhất nắm ${top1} và tối đa chỉ có thể rút ${top1} thanh khoản.`,
  lpNotBurned: (top1) =>
    `LP chưa được chứng minh là đã burn hoặc khóa — holder LP lớn nhất nắm ${top1} và có thể rút thanh khoản.`,
  lpUnavailable:
    'Không kiểm tra được LP cho pool này (không phải pool Raydium, hoặc không đọc được dữ liệu LP).',
  lpExplanation:
    'Kiểm tra bổ sung (ngoài thang điểm 100): khi LP token bị burn, dev không thể rút thanh khoản và rug. Nếu LP vẫn do một ví nắm giữ, rủi ro vẫn còn.',
  metadataTitle: 'Metadata Token',
  metadataImmutable:
    'Metadata đã bị khóa (immutable) — tên, ký hiệu và URI không thể thay đổi nữa.',
  metadataMutable:
    'Metadata vẫn có thể thay đổi (mutable) — dev có thể đổi tên, ký hiệu hoặc URI của token.',
  metadataUnavailable: 'Không có tài khoản metadata / không đọc được metadata của token này.',
  metadataExplanation:
    'Kiểm tra bổ sung (ngoài thang điểm 100): metadata còn mutable nghĩa là phần hiển thị của token (tên, logo, mô tả) vẫn có thể bị đổi sau khi ra mắt.',
  thousand: 'N',
  million: 'Tr',
  days: 'ngày',
  unknownName: 'Không rõ',
  eyebrow: 'Trình Quét An Toàn Token · Solana',
  pairConvertedNote: (name, symbol) =>
    `Đã phát hiện địa chỉ pair — token gốc là ${name} (${symbol}), đó là token đã được quét.`,
  pairGuidanceError:
    'Địa chỉ này không phải mint token (có thể là địa chỉ pair/pool hoặc ví), và không tìm thấy token gốc của nó trên DexScreener. Hãy dán địa chỉ mint token — không phải địa chỉ pool.',
  marketCardTitle: 'Bối Cảnh Thị Trường',
  marketRatioLabel: 'Thanh Khoản / Vốn Hóa',
  marketAgeLabel: 'Tuổi Cặp',
  marketTotalLiquidityLabel: 'Thanh Khoản (tổng DEX)',
  marketTotalVolumeLabel: 'Khối Lượng 24h (tổng DEX)',
  marketTopPairNote: (v) => `cặp chính: ${v}`,
  marketThinWarning: (ratio) =>
    `Thanh khoản rất mỏng — chỉ ${ratio} vốn hóa thị trường. Giá có thể biến động mạnh chỉ với giao dịch nhỏ và token có thể khó bán, dù mint/freeze authority đã bị thu hồi.`,
  txnsBuy: 'Mua',
  txnsSell: 'Bán',
  bondingCurveLabel: 'Vẫn Đang Trên Bonding Curve — chưa migrate sang DEX',
  lpBondingCurve:
    'Token vẫn đang trên bonding curve — chưa có LP truyền thống, nên kiểm tra burn LP không áp dụng.',
  lpOrca:
    'Không áp dụng cho pool Orca (concentrated liquidity) — không có LP token để burn, nên kiểm tra này được bỏ qua.',
  lpMeteora:
    'Không áp dụng cho pool Meteora (concentrated liquidity / DLMM) — không có LP token để burn, nên kiểm tra này được bỏ qua.',
  token2022Title: 'Mở Rộng Token-2022',
  token2022Standard:
    'Token SPL chuẩn (không phải Token-2022) — không có mở rộng nguy hiểm.',
  token2022Clean: 'Token-2022 không phát hiện mở rộng nguy hiểm.',
  token2022Found: (names) =>
    `Token-2022 phát hiện mở rộng nguy hiểm: ${names}.`,
  token2022Unavailable: 'Không kiểm tra được mở rộng Token-2022 lúc này.',
  token2022NoPenalty: 'Không bị trừ điểm',
  token2022PenaltyLabel: (n) => `−${n} điểm`,
  token2022Explanation:
    'Hình phạt điểm: mở rộng Token-2022 nguy hiểm sẽ trừ vào tổng điểm — Permanent Delegate −15 điểm, Transfer Fee −10 điểm, Transfer Hook −10 điểm (tối đa −35). Permanent Delegate cho phép dev rút/burn token từ ví holder, Transfer Fee là loại thuế có thể tăng đơn phương, và Transfer Hook có thể dùng cho honeypot.',
  extPermanentDelegate: 'Permanent Delegate',
  extTransferFee: 'Transfer Fee',
  extTransferHook: 'Transfer Hook',
  recentScansTitle: 'Đã quét gần đây:',
  recentHint: 'Chạm vào chip để quét lại.',
  rescan: 'Quét Lại',
  updatedJustNow: 'Cập nhật vừa xong',
  updatedMinutes: (n) => `Cập nhật ${n} phút trước`,
  updatedHours: (n) => `Cập nhật ${n} giờ trước`,
  methodTitle: 'Cách Tính Điểm',
  methodClose: 'Đóng',
  methodIntro:
    'RugRadar cho điểm an toàn 0–100. Càng cao càng an toàn. Điểm được tính từ dữ liệu on-chain và thị trường công khai.',
  methodWeightsTitle: 'Trọng số điểm (tổng 100)',
  methodWeightMint: 'Mint Authority — 20 điểm',
  methodWeightFreeze: 'Freeze Authority — 20 điểm',
  methodWeightHolders: 'Mức Độ Tập Trung Holder (Top 10) — 30 điểm',
  methodHoldersNote:
    'Nếu không đọc được dữ liệu holder: điểm mặc định trung lập 15/30 và tổng điểm bị giới hạn tối đa 79 — không thể đạt mức An toàn.',
  methodBundleTitle: 'Phát Hiện Bundle (Cấp 2)',
  methodBundleText:
    'Chỉ áp dụng cho token trẻ (cặp < 7 ngày). Hai tín hiệu: heuristic RPC (≥4 ví khác nhau mua ở slot ra mắt với tổng cộng >15% nguồn cung) và mạng lưới insider RugCheck (một mạng lưới nắm giữ >15% nguồn cung). Nếu một trong hai kích hoạt, token bị gắn cờ là có thể bundle và tổng điểm bị giới hạn tối đa 79. Không phải bằng chứng chắc chắn — hãy xác nhận trên Bubblemaps / RugCheck.',
  methodWeightLiquidity: 'Thanh Khoản & Thị Trường — 30 điểm',
  methodLiquidityNote:
    'Lưu ý: thẻ bối cảnh thị trường hiển thị tổng thanh khoản và khối lượng 24h cộng dồn từ mọi cặp DEX, trong khi kiểm tra Thanh Khoản & Thị Trường có tính điểm chỉ dùng cặp có thanh khoản cao nhất.',
  methodPenaltyTitle: 'Hình phạt Token-2022 (tối đa −35 điểm)',
  methodPenaltyText:
    'Token có mở rộng Token-2022 nguy hiểm bị trừ điểm khỏi tổng điểm: Permanent Delegate −15, Transfer Fee −10, Transfer Hook −10. Token SPL chuẩn không bị trừ điểm.',
  methodBandsTitle: 'Ý nghĩa của điểm số',
  methodBandSafe: '80–100 An toàn — vượt qua mọi kiểm tra chính.',
  methodBandCaution: '50–79 Thận trọng — có điểm cần lưu ý.',
  methodBandHigh: '0–49 Rủi ro cao — nhiều dấu hiệu nguy hiểm.',
  methodExclusionsTitle: 'Những gì không tính là cá voi',
  methodExclusionsText:
    'Tài khoản pool thanh khoản đã xác minh, địa chỉ burn và ví sàn giao dịch đã xác minh được loại khỏi Top 10 — nguồn cung đó không phải của một cá voi duy nhất.',
  methodSourcesTitle: 'Nguồn dữ liệu',
  methodSourcesText:
    'Solana RPC (qua proxy Cloudflare tới Helius) cho dữ liệu on-chain, DexScreener cho dữ liệu thị trường, Jupiter cho kiểm tra có bán được không.',
  methodExtrasTitle: 'Kiểm tra bổ sung (ngoài thang điểm 100)',
  methodExtrasText:
    'Có Bán Được Không (Jupiter), LP Burn/Lock và Metadata Token — chỉ mang tính thông tin, không cộng hay trừ điểm. Quy tắc LP: holder LP lớn nhất trên 15% = Thận trọng, từ 15% trở xuống = an toàn.',
  themeToDark: 'Chuyển sang chế độ tối',
  themeToLight: 'Chuyển sang chế độ sáng',
  // v7.4 — plain-language risk summary
  summaryBut: 'nhưng',
  summaryAnd: 'và',
  summaryFatalLead: 'Đã phát hiện nguy hiểm:',
  summaryFatalNoSell: 'không tìm thấy đường bán trên Jupiter — token có thể không bán được',
  summaryFatalExt: (names, impl) => `mở rộng Token-2022 nguy hiểm (${names}) — ${impl}`,
  summaryFatalExtImplDelegate: 'dev có thể rút token từ ví của bất kỳ holder nào',
  summaryFatalExtImplHook: 'giao dịch chuyển có thể bị chặn hoặc ngăn lại',
  summaryFatalExtImplFee: 'thuế chuyển có thể bị dev tăng đơn phương',
  summaryFatalMint:
    'Mint Authority vẫn đang hoạt động — dev có thể mint thêm nguồn cung bất cứ lúc nào',
  summaryFatalFreeze:
    'Freeze Authority vẫn đang hoạt động — dev có thể đóng băng token trong ví của bất kỳ ai',
  summaryFatalTop1: (pct) => `một ví duy nhất kiểm soát phần lớn nguồn cung (${pct})`,
  summaryFatalTop10: (pct) => `top 10 ví kiểm soát ${pct} nguồn cung`,
  summaryFatalConsequence: 'Nguy cơ rug pull rất cao.',
  summaryFatalNoSellConsequence:
    'Token không bán lại được sẽ khiến tiền của bạn bị kẹt.',
  summaryFatalTop1Consequence: 'Một ví duy nhất có thể làm sập giá bất cứ lúc nào.',
  summaryCleanOpener:
    'Hợp đồng sạch: dev không thể mint thêm token hay đóng băng số dư',
  summaryCleanOpenerUnknown:
    'Từ dữ liệu hiện có, không phát hiện nguy hiểm nghiêm trọng nào trong hợp đồng',
  summaryDeepLiquidity: 'thanh khoản thị trường đủ sâu',
  summaryTop1Note: (pct) =>
    `Lưu ý: ví lớn nhất nắm giữ ${pct} nguồn cung — hãy kiểm tra trên Solscan xem đó là ví sàn/pool hay cá nhân.`,
  summaryPriceReminder:
    'Nhớ rằng: điểm này đánh giá hợp đồng và thị trường — không đảm bảo giá sẽ tăng.',
  summaryHoldersUnavailable:
    'Phân bổ holder chưa xác minh, nên điểm bị giới hạn tối đa 79 (Thận trọng) cho đến khi đọc được dữ liệu.',
  summaryMarketConsequence: 'Dễ bị trượt giá lớn và xả hàng đột ngột.',
  summaryNoMarket: 'chưa có dữ liệu thị trường vì không phát hiện pool nào',
  summaryNoMarketConsequence:
    'Không có thị trường, giá token không thể định giá và token rất khó bán.',
  summaryFlagTop10: (pct) => `top 10 ví kiểm soát ${pct} nguồn cung`,
  summaryFlagBundle: 'đã phát hiện có thể là bundle dev / mạng lưới insider',
  summaryFlagThinLiq: (v) => `thanh khoản mỏng (${v})`,
  summaryFlagMildLiq: (v) => `thanh khoản vẫn còn nhỏ (${v})`,
  summaryFlagNewPair: 'token này vẫn còn rất mới (dưới 24 giờ)',
  summaryFlagYoungPair: (days) => `cặp này mới chỉ ${days} tuổi`,
  summaryFlagLpNotBurned: (pct) =>
    `LP chưa bị burn — holder LP lớn nhất nắm giữ ${pct}`,
  summaryFlagMetadataMutable: 'metadata token vẫn có thể bị dev thay đổi',
  summaryFlagBonding: 'token vẫn đang trên bonding curve và chưa có LP trên DEX',
};
