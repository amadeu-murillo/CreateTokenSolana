"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

/**
 * Top 5 global crypto market locales supported by CreateTokenSolana:
 * - 'en'    : English (Default global fallback)
 * - 'es'    : Español
 * - 'ru'    : Русский
 * - 'zh'    : 中文 (简体)
 * - 'pt-BR' : Português (Brasil)
 *
 * Note: 'pt' is retained in the union type as an alias for backwards compatibility.
 */
export type SupportedLocale = "en" | "es" | "ru" | "zh" | "pt-BR";
export type AppLocale = SupportedLocale | "pt";

export const SUPPORTED_LOCALES: ReadonlyArray<{
  code: SupportedLocale;
  shortLabel: string;
  nativeName: string;
  flag: string;
  htmlLang: string;
}> = [
  { code: "en", shortLabel: "EN", nativeName: "English", flag: "🇺🇸", htmlLang: "en" },
  { code: "es", shortLabel: "ES", nativeName: "Español", flag: "🇪🇸", htmlLang: "es" },
  { code: "ru", shortLabel: "RU", nativeName: "Русский", flag: "🇷🇺", htmlLang: "ru" },
  { code: "zh", shortLabel: "ZH", nativeName: "中文", flag: "🇨🇳", htmlLang: "zh-CN" },
  { code: "pt-BR", shortLabel: "PT-BR", nativeName: "Português", flag: "🇧🇷", htmlLang: "pt-BR" },
] as const;

const STORAGE_KEY = "appLocale";

export function normalizeLocale(raw?: string | null): SupportedLocale | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase();

  if (cleaned === "en" || cleaned.startsWith("en-")) return "en";
  if (cleaned === "es" || cleaned.startsWith("es-")) return "es";
  if (cleaned === "ru" || cleaned.startsWith("ru-")) return "ru";
  if (cleaned === "zh" || cleaned.startsWith("zh-")) return "zh";
  if (cleaned === "pt" || cleaned === "pt-br" || cleaned.startsWith("pt-")) return "pt-BR";

  return null;
}

export function detectBrowserLocale(): SupportedLocale {
  if (typeof window === "undefined") return "en";

  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = normalizeLocale(params.get("lang"));
    if (fromQuery) {
      localStorage.setItem(STORAGE_KEY, fromQuery);
      return fromQuery;
    }
  } catch {
    // Ignore URL parsing or storage errors
  }

  try {
    const saved = normalizeLocale(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      return saved;
    }
  } catch {
    // Ignore storage read errors
  }

  if (typeof navigator !== "undefined") {
    const browserLanguages: readonly string[] =
      Array.isArray(navigator.languages) && navigator.languages.length > 0
        ? navigator.languages
        : navigator.language
          ? [navigator.language]
          : [];

    for (const candidate of browserLanguages) {
      const matched = normalizeLocale(candidate);
      if (matched) {
        return matched;
      }
    }
  }

  return "en";
}

export const detectUserCountryLocale = detectBrowserLocale;

export interface TranslationDictionary {
  nav: {
    createToken: string;
    liquidityPool: string;
    burn: string;
    airdrop: string;
    manage: string;
    affiliates: string;
    docs: string;
  };
  wallet: {
    connect: string;
    connecting: string;
    copyAddress: string;
    copied: string;
    changeWallet: string;
    viewExplorer: string;
    disconnect: string;
    balanceLabel: string;
  };
  network: {
    mainnetShort: string;
    devnetShort: string;
    mainnetBannerTitle: string;
    mainnetBannerDesc: string;
    devnetBannerTitle: string;
    devnetBannerDesc: string;
    switchToDevnet: string;
    switchToMainnet: string;
    faucetBtn: string;
    faucetLoading: string;
    faucetSuccess: string;
  };
  home: {
    heroBadgeMainnet: string;
    heroBadgeDevnet: string;
    heroTitle: string;
    heroSubtitle: string;
    costSummaryTitle: string;
    quickGuideTitle: string;
    suiteTitle: string;
    suiteSubtitle: string;
    faqTitle: string;
    quickGuide: ReadonlyArray<{ title: string; description: string }>;
    ecosystemDesc: {
      liquidityPool: string;
      burn: string;
      airdrop: string;
      manage: string;
      affiliates: string;
      docs: string;
    };
  };
  form: {
    targetNetwork: string;
    totalModularFee: string;
    step1: string;
    step2: string;
    step3: string;
    tokenName: string;
    tokenSymbol: string;
    decimals: string;
    supply: string;
    storagePipeline: string;
    logoLabel: string;
    dropzonePrompt: string;
    uploadingImg: string;
    description: string;
    website: string;
    twitter: string;
    instagram: string;
    customCreatorTitle: string;
    customCreatorDesc: string;
    creatorName: string;
    creatorUrl: string;
    tokenStandard: string;
    standardSpl: string;
    standard2022: string;
    securityTitle: string;
    revokeFreezeTitle: string;
    revokeFreezeDesc: string;
    revokeMintTitle: string;
    revokeMintDesc: string;
    immutableTitle: string;
    immutableDesc: string;
    backBtn: string;
    continueBtn: string;
    submitMainnet: string;
    submitDevnet: string;
  };
  costs: {
    headerTitle: string;
    headerBadge: string;
    rentLabel: string;
    networkFeeLabel: string;
    serviceFeeLabel: string;
    baseCreate: string;
    revokeFreeze: string;
    revokeMint: string;
    immutable: string;
    customCreator: string;
    transferFeeExt: string;
    totalModular: string;
    networkRent: string;
    estimatedWalletTotal: string;
    singleSignatureSub: string;
    atomicDisclaimer: string;
  };
  common: {
    activeNetwork: string;
    refreshWallet: string;
    availableBalance: string;
    walletBalance: string;
    copy: string;
    copied: string;
    viewOnSolscan: string;
    loading: string;
    cancel: string;
    confirmAndRevoke: string;
    signingAndConfirming: string;
    irreversibleWarning: string;
  };
  tokenSelector: {
    loadingAria: string;
    balancePrefix: string;
    noTokensDetected: string;
    clickToChoose: string;
    dropdownHeader: string;
    lpPoolTokenTag: string;
  };
  tokenPreview: {
    cardTitle: string;
    cardDesc: string;
    headerLabel: string;
    defaultTokenName: string;
    decimalsLabel: string;
    transferFeeLabel: string;
    metadataLabel: string;
    immutable: string;
    mutable: string;
    auditTitle: string;
    alertSafe: string;
    alertFreeze: string;
    alertMint: string;
    alertMutable: string;
  };
  stepper: {
    defaultTitle: string;
    stepBadge: string;
    steps: ReadonlyArray<string>;
  };
  liquidityPage: {
    addFeeLabel: string;
    withdrawFeeLabel: string;
    titleAdd: string;
    titleWithdraw: string;
    descAdd: string;
    descWithdraw: string;
    tabAdd: string;
    tabWithdraw: string;
    configurePairTitle: string;
    configurePairDesc: string;
    readyStep1: string;
    readyStep2Done: string;
    readyStep2Pending: string;
    readyStep3Done: string;
    readyStep3Pending: string;
    readyStep4Done: string;
    readyStep4Warn: string;
    step1AmmLabel: string;
    raydiumDesc: string;
    meteoraDesc: string;
    step2SelectToken: string;
    freezeWarnTitle: string;
    freezeWarnDesc: string;
    freezeAutoRevokeCheck: string;
    tokenAmountLabel: string;
    initialLiquidityLabel: string;
    swapFeeTierLabel: string;
    tierRecommended: string;
    tierStandard: string;
    tierHighVol: string;
    activationScheduleLabel: string;
    immediateBtn: string;
    scheduleTimeBtn: string;
    simulatorTitle: string;
    initialPriceLabel: string;
    impliedMcapLabel: string;
    poolAllocationLabel: string;
    devFeeLabel: string;
    submitAddBtn: string;
    initializingPoolStatus: string;
    withdrawCardTitle: string;
    withdrawCardDesc: string;
    selectWithdrawalShareLabel: string;
    sharePartial: string;
    shareHalf: string;
    shareMajor: string;
    shareFull: string;
    withdrawSimulatorTitle: string;
    selectedShareLabel: string;
    estimatedSolUnwrapped: string;
    estNetSolToWallet: string;
    submitWithdrawBtn: string;
    withdrawingStatus: string;
    vaultAutoDetected: string;
    inspectingVault: string;
    readyToUnwrap: string;
    sidebarAddTitle: string;
    sidebarWithdrawTitle: string;
    sidebarAddBullets: ReadonlyArray<{ title: string; text: string }>;
    sidebarWithdrawBullets: ReadonlyArray<{ title: string; text: string }>;
  };
  burnPage: {
    feeBadgeLabel: string;
    pageTitle: string;
    pageDesc: string;
    cardTitle: string;
    cardDescPrefix: string;
    step1SelectLabel: string;
    step2AmountLabel: string;
    impactTitle: string;
    irreversibleBadge: string;
    currentBalanceLabel: string;
    amountToDestroyLabel: string;
    remainingBalanceLabel: string;
    shareBurnedLabel: string;
    submitBurnBtnPrefix: string;
    executingBurnStatus: string;
    certHeaderTitle: string;
    downloadPngBtn: string;
    shareXBtn: string;
    reclaimBadge: string;
    reclaimTitle: string;
    reclaimDesc: string;
    reclaimBannerPrefix: string;
    reclaimBannerSuffix: string;
    emptyAccountsLabel: string;
    platformFeeLabel: string;
    netToYouLabel: string;
    reclaimSubmitBtn: string;
    reclaimEmptyBtn: string;
    reclaimingStatus: string;
    sidebarHowItWorks: string;
    tutorial1Title: string;
    tutorial1Desc: string;
    tutorial2Title: string;
    tutorial2Desc: string;
    withdrawCtaTitle: string;
    withdrawCtaDesc: string;
    withdrawCtaLink: string;
  };
  airdropPage: {
    feeBadgeLabel: string;
    pageTitle: string;
    pageDesc: string;
    cardTitle: string;
    cardDescPrefix: string;
    step1SelectLabel: string;
    step2RecipientsLabel: string;
    loadSampleBtn: string;
    importCsvBtn: string;
    clearListBtn: string;
    uniformLabel: string;
    applyAllBtn: string;
    textareaPlaceholder: string;
    textareaHint: string;
    summaryTitle: string;
    readyToBroadcast: string;
    reviewRequired: string;
    validWalletsLabel: string;
    totalTokensLabel: string;
    atomicBatchesLabel: string;
    totalServiceFeeLabel: string;
    validateBtn: string;
    sendAirdropBtn: string;
    processingAirdropStatus: string;
    launchAnotherBtn: string;
    sidebarTitle: string;
    tutorialSteps: ReadonlyArray<{ title: string; description: string }>;
  };
  dashboardPage: {
    feeBadgeLabel: string;
    pageTitle: string;
    pageDesc: string;
    panelTitle: string;
    panelDesc: string;
    connectPrompt: string;
    step1SelectLabel: string;
    securityScoreTitle: string;
    scoreFull: string;
    scorePartial: string;
    scoreActive: string;
    mintAuthTitle: string;
    freezeAuthTitle: string;
    statusRevoked: string;
    statusActive: string;
    mintRevokedDesc: string;
    mintActiveDesc: string;
    freezeRevokedDesc: string;
    freezeActiveDesc: string;
    revokeMintBtn: string;
    revokeFreezeBtn: string;
    goToLpBtn: string;
    modalTitlePrefix: string;
    modalDesc: string;
    guideSections: ReadonlyArray<{ title: string; description: string }>;
  };
  affiliatesPage: {
    pageTitle: string;
    pageDesc: string;
    linkCardTitle: string;
    linkExplanation: string;
    connectPrompt: string;
    viewEarningsBtn: string;
    hideEarningsBtn: string;
    dashboardTitle: string;
    dashboardDesc: string;
    totalEarningsLabel: string;
    verifiedReferralsLabel: string;
    historyTitle: string;
    dateCol: string;
    amountCol: string;
    txCol: string;
    noHistoryText: string;
    howItWorksTitle: string;
    steps: ReadonlyArray<{ title: string; text: string }>;
    commissionCardTitle: string;
    commissionCardText: string;
    transparentCardTitle: string;
    transparentCardText: string;
  };
  docsPage: {
    pageTitle: string;
    pageSubtitle: string;
    tocTitle: string;
    sections: ReadonlyArray<{
      id: string;
      title: string;
      summary: string;
      intro: string;
      bullets: ReadonlyArray<{ label: string; text: string }>;
    }>;
  };
  costsPage: {
    pageTitle: string;
    pageDesc: string;
    loading: string;
    labels: {
      createToken: string;
      burnToken: string;
      airdrop: string;
      manageAuthority: string;
      createLiquidityPool: string;
      removeLiquidity: string;
    };
  };
  confirmationPage: {
    pageTitle: string;
    infoBanner: string;
    mintedVerifiedTitle: string;
    mintAddressLabel: string;
    txSignatureLabel: string;
    viewTokenSolscan: string;
    viewTxSolscan: string;
    funnelTitle: string;
    funnelSubtitle: string;
    step1Badge: string;
    step1Title: string;
    step1Desc: string;
    step2Badge: string;
    step2Title: string;
    step2Desc: string;
    step3Badge: string;
    step3Title: string;
    step3Desc: string;
    backToCreator: string;
  };
  footer: {
    badges: ReadonlyArray<{ title: string; desc: string }>;
    tagline: string;
    connectedTo: string;
    servicesTitle: string;
    resourcesTitle: string;
    programsTitle: string;
    rightsReserved: string;
    securityNotice: string;
  };
}

