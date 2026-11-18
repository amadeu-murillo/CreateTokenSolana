import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

/**
 * Official Developer Fee Destination Wallet (70% split when affiliate is active, 100% otherwise).
 */
export const OFFICIAL_DEV_WALLET_STRING = "CP6teSg2LUxQsSBBtwZ9xjG2aZjjznhfCvGED9LNgjrJ";
export const OFFICIAL_DEV_WALLET_PUBKEY = new PublicKey(OFFICIAL_DEV_WALLET_STRING);

/**
 * Atomic On-Chain Affiliate Split Ratios (via SystemProgram.transfer in the same transaction).
 */
export const AFFILIATE_COMMISSION_RATE = 0.30; // 30% to Affiliate
export const DEV_AFFILIATE_SHARE_RATE = 0.70; // 70% to Dev Wallet

/**
 * Centralized Reclaim (Rent Recovery) fee rate: 8% platform fee, 92% net returned to user.
 */
export const RECLAIM_FEE_RATE = 0.08;
export const RECLAIM_NET_USER_RATE = Number((1 - RECLAIM_FEE_RATE).toFixed(2));

/**
 * Centralized Production Pricing Constants (in SOL).
 * Single source of truth for Home (/), CostSummary.tsx, /costs, /documentacao, i18n, and API routes.
 */
export const PRICING_SOL = {
  // Token Creation Modular Fees (/)
  baseMint: 0.10,
  revokeFreeze: 0.10,
  revokeMint: 0.10,
  immutableMetadata: 0.05,
  customCreator: 0.05,
  transferFeeExt: 0.15,
  soulboundExt: 0.10,
  permanentDelegateExt: 0.10,
  vanityShort1To2Chars: 0.00,
  vanityCustom3To4Chars: 0.05,

  // Jito Atomic Bundle (/ and /add-liquidity)
  jitoAtomicBundle: 0.20,
  jitoMultiWalletBundle: 0.30,
  defaultJitoTipSol: 0.002,

  // Liquidity Pool Operations (/add-liquidity)
  createLiquidityPool: 0.07,
  raydiumProtocolCreatePoolFeeSol: 0.15,
  estimatedLpPoolRentSol: 0.025,
  withdrawLiquiditySol: 0.05,

  // Burn & Rent Recovery Operations (/burn & /reclaim)
  burnStandard: 0.07,
  burnAndEarnLockLp: 0.10,
  estimatedAtaRentReclaimSol: 0.00203928,
  reclaimSolPlatformFeeRate: RECLAIM_FEE_RATE,

  // Volume & Maker Booster Bot (/volume-bot)
  volumeBotStarter100: 0.05,
  volumeBotGrowth300: 0.12,
  volumeBotTrending750: 0.25,

  // Token Vesting & LP Lock (/vesting)
  tokenVestingLock: 0.10,

  // Solana Actions & Blinks (/api/actions/token/[mint])
  blinkSwapServiceFeeSol: 0.005,

  // Mass Airdrop & Snapshot (/airdrop)
  massAirdropPerBatch: 0.07,
  holdersSnapshotAddon: 0.03,

  // Authority & Token-2022 Tax Dashboard (/dashboard)
  revokeAuthorityStandalone: 0.07,
  claimWithheldTaxPerBatch: 0.05,
} as const;

/**
 * Formats a SOL amount without rounding small fees like 0.005 SOL into "0.01".
 */
export function formatSolAmount(sol: number, minDecimals = 2, maxDecimals = 4): string {
  if (!Number.isFinite(sol)) return "0.00";
  const fixedMax = sol.toFixed(maxDecimals);
  const trimmed = fixedMax.replace(/0+$/, "").replace(/\.$/, "");
  const [, frac = ""] = trimmed.split(".");
  if (frac.length < minDecimals) {
    return sol.toFixed(minDecimals);
  }
  return trimmed;
}

