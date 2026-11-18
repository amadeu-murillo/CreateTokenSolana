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
  | "/reclaim"
  | "/volume-bot"
  | "/vesting"
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
        "The #1 No Code Token Builder on Solana. Create SPL or Token-2022 tokens in under 60 seconds from 0.10 SOL with 100/100 RugCheck security, Vanity Mint Address, Jito Multi-Wallet Anti-Bubblemaps Bundler, Raydium CPMM Liquidity Pools, Volume Bot, and Token Vesting.",
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
        "Solana Volume Bot",
      ],
    },
    es: {
      title:
        "Creador de Tokens Solana — Crear Token SPL y Lanzar Memecoin en Solana Sin Código",
      description:
        "Crea tokens SPL y Token-2022 en Solana sin programar en menos de 60 segundos desde 0.10 SOL. seguridad RugCheck 100/100, Jito Multi-Wallet Anti-Bubblemaps, pools en Raydium CPMM, Volume Bot y Vesting.",
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
        "Создавайте токены SPL и Token-2022 в сети Solana без программирования за 60 секунд от 0.10 SOL. Защита RugCheck 100/100, ИИ-генератор бренда, пулы ликвидности Raydium CPMM, Volume Bot и блокировка токенов.",
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
        "排名第一的 Solana 无代码发币平台。仅需 0.10 SOL 起，60 秒内创建 SPL 或 Token-2022 代币，支持 AI 品牌生成、RugCheck 100/100 安全评分、Jito 多钱包防气泡图捆绑交易、Raydium CPMM 流动性池与市值交易量机器人。",
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
        "A plataforma nº 1 para criar Token SPL e Token-2022 na Solana sem programar em menos de 60 segundos a partir de 0.10 SOL. nota 100/100 no RugCheck, Vanity Mint, Jito Bundle Multi-Carteira, Pool Raydium CPMM, Volume Bot e Vesting.",
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
  "/reclaim": {
    en: {
      title: "Solana Rent Recovery Tool — Reclaim Locked SOL from Empty Token Accounts (Keep 92% Net)",
      description:
        "Scan your Solana wallet for zero-balance SPL and Token-2022 accounts and close up to 20 empty ATAs per transaction to recover ~0.00204 SOL per account. Keep 92% net (only 8% platform fee with 30% instant affiliate split).",
      keywords: [
        "reclaim solana rent",
        "close empty token accounts solana",
        "solana rent recovery tool",
        "claim locked sol from empty ata",
        "solana blink rent recovery",
      ],
    },
    es: {
      title: "Recuperar SOL Bloqueado en Solana — Cerrar Cuentas Vacías ATA (Recibe 92% Neto)",
      description:
        "Escanea tu billetera Solana para encontrar cuentas SPL y Token-2022 con saldo cero, cierra hasta 20 ATAs vacías por transacción y recupera ~0.00204 SOL por cuenta (92% neto para ti, 8% tarifa).",
      keywords: [
        "recuperar sol cuentas vacias",
        "cerrar cuentas ata solana",
        "reclamar alquiler solana",
      ],
    },
    ru: {
      title: "Возврат Аренды SOL в Solana — Закрытие Пустых Токен-Аккаунтов (92% Чистыми)",
      description:
        "Сканируйте свой кошелек Solana на наличие нулевых аккаунтов SPL и Token-2022, закрывайте до 20 пустых ATA за одну транзакцию и возвращайте ~0.00204 SOL за аккаунт (92% чистыми вам).",
      keywords: [
        "возврат sol за пустые аккаунты",
        "закрыть ata аккаунты solana",
        "вернуть аренду solana",
      ],
    },
    zh: {
      title: "Solana 账户租金回收工具 — 批量关闭空代币账户领回 SOL（用户实得 92%）",
      description:
        "自动扫描您的 Solana 钱包中的零余额 SPL 与 Token-2022 账户，单笔交易最多关闭 20 个空 ATA 账户，每个账户可回收约 0.00204 SOL（用户实得 92%，仅 8% 平台费）。",
      keywords: [
        "Solana 租金回收",
        "关闭 Solana 空账户",
        "领回锁定 SOL 租金",
      ],
    },
    "pt-BR": {
      title: "Recuperar SOL de Contas Vazias na Solana — SOL Rent Recovery (92% Líquido)",
      description:
        "Escaneie sua carteira Solana para encontrar contas SPL e Token-2022 zeradas, feche até 20 ATAs vazias por transação e recupere ~0.00204 SOL por conta (92% líquido na sua carteira e apenas 8% de taxa).",
      keywords: [
        "recuperar sol contas vazias",
        "fechar contas ata solana",
        "resgatar aluguel solana rent",
      ],
    },
  },
  "/volume-bot": {
    en: {
      title: "Solana Volume & Maker Booster Bot — Non-Custodial DexScreener Trending Bot",
      description:
        "Boost unique on-chain makers (100, 300, or 750 makers) and organic trading volume on DexScreener with our 100% non-custodial browser Volume Bot. Mandatory JSON key backup and automatic 100% SOL sweep back to your main wallet.",
      keywords: [
        "solana volume bot",
        "dexscreener maker booster solana",
        "non-custodial solana volume booster",
        "raydium jupiter volume bot",
        "solana trending bot",
      ],
    },
    es: {
      title: "Bot de Volumen y Makers en Solana — Impulso No Custodial para DexScreener",
      description:
        "Genera de 100 a 750 makers únicos on-chain y volumen orgánico en DexScreener con nuestro Volume Bot 100% no custodial en el navegador. Respaldo JSON de llaves y barrido automático de SOL a tu billetera principal.",
      keywords: [
        "bot de volumen solana",
        "aumentar makers dexscreener solana",
        "bot de trading solana no custodial",
      ],
    },
    ru: {
      title: "Бот Объема и Мейкеров Solana — Некастодиальный Бустер для Трендов DexScreener",
      description:
        "Увеличьте количество уникальных ончейн-мейкеров (100, 300 или 750) и органический объем торгов на DexScreener с помощью 100% некастодиального браузерного бота с автовозвратом всего SOL.",
      keywords: [
        "бот объема solana",
        "накрутка мейкеров dexscreener",
        "некастодиальный маркетмейкер solana",
      ],
    },
    zh: {
      title: "Solana 交易量与独立地址机器人 — 100% 非托管 DexScreener 热门助推器",
      description:
        "使用 100% 浏览器端非托管的 Solana 市值与 Maker 助推器生成 100、300 或 750 个链上独立交易地址与真实交易量。支持强制私钥 JSON 备份及一键归集全部剩余 SOL。",
      keywords: [
        "Solana 刷量机器人",
        "DexScreener 独立地址助推",
        "Solana 市值管理机器人",
      ],
    },
    "pt-BR": {
      title: "Bot de Volume & Makers na Solana — Impulsionador Não-Custodial para DexScreener",
      description:
        "Gere 100, 300 ou 750 makers únicos on-chain e volume orgânico no DexScreener com nosso Volume Bot 100% não-custodial no navegador. Backup obrigatório de chaves .JSON e Sweep automático de todo o SOL de volta para sua carteira.",
      keywords: [
        "bot de volume solana",
        "aumentar makers dexscreener",
        "volume booster solana nao custodial",
      ],
    },
  },
  "/vesting": {
    en: {
      title: "Solana Token Vesting & LP Lock Vault — Verified On-Chain Escrow & Certificate",
      description:
        "Lock SPL, Token-2022, or Raydium/Meteora LP tokens in a deterministic on-chain Escrow vault for 0.10 SOL. Recorded immutably via the SPL Memo Program with an exportable Verified On-Chain Token Lock PNG Certificate.",
      keywords: [
        "solana token vesting",
        "lock lp tokens raydium",
        "solana team token lock",
        "on-chain token lock certificate",
        "spl token escrow lock",
      ],
    },
    es: {
      title: "Bóveda de Vesting y Bloqueo de LP en Solana — Escrow Verificable On-Chain",
      description:
        "Bloquea tokens SPL, Token-2022 o LP de Raydium/Meteora hasta una fecha futura por 0.10 SOL con cuenta Escrow determinística, registro en SPL Memo Program y certificado PNG verificable.",
      keywords: [
        "bloquear tokens solana",
        "vesting tokens solana",
        "bloquear liquidez lp raydium",
      ],
    },
    ru: {
      title: "Вестинг Токенов и Блокировка LP в Solana — Верифицируемый Ончейн-Сейф",
      description:
        "Заблокируйте токены SPL, Token-2022 или LP-токены Raydium/Meteora до выбранной даты за 0.10 SOL через детерминированный Escrow-счет с записью в SPL Memo Program и PNG-сертификатом.",
      keywords: [
        "вестинг токенов solana",
        "заблокировать lp токены raydium",
        "ончейн лок токенов solana",
      ],
    },
    zh: {
      title: "Solana 代币锁仓与 LP 流动性锁定金库 — 链上可验证托管与 PNG 证书",
      description:
        "仅需 0.10 SOL 即可将 SPL、Token-2022 或 Raydium/Meteora LP 代币锁定在确定性链上托管账户中，通过 SPL Memo Program 记录不可篡改证明并导出链上锁仓 PNG 证书。",
      keywords: [
        "Solana 代币锁仓",
        "Raydium LP 锁池证明",
        "Solana 团队代币线性解锁",
      ],
    },
    "pt-BR": {
      title: "Cofre de Token Vesting & LP Lock na Solana — Escrow On-Chain Verificável",
      description:
        "Tranque tokens SPL, Token-2022 ou LP Tokens da Raydium/Meteora até uma data futura por 0.10 SOL em conta Escrow determinística com registro no SPL Memo Program e Certificado PNG Verificável.",
      keywords: [
        "trancar tokens solana",
        "token vesting solana",
        "trancar liquidez lp raydium",
        "certificado lock on-chain solana",
      ],
    },
  },
  "/add-liquidity": {
    en: {
      title: "Create Solana Liquidity Pool — Official Raydium CPMM CPI & Meteora Dynamic AMM",
      description:
        "Initialize an on-chain Solana Liquidity Pool via official Raydium CPMM CPI or Meteora Dynamic AMM for a flat 0.07 SOL fee. Includes automatic WSOL wrapping, Jito Multi-Wallet Anti-Bubblemaps bundler, and LP token minting.",
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
      title: "Criar Pool de Liquidez Solana — Raydium CPMM Oficial & Meteora Dynamic AMM",
      description:
        "Crie sua Pool de Liquidez na Solana via CPI oficial do Raydium CPMM ou Meteora Dynamic AMM por 0.07 SOL. Wrapping automático de WSOL, Jito Multi-Carteira Anti-Bubblemaps e retirada de liquidez em SOL.",
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
      title: "Burn Solana Tokens & LP Lock (Burn & Earn) + Empty ATA Rent Recovery (92% Net)",
      description:
        "Permanently burn Solana SPL, Token-2022, or LP tokens on-chain for 0.07 SOL, lock LP with Burn & Earn (0.10 SOL), download a verified Rug-Proof PNG Certificate, and reclaim 92% net SOL from empty ATAs.",
      keywords: [
        "burn solana tokens",
        "burn lp tokens solana",
        "lock raydium liquidity burn and earn",
        "reclaim sol empty token accounts",
        "solana rent recovery tool",
      ],
    },
    es: {
      title: "Quemar Tokens Solana y Liquidez LP + Recuperar SOL de Cuentas Vacías (92% Neto)",
      description:
        "Quema tokens SPL, Token-2022 o LP de forma permanente en Solana por 0.07 SOL, bloquea liquidez con Burn & Earn, descarga tu certificado PNG verificable y recupera el 92% neto de SOL por cuenta vacía.",
      keywords: [
        "quemar tokens solana",
        "quemar lp raydium",
        "recuperar sol cuentas vacias",
      ],
    },
    ru: {
      title: "Сжечь Токены Solana и LP (Burn & Earn) + Возврат SOL за Пустые Аккаунты (92%)",
      description:
        "Навсегда сжигайте токены SPL, Token-2022 и LP в сети Solana за 0.07 SOL, блокируйте ликвидность Burn & Earn, скачивайте PNG-сертификат и возвращайте 92% чистыми SOL за каждый пустой ATA.",
      keywords: [
        "сжечь токены solana",
        "сжечь lp токены",
        "возврат аренды solana ata",
      ],
    },
    zh: {
      title: "销毁 Solana 代币与 LP 锁池 (Burn & Earn) + 空账户租金回收（实得 92%）",
      description:
        "在链上永久销毁 Solana SPL、Token-2022 或 LP 代币（0.07 SOL），支持 Burn & Earn 锁池分红、生成防貔貅 PNG 证书，并从空代币账户回收 92% 净租金。",
      keywords: [
        "销毁 Solana 代币",
        "燃烧 LP 锁池",
        "Solana 租金回收",
      ],
    },
    "pt-BR": {
      title: "Queimar Tokens Solana & Trancar LP (Burn & Earn) + Recuperar SOL (92% Líquido)",
      description:
        "Queime tokens SPL, Token-2022 ou LP permanentemente na Solana por 0.07 SOL, tranque liquidez no modo Burn & Earn, baixe o Certificado PNG Rug-Proof e recupere 92% líquido de SOL por conta vazia.",
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
        "Distribute SPL and Token-2022 tokens to hundreds of Solana wallets in atomic batches (0.07 SOL/batch) with Address Lookup Table (ALT) v0 compression and on-chain holder snapshot import (+0.03 SOL).",
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
        "Envía tokens SPL y Token-2022 a cientos de billeteras Solana en lotes atômicos (0.07 SOL/lote) con creación automática de cuentas ATA e importación de holders on-chain.",
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
        "Distribua tokens SPL e Token-2022 para centenas de carteiras Solana em lotes atômicos (0.07 SOL/lote) com criação automática de ATAs, compressão ALT v0 e snapshot on-chain de holders (+0.03 SOL).",
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
        "Generate your custom Solana wallet referral link (?ref=WALLET) and receive 30% instant SOL commission atomically in the same transaction on every token mint, liquidity pool, volume bot, vesting, and Blink swap.",
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
        "Comparte tu enlace de referido con tu billetera Solana y recibe el 30% de comisión en SOL de forma atómica e instantánea en cada creación de token, pool de liquidez, volume bot, vesting y quema.",
      keywords: [
        "programa de afiliados solana",
        "ganar sol por referidos",
        "afiliados web3 cripto",
      ],
    },
    ru: {
      title: "Партнерская Программа Solana Web3 — 30% Мгновенной Комиссии в SOL Ончейн",
      description:
        "Поделитесь реферальной ссылкой со своим кошельком Solana и получайте 30% комиссии в SOL мгновенно и атомарно в каждой транзакции минта, создания пула, volume bot, вестинга и сжигания.",
      keywords: [
        "партнерская программа solana",
        "заработок sol на рефералах",
        "web3 партнерка",
      ],
    },
    zh: {
      title: "Solana Web3 推广返佣计划 — 链上实时秒结 30% SOL 佣金",
      description:
        "绑定您的 Solana 钱包生成专属推广链接，每笔发币、创建流动性池、市值机器人、锁仓与销毁交易均通过链上原子分账实时返还 30% SOL 佣金。",
      keywords: [
        "Solana 推广返佣",
        "Web3 联盟营销",
        "Solana 发币返利",
      ],
    },
    "pt-BR": {
      title: "Programa de Afiliados Web3 Solana — Ganhe 30% de Comissão Instantânea em SOL",
      description:
        "Gere seu link exclusivo com sua carteira Solana e receba 30% de comissão em SOL de forma 100% atômica e instantânea na mesma transação em cada criação de token, pool, volume bot, vesting, reclaim e Blink.",
      keywords: [
        "programa de afiliados solana",
        "ganhar sol indicando",
        "afiliados web3 on-chain",
      ],
    },
  },
  "/costs": {
    en: {
      title: "Transparent Solana Token & DeFi Fee Schedule — Modular Pricing From 0.005 SOL",
      description:
        "Complete on-chain cost breakdown for CreateTokenSolana: 0.10 SOL Base Mint, Jito Multi-Wallet (+0.30 SOL), Volume Bot (0.05–0.25 SOL), Vesting Lock (0.10 SOL), 8% Reclaim Fee, and 30%/70% Affiliate Split.",
      keywords: [
        "cost to create solana token",
        "solana liquidity pool cost",
        "spl token creation fee",
        "cheapest solana token creator",
      ],
    },
    es: {
      title: "Tabla Transparente de Costos y Tarifas en Solana — Precios Desde 0.005 SOL",
      description:
        "Consulta todas las tarifas on-chain de CreateTokenSolana: Mint Base 0.10 SOL, Jito Multi-Wallet, Volume Bot, Vesting Lock, Pools de Liquidez (0.07 SOL) y división 30%/70% de afiliados.",
      keywords: [
        "cuanto cuesta crear un token en solana",
        "precio pool de liquidez raydium",
        "tarifas createtokensolana",
      ],
    },
    ru: {
      title: "Прозрачная Таблица Комиссий Solana — Создание Токенов от 0.10 SOL",
      description:
        "Полный расчет стоимости операций в CreateTokenSolana: базовый минт 0.10 SOL, ИИ-студия, мультивалютный Jito бандл, бот объема, вестинг, пулы ликвидности (0.07 SOL) и 30% реферальных.",
      keywords: [
        "сколько стоит создать токен solana",
        "стоимость пула ликвидности raydium",
        "тарифы solana launchpad",
      ],
    },
    zh: {
      title: "Solana 透明费用明细表 — 模块化发币低至 0.10 SOL",
      description:
        "查看 CreateTokenSolana 完整链上费用表：基础发币 0.10 SOL、AI 品牌设计、Jito 多钱包防气泡图发射、市值机器人、代币锁仓、流动性池（0.07 SOL）以及 30%/70% 推广自动分账明细。",
      keywords: [
        "Solana 发币成本",
        "创建 Solana 代币多少钱",
        "Raydium 建池费用",
      ],
    },
    "pt-BR": {
      title: "Tabela Transparente de Custos e Taxas na Solana — Criação Modular a Partir de 0.10 SOL",
      description:
        "Confira a tabela completa de custos on-chain do CreateTokenSolana: Mint Base 0.10 SOL, AI Studio (+0.05 SOL), Jito Multi-Carteira (0.30 SOL), Volume Bot, Vesting Lock, Reclaim (8%) e split de 30% para afiliados.",
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
        "Step-by-step technical documentation on launching SPL & Token-2022 tokens, Jito Multi-Wallet Anti-Bubblemaps bundles, Raydium CPMM CPI pools, Solana Blinks, Volume Bot, and Token Vesting.",
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
        "Guía paso a paso para crear tokens SPL y Token-2022, subir metadatos a Arweave/Irys, inicializar pools en Raydium CPMM, configurar Solana Blinks, Volume Bot y obtener 100/100 en RugCheck.",
      keywords: [
        "como crear un token en solana paso a paso",
        "guia liquidez raydium solana",
        "documentacion token 2022",
      ],
    },
    ru: {
      title: "Документация по Созданию Токенов и Пулов Ликвидности Solana — Полное Руководство",
      description:
        "Пошаговое техническое руководство по выпуску токенов SPL и Token-2022, загрузке метаданных в Arweave/Irys, созданию пулов Raydium CPMM, настройке Solana Blinks, Volume Bot и вестинга.",
      keywords: [
        "как создать токен на solana инструкция",
        "руководство по ликвидности raydium",
        "документация token 2022",
      ],
    },
    zh: {
      title: "Solana 代币与流动性池技术文档 — Web3 创作者完整指南",
      description:
        "从零开始发行 SPL 与 Token-2022 代币、上传 Arweave/Irys 永久元数据、创建 Raydium CPMM 流动性池、配置 Solana Blinks、市值机器人及代币锁仓的完整教程。",
      keywords: [
        "Solana 发币教程",
        "Raydium 加池子教程",
        "Token-2022 开发文档",
      ],
    },
    "pt-BR": {
      title: "Documentação Técnica de Tokens e Liquidez na Solana — Guia Completo do Criador",
      description:
        "Guia passo a passo para criar tokens SPL e Token-2022, usar o Jito Multi-Carteira Anti-Bubblemaps, criar pools Raydium CPMM, Solana Blinks, Volume Bot, Vesting e atingir 100/100 no RugCheck.",
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
        lowPrice: "0.005",
        highPrice: "0.75",
        priceCurrency: "SOL",
        offerCount: 25,
        description:
          "Modular on-chain token creation starting at 0.10 SOL base mint fee, Jito Multi-Wallet Bundler, Raydium CPMM Liquidity Pools, Volume Bot, Token Vesting, and 30% instant on-chain affiliate split.",
      },
      featureList: [
        "No-code Solana SPL & Token-2022 Token Creator (Transfer Fee, Soulbound, Permanent Delegate)",
        "AI Agent Token Branding Studio (+0.05 SOL via Gemini API with <95 KiB WebP Logo)",
        "Jito Multi-Wallet Anti-Bubblemaps Launch Bundler (4–8 Wallets in Block Zero)",
        "Official Raydium CPMM CPI Liquidity Pool Builder",
        "Solana Actions & Blinks for In-Feed X/Twitter Trading & Rent Recovery",
        "Non-Custodial Volume & Maker Booster Bot (100, 300, 750 Makers)",
        "Verified On-Chain Token Vesting & LP Lock Vault with Memo Certificate",
        "SOL Rent Recovery Tool (Keep 92% Net / 8% Platform Fee)",
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
  ],
};