const PT_BR_TRANSLATIONS: TranslationDictionary = {
  nav: {
    createToken: "Criar Token",
    liquidityPool: "Pool de Liquidez",
    burn: "Queimar / Reclaim",
    airdrop: "Airdrop em Massa",
    manage: "Autoridades",
    affiliates: "Afiliados (30%)",
    docs: "Documentação",
  },
  wallet: {
    connect: "Conectar Carteira",
    connecting: "Conectando...",
    copyAddress: "Copiar Endereço",
    copied: "✓ Copiado!",
    changeWallet: "Trocar Carteira",
    viewExplorer: "Ver no Solscan ↗",
    disconnect: "Desconectar Carteira",
    balanceLabel: "Saldo na Rede",
  },
  network: {
    mainnetShort: "Mainnet (Real)",
    devnetShort: "Devnet (Teste)",
    mainnetBannerTitle: "REDE PRINCIPAL ATIVA: SOLANA MAINNET-BETA",
    mainnetBannerDesc:
      "Você está operando em Produção. Todos os tokens, pools e taxas utilizam SOL real na blockchain.",
    devnetBannerTitle: "MODO DE TESTE ATIVO: SOLANA DEVNET (SANDBOX)",
    devnetBannerDesc:
      "Ambiente gratuito de simulação! Tokens criados na Devnet servem para teste e não possuem valor comercial.",
    switchToDevnet: "Testar na Devnet →",
    switchToMainnet: "Ir para Mainnet (Produção) →",
    faucetBtn: "🚰 +1 SOL Grátis (Faucet)",
    faucetLoading: "Enviando +1 SOL...",
    faucetSuccess: "✓ +1 SOL Recebido!",
  },
  home: {
    heroBadgeMainnet: "🟢 Produção On-Chain · Solana Mainnet-Beta",
    heroBadgeDevnet: "🟠 Ambiente de Simulação · Solana Devnet",
    heroTitle: "Crie Seu Token na Solana em Segundos",
    heroSubtitle:
      "Lance tokens SPL ou Token-2022 com blindagem RugCheck 100/100, metadados imutáveis no Arweave e Pool de Liquidez sem precisar programar.",
    costSummaryTitle: "Resumo de Custos (Modular)",
    quickGuideTitle: "Guia Rápido",
    suiteTitle: "Ecossistema Completo para o Seu Token",
    suiteSubtitle:
      "Tudo o que você precisa após criar o token: adicionar liquidez, queimar LP com certificado PNG, recuperar SOL de contas vazias e fazer airdrops.",
    faqTitle: "Perguntas Frequentes (FAQ)",
    quickGuide: [
      {
        title: "O que é um Token SPL?",
        description:
          "O padrão oficial de tokens fungíveis da Solana. Compatível com todas as carteiras (Phantom, Solflare) e DEXs (Raydium, Meteora, Jupiter).",
      },
      {
        title: "O que é o Token-2022?",
        description:
          "A nova geração do programa de tokens da Solana que suporta Taxa de Transferência automática (Tax Token) direto no protocolo.",
      },
      {
        title: "RugCheck 100/100 (Mint & Freeze)",
        description:
          "Revogar Freeze Authority permite criar Pool de Liquidez (+50 pts). Revogar Mint Authority fixa o supply (+35 pts) e Metadados Imutáveis garantem +15 pts.",
      },
      {
        title: "Mainnet-Beta vs. Devnet",
        description:
          "Na Mainnet-Beta seu token é real e negociável. Na Devnet você pode testar gratuitamente usando SOL de teste do botão Faucet.",
      },
    ],
    ecosystemDesc: {
      liquidityPool:
        "Crie ou retire liquidez em SOL na Raydium CPMM ou Meteora Dynamic AMM em 1 clique.",
      burn: "Queime tokens/LP com Certificado PNG oficial e recupere SOL de contas vazias na carteira.",
      airdrop:
        "Distribua tokens para centenas de carteiras com criação automática de conta ATA.",
      manage: "Inspecione o RugCheck Score e revogue autoridades de Mint ou Freeze on-chain.",
      affiliates:
        "Gere seu link exclusivo e receba 30% de comissão em SOL instantaneamente na mesma transação.",
      docs: "Guias passo a passo sobre tokenomics, liquidez, segurança e auditoria RugCheck.",
    },
  },
  form: {
    targetNetwork: "Rede Selecionada:",
    totalModularFee: "Taxa Modular Total:",
    step1: "1. Identidade do Token",
    step2: "2. Logo & Redes Sociais",
    step3: "3. Blindagem & Mint",
    tokenName: "Nome do Token",
    tokenSymbol: "Símbolo (Ticker)",
    decimals: "Casas Decimais (0 – 9)",
    supply: "Supply Inicial Total",
    storagePipeline: "Armazenamento da Logo e Metadados",
    logoLabel: "Logo do Token (PNG, JPG, WEBP, GIF — Máx 5MB)",
    dropzonePrompt: "Arraste e solte a logo do seu token aqui, ou clique para selecionar",
    uploadingImg: "Enviando e verificando imagem...",
    description: "Descrição do Projeto (Opcional)",
    website: "Site Oficial (Opcional)",
    twitter: "X / Twitter (Opcional)",
    instagram: "Instagram (Opcional)",
    customCreatorTitle: 'Customizar "Creator Info" nos Metadados',
    customCreatorDesc:
      "Substitui a assinatura padrão nos metadados pelo nome e site oficial do seu projeto.",
    creatorName: "Nome do Criador / Estúdio",
    creatorUrl: "Site Oficial do Criador",
    tokenStandard: "Padrão do Programa Solana",
    standardSpl: "SPL Padrão (Compatibilidade Universal)",
    standard2022: "Token-2022 (Extensão Tax Token / Transfer Fee)",
    securityTitle: "Blindagem On-Chain & RugCheck 100/100 (Upsell Modular)",
    revokeFreezeTitle: "Revogar Freeze Authority (Recomendado)",
    revokeFreezeDesc:
      "Obrigatório para criar Pool de Liquidez na Raydium/Meteora e negociar na Jupiter (+50 pts no RugCheck).",
    revokeMintTitle: "Revogar Mint Authority (Recomendado)",
    revokeMintDesc:
      "Torna o Supply 100% fixo e impede a criação de novos tokens (+35 pts no RugCheck).",
    immutableTitle: "Metadados Imutáveis (Immutable)",
    immutableDesc:
      "Trava permanentemente nome, símbolo e imagem nos exploradores (+15 pts no RugCheck).",
    backBtn: "← Voltar",
    continueBtn: "Continuar →",
    submitMainnet: "🚀 Criar Token na Mainnet-Beta",
    submitDevnet: "🧪 Criar Token de Teste na Devnet",
  },
  costs: {
    headerTitle: "Transparência de Custos On-Chain",
    headerBadge: "100% Atômico",
    rentLabel: "Aluguel da rede (Rent):",
    networkFeeLabel: "Taxa da rede:",
    serviceFeeLabel: "Taxa de serviço:",
    baseCreate: "Taxa Base de Criação (Token Mint)",
    revokeFreeze: "Revogar Freeze Authority (Pool Ready)",
    revokeMint: "Revogar Mint Authority (Supply Fixo)",
    immutable: "Metadados Imutáveis (Immutable)",
    customCreator: "Customizar Creator Info (Metadados)",
    transferFeeExt: "Extensão Tax Token / Transfer Fee (Token-2022)",
    totalModular: "Total Taxa Modular:",
    networkRent: "Rent da Rede Solana (Estimado):",
    estimatedWalletTotal: "Total Estimado",
    singleSignatureSub: "Assinatura única na carteira",
    atomicDisclaimer:
      "Cobrança atômica na mesma transação com split instantâneo de 30% para afiliados e 70% para Dev Wallet.",
  },
  common: {
    activeNetwork: "Rede Ativa:",
    refreshWallet: "↻ Atualizar Carteira",
    availableBalance: "Saldo Disponível:",
    walletBalance: "Saldo na Carteira:",
    copy: "Copiar",
    copied: "✓ Copiado!",
    viewOnSolscan: "Ver no Solscan ↗",
    loading: "Carregando...",
    cancel: "Cancelar",
    confirmAndRevoke: "Confirmar e Revogar",
    signingAndConfirming: "Assinando e Confirmando...",
    irreversibleWarning: "⚠️ Ação Irreversível On-Chain",
  },
  tokenSelector: {
    loadingAria: "Carregando tokens da carteira",
    balancePrefix: "Saldo:",
    noTokensDetected: "Nenhum token detectado na sua carteira conectada nesta rede",
    clickToChoose: "Clique para escolher um token da sua carteira conectada",
    dropdownHeader: "Ativos na Carteira Conectada — Clique para Selecionar",
    lpPoolTokenTag: "LP Pool Token",
  },
  tokenPreview: {
    cardTitle: "Simulador de Carteira & Auditoria",
    cardDesc:
      "Visualização reativa em tempo real de como seu ativo será exibido na Phantom, Solflare e DexScreener.",
    headerLabel: "PRÉVIA DO ATIVO NA CARTEIRA SOLANA",
    defaultTokenName: "Nome do Token",
    decimalsLabel: "Decimais",
    transferFeeLabel: "Taxa Transfer",
    metadataLabel: "Metadados",
    immutable: "Imutável",
    mutable: "Mutável",
    auditTitle: "🛡️ Auditoria & RugCheck Score",
    alertSafe: "🟢 100/100 - Seguro (Padrão DexScreener / RugCheck)",
    alertFreeze: "🔴 Alerta Crítico: Freeze Authority ativa impede criação de Pool/Swap na Jupiter",
    alertMint: "🟡 Risco de Diluição: Mint Authority aberta gera alerta nos scanners",
    alertMutable:
      "🟡 Metadados Mutáveis: Desative a mutabilidade (+0.05 SOL) para atingir 100/100 no RugCheck",
  },
  stepper: {
    defaultTitle: "Progresso da Transação Solana",
    stepBadge: "Etapa",
    steps: [
      "1. Upload para Irys",
      "2. Upload de Metadados",
      "3. Aguardando Assinatura",
      "4. Confirmando na Rede",
    ],
  },
  liquidityPage: {
    addFeeLabel: "Taxa Criar Pool:",
    withdrawFeeLabel: "Taxa Retirar Liquidez:",
    titleAdd: "Criar Pool de Liquidez On-Chain",
    titleWithdraw: "Retirar Liquidez em SOL",
    descAdd:
      "Inicialize um Pool de Liquidez e Mint de LP Token na Solana. Selecione seu token diretamente da carteira, deposite a liquidez inicial e receba 100% dos LP tokens.",
    descWithdraw:
      "Selecione seu token ou LP token diretamente da carteira conectada. Desembrulha seu cofre WSOL de volta para SOL nativo na mesma transação.",
    tabAdd: "➕ Adicionar Liquidez",
    tabWithdraw: "💸 Retirar Liquidez em SOL",
    configurePairTitle: "Configurar Par de Liquidez",
    configurePairDesc:
      "Selecione seu token diretamente da carteira conectada, defina a liquidez inicial e emita seus LP tokens em uma única transação atômica.",
    readyStep1: "1. AMM Selecionado ✓",
    readyStep2Done: "2. Token Selecionado ✓",
    readyStep2Pending: "2. Token Pendente",
    readyStep3Done: "3. Valores Definidos ✓",
    readyStep3Pending: "3. Valores Pendentes",
    readyStep4Done: "4. Freeze Auth Pronta ✓",
    readyStep4Warn: "4. Freeze Auth Requer Ação",
    step1AmmLabel: "1. Selecione a Arquitetura AMM",
    raydiumDesc:
      "Cofres de liquidez de produto constante com emissão nativa de LP Token na Mainnet-Beta e Devnet.",
    meteoraDesc:
      "Cofres de liquidez dinâmicos com faixas de taxa customizáveis e emissão instantânea de LP.",
    step2SelectToken: "2. Selecione o Token Diretamente da Sua Carteira Conectada",
    freezeWarnTitle: "Freeze Authority Ativa Detectada",
    freezeWarnDesc:
      "Pools de liquidez exigem Freeze Authority revogada. Nós a revogaremos automaticamente na mesma transação.",
    freezeAutoRevokeCheck: "Auto-revogar na mesma transação",
    tokenAmountLabel: "Quantidade de Tokens para Depositar",
    initialLiquidityLabel: "Liquidez Inicial",
    swapFeeTierLabel: "Faixa de Taxa de Swap do Pool",
    tierRecommended: "Recomendado",
    tierStandard: "Padrão AMM",
    tierHighVol: "Alta Volatilidade",
    activationScheduleLabel: "Agendamento de Ativação do Pool",
    immediateBtn: "Imediato",
    scheduleTimeBtn: "Agendar Horário",
    simulatorTitle: "Simulação Econômica do Pool em Tempo Real",
    initialPriceLabel: "Preço Inicial do Token",
    impliedMcapLabel: "Market Cap Implícito",
    poolAllocationLabel: "Alocação do Supply no Pool",
    devFeeLabel: "Taxa de Serviço",
    submitAddBtn: "Inicializar Pool de Liquidez & Emitir LP",
    initializingPoolStatus: "Inicializando Pool de Liquidez On-Chain...",
    withdrawCardTitle: "Retirar Liquidez em SOL",
    withdrawCardDesc:
      "Clique em qualquer token ou LP token diretamente da sua carteira conectada abaixo — sem digitar símbolo ou endereço.",
    selectWithdrawalShareLabel: "2. Selecione a Porcentagem de Retirada de SOL",
    sharePartial: "Saída Parcial",
    shareHalf: "Metade da Posição",
    shareMajor: "Saída Majoritária",
    shareFull: "Resgate Total + Rent",
    withdrawSimulatorTitle: "Resumo da Retirada de Liquidez em SOL",
    selectedShareLabel: "Porcentagem Selecionada",
    estimatedSolUnwrapped: "SOL Estimado Desbloqueado",
    estNetSolToWallet: "SOL Líquido Estimado na Carteira",
    submitWithdrawBtn: "💸 Retirar Liquidez em SOL",
    withdrawingStatus: "Retirando Liquidez em SOL...",
    vaultAutoDetected: "Cofre de Liquidez WSOL Detectado Automaticamente",
    inspectingVault: "Inspecionando cofre on-chain...",
    readyToUnwrap: "Pronto para desbloquear cofre WSOL / ATA",
    sidebarAddTitle: "Arquitetura do Pool & Dossiê On-Chain",
    sidebarWithdrawTitle: "Retirada Direta de SOL para a Carteira",
    sidebarAddBullets: [
      {
        title: "Seleção em 1 Clique:",
        text: "Clique em qualquer token diretamente da sua carteira conectada sem precisar colar endereços.",
      },
      {
        title: "Emissão Real de LP On-Chain:",
        text: "Cria um Pool Authority PDA determinístico, deposita WSOL no cofre e emite tokens LP reais na sua carteira.",
      },
      {
        title: "Recuperação Flexível de SOL:",
        text: "Precisa retirar seu SOL depois? Alterne para a aba Retirar Liquidez em SOL a qualquer momento.",
      },
    ],
    sidebarWithdrawBullets: [
      {
        title: "Sem Digitar Endereços:",
        text: "Basta clicar no seu token ou LP token na lista da carteira; o cofre e o LP mint são resolvidos automaticamente.",
      },
      {
        title: "Retirada Parcial ou Total (25% – 100%):",
        text: "Escolha retirar parte da liquidez em SOL ou 100% MAX (que também recupera o aluguel da conta).",
      },
    ],
  },
  burnPage: {
    feeBadgeLabel: "Taxa Padronizada de Burn:",
    pageTitle: "Queimador On-Chain de Tokens & LP + Recuperar SOL",
    pageDesc:
      "Selecione qualquer token ou LP token diretamente da sua carteira conectada, gere seu Certificado Visual Rug-Proof em PNG e recupere o SOL preso em contas vazias.",
    cardTitle: "Queimar Tokens ou LP Tokens",
    cardDescPrefix:
      "Escolha seu token ou LP token diretamente da sua carteira conectada. Taxa de serviço:",
    step1SelectLabel: "1. Selecione o Token ou LP Token Diretamente da Sua Carteira",
    step2AmountLabel: "2. Quantidade para Queimar",
    impactTitle: "🔥 Prévia de Impacto Deflacionário em Tempo Real",
    irreversibleBadge: "IRREVERSÍVEL ON-CHAIN",
    currentBalanceLabel: "Saldo Atual na Carteira",
    amountToDestroyLabel: "Quantidade a Destruir",
    remainingBalanceLabel: "Saldo Remanescente",
    shareBurnedLabel: "Fatia da Posição Queimada",
    submitBurnBtnPrefix: "🔥 Queimar Tokens da Carteira",
    executingBurnStatus: "Executando Queima On-Chain...",
    certHeaderTitle: "🏆 Certificado Oficial LP Burn / Rug-Proof",
    downloadPngBtn: "⬇️ Baixar Imagem PNG",
    shareXBtn: "𝕏 Compartilhar no X (Twitter)",
    reclaimBadge: "💎 FERRAMENTA VIRAL · FECHAR CONTAS VAZIAS",
    reclaimTitle: "Recuperar SOL de Contas Vazias (Rent Recovery)",
    reclaimDesc:
      "Cada token zerado na sua carteira mantém SOL bloqueado de aluguel (rent). Feche até 20 contas vazias por transação e receba seu SOL de volta instantaneamente.",
    reclaimBannerPrefix: "Você possui",
    reclaimBannerSuffix: "contas vazias na carteira =",
    emptyAccountsLabel: "Contas Vazias (Saldo 0)",
    platformFeeLabel: "Taxa Plataforma (15%)",
    netToYouLabel: "Líquido para Você (85%)",
    reclaimSubmitBtn: "⚡ Recuperar Meu SOL Agora",
    reclaimEmptyBtn: "Nenhuma Conta Vazia Encontrada na Carteira Conectada",
    reclaimingStatus: "Recuperando SOL...",
    sidebarHowItWorks: "Como Funciona a Queima de Tokens & LP",
    tutorial1Title: "1. Seleção Direta da Carteira",
    tutorial1Desc:
      "Todos os tokens SPL, Token-2022 e LP da sua carteira conectada aparecem automaticamente (ou são pré-selecionados via ?mint=).",
    tutorial2Title: "2. Certificado Visual & Reclaim SOL",
    tutorial2Desc:
      "Após queimar, baixe seu Certificado PNG oficial '100% BURNED & VERIFIED ON-CHAIN' e compartilhe no X. Aproveite também para fechar contas vazias e recuperar seu SOL.",
    withdrawCtaTitle: "Quer Retirar Liquidez em SOL Antes?",
    withdrawCtaDesc:
      "Se você deseja recuperar seus SOL depositados antes de queimar os LP tokens, use a ferramenta:",
    withdrawCtaLink: "Retirar Liquidez em SOL (0.05 SOL)",
  },
  airdropPage: {
    feeBadgeLabel: "Taxa por Lote:",
    pageTitle: "Airdrop em Massa & Multi-Sender na Solana",
    pageDesc:
      "Distribua tokens SPL ou Token-2022 para múltiplas carteiras Solana em transações atômicas em lote, com criação automática de contas ATA.",
    cardTitle: "Configurar Airdrop Multi-Send",
    cardDescPrefix:
      "Selecione seu token, importe ou cole os endereços de destino e valide os saldos antes do envio. Taxa de serviço:",
    step1SelectLabel: "1. Selecione o Token para Distribuir",
    step2RecipientsLabel: "2. Lista de Carteiras de Destino (Endereço,Quantidade)",
    loadSampleBtn: "📄 Carregar Exemplo",
    importCsvBtn: "📁 Importar CSV / TXT",
    clearListBtn: "✕ Limpar Lista",
    uniformLabel: "⚡ Definir Valor Único para Todas as Carteiras:",
    applyAllBtn: "Aplicar em Todas as Linhas",
    textareaPlaceholder:
      "Um destinatário por linha: EnderecoDaCarteira,Quantidade\nExemplo:\n7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU,1500\n9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin,2500",
    textareaHint:
      "Separe cada endereço de carteira e quantidade de tokens com vírgula, espaço ou ponto e vírgula.",
    summaryTitle: "📊 Validação em Tempo Real & Resumo de Custos",
    readyToBroadcast: "✓ Pronto para Enviar",
    reviewRequired: "⚠️ Revisão Necessária",
    validWalletsLabel: "Carteiras Válidas",
    totalTokensLabel: "Total de Tokens a Enviar",
    atomicBatchesLabel: "Lotes Atômicos (Batches)",
    totalServiceFeeLabel: "Taxa de Serviço Total",
    validateBtn: "✓ Validar Lista de Destinatários",
    sendAirdropBtn: "📦 Enviar Airdrop",
    processingAirdropStatus: "Processando Airdrop...",
    launchAnotherBtn: "📦 Realizar Outro Airdrop",
    sidebarTitle: "Como Funciona o Multi-Send",
    tutorialSteps: [
      {
        title: "1. Selecione o Token da Carteira",
        description:
          "Escolha qualquer ativo SPL ou Token-2022 da sua carteira conectada para distribuir à sua comunidade.",
      },
      {
        title: "2. Importe CSV ou Cole as Carteiras",
        description:
          "Cole pares Endereço,Quantidade, envie um arquivo .CSV/.TXT ou aplique uma quantidade uniforme para todos os endereços.",
      },
      {
        title: "3. Criação Automática de ATA & Lotes",
        description:
          "Cria automaticamente as Associated Token Accounts (ATAs) ausentes e agrupa até 10 destinatários por transação atômica.",
      },
    ],
  },
  dashboardPage: {
    feeBadgeLabel: "Taxa Padronizada de Revogação:",
    pageTitle: "Gerenciar Autoridades & Segurança do Token",
    pageDesc:
      "Inspecione a pontuação de segurança on-chain do seu token e revogue permanentemente as autoridades de Mint ou Freeze na Solana.",
    panelTitle: "Painel de Inspeção de Autoridades & Segurança",
    panelDesc:
      "Selecione qualquer ativo SPL ou Token-2022 da sua carteira para verificar seu RugCheck Score e revogar privilégios ativos.",
    connectPrompt: "Conecte sua carteira para inspecionar e gerenciar as autoridades dos seus tokens.",
    step1SelectLabel: "1. Selecione um Token da Sua Carteira",
    securityScoreTitle: "🛡️ Pontuação de Segurança On-Chain & Prontidão RugCheck",
    scoreFull: "100% Imutável & Pronto para DEX ✓",
    scorePartial: "Parcialmente Revogado",
    scoreActive: "Autoridades Ativas",
    mintAuthTitle: "Mint Authority (Teto de Supply)",
    freezeAuthTitle: "Freeze Authority (Liberação DEX Pool)",
    statusRevoked: "Revogada ✓",
    statusActive: "Ativa",
    mintRevokedDesc:
      "O supply do token é permanentemente fixo. Nenhum token adicional poderá ser emitido.",
    mintActiveDesc:
      "Sua carteira ainda pode emitir novos tokens. Revogue para garantir um teto fixo aos investidores.",
    freezeRevokedDesc:
      "Nenhuma carteira pode ser congelada. Token elegível para pools de liquidez na Raydium e Meteora.",
    freezeActiveDesc:
      "Deve ser revogada antes de inicializar um pool de liquidez AMM na Raydium ou Meteora.",
    revokeMintBtn: "🔒 Revogar Mint Authority",
    revokeFreezeBtn: "❄️ Revogar Freeze Authority",
    goToLpBtn: "💧 Ir para Pool de Liquidez →",
    modalTitlePrefix: "Confirmar Remoção Permanente da Autoridade:",
    modalDesc:
      "Esta ação é irreversível na blockchain Solana e garante máxima confiança aos investidores no RugCheck. Deseja prosseguir?",
    guideSections: [
      {
        title: "Autoridades de Mint vs. Freeze",
        description:
          "Mint Authority controla se novos tokens podem ser criados. Freeze Authority controla se contas de detentores podem ser congeladas.",
      },
      {
        title: "Prontidão para DEX & Raydium",
        description:
          "Revogar a Freeze Authority é obrigatório para pools na Raydium e Meteora. Revogar a Mint Authority comprova supply fixo no RugCheck.",
      },
      {
        title: "Roteamento Permanente & Atômico",
        description:
          "Revogar uma autoridade é definitivo na Solana e processado em uma única transação assinada pela sua carteira.",
      },
    ],
  },
  affiliatesPage: {
    pageTitle: "Programa de Afiliados: Ganhe 30% em SOL na Hora",
    pageDesc:
      "Participe do nosso programa de afiliados on-chain e receba 30% de comissão instantânea em SOL em cada criação de token ou pool de liquidez realizada pelo seu link.",
    linkCardTitle: "Seu Link Exclusivo de Afiliado",
    linkExplanation:
      "Este é o seu link exclusivo de indicação. O parâmetro ?ref= é capturado em qualquer página de entrada e transfere 30% da taxa de serviço diretamente para sua carteira na mesma transação.",
    connectPrompt: "Conecte sua carteira Solana para gerar seu link pessoal de afiliado.",
    viewEarningsBtn: "Ver Meus Ganhos & Histórico",
    hideEarningsBtn: "Ocultar Painel de Ganhos",
    dashboardTitle: "Painel de Ganhos On-Chain",
    dashboardDesc: "Acompanhe suas indicações verificadas na blockchain e comissões de 30% em SOL recebidas.",
    totalEarningsLabel: "Ganhos Totais (Split 30%)",
    verifiedReferralsLabel: "Indicações Verificadas",
    historyTitle: "Últimas 10 Comissões Verificadas",
    dateCol: "Data",
    amountCol: "Valor",
    txCol: "Transação",
    noHistoryText: "Nenhuma transação de comissão registrada ainda.",
    howItWorksTitle: "Como Funciona",
    steps: [
      {
        title: "1. Conecte Sua Carteira:",
        text: "O endereço público da sua carteira funciona como seu identificador único de afiliado.",
      },
      {
        title: "2. Copie Seu Link:",
        text: "Seu link de afiliado é gerado automaticamente no formato ?ref=SUA_CARTEIRA.",
      },
      {
        title: "3. Compartilhe e Indique:",
        text: "Envie o link para criadores que estão lançando tokens ou pools de liquidez.",
      },
      {
        title: "4. Receba 30% na Mesma Transação:",
        text: "30% da taxa de serviço é transferida diretamente para sua carteira de forma atômica (70% Dev / 30% Afiliado).",
      },
    ],
    commissionCardTitle: "Sua Comissão de 30% em SOL",
    commissionCardText:
      "Você recebe 30% de todas as taxas modulares de criação de token e inicialização de pools de liquidez geradas pelo seu link, direto na sua carteira sem precisar solicitar saque.",
    transparentCardTitle: "Pagamentos On-Chain 100% Transparentes",
    transparentCardText:
      "As comissões são pagas atomicamente via SystemProgram.transfer da Solana e verificadas on-chain antes da indexação.",
  },
  docsPage: {
    pageTitle: "Documentação da Plataforma",
    pageSubtitle:
      "Guia técnico completo para criar tokens, inicializar pools de liquidez, queimar LP e realizar airdrops com segurança máxima.",
    tocTitle: "Navegação",
    sections: [
      {
        id: "criar-token",
        title: "Criação de Token (SPL e Token-2022)",
        summary:
          "Aprenda a criar seu próprio token fungível na Solana definindo propriedades essenciais, metadados no Arweave e blindagem RugCheck.",
        intro:
          "O processo de criação permite lançar um ativo digital na blockchain Solana em uma única transação atômica:",
        bullets: [
          {
            label: "Identidade do Token:",
            text: "Defina Nome, Símbolo (Ticker), Decimais (0 a 9) e Supply Inicial usando precisão exata em BigInt.",
          },
          {
            label: "Metadados Permanentes:",
            text: "A logo e o JSON de metadados são armazenados de forma descentralizada via Arweave/Irys seguindo o padrão Metaplex.",
          },
          {
            label: "Padrão SPL vs. Token-2022:",
            text: "Escolha entre SPL Padrão (compatibilidade universal) ou Token-2022 (suporte nativo a taxa de transferência / Tax Token).",
          },
          {
            label: "Blindagem RugCheck 100/100:",
            text: "Revogue Freeze Authority (+50 pts), Mint Authority (+35 pts) e torne os metadados imutáveis (+15 pts) na criação.",
          },
        ],
      },
      {
        id: "criar-liquidez",
        title: "Pool de Liquidez (Raydium & Meteora)",
        summary:
          "Permita que seu token seja negociado publicamente inicializando um pool AMM on-chain na Raydium CPMM ou Meteora Dynamic AMM.",
        intro:
          "Um token sem liquidez não pode ser negociado. Criar um pool pareia seu token com SOL ou USDC:",
        bullets: [
          {
            label: "Raydium CPMM & Meteora DAMM:",
            text: "Inicialize cofres de liquidez de produto constante sem precisar de um OpenBook Market ID legado.",
          },
          {
            label: "Preço Inicial & Market Cap:",
            text: "A proporção entre tokens base e SOL/USDC depositados define automaticamente o preço inicial de lançamento.",
          },
          {
            label: "LP Tokens na Carteira:",
            text: "Você recebe 100% dos LP tokens emitidos, podendo queimá-los para travar a liquidez ou retirar seu SOL quando desejar.",
          },
        ],
      },
      {
        id: "queimar-tokens",
        title: "Queima de Tokens (Burn) & Recuperar SOL",
        summary:
          "Reduza o supply em circulação, queime LP tokens com Certificado Visual PNG e recupere o aluguel (rent) de contas vazias.",
        intro:
          "A queima de tokens é um mecanismo deflacionário irreversível verificado diretamente na blockchain:",
        bullets: [
          {
            label: "Certificado Oficial em PNG:",
            text: "Gere e baixe um certificado de alta resolução '100% BURNED & VERIFIED ON-CHAIN' com link para o Solscan.",
          },
          {
            label: "Recuperar SOL (Rent Recovery):",
            text: "Feche contas de tokens com saldo zero na sua carteira e recupere o SOL bloqueado de aluguel imediatamente.",
          },
        ],
      },
      {
        id: "airdrop",
        title: "Distribuição em Massa (Airdrop)",
        summary: "Envie seu token para dezenas ou centenas de carteiras em lotes atômicos.",
        intro:
          "A ferramenta Multi-Sender acelera campanhas de comunidade e distribuição de recompensas:",
        bullets: [
          {
            label: "Validação Inteligente:",
            text: "Verifica cada endereço Base58 e saldo total antes de construir as transações.",
          },
          {
            label: "Criação Automática de ATA:",
            text: "Inicializa automaticamente as contas de token associadas (ATAs) para destinatários que ainda não possuem o ativo.",
          },
        ],
      },
      {
        id: "gerenciar-tokens",
        title: "Gerenciamento de Autoridades",
        summary: "Inspecione seus tokens e revogue autoridades de Mint e Freeze a qualquer momento.",
        intro:
          "O Painel de Autoridades analisa em tempo real os privilégios de qualquer token da sua carteira:",
        bullets: [
          {
            label: "Revogar Mint Authority:",
            text: "Torna o supply total 100% fixo para sempre, impedindo novas emissões.",
          },
          {
            label: "Revogar Freeze Authority:",
            text: "Impede o congelamento de carteiras e libera o token para criação de pools em DEXs.",
          },
        ],
      },
      {
        id: "afiliados",
        title: "Programa de Afiliados On-Chain (30%)",
        summary: "Ganhe 30% de comissão em SOL instantaneamente em todas as transações indicadas.",
        intro:
          "Nosso sistema divide a taxa de serviço atomicamente dentro da mesma instrução Solana:",
        bullets: [
          {
            label: "Link Instantâneo:",
            text: "Conecte sua carteira para gerar seu link ?ref=SUA_CARTEIRA e acompanhe os pagamentos no Solscan.",
          },
        ],
      },
    ],
  },
  costsPage: {
    pageTitle: "Tabela Transparente de Custos & Taxas",
    pageDesc:
      "Custos estimados para todas as operações na rede Solana, incluindo nossa taxa modular de serviço e o aluguel estimado da rede (Rent).",
    loading: "Carregando tabela de custos...",
    labels: {
      createToken: "Criação de Token (Modular 0.10 – 0.55 SOL)",
      burnToken: "Queima de Tokens / LP (Taxa de 0.05 SOL)",
      airdrop: "Airdrop em Massa (0.05 SOL / Lote)",
      manageAuthority: "Revogar Autoridades (Taxa de 0.05 SOL)",
      createLiquidityPool: "Criar Pool de Liquidez (Taxa de 0.15 SOL)",
      removeLiquidity: "Retirar Liquidez em SOL (Taxa de 0.05 SOL)",
    },
  },
  confirmationPage: {
    pageTitle: "Status do Lançamento do Token",
    infoBanner:
      "Seu token já está ativo na Solana! Siga os 3 passos abaixo para adicionar liquidez, queimar o LP (Rug-Proof) e distribuir para a comunidade.",
    mintedVerifiedTitle: "Token Criado & Verificado On-Chain!",
    mintAddressLabel: "Endereço Mint do Token:",
    txSignatureLabel: "Assinatura da Transação:",
    viewTokenSolscan: "Ver Token no Solscan ↗",
    viewTxSolscan: "Ver Transação no Solscan ↗",
    funnelTitle: "🚀 Próximos Passos para Listar seu Token",
    funnelSubtitle:
      "O endereço do seu novo token será selecionado automaticamente em cada etapa:",
    step1Badge: "Passo 1 · Negociação DEX",
    step1Title: "💧 Criar Pool de Liquidez",
    step1Desc:
      "Inicialize seu par na Raydium CPMM ou Meteora DAMM para liberar compras e vendas.",
    step2Badge: "Passo 2 · Selo Rug-Proof",
    step2Title: "🔥 Queimar Liquidez / Supply (LP Burn)",
    step2Desc:
      "Queime LP tokens ou parte do supply e gere seu Certificado Visual PNG verificável.",
    step3Badge: "Passo 3 · Distribuição Viral",
    step3Title: "📦 Fazer Airdrop para Comunidade",
    step3Desc:
      "Envie tokens em lote para múltiplas carteiras com criação automática de ATA.",
    backToCreator: "← Voltar ao Criador de Tokens",
  },
  footer: {
    badges: [
      {
        title: "100% Não-Custodial & Programas Verificados",
        desc: "Cada transação é validada contra nossa whitelist de programas Solana e simulada antes da assinatura.",
      },
      {
        title: "Protocolos On-Chain Auditados",
        desc: "Construído diretamente sobre os programas oficiais SPL Token, Token-2022, Metaplex e cofres AMM.",
      },
      {
        title: "Preço Modular & Split de 30% para Afiliados",
        desc: "Taxas modulares transparentes roteadas atomicamente on-chain com pagamento instantâneo de 30% para afiliados.",
      },
      {
        title: "Mainnet-Beta Padrão & Pronto para Devnet",
        desc: "Inicia na Solana Mainnet-Beta para lançamentos reais, com troca em 1 clique para testes gratuitos na Devnet.",
      },
    ],
    tagline:
      "Launchpad não-custodial com engenharia Swiss Design para criar tokens SPL e Token-2022, inicializar pools de liquidez AMM e gerenciar autoridades na Solana.",
    connectedTo: "Conectado ao RPC Solana",
    servicesTitle: "Serviços da Plataforma",
    resourcesTitle: "Recursos & Transparência",
    programsTitle: "Programas On-Chain Verificados",
    rightsReserved:
      "Todos os direitos reservados. Interface não-custodial para a blockchain Solana.",
    securityNotice:
      "Aviso de Segurança: Sempre revise a simulação da transação na sua carteira antes de assinar.",
  },
};

