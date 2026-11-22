import type { AppLocale } from "@/context/LanguageContext";

export type AffiliateFaqCategory = "all" | "payouts" | "security" | "rules";

export interface AffiliateFaqItem {
  question: string;
  answer: string;
  category: Exclude<AffiliateFaqCategory, "all">;
}

export interface AffiliateSecurityBlock {
  title: string;
  body: string;
}

export interface PromoTemplateItem {
  id: string;
  channel: string;
  text: string;
}

export interface AffiliateCopy {
  numberLocale: string;
  // Sticky anchor nav
  anchorNavAria: string;
  navLinkGen: string;
  navDashboard: string;
  navHowItWorks: string;
  navCalculator: string;
  navCommissions: string;
  navPromoKit: string;
  navFaq: string;
  // Hero
  heroStatLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  heroFlowSummary: string;
  heroTrustPills: ReadonlyArray<string>;
  heroPrimaryCta: string;
  heroConnectedCta: string;
  heroSecondaryCta: string;
  heroWalletConnectedLabel: string;
  // Link generator
  generatorTitle: string;
  nonCustodialBadge: string;
  campaignTabsAria: string;
  linkModeLabel: string;
  linkModeRich: string;
  linkModeRecommendedBadge: string;
  linkModeDirect: string;
  linkModeRichHelp: string;
  linkModeDirectHelp: string;
  generatorInputLabel: string;
  disconnectedPlaceholderUrl: string;
  disconnectedHint: string;
  disconnectedCta: string;
  copyLinkBtn: string;
  linkCopied: string;
  copyPitchBtn: string;
  pitchCopied: string;
  clipboardError: string;
  shareGroupLabel: string;
  moreGroupLabel: string;
  showQrBtn: string;
  hideQrBtn: string;
  toggleQrAria: string;
  qrCodeAlt: string;
  qrCaption: string;
  downloadImageBtn: string;
  previewHeading: string;
  previewTabX: string;
  previewTabTelegram: string;
  previewLoading: string;
  previewFallbackTitle: string;
  previewFallbackSubtitle: string;
  shareXAria: string;
  shareTelegramAria: string;
  shareWhatsappAria: string;
  // Calculator
  calculatorTitle: string;
  calculatorSubtitle: string;
  calculatorPopularLabel: string;
  calculatorOtherServicesLabel: string;
  calculatorOtherPlaceholder: string;
  calculatorReferralsLabel: string;
  calculatorMaxHint: string;
  calculatorPresetsLabel: string;
  calculatorOutputLabel: string;
  calculatorUsdNote: string;
  calculatorPerReferralLabel: string;
  calculatorReclaimNote: string;
  calculatorDisclaimer: string;
  calcChipCreate: string;
  calcChipPool: string;
  calcChipVolume: string;
  // Commission table
  commissionTableTitle: string;
  commissionTableSubtitle: string;
  splitBarAffiliateLabel: string;
  splitBarDevLabel: string;
  viewFullCostsLink: string;
  colService: string;
  colTotalFee: string;
  colAffiliateShare: string;
  colDevShare: string;
  // How it works
  howItWorksTitle: string;
  howItWorksSubtitle: string;
  steps: ReadonlyArray<{ title: string; text: string }>;
  solscanExampleTitle: string;
  solscanExampleDesc: string;
  solscanExampleCta: string;
  // Dashboard
  dashboardTitle: string;
  dashboardDesc: string;
  dashboardTeaserTitle: string;
  dashboardTeaserDesc: string;
  dashboardTeaserCta: string;
  dashboardError: string;
  rangeAria: string;
  range7d: string;
  range30d: string;
  range90d: string;
  rangeAll: string;
  refreshDashboardAria: string;
  updatedJustNow: string;
  updatedMinutesAgo: string;
  retryBtn: string;
  kpiClicks: string;
  kpiClicksTip: string;
  kpiConnectedWallets: string;
  kpiConnectedWalletsTip: string;
  kpiConversions: string;
  kpiConversionsTip: string;
  kpiConversionRate: string;
  kpiConversionRateTip: string;
  kpiTotalEarned: string;
  kpiTotalEarnedTip: string;
  dateCol: string;
  amountCol: string;
  txCol: string;
  copySigAria: string;
  sigCopied: string;
  showMoreTxBtn: string;
  emptyStateTitle: string;
  emptyStateDesc: string;
  emptyStateCta: string;
  // Promo kit
  promoKitTitle: string;
  promoKitSubtitle: string;
  promoSyncedNote: string;
  promoLangAria: string;
  bannersTitle: string;
  bannersSubtitle: string;
  downloadBannerBtn: string;
  conductTitle: string;
  conductRules: ReadonlyArray<string>;
  promoTemplates: Record<"en" | "pt" | "es", ReadonlyArray<PromoTemplateItem>>;
  // Security
  securityTitle: string;
  securitySubtitle: string;
  securityBlocks: ReadonlyArray<AffiliateSecurityBlock>;
  // FAQ
  faqTitle: string;
  faqCategoryAria: string;
  faqCategories: Record<AffiliateFaqCategory, string>;
  faqItems: ReadonlyArray<AffiliateFaqItem>;
  // Final CTA & Footer
  finalCtaTitle: string;
  finalCtaSubtitle: string;
  finalCtaDisconnectedBtn: string;
  finalCtaConnectedBtn: string;
  footerNavAria: string;
  footerTermsLink: string;
  footerResponsibleUseLink: string;
  footerCostsLink: string;
  footerSupportLink: string;
}