export function computeSplit(feeSol: number): {
  affiliateSol: number;
  devWalletSol: number;
  affiliateLamports: number;
  devWalletLamports: number;
  totalLamports: number;
} {
  const safeFeeSol = Math.max(0, Number(feeSol) || 0);
  const totalLamports = Math.round(safeFeeSol * LAMPORTS_PER_SOL);
  const affiliateLamports = Math.round(totalLamports * AFFILIATE_COMMISSION_RATE);
  const devWalletLamports = totalLamports - affiliateLamports;
  const affiliateSol = Number((affiliateLamports / LAMPORTS_PER_SOL).toFixed(6));
  const devWalletSol = Number((devWalletLamports / LAMPORTS_PER_SOL).toFixed(6));
  return {
    affiliateSol,
    devWalletSol,
    affiliateLamports,
    devWalletLamports,
    totalLamports,
  };
}

/**
 * Computes percentage split for commission-rate-based operations (such as Reclaim SOL 8% fee),
 * avoiding the bug of treating an 8% rate (0.08) as 0.08 SOL.
 */
export function computeRateSplitPercent(rate: number = RECLAIM_FEE_RATE): {
  totalRatePercent: number;
  netUserRatePercent: number;
  affiliateRatePercent: number;
  devWalletRatePercent: number;
} {
  const totalRatePercent = Number((rate * 100).toFixed(2));
  const netUserRatePercent = Number(((1 - rate) * 100).toFixed(2));
  const affiliateRatePercent = Number((totalRatePercent * AFFILIATE_COMMISSION_RATE).toFixed(2));
  const devWalletRatePercent = Number((totalRatePercent - affiliateRatePercent).toFixed(2));
  return {
    totalRatePercent,
    netUserRatePercent,
    affiliateRatePercent,
    devWalletRatePercent,
  };
}

export interface ModularPricingOptions {
  revokeFreeze: boolean;
  revokeMint: boolean;
  immutableMetadata: boolean;
  customCreatorInfo: boolean;
  hasTransferFeeExtension: boolean;
  hasSoulboundExtension?: boolean;
  hasPermanentDelegateExtension?: boolean;
  vanityCharLength?: number;
  hasJitoBundle?: boolean;
  isMultiWalletBundle?: boolean;
}

export interface ModularPricingBreakdownItem {
  key: string;
  label: string;
  sol: number;
  active: boolean;
}

export function calculateModularTokenCreationFee(
  options: ModularPricingOptions
): {
  totalSol: number;
  totalLamports: number;
  affiliateSol: number;
  devWalletSol: number;
  affiliateLamports: number;
  devWalletLamports: number;
  items: ModularPricingBreakdownItem[];
} {
  const vanityLength = options.vanityCharLength ?? 0;
  const isPaidVanity = vanityLength >= 3;
  const isJitoMultiWallet = Boolean(options.hasJitoBundle && options.isMultiWalletBundle);
  const isJitoSingleWallet = Boolean(options.hasJitoBundle && !options.isMultiWalletBundle);

  const items: ModularPricingBreakdownItem[] = [
    {
      key: "base",
      label: "Taxa Base de Criação (Token Mint)",
      sol: PRICING_SOL.baseMint,
      active: true,
    },
    {
      key: "revokeFreeze",
      label: "Revogar Freeze Authority (Pool Ready)",
      sol: PRICING_SOL.revokeFreeze,
      active: Boolean(options.revokeFreeze),
    },
    {
      key: "revokeMint",
      label: "Revogar Mint Authority (Supply Fixo)",
      sol: PRICING_SOL.revokeMint,
      active: Boolean(options.revokeMint),
    },
    {
      key: "immutable",
      label: "Metadados Imutáveis (Immutable)",
      sol: PRICING_SOL.immutableMetadata,
      active: Boolean(options.immutableMetadata),
    },
    {
      key: "customCreator",
      label: "Customizar Creator Info (Metadados)",
      sol: PRICING_SOL.customCreator,
      active: Boolean(options.customCreatorInfo),
    },
    {
      key: "transferFeeExt",
      label: "Extensão Tax Token / Transfer Fee (Token-2022)",
      sol: PRICING_SOL.transferFeeExt,
      active: Boolean(options.hasTransferFeeExtension),
    },
    {
      key: "soulboundExt",
      label: "Extensão Soulbound / Non-Transferable (Token-2022)",
      sol: PRICING_SOL.soulboundExt,
      active: Boolean(options.hasSoulboundExtension),
    },
    {
      key: "permanentDelegateExt",
      label: "Extensão Permanent Delegate (Token-2022)",
      sol: PRICING_SOL.permanentDelegateExt,
      active: Boolean(options.hasPermanentDelegateExtension),
    },
    {
      key: "vanityMint",
      label: "Vanity Mint Address (3–4 caracteres)",
      sol: PRICING_SOL.vanityCustom3To4Chars,
      active: isPaidVanity,
    },
    {
      key: "jitoBundle",
      label: "Jito Atomic Bundle (Mint + Pool + 1ª Compra)",
      sol: PRICING_SOL.jitoAtomicBundle,
      active: isJitoSingleWallet,
    },
    {
      key: "jitoMultiWalletBundle",
      label: "Jito Atomic Bundle Multi-Carteira (Anti-Bubblemaps 4–8 Carteiras)",
      sol: PRICING_SOL.jitoMultiWalletBundle,
      active: isJitoMultiWallet,
    },
  ];

  const rawTotalSol = items
    .filter((item) => item.active)
    .reduce((sum, item) => sum + item.sol, 0);

  const totalSol = Number(rawTotalSol.toFixed(4));
  const { affiliateSol, devWalletSol, affiliateLamports, devWalletLamports, totalLamports } =
    computeSplit(totalSol);

  return {
    totalSol,
    totalLamports,
    affiliateSol,
    devWalletSol,
    affiliateLamports,
    devWalletLamports,
    items,
  };
}

