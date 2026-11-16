import type { Metadata } from "next";

/**
 * Primary Production Domain configured in Vercel (with 308 redirects from
 * createtokensol.store and createtokensol.vercel.app -> www.createtokensol.store).
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://www.createtokensol.store";

export const SITE_NAME = "CreateTokenSolana";

export type SeoLocale = "en" | "es" | "ru" | "zh" | "pt-BR";

export interface LocalizedSeoEntry {
  title: string;
  description: string;
  keywords: string[];
}

export type RoutePath =
  | "/"
  | "/add-liquidity"
  | "/burn"
  | "/airdrop"
  | "/dashboard"
  | "/afiliates"
  | "/costs"
  | "/documentacao";

export const MULTILINGUAL_ROUTE_SEO: Record<
  RoutePath,
  Record<SeoLocale, LocalizedSeoEntry>
> = {
  "/": {
    en: {
      title:
        "Solana Token Creator — Create SPL Token & Launch Solana Memecoin | No Code Token Builder",
      description:
        "The #1 No Code Token Builder on Solana. Create SPL or Token-2022 tokens in under 60 seconds from 0.10 SOL with 100/100 RugCheck security, Vanity Mint Address, Jito Atomic Bundler, Arweave/Irys metadata, Raydium/Meteora Liquidity Pools, LP Burn, and Mass Airdrops.",
      keywords: [
        "Solana Token Creator",
        "Create SPL Token",
        "Launch Solana Memecoin",
        "No Code Token Builder",
        "Solana Token-2022 Generator",
        "Solana Tax Token Creator",
        "Vanity Mint Address Solana",
        "Jito Bundle Token Launch",
        "Create Raydium Liquidity Pool",
        "Meteora DAMM Pool Builder",
      ],
    },
    es: {
      title:
        "Creador de Tokens Solana — Crear Token SPL y Lanzar Memecoin en Solana Sin Código",
      description:
        "Crea tokens SPL y Token-2022 en Solana sin programar en menos de 60 segundos desde 0.10 SOL. Seguridad RugCheck 100/100, metadatos permanentes en Arweave/Irys, pools de liquidez en Raydium y Meteora, quema de LP y Airdrop masivo.",
      keywords: [
        "Creador de Tokens Solana",
        "Crear Token SPL",
        "Lanzar Memecoin Solana",
        "Crear Criptomoneda en Solana Sin Código",
        "Generador Token-2022 Solana",
        "Crear Pool de Liquidez Raydium",
      ],
    },
    ru: {
      title:
        "Создать Токен Solana — Генератор SPL и Token-2022 и Запуск Мемкоинов Без Кода",
      description:
        "Создавайте токены SPL и Token-2022 в сети Solana без программирования за 60 секунд от 0.10 SOL. Защита RugCheck 100/100, метаданные Arweave/Irys, пулы ликвидности Raydium и Meteora, сжигание LP и массовый аирдроп.",
      keywords: [
        "Создать токен Solana",
        "Генератор SPL токенов",
        "Запустить мемкоин Solana без кода",
        "Создать пул ликвидности Raydium",
        "Сжечь LP токены Solana",
      ],
    },
    zh: {
      title:
        "Solana 代币生成器 — 无代码创建 SPL 与 Token-2022 代币及发射 Memecoin",
      description:
        "排名第一的 Solana 无代码发币平台。仅需 0.10 SOL 起，60 秒内创建 SPL 或 Token-2022 代币，支持 RugCheck 100/100 安全评分、靓号合约地址、Jito 捆绑交易、Arweave 永久元数据、Raydium/Meteora 流动性池与批量空投。",
      keywords: [
        "Solana 一键发币",
        "Solana 代币生成器",
        "创建 SPL 代币",
        "无代码发行 Solana Memecoin",
        "Token-2022 税率代币",
        "Raydium 创建流动性池",
      ],
    },
    "pt-BR": {
      title:
        "Criador de Token Solana — Criar Token SPL, Token-2022 e Lançar Memecoin Sem Código",
      description:
        "A plataforma nº 1 para criar Token SPL e Token-2022 na Solana sem programar em menos de 60 segundos a partir de 0.10 SOL. Nota 100/100 no RugCheck, endereço Vanity Mint, Jito Bundle, metadados Arweave/Irys, Pool de Liquidez Raydium/Meteora, Queima de LP e Airdrop em massa.",
      keywords: [
        "Criador de Token Solana",
        "Criar Token SPL Solana",
        "Como criar memecoin na Solana",
        "Criar criptomoeda na Solana sem código",
        "Gerador Token-2022 Solana",
        "Criar Pool de Liquidez Raydium",
      ],
    },
  },
  "/add-liquidity": {
    en: {
      title: "Create Solana Liquidity Pool — Raydium CPMM & Meteora Dynamic AMM",
      description:
        "Initialize an on-chain Solana Liquidity Pool on Raydium CPMM or Meteora Dynamic AMM for a flat 0.07 SOL fee. Includes automatic WSOL wrapping, Jito sniper protection, Creator Swap Fees, and instant LP token minting.",
      keywords: [
        "create solana liquidity pool",
        "raydium cpmm pool creator",
        "meteora dynamic amm pool",
        "add liquidity solana token",
        "withdraw liquidity raydium solana",
      ],
    },
    es: {
      title: "Crear Pool de Liquidez en Solana — Raydium CPMM y Meteora Dynamic AMM",
      description:
        "Inicializa tu Pool de Liquidez en Solana con Raydium CPMM o Meteora Dynamic AMM por 0.07 SOL. Envoltura automática de WSOL, protección anti-bots con Jito y retiro de liquidez en SOL.",
      keywords: [
        "crear pool de liquidez solana",
        "agregar liquidez raydium",
        "pool meteora solana",
      ],
    },
    ru: {
      title: "Создать Пул Ликвидности Solana — Raydium CPMM и Meteora Dynamic AMM",
      description:
        "Запустите пул ликвидности в сети Solana на Raydium CPMM или Meteora DAMM за 0.07 SOL с автоматическим WSOL, защитой от снайперов Jito и выводом ликвидности.",
      keywords: [
        "создать пул ликвидности solana",
        "пул ликвидности raydium cpmm",
        "meteora damm solana",
      ],
    },
    zh: {
      title: "创建 Solana 流动性池 — Raydium CPMM 与 Meteora Dynamic AMM",
      description:
        "仅需 0.07 SOL 即可在 Raydium CPMM 或 Meteora Dynamic AMM 上创建 Solana 链上流动性池，支持自动包装 WSOL、Jito 防夹保护及一键撤池。",
      keywords: [
        "创建 Solana 流动性池",
        "Raydium 添加流动性",
        "Meteora 动态池创建",
      ],
    },
    "pt-BR": {
      title: "Criar Pool de Liquidez Solana — Raydium CPMM & Meteora Dynamic AMM",
      description:
        "Crie sua Pool de Liquidez na Solana via Raydium CPMM ou Meteora Dynamic AMM por 0.07 SOL. Wrapping automático de WSOL, proteção anti-sniper Jito e retirada de liquidez em SOL.",
      keywords: [
        "criar pool de liquidez solana",
        "adicionar liquidez raydium",
        "pool meteora solana",
        "retirar liquidez solana",
      ],
    },
  },
  "/burn": {
    en: {
      title: "Burn Solana Tokens & LP Lock (Burn & Earn) + Empty ATA Rent Recovery",
      description:
        "Permanently burn Solana SPL, Token-2022, or LP tokens on-chain for 0.07 SOL, lock LP with Burn & Earn (0.10 SOL), download a verified Rug-Proof PNG Certificate, and reclaim ~0.00204 SOL per empty ATA.",
      keywords: [
        "burn solana tokens",
        "burn lp tokens solana",
        "lock raydium liquidity burn and earn",
        "reclaim sol empty token accounts",
        "solana rent recovery tool",
      ],
    },
    es: {
      title: "Quemar Tokens Solana y Liquidez LP + Recuperar SOL de Cuentas Vacías",
      description:
        "Quema tokens SPL, Token-2022 o LP de forma permanente en Solana por 0.07 SOL, bloquea liquidez con Burn & Earn, descarga tu certificado PNG verificable y recupera ~0.00204 SOL por cuenta vacía.",
      keywords: [
        "quemar tokens solana",
        "quemar lp raydium",
        "recuperar sol cuentas vacias",
      ],
    },
    ru: {
      title: "Сжечь Токены Solana и LP (Burn & Earn) + Возврат SOL за Пустые Аккаунты",
      description:
        "Навсегда сжигайте токены SPL, Token-2022 и LP в сети Solana за 0.07 SOL, блокируйте ликвидность Burn & Earn, скачивайте PNG-сертификат и возвращайте ~0.00204 SOL за каждый пустой ATA.",
      keywords: [
        "сжечь токены solana",
        "сжечь lp токены",
        "возврат аренды solana ata",
      ],
    },
    zh: {
      title: "销毁 Solana 代币与 LP 锁池 (Burn & Earn) + 空账户租金回收",
      description:
        "在链上永久销毁 Solana SPL、Token-2022 或 LP 代币（0.07 SOL），支持 Burn & Earn 锁池分红、生成防貔貅 PNG 证书，并从空代币账户回收约 0.00204 SOL 租金。",
      keywords: [
        "销毁 Solana 代币",
        "燃烧 LP 锁池",
        "Solana 租金回收",
      ],
    },
    "pt-BR": {
      title: "Queimar Tokens Solana & Trancar LP (Burn & Earn) + Recuperar SOL de Contas",
      description:
        "Queime tokens SPL, Token-2022 ou LP permanentemente na Solana por 0.07 SOL, tranque liquidez no modo Burn & Earn, baixe o Certificado PNG Rug-Proof e recupere ~0.00204 SOL por conta vazia.",
      keywords: [
        "queimar tokens solana",
        "queimar lp raydium",
        "recuperar sol contas vazias",
        "certificado burn solana",
      ],
    },
  },
  "/airdrop": {
    en: {
      title: "Solana Mass Airdrop Tool — Batched SPL & Token-2022 Multisender + Holder Snapshot",
      description:
        "Distribute SPL and Token-2022 tokens to hundreds of Solana wallets in atomic batches (0.07 SOL/batch) with automatic ATA creation and on-chain token holder snapshot import (+0.03 SOL).",
      keywords: [
        "solana mass airdrop tool",
        "solana multisender",
        "batch send spl tokens",
        "solana holder snapshot airdrop",
      ],
    },
    es: {
      title: "Airdrop Masivo en Solana — Multisender SPL y Token-2022 + Snapshot de Holders",
      description:
        "Envía tokens SPL y Token-2022 a cientos de billeteras Solana en lotes atómicos (0.07 SOL/lote) con creación automática de cuentas ATA e importación de holders on-chain.",
      keywords: [
        "airdrop masivo solana",
        "multisender solana",
        "enviar tokens en lote solana",
      ],
    },
    ru: {
      title: "Массовый Аирдроп Solana — Мультисендер SPL и Token-2022 + Снапшот Холдеров",
      description:
        "Рассылайте токены SPL и Token-2022 на сотни кошельков Solana батчами (0.07 SOL за батч) с автосозданием ATA и ончейн-снапшотом держателей любого токена.",
      keywords: [
        "массовый аирдроп solana",
        "мультисендер solana",
        "снапшот холдеров solana",
      ],
    },
    zh: {
      title: "Solana 批量空投工具 — SPL 与 Token-2022 批量转账及持币地址快照",
      description:
        "以原子批次向数百个 Solana 钱包空投 SPL 和 Token-2022 代币（每批 0.07 SOL），支持自动创建 ATA 账户及链上持币地址快照导入（+0.03 SOL）。",
      keywords: [
        "Solana 批量空投",
        "Solana 批量转账工具",
        "Solana 持币快照",
      ],
    },
    "pt-BR": {
      title: "Airdrop em Massa na Solana — Multisender SPL & Token-2022 + Snapshot de Holders",
      description:
        "Distribua tokens SPL e Token-2022 para centenas de carteiras Solana em lotes atômicos (0.07 SOL/lote) com criação automática de ATAs e snapshot on-chain de holders (+0.03 SOL).",
      keywords: [
        "airdrop em massa solana",
        "multisender solana",
        "snapshot holders solana",
      ],
    },
  },
  "/dashboard": {
    en: {
      title: "Solana Token Security Dashboard — Revoke Mint & Freeze Authority + Claim Tax Fees",
      description:
        "Inspect and permanently revoke Mint Authority and Freeze Authority on Solana SPL & Token-2022 tokens (0.07 SOL) for a 100/100 RugCheck score, or claim withheld Token-2022 transfer fees (0.05 SOL).",
      keywords: [
        "revoke mint authority solana",
        "revoke freeze authority solana",
        "claim token 2022 transfer fees",
        "rugcheck 100 score solana",
      ],
    },
    es: {
      title: "Panel de Seguridad Solana — Revocar Mint y Freeze Authority + Reclamar Tasas",
      description:
        "Inspecciona y revoca permanentemente Mint y Freeze Authority en tokens SPL y Token-2022 (0.07 SOL) para lograr 100/100 en RugCheck, o reclama comisiones retenidas de Token-2022 (0.05 SOL).",
      keywords: [
        "revocar mint authority solana",
        "revocar freeze authority solana",
        "reclamar comisiones token 2022",
      ],
    },
    ru: {
      title: "Панель Безопасности Токенов Solana — Отзыв Права Минта и Заморозки + Сбор Налогов",
      description:
        "Проверяйте и навсегда отзывайте Mint Authority и Freeze Authority для токенов SPL и Token-2022 (0.07 SOL) для рейтинга 100/100 в RugCheck или собирайте комиссии Token-2022 (0.05 SOL).",
      keywords: [
        "отозвать mint authority solana",
        "отозвать freeze authority solana",
        "собрать налоги token 2022",
      ],
    },
    zh: {
      title: "Solana 代币安全面板 — 撤销铸造与冻结权限 + 提取 Token-2022 税费",
      description:
        "检查并永久撤销 Solana SPL 与 Token-2022 代币的铸造权限与冻结权限（0.07 SOL）以获得 RugCheck 100/100 评分，或提取 Token-2022 预扣转账税（0.05 SOL）。",
      keywords: [
        "撤销 Solana 铸造权限",
        "丢弃冻结权限 Solana",
        "提取 Token-2022 税费",
      ],
    },
    "pt-BR": {
      title: "Painel de Segurança Solana — Revogar Mint & Freeze Authority + Resgatar Taxas",
      description:
        "Inspecione e revogue permanentemente Mint Authority e Freeze Authority em tokens SPL e Token-2022 (0.07 SOL) para nota 100/100 no RugCheck, ou resgate taxas retidas de Token-2022 (0.05 SOL).",
      keywords: [
        "revogar mint authority solana",
        "revogar freeze authority solana",
        "resgatar taxas token 2022",
      ],
    },
  },
  "/afiliates": {
    en: {
      title: "Solana Web3 Affiliate Program — Earn 30% Instant On-Chain SOL Commissions",
      description:
        "Generate your custom Solana wallet referral link (?ref=WALLET) and receive 30% instant SOL commission atomically in the same transaction on every token mint, liquidity pool, burn, and airdrop.",
      keywords: [
        "solana affiliate program",
        "crypto launchpad referral 30 percent",
        "earn instant sol commissions",
        "web3 on-chain affiliate split",
      ],
    },
    es: {
      title: "Programa de Afiliados Web3 en Solana — Gana 30% de Comisión Instantánea en SOL",
      description:
        "Comparte tu enlace de referido con tu billetera Solana y recibe el 30% de comisión en SOL de forma atómica e instantánea en cada creación de token, pool de liquidez, quema y airdrop.",
      keywords: [
        "programa de afiliados solana",
        "ganar sol por referidos",
        "afiliados web3 cripto",
      ],
    },
    ru: {
      title: "Партнерская Программа Solana Web3 — 30% Мгновенной Комиссии в SOL Ончейн",
      description:
        "Поделитесь реферальной ссылкой со своим кошельком Solana и получайте 30% комиссии в SOL мгновенно и атомарно в каждой транзакции минта, создания пула, сжигания и аирдропа.",
      keywords: [
        "партнерская программа solana",
        "заработок sol на рефералах",
        "web3 партнерка",
      ],
    },
    zh: {
      title: "Solana Web3 推广返佣计划 — 链上实时秒结 30% SOL 佣金",
      description:
        "绑定您的 Solana 钱包生成专属推广链接，每笔发币、创建流动性池、销毁与批量空投交易均通过链上原子分账实时返还 30% SOL 佣金。",
      keywords: [
        "Solana 推广返佣",
        "Web3 联盟营销",
        "Solana 发币返利",
      ],
    },
    "pt-BR": {
      title: "Programa de Afiliados Web3 Solana — Ganhe 30% de Comissão Instantânea em SOL",
      description:
        "Gere seu link exclusivo com sua carteira Solana e receba 30% de comissão em SOL de forma 100% atômica e instantânea na mesma transação em cada criação de token, pool, burn e airdrop.",
      keywords: [
        "programa de afiliados solana",
        "ganhar sol indicando",
        "afiliados web3 on-chain",
      ],
    },
  },
  "/costs": {
    en: {
      title: "Transparent Solana Token & DeFi Fee Schedule — Modular Pricing From 0.10 SOL",
      description:
        "Complete on-chain cost breakdown for CreateTokenSolana: 0.10 SOL Base Mint,Authority Revocations, Token-2022 Extensions, Vanity Mint, Jito Bundle, 0.07 SOL Liquidity Pools, Burn & Airdrops, and 30%/70% Affiliate Split.",
      keywords: [
        "cost to create solana token",
        "solana liquidity pool cost",
        "spl token creation fee",
        "cheapest solana token creator",
      ],
    },
    es: {
      title: "Tabla Transparente de Costos y Tarifas en Solana — Precios Desde 0.10 SOL",
      description:
        "Consulta todas las tarifas on-chain de CreateTokenSolana: Mint Base 0.10 SOL, revocación de autoridades, extensiones Token-2022, Vanity Mint, Jito Bundle, Pools de Liquidez (0.07 SOL) y división 30%/70% de afiliados.",
      keywords: [
        "cuanto cuesta crear un token en solana",
        "precio pool de liquidez raydium",
        "tarifas createtokensolana",
      ],
    },
    ru: {
      title: "Прозрачная Таблица Комиссий Solana — Создание Токенов от 0.10 SOL",
      description:
        "Полный расчет стоимости операций в CreateTokenSolana: базовый минт 0.10 SOL, отзыв прав, расширения Token-2022, Vanity-адрес, Jito бандл, пулы ликвидности (0.07 SOL) и 30% реферальных.",
      keywords: [
        "сколько стоит создать токен solana",
        "стоимость пула ликвидности raydium",
        "тарифы solana launchpad",
      ],
    },
    zh: {
      title: "Solana 透明费用明细表 — 模块化发币低至 0.10 SOL",
      description:
        "查看 CreateTokenSolana 完整链上费用表：基础发币 0.10 SOL、权限丢弃、Token-2022 扩展、靓号定制、Jito 捆绑发射、流动性池（0.07 SOL）以及 30%/70% 推广自动分账明细。",
      keywords: [
        "Solana 发币成本",
        "创建 Solana 代币多少钱",
        "Raydium 建池费用",
      ],
    },
    "pt-BR": {
      title: "Tabela Transparente de Custos e Taxas na Solana — Criação Modular a Partir de 0.10 SOL",
      description:
        "Confira a tabela completa de custos on-chain do CreateTokenSolana: Mint Base 0.10 SOL, revogação de autoridades, extensões Token-2022, Vanity Mint, Jito Bundle, Pools de Liquidez (0.07 SOL) e split de 30% para afiliados.",
      keywords: [
        "quanto custa criar um token na solana",
        "custo pool de liquidez raydium",
        "taxas createtokensolana",
      ],
    },
  },
  "/documentacao": {
    en: {
      title: "Solana Token & Liquidity Pool Documentation — Complete Web3 Creator Guide",
      description:
        "Step-by-step technical documentation on launching SPL & Token-2022 tokens, uploading permanent Arweave/Irys metadata, creating Raydium CPMM & Meteora DAMM pools, locking LP tokens, and achieving 100/100 on RugCheck.",
      keywords: [
        "how to create a solana token",
        "how to add liquidity on raydium",
        "token 2022 transfer fee guide",
        "solana tokenomics documentation",
      ],
    },
    es: {
      title: "Documentación Técnica de Tokens y Liquidez en Solana — Guía Completa",
      description:
        "Guía paso a paso para crear tokens SPL y Token-2022, subir metadatos a Arweave/Irys, inicializar pools en Raydium CPMM y Meteora DAMM, quemar LP y obtener 100/100 en RugCheck.",
      keywords: [
        "como crear un token en solana paso a paso",
        "guia liquidez raydium solana",
        "documentacion token 2022",
      ],
    },
    ru: {
      title: "Документация по Созданию Токенов и Пулов Ликвидности Solana — Полное Руководство",
      description:
        "Пошаговое техническое руководство по выпуску токенов SPL и Token-2022, загрузке метаданных в Arweave/Irys, созданию пулов Raydium и Meteora, сжиганию LP и получению 100/100 в RugCheck.",
      keywords: [
        "как создать токен на solana инструкция",
        "руководство по ликвидности raydium",
        "документация token 2022",
      ],
    },
    zh: {
      title: "Solana 代币与流动性池技术文档 — Web3 创作者完整指南",
      description:
        "从零开始发行 SPL 与 Token-2022 代币、上传 Arweave/Irys 永久元数据、创建 Raydium CPMM 与 Meteora 流动性池、燃烧锁池及获得 RugCheck 100/100 满分的完整教程。",
      keywords: [
        "Solana 发币教程",
        "Raydium 加池子教程",
        "Token-2022 开发文档",
      ],
    },
    "pt-BR": {
      title: "Documentação Técnica de Tokens e Liquidez na Solana — Guia Completo do Criador",
      description:
        "Guia passo a passo para criar tokens SPL e Token-2022, hospedar metadados permanentes no Arweave/Irys, criar pools Raydium CPMM e Meteora DAMM, queimar LP e atingir 100/100 no RugCheck.",
      keywords: [
        "como criar token na solana passo a passo",
        "como criar pool de liquidez na raydium",
        "guia token 2022 solana",
      ],
    },
  },
};

export interface RouteSeoConfig {
  title: string;
  description: string;
  path: string;
  keywords: string[];
  noIndex?: boolean;
  canonicalOverride?: string;
}

export function getLanguageAlternates(canonicalUrl: string): Record<string, string> {
  return {
    en: `${canonicalUrl}?lang=en`,
    es: `${canonicalUrl}?lang=es`,
    ru: `${canonicalUrl}?lang=ru`,
    zh: `${canonicalUrl}?lang=zh`,
    "pt-BR": `${canonicalUrl}?lang=pt-BR`,
    "x-default": canonicalUrl,
  };
}

export function buildRouteMetadata(config: RouteSeoConfig): Metadata {
  const normalizedPath = (config.path === "/" ? "" : config.path) as string;
  const canonicalUrl = config.canonicalOverride
    ? `${SITE_URL}${config.canonicalOverride === "/" ? "" : config.canonicalOverride}`
    : `${SITE_URL}${normalizedPath}`;

  const routeKey = (config.canonicalOverride || config.path) as RoutePath;
  const localizedPack = MULTILINGUAL_ROUTE_SEO[routeKey];

  // Combine keywords across all 5 languages so Google indexes the page for international queries
  const mergedKeywords = Array.from(
    new Set([
      ...config.keywords,
      ...(localizedPack
        ? [
            ...localizedPack.en.keywords,
            ...localizedPack.es.keywords,
            ...localizedPack.ru.keywords,
            ...localizedPack.zh.keywords,
            ...localizedPack["pt-BR"].keywords,
          ]
        : []),
      "www.createtokensol.store",
      "createtokensol.store",
      "CreateTokenSolana",
    ])
  );

  const shouldIndex = !config.noIndex;

  return {
    title: localizedPack?.en.title || config.title,
    description: localizedPack?.en.description || config.description,
    keywords: mergedKeywords,
    alternates: {
      canonical: canonicalUrl,
      languages: getLanguageAlternates(canonicalUrl),
    },
    openGraph: {
      title: localizedPack?.en.title || config.title,
      description: localizedPack?.en.description || config.description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: "en_US",
      alternateLocale: ["es_ES", "ru_RU", "zh_CN", "pt_BR"],
      type: "website",
      images: [
        {
          url: `${SITE_URL}/sol.png`,
          secureUrl: `${SITE_URL}/sol.png`,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — Solana Token & Liquidity Pool Launchpad`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: localizedPack?.en.title || config.title,
      description: localizedPack?.en.description || config.description,
      images: [`${SITE_URL}/sol.png`],
    },
    robots: {
      index: shouldIndex,
      follow: true,
      googleBot: {
        index: shouldIndex,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export const JSON_LD_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "CreateTokenSolana — Solana SPL & Token-2022 Launchpad",
      alternateName: [
        "CreateTokenSolana",
        "Solana Token Creator",
        "Creador de Tokens Solana",
        "Criador de Token Solana",
        "Создать Токен Solana",
        "Solana 代币生成器",
      ],
      url: SITE_URL,
      sameAs: [
        "https://www.createtokensol.store",
        "https://createtokensol.store",
        "https://www.createtoken.sbs",
        "https://createtokensol.vercel.app",
      ],
      applicationCategory: "FinanceApplication",
      applicationSubCategory: "Web3 Token Creator & DeFi Launchpad",
      operatingSystem: "Web, Solana Blockchain (Mainnet-Beta & Devnet)",
      inLanguage: ["en", "es", "ru", "zh", "pt-BR"],
      isAccessibleForFree: true,
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "0.05",
        highPrice: "0.55",
        priceCurrency: "SOL",
        offerCount: 17,
        description:
          "Modular on-chain token creation starting at 0.10 SOL base mint fee, 0.07 SOL Liquidity Pools, Token Burn, and Mass Airdrops, with 30% instant on-chain affiliate split.",
      },
      featureList: [
        "No-code Solana SPL & Token-2022 Token Creator (Transfer Fee, Soulbound, Permanent Delegate)",
        "Custom Vanity Mint Address Generator (Web Worker 100% Client-Side)",
        "Jito Block Engine Atomic Launch Bundler (Mint + Pool + First Buy)",
        "Decentralized Arweave / Irys & CDN Token Logo Storage (<100 KiB Auto-Optimizer)",
        "On-Chain Raydium CPMM & Meteora Dynamic AMM Liquidity Pool Builder",
        "Permanent Token & LP Token Burner with Burn & Earn and Empty ATA Rent Recovery",
        "Batched Mass Airdrop Distribution Tool with On-Chain Holder Snapshot",
        "30% Atomic On-Chain SOL Affiliate Program",
      ],
      screenshot: `${SITE_URL}/sol.png`,
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/sol.png`,
      },
      contactPoint: {
        "@type": "ContactPoint",
        email: "createtokensol@gmail.com",
        contactType: "customer support",
        availableLanguage: ["English", "Spanish", "Russian", "Chinese", "Portuguese"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: ["en", "es", "ru", "zh", "pt-BR"],
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "How much does it cost to create a Solana token on CreateTokenSolana?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Base SPL and Token-2022 token creation starts at 0.10 SOL, with optional modular add-ons for Revoking Freeze Authority (+0.10 SOL), Revoking Mint Authority (+0.10 SOL), Immutable Metadata (+0.05 SOL), Vanity Mint Address (+0.05 SOL for 3-4 chars, free for 1-2 chars), and Liquidity Pool creation (0.07 SOL).",
          },
        },
        {
          "@type": "Question",
          name: "Quanto custa criar um token na Solana pelo CreateTokenSolana?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "O Mint Base de um token SPL ou Token-2022 custa a partir de 0.10 SOL, com opções modulares para revogar Freeze/Mint Authority (+0.10 SOL cada), metadados imutáveis no Arweave/Irys (+0.05 SOL), endereço personalizado Vanity Mint e criação de Pool de Liquidez na Raydium ou Meteora (0.07 SOL).",
          },
        },
        {
          "@type": "Question",
          name: "Do I retain 100% ownership and LP tokens when creating a token or liquidity pool?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. CreateTokenSolana is 100% non-custodial. Every transaction is verified against our client-side Solana program whitelist and signed directly inside your own Phantom or Solflare wallet.",
          },
        },
      ],
    },
  ],
};