const SHARED_TEMPLATES: Record<"en" | "pt" | "es", ReadonlyArray<PromoTemplateItem>> = {
  en: [
    {
      id: "en-x",
      channel: "X (Twitter)",
      text: "Launching an SPL or Token-2022 asset on Solana? CreateTokenSolana lets you configure mint, Raydium CPMM pool, vesting lock, and SOL rent recovery non-custodially.\n\nAffiliate link (30% of platform fee is split on-chain): {url}",
    },
    {
      id: "en-tg",
      channel: "Telegram",
      text: "Tool for Solana builders: CreateTokenSolana (non-custodial launchpad for SPL/Token-2022, Raydium CPMM pools, LP lock, mass airdrop, and SOL reclaim).\n\nCheck fees before signing: {url}\n(Disclosure: affiliate link — I receive 30% of the service fee on-chain.)",
    },
  ],
  pt: [
    {
      id: "pt-x",
      channel: "X (Twitter)",
      text: "Vai lançar token SPL ou Token-2022 na Solana? O CreateTokenSolana reúne criação de token, pool Raydium CPMM, vesting/lock e reclaim de SOL em interface não-custodial.\n\nLink de afiliado (30% da taxa de serviço vai on-chain): {url}",
    },
    {
      id: "pt-tg",
      channel: "Telegram",
      text: "Ferramenta para criadores na Solana: CreateTokenSolana — crie tokens SPL/Token-2022, pools Raydium CPMM, vesting, airdrop em massa e recupere SOL de contas vazias sem custódia.\n\nConfira as taxas antes de assinar: {url}\n(Aviso: link de afiliado — recebo 30% da taxa de serviço na transação.)",
    },
  ],
  es: [
    {
      id: "es-x",
      channel: "X (Twitter)",
      text: "¿Lanzando un token SPL o Token-2022 en Solana? CreateTokenSolana ofrece creación de tokens, pools Raydium CPMM, vesting y recuperación de SOL sin custodia.\n\nEnlace de afiliado (30% de la tarifa de servicio on-chain): {url}",
    },
    {
      id: "es-tg",
      channel: "Telegram",
      text: "Herramienta no custodial para Solana: CreateTokenSolana (tokens SPL/Token-2022, pools Raydium CPMM, vesting, airdrop masivo y reclaim de SOL).\n\nRevisa las tarifas antes de firmar: {url}\n(Aviso: enlace de afiliado — recibo el 30% de la tarifa de servicio on-chain.)",
    },
  ],
};

