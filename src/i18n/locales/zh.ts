import { TranslationDictionary } from "../types";
import { PRICING_SOL, formatSolAmount, getTokenCreationFeeRangeSol } from "@/config/pricing";

const FEE_RANGE = getTokenCreationFeeRangeSol();

const dictionary: TranslationDictionary = {
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
      `🟡 元数据可修改：建议锁定元数据 (+${formatSolAmount(PRICING_SOL.immutableMetadata)} SOL) 以获得 100/100 RugCheck 满分`,
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
    platformFeeLabel: "平台服务费 (8%)",
    netToYouLabel: "您实际拿回 (92%)",
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
    withdrawCtaLink: `撤出 SOL 流动性工具 (${formatSolAmount(PRICING_SOL.withdrawLiquiditySol)} SOL)`,
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
      createToken: `创建代币 (模块化 ${FEE_RANGE.minDisplay} – ${FEE_RANGE.maxFullSuiteDisplay})`,
      burnToken: `销毁代币 / LP (${formatSolAmount(PRICING_SOL.burnStandard)} SOL 服务费)`,
      airdrop: `批量空投 (${formatSolAmount(PRICING_SOL.massAirdropPerBatch)} SOL / 批次)`,
      manageAuthority: `撤销权限 (${formatSolAmount(PRICING_SOL.revokeAuthorityStandalone)} SOL 服务费)`,
      createLiquidityPool: "创建流动性池 (0.15 SOL 服务费)",
      removeLiquidity: `撤出 SOL 流动性 (${formatSolAmount(PRICING_SOL.withdrawLiquiditySol)} SOL 服务费)`,
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

dictionary.costs = dictionary.costsPage;

export default dictionary;