const EN_TRANSLATIONS: TranslationDictionary = {
  nav: {
    createToken: "Create Token",
    liquidityPool: "Liquidity Pool",
    burn: "Burn & Reclaim",
    airdrop: "Mass Airdrop",
    manage: "Authorities",
    affiliates: "Affiliates (30%)",
    docs: "Docs",
  },
  wallet: {
    connect: "Connect Wallet",
    connecting: "Connecting...",
    copyAddress: "Copy Address",
    copied: "✓ Copied!",
    changeWallet: "Switch Wallet",
    viewExplorer: "View on Solscan ↗",
    disconnect: "Disconnect Wallet",
    balanceLabel: "Network Balance",
  },
  network: {
    mainnetShort: "Mainnet (Live)",
    devnetShort: "Devnet (Test)",
    mainnetBannerTitle: "LIVE PRODUCTION NETWORK: SOLANA MAINNET-BETA",
    mainnetBannerDesc:
      "You are operating on Mainnet-Beta. All tokens, liquidity pools, and fees use real SOL on-chain.",
    devnetBannerTitle: "TESTNET SANDBOX ACTIVE: SOLANA DEVNET",
    devnetBannerDesc:
      "Free simulation environment! Tokens minted on Devnet are for testing only and carry no monetary value.",
    switchToDevnet: "Switch to Devnet →",
    switchToMainnet: "Switch to Mainnet (Live) →",
    faucetBtn: "🚰 +1 Free Devnet SOL",
    faucetLoading: "Airdropping +1 SOL...",
    faucetSuccess: "✓ +1 SOL Added!",
  },
  home: {
    heroBadgeMainnet: "🟢 Live Production · Solana Mainnet-Beta",
    heroBadgeDevnet: "🟠 Sandbox Test Mode · Solana Devnet",
    heroTitle: "Create Your Solana Token in Seconds",
    heroSubtitle:
      "Launch SPL or Token-2022 assets with 100/100 RugCheck security, permanent Arweave metadata, and instant Liquidity Pools with zero coding.",
    costSummaryTitle: "Modular Cost Breakdown",
    quickGuideTitle: "Quick Guide",
    suiteTitle: "Complete Token Lifecycle Suite",
    suiteSubtitle:
      "Everything you need after minting: initialize liquidity pools, generate PNG burn certificates, reclaim SOL from empty accounts, and run mass airdrops.",
    faqTitle: "Frequently Asked Questions",
    quickGuide: [
      {
        title: "What is an SPL Token?",
        description:
          "The official fungible token standard on Solana. Compatible with all wallets (Phantom, Solflare) and DEXs (Raydium, Meteora, Jupiter).",
      },
      {
        title: "What is Token-2022?",
        description:
          "The next-generation Solana token program supporting protocol-level Transfer Fees (automatic tax on transfers) and advanced extensions.",
      },
      {
        title: "RugCheck 100/100 (Mint & Freeze)",
        description:
          "Revoking Freeze Authority unlocks DEX Liquidity Pools (+50 pts). Revoking Mint Authority fixes supply (+35 pts) and Immutable Metadata adds +15 pts.",
      },
      {
        title: "Mainnet-Beta vs. Devnet",
        description:
          "On Mainnet-Beta your token is live and tradable. On Devnet you can test minting and pools for free using our +1 SOL Faucet button.",
      },
    ],
    ecosystemDesc: {
      liquidityPool:
        "Initialize or withdraw SOL liquidity on Raydium CPMM or Meteora Dynamic AMM in 1 click.",
      burn: "Burn tokens/LP with an official PNG certificate and reclaim SOL from empty token accounts.",
      airdrop:
        "Distribute your token to hundreds of wallets at once with automatic ATA creation.",
      manage: "Inspect RugCheck security scores and permanently revoke Mint or Freeze authorities.",
      affiliates:
        "Generate your referral link and earn 30% commission in SOL atomically on every launch.",
      docs: "Read step-by-step guides on tokenomics, liquidity provisioning, and RugCheck security.",
    },
  },
  form: {
    targetNetwork: "Active Network:",
    totalModularFee: "Total Modular Fee:",
    step1: "1. Token Identity",
    step2: "2. Logo & Socials",
    step3: "3. Security & Mint",
    tokenName: "Token Name",
    tokenSymbol: "Token Symbol (Ticker)",
    decimals: "Decimals (0 – 9)",
    supply: "Initial Total Supply",
    storagePipeline: "Logo & Metadata Storage Pipeline",
    logoLabel: "Token Logo Image (PNG, JPG, WEBP, GIF — Max 5MB)",
    dropzonePrompt: "Drag & drop your token logo here, or click to select a file",
    uploadingImg: "Uploading & verifying token image...",
    description: "Project Description (Optional)",
    website: "Official Website (Optional)",
    twitter: "X / Twitter (Optional)",
    instagram: "Instagram (Optional)",
    customCreatorTitle: 'Customize "Creator Info" in Metadata',
    customCreatorDesc:
      "Replaces the default creator signature in metadata with your project or studio name and URL.",
    creatorName: "Creator / Studio Name",
    creatorUrl: "Creator Official Website",
    tokenStandard: "Solana Token Program Standard",
    standardSpl: "Standard SPL (Universal Compatibility)",
    standard2022: "Token-2022 (Tax Token / Transfer Fee Extension)",
    securityTitle: "On-Chain Security & RugCheck 100/100 (Modular Upsell)",
    revokeFreezeTitle: "Revoke Freeze Authority (Recommended)",
    revokeFreezeDesc:
      "Mandatory to initialize Raydium/Meteora Liquidity Pools and trade on Jupiter (+50 RugCheck pts).",
    revokeMintTitle: "Revoke Mint Authority (Recommended)",
    revokeMintDesc:
      "Permanently caps total supply so no extra tokens can ever be minted (+35 RugCheck pts).",
    immutableTitle: "Immutable Metadata",
    immutableDesc:
      "Permanently locks token name, symbol, and image URI on explorers (+15 RugCheck pts).",
    backBtn: "← Back",
    continueBtn: "Continue →",
    submitMainnet: "🚀 Launch Token on Mainnet-Beta",
    submitDevnet: "🧪 Mint Test Token on Devnet",
  },
  costs: {
    headerTitle: "On-Chain Cost Transparency",
    headerBadge: "100% Atomic",
    rentLabel: "Network account rent (Est.):",
    networkFeeLabel: "Network tx fee:",
    serviceFeeLabel: "Service fee:",
    baseCreate: "Base Token Creation Fee (Mint)",
    revokeFreeze: "Revoke Freeze Authority (Pool Ready)",
    revokeMint: "Revoke Mint Authority (Fixed Supply)",
    immutable: "Immutable Metadata Lock",
    customCreator: "Custom Creator Info (Metadata)",
    transferFeeExt: "Tax Token / Transfer Fee Ext (Token-2022)",
    totalModular: "Total Modular Fee:",
    networkRent: "Solana Network Rent (Est.):",
    estimatedWalletTotal: "Estimated Total",
    singleSignatureSub: "Single wallet signature",
    atomicDisclaimer:
      "Charged atomically in the same transaction with an instant 30% affiliate / 70% Dev Wallet split.",
  },
  common: {
    activeNetwork: "Active Network:",
    refreshWallet: "↻ Refresh Wallet",
    availableBalance: "Available Balance:",
    walletBalance: "Wallet Balance:",
    copy: "Copy",
    copied: "✓ Copied!",
    viewOnSolscan: "View on Solscan ↗",
    loading: "Loading...",
    cancel: "Cancel",
    confirmAndRevoke: "Confirm & Revoke",
    signingAndConfirming: "Signing & Confirming...",
    irreversibleWarning: "⚠️ Irreversible On-Chain Action",
  },
  tokenSelector: {
    loadingAria: "Loading wallet tokens",
    balancePrefix: "Balance:",
    noTokensDetected: "No tokens detected in your connected wallet on this network",
    clickToChoose: "Click to choose a token from your connected wallet",
    dropdownHeader: "Connected Wallet Assets — Click to Select",
    lpPoolTokenTag: "LP Pool Token",
  },
  tokenPreview: {
    cardTitle: "Wallet Simulator & Security Audit",
    cardDesc:
      "Live reactive preview of how your asset will appear in Phantom, Solflare, and DexScreener.",
    headerLabel: "SOLANA WALLET ASSET PREVIEW",
    defaultTokenName: "Token Name",
    decimalsLabel: "Decimals",
    transferFeeLabel: "Transfer Fee",
    metadataLabel: "Metadata",
    immutable: "Immutable",
    mutable: "Mutable",
    auditTitle: "🛡️ Security Audit & RugCheck Score",
    alertSafe: "🟢 100/100 - Safe (DexScreener / RugCheck Standard)",
    alertFreeze: "🔴 Critical Alert: Active Freeze Authority blocks Pool/Swap on Jupiter",
    alertMint: "🟡 Dilution Risk: Open Mint Authority triggers scanner warnings",
    alertMutable:
      "🟡 Mutable Metadata: Lock metadata (+0.05 SOL) to achieve 100/100 on RugCheck",
  },
  stepper: {
    defaultTitle: "Solana Transaction Progress",
    stepBadge: "Step",
    steps: [
      "1. Upload to Irys",
      "2. Upload Metadata",
      "3. Awaiting Signature",
      "4. Confirming On-Chain",
    ],
  },
  liquidityPage: {
    addFeeLabel: "Add Liquidity Fee:",
    withdrawFeeLabel: "Withdraw Liquidity Fee:",
    titleAdd: "Create On-Chain Liquidity Pool",
    titleWithdraw: "Withdraw Liquidity in SOL",
    descAdd:
      "Initialize an on-chain Liquidity Pool & LP Token Mint on Solana. Select your token directly from your connected wallet, deposit initial liquidity, and receive 100% of LP tokens.",
    descWithdraw:
      "Select your token or LP token directly from your connected wallet. Unwraps your WSOL liquidity vault back into native SOL in a single atomic transaction.",
    tabAdd: "➕ Add Liquidity",
    tabWithdraw: "💸 Withdraw Liquidity in SOL",
    configurePairTitle: "Configure Liquidity Pair",
    configurePairDesc:
      "Select your token directly from your connected wallet, deposit initial liquidity, and mint your LP tokens in a single atomic transaction.",
    readyStep1: "1. AMM Selected ✓",
    readyStep2Done: "2. Wallet Token Selected ✓",
    readyStep2Pending: "2. Wallet Token Pending",
    readyStep3Done: "3. Liquidity Amounts ✓",
    readyStep3Pending: "3. Liquidity Amounts Pending",
    readyStep4Done: "4. Freeze Auth Ready ✓",
    readyStep4Warn: "4. Freeze Auth Action Needed",
    step1AmmLabel: "1. Select AMM Architecture",
    raydiumDesc:
      "Constant-product liquidity vaults with native LP Token minting on both Mainnet-Beta and Devnet.",
    meteoraDesc:
      "Dynamic liquidity pool vaults with customizable fee tiers and instant LP minting.",
    step2SelectToken: "2. Select Token Directly from Your Connected Wallet",
    freezeWarnTitle: "Active Freeze Authority Detected",
    freezeWarnDesc:
      "Liquidity pools require Freeze Authority to be revoked. We will revoke it automatically in the same transaction.",
    freezeAutoRevokeCheck: "Auto-revoke in same transaction",
    tokenAmountLabel: "Token Amount to Deposit",
    initialLiquidityLabel: "Initial Liquidity",
    swapFeeTierLabel: "Pool Swap Fee Tier",
    tierRecommended: "Recommended",
    tierStandard: "Standard AMM",
    tierHighVol: "High Volatility",
    activationScheduleLabel: "Pool Activation Schedule",
    immediateBtn: "Immediate",
    scheduleTimeBtn: "Schedule Time",
    simulatorTitle: "Live Pool Economic Simulation",
    initialPriceLabel: "Initial Token Price",
    impliedMcapLabel: "Implied Market Cap",
    poolAllocationLabel: "Pool Supply Allocation",
    devFeeLabel: "Service Fee",
    submitAddBtn: "Initialize Liquidity Pool & Mint LP",
    initializingPoolStatus: "Initializing On-Chain Liquidity Pool...",
    withdrawCardTitle: "Withdraw Liquidity in SOL",
    withdrawCardDesc:
      "Click any token or LP token directly from your connected wallet below — no symbol or manual address required.",
    selectWithdrawalShareLabel: "2. Select SOL Withdrawal Share",
    sharePartial: "Partial SOL Exit",
    shareHalf: "Half Position",
    shareMajor: "Major Exit",
    shareFull: "Full Unwrap + Rent",
    withdrawSimulatorTitle: "Live SOL Liquidity Withdrawal Breakdown",
    selectedShareLabel: "Selected Share",
    estimatedSolUnwrapped: "Estimated SOL Unwrapped",
    estNetSolToWallet: "Est. Net SOL to Wallet",
    submitWithdrawBtn: "💸 Withdraw Liquidity in SOL",
    withdrawingStatus: "Withdrawing SOL Liquidity...",
    vaultAutoDetected: "Auto-Detected WSOL Liquidity Vault",
    inspectingVault: "Inspecting on-chain vault...",
    readyToUnwrap: "Ready to unwrap WSOL vault / ATA",
    sidebarAddTitle: "On-Chain Pool & Dossier Architecture",
    sidebarWithdrawTitle: "Direct Wallet SOL Withdrawal",
    sidebarAddBullets: [
      {
        title: "1-Click Wallet Selection:",
        text: "Click any token directly from your connected wallet—no need to type a symbol or paste a contract address.",
      },
      {
        title: "Real On-Chain LP Mint:",
        text: "Creates a deterministic Pool Authority PDA, wraps SOL into the WSOL Pool Vault, and mints real SPL LP tokens to your wallet.",
      },
      {
        title: "Flexible SOL Recovery:",
        text: "Need to withdraw your deposited SOL later? Switch to the Withdraw Liquidity in SOL tab anytime.",
      },
    ],
    sidebarWithdrawBullets: [
      {
        title: "Zero Symbol or Address Typing:",
        text: "Simply click your token or LP token directly from your connected wallet list; the vault and LP mint are resolved automatically.",
      },
      {
        title: "Partial or Full Exit (25% – 100%):",
        text: "Choose whether to withdraw a portion of your SOL liquidity or 100% MAX (which also reclaims the vault rent deposit).",
      },
    ],
  },
  burnPage: {
    feeBadgeLabel: "Standardized Burn Fee:",
    pageTitle: "On-Chain Token & LP Burner + Reclaim SOL",
    pageDesc:
      "Select any token or LP token directly from your connected wallet, generate your verifiable PNG Rug-Proof Certificate, and reclaim SOL locked in empty accounts.",
    cardTitle: "Burn Tokens or LP Tokens",
    cardDescPrefix:
      "Choose your token or LP token directly from your connected wallet. Service fee:",
    step1SelectLabel: "1. Select Token or LP Token Directly from Your Wallet",
    step2AmountLabel: "2. Amount to Burn",
    impactTitle: "🔥 Live Deflationary Burn Impact Preview",
    irreversibleBadge: "IRREVERSIBLE ON-CHAIN",
    currentBalanceLabel: "Current Wallet Balance",
    amountToDestroyLabel: "Amount to Destroy",
    remainingBalanceLabel: "Remaining Balance",
    shareBurnedLabel: "Share of Holdings Burned",
    submitBurnBtnPrefix: "🔥 Burn Selected Wallet Tokens",
    executingBurnStatus: "Executing On-Chain Burn...",
    certHeaderTitle: "🏆 Official LP Burn / Rug-Proof Certificate",
    downloadPngBtn: "⬇️ Download PNG Image",
    shareXBtn: "𝕏 Share on X (Twitter)",
    reclaimBadge: "💎 VIRAL TOOL · CLOSE EMPTY TOKEN ACCOUNTS",
    reclaimTitle: "Reclaim SOL from Empty Accounts (Rent Recovery)",
    reclaimDesc:
      "Every zero-balance token account in your wallet locks SOL for rent. Close up to 20 empty accounts per transaction and receive your SOL back immediately.",
    reclaimBannerPrefix: "You have",
    reclaimBannerSuffix: "empty accounts in your wallet =",
    emptyAccountsLabel: "Empty Accounts (0 Balance)",
    platformFeeLabel: "Platform Fee (15%)",
    netToYouLabel: "Net to You (85%)",
    reclaimSubmitBtn: "⚡ Reclaim My SOL Now",
    reclaimEmptyBtn: "No Empty Accounts Found in Connected Wallet",
    reclaimingStatus: "Reclaiming SOL...",
    sidebarHowItWorks: "How Token & LP Burning Works",
    tutorial1Title: "1. Direct Wallet Selection",
    tutorial1Desc:
      "All SPL, Token-2022, and LP tokens in your connected wallet appear automatically (or are pre-selected via ?mint=).",
    tutorial2Title: "2. Visual Certificate & Reclaim SOL",
    tutorial2Desc:
      "After burning, download your official '100% BURNED & VERIFIED ON-CHAIN' PNG certificate and share on X. Also close empty accounts to recover your SOL.",
    withdrawCtaTitle: "Want to Withdraw SOL Liquidity First?",
    withdrawCtaDesc:
      "If you want to recover your deposited SOL liquidity before burning LP tokens, use our tool:",
    withdrawCtaLink: "Withdraw Liquidity in SOL (0.05 SOL)",
  },
  airdropPage: {
    feeBadgeLabel: "Standardized Batch Fee:",
    pageTitle: "Mass Token Airdrop & Multi-Sender",
    pageDesc:
      "Distribute SPL or Token-2022 tokens to multiple Solana wallets in batched atomic transactions with automatic ATA initialization.",
    cardTitle: "Configure Multi-Send Airdrop",
    cardDescPrefix:
      "Select your token, import or paste recipient addresses, and validate balances before broadcasting. Service Fee:",
    step1SelectLabel: "1. Select Token to Distribute",
    step2RecipientsLabel: "2. Recipient Wallet List (Address,Amount)",
    loadSampleBtn: "📄 Load Sample List",
    importCsvBtn: "📁 Import CSV / TXT",
    clearListBtn: "✕ Clear List",
    uniformLabel: "⚡ Set Uniform Amount for All Wallets:",
    applyAllBtn: "Apply to All Lines",
    textareaPlaceholder:
      "One recipient per line: WalletAddress,TokenAmount\nExample:\n7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU,1500\n9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin,2500",
    textareaHint:
      "Separate each wallet address and token amount with a comma, space, or semicolon.",
    summaryTitle: "📊 Live Airdrop Validation & Cost Summary",
    readyToBroadcast: "✓ Ready to Broadcast",
    reviewRequired: "⚠️ Review Required",
    validWalletsLabel: "Valid Wallets",
    totalTokensLabel: "Total Tokens to Send",
    atomicBatchesLabel: "Atomic Tx Batches",
    totalServiceFeeLabel: "Total Service Fee",
    validateBtn: "✓ Validate Recipient List",
    sendAirdropBtn: "📦 Send Airdrop",
    processingAirdropStatus: "Processing Airdrop...",
    launchAnotherBtn: "📦 Launch Another Airdrop",
    sidebarTitle: "How Multi-Send Works",
    tutorialSteps: [
      {
        title: "1. Select Token from Wallet",
        description:
          "Choose any SPL or Token-2022 asset from your connected wallet to distribute to your community.",
      },
      {
        title: "2. Import CSV or Paste Wallets",
        description:
          "Paste Address,Amount pairs, upload a .CSV/.TXT file, or apply a uniform token amount across all addresses.",
      },
      {
        title: "3. Automatic ATA Creation & Batching",
        description:
          "Automatically creates missing Associated Token Accounts (ATAs) and batches up to 10 recipients per atomic transaction.",
      },
    ],
  },
  dashboardPage: {
    feeBadgeLabel: "Standardized Revocation Fee:",
    pageTitle: "Manage Token Authorities & Security",
    pageDesc:
      "Inspect your token's on-chain security score and permanently revoke Mint or Freeze authorities on Solana.",
    panelTitle: "Authority & Security Inspection Panel",
    panelDesc:
      "Select any SPL or Token-2022 asset from your wallet to verify its RugCheck security score and revoke active privileges.",
    connectPrompt: "Connect your wallet to inspect and manage token authorities.",
    step1SelectLabel: "1. Select a Token from Your Wallet",
    securityScoreTitle: "🛡️ On-Chain Security & RugCheck Readiness Score",
    scoreFull: "Fully Immutable & DEX-Ready ✓",
    scorePartial: "Partially Revoked",
    scoreActive: "Authorities Active",
    mintAuthTitle: "Mint Authority (Supply Cap)",
    freezeAuthTitle: "Freeze Authority (DEX Pool Lock)",
    statusRevoked: "Revoked ✓",
    statusActive: "Active",
    mintRevokedDesc:
      "Token supply is permanently fixed. No additional tokens can ever be minted.",
    mintActiveDesc:
      "Your wallet can still mint new tokens. Revoke to guarantee a fixed cap to holders.",
    freezeRevokedDesc:
      "No wallet can be frozen. Token is eligible for Raydium & Meteora liquidity pools.",
    freezeActiveDesc:
      "Must be revoked before initializing an AMM liquidity pool on Raydium or Meteora.",
    revokeMintBtn: "🔒 Revoke Mint Authority",
    revokeFreezeBtn: "❄️ Revoke Freeze Authority",
    goToLpBtn: "💧 Go to Liquidity Pool →",
    modalTitlePrefix: "Confirm Permanent Removal of Authority:",
    modalDesc:
      "This action is irreversible on the Solana blockchain and guarantees maximum investor trust on RugCheck. Do you want to proceed?",
    guideSections: [
      {
        title: "Mint vs. Freeze Authorities",
        description:
          "Mint Authority controls whether new tokens can be minted. Freeze Authority controls whether holder token accounts can be frozen.",
      },
      {
        title: "DEX & Raydium Pool Readiness",
        description:
          "Revoking Freeze Authority is mandatory for Raydium & Meteora liquidity pools. Revoking Mint Authority proves fixed supply to investors and RugCheck.",
      },
      {
        title: "Permanent & Atomic Routing",
        description:
          "Revoking an authority is irreversible on Solana and processed in a single atomic transaction signed by your wallet.",
      },
    ],
  },
  affiliatesPage: {
    pageTitle: "Affiliate Program: Earn 30% SOL Instantly",
    pageDesc:
      "Join our on-chain affiliate program and earn 30% instant commission in SOL on every token creation or liquidity pool transaction through your referral link.",
    linkCardTitle: "Your Personal Affiliate Link",
    linkExplanation:
      "This is your exclusive referral link. The ?ref= parameter is captured on any entry page and splits 30% of the service fee directly to your wallet in the exact same transaction.",
    connectPrompt: "Connect your Solana wallet to generate your personal affiliate link.",
    viewEarningsBtn: "View My Earnings & Ranking",
    hideEarningsBtn: "Hide Earnings Panel",
    dashboardTitle: "Earnings Dashboard",
    dashboardDesc: "Track your on-chain verified referral performance and 30% SOL commissions received.",
    totalEarningsLabel: "Total Earnings (30% Split)",
    verifiedReferralsLabel: "Verified Referrals",
    historyTitle: "Last 10 Verified Commissions",
    dateCol: "Date",
    amountCol: "Amount",
    txCol: "Transaction",
    noHistoryText: "No commission transactions yet.",
    howItWorksTitle: "How It Works",
    steps: [
      {
        title: "1. Connect Your Wallet:",
        text: "Your wallet's public address serves as your unique referral identifier.",
      },
      {
        title: "2. Copy Your Link:",
        text: "Your affiliate link is generated automatically with ?ref=YOUR_WALLET.",
      },
      {
        title: "3. Share and Refer:",
        text: "Share the link with creators launching tokens or liquidity pools.",
      },
      {
        title: "4. Receive 30% Instant Commissions:",
        text: "30% of the service fee is transferred directly to your wallet in the exact same transaction (70% Dev / 30% Affiliate).",
      },
    ],
    commissionCardTitle: "Your 30% SOL Commission",
    commissionCardText:
      "You receive 30% of all modular token creation and liquidity pool initialization fees generated through your link, sent directly to your wallet with zero withdrawal delays.",
    transparentCardTitle: "Transparent On-Chain Payments",
    transparentCardText:
      "Commissions are paid atomically via Solana's SystemProgram.transfer and verified on-chain before being indexed.",
  },
  docsPage: {
    pageTitle: "Platform Documentation",
    pageSubtitle:
      "Complete technical guide to creating tokens, initializing liquidity pools, burning LP, and running mass airdrops safely.",
    tocTitle: "Navigation",
    sections: [
      {
        id: "criar-token",
        title: "Token Creation (SPL & Token-2022)",
        summary:
          "Learn how to create your own fungible token on Solana with Arweave metadata and 100/100 RugCheck security.",
        intro:
          "The token creation process allows you to launch a digital asset on the Solana blockchain in a single atomic transaction:",
        bullets: [
          {
            label: "Token Identity:",
            text: "Define the Name, Symbol (Ticker), Decimals (0 to 9), and Total Supply using exact BigInt precision.",
          },
          {
            label: "Permanent Metadata:",
            text: "Your token logo and JSON metadata are stored permanently via Arweave/Irys using the Metaplex Fungible Token standard.",
          },
          {
            label: "Token Standard:",
            text: "Choose between Standard SPL (universal compatibility) and Token-2022 (supports protocol-level transfer fee extensions).",
          },
          {
            label: "RugCheck 100/100 Security:",
            text: "Revoke Freeze Authority (+50 pts), Mint Authority (+35 pts), and lock Immutable Metadata (+15 pts) during creation.",
          },
        ],
      },
      {
        id: "criar-liquidez",
        title: "Liquidity Pool Creation (Raydium & Meteora)",
        summary:
          "Allow your token to be publicly traded by initializing an on-chain AMM pool on Raydium CPMM or Meteora Dynamic AMM.",
        intro:
          "A token without liquidity cannot be traded. Creating a liquidity pool pairs your token with SOL or USDC:",
        bullets: [
          {
            label: "Raydium CPMM & Meteora DAMM:",
            text: "Initialize constant-product pools directly without needing an expensive legacy OpenBook Market ID.",
          },
          {
            label: "Initial Price & Market Cap:",
            text: "The ratio of Base Tokens and Quote Assets (SOL/USDC) deposited sets the initial launch price and market cap.",
          },
          {
            label: "LP Tokens:",
            text: "You receive 100% of the initial LP tokens in your wallet, which can be burned to lock liquidity or unwrapped to withdraw SOL.",
          },
        ],
      },
      {
        id: "queimar-tokens",
        title: "Token Burning & Reclaim SOL",
        summary:
          "Reduce circulating supply, burn LP tokens with a verifiable PNG Certificate, and recover rent SOL from empty accounts.",
        intro:
          "Token burning is an irreversible deflationary mechanism verified directly on the Solana blockchain:",
        bullets: [
          {
            label: "Official PNG Certificate:",
            text: "Generate and download a high-resolution '100% BURNED & VERIFIED ON-CHAIN' certificate with Solscan verification.",
          },
          {
            label: "Reclaim SOL (Rent Recovery):",
            text: "Close zero-balance token accounts in your wallet and recover locked rent SOL immediately.",
          },
        ],
      },
      {
        id: "airdrop",
        title: "Mass Distribution (Airdrop)",
        summary: "Send your token to multiple wallets in batched atomic transactions.",
        intro: "Airdrops enable fast community distribution and reward campaigns:",
        bullets: [
          {
            label: "Smart Validation:",
            text: "Validates every recipient PublicKey and token amount before building transactions.",
          },
          {
            label: "Automatic ATA Creation:",
            text: "Automatically initializes Associated Token Accounts (ATAs) for recipients who do not yet hold your token.",
          },
        ],
      },
      {
        id: "gerenciar-tokens",
        title: "Authority Management",
        summary: "Inspect your tokens and renounce Mint and Freeze authorities on-chain.",
        intro:
          "The Management Dashboard lets you verify and revoke privileges on any token you control:",
        bullets: [
          {
            label: "Revoke Mint Authority:",
            text: "Makes the total token supply permanently fixed so no additional tokens can ever be minted.",
          },
          {
            label: "Revoke Freeze Authority:",
            text: "Prevents any wallet from being frozen and is required before creating liquidity pools on Raydium/Meteora.",
          },
        ],
      },
      {
        id: "afiliados",
        title: "On-Chain Affiliate Program (30%)",
        summary: "Earn 30% SOL commissions automatically on every referred transaction.",
        intro:
          "Our affiliate program splits the service fee atomically inside the same Solana transaction:",
        bullets: [
          {
            label: "Instant Referral Link:",
            text: "Connect your wallet to generate your ?ref=YOUR_WALLET referral link and track payouts on Solscan.",
          },
        ],
      },
    ],
  },
  costsPage: {
    pageTitle: "Transparent Cost & Fee Schedule",
    pageDesc:
      "Estimated costs for all operations on the Solana network, including our modular platform service fee and estimated Solana network rent.",
    loading: "Loading fee schedule...",
    labels: {
      createToken: "Token Creation (Modular 0.10 – 0.55 SOL)",
      burnToken: "Token / LP Burn (0.05 SOL Fee)",
      airdrop: "Mass Airdrop (0.05 SOL / Batch)",
      manageAuthority: "Revoke Authorities (0.05 SOL Fee)",
      createLiquidityPool: "Create Liquidity Pool (0.15 SOL Fee)",
      removeLiquidity: "Withdraw Liquidity in SOL (0.05 SOL Fee)",
    },
  },
  confirmationPage: {
    pageTitle: "Token Launch Status",
    infoBanner:
      "Your token is now live on Solana! Follow the 3 steps below to add liquidity, burn LP (Rug-Proof), and distribute to your community.",
    mintedVerifiedTitle: "Token Minted & Verified On-Chain!",
    mintAddressLabel: "Token Mint Address:",
    txSignatureLabel: "Transaction Signature:",
    viewTokenSolscan: "View Token on Solscan ↗",
    viewTxSolscan: "View Transaction on Solscan ↗",
    funnelTitle: "🚀 Next Steps to List Your Token",
    funnelSubtitle:
      "Your new token address will be pre-selected automatically in each step:",
    step1Badge: "Step 1 · DEX Trading",
    step1Title: "💧 Create Liquidity Pool",
    step1Desc:
      "Initialize your pair on Raydium CPMM or Meteora DAMM to enable public trading.",
    step2Badge: "Step 2 · Rug-Proof Badge",
    step2Title: "🔥 Burn Liquidity / Supply (LP Burn)",
    step2Desc:
      "Burn LP tokens or supply and generate your verifiable PNG Burn Certificate.",
    step3Badge: "Step 3 · Viral Distribution",
    step3Title: "📦 Run Community Airdrop",
    step3Desc:
      "Batch-send tokens to multiple wallets with automatic ATA account creation.",
    backToCreator: "← Back to Token Creator",
  },
  footer: {
    badges: [
      {
        title: "100% Non-Custodial & Program-Whitelisted",
        desc: "Every transaction is verified against our client-side Solana program whitelist and simulated before your wallet signs.",
      },
      {
        title: "Audited On-Chain Protocols",
        desc: "Built directly on official Solana SPL Token, Token-2022, Metaplex Token Metadata, and Constant-Product AMM Liquidity Vaults.",
      },
      {
        title: "Modular Pricing & 30% Affiliate Split",
        desc: "Transparent modular fees routed atomically on-chain with 30% instant referral payouts.",
      },
      {
        title: "Mainnet-Beta Default & Devnet Ready",
        desc: "Defaults to Solana Mainnet-Beta for production launches, with 1-click switching to Solana Devnet for free testing.",
      },
    ],
    tagline:
      "Swiss-engineered non-custodial launchpad for creating SPL & Token-2022 assets, initializing AMM liquidity pools, and managing token authorities on Solana.",
    connectedTo: "Connected to Solana RPC",
    servicesTitle: "Platform Services",
    resourcesTitle: "Resources & Transparency",
    programsTitle: "Verified On-Chain Programs",
    rightsReserved:
      "All rights reserved. Non-custodial interface for the Solana blockchain.",
    securityNotice:
      "Security Notice: Always review transaction simulations in your wallet before signing.",
  },
};

