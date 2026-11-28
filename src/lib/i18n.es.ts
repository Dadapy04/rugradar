// RugRadar — Spanish (es) strings.
// Neutral Latin American Spanish translation of the English strings in i18n.ts.

import type { Dict } from './i18n';

export const es: Dict = {
  tagline:
    'Verifica la seguridad de una memecoin de Solana antes de comprar: un puntaje de seguridad de 0 a 100 en segundos.',
  pageTitle: 'RugRadar — Escáner de Seguridad de Tokens de Solana',
  fieldLabel: 'Dirección del Mint del Token (Solana)',
  placeholder: 'Ejemplo: DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  scanButton: 'Escanear Token',
  scanningButton: 'Escaneando…',
  tryExamples: 'Prueba un ejemplo:',
  emptyMintError: 'Pega primero una dirección de mint de un token de Solana.',
  evmError:
    'Esta es una dirección EVM (0x…), no una dirección de Solana. Pega una dirección de mint de Solana.',
  invalidError:
    'Dirección no válida: una dirección de mint de Solana tiene letras y dígitos en base58, de 32 a 44 caracteres.',
  notMintError: 'Esta dirección no es el mint de un token: es la dirección de una billetera o cuenta común.',
  mintNotFoundError:
    'No se encontró ninguna cuenta en esta dirección: es posible que el mint no exista o que la dirección esté mal.',
  genericError: 'No se pudo escanear el token. Revisa la dirección del mint e inténtalo de nuevo.',
  rpcErrorPrefix: 'No se pudo leer el mint desde el RPC de Solana',
  loadingText: 'Leyendo datos on-chain de Solana + datos de mercado de DexScreener…',
  loadingStep1: '1/3 Leyendo datos del mint desde Solana…',
  loadingStep2: '2/3 Calculando la concentración de holders…',
  loadingStep3: '3/3 Obteniendo datos de mercado de DexScreener…',
  howTitle: 'Cómo funciona RugRadar',
  howStep1: 'Pega la dirección del mint de un token de Solana (no la de una billetera).',
  howStep2: 'RugRadar lee datos on-chain y de mercado: autoridades, holders, liquidez.',
  howStep3: 'Obtén un puntaje de seguridad de 0 a 100 + un veredicto: gratis, sin billetera y sin registro.',
  verdictAman: 'Seguro',
  verdictWaspada: 'Precaución',
  verdictBerisiko: 'Alto riesgo',
  verdictTextAman: 'No hay señales de alerta importantes: las revisiones principales se ven bien. Aun así, haz tu propia investigación (DYOR): un puntaje no es una garantía.',
  verdictTextWaspada:
    'Hay algunos puntos a tener en cuenta antes de comprar. Lee los detalles de las revisiones abajo.',
  verdictTextBerisiko:
    'Muchas señales de alerta. No compres antes de entender los riesgos: podría ser un rug pull o un token poco saludable.',
  verdictTextBerisikoNoMarket:
    'No se detectó ningún pool ni liquidez para este token. Eso no prueba que sea un rug pull — puede que recién se haya lanzado — pero sin mercado no se puede evaluar el precio y es difícil vender el token. Espera a que haya un pool activo o descártalo.',
  badgePass: 'SEGURO',
  badgeWarn: 'PRECAUCIÓN',
  badgeFair: 'ACEPTABLE',
  badgeFail: 'PELIGRO',
  badgeInfo: 'INFO',
  badgeUnavailable: 'NO DISPONIBLE',
  badgeNa: 'N/A',
  holderLow: 'BAJO',
  holderMid: 'MEDIO',
  holderHigh: 'ALTO',
  extraCheck: 'revisión extra',
  points: 'pts',
  gaugeLabel: (s) => `Puntaje de seguridad del token: ${s} de 100`,
  statsPrice: 'Precio',
  statsMarketCap: 'Market Cap',
  statsLiquidity: 'Liquidez (par principal)',
  statsVolume24h: 'Volumen 24 h (par principal)',
  statsPriceChange24h: 'Precio 24 h',
  statsTxns24h: 'Transacciones 24 h',
  statsSupply: 'Suministro Total',
  statsTop10: 'Top 10 de Holders',
  statsGroupMarket: 'Mercado',
  statsGroupToken: 'Token',
  checksHeading: 'Detalles de las Revisiones',
  topHoldersHeading: 'Top 5 de Holders',
  scannedAt: 'Escaneado',
  viewOnDexscreener: 'DexScreener',
  viewOnSolscan: 'Solscan',
  viewOnBubblemaps: 'Bubblemaps',
  lostLine: (lost, reason) => `−${lost} pts: ${reason}`,
  safetyScoreLabel: 'Puntaje de Seguridad',
  riskLevelLine: (level) => `Nivel de Riesgo: ${level}`,
  riskLow: 'Bajo',
  riskMid: 'Medio',
  riskHigh: 'Alto',
  holdersExcludedNote: (kinds) => `Excluidos: ${kinds}.`,
  holdersExcludedNone: 'Incluye la cuenta del pool de liquidez si existe.',
  excludedPool: 'cuenta del pool de liquidez',
  excludedBurn: 'dirección de quema',
  excludedExchange: 'billeteras de exchanges',
  clearInput: 'Limpiar',
  pasteInput: 'Pegar',
  pasteFailed: 'No se pudo leer el portapapeles: pega la dirección manualmente.',
  copyAddress: 'Copiar dirección del mint',
  addressCopied: 'Dirección copiada ✓',
  share: 'Compartir',
  shareTitle: 'RugRadar — resultado del escaneo de token',
  shareText: (name, symbol, score) =>
    `RugRadar: ${name} (${symbol}) — puntaje de seguridad ${score}/100`,
  copyResult: 'Copiar resultado',
  copyLink: 'Copiar enlace',
  copied: 'Copiado ✓',
  copyFailed: 'No se pudo copiar: cópialo manualmente desde la dirección o el resultado de arriba.',
  copySummary: (s) =>
    `RugRadar — ${s.name} (${s.symbol}): ${s.score}/100 ${s.verdict}\n${s.summary ? `${s.summary}\n` : ''}${s.checks}\nhttps://dadapy04.github.io/rugradar/?mint=${s.mint}`,
  footerScoring:
    'Cómo funciona el puntaje de seguridad (total 100): Mint Authority 20 · Freeze Authority 20 · Concentración de Holders 30 · Liquidez y Mercado 30.',
  footerDisclaimer:
    'RugRadar solo lee datos públicos (RPC de Solana + DexScreener). Esto no es asesoría financiera: haz siempre tu propia investigación (DYOR) antes de comprar cualquier token.',
  mint: {
    title: 'Mint Authority',
    detailRevoked: 'Ya fue revocada: nadie puede acuñar nuevos tokens.',
    detailActive:
      'SIGUE ACTIVA: el propietario puede acuñar nuevos tokens en cualquier momento y diluir el precio.',
    explanation:
      'Si la Mint Authority sigue activa, el desarrollador puede aumentar el suministro a voluntad. Los tokens seguros por lo general la tienen revocada.',
  },
  freeze: {
    title: 'Freeze Authority',
    detailRevoked: 'Ya fue revocada: nadie puede congelar las billeteras de los holders.',
    detailActive: 'SIGUE ACTIVA: el propietario puede congelar los tokens en la billetera de cualquier persona.',
    explanation:
      'Una Freeze Authority activa significa que alguien puede bloquear tus tokens para que no puedas venderlos. Los tokens seguros la tienen revocada.',
  },
  holdersTitle: 'Concentración de Holders (Top 10)',
  holdersUnavailable: 'No se pudieron obtener los datos de holders desde el RPC en este momento.',
  holdersScoreDefault: '15/30 (valor neutral por defecto: datos sin verificar)',
  holdersDetail: (top10, top1) =>
    `Las 10 billeteras principales tienen el ${top10} del suministro total (billetera más grande: ${top1}).`,
  holdersExplanation:
    'Mientras menor sea la parte en manos de unas pocas billeteras, menor es el riesgo de que una ballena venda en masa y desplome el precio. Por encima del 50 % es una señal de alerta.',
  liquidityTitle: 'Liquidez y Actividad del Mercado',
  liquidityNoPair:
    'No se encontró ningún pool de trading para este token: es posible que aún no tenga mercado o que el token esté muerto.',
  liquidityDexError:
    'No se pudieron obtener los datos de mercado (DexScreener) en este momento: esta revisión se omitió.',
  liquidityDetail: (liq, vol, ageDays, dex) =>
    `Par principal: liquidez ${liq}, volumen de 24 h ${vol}, antigüedad del pool ${ageDays} (DEX: ${dex}).`,
  liquidityExplanation:
    'La liquidez baja hace que el precio sea fácil de manipular y que te cueste vender. Un pool antiguo más un volumen diario saludable es señal de un mercado activo.',
  sellableTitle: 'Se Puede Vender (Revisión de Honeypot)',
  sellableOk: 'Jupiter encontró una ruta de venta a SOL: este token se puede vender en un DEX.',
  sellableWarn:
    'Jupiter no encontró una ruta de venta a SOL: posible honeypot, o el token aún no tiene un mercado en el que se pueda vender.',
  sellableUnavailable:
    'La revisión de venta no se pudo ejecutar en este momento (Jupiter no respondió): esto no significa que el token no se pueda vender, intenta escanear de nuevo.',
  sellableExplanation:
    'Revisión extra (fuera del puntaje de 100): los tokens honeypot se pueden comprar pero no vender. Si no hay ruta de venta, no compres.',
  mintLostReason: 'la Mint Authority sigue activa',
  freezeLostReason: 'la Freeze Authority sigue activa',
  holdersLostNoData: 'datos de holders sin verificar: el puntaje total queda limitado a 79 (Precaución)',
  holdersLostDetail: (top10) => `El Top 10 tiene el ${top10} del suministro`,
  // v7.6 — dev-bundle heuristic
  bundleTitle: 'Bundle de Dev / Billeteras Coordinadas',
  bundleOk: (buyers, share) =>
    `No se detectó ningún patrón de bundle en las transacciones iniciales (${buyers} billeteras en el slot de lanzamiento, con un total combinado del ${share} del suministro).`,
  bundleSuspected: (buyers, share) =>
    `Posible bundle de dev: ${buyers} billeteras distintas compraron en el slot de lanzamiento con un total combinado del ${share} del suministro; podría ser una sola persona lista para vender todo junto.`,
  bundleSuspectedRc: (wallets, share) =>
    `Posible bundle de dev (RugCheck): una red de insiders de ${wallets} billeteras aún tiene el ${share} del suministro; podría ser una sola persona lista para vender todo junto.`,
  bundleOkRc: (wallets, share) =>
    `No se detectó una red de insiders grande (RugCheck): la red más grande tiene el ${share} del suministro en ${wallets} billeteras.`,
  bundleSkipped:
    'Solo se revisa en tokens jóvenes (par de menos de 7 días): este token es demasiado antiguo para un patrón de bundle de lanzamiento.',
  bundleUnavailable:
    'No se pudieron leer los datos de las transacciones iniciales: el patrón de bundle no se pudo verificar.',
  bundleTooDeep:
    'Este token tiene demasiado historial de transacciones para leerlo desde el navegador: el patrón de bundle no se pudo verificar, revísalo manualmente en Bubblemaps / RugCheck.',
  bundleExplanation:
    'Los devs deshonestos reparten el suministro entre muchas billeteras mediante un solo Jito Bundle en el slot de lanzamiento, para que cada billetera parezca pequeña. Revisa el mapa de clústeres en Bubblemaps / RugCheck antes de confiar en el puntaje de holders.',
  bundleCapNote:
    'Como se sospecha un bundle, la puntuación total está limitada a 79, no porque se haya probado un peligro, sino porque la distribución aún no es confiable.',
  liquidityLostNoPair: 'sin pool ni datos de mercado',
  liqPartLow: (v) => `liquidez ${v}`,
  agePartLow: (v) => `antigüedad del pool ${v}`,
  volPartLow: (v) => `volumen de 24 h ${v}`,
  lpTitle: 'LP Quemado/Bloqueado',
  lpBurned: (pct) =>
    `El ${pct} de los LP ya se quemó (incinerador): el dev no puede retirar la liquidez.`,
  lpMostlySafe: (top1) =>
    `El mayor holder restante de LP tiene el ${top1} y solo podría retirar como máximo el ${top1} de la liquidez.`,
  lpNotBurned: (top1) =>
    `No se comprobó que el LP esté quemado o bloqueado: el mayor holder de LP tiene el ${top1} y podría retirar la liquidez.`,
  lpUnavailable:
    'No se puede revisar el LP de este pool (no es un pool de Raydium o no se pudieron leer los datos del LP).',
  lpExplanation:
    'Revisión extra (fuera del puntaje de 100): cuando los tokens LP se queman, el desarrollador no puede retirar la liquidez ni hacer un rug pull. Si el LP sigue en manos de una billetera, el riesgo permanece.',
  metadataTitle: 'Metadatos del Token',
  metadataImmutable:
    'Los metadatos están bloqueados (inmutables): el nombre, el símbolo y la URI ya no se pueden cambiar.',
  metadataMutable:
    'Los metadatos aún se pueden cambiar (mutables): el desarrollador puede cambiar el nombre, el símbolo o la URI del token.',
  metadataUnavailable: 'No hay cuenta de metadatos o no se pueden leer los metadatos de este token.',
  metadataExplanation:
    'Revisión extra (fuera del puntaje de 100): los metadatos mutables significan que la presentación del token (nombre, logo, descripción) aún se puede cambiar después del lanzamiento.',
  thousand: 'mil',
  million: 'M',
  days: 'días',
  unknownName: 'Desconocido',
  eyebrow: 'Escáner de Seguridad de Tokens · Solana',
  pairConvertedNote: (name, symbol) =>
    `Se detectó una dirección de par: su token base es ${name} (${symbol}), que es el que se escaneó.`,
  pairGuidanceError:
    'Esta dirección no es el mint de un token (puede ser la dirección de un par/pool o de una billetera) y no se pudo encontrar su token base en DexScreener. Pega la dirección del mint del token, no la del pool.',
  marketCardTitle: 'Contexto del Mercado',
  marketRatioLabel: 'Liquidez / Market Cap',
  marketAgeLabel: 'Antigüedad del Par',
  marketTotalLiquidityLabel: 'Liquidez (total de DEX)',
  marketTotalVolumeLabel: 'Volumen 24 h (total de DEX)',
  marketTopPairNote: (v) => `par principal: ${v}`,
  marketThinWarning: (ratio) =>
    `Liquidez muy baja: solo el ${ratio} del market cap. El precio puede moverse bruscamente con operaciones pequeñas y el token puede ser difícil de vender, incluso con la Mint Authority y la Freeze Authority revocadas.`,
  marketThinCexNote: (ratio) =>
    `La liquidez DEX parece baja frente al market cap (${ratio}), pero el volumen de 24 horas sigue siendo saludable, porque la mayor parte del trading de un token grande ocurre en CEX, no en DEX. Esta ratio por sí sola no es una señal de peligro.`,
  txnsBuy: 'Compra',
  txnsSell: 'Venta',
  bondingCurveLabel: 'Aún en la Bonding Curve: todavía no migró a un DEX',
  lpBondingCurve:
    'Este token aún está en la bonding curve: todavía no hay un LP tradicional, así que la revisión de quema de LP no aplica.',
  lpOrca:
    'No aplica a los pools de Orca (liquidez concentrada): no hay token LP que quemar, así que esta revisión se omite.',
  lpMeteora:
    'No aplica a los pools de Meteora (liquidez concentrada / DLMM): no hay token LP que quemar, así que esta revisión se omite.',
  token2022Title: 'Extensiones de Token-2022',
  token2022Standard:
    'Token SPL estándar (no es Token-2022): sin extensiones peligrosas.',
  token2022Clean: 'Token-2022 sin extensiones peligrosas detectadas.',
  token2022Found: (names) =>
    `Token-2022 con extensiones peligrosas detectadas: ${names}.`,
  token2022Unavailable: 'No se pudieron revisar las extensiones de Token-2022 en este momento.',
  token2022NoPenalty: 'Sin penalización',
  token2022PenaltyLabel: (n) => `−${n} pts`,
  token2022Explanation:
    'Penalización del puntaje: las extensiones peligrosas de Token-2022 restan del puntaje total: Permanent Delegate −15 pts, Transfer Fee −10 pts, Transfer Hook −10 pts (máx. −35). Permanent Delegate permite al dev retirar o quemar tokens de las billeteras de los holders, Transfer Fee es un impuesto que se puede subir de forma unilateral y Transfer Hook se puede usar para honeypots.',
  extPermanentDelegate: 'Permanent Delegate',
  extTransferFee: 'Transfer Fee',
  extTransferHook: 'Transfer Hook',
  recentScansTitle: 'Escaneados recientemente:',
  recentHint: 'Toca un chip para volver a escanear.',
  rescan: 'Volver a Escanear',
  historyDiffLabel: 'Desde el último escaneo',
  historyNoChange: 'Sin cambios desde el último escaneo',
  historyVerdictChanged: (from, to) => `Veredicto cambió: ${from} → ${to}`,
  historyBetter: 'la puntuación mejoró',
  historyWorse: 'la puntuación empeoró',
  batchTitle: 'Escaneo por Lotes',
  batchPlaceholder: 'Una dirección mint por línea (máx. 10)',
  batchScanButton: 'Escanear Todo',
  batchScanning: (done, total) => `Escaneando ${done}/${total}…`,
  batchEmptyError: 'Ingresa al menos una dirección mint.',
  batchMaxError: 'Máximo 10 tokens por lote.',
  batchColToken: 'Token',
  batchColScore: 'Puntaje',
  batchColVerdict: 'Veredicto',
  batchClickHint: 'Toca una fila para ver el resultado completo.',
  batchInvalidLines: (n) => `Se omitieron ${n} líneas inválidas.`,
  shareCardButton: 'Compartir Imagen',
  shareCardSaved: 'Imagen guardada',
  shareCardFailed: 'No se pudo crear la imagen.',
  freshChecking: 'Revisando la antigüedad de las billeteras…',
  freshLine: (fresh, total) => `${fresh} de ${total} holders principales son billeteras nuevas (<7 días)`,
  freshNone: 'Ningún holder principal es una billetera nueva (<7 días)',
  freshUnknown: (n) => `${n} billeteras no se pudieron revisar`,
  freshSectionTitle: 'Antigüedad de las billeteras',
  freshExplanation:
    'Una billetera nueva por sí sola no prueba una estafa, pero varios tenedores principales creados al mismo tiempo pueden pertenecer a una misma persona.',
  // v7.12.5 — post-launch inter-wallet transfers
  transfersChecking: 'Revisando transferencias entre billeteras…',
  transfersLine: (involved, total) =>
    `${involved} de los ${total} holders principales movieron tokens entre billeteras tras el lanzamiento`,
  transfersNeutral: (involved, total) =>
    `${involved} de los ${total} holders principales recibieron tokens de una misma fuente — un patrón común de distribuidores / creadores de mercado en tokens grandes`,
  transfersNone: 'No se detectaron transferencias entre billeteras entre los 5 holders principales',
  transfersUnavailable: 'No se pudieron revisar las transferencias entre billeteras',
  transfersSharedSource: 'fuente compartida',
  transfersSectionTitle: 'Transferencias entre billeteras',
  lpUnlockTitle: 'Desbloqueo de LP',
  lpUnlockWarning: (days, date) => `El LP se desbloquea en ${days} días (${date})`,
  updatedJustNow: 'Actualizado hace un momento',
  updatedMinutes: (n) => `Actualizado hace ${n} min`,
  updatedHours: (n) => `Actualizado hace ${n} h`,
  methodTitle: 'Cómo Funciona el Puntaje',
  methodClose: 'Cerrar',
  methodIntro:
    'RugRadar asigna un puntaje de seguridad de 0 a 100. Mientras más alto, más seguro. El puntaje se calcula a partir de datos públicos on-chain y de mercado.',
  methodWeightsTitle: 'Pesos del puntaje (total 100)',
  methodWeightMint: 'Mint Authority: 20 pts',
  methodWeightFreeze: 'Freeze Authority: 20 pts',
  methodWeightHolders: 'Concentración de Holders (Top 10): 30 pts',
  methodHoldersNote:
    'Si no se pueden leer los datos de holders, se asigna un valor neutral de 15/30 y el total queda limitado a 79: nunca será Seguro.',
  methodBundleTitle: 'Detección de Bundle (Nivel 2)',
  methodBundleText:
    'Solo para tokens jóvenes (par de menos de 7 días). Dos señales: la heurística del RPC (4 o más billeteras distintas compraron en el slot de lanzamiento con un total combinado de más del 15 % del suministro) y las redes de insiders de RugCheck (una red con más del 15 % del suministro). Si alguna se activa, el token se marca como posible bundle y el total queda limitado a 79. No es una prueba: confírmalo en Bubblemaps / RugCheck.',
  methodWeightLiquidity: 'Liquidez y Mercado: 30 pts',
  methodLiquidityNote:
    'Nota: la tarjeta de contexto del mercado muestra la liquidez total y el volumen de 24 h sumados de todos los pares de DEX, mientras que la revisión de Liquidez y Mercado que entra en el puntaje solo usa el par con mayor liquidez.',
  methodPenaltyTitle: 'Penalización de Token-2022 (máx. −35 pts)',
  methodPenaltyText:
    'Los tokens con extensiones peligrosas de Token-2022 pierden puntos del puntaje total: Permanent Delegate −15, Transfer Fee −10, Transfer Hook −10. Los tokens SPL estándar no tienen penalización.',
  methodBandsTitle: 'Qué significa el puntaje',
  methodBandSafe: '80–100 Seguro: pasó todas las revisiones principales.',
  methodBandCaution: '50–79 Precaución: hay puntos a tener en cuenta.',
  methodBandHigh: '0–49 Alto riesgo: muchas señales de alerta.',
  methodExclusionsTitle: 'Qué no se cuenta como ballena',
  methodExclusionsText:
    'Las cuentas verificadas de pools de liquidez, la dirección de quema y las billeteras verificadas de exchanges se excluyen del Top 10: ese suministro no pertenece a una sola ballena.',
  methodSourcesTitle: 'Fuentes de datos',
  methodSourcesText:
    'RPC de Solana (mediante el proxy de Cloudflare a Helius) para los datos on-chain, DexScreener para los datos de mercado y Jupiter para la revisión de venta.',
  methodExtrasTitle: 'Revisiones extra (fuera del puntaje de 100)',
  methodExtrasText:
    'Se Puede Vender (Jupiter), LP Quemado/Bloqueado y Metadatos del Token: son informativas, no suman ni restan puntos. Regla del LP: el mayor holder de LP por encima del 15 % = Precaución, 15 % o menos = seguro.',
  themeToDark: 'Cambiar a modo oscuro',
  themeToLight: 'Cambiar a modo claro',
  // v7.4 — plain-language risk summary
  summaryBut: 'pero',
  summaryAnd: 'y',
  summaryFatalLead: 'Peligro detectado:',
  summaryFatalNoSell: 'no se encontró ruta de venta en Jupiter: es posible que el token no se pueda vender',
  summaryFatalExt: (names, impl) => `extensiones peligrosas de Token-2022 (${names}): ${impl}`,
  summaryFatalExtImplDelegate: 'el dev puede retirar tokens de la billetera de cualquier holder',
  summaryFatalExtImplHook: 'las transferencias pueden ser interceptadas o bloqueadas',
  summaryFatalExtImplFee: 'el impuesto de transferencia puede ser subido de forma unilateral por el dev',
  summaryFatalMint:
    'La Mint Authority sigue activa: el dev puede acuñar suministro adicional en cualquier momento',
  summaryFatalFreeze:
    'La Freeze Authority sigue activa: el dev puede congelar tokens en la billetera de cualquier persona',
  summaryFatalTop1: (pct) => `una sola billetera controla la mayoría del suministro (${pct})`,
  summaryFatalTop10: (pct) => `las 10 billeteras principales controlan el ${pct} del suministro`,
  summaryFatalConsequence: 'El riesgo de rug pull es muy alto.',
  summaryFatalNoSellConsequence: 'Un token que no se puede volver a vender deja tus fondos atrapados.',
  summaryFatalTop1Consequence: 'Una sola billetera podría desplomar el precio en cualquier momento.',
  summaryCleanOpener:
    'Contrato limpio: el dev no puede acuñar nuevos tokens ni congelar saldos',
  summaryCleanOpenerUnknown:
    'Según los datos disponibles, no se detectó ningún peligro fatal en el contrato',
  summaryDeepLiquidity: 'la liquidez del mercado es lo suficientemente profunda',
  summaryTop1Note: (pct) =>
    `Nota: la billetera más grande tiene el ${pct} del suministro: revisa en Solscan si es una billetera de exchange/pool o de una persona.`,
  summaryPriceReminder:
    'Recuerda: este puntaje evalúa el contrato y el mercado, no garantiza que el precio vaya a subir.',
  summaryHoldersUnavailable:
    'La distribución de holders no se pudo verificar, así que el puntaje queda limitado a 79 (Precaución) hasta que se puedan leer los datos.',
  summaryMarketConsequence: 'Vulnerable a slippage grande y a ventas masivas repentinas.',
  summaryNoMarket: 'aún no hay datos de mercado porque no se detectó ningún pool',
  summaryNoMarketConsequence:
    'Sin mercado, no se puede evaluar el precio del token y es difícil venderlo.',
  summaryFlagTop10: (pct) => `las 10 billeteras principales controlan el ${pct} del suministro`,
  summaryFlagBundle: 'se detectó un posible bundle de dev / red de insiders',
  summaryFlagThinLiq: (v) => `la liquidez es baja (${v})`,
  summaryFlagMildLiq: (v) => `la liquidez aún es pequeña (${v})`,
  summaryFlagNewPair: 'este token aún es muy nuevo (menos de 24 horas)',
  summaryFlagYoungPair: (days) => `este par tiene solo ${days} de antigüedad`,
  summaryFlagLpNotBurned: (pct) =>
    `el LP no está quemado: el mayor holder de LP tiene el ${pct}`,
  summaryFlagMetadataMutable: 'los metadatos del token aún pueden ser cambiados por el dev',
  summaryFlagBonding: 'el token aún está en la bonding curve y todavía no tiene LP en un DEX',
};