const enCopy: AffiliateCopy = {
  numberLocale: "en-US",
  anchorNavAria: "Affiliate page sections",
  navLinkGen: "Generate link",
  navDashboard: "Dashboard",
  navHowItWorks: "How it works",
  navCalculator: "Calculator",
  navCommissions: "Commissions",
  navPromoKit: "Promo kit",
  navFaq: "FAQ",
  heroStatLabel: "of every eligible service fee",
  heroTitle: "Earn 30% On-Chain on Every Solana Referral",
  heroSubtitle:
    "Share your referral link and receive 30% of platform service fees directly in your Solana wallet in the exact same transaction.",
  heroFlowSummary: "Connect wallet → Copy link → Receive SOL on-chain",
  heroTrustPills: ["Paid on-chain", "100% Non-custodial", "No signup — wallet only"],
  heroPrimaryCta: "Connect wallet & generate link",
  heroConnectedCta: "Copy my referral link",
  heroSecondaryCta: "See how it works",
  heroWalletConnectedLabel: "Connected",
  generatorTitle: "Generate Your Referral Link",
  nonCustodialBadge: "Non-custodial · No KYC",
  campaignTabsAria: "Choose which tool to promote",
  linkModeLabel: "Link style:",
  linkModeRich: "Link with preview",
  linkModeRecommendedBadge: "Recommended",
  linkModeDirect: "Short / direct link",
  linkModeRichHelp: "Best for X, Telegram, WhatsApp and Discord — shows a rich image card automatically.",
  linkModeDirectHelp: "Best for buttons, bios or websites where you want a clean ?ref= URL directly.",
  generatorInputLabel: "Your personal Solana affiliate referral URL",
  disconnectedPlaceholderUrl: "https://www.createtokensol.store/r/YourWalletAddress...",
  disconnectedHint:
    "Connect your public Solana wallet to unlock your personal link. We never ask for private keys or seed phrases.",
  disconnectedCta: "Connect to unlock my link",
  copyLinkBtn: "Copy link",
  linkCopied: "Link copied",
  copyPitchBtn: "Copy pitch + link",
  pitchCopied: "Pitch + link copied",
  clipboardError: "Could not copy automatically. Please select the text manually.",
  shareGroupLabel: "Share",
  moreGroupLabel: "More",
  showQrBtn: "QR Code",
  hideQrBtn: "Hide QR",
  toggleQrAria: "Toggle referral QR code",
  qrCodeAlt: "QR code for your CreateTokenSolana referral link",
  qrCaption: "Scan to open CreateTokenSolana with your referral attribution prefilled.",
  downloadImageBtn: "Download card PNG",
  previewHeading: "Live social preview",
  previewTabX: "X Card",
  previewTabTelegram: "Telegram",
  previewLoading: "Rendering card preview…",
  previewFallbackTitle: "Preview image unavailable",
  previewFallbackSubtitle: "Your referral link still works normally and tracks attribution.",
  shareXAria: "Share affiliate link on X",
  shareTelegramAria: "Share affiliate link on Telegram",
  shareWhatsappAria: "Share affiliate link on WhatsApp",
  calculatorTitle: "Illustrative Earnings Estimator",
  calculatorSubtitle:
    "Pick a popular service or browse all tools to simulate your 30% on-chain fee share.",
  calculatorPopularLabel: "Popular services",
  calculatorOtherServicesLabel: "Other platform services",
  calculatorOtherPlaceholder: "Choose another service…",
  calculatorReferralsLabel: "Estimated referrals / month",
  calculatorMaxHint: "Max 500",
  calculatorPresetsLabel: "Quick monthly presets",
  calculatorOutputLabel: "Illustrative monthly estimate",
  calculatorUsdNote: "live SOL reference",
  calculatorPerReferralLabel: "Per referral (30%)",
  calculatorReclaimNote:
    "For Reclaim SOL, the platform fee is 8% of reclaimed rent (2.4% affiliate / 5.6% dev).",
  calculatorDisclaimer:
    "Illustrative estimate only, with no guarantee of earnings. Actual results depend on traffic and real on-chain usage.",
  calcChipCreate: "Create Token (0.35 SOL)",
  calcChipPool: "Raydium Pool (0.07 SOL)",
  calcChipVolume: "Volume Bot (0.12 SOL)",
  commissionTableTitle: "Commission by Service (Synced with /costs)",
  commissionTableSubtitle:
    "Sorted from highest to lowest affiliate payout. Every eligible fee splits atomically on-chain.",
  splitBarAffiliateLabel: "30% Affiliate (You)",
  splitBarDevLabel: "70% Platform Dev",
  viewFullCostsLink: "View full /costs table",
  colService: "Service",
  colTotalFee: "Total Fee",
  colAffiliateShare: "Your Commission (30%)",
  colDevShare: "Dev (70%)",
  howItWorksTitle: "How It Works",
  howItWorksSubtitle: "Zero custody, zero withdrawal delays — settled in the same Solana transaction.",
  steps: [
    {
      title: "Connect wallet",
      text: "Your public Solana address becomes your ?ref= identifier.",
    },
    {
      title: "Share your link",
      text: "Attribution is saved for 30 days (last-click rule).",
    },
    {
      title: "User launches",
      text: "The transaction builds a 70/30 SystemProgram.transfer split.",
    },
    {
      title: "Receive SOL",
      text: "30% settles in your wallet at on-chain confirmation.",
    },
  ],
  solscanExampleTitle: "Verified On-Chain 70/30 Split Example",
  solscanExampleDesc:
    "Inspect both SystemProgram.transfer instructions executed atomically in one transaction.",
  solscanExampleCta: "Inspect on Solscan",
  dashboardTitle: "Affiliate Dashboard",
  dashboardDesc: "Privacy-friendly funnel events and on-chain verified SOL payouts.",
  dashboardTeaserTitle: "Track your clicks, conversions, and SOL payouts",
  dashboardTeaserDesc:
    "Connect your wallet to unlock your live metrics panel, conversion rate, and Solscan payout history.",
  dashboardTeaserCta: "Connect to view your earnings",
  dashboardError: "Could not load affiliate metrics right now.",
  rangeAria: "Filter metrics by time period",
  range7d: "7d",
  range30d: "30d",
  range90d: "90d",
  rangeAll: "All",
  refreshDashboardAria: "Refresh affiliate metrics",
  updatedJustNow: "Updated just now",
  updatedMinutesAgo: "Updated {min}m ago",
  retryBtn: "Try again",
  kpiClicks: "Clicks",
  kpiClicksTip: "Unique referral sessions captured when visitors land on your link.",
  kpiConnectedWallets: "Wallets Connected",
  kpiConnectedWalletsTip: "Referred sessions that connected a Solana wallet.",
  kpiConversions: "Conversions",
  kpiConversionsTip: "On-chain transactions verified with a 30% split to your wallet.",
  kpiConversionRate: "Conversion Rate",
  kpiConversionRateTip: "Percentage of referral clicks that completed a paid on-chain action.",
  kpiTotalEarned: "Total Earned (SOL)",
  kpiTotalEarnedTip: "Total SOL settled directly to your wallet during the selected period.",
  dateCol: "Date",
  amountCol: "Commission",
  txCol: "Transaction",
  copySigAria: "Copy transaction signature",
  sigCopied: "Signature copied",
  showMoreTxBtn: "Show more transactions",
  emptyStateTitle: "No conversions in this period yet",
  emptyStateDesc:
    "Copy your referral link and share it with Solana builders. Verified payouts appear automatically.",
  emptyStateCta: "Copy my link",
  promoKitTitle: "Promotion Kit & Conduct Rules",
  promoKitSubtitle: "Ready-to-use copy synced with your active link plus PNG banners with live previews.",
  promoSyncedNote: "Templates below automatically use your selected tool and link format.",
  promoLangAria: "Choose promotion template language",
  bannersTitle: "Downloadable Banners (PNG)",
  bannersSubtitle: "Preview each format before downloading.",
  downloadBannerBtn: "Download PNG",
  conductTitle: "Affiliate Conduct Rules",
  conductRules: [
    "Disclose clearly that you are sharing an affiliate link.",
    "Never promise guaranteed profits, passive income, or 'easy money'.",
    "Do not promote scams, rug pulls, or misleading claims about CreateTokenSolana.",
    "Do not impersonate official CreateTokenSolana channels or run deceptive brand ads.",
  ],
  promoTemplates: SHARED_TEMPLATES,
  securityTitle: "Transparency & Security",
  securitySubtitle:
    "How the 70/30 split is built, simulated, verified on-chain, and protected against transaction failures.",
  securityBlocks: [
    {
      title: "Non-Custodial Architecture",
      body: "CreateTokenSolana never requests private keys or seed phrases. Every transaction is built for your wallet to simulate and sign locally.",
    },
    {
      title: "Third-Party Programs vs. App Audit",
      body: "Transactions interact with standard Solana ecosystem programs (SPL Token, Token-2022, Metaplex Token Metadata, Raydium CPMM), which maintain their own independent audits. CreateTokenSolana's web interface and API have not yet undergone an independent third-party audit.",
    },
    {
      title: "Client-Side Verification & Simulation",
      body: "Before signing, our client verifies program whitelists and fee split amounts; wallets simulate the exact SOL balance change before approval.",
    },
    {
      title: "Silent Fallback & Rent-Exempt Safety",
      body: "If a referral address is invalid, matches the connected wallet, or cannot safely receive a transfer below Solana's rent-exempt minimum (~0.00089088 SOL for empty accounts), 100% of the service fee routes to the dev wallet so the user's transaction never fails.",
    },
  ],
  faqTitle: "Frequently Asked Questions",
  faqCategoryAria: "Filter FAQ by category",
  faqCategories: {
    all: "All (9)",
    payouts: "Payouts",
    security: "Security & Tech",
    rules: "Rules & Taxes",
  },
  faqItems: [
    {
      category: "payouts",
      question: "When do I get paid?",
      answer:
        "Immediately upon on-chain confirmation. The 30% share is transferred directly to your wallet in the same transaction via SystemProgram.transfer.",
    },
    {
      category: "payouts",
      question: "Is there an earnings cap?",
      answer:
        "No platform cap applies. Payouts depend strictly on valid, completed transactions attributed to your link.",
    },
    {
      category: "rules",
      question: "Do I need KYC?",
      answer:
        "No account registration or KYC is required to generate a ?ref= link. You are solely responsible for local compliance.",
    },
    {
      category: "payouts",
      question: "How long is my referral link valid?",
      answer:
        "Attribution persists for 30 days in localStorage and a first-party cookie using a last-click rule (a newer valid ?ref= replaces the previous one).",
    },
    {
      category: "security",
      question: "What if my wallet cannot receive the transfer?",
      answer:
        "If an empty wallet would receive less than Solana's rent-exempt minimum (~0.00089088 SOL) or is not a standard System account, the system silently routes 100% to the dev wallet so the transaction succeeds. Keeping a small SOL balance in your affiliate wallet avoids rent-exempt skips.",
    },
    {
      category: "rules",
      question: "Can I refer myself?",
      answer:
        "No. Self-referrals (where ?ref= equals the connected wallet) and the developer wallet are automatically ignored both client-side and server-side.",
    },
    {
      category: "security",
      question: "How does tracking work?",
      answer:
        "We record privacy-friendly click and wallet-connect events using an ephemeral session hash (no IP or personal data stored) and verify payouts directly on-chain.",
    },
    {
      category: "rules",
      question: "What are the promotion rules?",
      answer:
        "No spam, no profit guarantees, no promotion of rug pulls or scams, and no deceptive use of the CreateTokenSolana brand.",
    },
    {
      category: "rules",
      question: "Are taxes handled by the platform?",
      answer:
        "No. Affiliates are independent participants and are solely responsible for reporting and paying any applicable taxes in their jurisdiction.",
    },
  ],
  finalCtaTitle: "Ready to start earning 30% on-chain?",
  finalCtaSubtitle:
    "Connect your Solana wallet in seconds and share your personalized preview card.",
  finalCtaDisconnectedBtn: "Connect wallet & generate link",
  finalCtaConnectedBtn: "Copy my referral link",
  footerNavAria: "Affiliate program legal and support links",
  footerTermsLink: "Affiliate Program Terms",
  footerResponsibleUseLink: "Responsible Use Policy",
  footerCostsLink: "Fee Schedule (/costs)",
  footerSupportLink: "Support",
};

