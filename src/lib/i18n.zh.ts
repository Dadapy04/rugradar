// RugRadar — Simplified Chinese strings.
// Mirrors the Dict interface in ./i18n.ts; translated from the English dict.

import type { Dict } from './i18n';

export const zh: Dict = {
  tagline:
    '买入之前，先检查 Solana 迷因币的安全性——几秒钟内得到 0–100 的安全评分。',
  pageTitle: 'RugRadar — Solana 代币安全扫描器',
  fieldLabel: '代币 Mint 地址（Solana）',
  placeholder: '例如：DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  scanButton: '扫描代币',
  scanningButton: '扫描中…',
  tryExamples: '试试示例：',
  emptyMintError: '请先粘贴 Solana 代币 Mint 地址。',
  evmError:
    '这是 EVM 地址（0x…），不是 Solana 地址。请粘贴 Solana Mint 地址。',
  invalidError:
    '地址无效——Solana Mint 地址由 base58 字母/数字组成，32–44 个字符。',
  notMintError: '该地址不是代币 Mint——它是一个普通钱包/账户地址。',
  mintNotFoundError:
    '该地址下未找到任何账户——该 Mint 可能不存在，或地址有误。',
  genericError: '扫描代币失败。请检查 Mint 地址后重试。',
  rpcErrorPrefix: '无法从 Solana RPC 读取该 Mint',
  loadingText: '正在从 Solana 读取链上数据，从 DexScreener 读取市场数据…',
  loadingStep1: '1/3 正在从 Solana 读取 Mint 数据…',
  loadingStep2: '2/3 正在计算持币集中度…',
  loadingStep3: '3/3 正在从 DexScreener 获取市场数据…',
  howTitle: 'RugRadar 如何工作',
  howStep1: '粘贴 Solana 代币 Mint 地址（不是钱包地址）。',
  howStep2: 'RugRadar 读取链上与市场数据：权限、持币者、流动性。',
  howStep3: '获得 0–100 安全评分 + 结论——免费，无需钱包，无需登录。',
  verdictAman: '安全',
  verdictWaspada: '警惕',
  verdictBerisiko: '高风险',
  verdictTextAman: '没有重大危险信号——主要检查项看起来都不错。请仍然 DYOR——评分不是保证。',
  verdictTextWaspada:
    '购买前有几件事需要注意。请阅读下方的检查详情。',
  verdictTextBerisiko:
    '危险信号很多。在了解风险之前不要购买——这可能是跑路盘或不健康的代币。',
  verdictTextBerisikoNoMarket:
    '未检测到该代币的任何交易池或流动性。这不是跑路的证据——它可能刚刚上线——但没有市场就无法评估价格，代币也难以卖出。请等待出现活跃交易池，或直接跳过。',
  badgePass: '安全',
  badgeWarn: '警惕',
  badgeFail: '危险',
  badgeInfo: '信息',
  badgeUnavailable: '不可用',
  badgeNa: 'N/A',
  holderLow: '低',
  holderMid: '中',
  holderHigh: '高',
  extraCheck: '额外检查',
  points: '分',
  gaugeLabel: (s) => `代币安全评分：${s} / 100`,
  statsPrice: '价格',
  statsMarketCap: '市值',
  statsLiquidity: '流动性（主交易对）',
  statsVolume24h: '24 小时交易量（主交易对）',
  statsPriceChange24h: '24 小时价格',
  statsTxns24h: '24 小时交易数',
  statsSupply: '总供应量',
  statsTop10: '前 10 名持币者',
  statsGroupMarket: '市场',
  statsGroupToken: '代币',
  checksHeading: '检查详情',
  topHoldersHeading: '前 5 名持币者',
  scannedAt: '扫描于',
  viewOnDexscreener: 'DexScreener',
  viewOnSolscan: 'Solscan',
  viewOnBubblemaps: 'Bubblemaps',
  lostLine: (lost, reason) => `−${lost} 分：${reason}`,
  safetyScoreLabel: '安全评分',
  riskLevelLine: (level) => `风险等级：${level}`,
  riskLow: '低',
  riskMid: '中',
  riskHigh: '高',
  holdersExcludedNote: (kinds) => `已排除：${kinds}。`,
  holdersExcludedNone: '如有流动性池账户，会包含在内。',
  excludedPool: '流动性池账户',
  excludedBurn: '销毁地址',
  excludedExchange: '交易所钱包',
  clearInput: '清空输入',
  pasteInput: '粘贴',
  pasteFailed: '无法读取剪贴板——请手动粘贴地址。',
  copyAddress: '复制 Mint 地址',
  addressCopied: '地址已复制 ✓',
  share: '分享',
  shareTitle: 'RugRadar — 代币扫描结果',
  shareText: (name, symbol, score) =>
    `RugRadar：${name} (${symbol}) — 安全评分 ${score}/100`,
  copyResult: '复制结果',
  copyLink: '复制链接',
  copied: '已复制 ✓',
  copyFailed: '复制失败——请从上方地址栏或结果中手动复制。',
  copySummary: (s) =>
    `RugRadar — ${s.name} (${s.symbol}): ${s.score}/100 ${s.verdict}\n${s.summary ? `${s.summary}\n` : ''}${s.checks}\nhttps://dadapy04.github.io/rugradar/?mint=${s.mint}`,
  footerScoring:
    '安全评分的计算方式（总分 100）：Mint Authority 20 · Freeze Authority 20 · 持币集中度 30 · 流动性与市场 30。',
  footerDisclaimer:
    'RugRadar 仅读取公开数据（Solana RPC + DexScreener）。这不是投资建议——购买任何代币前请务必 DYOR。',
  mint: {
    title: 'Mint Authority',
    detailRevoked: '已撤销——任何人都无法再增发新代币。',
    detailActive:
      '仍处于激活状态——所有者随时可以增发新代币并稀释价格。',
    explanation:
      '如果 Mint Authority 仍处于激活状态，开发者可以随意增加供应量。安全的代币通常已将其撤销。',
  },
  freeze: {
    title: 'Freeze Authority',
    detailRevoked: '已撤销——任何人都无法冻结持币者的钱包。',
    detailActive: '仍处于激活状态——所有者可以冻结任何人钱包中的代币。',
    explanation:
      'Freeze Authority 处于激活状态意味着有人可以锁定你的代币，让你无法卖出。安全的代币已将其撤销。',
  },
  holdersTitle: '持币集中度（前 10 名）',
  holdersUnavailable: '目前无法从 RPC 获取持币数据。',
  holdersScoreDefault: '15/30（中性默认值——数据未验证）',
  holdersDetail: (top10, top1) =>
    `前 10 个钱包持有总供应量的 ${top10}（最大钱包：${top1}）。`,
  holdersExplanation:
    '少数钱包持有的份额越小，某个巨鲸大额抛售砸盘的风险就越低。超过 50% 就是危险信号。',
  liquidityTitle: '流动性与市场活跃度',
  liquidityNoPair:
    '未找到该代币的交易池——它可能还没有市场，或代币已死亡。',
  liquidityDexError:
    '目前无法获取市场数据（DexScreener）——已跳过此项检查。',
  liquidityDetail: (liq, vol, ageDays, dex) =>
    `主交易对：流动性 ${liq}，24 小时交易量 ${vol}，池子年龄 ${ageDays}（DEX：${dex}）。`,
  liquidityExplanation:
    '流动性低意味着价格容易被操纵，你也可能难以卖出。池子存在时间久、每日交易量健康，是市场活跃的标志。',
  sellableTitle: '可卖出（貔貅盘检查）',
  sellableOk: 'Jupiter 找到了卖出到 SOL 的路径——该代币可以在 DEX 上卖出。',
  sellableWarn:
    'Jupiter 未找到卖出到 SOL 的路径——可能是貔貅盘，或该代币尚无可卖出的市场。',
  sellableUnavailable:
    '目前无法运行卖出检查（Jupiter 无响应）——这并不意味着代币无法卖出，请重新扫描。',
  sellableExplanation:
    '额外检查（不在 100 分评分内）：貔貅盘代币可以买入但无法卖回。如果没有卖出路径，请不要购买。',
  mintLostReason: 'Mint Authority 仍处于激活状态',
  freezeLostReason: 'Freeze Authority 仍处于激活状态',
  holdersLostNoData: '持币数据未验证——总分上限为 79（警惕）',
  holdersLostDetail: (top10) => `前 10 名持有 ${top10} 的供应量`,
  // v7.6 — dev-bundle heuristic
  bundleTitle: '开发者捆绑 / 协同钱包',
  bundleOk: (buyers, share) =>
    `早期交易中未检测到捆绑模式（上线时段内 ${buyers} 个钱包，合计持有 ${share} 供应量）。`,
  bundleSuspected: (buyers, share) =>
    `疑似开发者捆绑：${buyers} 个不同钱包在上线时段买入，合计持有 ${share} 供应量——可能是一个人准备同时抛售。`,
  bundleSuspectedRc: (wallets, share) =>
    `疑似开发者捆绑（RugCheck）：一个内部关联网络的 ${wallets} 个钱包仍持有 ${share} 供应量——可能是一个人准备同时抛售。`,
  bundleOkRc: (wallets, share) =>
    `未检测到大型内部关联网络（RugCheck）：最大的关联网络共 ${wallets} 个钱包，持有 ${share} 供应量。`,
  bundleSkipped:
    '仅针对年轻代币检查（交易对 < 7 天）——该代币太老，不存在上线捆绑模式。',
  bundleUnavailable:
    '无法读取早期交易数据——捆绑模式未验证。',
  bundleTooDeep:
    '该代币的交易历史太长，无法在浏览器中读取——捆绑模式未验证，请在 Bubblemaps / RugCheck 上手动检查。',
  bundleExplanation:
    '不良开发者通过上线时段的一笔 Jito Bundle，把供应量分散到多个钱包，让每个钱包看起来都很小。在相信持币评分之前，请先在 Bubblemaps / RugCheck 上查看聚类图。',
  liquidityLostNoPair: '无交易池或市场数据',
  liqPartLow: (v) => `流动性 ${v}`,
  agePartLow: (v) => `池子年龄 ${v}`,
  volPartLow: (v) => `24 小时交易量 ${v}`,
  lpTitle: 'LP 销毁/锁定',
  lpBurned: (pct) =>
    `${pct} 的 LP 代币已被销毁（销毁地址）——开发者无法抽走流动性。`,
  lpMostlySafe: (top1) =>
    `剩余最大的 LP 持有者持有 ${top1}，最多只能抽走 ${top1} 的流动性。`,
  lpNotBurned: (top1) =>
    `LP 未证明已销毁或锁定——最大的 LP 持有者持有 ${top1}，可能抽走流动性。`,
  lpUnavailable:
    '无法检查该池子的 LP（不是 Raydium 池子，或无法读取 LP 数据）。',
  lpExplanation:
    '额外检查（不在 100 分评分内）：LP 代币被销毁后，开发者无法撤走流动性跑路。如果 LP 仍由某个钱包持有，风险依然存在。',
  metadataTitle: '代币元数据',
  metadataImmutable:
    '元数据已锁定（不可变）——名称、符号和 URI 无法再更改。',
  metadataMutable:
    '元数据仍可更改——开发者可以修改代币名称、符号或 URI。',
  metadataUnavailable: '该代币没有元数据账户 / 元数据无法读取。',
  metadataExplanation:
    '额外检查（不在 100 分评分内）：元数据仍可更改意味着代币的展示信息（名称、图标、描述）在上线后仍可能被修改。',
  thousand: '千',
  million: '百万',
  days: '天',
  unknownName: '未知',
  eyebrow: '代币安全扫描器 · Solana',
  pairConvertedNote: (name, symbol) =>
    `检测到交易对地址——其基础代币是 ${name} (${symbol})，已扫描该代币。`,
  pairGuidanceError:
    '该地址不是代币 Mint（可能是交易对/池子或钱包地址），且在 DexScreener 上找不到其基础代币。请粘贴代币 Mint 地址——不是池子地址。',
  marketCardTitle: '市场背景',
  marketRatioLabel: '流动性 / 市值',
  marketAgeLabel: '交易对年龄',
  marketTotalLiquidityLabel: '流动性（全部 DEX 合计）',
  marketTotalVolumeLabel: '24 小时交易量（全部 DEX 合计）',
  marketTopPairNote: (v) => `主交易对：${v}`,
  marketThinWarning: (ratio) =>
    `流动性非常稀薄——仅占市值的 ${ratio}。小额交易就可能导致价格剧烈波动，代币也可能难以卖出，即使 Mint Authority / Freeze Authority 已被撤销。`,
  txnsBuy: '买入',
  txnsSell: '卖出',
  bondingCurveLabel: '仍在联合曲线阶段——尚未迁移到 DEX',
  lpBondingCurve:
    '该代币仍在联合曲线阶段——尚无传统 LP，因此 LP 销毁检查不适用。',
  lpOrca:
    '不适用于 Orca 池子（集中流动性）——没有可销毁的 LP 代币，因此跳过此项检查。',
  lpMeteora:
    '不适用于 Meteora 池子（集中流动性 / DLMM）——没有可销毁的 LP 代币，因此跳过此项检查。',
  token2022Title: 'Token-2022 扩展',
  token2022Standard:
    '标准 SPL 代币（非 Token-2022）——无危险扩展。',
  token2022Clean: 'Token-2022，未检测到危险扩展。',
  token2022Found: (names) =>
    `检测到带有危险扩展的 Token-2022 代币：${names}。`,
  token2022Unavailable: '目前无法检查 Token-2022 扩展。',
  token2022NoPenalty: '无扣分',
  token2022PenaltyLabel: (n) => `−${n} 分`,
  token2022Explanation:
    '评分扣分：危险的 Token-2022 扩展会从总分中扣分——Permanent Delegate −15 分，Transfer Fee −10 分，Transfer Hook −10 分（最多 −35）。Permanent Delegate 让开发者可以从持币者钱包中提取/销毁代币，Transfer Fee 是可单方面提高的税费，Transfer Hook 可用于制造貔貅盘。',
  extPermanentDelegate: 'Permanent Delegate',
  extTransferFee: 'Transfer Fee',
  extTransferHook: 'Transfer Hook',
  recentScansTitle: '最近扫描：',
  recentHint: '点击标签可重新扫描。',
  rescan: '重新扫描',
  historyDiffLabel: '自上次扫描以来',
  historyNoChange: '自上次扫描以来没有变化',
  historyVerdictChanged: (from, to) => `结论变化：${from} → ${to}`,
  batchTitle: '批量扫描',
  batchPlaceholder: '每行一个 Mint 地址（最多 10 个）',
  batchScanButton: '全部扫描',
  batchScanning: (done, total) => `扫描中 ${done}/${total}…`,
  batchEmptyError: '请至少输入一个 Mint 地址。',
  batchMaxError: '每批最多 10 个代币。',
  batchColToken: '代币',
  batchColScore: '评分',
  batchColVerdict: '结论',
  batchClickHint: '点击一行查看完整结果。',
  batchInvalidLines: (n) => `已跳过 ${n} 行无效地址。`,
  shareCardButton: '分享图片',
  shareCardSaved: '图片已保存',
  shareCardFailed: '无法生成图片。',
  freshChecking: '正在检查持币者钱包年龄…',
  freshLine: (fresh, total) => `${total} 个主要持币者中有 ${fresh} 个是新钱包（<7 天）`,
  freshNone: '没有主要持币者是新钱包（<7 天）',
  freshUnknown: (n) => `有 ${n} 个钱包无法检查`,
  // v7.12.5 — post-launch inter-wallet transfers
  transfersChecking: '正在检查钱包间转账…',
  transfersLine: (involved, total) => `前 ${total} 大持币者中有 ${involved} 个在上线后转移了代币`,
  transfersNeutral: (involved, total) => `前 ${total} 大持币者中有 ${involved} 个从同一来源收到代币——这是大市值代币中常见的分销商/做市商模式`,
  transfersNone: '在前 5 大持币者中未检测到钱包间转账',
  transfersUnavailable: '无法检查钱包间转账',
  transfersSharedSource: '共同来源',
  lpUnlockTitle: 'LP 解锁',
  lpUnlockWarning: (days, date) => `LP 将在 ${days} 天后解锁（${date}）`,
  updatedJustNow: '刚刚更新',
  updatedMinutes: (n) => `${n} 分钟前更新`,
  updatedHours: (n) => `${n} 小时前更新`,
  methodTitle: '评分如何计算',
  methodClose: '关闭',
  methodIntro:
    'RugRadar 给出 0–100 的安全评分。分数越高越安全。评分根据公开的链上数据和市场数据计算。',
  methodWeightsTitle: '评分权重（总分 100）',
  methodWeightMint: 'Mint Authority — 20 分',
  methodWeightFreeze: 'Freeze Authority — 20 分',
  methodWeightHolders: '持币集中度（前 10 名）— 30 分',
  methodHoldersNote:
    '如果无法读取持币数据：该项按中性 15/30 计分，总分上限为 79——永远不会是“安全”。',
  methodBundleTitle: '捆绑检测（第 2 级）',
  methodBundleText:
    '仅针对年轻代币（交易对 < 7 天）。两个信号：RPC 启发式检测（≥4 个不同钱包在上线时段买入，合计 >15% 供应量）和 RugCheck 内部关联网络（一个网络持有 >15% 供应量）。任一信号触发，该代币即被标记为疑似捆绑，总分上限为 79。这不是确凿证据——请在 Bubblemaps / RugCheck 上确认。',
  methodWeightLiquidity: '流动性与市场 — 30 分',
  methodLiquidityNote:
    '注意：市场背景卡片显示的是所有 DEX 交易对的流动性和 24 小时交易量总和，而计入评分的“流动性与市场”检查仅使用流动性最高的单个交易对。',
  methodPenaltyTitle: 'Token-2022 扣分（最多 −35 分）',
  methodPenaltyText:
    '带有危险 Token-2022 扩展的代币会从总分中扣分：Permanent Delegate −15，Transfer Fee −10，Transfer Hook −10。标准 SPL 代币不扣分。',
  methodBandsTitle: '分数含义',
  methodBandSafe: '80–100 安全——通过全部主要检查。',
  methodBandCaution: '50–79 警惕——有需要注意的地方。',
  methodBandHigh: '0–49 高风险——危险信号很多。',
  methodExclusionsTitle: '哪些不算巨鲸',
  methodExclusionsText:
    '已验证的流动性池账户、销毁地址和已验证的交易所钱包不计入前 10 名——这些供应量不属于单个巨鲸。',
  methodSourcesTitle: '数据来源',
  methodSourcesText:
    'Solana RPC（经 Cloudflare 代理到 Helius）提供链上数据，DexScreener 提供市场数据，Jupiter 提供可卖出检查。',
  methodExtrasTitle: '额外检查（不在 100 分评分内）',
  methodExtrasText:
    '可卖出（Jupiter）、LP 销毁/锁定和代币元数据——仅供参考，不加分也不扣分。LP 规则：最大的 LP 持有者超过 15% = 警惕，15% 及以下 = 安全。',
  themeToDark: '切换到深色模式',
  themeToLight: '切换到浅色模式',
  // v7.4 — plain-language risk summary
  summaryBut: '但',
  summaryAnd: '和',
  summaryFatalLead: '检测到危险：',
  summaryFatalNoSell: '在 Jupiter 上未找到卖出路径——该代币可能无法卖出',
  summaryFatalExt: (names, impl) => `危险的 Token-2022 扩展（${names}）——${impl}`,
  summaryFatalExtImplDelegate: '开发者可以从任何持币者钱包中提取代币',
  summaryFatalExtImplHook: '转账可能被拦截或阻止',
  summaryFatalExtImplFee: '开发者可单方面提高转账税费',
  summaryFatalMint:
    'Mint Authority 仍处于激活状态——开发者随时可以增发供应量',
  summaryFatalFreeze:
    'Freeze Authority 仍处于激活状态——开发者可以冻结任何人钱包中的代币',
  summaryFatalTop1: (pct) => `单个钱包控制了大部分供应量（${pct}）`,
  summaryFatalTop10: (pct) => `前 10 个钱包控制了 ${pct} 的供应量`,
  summaryFatalConsequence: '跑路风险非常高。',
  summaryFatalNoSellConsequence: '无法卖回的代币会让你的资金被套牢。',
  summaryFatalTop1Consequence: '单个钱包随时可能砸盘。',
  summaryCleanOpener:
    '合约干净：开发者无法增发新代币或冻结余额',
  summaryCleanOpenerUnknown:
    '根据现有数据，合约中未检测到致命危险',
  summaryDeepLiquidity: '市场流动性足够深',
  summaryTop1Note: (pct) =>
    `注意：最大钱包持有 ${pct} 的供应量——请在 Solscan 上确认它是交易所/池子钱包还是个人钱包。`,
  summaryPriceReminder:
    '请记住：该评分评估的是合约和市场——不保证价格会上涨。',
  summaryHoldersUnavailable:
    '持币分布未验证，因此评分上限为 79（警惕），直到数据能够读取。',
  summaryMarketConsequence: '容易出现大幅滑点和突然抛售。',
  summaryNoMarket: '尚未检测到交易池，因此没有市场数据',
  summaryNoMarketConsequence:
    '没有市场就无法评估代币价格，代币也难以卖出。',
  summaryFlagTop10: (pct) => `前 10 个钱包控制了 ${pct} 的供应量`,
  summaryFlagBundle: '检测到疑似开发者捆绑 / 内部关联网络',
  summaryFlagThinLiq: (v) => `流动性稀薄（${v}）`,
  summaryFlagMildLiq: (v) => `流动性仍然较小（${v}）`,
  summaryFlagNewPair: '该代币非常新（不到 24 小时）',
  summaryFlagYoungPair: (days) => `该交易对仅创建 ${days}`,
  summaryFlagLpNotBurned: (pct) =>
    `LP 未销毁——最大的 LP 持有者持有 ${pct}`,
  summaryFlagMetadataMutable: '代币元数据仍可被开发者更改',
  summaryFlagBonding: '代币仍在联合曲线阶段，尚未在 DEX 建立 LP',
};
