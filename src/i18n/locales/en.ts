import { TranslationDictionary } from "../types";
import { PRICING_SOL, formatSolAmount, getTokenCreationFeeRangeSol } from "@/config/pricing";

const FEE_RANGE = getTokenCreationFeeRangeSol();

const dictionary: TranslationDictionary = {
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
      `🟡 Mutable Metadata: Lock metadata (+${formatSolAmount(PRICING_SOL.immutableMetadata)} SOL) to achieve 100/100 on RugCheck`,
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
    platformFeeLabel: "Platform Fee (8%)",
    netToYouLabel: "Net to You (92%)",
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
    withdrawCtaLink: `Withdraw Liquidity in SOL (${formatSolAmount(PRICING_SOL.withdrawLiquiditySol)} SOL)`,
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
      createToken: `Token Creation (Modular ${FEE_RANGE.minDisplay} – ${FEE_RANGE.maxFullSuiteDisplay})`,
      burnToken: `Token / LP Burn (${formatSolAmount(PRICING_SOL.burnStandard)} SOL Fee)`,
      airdrop: `Mass Airdrop (${formatSolAmount(PRICING_SOL.massAirdropPerBatch)} SOL / Batch)`,
      manageAuthority: `Revoke Authorities (${formatSolAmount(PRICING_SOL.revokeAuthorityStandalone)} SOL Fee)`,
      createLiquidityPool: "Create Liquidity Pool (0.15 SOL Fee)",
      removeLiquidity: `Withdraw Liquidity in SOL (${formatSolAmount(PRICING_SOL.withdrawLiquiditySol)} SOL Fee)`,
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



export default dictionary;