export const DEFAULT_MODULAR_PRICING_OPTIONS: ModularPricingOptions = {
  revokeFreeze: true,
  revokeMint: true,
  immutableMetadata: true,
  customCreatorInfo: false,
  hasTransferFeeExtension: false,
  hasSoulboundExtension: false,
  hasPermanentDelegateExtension: false,
  vanityCharLength: 0,
  hasJitoBundle: false,
  isMultiWalletBundle: false,
};

/**
 * Dynamically calculated default token creation fee (baseMint + revokeFreeze + revokeMint + immutableMetadata = 0.35 SOL).
 */
export const DEFAULT_CREATE_TOKEN_FEE_SOL = calculateModularTokenCreationFee(
  DEFAULT_MODULAR_PRICING_OPTIONS
).totalSol;

/**
 * Dynamically computes the minimum and maximum possible modular token creation fees in SOL.
 */
export function getTokenCreationFeeRangeSol(): {
  minSol: number;
  recommendedSol: number;
  maxStandardSol: number;
  maxFullSuiteSol: number;
  minDisplay: string;
  maxStandardDisplay: string;
  maxFullSuiteDisplay: string;
} {
  const minCalc = calculateModularTokenCreationFee({
    revokeFreeze: false,
    revokeMint: false,
    immutableMetadata: false,
    customCreatorInfo: false,
    hasTransferFeeExtension: false,
  });

  const maxStandardCalc = calculateModularTokenCreationFee({
    revokeFreeze: true,
    revokeMint: true,
    immutableMetadata: true,
    customCreatorInfo: true,
    hasTransferFeeExtension: true,
  });

  const maxFullSuiteCalc = calculateModularTokenCreationFee({
    revokeFreeze: true,
    revokeMint: true,
    immutableMetadata: true,
    customCreatorInfo: true,
    hasTransferFeeExtension: true,
    hasSoulboundExtension: true,
    hasPermanentDelegateExtension: true,
    vanityCharLength: 4,
    hasJitoBundle: true,
    isMultiWalletBundle: true,
  });

  return {
    minSol: minCalc.totalSol,
    recommendedSol: DEFAULT_CREATE_TOKEN_FEE_SOL,
    maxStandardSol: maxStandardCalc.totalSol,
    maxFullSuiteSol: maxFullSuiteCalc.totalSol,
    minDisplay: `${formatSolAmount(minCalc.totalSol)} SOL`,
    maxStandardDisplay: `${formatSolAmount(maxStandardCalc.totalSol)} SOL`,
    maxFullSuiteDisplay: `${formatSolAmount(maxFullSuiteCalc.totalSol)} SOL`,
  };
}

/**
 * Strict Operation union and required fee map (no optional keys, no fallback constants).
 */
export type Operation =
  | "createToken"
  | "burnToken"
  | "burnAndEarn"
  | "reclaimSol"
  | "airdrop"
  | "manageAuthority"
  | "claimWithheldTax"
  | "createLiquidityPool"
  | "removeLiquidity"
  | "volumeBotStarter"
  | "volumeBotGrowth"
  | "volumeBotTrending"
  | "tokenVestingLock"
  | "blinkSwap";