const ptBrCopy: AffiliateCopy = {
  numberLocale: "pt-BR",
  anchorNavAria: "Seções da página de afiliados",
  navLinkGen: "Gerar link",
  navDashboard: "Dashboard",
  navHowItWorks: "Como funciona",
  navCalculator: "Calculadora",
  navCommissions: "Comissões",
  navPromoKit: "Kit",
  navFaq: "FAQ",
  heroStatLabel: "de cada taxa de serviço elegível",
  heroTitle: "Receba 30% On-Chain em Cada Indicação na Solana",
  heroSubtitle:
    "Compartilhe seu link de indicação e receba 30% das taxas da plataforma direto na sua carteira Solana na mesma transação.",
  heroFlowSummary: "Conectar carteira → Copiar link → Receber SOL on-chain",
  heroTrustPills: ["Pago on-chain", "100% Não-custodial", "Sem cadastro, só a carteira"],
  heroPrimaryCta: "Conectar carteira e gerar link",
  heroConnectedCta: "Copiar meu link",
  heroSecondaryCta: "Ver como funciona",
  heroWalletConnectedLabel: "Conectada",
  generatorTitle: "Gere seu Link de Afiliado",
  nonCustodialBadge: "Não-custodial · Sem KYC",
  campaignTabsAria: "Escolha qual ferramenta divulgar",
  linkModeLabel: "Formato do link:",
  linkModeRich: "Link com prévia",
  linkModeRecommendedBadge: "Recomendado",
  linkModeDirect: "Link curto/direto",
  linkModeRichHelp: "Ideal para X, Telegram, WhatsApp e Discord — exibe imagem e resumo automaticamente.",
  linkModeDirectHelp: "Ideal para botões, bio ou sites onde você prefere a URL ?ref= direta.",
  generatorInputLabel: "Seu link pessoal de afiliado Solana",
  disconnectedPlaceholderUrl: "https://www.createtokensol.store/r/SuaCarteira...",
  disconnectedHint:
    "Conecte sua carteira Solana pública para liberar seu link pessoal. Nunca pedimos chave privada ou seed phrase.",
  disconnectedCta: "Conectar para liberar meu link",
  copyLinkBtn: "Copiar link",
  linkCopied: "Link copiado",
  copyPitchBtn: "Copiar texto + link",
  pitchCopied: "Texto + link copiados",
  clipboardError: "Não foi possível copiar automaticamente. Selecione o link manualmente.",
  shareGroupLabel: "Compartilhar",
  moreGroupLabel: "Mais",
  showQrBtn: "QR Code",
  hideQrBtn: "Ocultar QR",
  toggleQrAria: "Alternar exibição do QR Code de afiliado",
  qrCodeAlt: "QR Code do seu link de afiliado CreateTokenSolana",
  qrCaption: "Escaneie para abrir o CreateTokenSolana com sua atribuição de afiliado preenchida.",
  downloadImageBtn: "Baixar imagem PNG",
  previewHeading: "Prévia nas redes sociais",
  previewTabX: "Card no X",
  previewTabTelegram: "Telegram",
  previewLoading: "Carregando prévia do card…",
  previewFallbackTitle: "Prévia da imagem indisponível",
  previewFallbackSubtitle: "Seu link continua funcionando normalmente e rastreando indicações.",
  shareXAria: "Compartilhar link de afiliado no X",
  shareTelegramAria: "Compartilhar link de afiliado no Telegram",
  shareWhatsappAria: "Compartilhar link de afiliado no WhatsApp",
  calculatorTitle: "Calculadora de Ganhos Ilustrativa",
  calculatorSubtitle:
    "Escolha um serviço popular ou explore todas as ferramentas para simular seus 30% em SOL.",
  calculatorPopularLabel: "Serviços mais populares",
  calculatorOtherServicesLabel: "Outros serviços da plataforma",
  calculatorOtherPlaceholder: "Selecionar outro serviço…",
  calculatorReferralsLabel: "Indicações estimadas / mês",
  calculatorMaxHint: "Máx. 500",
  calculatorPresetsLabel: "Atalhos rápidos por mês",
  calculatorOutputLabel: "Estimativa mensal ilustrativa",
  calculatorUsdNote: "referência atual do SOL",
  calculatorPerReferralLabel: "Por indicação (30%)",
  calculatorReclaimNote:
    "No Reclaim SOL, a taxa da plataforma é 8% do rent recuperado (2,4% afiliado e 5,6% dev).",
  calculatorDisclaimer:
    "Estimativa ilustrativa, sem garantia de ganhos. Os resultados variam conforme o tráfego e o uso real da plataforma.",
  calcChipCreate: "Criar Token (0,35 SOL)",
  calcChipPool: "Pool Raydium (0,07 SOL)",
  calcChipVolume: "Volume Bot (0,12 SOL)",
  commissionTableTitle: "Comissão por Serviço (Sincronizada com /costs)",
  commissionTableSubtitle:
    "Ordenada da maior para a menor comissão. Toda taxa elegível é dividida atomicamente on-chain.",
  splitBarAffiliateLabel: "30% Afiliado (Você)",
  splitBarDevLabel: "70% Plataforma Dev",
  viewFullCostsLink: "Ver tabela completa em /costs",
  colService: "Serviço",
  colTotalFee: "Taxa Total",
  colAffiliateShare: "Sua Comissão (30%)",
  colDevShare: "Dev (70%)",
  howItWorksTitle: "Como Funciona",
  howItWorksSubtitle: "Sem custódia e sem pedido de saque — liquidado na mesma transação Solana.",
  steps: [
    {
      title: "Conecte a carteira",
      text: "Seu endereço público vira seu identificador ?ref=.",
    },
    {
      title: "Divulgue o link",
      text: "A atribuição fica salva por 30 dias (último clique).",
    },
    {
      title: "Indicado usa o app",
      text: "A transação executa o split 70/30 via SystemProgram.transfer.",
    },
    {
      title: "Receba em SOL",
      text: "Os 30% caem direto na sua carteira na confirmação.",
    },
  ],
  solscanExampleTitle: "Exemplo Verificado de Split 70/30 On-Chain",
  solscanExampleDesc:
    "Veja as duas instruções SystemProgram.transfer executadas juntas na mesma transação.",
  solscanExampleCta: "Ver no Solscan",
  dashboardTitle: "Dashboard do Afiliado",
  dashboardDesc: "Eventos de funil privacy-friendly e comissões em SOL verificadas on-chain.",
  dashboardTeaserTitle: "Acompanhe cliques, conversões e ganhos em SOL",
  dashboardTeaserDesc:
    "Conecte sua carteira para liberar seu painel em tempo real, taxa de conversão e histórico no Solscan.",
  dashboardTeaserCta: "Conecte para ver seus ganhos",
  dashboardError: "Não foi possível carregar as métricas de afiliado agora.",
  rangeAria: "Filtrar métricas por período",
  range7d: "7d",
  range30d: "30d",
  range90d: "90d",
  rangeAll: "Tudo",
  refreshDashboardAria: "Atualizar métricas do painel",
  updatedJustNow: "Atualizado agora",
  updatedMinutesAgo: "Atualizado há {min} min",
  retryBtn: "Tentar novamente",
  kpiClicks: "Cliques",
  kpiClicksTip: "Sessões únicas registradas quando visitantes acessam seu link.",
  kpiConnectedWallets: "Carteiras Conectadas",
  kpiConnectedWalletsTip: "Sessões indicadas que conectaram uma carteira Solana.",
  kpiConversions: "Conversões",
  kpiConversionsTip: "Transações on-chain confirmadas com split de 30% para sua carteira.",
  kpiConversionRate: "Taxa de Conversão",
  kpiConversionRateTip: "Percentual de cliques que concluíram uma transação paga.",
  kpiTotalEarned: "Total Ganho (SOL)",
  kpiTotalEarnedTip: "Total em SOL liquidado diretamente na sua carteira no período.",
  dateCol: "Data",
  amountCol: "Comissão",
  txCol: "Transação",
  copySigAria: "Copiar assinatura da transação",
  sigCopied: "Assinatura copiada",
  showMoreTxBtn: "Ver mais transações",
  emptyStateTitle: "Nenhuma conversão neste período ainda",
  emptyStateDesc:
    "Copie seu link de indicação e compartilhe com criadores na Solana. Os pagamentos aparecem automaticamente.",
  emptyStateCta: "Copiar meu link",
  promoKitTitle: "Kit de Divulgação e Regras de Conduta",
  promoKitSubtitle: "Textos prontos sincronizados com seu link ativo e banners PNG com miniatura.",
  promoSyncedNote: "Os textos abaixo usam automaticamente a ferramenta e o formato escolhidos no gerador.",
  promoLangAria: "Selecionar idioma dos textos prontos",
  bannersTitle: "Banners para Baixar (PNG)",
  bannersSubtitle: "Visualize a miniatura de cada formato antes de baixar.",
  downloadBannerBtn: "Baixar PNG",
  conductTitle: "Regras de Conduta do Afiliado",
  conductRules: [
    "Informe de forma clara que se trata de um link de afiliado.",
    "Nunca prometa lucro garantido, renda passiva ou 'dinheiro fácil'.",
    "Não promova golpes, rug pulls ou informações falsas sobre o CreateTokenSolana.",
    "Não se passe por canal oficial nem use a marca em anúncios enganosos.",
  ],
  promoTemplates: SHARED_TEMPLATES,
  securityTitle: "Transparência e Segurança",
  securitySubtitle:
    "Como o split 70/30 é construído, simulado, verificado on-chain e protegido contra falhas.",
  securityBlocks: [
    {
      title: "Modelo Não-Custodial",
      body: "O CreateTokenSolana nunca solicita chave privada nem seed phrase. Toda transação é simulada e assinada localmente na sua carteira.",
    },
    {
      title: "Programas de Terceiros vs. Auditoria da Aplicação",
      body: "As transações interagem com programas padrão da Solana (SPL Token, Token-2022, Metaplex Token Metadata e Raydium CPMM), que possuem auditorias próprias mantidas por suas equipes. A interface web e a API do CreateTokenSolana ainda não passaram por auditoria independente de terceiros.",
    },
    {
      title: "Verificação e Simulação no Cliente",
      body: "Antes da assinatura, o cliente valida a whitelist de programas e os valores do split; sua carteira exibe a simulação exata do saldo antes de confirmar.",
    },
    {
      title: "Fallback Silencioso e Rent-Exempt",
      body: "Se o ?ref= for inválido, igual à carteira conectada ou se uma carteira zerada receber valor abaixo do mínimo rent-exempt da Solana (~0,00089088 SOL), 100% da taxa segue para a carteira dev para que a transação nunca falhe.",
    },
  ],
  faqTitle: "Perguntas Frequentes (FAQ)",
  faqCategoryAria: "Filtrar perguntas por categoria",
  faqCategories: {
    all: "Todas (9)",
    payouts: "Pagamentos",
    security: "Segurança",
    rules: "Regras e Impostos",
  },
  faqItems: [
    {
      category: "payouts",
      question: "Quando eu recebo?",
      answer:
        "Na mesma transação, assim que confirmada na rede Solana. Os 30% são enviados direto para sua carteira via SystemProgram.transfer.",
    },
    {
      category: "payouts",
      question: "Existe limite de ganhos?",
      answer:
        "Não há teto definido pela plataforma. Os valores dependem exclusivamente das transações válidas atribuídas ao seu link.",
    },
    {
      category: "rules",
      question: "Preciso fazer KYC?",
      answer:
        "Não exigimos cadastro nem KYC para gerar um link ?ref=. O cumprimento de obrigações legais locais é de sua responsabilidade.",
    },
    {
      category: "payouts",
      question: "Por quanto tempo o link é válido?",
      answer:
        "A atribuição fica salva por 30 dias em localStorage e cookie próprio, seguindo a regra de último clique (um novo ?ref= válido substitui o anterior).",
    },
    {
      category: "security",
      question: "O que acontece se minha carteira não puder receber?",
      answer:
        "Se a carteira estiver zerada e a comissão ficar abaixo do mínimo rent-exempt (~0,00089088 SOL) ou não for uma conta System padrão, a plataforma faz fallback silencioso para 100% dev wallet para não falhar a transação. Manter um pequeno saldo de SOL na carteira evita esse cenário.",
    },
    {
      category: "rules",
      question: "Posso me autoindicar?",
      answer:
        "Não. Autoindicações (?ref= igual à carteira conectada) e o endereço da carteira dev são ignorados automaticamente no cliente e no servidor.",
    },
    {
      category: "security",
      question: "Como funciona o rastreamento?",
      answer:
        "Registramos cliques e conexões de carteira com um identificador temporário de sessão (sem IP ou dados pessoais) e validamos as conversões diretamente na blockchain.",
    },
    {
      category: "rules",
      question: "Quais são as regras de divulgação?",
      answer:
        "É proibido fazer spam, prometer ganhos, promover rug pulls ou golpes e usar a marca CreateTokenSolana de forma enganosa.",
    },
    {
      category: "rules",
      question: "Há impostos sobre as comissões?",
      answer:
        "A plataforma não retém nem recolhe impostos em seu nome. Cada afiliado é responsável por declarar e recolher eventuais tributos conforme sua jurisdição.",
    },
  ],
  finalCtaTitle: "Pronto para começar a receber 30% on-chain?",
  finalCtaSubtitle:
    "Conecte sua carteira Solana em segundos e compartilhe seu card personalizado.",
  finalCtaDisconnectedBtn: "Conectar carteira e gerar link",
  finalCtaConnectedBtn: "Copiar meu link",
  footerNavAria: "Links legais e de suporte do programa de afiliados",
  footerTermsLink: "Termos do Programa de Afiliados",
  footerResponsibleUseLink: "Política de Uso Responsável",
  footerCostsLink: "Tabela de Custos (/costs)",
  footerSupportLink: "Suporte",
};

