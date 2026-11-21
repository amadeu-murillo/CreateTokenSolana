import { TranslationDictionary } from "../types";
import { PRICING_SOL, formatSolAmount, getTokenCreationFeeRangeSol } from "@/config/pricing";

const FEE_RANGE = getTokenCreationFeeRangeSol();

const dictionary: TranslationDictionary = {
  nav: {
    createToken: "Crear Token",
    liquidityPool: "Pool de Liquidez",
    burn: "Quemar / Reclaim",
    airdrop: "Airdrop Masivo",
    manage: "Autoridades",
    affiliates: "Afiliados (30%)",
    docs: "Docs",
  },
  wallet: {
    connect: "Conectar Billetera",
    connecting: "Conectando...",
    copyAddress: "Copiar Dirección",
    copied: "✓ ¡Copiado!",
    changeWallet: "Cambiar Billetera",
    viewExplorer: "Ver en Solscan ↗",
    disconnect: "Desconectar Billetera",
    balanceLabel: "Saldo en Red",
  },
  network: {
    mainnetShort: "Mainnet (Real)",
    devnetShort: "Devnet (Prueba)",
    mainnetBannerTitle: "RED PRINCIPAL ACTIVA: SOLANA MAINNET-BETA",
    mainnetBannerDesc:
      "Estás operando en Producción. Todos los tokens, pools y tarifas utilizan SOL real en la blockchain.",
    devnetBannerTitle: "MODO DE PRUEBA ACTIVO: SOLANA DEVNET (SANDBOX)",
    devnetBannerDesc:
      "¡Entorno de simulación gratuito! Los tokens creados en Devnet son solo para pruebas y no tienen valor comercial.",
    switchToDevnet: "Probar en Devnet →",
    switchToMainnet: "Ir a Mainnet (Producción) →",
    faucetBtn: "🚰 +1 SOL Gratis (Faucet)",
    faucetLoading: "Enviando +1 SOL...",
    faucetSuccess: "✓ ¡+1 SOL Recibido!",
  },
  home: {
    heroBadgeMainnet: "🟢 Producción On-Chain · Solana Mainnet-Beta",
    heroBadgeDevnet: "🟠 Modo de Simulación · Solana Devnet",
    heroTitle: "Crea Tu Token en Solana en Segundos",
    heroSubtitle:
      "Lanza tokens SPL o Token-2022 con blindaje RugCheck 100/100, metadatos inmutables en Arweave y Pool de Liquidez sin programar.",
    costSummaryTitle: "Resumen de Costos (Modular)",
    quickGuideTitle: "Guía Rápida",
    suiteTitle: "Ecosistema Completo para Tu Token",
    suiteSubtitle:
      "Todo lo que necesitas tras crear tu token: agregar liquidez, certificado PNG de quema, recuperar SOL de cuentas vacías y airdrops masivos.",
    faqTitle: "Preguntas Frecuentes (FAQ)",
    quickGuide: [
      {
        title: "¿Qué es un Token SPL?",
        description:
          "El estándar oficial de tokens fungibles en Solana. Compatible con todas las billeteras (Phantom, Solflare) y DEXs (Raydium, Meteora, Jupiter).",
      },
      {
        title: "¿Qué es Token-2022?",
        description:
          "La nueva generación del programa de tokens de Solana que admite Comisión de Transferencia automática (Tax Token) a nivel de protocolo.",
      },
      {
        title: "RugCheck 100/100 (Mint & Freeze)",
        description:
          "Revocar Freeze Authority habilita Pools de Liquidez (+50 pts). Revocar Mint Authority fija el suministro (+35 pts) y Metadatos Inmutables suma +15 pts.",
      },
      {
        title: "Mainnet-Beta vs. Devnet",
        description:
          "En Mainnet-Beta tu token es real y negociable. En Devnet puedes probar gratis usando el botón Faucet de +1 SOL.",
      },
    ],
    ecosystemDesc: {
      liquidityPool:
        "Inicializa o retira liquidez en SOL en Raydium CPMM o Meteora Dynamic AMM en 1 clic.",
      burn: "Quema tokens/LP con Certificado PNG oficial y recupera SOL de cuentas vacías.",
      airdrop:
        "Distribuye tokens a cientos de billeteras con creación automática de cuentas ATA.",
      manage: "Inspecciona el puntaje RugCheck y revoca autoridades de Mint o Freeze on-chain.",
      affiliates:
        "Genera tu enlace exclusivo y gana 30% de comisión en SOL al instante en cada transacción.",
      docs: "Guías paso a paso sobre tokenomics, liquidez, seguridad y auditoría RugCheck.",
    },
  },
  form: {
    targetNetwork: "Red Seleccionada:",
    totalModularFee: "Tarifa Modular Total:",
    step1: "1. Identidad del Token",
    step2: "2. Logo y Redes",
    step3: "3. Seguridad y Mint",
    tokenName: "Nombre del Token",
    tokenSymbol: "Símbolo (Ticker)",
    decimals: "Decimales (0 – 9)",
    supply: "Suministro Inicial Total",
    storagePipeline: "Almacenamiento de Logo y Metadatos",
    logoLabel: "Logo del Token (PNG, JPG, WEBP, GIF — Máx 5MB)",
    dropzonePrompt: "Arrastra y suelta el logo aquí, o haz clic para seleccionar",
    uploadingImg: "Subiendo y verificando imagen...",
    description: "Descripción del Proyecto (Opcional)",
    website: "Sitio Web Oficial (Opcional)",
    twitter: "X / Twitter (Opcional)",
    instagram: "Instagram (Opcional)",
    customCreatorTitle: 'Personalizar "Creator Info" en Metadatos',
    customCreatorDesc:
      "Reemplaza la firma predeterminada en los metadatos con el nombre y sitio de tu proyecto.",
    creatorName: "Nombre del Creador / Estudio",
    creatorUrl: "Sitio Oficial del Creador",
    tokenStandard: "Estándar del Programa Solana",
    standardSpl: "SPL Estándar (Compatibilidad Universal)",
    standard2022: "Token-2022 (Extensión Tax Token / Transfer Fee)",
    securityTitle: "Seguridad On-Chain y RugCheck 100/100 (Upsell Modular)",
    revokeFreezeTitle: "Revocar Freeze Authority (Recomendado)",
    revokeFreezeDesc:
      "Obligatorio para crear Pool de Liquidez en Raydium/Meteora y operar en Jupiter (+50 pts RugCheck).",
    revokeMintTitle: "Revocar Mint Authority (Recomendado)",
    revokeMintDesc:
      "Fija el suministro al 100% e impide emitir nuevos tokens (+35 pts RugCheck).",
    immutableTitle: "Metadatos Inmutables (Immutable)",
    immutableDesc:
      "Bloquea permanentemente nombre, símbolo e imagen en los exploradores (+15 pts RugCheck).",
    backBtn: "← Atrás",
    continueBtn: "Continuar →",
    submitMainnet: "🚀 Crear Token en Mainnet-Beta",
    submitDevnet: "🧪 Crear Token de Prueba en Devnet",
  },
  costs: {
    headerTitle: "Transparencia de Costos On-Chain",
    headerBadge: "100% Atómico",
    rentLabel: "Alquiler de red (Rent):",
    networkFeeLabel: "Tarifa de red:",
    serviceFeeLabel: "Tarifa de servicio:",
    baseCreate: "Tarifa Base de Creación (Token Mint)",
    revokeFreeze: "Revocar Freeze Authority (Pool Ready)",
    revokeMint: "Revocar Mint Authority (Suministro Fijo)",
    immutable: "Metadatos Inmutables (Immutable)",
    customCreator: "Personalizar Creator Info (Metadatos)",
    transferFeeExt: "Extensión Tax Token / Transfer Fee (Token-2022)",
    totalModular: "Total Tarifa Modular:",
    networkRent: "Rent de Red Solana (Est.):",
    estimatedWalletTotal: "Total Estimado",
    singleSignatureSub: "Firma única en billetera",
    atomicDisclaimer:
      "Cobro atómico en la misma transacción con división instantánea de 30% para afiliados y 70% para Dev Wallet.",
  },
  common: {
    activeNetwork: "Red Activa:",
    refreshWallet: "↻ Actualizar Billetera",
    availableBalance: "Saldo Disponible:",
    walletBalance: "Saldo en Billetera:",
    copy: "Copiar",
    copied: "✓ ¡Copiado!",
    viewOnSolscan: "Ver en Solscan ↗",
    loading: "Cargando...",
    cancel: "Cancelar",
    confirmAndRevoke: "Confirmar y Revocar",
    signingAndConfirming: "Firmando y Confirmando...",
    irreversibleWarning: "⚠️ Acción Irreversible On-Chain",
  },
  tokenSelector: {
    loadingAria: "Cargando tokens de la billetera",
    balancePrefix: "Saldo:",
    noTokensDetected: "No se detectaron tokens en tu billetera conectada en esta red",
    clickToChoose: "Haz clic para elegir un token de tu billetera conectada",
    dropdownHeader: "Activos en Billetera Conectada — Haz Clic para Seleccionar",
    lpPoolTokenTag: "LP Pool Token",
  },
  tokenPreview: {
    cardTitle: "Simulador de Billetera y Auditoría",
    cardDesc:
      "Vista previa en tiempo real de cómo se verá tu activo en Phantom, Solflare y DexScreener.",
    headerLabel: "VISTA PREVIA DE ACTIVO EN BILLETERA SOLANA",
    defaultTokenName: "Nombre del Token",
    decimalsLabel: "Decimales",
    transferFeeLabel: "Comisión Transfer",
    metadataLabel: "Metadatos",
    immutable: "Inmutable",
    mutable: "Mutable",
    auditTitle: "🛡️ Auditoría y RugCheck Score",
    alertSafe: "🟢 100/100 - Seguro (Estándar DexScreener / RugCheck)",
    alertFreeze: "🔴 Alerta Crítica: Freeze Authority activa bloquea Pool/Swap en Jupiter",
    alertMint: "🟡 Riesgo de Dilución: Mint Authority abierta genera alertas en escáneres",
    alertMutable:
      `🟡 Metadatos Mutables: Bloquea la mutabilidad (+${formatSolAmount(PRICING_SOL.immutableMetadata)} SOL) para lograr 100/100 en RugCheck`,
  },
  stepper: {
    defaultTitle: "Progreso de Transacción Solana",
    stepBadge: "Paso",
    steps: [
      "1. Subida a Irys",
      "2. Subida de Metadatos",
      "3. Esperando Firma",
      "4. Confirmando en Red",
    ],
  },
  liquidityPage: {
    addFeeLabel: "Tarifa Crear Pool:",
    withdrawFeeLabel: "Tarifa Retirar Liquidez:",
    titleAdd: "Crear Pool de Liquidez On-Chain",
    titleWithdraw: "Retirar Liquidez en SOL",
    descAdd:
      "Inicializa un Pool de Liquidez y Mint de LP Token en Solana. Selecciona tu token desde tu billetera, deposita la liquidez inicial y recibe el 100% de los LP tokens.",
    descWithdraw:
      "Selecciona tu token o LP token directamente desde tu billetera conectada. Convierte tu bóveda WSOL de vuelta a SOL nativo en una sola transacción.",
    tabAdd: "➕ Agregar Liquidez",
    tabWithdraw: "💸 Retirar Liquidez en SOL",
    configurePairTitle: "Configurar Par de Liquidez",
    configurePairDesc:
      "Selecciona tu token directamente desde tu billetera, deposita liquidez inicial y emite tus LP tokens en una sola transacción atómica.",
    readyStep1: "1. AMM Seleccionado ✓",
    readyStep2Done: "2. Token Seleccionado ✓",
    readyStep2Pending: "2. Token Pendiente",
    readyStep3Done: "3. Montos Listos ✓",
    readyStep3Pending: "3. Montos Pendientes",
    readyStep4Done: "4. Freeze Auth Lista ✓",
    readyStep4Warn: "4. Freeze Auth Requiere Acción",
    step1AmmLabel: "1. Selecciona la Arquitectura AMM",
    raydiumDesc:
      "Bóvedas de liquidez de producto constante con emisión nativa de LP Token en Mainnet-Beta y Devnet.",
    meteoraDesc:
      "Bóvedas de liquidez dinámicas con niveles de comisión personalizables y emisión instantánea de LP.",
    step2SelectToken: "2. Selecciona el Token Directamente de Tu Billetera Conectada",
    freezeWarnTitle: "Freeze Authority Activa Detectada",
    freezeWarnDesc:
      "Los pools de liquidez requieren revocar Freeze Authority. La revocaremos automáticamente en la misma transacción.",
    freezeAutoRevokeCheck: "Auto-revocar en la misma transacción",
    tokenAmountLabel: "Cantidad de Tokens a Depositar",
    initialLiquidityLabel: "Liquidez Inicial",
    swapFeeTierLabel: "Nivel de Comisión de Swap del Pool",
    tierRecommended: "Recomendado",
    tierStandard: "Estándar AMM",
    tierHighVol: "Alta Volatilidad",
    activationScheduleLabel: "Programación de Activación del Pool",
    immediateBtn: "Inmediato",
    scheduleTimeBtn: "Programar Hora",
    simulatorTitle: "Simulación Económica del Pool en Vivo",
    initialPriceLabel: "Precio Inicial del Token",
    impliedMcapLabel: "Market Cap Implícito",
    poolAllocationLabel: "Asignación de Suministro en Pool",
    devFeeLabel: "Tarifa de Servicio",
    submitAddBtn: "Inicializar Pool de Liquidez y Emitir LP",
    initializingPoolStatus: "Inicializando Pool de Liquidez On-Chain...",
    withdrawCardTitle: "Retirar Liquidez en SOL",
    withdrawCardDesc:
      "Haz clic en cualquier token o LP token directamente desde tu billetera conectada — sin escribir símbolos ni direcciones.",
    selectWithdrawalShareLabel: "2. Selecciona el Porcentaje de Retiro de SOL",
    sharePartial: "Salida Parcial",
    shareHalf: "Mitad de Posición",
    shareMajor: "Salida Mayoritaria",
    shareFull: "Retiro Total + Rent",
    withdrawSimulatorTitle: "Desglose de Retiro de Liquidez en SOL",
    selectedShareLabel: "Porcentaje Seleccionado",
    estimatedSolUnwrapped: "SOL Estimado Desbloqueado",
    estNetSolToWallet: "SOL Neto Estimado a Billetera",
    submitWithdrawBtn: "💸 Retirar Liquidez en SOL",
    withdrawingStatus: "Retirando Liquidez en SOL...",
    vaultAutoDetected: "Bóveda de Liquidez WSOL Detectada Automáticamente",
    inspectingVault: "Inspeccionando bóveda on-chain...",
    readyToUnwrap: "Listo para desbloquear bóveda WSOL / ATA",
    sidebarAddTitle: "Arquitectura del Pool y Dossier On-Chain",
    sidebarWithdrawTitle: "Retiro Directo de SOL a Billetera",
    sidebarAddBullets: [
      {
        title: "Selección en 1 Clic:",
        text: "Elige cualquier token directamente de tu billetera conectada sin pegar direcciones de contrato.",
      },
      {
        title: "Emisión Real de LP On-Chain:",
        text: "Crea un Pool Authority PDA determinístico, envuelve SOL en la bóveda WSOL y emite tokens LP reales en tu billetera.",
      },
      {
        title: "Recuperación Flexible de SOL:",
        text: "¿Necesitas retirar tu SOL después? Cambia a la pestaña Retirar Liquidez en SOL en cualquier momento.",
      },
    ],
    sidebarWithdrawBullets: [
      {
        title: "Sin Escribir Direcciones:",
        text: "Haz clic en tu token o LP token en la lista de tu billetera; la bóveda y el LP mint se resuelven automáticamente.",
      },
      {
        title: "Retiro Parcial o Total (25% – 100%):",
        text: "Elige retirar una parte de tu liquidez en SOL o el 100% MAX (recuperando también el alquiler de la cuenta).",
      },
    ],
  },
  burnPage: {
    feeBadgeLabel: "Tarifa Estandarizada de Quema:",
    pageTitle: "Quemador On-Chain de Tokens y LP + Recuperar SOL",
    pageDesc:
      "Selecciona cualquier token o LP token directamente de tu billetera, genera tu Certificado Visual Rug-Proof en PNG y recupera el SOL bloqueado en cuentas vacías.",
    cardTitle: "Quemar Tokens o LP Tokens",
    cardDescPrefix:
      "Elige tu token o LP token directamente de tu billetera conectada. Tarifa de servicio:",
    step1SelectLabel: "1. Selecciona el Token o LP Token de Tu Billetera",
    step2AmountLabel: "2. Cantidad a Quemar",
    impactTitle: "🔥 Vista Previa del Impacto Deflacionario en Vivo",
    irreversibleBadge: "IRREVERSIBLE ON-CHAIN",
    currentBalanceLabel: "Saldo Actual en Billetera",
    amountToDestroyLabel: "Cantidad a Destruir",
    remainingBalanceLabel: "Saldo Restante",
    shareBurnedLabel: "Porcentaje Quemado",
    submitBurnBtnPrefix: "🔥 Quemar Tokens Seleccionados",
    executingBurnStatus: "Ejecutando Quema On-Chain...",
    certHeaderTitle: "🏆 Certificado Oficial LP Burn / Rug-Proof",
    downloadPngBtn: "⬇️ Descargar Imagen PNG",
    shareXBtn: "𝕏 Compartir en X (Twitter)",
    reclaimBadge: "💎 HERRAMIENTA VIRAL · CERRAR CUENTAS VACÍAS",
    reclaimTitle: "Recuperar SOL de Cuentas Vacías (Rent Recovery)",
    reclaimDesc:
      "Cada cuenta de token con saldo cero en tu billetera retiene SOL de alquiler (rent). Cierra hasta 20 cuentas vacías por transacción y recupera tu SOL al instante.",
    reclaimBannerPrefix: "Tienes",
    reclaimBannerSuffix: "cuentas vacías en tu billetera =",
    emptyAccountsLabel: "Cuentas Vacías (Saldo 0)",
    platformFeeLabel: "Tarifa Plataforma (8%)",
    netToYouLabel: "Neto para Ti (92%)",
    reclaimSubmitBtn: "⚡ Recuperar Mi SOL Ahora",
    reclaimEmptyBtn: "No se Encontraron Cuentas Vacías en la Billetera",
    reclaimingStatus: "Recuperando SOL...",
    sidebarHowItWorks: "Cómo Funciona la Quema de Tokens y LP",
    tutorial1Title: "1. Selección Directa desde Billetera",
    tutorial1Desc:
      "Todos los tokens SPL, Token-2022 y LP de tu billetera aparecen automáticamente (o se preseleccionan vía ?mint=).",
    tutorial2Title: "2. Certificado Visual y Reclaim SOL",
    tutorial2Desc:
      "Tras quemar, descarga tu Certificado PNG oficial '100% BURNED & VERIFIED ON-CHAIN' y compártelo en X. También cierra cuentas vacías para recuperar SOL.",
    withdrawCtaTitle: "¿Quieres Retirar Liquidez en SOL Antes?",
    withdrawCtaDesc:
      "Si deseas recuperar tus SOL depositados antes de quemar los LP tokens, utiliza la herramienta:",
    withdrawCtaLink: `Retirar Liquidez en SOL (${formatSolAmount(PRICING_SOL.withdrawLiquiditySol)} SOL)`,
  },
  airdropPage: {
    feeBadgeLabel: "Tarifa por Lote:",
    pageTitle: "Airdrop Masivo de Tokens y Multi-Sender",
    pageDesc:
      "Distribuye tokens SPL o Token-2022 a múltiples billeteras Solana en transacciones atómicas por lotes con creación automática de cuentas ATA.",
    cardTitle: "Configurar Airdrop Multi-Send",
    cardDescPrefix:
      "Selecciona tu token, importa o pega las direcciones destinatarias y valida los saldos antes de enviar. Tarifa de servicio:",
    step1SelectLabel: "1. Selecciona el Token a Distribuir",
    step2RecipientsLabel: "2. Lista de Billeteras Destinatarias (Dirección,Cantidad)",
    loadSampleBtn: "📄 Cargar Ejemplo",
    importCsvBtn: "📁 Importar CSV / TXT",
    clearListBtn: "✕ Limpiar Lista",
    uniformLabel: "⚡ Fijar Cantidad Uniforme para Todas las Billeteras:",
    applyAllBtn: "Aplicar a Todas las Líneas",
    textareaPlaceholder:
      "Un destinatario por línea: DireccionBilletera,Cantidad\nEjemplo:\n7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU,1500\n9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin,2500",
    textareaHint:
      "Separa cada dirección de billetera y cantidad de tokens con coma, espacio o punto y coma.",
    summaryTitle: "📊 Validación de Airdrop en Vivo y Resumen de Costos",
    readyToBroadcast: "✓ Listo para Enviar",
    reviewRequired: "⚠️ Revisión Requerida",
    validWalletsLabel: "Billeteras Válidas",
    totalTokensLabel: "Total de Tokens a Enviar",
    atomicBatchesLabel: "Lotes Atómicos (Batches)",
    totalServiceFeeLabel: "Tarifa de Servicio Total",
    validateBtn: "✓ Validar Lista de Destinatarios",
    sendAirdropBtn: "📦 Enviar Airdrop",
    processingAirdropStatus: "Procesando Airdrop...",
    launchAnotherBtn: "📦 Realizar Otro Airdrop",
    sidebarTitle: "Cómo Funciona el Multi-Send",
    tutorialSteps: [
      {
        title: "1. Selecciona el Token de la Billetera",
        description:
          "Elige cualquier activo SPL o Token-2022 de tu billetera conectada para distribuirlo a tu comunidad.",
      },
      {
        title: "2. Importa CSV o Pega Billeteras",
        description:
          "Pega pares Dirección,Cantidad, sube un archivo .CSV/.TXT o aplica una cantidad uniforme a todas las direcciones.",
      },
      {
        title: "3. Creación Automática de ATA y Lotes",
        description:
          "Crea automáticamente las cuentas ATA faltantes y agrupa hasta 10 destinatarios por transacción atómica.",
      },
    ],
  },
  dashboardPage: {
    feeBadgeLabel: "Tarifa Estandarizada de Revocación:",
    pageTitle: "Gestionar Autoridades y Seguridad del Token",
    pageDesc:
      "Inspecciona el puntaje de seguridad on-chain de tu token y revoca permanentemente las autoridades de Mint o Freeze en Solana.",
    panelTitle: "Panel de Inspección de Autoridades y Seguridad",
    panelDesc:
      "Selecciona cualquier activo SPL o Token-2022 de tu billetera para verificar su puntaje RugCheck y revocar privilegios activos.",
    connectPrompt: "Conecta tu billetera para inspeccionar y gestionar las autoridades de tus tokens.",
    step1SelectLabel: "1. Selecciona un Token de Tu Billetera",
    securityScoreTitle: "🛡️ Puntaje de Seguridad On-Chain y Preparación RugCheck",
    scoreFull: "100% Inmutable y Listo para DEX ✓",
    scorePartial: "Parcialmente Revocado",
    scoreActive: "Autoridades Activas",
    mintAuthTitle: "Mint Authority (Límite de Suministro)",
    freezeAuthTitle: "Freeze Authority (Acceso DEX Pool)",
    statusRevoked: "Revocada ✓",
    statusActive: "Activa",
    mintRevokedDesc:
      "El suministro del token es permanentemente fijo. Nunca se podrán emitir nuevos tokens.",
    mintActiveDesc:
      "Tu billetera aún puede emitir nuevos tokens. Revócala para garantizar un suministro fijo.",
    freezeRevokedDesc:
      "Ninguna billetera puede ser congelada. Token elegible para pools en Raydium y Meteora.",
    freezeActiveDesc:
      "Debe revocarse antes de inicializar un pool de liquidez AMM en Raydium o Meteora.",
    revokeMintBtn: "🔒 Revocar Mint Authority",
    revokeFreezeBtn: "❄️ Revocar Freeze Authority",
    goToLpBtn: "💧 Ir al Pool de Liquidez →",
    modalTitlePrefix: "Confirmar Eliminación Permanente de Autoridad:",
    modalDesc:
      "Esta acción es irreversible en la blockchain Solana y garantiza máxima confianza en RugCheck. ¿Deseas continuar?",
    guideSections: [
      {
        title: "Autoridades de Mint vs. Freeze",
        description:
          "Mint Authority controla si se pueden emitir más tokens. Freeze Authority controla si las cuentas pueden ser congeladas.",
      },
      {
        title: "Preparación para DEX y Raydium",
        description:
          "Revocar Freeze Authority es obligatorio para pools en Raydium y Meteora. Revocar Mint Authority demuestra suministro fijo en RugCheck.",
      },
      {
        title: "Enrutamiento Permanente y Atómico",
        description:
          "Revocar una autoridad es definitivo en Solana y se procesa en una sola transacción firmada por tu billetera.",
      },
    ],
  },
  affiliatesPage: {
    pageTitle: "Programa de Afiliados: Gana 30% en SOL al Instante",
    pageDesc:
      "Únete a nuestro programa de afiliados on-chain y gana 30% de comisión instantánea en SOL en cada creación de token o pool de liquidez mediante tu enlace.",
    linkCardTitle: "Tu Enlace Personal de Afiliado",
    linkExplanation:
      "Este es tu enlace exclusivo de referido. El parámetro ?ref= se captura en cualquier página y transfiere el 30% de la tarifa de servicio directamente a tu billetera en la misma transacción.",
    connectPrompt: "Conecta tu billetera Solana para generar tu enlace personal de afiliado.",
    viewEarningsBtn: "Ver Mis Ganancias e Historial",
    hideEarningsBtn: "Ocultar Panel de Ganancias",
    dashboardTitle: "Panel de Ganancias On-Chain",
    dashboardDesc: "Revisa tus referidos verificados en la blockchain y las comisiones del 30% en SOL recibidas.",
    totalEarningsLabel: "Ganancias Totales (Split 30%)",
    verifiedReferralsLabel: "Referidos Verificados",
    historyTitle: "Últimas 10 Comisiones Verificadas",
    dateCol: "Fecha",
    amountCol: "Monto",
    txCol: "Transacción",
    noHistoryText: "Aún no hay transacciones de comisión registradas.",
    howItWorksTitle: "Cómo Funciona",
    steps: [
      {
        title: "1. Conecta Tu Billetera:",
        text: "La dirección pública de tu billetera actúa como tu identificador único de referido.",
      },
      {
        title: "2. Copia Tu Enlace:",
        text: "Tu enlace de afiliado se genera automáticamente con ?ref=TU_BILLETERA.",
      },
      {
        title: "3. Comparte y Refiere:",
        text: "Comparte el enlace con creadores que estén lanzando tokens o pools de liquidez.",
      },
      {
        title: "4. Recibe 30% al Instante:",
        text: "El 30% de la tarifa de servicio se transfiere directamente a tu billetera en la misma transacción (70% Dev / 30% Afiliado).",
      },
    ],
    commissionCardTitle: "Tu Comisión del 30% en SOL",
    commissionCardText:
      "Recibes el 30% de todas las tarifas modulares de creación de tokens e inicialización de pools generadas por tu enlace, directo en tu billetera sin esperas.",
    transparentCardTitle: "Pagos On-Chain 100% Transparentes",
    transparentCardText:
      "Las comisiones se pagan atómicamente vía SystemProgram.transfer de Solana y se verifican on-chain.",
  },
  docsPage: {
    pageTitle: "Documentación de la Plataforma",
    pageSubtitle:
      "Guía técnica completa para crear tokens, inicializar pools de liquidez, quemar LP y ejecutar airdrops masivos con seguridad.",
    tocTitle: "Navegación",
    sections: [
      {
        id: "criar-token",
        title: "Creación de Token (SPL y Token-2022)",
        summary:
          "Aprende a crear tu propio token fungible en Solana con metadatos en Arweave y blindaje RugCheck 100/100.",
        intro:
          "El proceso de creación te permite lanzar un activo digital en Solana en una sola transacción atómica:",
        bullets: [
          {
            label: "Identidad del Token:",
            text: "Define Nombre, Símbolo (Ticker), Decimales (0 a 9) y Suministro Total con precisión exacta BigInt.",
          },
          {
            label: "Metadatos Permanentes:",
            text: "El logo y el JSON de metadatos se almacenan de forma descentralizada en Arweave/Irys bajo el estándar Metaplex.",
          },
          {
            label: "Estándar del Token:",
            text: "Elige entre SPL Estándar (compatibilidad universal) y Token-2022 (soporte para comisión de transferencia / Tax Token).",
          },
          {
            label: "Blindaje RugCheck 100/100:",
            text: "Revoca Freeze Authority (+50 pts), Mint Authority (+35 pts) y bloquea Metadatos Inmutables (+15 pts) al crear.",
          },
        ],
      },
      {
        id: "criar-liquidez",
        title: "Pool de Liquidez (Raydium y Meteora)",
        summary:
          "Permite que tu token se comercie públicamente inicializando un pool AMM on-chain en Raydium CPMM o Meteora Dynamic AMM.",
        intro:
          "Un token sin liquidez no puede negociarse. Crear un pool empareja tu token con SOL o USDC:",
        bullets: [
          {
            label: "Raydium CPMM y Meteora DAMM:",
            text: "Inicializa bóvedas de producto constante sin necesitar un costoso OpenBook Market ID.",
          },
          {
            label: "Precio Inicial y Market Cap:",
            text: "La proporción de tokens base y SOL/USDC depositados define automáticamente el precio inicial.",
          },
          {
            label: "LP Tokens:",
            text: "Recibes el 100% de los LP tokens emitidos, pudiendo quemarlos para bloquear liquidez o retirar tu SOL cuando quieras.",
          },
        ],
      },
      {
        id: "queimar-tokens",
        title: "Quema de Tokens (Burn) y Recuperar SOL",
        summary:
          "Reduce el suministro circulante, quema LP tokens con Certificado Visual PNG y recupera SOL de cuentas vacías.",
        intro:
          "La quema de tokens es un mecanismo deflacionario irreversible verificado en la blockchain:",
        bullets: [
          {
            label: "Certificado Oficial en PNG:",
            text: "Genera y descarga un certificado de alta resolución '100% BURNED & VERIFIED ON-CHAIN' con enlace a Solscan.",
          },
          {
            label: "Recuperar SOL (Rent Recovery):",
            text: "Cierra cuentas de tokens con saldo cero en tu billetera y recupera el SOL de alquiler al instante.",
          },
        ],
      },
      {
        id: "airdrop",
        title: "Distribución Masiva (Airdrop)",
        summary: "Envía tu token a múltiples billeteras en transacciones atómicas por lotes.",
        intro: "Los airdrops permiten campañas rápidas de distribución comunitaria:",
        bullets: [
          {
            label: "Validación Inteligente:",
            text: "Verifica cada PublicKey destinataria y el saldo disponible antes de construir las transacciones.",
          },
          {
            label: "Creación Automática de ATA:",
            text: "Inicializa automáticamente las cuentas de token asociadas (ATAs) para los destinatarios.",
          },
        ],
      },
      {
        id: "gerenciar-tokens",
        title: "Gestión de Autoridades",
        summary: "Inspecciona tus tokens y renuncia a las autoridades de Mint y Freeze on-chain.",
        intro:
          "El Panel de Autoridades te permite verificar y revocar privilegios en cualquier token que controles:",
        bullets: [
          {
            label: "Revocar Mint Authority:",
            text: "Fija permanentemente el suministro total del token para que nunca se emitan más unidades.",
          },
          {
            label: "Revocar Freeze Authority:",
            text: "Impide congelar billeteras y es requisito obligatorio para crear pools en Raydium y Meteora.",
          },
        ],
      },
      {
        id: "afiliados",
        title: "Programa de Afiliados On-Chain (30%)",
        summary: "Gana 30% de comisión en SOL automáticamente en cada transacción referida.",
        intro:
          "Nuestro programa divide la tarifa de servicio atómicamente dentro de la misma transacción Solana:",
        bullets: [
          {
            label: "Enlace Exclusivo:",
            text: "Conecta tu billetera para generar tu enlace ?ref=TU_BILLETERA y verifica tus pagos en Solscan.",
          },
        ],
      },
    ],
  },
  costsPage: {
    pageTitle: "Tabla Transparente de Costos y Tarifas",
    pageDesc:
      "Costos estimados para todas las operaciones en la red Solana, incluyendo nuestra tarifa modular de servicio y el alquiler de red (Rent).",
    loading: "Cargando tabla de costos...",
    labels: {
      createToken: `Creación de Token (Modular ${FEE_RANGE.minDisplay} – ${FEE_RANGE.maxFullSuiteDisplay})`,
      burnToken: `Quema de Tokens / LP (Tarifa ${formatSolAmount(PRICING_SOL.burnStandard)} SOL)`,
      airdrop: `Airdrop Masivo (${formatSolAmount(PRICING_SOL.massAirdropPerBatch)} SOL / Lote)`,
      manageAuthority: `Revocar Autoridades (Tarifa ${formatSolAmount(PRICING_SOL.revokeAuthorityStandalone)} SOL)`,
      createLiquidityPool: "Crear Pool de Liquidez (Tarifa 0.15 SOL)",
      removeLiquidity: `Retirar Liquidez en SOL (Tarifa ${formatSolAmount(PRICING_SOL.withdrawLiquiditySol)} SOL)`,
    },
  },
  confirmationPage: {
    pageTitle: "Estado del Lanzamiento del Token",
    infoBanner:
      "¡Tu token ya está activo en Solana! Sigue los 3 pasos a continuación para agregar liquidez, quemar el LP (Rug-Proof) y distribuirlo a tu comunidad.",
    mintedVerifiedTitle: "¡Token Creado y Verificado On-Chain!",
    mintAddressLabel: "Dirección Mint del Token:",
    txSignatureLabel: "Firma de la Transacción:",
    viewTokenSolscan: "Ver Token en Solscan ↗",
    viewTxSolscan: "Ver Transacción en Solscan ↗",
    funnelTitle: "🚀 Próximos Pasos para Listar tu Token",
    funnelSubtitle:
      "La dirección de tu nuevo token se seleccionará automáticamente en cada etapa:",
    step1Badge: "Paso 1 · Trading en DEX",
    step1Title: "💧 Crear Pool de Liquidez",
    step1Desc:
      "Inicializa tu par en Raydium CPMM o Meteora DAMM para habilitar compras y ventas.",
    step2Badge: "Paso 2 · Sello Rug-Proof",
    step2Title: "🔥 Quemar Liquidez / Supply (LP Burn)",
    step2Desc:
      "Quema LP tokens o suministro y genera tu Certificado Visual PNG verificable.",
    step3Badge: "Paso 3 · Distribución Viral",
    step3Title: "📦 Hacer Airdrop a la Comunidad",
    step3Desc:
      "Envía tokens por lotes a múltiples billeteras con creación automática de ATA.",
    backToCreator: "← Volver al Creador de Tokens",
  },
  footer: {
    badges: [
      {
        title: "100% No Custodial y Programas Verificados",
        desc: "Cada transacción se verifica contra nuestra lista blanca de programas Solana y se simula antes de firmar.",
      },
      {
        title: "Protocolos On-Chain Auditados",
        desc: "Construido directamente sobre los programas oficiales SPL Token, Token-2022, Metaplex y bóvedas AMM.",
      },
      {
        title: "Precios Modulares y 30% para Afiliados",
        desc: "Tarifas modulares transparentes enrutadas atómicamente on-chain con pagos instantáneos del 30% para afiliados.",
      },
      {
        title: "Mainnet-Beta por Defecto y Listo para Devnet",
        desc: "Inicia en Solana Mainnet-Beta para lanzamientos reales, con cambio en 1 clic a Devnet para pruebas gratuitas.",
      },
    ],
    tagline:
      "Launchpad no custodial con ingeniería Swiss Design para crear activos SPL y Token-2022, inicializar pools de liquidez AMM y gestionar autoridades en Solana.",
    connectedTo: "Conectado al RPC de Solana",
    servicesTitle: "Servicios de la Plataforma",
    resourcesTitle: "Recursos y Transparencia",
    programsTitle: "Programas On-Chain Verificados",
    rightsReserved:
      "Todos los derechos reservados. Interfaz no custodial para la blockchain Solana.",
    securityNotice:
      "Aviso de Seguridad: Revisa siempre la simulación de la transacción en tu billetera antes de firmar.",
  },
};



export default dictionary;