export const OPERATION_SERVICE_FEES_SOL: Record<Operation, number> = {
  createToken: DEFAULT_CREATE_TOKEN_FEE_SOL,
  burnToken: PRICING_SOL.burnStandard,
  burnAndEarn: PRICING_SOL.burnAndEarnLockLp,
  reclaimSol: 0, // Percentage-based (8% of reclaimed rent), zero upfront SOL fee
  airdrop: PRICING_SOL.massAirdropPerBatch,
  manageAuthority: PRICING_SOL.revokeAuthorityStandalone,
  claimWithheldTax: PRICING_SOL.claimWithheldTaxPerBatch,
  createLiquidityPool: PRICING_SOL.createLiquidityPool,
  removeLiquidity: PRICING_SOL.withdrawLiquiditySol,
  volumeBotStarter: PRICING_SOL.volumeBotStarter100,
  volumeBotGrowth: PRICING_SOL.volumeBotGrowth300,
  volumeBotTrending: PRICING_SOL.volumeBotTrending750,
  tokenVestingLock: PRICING_SOL.tokenVestingLock,
  blinkSwap: PRICING_SOL.blinkSwapServiceFeeSol,
};

export interface PricingScheduleItem {
  id: string;
  route: string;
  feeSol: number;
  feeDisplay: string;
  feeDisplayPt?: string;
  isPercentageRate?: boolean;
  affiliateSol: number;
  devWalletSol: number;
  affiliateDisplayPt?: string;
  affiliateDisplayEn?: string;
  devWalletDisplayPt?: string;
  devWalletDisplayEn?: string;
  nameKey: string;
  defaultNamePt: string;
  defaultNameEn: string;
  badge?: string;
}

const reclaimRateSplit = computeRateSplitPercent(PRICING_SOL.reclaimSolPlatformFeeRate);

/**
 * Full verified pricing and 30%/70% commission table for /costs and documentation.
 */