const ES_TRANSLATIONS: TranslationDictionary = {
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
      "🟡 Metadatos Mutables: Bloquea la mutabilidad (+0.05 SOL) para lograr 100/100 en RugCheck",
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
    platformFeeLabel: "Tarifa Plataforma (15%)",
    netToYouLabel: "Neto para Ti (85%)",
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
    withdrawCtaLink: "Retirar Liquidez en SOL (0.05 SOL)",
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
      createToken: "Creación de Token (Modular 0.10 – 0.55 SOL)",
      burnToken: "Quema de Tokens / LP (Tarifa 0.05 SOL)",
      airdrop: "Airdrop Masivo (0.05 SOL / Lote)",
      manageAuthority: "Revocar Autoridades (Tarifa 0.05 SOL)",
      createLiquidityPool: "Crear Pool de Liquidez (Tarifa 0.15 SOL)",
      removeLiquidity: "Retirar Liquidez en SOL (Tarifa 0.05 SOL)",
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

const RU_TRANSLATIONS: TranslationDictionary = {
  nav: {
    createToken: "Создать Токен",
    liquidityPool: "Пул Ликвидности",
    burn: "Сжигание / возврат SOL",
    airdrop: "Массовый Airdrop",
    manage: "Права (Authorities)",
    affiliates: "Партнёрам (30%)",
    docs: "Документация",
  },
  wallet: {
    connect: "Подключить Кошелёк",
    connecting: "Подключение...",
    copyAddress: "Скопировать Адрес",
    copied: "✓ Скопировано!",
    changeWallet: "Сменить Кошелёк",
    viewExplorer: "Открыть в Solscan ↗",
    disconnect: "Отключить Кошелёк",
    balanceLabel: "Баланс в Сети",
  },
  network: {
    mainnetShort: "Mainnet (Реальная)",
    devnetShort: "Devnet (Тест)",
    mainnetBannerTitle: "АКТИВНА ОСНОВНАЯ СЕТЬ: SOLANA MAINNET-BETA",
    mainnetBannerDesc:
      "Вы работаете в продакшн-сети. Все токены, пулы ликвидности и комиссии используют реальные SOL.",
    devnetBannerTitle: "АКТИВЕН ТЕСТОВЫЙ РЕЖИМ: SOLANA DEVNET (SANDBOX)",
    devnetBannerDesc:
      "Бесплатная среда симуляции! Токены в Devnet предназначены для тестирования и не имеют рыночной стоимости.",
    switchToDevnet: "Тестировать в Devnet →",
    switchToMainnet: "Перейти в Mainnet →",
    faucetBtn: "🚰 +1 Бесплатный SOL (Faucet)",
    faucetLoading: "Отправка +1 SOL...",
    faucetSuccess: "✓ +1 SOL Получен!",
  },
  home: {
    heroBadgeMainnet: "🟢 Работа в Сети · Solana Mainnet-Beta",
    heroBadgeDevnet: "🟠 Тестовая Песочница · Solana Devnet",
    heroTitle: "Создайте Токен на Solana за Секунды",
    heroSubtitle:
      "Запускайте токены SPL или Token-2022 с защитой RugCheck 100/100, неизменяемыми метаданными в Arweave и пулами ликвидности без программирования.",
    costSummaryTitle: "Модульный Расчёт Стоимости",
    quickGuideTitle: "Краткое Руководство",
    suiteTitle: "Полная Экосистема для Вашего Токена",
    suiteSubtitle:
      "Всё необходимое после минта: создание пулов ликвидности, сжигание LP с PNG-сертификатом, возврат SOL с пустых аккаунтов и массовые аирдропы.",
    faqTitle: "Часто Задаваемые Вопросы (FAQ)",
    quickGuide: [
      {
        title: "Что такое токен SPL?",
        description:
          "Официальный стандарт взаимозаменяемых токенов в сети Solana. Совместим со всеми кошельками (Phantom, Solflare) и DEX (Raydium, Meteora, Jupiter).",
      },
      {
        title: "Что такое Token-2022?",
        description:
          "Новое поколение программы токенов Solana с поддержкой встроенной комиссии за переводы (Tax Token) на уровне протокола.",
      },
      {
        title: "RugCheck 100/100 (Mint и Freeze)",
        description:
          "Отзыв Freeze Authority открывает создание пулов ликвидности (+50 баллов). Отзыв Mint Authority фиксирует эмиссию (+35 баллов), а Immutable Metadata даёт +15 баллов.",
      },
      {
        title: "Mainnet-Beta против Devnet",
        description:
          "В Mainnet-Beta ваш токен реален и торгуется на DEX. В Devnet вы можете бесплатно протестировать создание токена с помощью кнопки Faucet (+1 SOL).",
      },
    ],
    ecosystemDesc: {
      liquidityPool:
        "Создавайте пулы или выводите ликвидность в SOL на Raydium CPMM и Meteora Dynamic AMM в 1 клик.",
      burn: "Сжигайте токены/LP с официальным PNG-сертификатом и возвращайте SOL с пустых аккаунтов.",
      airdrop:
        "Рассылайте токены на сотни кошельков одновременно с автоматическим созданием ATA-аккаунтов.",
      manage: "Проверяйте рейтинг безопасности RugCheck и отзывайте права Mint или Freeze ончейн.",
      affiliates:
        "Создайте реферальную ссылку и мгновенно получайте 30% комиссии в SOL в каждой транзакции.",
      docs: "Пошаговые руководства по токеномике, пулам ликвидности и безопасности RugCheck.",
    },
  },
  form: {
    targetNetwork: "Выбранная Сеть:",
    totalModularFee: "Итоговая Модульная Комиссия:",
    step1: "1. Профиль Токена",
    step2: "2. Логотип и Соцсети",
    step3: "3. Безопасность и Минт",
    tokenName: "Название Токена",
    tokenSymbol: "Тикер (Символ)",
    decimals: "Десятичные Знаки (0 – 9)",
    supply: "Начальная Эмиссия (Supply)",
    storagePipeline: "Хранение Логотипа и Метаданных",
    logoLabel: "Логотип Токена (PNG, JPG, WEBP, GIF — Макс. 5 МБ)",
    dropzonePrompt: "Перетащите логотип токена сюда или нажмите для выбора файла",
    uploadingImg: "Загрузка и проверка изображения...",
    description: "Описание Проекта (Необязательно)",
    website: "Официальный Сайт (Необязательно)",
    twitter: "X / Twitter (Необязательно)",
    instagram: "Instagram (Необязательно)",
    customCreatorTitle: 'Настроить "Creator Info" в Метаданных',
    customCreatorDesc:
      "Заменяет стандартную подпись создателя в метаданных на название и сайт вашей команды.",
    creatorName: "Имя Создателя / Студии",
    creatorUrl: "Официальный Сайт Создателя",
    tokenStandard: "Стандарт Программы Solana",
    standardSpl: "Стандартный SPL (Универсальная Совместимость)",
    standard2022: "Token-2022 (Расширение Tax Token / Комиссия за Перевод)",
    securityTitle: "Ончейн-Защита и RugCheck 100/100 (Модульные Опции)",
    revokeFreezeTitle: "Отозвать Freeze Authority (Рекомендуется)",
    revokeFreezeDesc:
      "Обязательно для создания пула ликвидности на Raydium/Meteora и торговли на Jupiter (+50 баллов RugCheck).",
    revokeMintTitle: "Отозвать Mint Authority (Рекомендуется)",
    revokeMintDesc:
      "Навсегда фиксирует общую эмиссию и запрещает дополнительный выпуск токенов (+35 баллов RugCheck).",
    immutableTitle: "Неизменяемые Метаданные (Immutable)",
    immutableDesc:
      "Навсегда закрепляет имя, символ и изображение токена в эксплорерах (+15 баллов RugCheck).",
    backBtn: "← Назад",
    continueBtn: "Далее →",
    submitMainnet: "🚀 Создать Токен в Mainnet-Beta",
    submitDevnet: "🧪 Создать Тестовый Токен в Devnet",
  },
  costs: {
    headerTitle: "Прозрачность Ончейн-Расходов",
    headerBadge: "100% Атомарно",
    rentLabel: "Рента аккаунта сети (Rent):",
    networkFeeLabel: "Комиссия сети:",
    serviceFeeLabel: "Сервисная комиссия:",
    baseCreate: "Базовая Комиссия за Создание (Token Mint)",
    revokeFreeze: "Отзыв Freeze Authority (Готовность к Пулу)",
    revokeMint: "Отзыв Mint Authority (Фиксированный Supply)",
    immutable: "Неизменяемые Метаданные (Immutable)",
    customCreator: "Персонализация Creator Info (Метаданные)",
    transferFeeExt: "Расширение Tax Token / Transfer Fee (Token-2022)",
    totalModular: "Итого Модульная Комиссия:",
    networkRent: "Рента Сети Solana (Оценка):",
    estimatedWalletTotal: "Итоговая Оценка",
    singleSignatureSub: "Одна подпись в кошельке",
    atomicDisclaimer:
      "Атомарное списание в одной транзакции с мгновенным распределением 30% партнёру и 70% на Dev Wallet.",
  },
  common: {
    activeNetwork: "Активная Сеть:",
    refreshWallet: "↻ Обновить Кошелёк",
    availableBalance: "Доступный Баланс:",
    walletBalance: "Баланс Кошелька:",
    copy: "Копировать",
    copied: "✓ Скопировано!",
    viewOnSolscan: "Открыть в Solscan ↗",
    loading: "Загрузка...",
    cancel: "Отмена",
    confirmAndRevoke: "Подтвердить и Отозвать",
    signingAndConfirming: "Подписание и Подтверждение...",
    irreversibleWarning: "⚠️ Необратимое Ончейн-Действие",
  },
  tokenSelector: {
    loadingAria: "Загрузка токенов кошелька",
    balancePrefix: "Баланс:",
    noTokensDetected: "В подключённом кошельке не найдено токенов в этой сети",
    clickToChoose: "Нажмите, чтобы выбрать токен из подключённого кошелька",
    dropdownHeader: "Активы Подключённого Кошелька — Нажмите для Выбора",
    lpPoolTokenTag: "LP Токен Пула",
  },
  tokenPreview: {
    cardTitle: "Симулятор Кошелька и Аудит Безопасности",
    cardDesc:
      "Предпросмотр вашего токена в реальном времени для Phantom, Solflare и DexScreener.",
    headerLabel: "ПРЕДПРОСМОТР АКТИВА В КОШЕЛЬКЕ SOLANA",
    defaultTokenName: "Название Токена",
    decimalsLabel: "Десятичные",
    transferFeeLabel: "Налог на Перевод",
    metadataLabel: "Метаданные",
    immutable: "Неизменяемые",
    mutable: "Изменяемые",
    auditTitle: "🛡️ Аудит Безопасности и RugCheck Score",
    alertSafe: "🟢 100/100 - Безопасно (Стандарт DexScreener / RugCheck)",
    alertFreeze: "🔴 Критично: Активный Freeze Authority блокирует пулы и торговлю на Jupiter",
    alertMint: "🟡 Риск размытия: Открытый Mint Authority вызывает предупреждения в сканерах",
    alertMutable:
      "🟡 Изменяемые метаданные: Заблокируйте метаданные (+0.05 SOL) для 100/100 в RugCheck",
  },
  stepper: {
    defaultTitle: "Выполнение Транзакции Solana",
    stepBadge: "Шаг",
    steps: [
      "1. Загрузка в Irys",
      "2. Загрузка Метаданных",
      "3. Ожидание Подписи",
      "4. Подтверждение в Сети",
    ],
  },
  liquidityPage: {
    addFeeLabel: "Комиссия Создания Пула:",
    withdrawFeeLabel: "Комиссия Вывода Ликвидности:",
    titleAdd: "Создать Ончейн Пул Ликвидности",
    titleWithdraw: "Вывести Ликвидность в SOL",
    descAdd:
      "Инициализируйте пул ликвидности и выпустите LP-токены на Solana. Выберите токен прямо из кошелька, внесите начальную ликвидность и получите 100% LP-токенов.",
    descWithdraw:
      "Выберите токен или LP-токен прямо из подключённого кошелька. Конвертирует хранилище WSOL обратно в нативные SOL в одной атомарной транзакции.",
    tabAdd: "➕ Добавить Ликвидность",
    tabWithdraw: "💸 Вывести Ликвидность в SOL",
    configurePairTitle: "Настройка Пары Ликвидности",
    configurePairDesc:
      "Выберите токен из кошелька, укажите объём начальной ликвидности и выпустите LP-токены в одной атомарной транзакции.",
    readyStep1: "1. AMM Выбран ✓",
    readyStep2Done: "2. Токен Выбран ✓",
    readyStep2Pending: "2. Ожидание Токена",
    readyStep3Done: "3. Суммы Указаны ✓",
    readyStep3Pending: "3. Ожидание Сумм",
    readyStep4Done: "4. Freeze Auth Готов ✓",
    readyStep4Warn: "4. Требуется Отзыв Freeze",
    step1AmmLabel: "1. Выберите Архитектуру AMM",
    raydiumDesc:
      "Хранилища ликвидности постоянного произведения с нативным выпуском LP-токенов в Mainnet-Beta и Devnet.",
    meteoraDesc:
      "Динамические пулы ликвидности с настраиваемыми уровнями комиссий и мгновенным выпуском LP.",
    step2SelectToken: "2. Выберите Токен Прямо из Подключённого Кошелька",
    freezeWarnTitle: "Обнаружен Активный Freeze Authority",
    freezeWarnDesc:
      "Для создания пула ликвидности необходимо отозвать Freeze Authority. Мы отзовём его автоматически в той же транзакции.",
    freezeAutoRevokeCheck: "Авто-отзыв в той же транзакции",
    tokenAmountLabel: "Количество Токенов в Пул",
    initialLiquidityLabel: "Начальная Ликвидность",
    swapFeeTierLabel: "Комиссия Свопа в Пуле",
    tierRecommended: "Рекомендуется",
    tierStandard: "Стандарт AMM",
    tierHighVol: "Высокая Волатильность",
    activationScheduleLabel: "Время Запуска Торгов",
    immediateBtn: "Мгновенно",
    scheduleTimeBtn: "Запланировать",
    simulatorTitle: "Экономическая Симуляция Пула в Реальном Времени",
    initialPriceLabel: "Начальная Цена Токена",
    impliedMcapLabel: "Расчётный Market Cap",
    poolAllocationLabel: "Доля Эмиссии в Пуле",
    devFeeLabel: "Сервисная Комиссия",
    submitAddBtn: "Создать Пул Ликвидности и Выпустить LP",
    initializingPoolStatus: "Инициализация Ончейн Пула Ликвидности...",
    withdrawCardTitle: "Вывод Ликвидности в SOL",
    withdrawCardDesc:
      "Нажмите на любой токен или LP-токен из вашего кошелька ниже — без ручного ввода тикера или адреса.",
    selectWithdrawalShareLabel: "2. Выберите Долю Вывода SOL",
    sharePartial: "Частичный Выход",
    shareHalf: "Половина Позиции",
    shareMajor: "Основная Часть",
    shareFull: "Полный Вывод + Рента",
    withdrawSimulatorTitle: "Расчёт Вывода Ликвидности в SOL",
    selectedShareLabel: "Выбранная Доля",
    estimatedSolUnwrapped: "Ожидаемый Возврат SOL",
    estNetSolToWallet: "Чистый Возврат SOL в Кошелёк",
    submitWithdrawBtn: "💸 Вывести Ликвидность в SOL",
    withdrawingStatus: "Вывод Ликвидности в SOL...",
    vaultAutoDetected: "Автоматически Обнаружено Хранилище WSOL",
    inspectingVault: "Проверка ончейн-хранилища...",
    readyToUnwrap: "Готово к разблокировке WSOL / ATA",
    sidebarAddTitle: "Архитектура Пула и Ончейн-Досье",
    sidebarWithdrawTitle: "Прямой Вывод SOL в Кошелёк",
    sidebarAddBullets: [
      {
        title: "Выбор в 1 Клик:",
        text: "Выберите любой токен прямо из подключённого кошелька без ввода адреса смарт-контракта.",
      },
      {
        title: "Реальный Выпуск LP Ончейн:",
        text: "Создаёт детерминированный Pool Authority PDA, оборачивает SOL в WSOL-хранилище и начисляет LP-токены.",
      },
      {
        title: "Гибкий Возврат SOL:",
        text: "Нужно вывести внесённые SOL позже? Переключитесь на вкладку «Вывести Ликвидность в SOL» в любое время.",
      },
    ],
    sidebarWithdrawBullets: [
      {
        title: "Без Ввода Адресов:",
        text: "Просто выберите токен или LP-токен из списка кошелька; адрес хранилища определяется автоматически.",
      },
      {
        title: "Частичный или Полный Вывод (25% – 100%):",
        text: "Выведите часть ликвидности или 100% MAX (включая возврат ренты аккаунта).",
      },
    ],
  },
  burnPage: {
    feeBadgeLabel: "Фиксированная Комиссия Сжигания:",
    pageTitle: "Ончейн Сжигание Токенов и LP + Возврат SOL",
    pageDesc:
      "Выберите любой токен или LP-токен из кошелька, сгенерируйте визуальный PNG-сертификат Rug-Proof и верните SOL, заблокированные в пустых аккаунтах.",
    cardTitle: "Сжигание Токенов или LP-Токенов",
    cardDescPrefix:
      "Выберите токен или LP-токен прямо из подключённого кошелька. Сервисная комиссия:",
    step1SelectLabel: "1. Выберите Токен или LP-Токен из Вашего Кошелька",
    step2AmountLabel: "2. Количество для Сжигания",
    impactTitle: "🔥 Предпросмотр Дефляционного Сжигания",
    irreversibleBadge: "НЕОБРАТИМО ОНЧЕЙН",
    currentBalanceLabel: "Текущий Баланс Кошелька",
    amountToDestroyLabel: "Количество к Уничтожению",
    remainingBalanceLabel: "Остаток на Балансе",
    shareBurnedLabel: "Доля Сожжённых Токенов",
    submitBurnBtnPrefix: "🔥 Сжечь Выбранные Токены",
    executingBurnStatus: "Выполнение Ончейн-Сжигания...",
    certHeaderTitle: "🏆 Официальный Сертификат LP Burn / Rug-Proof",
    downloadPngBtn: "⬇️ Скачать PNG Сертификат",
    shareXBtn: "𝕏 Поделиться в X (Twitter)",
    reclaimBadge: "💎 ВИРУСНЫЙ ИНСТРУМЕНТ · ЗАКРЫТИЕ ПУСТЫХ АККАУНТОВ",
    reclaimTitle: "Возврат SOL с Пустых Аккаунтов (Rent Recovery)",
    reclaimDesc:
      "Каждый пустой токен-аккаунт в вашем кошельке удерживает SOL за аренду (rent). Закройте до 20 пустых аккаунтов за одну транзакцию и мгновенно верните свои SOL.",
    reclaimBannerPrefix: "В вашем кошельке обнаружено",
    reclaimBannerSuffix: "пустых аккаунтов =",
    emptyAccountsLabel: "Пустые Аккаунты (Баланс 0)",
    platformFeeLabel: "Комиссия Платформы (15%)",
    netToYouLabel: "Чистыми Вам (85%)",
    reclaimSubmitBtn: "⚡ Вернуть Мои SOL Сейчас",
    reclaimEmptyBtn: "В Подключённом Кошельке Нет Пустых Аккаунтов",
    reclaimingStatus: "Возврат SOL...",
    sidebarHowItWorks: "Как Работает Сжигание Токенов и LP",
    tutorial1Title: "1. Прямой Выбор из Кошелька",
    tutorial1Desc:
      "Все токены SPL, Token-2022 и LP из вашего кошелька отображаются автоматически (или выбираются через ?mint=).",
    tutorial2Title: "2. Визуальный Сертификат и Возврат SOL",
    tutorial2Desc:
      "После сжигания скачайте официальный PNG-сертификат '100% BURNED & VERIFIED ON-CHAIN' и поделитесь им в X. Также закройте пустые аккаунты для возврата SOL.",
    withdrawCtaTitle: "Хотите Сначала Вывести Ликвидность в SOL?",
    withdrawCtaDesc:
      "Если вы хотите вернуть вложенные SOL перед сжиганием LP-токенов, воспользуйтесь инструментом:",
    withdrawCtaLink: "Вывести Ликвидность в SOL (0.05 SOL)",
  },
  airdropPage: {
    feeBadgeLabel: "Комиссия за Пакет:",
    pageTitle: "Массовый Airdrop Токенов и Multi-Sender",
    pageDesc:
      "Рассылайте токены SPL или Token-2022 на множество кошельков Solana пакетными атомарными транзакциями с автоматическим созданием ATA.",
    cardTitle: "Настройка Массовой Рассылки (Airdrop)",
    cardDescPrefix:
      "Выберите токен, импортируйте или вставьте список адресов и проверьте баланс перед отправкой. Сервисная комиссия:",
    step1SelectLabel: "1. Выберите Токен для Рассылки",
    step2RecipientsLabel: "2. Список Кошельков Получателей (Адрес,Количество)",
    loadSampleBtn: "📄 Загрузить Пример",
    importCsvBtn: "📁 Импорт CSV / TXT",
    clearListBtn: "✕ Очистить Список",
    uniformLabel: "⚡ Установить Единую Сумму для Всех Кошельков:",
    applyAllBtn: "Применить ко Всем Строкам",
    textareaPlaceholder:
      "Один получатель на строку: АдресКошелька,Количество\nПример:\n7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU,1500\n9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin,2500",
    textareaHint:
      "Разделяйте адрес кошелька и количество токенов запятой, пробелом или точкой с запятой.",
    summaryTitle: "📊 Проверка Списка и Сводка Расходов",
    readyToBroadcast: "✓ Готово к Отправке",
    reviewRequired: "⚠️ Требуется Проверка",
    validWalletsLabel: "Валидных Кошельков",
    totalTokensLabel: "Всего Токенов к Отправке",
    atomicBatchesLabel: "Атомарных Пакетов (Batches)",
    totalServiceFeeLabel: "Общая Сервисная Комиссия",
    validateBtn: "✓ Проверить Список Получателей",
    sendAirdropBtn: "📦 Отправить Airdrop",
    processingAirdropStatus: "Отправка Airdrop...",
    launchAnotherBtn: "📦 Запустить Ещё Один Airdrop",
    sidebarTitle: "Как Работает Multi-Send",
    tutorialSteps: [
      {
        title: "1. Выберите Токен из Кошелька",
        description:
          "Выберите любой токен SPL или Token-2022 из подключённого кошелька для рассылки сообществу.",
      },
      {
        title: "2. Импортируйте CSV или Вставьте Список",
        description:
          "Вставьте пары Адрес,Количество, загрузите файл .CSV/.TXT или укажите единую сумму для всех адресов.",
      },
      {
        title: "3. Авто-Создание ATA и Пакетная Отправка",
        description:
          "Автоматически создаёт недостающие ATA-аккаунты и объединяет до 10 получателей в одну атомарную транзакцию.",
      },
    ],
  },
  dashboardPage: {
    feeBadgeLabel: "Фиксированная Комиссия Отзыва:",
    pageTitle: "Управление Правами (Authorities) и Безопасностью",
    pageDesc:
      "Проверьте ончейн-рейтинг безопасности вашего токена и навсегда отзовите права Mint или Freeze в сети Solana.",
    panelTitle: "Панель Проверки Прав и Безопасности",
    panelDesc:
      "Выберите любой актив SPL или Token-2022 из вашего кошелька для проверки RugCheck Score и отзыва активных прав.",
    connectPrompt: "Подключите кошелёк для проверки и управления правами ваших токенов.",
    step1SelectLabel: "1. Выберите Токен из Вашего Кошелька",
    securityScoreTitle: "🛡️ Ончейн-Рейтинг Безопасности и Готовность к RugCheck",
    scoreFull: "100% Неизменяемый и Готов к DEX ✓",
    scorePartial: "Частично Отозваны",
    scoreActive: "Права Активны",
    mintAuthTitle: "Mint Authority (Лимит Эмиссии)",
    freezeAuthTitle: "Freeze Authority (Доступ к DEX Пулу)",
    statusRevoked: "Отозвано ✓",
    statusActive: "Активно",
    mintRevokedDesc:
      "Эмиссия токена зафиксирована навсегда. Дополнительный выпуск токенов невозможен.",
    mintActiveDesc:
      "Ваш кошелёк всё ещё может выпускать новые токены. Отзовите право для фиксации эмиссии.",
    freezeRevokedDesc:
      "Ни один кошелёк не может быть заморожен. Токен готов для пулов ликвидности Raydium и Meteora.",
    freezeActiveDesc:
      "Необходимо отозвать перед созданием пула ликвидности AMM на Raydium или Meteora.",
    revokeMintBtn: "🔒 Отозвать Mint Authority",
    revokeFreezeBtn: "❄️ Отозвать Freeze Authority",
    goToLpBtn: "💧 Перейти к Пулу Ликвидности →",
    modalTitlePrefix: "Подтвердите Бессрочный Отзыв Права:",
    modalDesc:
      "Это действие необратимо в блокчейне Solana и обеспечивает максимальное доверие инвесторов в RugCheck. Продолжить?",
    guideSections: [
      {
        title: "Права Mint против Freeze",
        description:
          "Mint Authority отвечает за выпуск новых токенов. Freeze Authority позволяет замораживать счета держателей.",
      },
      {
        title: "Готовность к DEX и Raydium",
        description:
          "Отзыв Freeze Authority обязателен для пулов Raydium и Meteora. Отзыв Mint Authority подтверждает фиксированную эмиссию в RugCheck.",
      },
      {
        title: "Бессрочное Атомарное Выполнение",
        description:
          "Отзыв прав необратим в сети Solana и выполняется в одной атомарной транзакции, подписанной вашим кошельком.",
      },
    ],
  },
  affiliatesPage: {
    pageTitle: "Партнёрская Программа: 30% в SOL Мгновенно",
    pageDesc:
      "Присоединяйтесь к нашей ончейн партнёрской программе и получайте 30% мгновенной комиссии в SOL с каждого создания токена или пула ликвидности по вашей ссылке.",
    linkCardTitle: "Ваша Персональная Реферальная Ссылка",
    linkExplanation:
      "Это ваша уникальная реферальная ссылка. Параметр ?ref= сохраняется при входе на любую страницу и автоматически переводит 30% сервисной комиссии прямо на ваш кошелёк в той же транзакции.",
    connectPrompt: "Подключите кошелёк Solana, чтобы сгенерировать персональную реферальную ссылку.",
    viewEarningsBtn: "Показать Мои Доходы и Историю",
    hideEarningsBtn: "Скрыть Панель Доходов",
    dashboardTitle: "Панель Доходов Партнёра",
    dashboardDesc: "Отслеживайте подтверждённые ончейн-рефералы и полученные комиссии 30% в SOL.",
    totalEarningsLabel: "Общий Доход (30% Сплит)",
    verifiedReferralsLabel: "Подтверждённые Рефералы",
    historyTitle: "Последние 10 Подтверждённых Выплат",
    dateCol: "Дата",
    amountCol: "Сумма",
    txCol: "Транзакция",
    noHistoryText: "Пока нет подтверждённых партнёрских выплат.",
    howItWorksTitle: "Как Это Работает",
    steps: [
      {
        title: "1. Подключите Кошелёк:",
        text: "Публичный адрес вашего кошелька служит уникальным идентификатором партнёра.",
      },
      {
        title: "2. Скопируйте Ссылку:",
        text: "Ваша партнёрская ссылка создаётся автоматически с параметром ?ref=ВАШ_КОШЕЛЁК.",
      },
      {
        title: "3. Делитесь Ссылкой:",
        text: "Отправляйте ссылку создателям мемкоинов, токенов и пулов ликвидности.",
      },
      {
        title: "4. Получайте 30% Мгновенно:",
        text: "30% сервисной комиссии переводится прямо на ваш кошелёк в той же транзакции (70% Dev / 30% Партнёр).",
      },
    ],
    commissionCardTitle: "Ваша Комиссия 30% в SOL",
    commissionCardText:
      "Вы получаете 30% от всех модульных комиссий за выпуск токенов и создание пулов ликвидности по вашей ссылке напрямую в кошелёк без задержек.",
    transparentCardTitle: "Прозрачные Ончейн-Выплаты",
    transparentCardText:
      "Выплаты происходят атомарно через SystemProgram.transfer сети Solana и проверяются в блокчейне.",
  },
  docsPage: {
    pageTitle: "Документация Платформы",
    pageSubtitle:
      "Полное техническое руководство по созданию токенов, запуску пулов ликвидности, сжиганию LP и массовым аирдропам.",
    tocTitle: "Навигация",
    sections: [
      {
        id: "criar-token",
        title: "Создание Токенов (SPL и Token-2022)",
        summary:
          "Узнайте, как выпустить собственный токен на Solana с метаданными в Arweave и защитой RugCheck 100/100.",
        intro:
          "Процесс создания позволяет запустить цифровой актив в блокчейне Solana одной атомарной транзакцией:",
        bullets: [
          {
            label: "Параметры Токена:",
            text: "Укажите имя, тикер, десятичные знаки (0–9) и общую эмиссию с точной поддержкой BigInt.",
          },
          {
            label: "Вечные Метаданные:",
            text: "Логотип и JSON метаданных сохраняются децентрализованно через Arweave/Irys по стандарту Metaplex.",
          },
          {
            label: "Выбор Стандарта:",
            text: "Стандартный SPL (универсальная совместимость) или Token-2022 (встроенный налог на переводы / Tax Token).",
          },
          {
            label: "Защита RugCheck 100/100:",
            text: "Отзовите Freeze Authority (+50 баллов), Mint Authority (+35 баллов) и закрепите метаданные (+15 баллов).",
          },
        ],
      },
      {
        id: "criar-liquidez",
        title: "Создание Пула Ликвидности (Raydium и Meteora)",
        summary:
          "Откройте публичные торги вашим токеном, запустив AMM-пул на Raydium CPMM или Meteora Dynamic AMM.",
        intro:
          "Без ликвидности токен нельзя купить или продать. Создание пула связывает ваш токен с SOL или USDC:",
        bullets: [
          {
            label: "Raydium CPMM и Meteora DAMM:",
            text: "Запускайте пулы постоянного произведения без покупки дорогого OpenBook Market ID.",
          },
          {
            label: "Начальная Цена и Капитализация:",
            text: "Соотношение внесённых токенов и SOL/USDC автоматически формирует стартовую цену.",
          },
          {
            label: "LP-Токены:",
            text: "Вы получаете 100% выпущенных LP-токенов: их можно сжечь для блокировки ликвидности или использовать для вывода SOL.",
          },
        ],
      },
      {
        id: "queimar-tokens",
        title: "Сжигание Токенов (Burn) и Возврат SOL",
        summary:
          "Сокращайте эмиссию, сжигайте LP-токены с PNG-сертификатом и возвращайте ренту SOL с пустых аккаунтов.",
        intro:
          "Сжигание токенов — необратимый дефляционный механизм, подтверждаемый в блокчейне Solana:",
        bullets: [
          {
            label: "Официальный PNG-Сертификат:",
            text: "Скачивайте сертификат высокого разрешения '100% BURNED & VERIFIED ON-CHAIN' со ссылкой на Solscan.",
          },
          {
            label: "Возврат SOL (Rent Recovery):",
            text: "Закрывайте пустые токен-аккаунты в кошельке и мгновенно возвращайте заблокированные SOL.",
          },
        ],
      },
      {
        id: "airdrop",
        title: "Массовая Рассылка (Airdrop)",
        summary: "Отправляйте токены на десятки и сотни кошельков пакетными транзакциями.",
        intro: "Инструмент Multi-Sender ускоряет проведение аирдропов и вознаграждение комьюнити:",
        bullets: [
          {
            label: "Умная Валидация:",
            text: "Проверяет каждый адрес Base58 и достаточность баланса перед отправкой.",
          },
          {
            label: "Авто-Создание ATA:",
            text: "Автоматически инициализирует токен-аккаунты (ATA) для получателей, у которых ещё нет вашего токена.",
          },
        ],
      },
      {
        id: "gerenciar-tokens",
        title: "Управление Правами (Authorities)",
        summary: "Проверяйте безопасность токенов и отзывайте права Mint и Freeze ончейн.",
        intro:
          "Панель управления позволяет в любой момент проверить и отозвать права любого вашего токена:",
        bullets: [
          {
            label: "Отзыв Mint Authority:",
            text: "Делает общую эмиссию токена строго фиксированной навсегда.",
          },
          {
            label: "Отзыв Freeze Authority:",
            text: "Запрещает заморозку кошельков и открывает доступ к пулам ликвидности Raydium и Meteora.",
          },
        ],
      },
      {
        id: "afiliados",
        title: "Ончейн Партнёрская Программа (30%)",
        summary: "Получайте 30% комиссии в SOL автоматически с каждой приглашённой транзакции.",
        intro:
          "Партнёрская программа распределяет сервисную комиссию атомарно внутри самой транзакции Solana:",
        bullets: [
          {
            label: "Мгновенная Ссылка:",
            text: "Подключите кошелёк, скопируйте ссылку ?ref=ВАШ_КОШЕЛЁК и отслеживайте выплаты в Solscan.",
          },
        ],
      },
    ],
  },
  costsPage: {
    pageTitle: "Прозрачная Таблица Стоимости и Комиссий",
    pageDesc:
      "Расчётная стоимость всех операций в сети Solana, включая модульную сервисную комиссию платформы и ренту сети (Rent).",
    loading: "Загрузка таблицы комиссий...",
    labels: {
      createToken: "Создание Токена (Модульно 0.10 – 0.55 SOL)",
      burnToken: "Сжигание Токенов / LP (Комиссия 0.05 SOL)",
      airdrop: "Массовый Airdrop (0.05 SOL / Пакет)",
      manageAuthority: "Отзыв Прав / Authorities (Комиссия 0.05 SOL)",
      createLiquidityPool: "Создание Пула Ликвидности (Комиссия 0.15 SOL)",
      removeLiquidity: "Вывод Ликвидности в SOL (Комиссия 0.05 SOL)",
    },
  },
  confirmationPage: {
    pageTitle: "Статус Запуска Токена",
    infoBanner:
      "Ваш токен успешно создан в сети Solana! Выполните 3 шага ниже, чтобы добавить ликвидность, сжечь LP (Rug-Proof) и провести аирдроп.",
    mintedVerifiedTitle: "Токен Выпущен и Подтверждён Ончейн!",
    mintAddressLabel: "Адрес Минта Токена:",
    txSignatureLabel: "Подпись Транзакции:",
    viewTokenSolscan: "Открыть Токен в Solscan ↗",
    viewTxSolscan: "Открыть Транзакцию в Solscan ↗",
    funnelTitle: "🚀 Следующие Шаги для Листинга Токена",
    funnelSubtitle:
      "Адрес вашего нового токена будет автоматически выбран на каждом шаге:",
    step1Badge: "Шаг 1 · Торговля на DEX",
    step1Title: "💧 Создать Пул Ликвидности",
    step1Desc:
      "Запустите торговую пару на Raydium CPMM или Meteora DAMM для открытия покупок и продаж.",
    step2Badge: "Шаг 2 · Сертификат Rug-Proof",
    step2Title: "🔥 Сжечь Ликвидность / Эмиссию (LP Burn)",
    step2Desc:
      "Сожгите LP-токены или часть эмиссии и скачайте подтверждённый PNG-сертификат.",
    step3Badge: "Шаг 3 · Рост Сообщества",
    step3Title: "📦 Провести Airdrop для Сообщества",
    step3Desc:
      "Отправьте токены списку кошельков с автоматическим созданием ATA-аккаунтов.",
    backToCreator: "← Вернуться к Созданию Токена",
  },
  footer: {
    badges: [
      {
        title: "100% Некастодиально и Белый Список Программ",
        desc: "Каждая транзакция проверяется по белому списку программ Solana и симулируется перед подписью.",
      },
      {
        title: "Проверенные Ончейн-Протоколы",
        desc: "Построено напрямую поверх официальных программ SPL Token, Token-2022, Metaplex и AMM-хранилищ.",
      },
      {
        title: "Модульные Тарифы и 30% Партнёрам",
        desc: "Прозрачные модульные комиссии с мгновенным атомарным отчислением 30% рефералам ончейн.",
      },
      {
        title: "Mainnet-Beta по Умолчанию и Devnet",
        desc: "Работает в Solana Mainnet-Beta для реальных запусков с переключением в Devnet в 1 клик для тестов.",
      },
    ],
    tagline:
      "Некастодиальный лаунчпад в стиле Swiss Design для выпуска токенов SPL и Token-2022, создания пулов ликвидности AMM и управления правами на Solana.",
    connectedTo: "Подключено к RPC Solana",
    servicesTitle: "Сервисы Платформы",
    resourcesTitle: "Ресурсы и Прозрачность",
    programsTitle: "Проверенные Ончейн-Программы",
    rightsReserved:
      "Все права защищены. Некастодиальный интерфейс для блокчейна Solana.",
    securityNotice:
      "Уведомление о безопасности: всегда проверяйте симуляцию транзакции в кошельке перед подписанием.",
  },
};

const ZH_TRANSLATIONS: TranslationDictionary = {
  nav: {
    createToken: "创建代币",
    liquidityPool: "流动性池",
    burn: "销毁 / 回收 SOL",
    airdrop: "批量空投",
    manage: "权限管理",
    affiliates: "推广返佣 (30%)",
    docs: "技术文档",
  },
  wallet: {
    connect: "连接钱包",
    connecting: "连接中...",
    copyAddress: "复制地址",
    copied: "✓ 已复制！",
    changeWallet: "切换钱包",
    viewExplorer: "在 Solscan 查看 ↗",
    disconnect: "断开钱包",
    balanceLabel: "链上余额",
  },
  network: {
    mainnetShort: "Mainnet (主网)",
    devnetShort: "Devnet (测试网)",
    mainnetBannerTitle: "当前处于生产主网：SOLANA MAINNET-BETA",
    mainnetBannerDesc:
      "您正在 Solana 主网操作。所有代币铸造、流动性池与手续费均消耗真实的链上 SOL。",
    devnetBannerTitle: "当前处于测试沙盒：SOLANA DEVNET",
    devnetBannerDesc:
      "免费模拟测试环境！在 Devnet 上创建的代币仅用于测试，不具备任何商业价值。",
    switchToDevnet: "切换至 Devnet 测试 →",
    switchToMainnet: "切换至 Mainnet 主网 →",
    faucetBtn: "🚰 免费领取 +1 测试 SOL",
    faucetLoading: "正在空投 +1 SOL...",
    faucetSuccess: "✓ 已到账 +1 SOL！",
  },
  home: {
    heroBadgeMainnet: "🟢 链上生产环境 · Solana Mainnet-Beta",
    heroBadgeDevnet: "🟠 测试沙盒模式 · Solana Devnet",
    heroTitle: "几秒钟内在 Solana 上创建您的专属代币",
    heroSubtitle:
      "零代码一键部署 SPL 或 Token-2022 代币，支持 RugCheck 100/100 安全满分、Arweave 永久元数据存储及即时创建流动性池。",
    costSummaryTitle: "模块化费用明细",
    quickGuideTitle: "快速指南",
    suiteTitle: "完整的 Solana 代币生命周期工具箱",
    suiteSubtitle:
      "代币铸造后所需的一切：添加流动性池、生成 PNG 销毁证书、从空账户回收 SOL 租金以及批量空投。",
    faqTitle: "常见问题解答 (FAQ)",
    quickGuide: [
      {
        title: "什么是 SPL 代币？",
        description:
          "Solana 官方同质化代币标准，兼容所有主流钱包 (Phantom, Solflare) 与去中心化交易所 (Raydium, Meteora, Jupiter)。",
      },
      {
        title: "什么是 Token-2022？",
        description:
          "Solana 新一代代币标准，在协议底层原生支持自动转账税 (Transfer Fee / Tax Token) 等高级扩展。",
      },
      {
        title: "RugCheck 100/100 安全满分",
        description:
          "撤销冻结权限解锁 DEX 流动性池 (+50 分)，撤销增发权限永久锁定总量 (+35 分)，锁定元数据不可篡改 (+15 分)。",
      },
      {
        title: "Mainnet-Beta 主网 vs. Devnet 测试网",
        description:
          "在 Mainnet-Beta 主网上您的代币真实可交易；在 Devnet 测试网上可点击领水按钮免费测试全流程。",
      },
    ],
    ecosystemDesc: {
      liquidityPool:
        "在 Raydium CPMM 或 Meteora Dynamic AMM 上一键创建或撤出 SOL 流动性池。",
      burn: "销毁代币或 LP 并生成官方 PNG 链上验证证书，同时从空账户回收 SOL 租金。",
      airdrop:
        "向数百个钱包地址批量空投代币，自动为接收方初始化 ATA 代币账户。",
      manage: "实时检测 RugCheck 安全评分，在链上永久撤销增发 (Mint) 或冻结 (Freeze) 权限。",
      affiliates:
        "生成专属推广链接，每笔交易在同一笔链上指令中即时获得 30% SOL 返佣。",
      docs: "查阅关于代币经济学、流动性池配置与 RugCheck 安全审计的分步指南。",
    },
  },
  form: {
    targetNetwork: "当前网络：",
    totalModularFee: "模块化总费用：",
    step1: "1. 代币基本信息",
    step2: "2. 图标与社交链接",
    step3: "3. 安全权限与铸造",
    tokenName: "代币名称 (Name)",
    tokenSymbol: "代币符号 (Ticker)",
    decimals: "小数精度 (0 – 9)",
    supply: "初始总供应量 (Supply)",
    storagePipeline: "图标与元数据存储方式",
    logoLabel: "代币图标 (PNG, JPG, WEBP, GIF — 最大 5MB)",
    dropzonePrompt: "将您的代币图标拖放到此处，或点击上传文件",
    uploadingImg: "正在上传并校验代币图标...",
    description: "项目简介 (可选)",
    website: "官方网站 (可选)",
    twitter: "X / Twitter (可选)",
    instagram: "Instagram (可选)",
    customCreatorTitle: "自定义元数据中的创建者信息 (Creator Info)",
    customCreatorDesc:
      "将链上元数据中的默认签名替换为您自己的项目或工作室名称与官网链接。",
    creatorName: "创建者 / 工作室名称",
    creatorUrl: "创建者官方网站",
    tokenStandard: "Solana 代币程序标准",
    standardSpl: "标准 SPL 代币 (全生态兼容)",
    standard2022: "Token-2022 (支持交易税 / 转账费扩展)",
    securityTitle: "链上安全加固 & RugCheck 100/100 (模块化可选)",
    revokeFreezeTitle: "撤销冻结权限 Freeze Authority (强烈推荐)",
    revokeFreezeDesc:
      "在 Raydium/Meteora 创建流动性池并在 Jupiter 交易的必需项 (RugCheck +50 分)。",
    revokeMintTitle: "撤销增发权限 Mint Authority (强烈推荐)",
    revokeMintDesc:
      "永久锁定总供应量，确保永远无法增发新代币 (RugCheck +35 分)。",
    immutableTitle: "永久锁定元数据 (Immutable Metadata)",
    immutableDesc:
      "在区块链浏览器上永久锁定代币名称、符号和图标链接 (RugCheck +15 分)。",
    backBtn: "← 返回上一步",
    continueBtn: "下一步 →",
    submitMainnet: "🚀 在 Mainnet-Beta 主网创建代币",
    submitDevnet: "🧪 在 Devnet 测试网铸造代币",
  },
  costs: {
    headerTitle: "链上费用透明明细",
    headerBadge: "100% 原子化结算",
    rentLabel: "网络账户租金 (Rent)：",
    networkFeeLabel: "网络签名费：",
    serviceFeeLabel: "平台服务费：",
    baseCreate: "基础代币创建费 (Token Mint)",
    revokeFreeze: "撤销冻结权限 (流动性池就绪)",
    revokeMint: "撤销增发权限 (固定供应量)",
    immutable: "永久锁定元数据 (Immutable)",
    customCreator: "自定义创建者信息 (Metadata)",
    transferFeeExt: "交易税 / 转账费扩展 (Token-2022)",
    totalModular: "模块化服务费合计：",
    networkRent: "Solana 链上账户租金 (预估)：",
    estimatedWalletTotal: "预估总计",
    singleSignatureSub: "钱包单次签名完成",
    atomicDisclaimer:
      "在同一笔链上交易中原子化结算，自动实现 30% 推广返佣与 70% 开发者钱包实时分账。",
  },
  common: {
    activeNetwork: "当前网络：",
    refreshWallet: "↻ 刷新钱包",
    availableBalance: "可用余额：",
    walletBalance: "钱包余额：",
    copy: "复制",
    copied: "✓ 已复制！",
    viewOnSolscan: "在 Solscan 查看 ↗",
    loading: "加载中...",
    cancel: "取消",
    confirmAndRevoke: "确认并永久撤销",
    signingAndConfirming: "正在签名并链上确认...",
    irreversibleWarning: "⚠️ 链上不可逆操作",
  },
  tokenSelector: {
    loadingAria: "正在加载钱包代币",
    balancePrefix: "余额：",
    noTokensDetected: "当前网络下您连接的钱包中未检测到代币",
    clickToChoose: "点击从您已连接的钱包中选择代币",
    dropdownHeader: "已连接钱包资产 — 点击选择",
    lpPoolTokenTag: "LP 凭证代币",
  },
  tokenPreview: {
    cardTitle: "钱包模拟器 & 安全审计评分",
    cardDesc: "实时预览您的代币在 Phantom、Solflare 和 DexScreener 中的展示效果。",
    headerLabel: "SOLANA 钱包资产实时预览",
    defaultTokenName: "代币名称",
    decimalsLabel: "小数精度",
    transferFeeLabel: "转账税率",
    metadataLabel: "元数据状态",
    immutable: "永久锁定",
    mutable: "可修改",
    auditTitle: "🛡️ 安全审计 & RugCheck 评分",
    alertSafe: "🟢 100/100 - 安全满分 (符合 DexScreener / RugCheck 标准)",
    alertFreeze: "🔴 严重警告：未撤销冻结权限将无法在 Jupiter/Raydium 创建资金池",
    alertMint: "🟡 增发风险：保留增发权限会在扫描器中触发稀释警告",
    alertMutable:
      "🟡 元数据可修改：建议锁定元数据 (+0.05 SOL) 以获得 100/100 RugCheck 满分",
  },
  stepper: {
    defaultTitle: "Solana 链上交易进度",
    stepBadge: "步骤",
    steps: [
      "1. 上传至 Irys",
      "2. 上传元数据",
      "3. 等待钱包签名",
      "4. 链上确认中",
    ],
  },
  liquidityPage: {
    addFeeLabel: "创建流动性池服务费：",
    withdrawFeeLabel: "撤出流动性服务费：",
    titleAdd: "创建链上流动性池 (Liquidity Pool)",
    titleWithdraw: "撤出 SOL 流动性",
    descAdd:
      "在 Solana 链上初始化流动性池并铸造 LP 代币。直接从已连接钱包中选择代币，注入初始流动性并获得 100% LP 代币。",
    descWithdraw:
      "直接从已连接钱包中选择您的代币或 LP 代币，在单笔原子交易中将 WSOL 流动性金库解包并退回原生 SOL。",
    tabAdd: "➕ 添加流动性",
    tabWithdraw: "💸 撤出 SOL 流动性",
    configurePairTitle: "配置流动性交易对",
    configurePairDesc:
      "直接从已连接钱包选择代币，注入初始流动性，并在单笔原子交易中铸造 LP 凭证代币。",
    readyStep1: "1. AMM 已选择 ✓",
    readyStep2Done: "2. 钱包代币已选 ✓",
    readyStep2Pending: "2. 待选择代币",
    readyStep3Done: "3. 数量已设置 ✓",
    readyStep3Pending: "3. 待输入数量",
    readyStep4Done: "4. 冻结权限就绪 ✓",
    readyStep4Warn: "4. 需撤销冻结权限",
    step1AmmLabel: "1. 选择 AMM 协议架构",
    raydiumDesc:
      "恒定乘积流动性金库，支持 Mainnet-Beta 主网与 Devnet 测试网原生铸造 LP 代币。",
    meteoraDesc:
      "动态流动性池金库，支持自定义手续费等级与即时铸造 LP 代币。",
    step2SelectToken: "2. 直接从您已连接的钱包中选择代币",
    freezeWarnTitle: "检测到冻结权限 (Freeze Authority) 仍处于激活状态",
    freezeWarnDesc:
      "创建流动性池必须先撤销冻结权限。我们将在同一笔交易中为您自动撤销。",
    freezeAutoRevokeCheck: "在同一笔交易中自动撤销冻结权限",
    tokenAmountLabel: "注入池中的代币数量",
    initialLiquidityLabel: "初始底池流动性",
    swapFeeTierLabel: "交易池 Swap 手续费等级",
    tierRecommended: "推荐配置",
    tierStandard: "标准 AMM",
    tierHighVol: "高波动代币",
    activationScheduleLabel: "开盘时间设置",
    immediateBtn: "立即开盘",
    scheduleTimeBtn: "定时开盘",
    simulatorTitle: "流动性池实时经济模型模拟",
    initialPriceLabel: "代币初始价格",
    impliedMcapLabel: "预估初始市值",
    poolAllocationLabel: "入池代币占比",
    devFeeLabel: "平台服务费",
    submitAddBtn: "初始化流动性池并铸造 LP",
    initializingPoolStatus: "正在链上初始化流动性池...",
    withdrawCardTitle: "撤出 SOL 流动性",
    withdrawCardDesc:
      "直接在下方点击已连接钱包中的代币或 LP 代币 —— 无需手动输入符号或合约地址。",
    selectWithdrawalShareLabel: "2. 选择撤出 SOL 流动性的比例",
    sharePartial: "部分撤出",
    shareHalf: "撤出一半",
    shareMajor: "大部分撤出",
    shareFull: "全部撤出 + 退回租金",
    withdrawSimulatorTitle: "SOL 流动性撤出实时预估",
    selectedShareLabel: "选择撤出比例",
    estimatedSolUnwrapped: "预计解包 SOL 数量",
    estNetSolToWallet: "预计到账钱包净 SOL",
    submitWithdrawBtn: "💸 撤出 SOL 流动性",
    withdrawingStatus: "正在撤出 SOL 流动性...",
    vaultAutoDetected: "已自动识别链上 WSOL 流动性金库",
    inspectingVault: "正在查询链上金库余额...",
    readyToUnwrap: "已就绪，可解包 WSOL 金库 / ATA",
    sidebarAddTitle: "链上资金池与档案架构说明",
    sidebarWithdrawTitle: "钱包一键撤出 SOL 说明",
    sidebarAddBullets: [
      {
        title: "钱包一键选币：",
        text: "直接点击已连接钱包中的代币，无需手动复制粘贴合约地址。",
      },
      {
        title: "真实链上 LP 铸造：",
        text: "自动创建确定性 Pool Authority PDA，将 SOL 存入 WSOL 金库并向您的钱包铸造 LP 代币。",
      },
      {
        title: "灵活撤出 SOL：",
        text: "后续需要取回底池 SOL？随时切换至“撤出 SOL 流动性”标签页即可一键取回。",
      },
    ],
    sidebarWithdrawBullets: [
      {
        title: "零地址输入：",
        text: "直接从钱包列表点击代币或 LP 代币，系统会自动解析对应金库地址。",
      },
      {
        title: "支持部分或全部撤出 (25% – 100%)：",
        text: "可选择撤出部分 SOL 或 100% 全部撤出（同时退回账户租金）。",
      },
    ],
  },
  burnPage: {
    feeBadgeLabel: "统一销毁服务费：",
    pageTitle: "链上代币 & LP 销毁器 + 空账户 SOL 租金回收",
    pageDesc:
      "直接从已连接钱包中选择任何代币或 LP 代币进行永久销毁，生成可验证的 PNG 防撤池证书，并回收空账户锁定的 SOL 租金。",
    cardTitle: "销毁代币或 LP 代币 (Burn)",
    cardDescPrefix: "直接从已连接的钱包中选择代币或 LP 代币。服务费：",
    step1SelectLabel: "1. 直接从您的钱包中选择代币或 LP 代币",
    step2AmountLabel: "2. 输入销毁数量",
    impactTitle: "🔥 通缩销毁实时影响预览",
    irreversibleBadge: "链上永久不可逆",
    currentBalanceLabel: "当前钱包余额",
    amountToDestroyLabel: "本次销毁数量",
    remainingBalanceLabel: "销毁后剩余余额",
    shareBurnedLabel: "销毁占持仓比例",
    submitBurnBtnPrefix: "🔥 永久销毁所选钱包代币",
    executingBurnStatus: "正在执行链上销毁...",
    certHeaderTitle: "🏆 官方 LP 销毁 / Rug-Proof 链上验证证书",
    downloadPngBtn: "⬇️ 下载 PNG 证书图片",
    shareXBtn: "𝕏 分享到 X (Twitter)",
    reclaimBadge: "💎 热门工具 · 关闭空代币账户",
    reclaimTitle: "从空账户回收 SOL 租金 (Rent Recovery)",
    reclaimDesc:
      "钱包中每个余额为 0 的代币账户都锁定了约 0.002 SOL 租金。单笔交易最多可关闭 20 个空账户，立即退回您的 SOL。",
    reclaimBannerPrefix: "您的钱包中当前有",
    reclaimBannerSuffix: "个空账户 =",
    emptyAccountsLabel: "空账户数量 (余额为 0)",
    platformFeeLabel: "平台服务费 (15%)",
    netToYouLabel: "您实际拿回 (85%)",
    reclaimSubmitBtn: "⚡ 立即回收我的 SOL",
    reclaimEmptyBtn: "已连接钱包中未发现空代币账户",
    reclaimingStatus: "正在回收 SOL...",
    sidebarHowItWorks: "代币与 LP 销毁工作机制",
    tutorial1Title: "1. 钱包直接选币",
    tutorial1Desc:
      "已连接钱包中的所有 SPL、Token-2022 和 LP 代币会自动加载（也支持通过 ?mint= 自动选中）。",
    tutorial2Title: "2. 可视化证书 & 回收 SOL",
    tutorial2Desc:
      "销毁完成后可一键下载 '100% BURNED & VERIFIED ON-CHAIN' 高清 PNG 证书并分享至 X，同时可清理空账户拿回 SOL。",
    withdrawCtaTitle: "想在销毁前先撤出 SOL 流动性？",
    withdrawCtaDesc: "如果您希望在销毁 LP 代币前取回池子里的 SOL，请使用：",
    withdrawCtaLink: "撤出 SOL 流动性工具 (0.05 SOL)",
  },
  airdropPage: {
    feeBadgeLabel: "每批次固定费用：",
    pageTitle: "Solana 批量空投 & 多地址转账工具",
    pageDesc:
      "通过原子化批次交易将 SPL 或 Token-2022 代币快速分发至数百个 Solana 钱包，自动为接收方初始化 ATA 账户。",
    cardTitle: "配置批量空投 (Multi-Send)",
    cardDescPrefix:
      "选择要分发的代币，导入或粘贴接收地址列表，并在发送前实时校验余额。每批次服务费：",
    step1SelectLabel: "1. 选择要分发的代币",
    step2RecipientsLabel: "2. 接收方钱包列表 (钱包地址,数量)",
    loadSampleBtn: "📄 加载示例列表",
    importCsvBtn: "📁 导入 CSV / TXT",
    clearListBtn: "✕ 清空列表",
    uniformLabel: "⚡ 为所有钱包设置统一空投数量：",
    applyAllBtn: "应用到所有行",
    textareaPlaceholder:
      "每行一个接收地址：钱包地址,代币数量\n示例：\n7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU,1500\n9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin,2500",
    textareaHint: "请使用逗号、空格或分号分隔钱包地址与代币数量。",
    summaryTitle: "📊 实时空投校验 & 费用汇总",
    readyToBroadcast: "✓ 校验通过，可立即发送",
    reviewRequired: "⚠️ 请检查格式或余额错误",
    validWalletsLabel: "有效接收地址",
    totalTokensLabel: "空投代币总量",
    atomicBatchesLabel: "原子交易批次",
    totalServiceFeeLabel: "总平台服务费",
    validateBtn: "✓ 校验接收地址列表",
    sendAirdropBtn: "📦 立即发送空投",
    processingAirdropStatus: "正在处理批量空投...",
    launchAnotherBtn: "📦 继续发起新的空投",
    sidebarTitle: "批量空投是如何工作的",
    tutorialSteps: [
      {
        title: "1. 从钱包选择代币",
        description: "从已连接钱包中选择任意 SPL 或 Token-2022 资产分发给社区成员。",
      },
      {
        title: "2. 导入 CSV 或粘贴地址",
        description: "粘贴“地址,数量”列表，上传 .CSV/.TXT 文件，或一键为所有地址设置相同数量。",
      },
      {
        title: "3. 自动创建 ATA 与分批打包",
        description: "自动为未持有该代币的地址创建 ATA 账户，每笔原子交易最多打包 10 个接收地址。",
      },
    ],
  },
  dashboardPage: {
    feeBadgeLabel: "统一权限撤销费：",
    pageTitle: "代币权限管理 & 链上安全体检",
    pageDesc:
      "实时检测您的代币在链上的 RugCheck 安全评分，并在 Solana 上永久撤销增发 (Mint) 或冻结 (Freeze) 权限。",
    panelTitle: "链上权限与安全检测面板",
    panelDesc:
      "从您的钱包中选择任意 SPL 或 Token-2022 代币，查看 RugCheck 安全得分并一键放弃敏感权限。",
    connectPrompt: "请先连接您的 Solana 钱包以检测和管理代币权限。",
    step1SelectLabel: "1. 从您的钱包中选择一个代币",
    securityScoreTitle: "🛡️ 链上安全评分 & RugCheck 就绪度",
    scoreFull: "100% 权限已丢弃 & DEX 就绪 ✓",
    scorePartial: "部分权限已撤销",
    scoreActive: "敏感权限仍处于开启状态",
    mintAuthTitle: "增发权限 Mint Authority (总量上限)",
    freezeAuthTitle: "冻结权限 Freeze Authority (DEX 建池锁)",
    statusRevoked: "已永久撤销 ✓",
    statusActive: "未撤销 (开启中)",
    mintRevokedDesc: "代币总供应量已永久固定，任何人永远无法再增发新代币。",
    mintActiveDesc: "您的钱包仍可增发代币。建议撤销以向投资者保证总量恒定。",
    freezeRevokedDesc: "没有任何钱包会被冻结，该代币可在 Raydium 和 Meteora 创建流动性池。",
    freezeActiveDesc: "在 Raydium 或 Meteora 初始化 AMM 流动性池之前必须先撤销冻结权限。",
    revokeMintBtn: "🔒 撤销增发权限 (Mint)",
    revokeFreezeBtn: "❄️ 撤销冻结权限 (Freeze)",
    goToLpBtn: "💧 前往创建流动性池 →",
    modalTitlePrefix: "确认永久撤销代币权限：",
    modalDesc:
      "此操作在 Solana 区块链上永久不可逆，完成后将大幅提升 RugCheck 安全评分。确认继续吗？",
    guideSections: [
      {
        title: "增发 (Mint) vs. 冻结 (Freeze) 权限",
        description:
          "Mint 权限决定是否能增发新币；Freeze 权限决定是否能冻结持币者账户。",
      },
      {
        title: "DEX 与 Raydium 建池要求",
        description:
          "撤销 Freeze 权限是在 Raydium 和 Meteora 创建流动性池的强制要求；撤销 Mint 权限可消除增发预警。",
      },
      {
        title: "永久生效与原子结算",
        description:
          "权限撤销在 Solana 链上永久不可逆，并由您的钱包通过单笔原子交易签名确认。",
      },
    ],
  },
  affiliatesPage: {
    pageTitle: "推广返佣计划：即时赚取 30% SOL 佣金",
    pageDesc:
      "加入我们的链上推广计划，通过您的专属链接完成的每笔代币创建或流动性池交易，均可实时获得 30% SOL 返佣。",
    linkCardTitle: "您的专属推广返佣链接",
    linkExplanation:
      "这是您的专属邀请链接。任何页面都会自动识别 ?ref= 参数，并在同一笔链上交易中将 30% 的服务费直接转入您的钱包。",
    connectPrompt: "连接您的 Solana 钱包即可立即生成专属推广返佣链接。",
    viewEarningsBtn: "查看我的返佣收益与记录",
    hideEarningsBtn: "隐藏收益面板",
    dashboardTitle: "链上返佣收益看板",
    dashboardDesc: "实时追踪经链上验证的推广次数与已到账的 30% SOL 佣金明细。",
    totalEarningsLabel: "累计总收益 (30% 分账)",
    verifiedReferralsLabel: "已验证邀请笔数",
    historyTitle: "最近 10 笔链上验证返佣",
    dateCol: "时间",
    amountCol: "返佣金额",
    txCol: "链上交易",
    noHistoryText: "暂无推广返佣交易记录。",
    howItWorksTitle: "返佣运作方式",
    steps: [
      {
        title: "1. 连接钱包：",
        text: "您的 Solana 钱包公钥地址即为您唯一的推广身份标识。",
      },
      {
        title: "2. 复制专属链接：",
        text: "系统会自动生成带有 ?ref=您的钱包地址 的专属推广链接。",
      },
      {
        title: "3. 分享并邀请：",
        text: "将链接分享给准备发行代币或创建流动性池的项目方与创作者。",
      },
      {
        title: "4. 30% 佣金秒到账：",
        text: "30% 的平台服务费会在同一笔交易中直接打入您的钱包（70% 平台 / 30% 推广者）。",
      },
    ],
    commissionCardTitle: "您的 30% SOL 实时返佣",
    commissionCardText:
      "通过您的推广链接产生的所有代币创建与流动性池服务费，您均可获得 30% 实时分账，无需申请提现。",
    transparentCardTitle: "100% 链上透明结算",
    transparentCardText:
      "所有返佣均通过 Solana 官方 SystemProgram.transfer 在同一笔交易内原子化划转并经链上验证。",
  },
  docsPage: {
    pageTitle: "平台技术文档",
    pageSubtitle:
      "关于在 Solana 上创建代币、初始化流动性池、销毁 LP 及批量空投的完整安全指南。",
    tocTitle: "目录导航",
    sections: [
      {
        id: "criar-token",
        title: "创建代币 (SPL 与 Token-2022)",
        summary:
          "了解如何在 Solana 上发行同质化代币，配置 Arweave 永久元数据并获得 RugCheck 100/100 满分。",
        intro: "代币创建流程支持在单笔原子交易中将您的数字资产部署至 Solana 区块链：",
        bullets: [
          {
            label: "代币基础参数：",
            text: "自定义代币名称、符号 (Ticker)、小数精度 (0–9) 及精准 BigInt 总供应量。",
          },
          {
            label: "永久去中心化元数据：",
            text: "代币图标与 JSON 元数据通过 Arweave/Irys 永久存储，完全遵循 Metaplex 标准。",
          },
          {
            label: "SPL 与 Token-2022 标准：",
            text: "支持标准 SPL（全生态兼容）与 Token-2022（原生支持转账税扩展）。",
          },
          {
            label: "RugCheck 100/100 安全加固：",
            text: "创建时可一键撤销冻结权限 (+50 分)、增发权限 (+35 分) 并永久锁定元数据 (+15 分)。",
          },
        ],
      },
      {
        id: "criar-liquidez",
        title: "创建流动性池 (Raydium & Meteora)",
        summary:
          "在 Raydium CPMM 或 Meteora Dynamic AMM 上初始化链上资金池，让您的代币立即开放公开交易。",
        intro: "没有流动性的代币无法交易。创建流动性池可将您的代币与 SOL 或 USDC 配对：",
        bullets: [
          {
            label: "Raydium CPMM & Meteora DAMM：",
            text: "直接初始化恒定乘积流动性池，无需支付昂贵的旧版 OpenBook Market ID 费用。",
          },
          {
            label: "初始价格与市值：",
            text: "注入池中的代币数量与 SOL/USDC 数量之比会自动决定代币开盘价格。",
          },
          {
            label: "100% 获得 LP 代币：",
            text: "铸造的 LP 代币 100% 发往您的钱包，您可选择销毁 LP 锁池或随时撤出 SOL。",
          },
        ],
      },
      {
        id: "queimar-tokens",
        title: "代币/LP 销毁 (Burn) & 回收 SOL",
        summary:
          "永久减少流通供应量或销毁 LP 锁池，生成官方 PNG 验证证书，并从空账户回收 SOL 租金。",
        intro: "代币销毁是 Solana 链上永久不可逆的通缩机制：",
        bullets: [
          {
            label: "官方 PNG 销毁证书：",
            text: "销毁后自动生成高清 '100% BURNED & VERIFIED ON-CHAIN' 证书并提供 Solscan 验证链接。",
          },
          {
            label: "回收 SOL (Rent Recovery)：",
            text: "一键关闭钱包中余额为零的废弃代币账户，立即取回被锁定的 SOL 租金。",
          },
        ],
      },
      {
        id: "airdrop",
        title: "批量空投分发 (Mass Airdrop)",
        summary: "通过原子化批次交易向数十或数百个钱包快速发送代币。",
        intro: "Multi-Sender 批量空投工具助力社区激励与营销活动：",
        bullets: [
          {
            label: "智能格式校验：",
            text: "在构建交易前自动校验所有接收方 Base58 地址与钱包可用余额。",
          },
          {
            label: "自动创建 ATA 账户：",
            text: "为尚未持有该代币的接收地址自动初始化关联代币账户 (ATA)。",
          },
        ],
      },
      {
        id: "gerenciar-tokens",
        title: "代币权限管理 (Authorities)",
        summary: "随时检测钱包中代币的安全状态，并在链上放弃增发与冻结权限。",
        intro: "权限管理面板支持对您控制的任何 SPL 或 Token-2022 代币进行链上权限操作：",
        bullets: [
          {
            label: "撤销增发权限 (Mint)：",
            text: "永久锁定代币总供应量，彻底消除增发砸盘风险。",
          },
          {
            label: "撤销冻结权限 (Freeze)：",
            text: "防止任何持币地址被拉黑冻结，也是创建 DEX 流动性池的必要条件。",
          },
        ],
      },
      {
        id: "afiliados",
        title: "链上推广返佣计划 (30%)",
        summary: "每笔受邀交易自动获得 30% SOL 实时返佣。",
        intro: "推广分账指令直接内嵌在同一笔 Solana 链上交易中：",
        bullets: [
          {
            label: "专属邀请链接：",
            text: "连接钱包即可生成 ?ref=您的钱包地址 链接，所有返佣均可在 Solscan 上公开查验。",
          },
        ],
      },
    ],
  },
  costsPage: {
    pageTitle: "透明费用与服务费率表",
    pageDesc:
      "Solana 网络上各项操作的预估费用明细，包含平台模块化服务费与 Solana 链上账户租金预估。",
    loading: "正在加载费率表...",
    labels: {
      createToken: "创建代币 (模块化 0.10 – 0.55 SOL)",
      burnToken: "销毁代币 / LP (0.05 SOL 服务费)",
      airdrop: "批量空投 (0.05 SOL / 批次)",
      manageAuthority: "撤销权限 (0.05 SOL 服务费)",
      createLiquidityPool: "创建流动性池 (0.15 SOL 服务费)",
      removeLiquidity: "撤出 SOL 流动性 (0.05 SOL 服务费)",
    },
  },
  confirmationPage: {
    pageTitle: "代币发行状态确认",
    infoBanner:
      "您的代币已在 Solana 链上成功激活！请按照下方 3 个步骤添加流动性、销毁 LP (防撤池认证) 并向社区空投。",
    mintedVerifiedTitle: "代币已成功铸造并通过链上验证！",
    mintAddressLabel: "代币 Mint 合约地址：",
    txSignatureLabel: "链上交易签名 (TX)：",
    viewTokenSolscan: "在 Solscan 查看代币 ↗",
    viewTxSolscan: "在 Solscan 查看交易 ↗",
    funnelTitle: "🚀 代币上线交易的后续 3 个步骤",
    funnelSubtitle: "您的新代币合约地址将在每个步骤中被自动选中：",
    step1Badge: "第 1 步 · 开启 DEX 交易",
    step1Title: "💧 创建流动性池",
    step1Desc: "在 Raydium CPMM 或 Meteora DAMM 初始化交易对，开放公开买卖。",
    step2Badge: "第 2 步 · 防撤池安全认证",
    step2Title: "🔥 销毁流动性 / 代币 (LP Burn)",
    step2Desc: "销毁 LP 代币或部分供应量，生成可验证的 PNG 链上销毁证书。",
    step3Badge: "第 3 步 · 社区裂变分发",
    step3Title: "📦 发起社区批量空投",
    step3Desc: "向多个钱包地址批量发送代币，自动创建接收方 ATA 账户。",
    backToCreator: "← 返回代币创建器",
  },
  footer: {
    badges: [
      {
        title: "100% 非托管 & 程序白名单验证",
        desc: "每笔交易均经过客户端 Solana 官方程序白名单校验，并在钱包签名前进行安全模拟。",
      },
      {
        title: "经审计的链上原生协议",
        desc: "直接基于 Solana 官方 SPL Token、Token-2022、Metaplex 与恒定乘积 AMM 金库构建。",
      },
      {
        title: "模块化定价 & 30% 推广实时分账",
        desc: "透明的模块化费用在链上原子化结算，30% 推广返佣同一笔交易秒到账。",
      },
      {
        title: "默认 Mainnet-Beta 主网 & 支持 Devnet",
        desc: "默认连接 Solana 主网用于正式发币，支持一键切换至 Devnet 测试网免费体验。",
      },
    ],
    tagline:
      "采用瑞士极简工程设计的非托管 Solana 发币平台，支持创建 SPL 与 Token-2022 资产、初始化 AMM 流动性池及管理代币权限。",
    connectedTo: "已连接至 Solana RPC",
    servicesTitle: "平台核心服务",
    resourcesTitle: "资源与透明度",
    programsTitle: "已验证的链上合约程序",
    rightsReserved: "保留所有权利。Solana 区块链非托管 Web3 交互界面。",
    securityNotice: "安全提示：在钱包中签名确认前，请始终检查交易模拟结果。",
  },
};

EN_TRANSLATIONS.costs = EN_TRANSLATIONS.costsPage;
ES_TRANSLATIONS.costs = ES_TRANSLATIONS.costsPage;
RU_TRANSLATIONS.costs = RU_TRANSLATIONS.costsPage;
ZH_TRANSLATIONS.costs = ZH_TRANSLATIONS.costsPage;
PT_BR_TRANSLATIONS.costs = PT_BR_TRANSLATIONS.costsPage;

export const TRANSLATIONS: Record<AppLocale, TranslationDictionary> = {
  en: EN_TRANSLATIONS,
  es: ES_TRANSLATIONS,
  ru: RU_TRANSLATIONS,
  zh: ZH_TRANSLATIONS,
  "pt-BR": PT_BR_TRANSLATIONS,
  pt: PT_BR_TRANSLATIONS,
};

interface LanguageContextValue {
  locale: AppLocale;
  setLocale: (next: AppLocale) => void;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
  t: TRANSLATIONS.en,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>("en");

  const syncDocumentLang = useCallback((target: SupportedLocale) => {
    if (typeof document !== "undefined") {
      const meta = SUPPORTED_LOCALES.find((item) => item.code === target);
      document.documentElement.lang = meta ? meta.htmlLang : target;
    }
  }, []);

  useEffect(() => {
    const detected = detectBrowserLocale();
    setLocaleState(detected);
    syncDocumentLang(detected);
  }, [syncDocumentLang]);

  const setLocale = useCallback(
    (next: AppLocale) => {
      const normalized: SupportedLocale = normalizeLocale(next) ?? "en";
      setLocaleState(normalized);
      try {
        localStorage.setItem(STORAGE_KEY, normalized);
      } catch {
        // Ignore storage write errors
      }
      syncDocumentLang(normalized);
    },
    [syncDocumentLang]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: TRANSLATIONS[locale] || TRANSLATIONS.en,
    }),
    [locale, setLocale]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
