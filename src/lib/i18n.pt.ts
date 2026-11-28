// RugRadar — Brazilian Portuguese strings.
import type { Dict } from './i18n';

export const pt: Dict = {
  tagline:
    'Confira a segurança de uma memecoin Solana antes de comprar — uma pontuação de segurança de 0 a 100 em segundos.',
  pageTitle: 'RugRadar — Scanner de Segurança de Tokens Solana',
  fieldLabel: 'Endereço Mint do Token (Solana)',
  placeholder: 'Exemplo: DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  scanButton: 'Escanear Token',
  scanningButton: 'Escaneando…',
  tryExamples: 'Experimente um exemplo:',
  emptyMintError: 'Cole primeiro um endereço mint de token Solana.',
  evmError:
    'Este é um endereço EVM (0x…), não um endereço Solana. Cole um endereço mint Solana.',
  invalidError:
    'Endereço inválido — um endereço mint Solana é composto por letras/dígitos em base58, com 32 a 44 caracteres.',
  notMintError: 'Este endereço não é um mint de token — é um endereço comum de carteira/conta.',
  mintNotFoundError:
    'Nenhuma conta encontrada neste endereço — o mint pode não existir, ou o endereço está errado.',
  genericError: 'Falha ao escanear o token. Confira o endereço mint e tente novamente.',
  rpcErrorPrefix: 'Falha ao ler o mint no RPC Solana',
  loadingText: 'Lendo dados on-chain da Solana + dados de mercado do DexScreener…',
  loadingStep1: '1/3 Lendo dados do mint na Solana…',
  loadingStep2: '2/3 Calculando a concentração de holders…',
  loadingStep3: '3/3 Buscando dados de mercado no DexScreener…',
  howTitle: 'Como o RugRadar funciona',
  howStep1: 'Cole o endereço mint de um token Solana (não o endereço da carteira).',
  howStep2:
    'O RugRadar lê dados on-chain + de mercado: autoridades, holders, liquidez.',
  howStep3: 'Receba uma pontuação de segurança de 0 a 100 + veredito — grátis, sem carteira, sem login.',
  verdictAman: 'Seguro',
  verdictWaspada: 'Cuidado',
  verdictBerisiko: 'Alto risco',
  verdictTextAman:
    'Nenhum sinal de alerta grave — as verificações principais parecem boas. Mesmo assim, DYOR — uma pontuação não é garantia.',
  verdictTextWaspada:
    'Há alguns pontos para observar antes de comprar. Leia os detalhes das verificações abaixo.',
  verdictTextBerisiko:
    'Muitos sinais de alerta. Não compre antes de entender os riscos — pode ser um rug pull ou um token problemático.',
  verdictTextBerisikoNoMarket:
    'Nenhum pool ou liquidez foi detectado para este token. Isso não é prova de rug pull — ele pode ter acabado de lançar — mas sem mercado o preço não pode ser avaliado e o token é difícil de vender. Espere um pool ativo, ou pule este token.',
  badgePass: 'SEGURO',
  badgeWarn: 'CUIDADO',
  badgeFair: 'ACEITÁVEL',
  badgeFail: 'PERIGO',
  badgeInfo: 'INFO',
  badgeUnavailable: 'INDISPONÍVEL',
  badgeNa: 'N/A',
  holderLow: 'BAIXA',
  holderMid: 'MÉDIA',
  holderHigh: 'ALTA',
  extraCheck: 'verificação extra',
  points: 'pts',
  gaugeLabel: (score) => `Pontuação de segurança do token: ${score} de 100`,
  statsPrice: 'Preço',
  statsMarketCap: 'Market Cap',
  statsLiquidity: 'Liquidez (par principal)',
  statsVolume24h: 'Volume 24h (par principal)',
  statsPriceChange24h: 'Preço 24h',
  statsTxns24h: 'Transações 24h',
  statsSupply: 'Supply Total',
  statsTop10: 'Top 10 Holders',
  statsGroupMarket: 'Mercado',
  statsGroupToken: 'Token',
  checksHeading: 'Detalhes das Verificações',
  topHoldersHeading: 'Top 5 Holders',
  scannedAt: 'Escaneado',
  viewOnDexscreener: 'DexScreener',
  viewOnSolscan: 'Solscan',
  viewOnBubblemaps: 'Bubblemaps',
  lostLine: (lost, reason) => `−${lost} pts: ${reason}`,
  safetyScoreLabel: 'Pontuação de Segurança',
  riskLevelLine: (level) => `Nível de Risco: ${level}`,
  riskLow: 'Baixo',
  riskMid: 'Médio',
  riskHigh: 'Alto',
  holdersExcludedNote: (kinds) => `Excluídos: ${kinds}.`,
  holdersExcludedNone: 'Inclui a conta do pool de liquidez, se houver.',
  excludedPool: 'conta do pool de liquidez',
  excludedBurn: 'endereço de burn',
  excludedExchange: 'carteiras de exchange',
  clearInput: 'Limpar campo',
  pasteInput: 'Colar',
  pasteFailed: 'Não foi possível ler a área de transferência — cole o endereço manualmente.',
  copyAddress: 'Copiar endereço mint',
  addressCopied: 'Endereço copiado ✓',
  share: 'Compartilhar',
  shareTitle: 'RugRadar — resultado do scan de token',
  shareText: (name, symbol, score) =>
    `RugRadar: ${name} (${symbol}) — pontuação de segurança ${score}/100`,
  copyResult: 'Copiar resultado',
  copyLink: 'Copiar link',
  copied: 'Copiado ✓',
  copyFailed: 'Falha ao copiar — copie manualmente do campo de endereço ou do resultado acima.',
  copySummary: (s) =>
    `RugRadar — ${s.name} (${s.symbol}): ${s.score}/100 ${s.verdict}\n${s.summary ? `${s.summary}\n` : ''}${s.checks}\nhttps://dadapy04.github.io/rugradar/?mint=${s.mint}`,
  footerScoring:
    'Como a pontuação de segurança funciona (total 100): Mint Authority 20 · Freeze Authority 20 · Concentração de Holders 30 · Liquidez e Mercado 30.',
  footerDisclaimer:
    'O RugRadar só lê dados públicos (RPC Solana + DexScreener). Isto não é conselho financeiro — faça sempre DYOR antes de comprar qualquer token.',
  mint: {
    title: 'Mint Authority',
    detailRevoked: 'Já revogada — ninguém pode criar novos tokens.',
    detailActive:
      'AINDA ATIVA — o dono pode criar novos tokens a qualquer momento e diluir o preço.',
    explanation:
      'Se a mint authority ainda estiver ativa, o desenvolvedor pode aumentar o supply quando quiser. Tokens seguros geralmente já a revogaram.',
  },
  freeze: {
    title: 'Freeze Authority',
    detailRevoked: 'Já revogada — ninguém pode congelar as carteiras dos holders.',
    detailActive: 'AINDA ATIVA — o dono pode congelar os tokens na carteira de qualquer pessoa.',
    explanation:
      'Uma freeze authority ativa significa que alguém pode travar seus tokens e impedir que você os venda. Tokens seguros já a revogaram.',
  },
  holdersTitle: 'Concentração de Holders (Top 10)',
  holdersUnavailable: 'Os dados de holders não puderam ser obtidos do RPC neste momento.',
  holdersScoreDefault: '15/30 (valor neutro padrão — dados não verificados)',
  holdersDetail: (top10, top1) =>
    `As 10 maiores carteiras detêm ${top10} do supply total (maior carteira: ${top1}).`,
  holdersExplanation:
    'Quanto menor a fatia nas mãos de poucas carteiras, menor o risco de uma baleia vender tudo e derrubar o preço. Acima de 50% é sinal de alerta.',
  liquidityTitle: 'Liquidez e Atividade de Mercado',
  liquidityNoPair:
    'Nenhum pool de negociação encontrado para este token — ele pode ainda não ter mercado ou já estar morto.',
  liquidityDexError:
    'Os dados de mercado (DexScreener) não puderam ser obtidos neste momento — esta verificação foi ignorada.',
  liquidityDetail: (liq, vol, ageDays, dex) =>
    `Par principal: liquidez ${liq}, volume 24h ${vol}, idade do pool ${ageDays} (DEX: ${dex}).`,
  liquidityExplanation:
    'Liquidez baixa significa que o preço é fácil de manipular e você pode ter dificuldade para vender. Um pool antigo com volume diário saudável é sinal de um mercado ativo.',
  sellableTitle: 'Vendável (Checagem de Honeypot)',
  sellableOk: 'O Jupiter encontrou uma rota de venda para SOL — este token pode ser vendido em uma DEX.',
  sellableWarn:
    'O Jupiter não encontrou rota de venda para SOL — possível honeypot, ou o token ainda não tem um mercado vendável.',
  sellableUnavailable:
    'A checagem de venda não pôde ser executada agora (o Jupiter não respondeu) — isso não significa que o token não possa ser vendido, tente escanear novamente.',
  sellableExplanation:
    'Verificação extra (fora da pontuação de 100): tokens honeypot podem ser comprados, mas não vendidos de volta. Se não houver rota de venda, não compre.',
  mintLostReason: 'a mint authority ainda está ativa',
  freezeLostReason: 'a freeze authority ainda está ativa',
  holdersLostNoData: 'dados de holders não verificados — pontuação total limitada a 79 (Cuidado)',
  holdersLostDetail: (top10) => `O Top 10 detém ${top10} do supply`,
  // v7.6 — dev-bundle heuristic
  bundleTitle: 'Bundle de Dev / Carteiras Coordenadas',
  bundleOk: (buyers, share) =>
    `Nenhum padrão de bundle detectado nas transações iniciais (${buyers} carteiras no slot de lançamento, ${share} do supply juntas).`,
  bundleSuspected: (buyers, share) =>
    `Possível bundle de dev: ${buyers} carteiras diferentes compraram no slot de lançamento com ${share} do supply juntas — pode ser uma só pessoa pronta para vender tudo de uma vez.`,
  bundleSuspectedRc: (wallets, share) =>
    `Possível bundle de dev (RugCheck): uma rede de insiders com ${wallets} carteiras ainda detém ${share} do supply — pode ser uma só pessoa pronta para vender tudo de uma vez.`,
  bundleOkRc: (wallets, share) =>
    `Nenhuma rede grande de insiders detectada (RugCheck): a maior rede detém ${share} do supply em ${wallets} carteiras.`,
  bundleSkipped:
    'Verificado só para tokens novos (par com menos de 7 dias) — este token é velho demais para um padrão de bundle de lançamento.',
  bundleUnavailable:
    'Os dados das transações iniciais não puderam ser lidos — padrão de bundle não verificado.',
  bundleTooDeep:
    'Este token tem histórico de transações grande demais para ler no navegador — padrão de bundle não verificado, confira manualmente no Bubblemaps / RugCheck.',
  bundleExplanation:
    'Devs mal-intencionados espalham o supply por muitas carteiras em um único Jito Bundle no slot de lançamento, para cada carteira parecer pequena. Confira o mapa de clusters no Bubblemaps / RugCheck antes de confiar na pontuação de holders.',
  bundleCapNote:
    'Como há suspeita de bundle, a pontuação total é limitada a 79 — não porque um perigo foi comprovado, mas porque a distribuição ainda não é confiável.',
  liquidityLostNoPair: 'sem pool ou dados de mercado',
  liqPartLow: (v) => `liquidez ${v}`,
  agePartLow: (v) => `idade do pool ${v}`,
  volPartLow: (v) => `volume 24h ${v}`,
  lpTitle: 'LP Queimado/Bloqueado',
  lpBurned: (pct) =>
    `${pct} dos tokens LP foram queimados (incinerador) — o dev não pode retirar a liquidez.`,
  lpMostlySafe: (top1) =>
    `O maior detentor de LP restante possui ${top1} e poderia retirar no máximo ${top1} da liquidez.`,
  lpNotBurned: (top1) =>
    `O LP não está comprovadamente queimado ou bloqueado — o maior detentor de LP possui ${top1} e poderia retirar a liquidez.`,
  lpUnavailable:
    'O LP não pode ser verificado para este pool (não é um pool Raydium, ou os dados de LP não puderam ser lidos).',
  lpExplanation:
    'Verificação extra (fora da pontuação de 100): quando os tokens LP são queimados, o desenvolvedor não pode retirar a liquidez e dar rug. Se o LP ainda estiver na mão de uma carteira, o risco continua.',
  metadataTitle: 'Metadados do Token',
  metadataImmutable:
    'Metadados travados (imutáveis) — nome, símbolo e URI não podem mais ser alterados.',
  metadataMutable:
    'Metadados ainda mutáveis — o desenvolvedor pode alterar o nome, o símbolo ou a URI do token.',
  metadataUnavailable: 'Sem conta de metadados / metadados ilegíveis para este token.',
  metadataExplanation:
    'Verificação extra (fora da pontuação de 100): metadados mutáveis significam que a apresentação do token (nome, logo, descrição) ainda pode ser alterada após o lançamento.',
  thousand: 'mil',
  million: 'mi',
  days: 'dias',
  unknownName: 'Desconhecido',
  eyebrow: 'Scanner de Segurança de Tokens · Solana',
  pairConvertedNote: (name, symbol) =>
    `Endereço de par detectado — o token base é ${name} (${symbol}), e foi ele que foi escaneado.`,
  pairGuidanceError:
    'Este endereço não é um mint de token (pode ser um endereço de par/pool ou de carteira), e o token base não foi encontrado no DexScreener. Cole o endereço mint do token — não o endereço do pool.',
  marketCardTitle: 'Contexto de Mercado',
  marketRatioLabel: 'Liquidez / Market Cap',
  marketAgeLabel: 'Idade do Par',
  marketTotalLiquidityLabel: 'Liquidez (total DEX)',
  marketTotalVolumeLabel: 'Volume 24h (total DEX)',
  marketTopPairNote: (value) => `par principal: ${value}`,
  marketThinWarning: (ratio) =>
    `Liquidez muito fina — apenas ${ratio} do market cap. O preço pode se mover bruscamente com trades pequenos e o token pode ser difícil de vender, mesmo com a mint/freeze authority revogada.`,
  marketThinCexNote: (ratio) =>
    `A liquidez DEX parece baixa em relação ao market cap (${ratio}), mas o volume de 24 horas continua saudável, porque a maior parte do trading de um token grande acontece em CEX, não em DEX. Essa proporção por si só não é sinal de perigo.`,
  txnsBuy: 'Compra',
  txnsSell: 'Venda',
  bondingCurveLabel: 'Ainda na Bonding Curve — sem migração para DEX',
  lpBondingCurve:
    'Este token ainda está na bonding curve — ainda não há LP tradicional, então a checagem de burn de LP não se aplica.',
  lpOrca:
    'Não se aplica a pools Orca (liquidez concentrada) — não há token LP para queimar, então esta verificação é ignorada.',
  lpMeteora:
    'Não se aplica a pools Meteora (liquidez concentrada / DLMM) — não há token LP para queimar, então esta verificação é ignorada.',
  token2022Title: 'Extensões Token-2022',
  token2022Standard:
    'Token SPL padrão (não é Token-2022) — sem extensões perigosas.',
  token2022Clean: 'Token-2022 sem extensões perigosas detectadas.',
  token2022Found: (names) =>
    `Token-2022 com extensões perigosas detectadas: ${names}.`,
  token2022Unavailable: 'As extensões Token-2022 não puderam ser verificadas neste momento.',
  token2022NoPenalty: 'Sem penalidade',
  token2022PenaltyLabel: (penalty) => `−${penalty} pts`,
  token2022Explanation:
    'Penalidade na pontuação: extensões perigosas do Token-2022 subtraem da pontuação total — Permanent Delegate −15 pts, Transfer Fee −10 pts, Transfer Hook −10 pts (máx. −35). Permanent Delegate permite que o dev retire/queime tokens das carteiras dos holders, Transfer Fee é uma taxa que pode ser aumentada unilateralmente, e Transfer Hook pode ser usada para honeypots.',
  extPermanentDelegate: 'Permanent Delegate',
  extTransferFee: 'Transfer Fee',
  extTransferHook: 'Transfer Hook',
  recentScansTitle: 'Escaneados recentemente:',
  recentHint: 'Toque em um chip para escanear novamente.',
  rescan: 'Escanear novamente',
  historyDiffLabel: 'Desde a última verificação',
  historyNoChange: 'Sem mudanças desde a última verificação',
  historyVerdictChanged: (from, to) => `Veredito mudou: ${from} → ${to}`,
  historyBetter: 'a pontuação melhorou',
  historyWorse: 'a pontuação piorou',
  historyTop10Better: 'a participação do top 10 melhorou',
  historyTop10Worse: 'a participação do top 10 piorou',
  batchTitle: 'Escaneamento em Lote',
  batchPlaceholder: 'Um endereço mint por linha (máx. 10)',
  batchScanButton: 'Escanear Tudo',
  batchScanning: (done, total) => `Escaneando ${done}/${total}…`,
  batchEmptyError: 'Digite pelo menos um endereço mint.',
  batchMaxError: 'Máximo de 10 tokens por lote.',
  batchColToken: 'Token',
  batchColScore: 'Pontuação',
  batchColVerdict: 'Veredito',
  batchClickHint: 'Toque em uma linha para ver o resultado completo.',
  batchInvalidLines: (n) => `${n} linhas inválidas ignoradas.`,
  shareCardButton: 'Compartir Imagem',
  shareCardSaved: 'Imagem salva',
  shareCardFailed: 'Não foi possível criar a imagem.',
  freshChecking: 'Verificando a idade das carteiras…',
  freshLine: (fresh, total) => `${fresh} de ${total} holders principais são carteiras novas (<7 dias)`,
  freshNone: 'Nenhum holder principal é uma carteira nova (<7 dias)',
  freshUnknown: (n) => `${n} carteiras não puderam ser verificadas`,
  freshSectionTitle: 'Idade das carteiras',
  freshExplanation:
    'Uma carteira nova por si só não prova um golpe, mas vários detentores principais criados ao mesmo tempo podem pertencer a uma mesma pessoa.',
  // v7.12.5 — post-launch inter-wallet transfers
  transfersChecking: 'Verificando transferências entre carteiras…',
  transfersLine: (involved, total) =>
    `${involved} dos ${total} maiores holders moveram tokens entre carteiras após o lançamento`,
  transfersNeutral: (involved, total) =>
    `${involved} dos ${total} maiores holders receberam tokens de uma mesma fonte — um padrão comum de distribuidores / formadores de mercado em tokens grandes`,
  transfersNone: 'Nenhuma transferência entre carteiras detectada entre os 5 maiores holders',
  transfersUnavailable: 'Não foi possível verificar as transferências entre carteiras',
  transfersSharedSource: 'fonte compartilhada',
  transfersSectionTitle: 'Transferências entre carteiras',
  lpUnlockTitle: 'Desbloqueio de LP',
  lpUnlockWarning: (days, date) => `O LP desbloqueia em ${days} dias (${date})`,
  updatedJustNow: 'Atualizado agora mesmo',
  updatedMinutes: (n) => `Atualizado há ${n} min`,
  updatedHours: (n) => `Atualizado há ${n} h`,
  methodTitle: 'Como Funciona a Pontuação',
  methodClose: 'Fechar',
  methodIntro:
    'O RugRadar dá uma pontuação de segurança de 0 a 100. Quanto maior, mais seguro. A pontuação é calculada a partir de dados públicos on-chain e de mercado.',
  methodWeightsTitle: 'Pesos da pontuação (total 100)',
  methodWeightMint: 'Mint Authority — 20 pts',
  methodWeightFreeze: 'Freeze Authority — 20 pts',
  methodWeightHolders: 'Concentração de Holders (Top 10) — 30 pts',
  methodHoldersNote:
    'Se os dados de holders não puderem ser lidos: a pontuação fica em 15/30 (neutra) e o total é limitado a 79 — nunca Seguro.',
  methodBundleTitle: 'Detecção de Bundle (Nível 2)',
  methodBundleText:
    'Só para tokens novos (par com menos de 7 dias). Dois sinais: a heurística RPC (≥4 carteiras diferentes compraram no slot de lançamento com mais de 15% do supply juntas) e as redes de insiders do RugCheck (uma rede com mais de 15% do supply). Se um dos dois disparar, o token é sinalizado como possível bundle e o total é limitado a 79. Não é prova definitiva — confirme no Bubblemaps / RugCheck.',
  methodWeightLiquidity: 'Liquidez e Mercado — 30 pts',
  methodLiquidityNote:
    'Observação: o cartão de contexto de mercado mostra a liquidez total e o volume 24h somados de todos os pares DEX, enquanto a verificação pontuada de Liquidez e Mercado usa apenas o par de maior liquidez.',
  methodPenaltyTitle: 'Penalidade Token-2022 (máx. −35 pts)',
  methodPenaltyText:
    'Tokens com extensões perigosas do Token-2022 perdem pontos da pontuação total: Permanent Delegate −15, Transfer Fee −10, Transfer Hook −10. Tokens SPL padrão não sofrem penalidade.',
  methodBandsTitle: 'O que a pontuação significa',
  methodBandSafe: '80–100 Seguro — passou em todas as verificações principais.',
  methodBandCaution: '50–79 Cuidado — há pontos para observar.',
  methodBandHigh: '0–49 Alto risco — muitos sinais de alerta.',
  methodExclusionsTitle: 'O que não conta como baleia',
  methodExclusionsText:
    'Contas de pool de liquidez verificadas, o endereço de burn e carteiras de exchange verificadas são excluídos do Top 10 — esse supply não é uma única baleia.',
  methodSourcesTitle: 'Fontes de dados',
  methodSourcesText:
    'RPC Solana (via proxy Cloudflare para a Helius) para dados on-chain, DexScreener para dados de mercado, Jupiter para a checagem de vendabilidade.',
  methodExtrasTitle: 'Verificações extras (fora da pontuação de 100)',
  methodExtrasText:
    'Vendável (Jupiter), LP Burn/Lock e Metadados do Token — informativas, não somam nem subtraem pontos. Regra do LP: maior detentor de LP acima de 15% = Cuidado, 15% ou menos = seguro.',
  themeToDark: 'Mudar para o modo escuro',
  themeToLight: 'Mudar para o modo claro',
  // v7.4 — plain-language risk summary
  summaryBut: 'mas',
  summaryAnd: 'e',
  summaryFatalLead: 'Perigo detectado:',
  summaryFatalNoSell: 'nenhuma rota de venda encontrada no Jupiter — o token pode não ser vendável',
  summaryFatalExt: (names, implication) => `extensões perigosas do Token-2022 (${names}) — ${implication}`,
  summaryFatalExtImplDelegate: 'o dev pode retirar tokens da carteira de qualquer holder',
  summaryFatalExtImplHook: 'as transferências podem ser interceptadas ou bloqueadas',
  summaryFatalExtImplFee: 'a taxa de transferência pode ser aumentada unilateralmente pelo dev',
  summaryFatalMint:
    'A Mint Authority ainda está ativa — o dev pode criar supply extra a qualquer momento',
  summaryFatalFreeze:
    'A Freeze Authority ainda está ativa — o dev pode congelar tokens na carteira de qualquer pessoa',
  summaryFatalTop1: (pct) => `uma única carteira controla a maioria do supply (${pct})`,
  summaryFatalTop10: (pct) => `as 10 maiores carteiras controlam ${pct} do supply`,
  summaryFatalConsequence: 'O risco de rug pull é muito alto.',
  summaryFatalNoSellConsequence: 'Um token que não pode ser vendido de volta deixa seus fundos presos.',
  summaryFatalTop1Consequence: 'Uma única carteira pode derrubar o preço a qualquer momento.',
  summaryCleanOpener:
    'Contrato limpo: o dev não pode criar novos tokens nem congelar saldos',
  summaryCleanOpenerUnknown:
    'Pelos dados disponíveis, nenhum perigo fatal foi detectado no contrato',
  summaryDeepLiquidity: 'a liquidez de mercado é suficientemente profunda',
  summaryTop1Note: (pct) =>
    `Observação: a maior carteira detém ${pct} do supply — confira no Solscan se é uma carteira de exchange/pool ou de uma pessoa.`,
  summaryPriceReminder:
    'Lembre-se: esta pontuação avalia o contrato e o mercado — não garante que o preço vai subir.',
  summaryHoldersUnavailable:
    'A distribuição de holders não foi verificada, então a pontuação é limitada a 79 (Cuidado) até que os dados possam ser lidos.',
  summaryMarketConsequence: 'Vulnerável a slippage alto e dumps repentinos.',
  summaryNoMarket: 'ainda não há dados de mercado porque nenhum pool foi detectado',
  summaryNoMarketConsequence:
    'Sem mercado, o preço do token não pode ser avaliado e o token é difícil de vender.',
  summaryFlagTop10: (pct) => `as 10 maiores carteiras controlam ${pct} do supply`,
  summaryFlagBundle: 'um possível bundle de dev / rede de insiders foi detectado',
  summaryFlagThinLiq: (v) => `a liquidez é fina (${v})`,
  summaryFlagMildLiq: (v) => `a liquidez ainda é pequena (${v})`,
  summaryFlagNewPair: 'este token ainda é muito novo (menos de 24 horas)',
  summaryFlagYoungPair: (days) => `este par tem apenas ${days}`,
  summaryFlagLpNotBurned: (pct) =>
    `o LP não foi queimado — o maior detentor de LP possui ${pct}`,
  summaryFlagMetadataMutable: 'os metadados do token ainda podem ser alterados pelo dev',
  summaryFlagBonding: 'o token ainda está na bonding curve e ainda não tem LP em DEX',
};