export const PRICING_SCHEDULE_TABLE: ReadonlyArray<PricingScheduleItem> = [
  {
    id: "baseMint",
    route: "/",
    feeSol: PRICING_SOL.baseMint,
    feeDisplay: `${formatSolAmount(PRICING_SOL.baseMint)} SOL`,
    ...computeSplit(PRICING_SOL.baseMint),
    nameKey: "baseMint",
    defaultNamePt: "Mint Base (SPL ou Token-2022)",
    defaultNameEn: "Base Mint (SPL or Token-2022)",
    badge: "Core",
  },
  {
    id: "revokeFreeze",
    route: "/",
    feeSol: PRICING_SOL.revokeFreeze,
    feeDisplay: `+${formatSolAmount(PRICING_SOL.revokeFreeze)} SOL`,
    ...computeSplit(PRICING_SOL.revokeFreeze),
    nameKey: "revokeFreeze",
    defaultNamePt: "Revogar Freeze Authority",
    defaultNameEn: "Revoke Freeze Authority",
    badge: "+50 RugCheck",
  },
  {
    id: "revokeMint",
    route: "/",
    feeSol: PRICING_SOL.revokeMint,
    feeDisplay: `+${formatSolAmount(PRICING_SOL.revokeMint)} SOL`,
    ...computeSplit(PRICING_SOL.revokeMint),
    nameKey: "revokeMint",
    defaultNamePt: "Revogar Mint Authority",
    defaultNameEn: "Revoke Mint Authority",
    badge: "+35 RugCheck",
  },
  {
    id: "immutableMetadata",
    route: "/",
    feeSol: PRICING_SOL.immutableMetadata,
    feeDisplay: `+${formatSolAmount(PRICING_SOL.immutableMetadata)} SOL`,
    ...computeSplit(PRICING_SOL.immutableMetadata),
    nameKey: "immutableMetadata",
    defaultNamePt: "Metadados Imutáveis",
    defaultNameEn: "Immutable Metadata",
    badge: "+15 RugCheck",
  },
  {
    id: "customCreator",
    route: "/",
    feeSol: PRICING_SOL.customCreator,
    feeDisplay: `+${formatSolAmount(PRICING_SOL.customCreator)} SOL`,
    ...computeSplit(PRICING_SOL.customCreator),
    nameKey: "customCreator",
    defaultNamePt: "Customizar Creator Info",
    defaultNameEn: "Customize Creator Info",
    badge: "Optional",
  },
  {
    id: "transferFeeExt",
    route: "/",
    feeSol: PRICING_SOL.transferFeeExt,
    feeDisplay: `+${formatSolAmount(PRICING_SOL.transferFeeExt)} SOL`,
    ...computeSplit(PRICING_SOL.transferFeeExt),
    nameKey: "transferFeeExt",
    defaultNamePt: "Extensão Tax Token (Transfer Fee)",
    defaultNameEn: "Tax Token Extension (Transfer Fee)",
    badge: "Token-2022",
  },
  {
    id: "soulboundOrDelegateExt",
    route: "/",
    feeSol: PRICING_SOL.soulboundExt,
    feeDisplay: `+${formatSolAmount(PRICING_SOL.soulboundExt)} SOL`,
    ...computeSplit(PRICING_SOL.soulboundExt),
    nameKey: "soulboundOrDelegateExt",
    defaultNamePt: "Extensão Soulbound / Permanent Delegate",
    defaultNameEn: "Soulbound / Permanent Delegate Extension",
    badge: "Token-2022",
  },
  {
    id: "vanityMint",
    route: "/",
    feeSol: PRICING_SOL.vanityCustom3To4Chars,
    feeDisplay: `${formatSolAmount(PRICING_SOL.vanityShort1To2Chars)} / ${formatSolAmount(PRICING_SOL.vanityCustom3To4Chars)} SOL`,
    ...computeSplit(PRICING_SOL.vanityCustom3To4Chars),
    nameKey: "vanityMint",
    defaultNamePt: `Vanity Mint Address (1–2 chars Grátis / 3–4 chars +${formatSolAmount(PRICING_SOL.vanityCustom3To4Chars)} SOL)`,
    defaultNameEn: `Vanity Mint Address (1–2 chars Free / 3–4 chars +${formatSolAmount(PRICING_SOL.vanityCustom3To4Chars)} SOL)`,
    badge: "Web Worker",
  },
  {
    id: "jitoAtomicBundle",
    route: "/ & /add-liquidity",
    feeSol: PRICING_SOL.jitoAtomicBundle,
    feeDisplay: `+${formatSolAmount(PRICING_SOL.jitoAtomicBundle)} SOL`,
    ...computeSplit(PRICING_SOL.jitoAtomicBundle),
    nameKey: "jitoAtomicBundle",
    defaultNamePt: "Jito Atomic Bundle (Mint + Pool + 1ª Compra Anti-Sniper)",
    defaultNameEn: "Jito Atomic Bundle (Mint + Pool + Anti-Sniper First Buy)",
    badge: "Block 0 MEV",
  },
  {
    id: "jitoMultiWalletBundle",
    route: "/ & /add-liquidity",
    feeSol: PRICING_SOL.jitoMultiWalletBundle,
    feeDisplay: `${formatSolAmount(PRICING_SOL.jitoMultiWalletBundle)} SOL`,
    ...computeSplit(PRICING_SOL.jitoMultiWalletBundle),
    nameKey: "jitoMultiWalletBundle",
    defaultNamePt: "Jito Atomic Bundle Multi-Carteira (Distribuição Anti-Bubblemaps em 4 a 8 carteiras no Bloco Zero)",
    defaultNameEn: "Jito Multi-Wallet Atomic Bundle (Anti-Bubblemaps 4–8 Wallets Block-Zero Distribution)",
    badge: "Anti-Bubblemaps",
  },
  {
    id: "createLiquidityPool",
    route: "/add-liquidity",
    feeSol: PRICING_SOL.createLiquidityPool,
    feeDisplay: `${formatSolAmount(PRICING_SOL.createLiquidityPool)} SOL`,
    ...computeSplit(PRICING_SOL.createLiquidityPool),
    nameKey: "createLiquidityPool",
    defaultNamePt: "Criar Pool de Liquidez (Raydium CPMM)",
    defaultNameEn: "Create Liquidity Pool (Raydium CPMM)",
    badge: "Raydium CPMM",
  },
  {
    id: "withdrawLiquiditySol",
    route: "/add-liquidity",
    feeSol: PRICING_SOL.withdrawLiquiditySol,
    feeDisplay: `${formatSolAmount(PRICING_SOL.withdrawLiquiditySol)} SOL`,
    ...computeSplit(PRICING_SOL.withdrawLiquiditySol),
    nameKey: "withdrawLiquiditySol",
    defaultNamePt: "Retirar Liquidez (SOL / USDC)",
    defaultNameEn: "Withdraw Liquidity (SOL / USDC)",
  },
  {
    id: "reclaimSolPlatformFeeRate",
    route: "/reclaim & /burn",
    feeSol: 0,
    isPercentageRate: true,
    feeDisplay: `${reclaimRateSplit.totalRatePercent}% (${reclaimRateSplit.netUserRatePercent}% Net)`,
    feeDisplayPt: `${reclaimRateSplit.totalRatePercent}% (${reclaimRateSplit.netUserRatePercent}% Líquido)`,
    affiliateSol: 0,
    devWalletSol: 0,
    affiliateDisplayPt: `30% da taxa (${reclaimRateSplit.affiliateRatePercent}% do rent)`,
    affiliateDisplayEn: `30% of fee (${reclaimRateSplit.affiliateRatePercent}% of rent)`,
    devWalletDisplayPt: `70% da taxa (${reclaimRateSplit.devWalletRatePercent}% do rent)`,
    devWalletDisplayEn: `70% of fee (${reclaimRateSplit.devWalletRatePercent}% of rent)`,
    nameKey: "reclaimSolPlatformFeeRate",
    defaultNamePt: `SOL Rent Recovery — Fechamento de ATAs Vazias (${reclaimRateSplit.totalRatePercent}% Taxa / ${reclaimRateSplit.netUserRatePercent}% Líquido ao Usuário)`,
    defaultNameEn: `SOL Rent Recovery — Close Empty ATAs (${reclaimRateSplit.totalRatePercent}% Platform Fee / ${reclaimRateSplit.netUserRatePercent}% Net to User)`,
    badge: "92% Net",
  },
  {
    id: "burnAndEarnLockLp",
    route: "/burn",
    feeSol: PRICING_SOL.burnAndEarnLockLp,
    feeDisplay: `${formatSolAmount(PRICING_SOL.burnAndEarnLockLp)} SOL`,
    ...computeSplit(PRICING_SOL.burnAndEarnLockLp),
    nameKey: "burnAndEarnLockLp",
    defaultNamePt: "Burn & Earn (Trancar LP + Resgatar Taxas)",
    defaultNameEn: "Burn & Earn (Lock LP + Claim Fees)",
    badge: "DexScreener Lock",
  },
  {
    id: "burnStandard",
    route: "/burn",
    feeSol: PRICING_SOL.burnStandard,
    feeDisplay: `${formatSolAmount(PRICING_SOL.burnStandard)} SOL`,
    ...computeSplit(PRICING_SOL.burnStandard),
    nameKey: "burnStandard",
    defaultNamePt: "Queima Padrão + Certificado PNG (~0.00204 SOL restituídos/ATA)",
    defaultNameEn: "Standard Burn + PNG Certificate (~0.00204 SOL rent reclaimed/ATA)",
  },
  {
    id: "volumeBotStarter100",
    route: "/volume-bot",
    feeSol: PRICING_SOL.volumeBotStarter100,
    feeDisplay: `${formatSolAmount(PRICING_SOL.volumeBotStarter100)} SOL`,
    ...computeSplit(PRICING_SOL.volumeBotStarter100),
    nameKey: "volumeBotStarter100",
    defaultNamePt: "Volume & Maker Booster — Pacote 100 Makers",
    defaultNameEn: "Volume & Maker Booster — 100 Makers Starter Pack",
    badge: "100 Makers",
  },
  {
    id: "volumeBotGrowth300",
    route: "/volume-bot",
    feeSol: PRICING_SOL.volumeBotGrowth300,
    feeDisplay: `${formatSolAmount(PRICING_SOL.volumeBotGrowth300)} SOL`,
    ...computeSplit(PRICING_SOL.volumeBotGrowth300),
    nameKey: "volumeBotGrowth300",
    defaultNamePt: "Volume & Maker Booster — Pacote 300 Makers",
    defaultNameEn: "Volume & Maker Booster — 300 Makers Growth Pack",
    badge: "300 Makers",
  },
  {
    id: "volumeBotTrending750",
    route: "/volume-bot",
    feeSol: PRICING_SOL.volumeBotTrending750,
    feeDisplay: `${formatSolAmount(PRICING_SOL.volumeBotTrending750)} SOL`,
    ...computeSplit(PRICING_SOL.volumeBotTrending750),
    nameKey: "volumeBotTrending750",
    defaultNamePt: "Volume & Maker Booster — Pacote 750 Makers (DexScreener Trending)",
    defaultNameEn: "Volume & Maker Booster — 750 Makers Trending Pack (DexScreener)",
    badge: "Trending 750",
  },
  {
    id: "tokenVestingLock",
    route: "/vesting",
    feeSol: PRICING_SOL.tokenVestingLock,
    feeDisplay: `${formatSolAmount(PRICING_SOL.tokenVestingLock)} SOL`,
    ...computeSplit(PRICING_SOL.tokenVestingLock),
    nameKey: "tokenVestingLock",
    defaultNamePt: "Contrato de Token Vesting / Team Lock Verificável On-Chain",
    defaultNameEn: "Verified On-Chain Token Vesting / Team & LP Lock Vault",
    badge: "On-Chain Lock",
  },
  {
    id: "blinkSwapServiceFeeSol",
    route: "/api/actions/token/[mint]",
    feeSol: PRICING_SOL.blinkSwapServiceFeeSol,
    feeDisplay: `${formatSolAmount(PRICING_SOL.blinkSwapServiceFeeSol, 3, 4)} SOL`,
    ...computeSplit(PRICING_SOL.blinkSwapServiceFeeSol),
    nameKey: "blinkSwapServiceFeeSol",
    defaultNamePt: "Taxa fixa por swap executado via Solana Blink In-Feed (X/Twitter)",
    defaultNameEn: "Flat fee per swap executed via Solana Blink In-Feed (X/Twitter)",
    badge: "Solana Blink",
  },
  {
    id: "massAirdropPerBatch",
    route: "/airdrop",
    feeSol: PRICING_SOL.massAirdropPerBatch,
    feeDisplay: `${formatSolAmount(PRICING_SOL.massAirdropPerBatch)} SOL`,
    ...computeSplit(PRICING_SOL.massAirdropPerBatch),
    nameKey: "massAirdropPerBatch",
    defaultNamePt: "Airdrop em Massa (Multi-Sender por lote)",
    defaultNameEn: "Mass Airdrop (Multi-Sender per batch)",
  },
  {
    id: "holdersSnapshotAddon",
    route: "/airdrop",
    feeSol: PRICING_SOL.holdersSnapshotAddon,
    feeDisplay: `+${formatSolAmount(PRICING_SOL.holdersSnapshotAddon)} SOL`,
    ...computeSplit(PRICING_SOL.holdersSnapshotAddon),
    nameKey: "holdersSnapshotAddon",
    defaultNamePt: "Snapshot Automático de Holders On-Chain",
    defaultNameEn: "Automatic On-Chain Holders Snapshot",
    badge: "Snapshot",
  },
  {
    id: "revokeAuthorityStandalone",
    route: "/dashboard",
    feeSol: PRICING_SOL.revokeAuthorityStandalone,
    feeDisplay: `${formatSolAmount(PRICING_SOL.revokeAuthorityStandalone)} SOL`,
    ...computeSplit(PRICING_SOL.revokeAuthorityStandalone),
    nameKey: "revokeAuthorityStandalone",
    defaultNamePt: "Revogação Avulsa de Autoridade (Mint / Freeze)",
    defaultNameEn: "Standalone Authority Revocation (Mint / Freeze)",
  },
  {
    id: "claimWithheldTaxPerBatch",
    route: "/dashboard",
    feeSol: PRICING_SOL.claimWithheldTaxPerBatch,
    feeDisplay: `${formatSolAmount(PRICING_SOL.claimWithheldTaxPerBatch)} SOL`,
    ...computeSplit(PRICING_SOL.claimWithheldTaxPerBatch),
    nameKey: "claimWithheldTaxPerBatch",
    defaultNamePt: "Resgate de Taxas Retidas (Token-2022 WithdrawWithheld)",
    defaultNameEn: "Claim Withheld Transfer Fees (Token-2022)",
    badge: "Tax Claim",
  },
] as const;
