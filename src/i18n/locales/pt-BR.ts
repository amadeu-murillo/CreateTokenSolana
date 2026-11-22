import { TranslationDictionary } from "../types";
import { PRICING_SOL, formatSolAmount, getTokenCreationFeeRangeSol } from "@/config/pricing";

const FEE_RANGE = getTokenCreationFeeRangeSol();

const dictionary: TranslationDictionary = {
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
      `🟡 Metadados Mutáveis: Desative a mutabilidade (+${formatSolAmount(PRICING_SOL.immutableMetadata)} SOL) para atingir 100/100 no RugCheck`,
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
    platformFeeLabel: "Taxa Plataforma (8%)",
    netToYouLabel: "Líquido para Você (92%)",
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
    withdrawCtaLink: `Retirar Liquidez em SOL (${formatSolAmount(PRICING_SOL.withdrawLiquiditySol)} SOL)`,
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
      "Indique criadores e usuários Solana e receba 30% de comissão instantânea em SOL na mesma transação — válido para criação de tokens, Reclaim SOL, pools de liquidez, Burn & Earn, Airdrop, Vesting, Volume Bot e mais.",
    heroBadges: ["30% em SOL", "Pagamento na hora", "Sem saque mínimo"],
    linkCardTitle: "Seu Link Exclusivo de Afiliado",
    linkExplanation:
      "Escolha a página de destino e compartilhe seu link. A indicação fica salva por 30 dias no navegador do visitante e envia 30% da taxa de serviço direto para sua carteira.",
    exchangeWarning: "Use uma carteira que você controla. Não use endereço de depósito de exchange.",
    selfReferralNotice: "Você não recebe comissão sobre as próprias transações.",
    connectPrompt: "Conecte sua carteira Solana ou cole seu endereço público para gerar seu link e acompanhar seus ganhos.",
    connectWalletBtn: "Conectar Carteira Solana",
    orPasteWallet: "ou cole seu endereço Solana sem conectar",
    manualWalletPlaceholder: "Cole seu endereço público Solana (ex.: 7xK9...)",
    manualWalletSubmit: "Validar Endereço",
    manualWalletInvalid: "Endereço Solana inválido. Verifique a chave pública e tente novamente.",
    manualWalletConfirmPrompt: "Confirme se esta é a carteira que receberá suas comissões:",
    manualWalletOffCurveWarning:
      "Atenção: este endereço não está na curva Ed25519 (pode ser um PDA ou contrato). Prefira uma carteira pessoal padrão (Phantom, Solflare, Backpack).",
    manualWalletConfirmBtn: "Confirmar e Gerar Link",
    manualWalletCancelBtn: "Cancelar",
    manualWalletActiveLabel: "Carteira",
    changeWalletBtn: "Trocar",
    destinationLabel: "Página de destino do link",
    destinations: {
      home: "Criar Token",
      reclaim: "Reclaim SOL",
      addLiquidity: "Pool de Liquidez",
      burn: "Burn & Earn",
      airdrop: "Airdrop",
      vesting: "Vesting",
      volumeBot: "Volume Bot",
      costs: "Taxas",
    },
    copyErrorText: "Não foi possível copiar automaticamente. Selecione o link acima e copie manualmente.",
    shareGroupLabel: "Compartilhar link de afiliado",
    copyTextAndLink: "Copiar texto + link",
    shareOnX: "X",
    shareOnTelegram: "Telegram",
    shareOnWhatsApp: "WhatsApp",
    shareNative: "Compartilhar",
    showQrBtn: "QR Code",
    hideQrBtn: "Ocultar QR",
    qrCodeAlt: "QR Code do seu link de afiliado",
    qrCaption: "Escaneie para abrir seu link de indicação no celular.",
    shareMessageTemplate:
      "Crie tokens Solana, recupere SOL de contas vazias (Reclaim) e lance pools de liquidez em segundos (link de afiliado):",
    viewEarningsBtn: "Ver Meus Ganhos e Histórico",
    hideEarningsBtn: "Ocultar Painel de Ganhos",
    refreshBtn: "Atualizar",
    refreshingBtn: "Atualizando...",
    updatedJustNow: "Atualizado agora",
    updatedMinutesAgo: "Atualizado há {min} min",
    rangeFilterLabel: "Filtrar período de ganhos",
    ranges: {
      "7d": "7 dias",
      "30d": "30 dias",
      "90d": "90 dias",
      all: "Tudo",
    },
    fallbackWarning: "Dados temporários — o histórico pode estar incompleto.",
    dashboardTitle: "Painel de Ganhos On-Chain",
    dashboardDesc: "Acompanhe suas comissões verificadas na blockchain, carteiras únicas indicadas e histórico.",
    totalEarningsLabel: "Total ganho (30%)",
    commissionsCountLabel: "Comissões",
    uniqueWalletsLabel: "Carteiras únicas indicadas",
    maxCommissionLabel: "Maior comissão",
    verifiedReferralsLabel: "Comissões verificadas",
    kpiTooltips: {
      totalEarnings: "Soma total de todas as comissões de 30% em SOL no período.",
      commissionsCount: "Quantidade total de transações comissionadas no período.",
      uniqueWallets: "Número de carteiras distintas de criadores que usaram seu link.",
      maxCommission: "Maior valor único de comissão recebido em uma transação.",
    },
    historyTitle: "Histórico de Comissões",
    dateCol: "Data",
    amountCol: "Valor",
    txCol: "Transação",
    copySignatureAria: "Copiar assinatura da transação",
    loadMoreBtn: "Ver mais",
    loadingMoreBtn: "Carregando...",
    noHistoryText: "Nenhuma comissão registrada para esta carteira neste período.",
    emptyStateCta: "Ir para meu link de afiliado",
    howItWorksTitle: "Como Funciona",
    steps: [
      {
        title: "Informe Sua Carteira",
        text: "Conecte sua carteira Solana ou valide seu endereço público — nenhuma assinatura é necessária.",
      },
      {
        title: "Escolha a Página e Copie",
        text: "Gere o link direto para Criar Token, Reclaim SOL, Pool, Burn, Airdrop, Vesting, Volume Bot ou Taxas.",
      },
      {
        title: "Compartilhe com Transparência",
        text: "A indicação vale por 30 dias no navegador do visitante (regra de último clique válido).",
      },
      {
        title: "Receba 30% na Mesma Transação",
        text: "Assim que o indicado concluir uma operação elegível, 30% da taxa cai na hora em SOL na sua carteira.",
      },
    ],
    earningsExamplesTitle: "Quanto Você Ganha por Indicação",
    earningsExamplesDesc:
      "Valores reais calculados diretamente da tabela oficial de taxas (split 30% Afiliado / 70% Plataforma).",
    operationCol: "Operação indicada",
    serviceFeeCol: "Taxa de serviço",
    yourShareCol: "Seu ganho (30%)",
    exampleRows: {
      standardToken: "Criação padrão de token (com revogações)",
      burnOrVesting: "Burn & Earn ou Token Vesting",
      poolOrAirdrop: "Criar Pool Raydium CPMM ou Airdrop",
      reclaimSol: "Reclaim SOL (fechar contas vazias)",
      reclaimFeeDisplay: "{rate}% do recuperado",
      reclaimShareDisplay: "{rate}% do recuperado",
    },
    simulatorTitle: "Simulador de Ganhos Mensais",
    simulatorServiceLabel: "Escolha o serviço para simular",
    simulatorServices: {
      createToken: "Criar Token",
      pool: "Pool",
      volumeBot: "Volume Bot",
      vesting: "Vesting",
      airdrop: "Airdrop",
    },
    simulatorReferralsLabel: "Indicações por mês",
    simulatorMonthlyEstimate: "Estimativa mensal",
    simulatorPerReferralLabel: "{sol} SOL por indicação",
    simulatorBasisNote: "Selecione o serviço e ajuste o volume mensal para estimar sua comissão de 30%.",
    simulatorAriaValueText: "{count} indicações por mês, estimativa de {sol} SOL",
    promoKitTitle: "Kit de Divulgação Pronto",
    promoKitDesc: "Textos prontos sincronizados com o seu link e destino selecionados acima, já com aviso de afiliado.",
    kitXTemplate:
      "Quer lançar token na Solana ou recuperar SOL de contas vazias sem código? Uso o CreateTokenSolana (não-custodial, taxas transparentes). Confira pelo meu link de afiliado: {link}",
    kitTelegramTemplate:
      "Pessoal, dica útil para quem usa Solana: dá para criar token SPL/Token-2022, recuperar SOL travado em contas vazias (Reclaim) e criar pool Raydium em poucos cliques. Deixo meu link de afiliado aqui: {link}",
    conductTitle: "Regras de Conduta",
    conductRules: [
      "Informe sempre que está compartilhando um link de afiliado.",
      "Não faça promessas de lucro, valorização de tokens ou retorno garantido.",
      "Não faça spam em grupos, comentários ou mensagens privadas.",
      "Não se passe pela equipe oficial do CreateTokenSolana nem use o nome da marca em anúncios enganosos.",
    ],
    viewPricingLink: "Ver tabela completa de taxas",
    viewDocsLink: "Ler documentação técnica",
    commissionCardTitle: "Comissão de 30% em Todo o Ecossistema",
    commissionCardText:
      "Você ganha 30% sobre as taxas de criação de token, Reclaim SOL, pools Raydium CPMM, Burn & Earn, Airdrop em massa, Token Vesting, Volume Bot, revogação de autoridades e Blinks — direto na sua carteira, sem valor mínimo nem pedido de saque.",
    transparentCardTitle: "Transparência Técnica On-Chain",
    transparentCardText:
      "Cada operação inclui uma divisão atômica nativa na rede Solana (SystemProgram.transfer: 30% para sua carteira e 70% para a plataforma) na mesma transação. Todas as transferências são auditáveis no Solscan.",
    exampleTxLabel: "Ver exemplo real de transação no Solscan",
    faqTitle: "Perguntas Frequentes",
    faqItems: [
      {
        question: "Qual é a janela de atribuição e qual link vale se o visitante clicar em mais de um?",
        answer:
          "A janela de atribuição é de 30 dias a partir do acesso pelo link (salvo no navegador via localStorage). Adotamos a regra de último clique válido: um novo link válido substitui o anterior e renova os 30 dias, enquanto links inválidos são ignorados sem apagar uma indicação válida.",
      },
      {
        question: "Posso ganhar comissão indicando minhas próprias transações?",
        answer:
          "Não. Autoindicações (quando a carteira que executa a transação é a mesma do link de afiliado) são ignoradas automaticamente e não geram comissão.",
      },
      {
        question: "Quando o SOL cai na minha carteira?",
        answer:
          "Na hora, dentro da mesma transação confirmada na blockchain Solana. Mesmo que o histórico do painel leve alguns segundos para atualizar, o SOL já está disponível na sua carteira.",
      },
      {
        question: "Posso usar um endereço de depósito de corretora (exchange)?",
        answer:
          "Não recomendamos. Use sempre uma carteira Solana não-custodial que você controla (como Phantom, Solflare ou Backpack), pois corretoras podem não creditar transferências internas ou valores abaixo do depósito mínimo.",
      },
      {
        question: "Preciso conectar minha carteira para divulgar meu link?",
        answer:
          "Não. Você pode colar e confirmar qualquer endereço público Solana válido acima para gerar seu link de afiliado e acompanhar o painel de ganhos sem assinar nada.",
      },
    ],
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
      createToken: `Criação de Token (Modular ${FEE_RANGE.minDisplay} – ${FEE_RANGE.maxFullSuiteDisplay})`,
      burnToken: `Queima de Tokens / LP (Taxa de ${formatSolAmount(PRICING_SOL.burnStandard)} SOL)`,
      airdrop: `Airdrop em Massa (${formatSolAmount(PRICING_SOL.massAirdropPerBatch)} SOL / Lote)`,
      manageAuthority: `Revogar Autoridades (Taxa de ${formatSolAmount(PRICING_SOL.revokeAuthorityStandalone)} SOL)`,
      createLiquidityPool: "Criar Pool de Liquidez (Taxa de 0.15 SOL)",
      removeLiquidity: `Retirar Liquidez em SOL (Taxa de ${formatSolAmount(PRICING_SOL.withdrawLiquiditySol)} SOL)`,
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



export default dictionary;