const esCopy: AffiliateCopy = {
  numberLocale: "es-ES",
  anchorNavAria: "Secciones de la página de afiliados",
  navLinkGen: "Generar enlace",
  navDashboard: "Panel",
  navHowItWorks: "Cómo funciona",
  navCalculator: "Calculadora",
  navCommissions: "Comisiones",
  navPromoKit: "Kit",
  navFaq: "FAQ",
  heroStatLabel: "de cada tarifa de servicio elegible",
  heroTitle: "Recibe 30% On-Chain por Cada Referido en Solana",
  heroSubtitle:
    "Comparte tu enlace de referido y recibe el 30% de las tarifas de servicio directo en tu billetera Solana en la misma transacción.",
  heroFlowSummary: "Conectar billetera → Copiar enlace → Recibir SOL on-chain",
  heroTrustPills: ["Pago on-chain", "100% No custodial", "Sin registro, solo billetera"],
  heroPrimaryCta: "Conectar billetera y generar enlace",
  heroConnectedCta: "Copiar mi enlace",
  heroSecondaryCta: "Ver cómo funciona",
  heroWalletConnectedLabel: "Conectada",
  generatorTitle: "Genera tu Enlace de Afiliado",
  nonCustodialBadge: "No custodial · Sin KYC",
  campaignTabsAria: "Elige qué herramienta promocionar",
  linkModeLabel: "Formato del enlace:",
  linkModeRich: "Enlace con vista previa",
  linkModeRecommendedBadge: "Recomendado",
  linkModeDirect: "Enlace corto/directo",
  linkModeRichHelp: "Ideal para X, Telegram, WhatsApp y Discord — muestra tarjeta con imagen automáticamente.",
  linkModeDirectHelp: "Ideal para botones, bio o sitios web donde prefieres la URL ?ref= directa.",
  generatorInputLabel: "Tu enlace personal de afiliado Solana",
  disconnectedPlaceholderUrl: "https://www.createtokensol.store/r/TuBilletera...",
  disconnectedHint:
    "Conecta tu billetera Solana pública para desbloquear tu enlace. Nunca pedimos clave privada ni seed phrase.",
  disconnectedCta: "Conectar para desbloquear mi enlace",
  copyLinkBtn: "Copiar enlace",
  linkCopied: "Enlace copiado",
  copyPitchBtn: "Copiar texto + enlace",
  pitchCopied: "Texto + enlace copiados",
  clipboardError: "No se pudo copiar automáticamente. Selecciona el texto manualmente.",
  shareGroupLabel: "Compartir",
  moreGroupLabel: "Más",
  showQrBtn: "Código QR",
  hideQrBtn: "Ocultar QR",
  toggleQrAria: "Mostrar u ocultar código QR",
  qrCodeAlt: "Código QR para tu enlace de afiliado CreateTokenSolana",
  qrCaption: "Escanea para abrir CreateTokenSolana con tu atribución prellenada.",
  downloadImageBtn: "Descargar imagen PNG",
  previewHeading: "Vista previa en redes",
  previewTabX: "Tarjeta X",
  previewTabTelegram: "Telegram",
  previewLoading: "Cargando vista previa…",
  previewFallbackTitle: "Vista previa no disponible",
  previewFallbackSubtitle: "Tu enlace sigue funcionando con normalidad.",
  shareXAria: "Compartir enlace de afiliado en X",
  shareTelegramAria: "Compartir enlace de afiliado en Telegram",
  shareWhatsappAria: "Compartir enlace de afiliado en WhatsApp",
  calculatorTitle: "Calculadora Ilustrativa de Comisiones",
  calculatorSubtitle:
    "Elige un servicio popular o explora todas las herramientas para simular tu 30% en SOL.",
  calculatorPopularLabel: "Servicios populares",
  calculatorOtherServicesLabel: "Otros servicios de la plataforma",
  calculatorOtherPlaceholder: "Elegir otro servicio…",
  calculatorReferralsLabel: "Referidos estimados / mes",
  calculatorMaxHint: "Máx. 500",
  calculatorPresetsLabel: "Atajos mensuales rápidos",
  calculatorOutputLabel: "Estimación mensual ilustrativa",
  calculatorUsdNote: "referencia actual de SOL",
  calculatorPerReferralLabel: "Por referido (30%)",
  calculatorReclaimNote:
    "En Reclaim SOL, la tarifa es del 8% del rent recuperado (2,4% afiliado / 5,6% dev).",
  calculatorDisclaimer:
    "Estimación ilustrativa, sin garantía de ganancias. Los resultados dependen del tráfico y el uso real.",
  calcChipCreate: "Crear Token (0,35 SOL)",
  calcChipPool: "Pool Raydium (0,07 SOL)",
  calcChipVolume: "Volume Bot (0,12 SOL)",
  commissionTableTitle: "Comisión por Servicio (Sincronizada con /costs)",
  commissionTableSubtitle:
    "Ordenada de mayor a menor comisión. Cada tarifa elegible se divide atómicamente on-chain.",
  splitBarAffiliateLabel: "30% Afiliado (Tú)",
  splitBarDevLabel: "70% Plataforma Dev",
  viewFullCostsLink: "Ver tabla completa en /costs",
  colService: "Servicio",
  colTotalFee: "Tarifa Total",
  colAffiliateShare: "Tu Comisión (30%)",
  colDevShare: "Dev (70%)",
  howItWorksTitle: "Cómo Funciona",
  howItWorksSubtitle: "Sin custodia ni retiros manuales — liquidado en la misma transacción Solana.",
  steps: [
    {
      title: "Conecta tu billetera",
      text: "Tu dirección pública se convierte en tu identificador ?ref=.",
    },
    {
      title: "Comparte tu enlace",
      text: "La atribución se guarda por 30 días (último clic).",
    },
    {
      title: "El usuario opera",
      text: "La transacción divide 70/30 vía SystemProgram.transfer.",
    },
    {
      title: "Recibe SOL",
      text: "El 30% llega a tu billetera al confirmarse on-chain.",
    },
  ],
  solscanExampleTitle: "Ejemplo Verificado de Split 70/30 On-Chain",
  solscanExampleDesc:
    "Revisa las dos instrucciones SystemProgram.transfer ejecutadas en la misma transacción.",
  solscanExampleCta: "Ver en Solscan",
  dashboardTitle: "Panel de Afiliado",
  dashboardDesc: "Eventos de embudo privacy-friendly y pagos en SOL verificados on-chain.",
  dashboardTeaserTitle: "Sigue tus clics, conversiones y ganancias en SOL",
  dashboardTeaserDesc:
    "Conecta tu billetera para desbloquear tu panel en tiempo real, tasa de conversión e historial en Solscan.",
  dashboardTeaserCta: "Conecta para ver tus ganancias",
  dashboardError: "No se pudieron cargar las métricas ahora.",
  rangeAria: "Filtrar métricas por periodo",
  range7d: "7d",
  range30d: "30d",
  range90d: "90d",
  rangeAll: "Todo",
  refreshDashboardAria: "Actualizar métricas del panel",
  updatedJustNow: "Actualizado ahora",
  updatedMinutesAgo: "Actualizado hace {min} min",
  retryBtn: "Reintentar",
  kpiClicks: "Clics",
  kpiClicksTip: "Sesiones únicas registradas al abrir tu enlace.",
  kpiConnectedWallets: "Billeteras Conectadas",
  kpiConnectedWalletsTip: "Sesiones referidas que conectaron una billetera Solana.",
  kpiConversions: "Conversiones",
  kpiConversionsTip: "Transacciones on-chain verificadas con split del 30%.",
  kpiConversionRate: "Tasa de Conversión",
  kpiConversionRateTip: "Porcentaje de clics que completaron una operación pagada.",
  kpiTotalEarned: "Total Ganado (SOL)",
  kpiTotalEarnedTip: "Total en SOL liquidado directamente a tu billetera en el periodo.",
  dateCol: "Fecha",
  amountCol: "Comisión",
  txCol: "Transacción",
  copySigAria: "Copiar firma de transacción",
  sigCopied: "Firma copiada",
  showMoreTxBtn: "Ver más transacciones",
  emptyStateTitle: "Aún no hay conversiones en este periodo",
  emptyStateDesc:
    "Copia tu enlace de referido y compártelo con creadores en Solana. Los pagos aparecen automáticamente.",
  emptyStateCta: "Copiar mi enlace",
  promoKitTitle: "Kit de Difusión y Reglas de Conducta",
  promoKitSubtitle: "Textos listos sincronizados con tu enlace activo y banners PNG con miniatura.",
  promoSyncedNote: "Los textos usan automáticamente la herramienta y formato elegidos arriba.",
  promoLangAria: "Elegir idioma de las plantillas",
  bannersTitle: "Banners Descargables (PNG)",
  bannersSubtitle: "Previsualiza cada formato antes de descargar.",
  downloadBannerBtn: "Descargar PNG",
  conductTitle: "Reglas de Conducta del Afiliado",
  conductRules: [
    "Indica claramente que estás compartiendo un enlace de afiliado.",
    "Nunca prometas ganancias garantizadas, ingresos pasivos ni 'dinero fácil'.",
    "No promociones estafas, rug pulls ni afirmaciones falsas sobre CreateTokenSolana.",
    "No te hagas pasar por un canal oficial ni publiques anuncios engañosos.",
  ],
  promoTemplates: SHARED_TEMPLATES,
  securityTitle: "Transparencia y Seguridad",
  securitySubtitle:
    "Cómo se construye, simula, verifica on-chain y protege el split 70/30 ante fallos.",
  securityBlocks: [
    {
      title: "Arquitectura No Custodial",
      body: "CreateTokenSolana nunca pide claves privadas ni frases semilla. Cada transacción se simula y firma localmente en tu billetera.",
    },
    {
      title: "Programas de Terceros vs. Auditoría de la App",
      body: "Las transacciones interactúan con programas estándar de Solana (SPL Token, Token-2022, Metaplex y Raydium CPMM), que tienen auditorías independientes propias. La interfaz web y la API de CreateTokenSolana aún no cuentan con una auditoría externa independiente.",
    },
    {
      title: "Verificación y Simulación en Cliente",
      body: "Antes de firmar, el cliente valida las whitelists de programas y los montos del split; tu billetera muestra el cambio exacto de SOL.",
    },
    {
      title: "Fallback Silencioso y Rent-Exempt",
      body: "Si el ?ref= es inválido, coincide con la billetera conectada o una cuenta vacía recibiría menos del mínimo rent-exempt (~0,00089088 SOL), el 100% va a la billetera dev para evitar fallos.",
    },
  ],
  faqTitle: "Preguntas Frecuentes (FAQ)",
  faqCategoryAria: "Filtrar preguntas por categoría",
  faqCategories: {
    all: "Todas (9)",
    payouts: "Pagos",
    security: "Seguridad",
    rules: "Reglas e Impuestos",
  },
  faqItems: [
    {
      category: "payouts",
      question: "¿Cuándo recibo el pago?",
      answer:
        "Inmediatamente al confirmarse on-chain. El 30% se transfiere directo a tu billetera en la misma transacción mediante SystemProgram.transfer.",
    },
    {
      category: "payouts",
      question: "¿Existe un límite de ganancias?",
      answer:
        "No hay límite impuesto por la plataforma. Los pagos dependen únicamente de las transacciones válidas atribuidas a tu enlace.",
    },
    {
      category: "rules",
      question: "¿Necesito pasar KYC?",
      answer:
        "No se requiere registro ni KYC para generar un enlace ?ref=. Eres responsable del cumplimiento legal en tu jurisdicción.",
    },
    {
      category: "payouts",
      question: "¿Cuánto tiempo dura la atribución del enlace?",
      answer:
        "Persiste durante 30 días en localStorage y cookie propia bajo regla de último clic (un nuevo ?ref= válido reemplaza al anterior).",
    },
    {
      category: "security",
      question: "¿Qué pasa si mi billetera no puede recibir la transferencia?",
      answer:
        "Si una cuenta vacía recibiría menos del mínimo rent-exempt (~0,00089088 SOL) o no es una cuenta System estándar, el 100% se enruta silenciosamente a la billetera dev para que la transacción no falle.",
    },
    {
      category: "rules",
      question: "¿Puedo autorreferirme?",
      answer:
        "No. Las autorreferencias (?ref= igual a la billetera conectada) y la billetera dev se ignoran automáticamente en cliente y servidor.",
    },
    {
      category: "security",
      question: "¿Cómo funciona el seguimiento?",
      answer:
        "Registramos clics y conexiones con un hash de sesión efímero (sin IP ni datos personales) y verificamos los pagos directamente on-chain.",
    },
    {
      category: "rules",
      question: "¿Cuáles son las reglas de difusión?",
      answer:
        "Se prohíbe el spam, las promesas de lucro, la promoción de estafas o rug pulls y el uso engañoso de la marca CreateTokenSolana.",
    },
    {
      category: "rules",
      question: "¿La plataforma gestiona impuestos?",
      answer:
        "No. Cada afiliado es participante independiente y responsable de declarar y pagar los impuestos aplicables en su país.",
    },
  ],
  finalCtaTitle: "¿Listo para empezar a recibir 30% on-chain?",
  finalCtaSubtitle:
    "Conecta tu billetera Solana en segundos y comparte tu tarjeta personalizada.",
  finalCtaDisconnectedBtn: "Conectar billetera y generar enlace",
  finalCtaConnectedBtn: "Copiar mi enlace",
  footerNavAria: "Enlaces legales y de soporte del programa de afiliados",
  footerTermsLink: "Términos del Programa de Afiliados",
  footerResponsibleUseLink: "Política de Uso Responsable",
  footerCostsLink: "Tabla de Tarifas (/costs)",
  footerSupportLink: "Soporte",
};

export const AFFILIATE_TRANSLATIONS: Partial<Record<AppLocale, AffiliateCopy>> & {
  en: AffiliateCopy;
  "pt-BR": AffiliateCopy;
  es: AffiliateCopy;
} = {
  en: enCopy,
  "pt-BR": ptBrCopy,
  pt: ptBrCopy,
  es: esCopy,
};

export function getAffiliateCopy(locale: AppLocale): AffiliateCopy {
  return AFFILIATE_TRANSLATIONS[locale] ?? AFFILIATE_TRANSLATIONS.en;
}
