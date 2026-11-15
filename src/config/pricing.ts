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
 * Centralized Production Pricing Constants (in SOL).
 * Single source of truth for Home (/), CostSummary.tsx, /costs, /documentacao, and API routes.
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
  defaultJitoTipSol: 0.002,

  // Liquidity Pool Operations (/add-liquidity)
  createLiquidityPool: 0.07,
  withdrawLiquiditySol: 0.05,

  // Burn & Rent Recovery Operations (/burn)
  burnStandard: 0.07,
  burnAndEarnLockLp: 0.10,
  estimatedAtaRentReclaimSol: 0.00204,
  reclaimSolPlatformFeeRate: 0.15,

  // Mass Airdrop & Snapshot (/airdrop)
  massAirdropPerBatch: 0.07,
  holdersSnapshotAddon: 0.03,

  // Authority & Token-2022 Tax Dashboard (/dashboard)
  revokeAuthorityStandalone: 0.07,
  claimWithheldTaxPerBatch: 0.05,
} as const;

export interface PricingScheduleItem {
  id: string;
  route: string;
  feeSol: number;
  feeDisplay: string;
  affiliateSol: number;
  devWalletSol: number;
  nameKey: string;
  defaultNamePt: string;
  defaultNameEn: string;
  badge?: string;
}

export function computeSplit(feeSol: number): { affiliateSol: number; devWalletSol: number } {
  const affiliateSol = Number((feeSol * AFFILIATE_COMMISSION_RATE).toFixed(4));
  const devWalletSol = Number((feeSol - affiliateSol).toFixed(4));
  return { affiliateSol, devWalletSol };
}

/**
 * Full 17-item verified pricing and 30%/70% commission table for /costs and documentation.
 */
export const PRICING_SCHEDULE_TABLE: ReadonlyArray<PricingScheduleItem> = [
  {
    id: "baseMint",
    route: "/",
    feeSol: PRICING_SOL.baseMint,
    feeDisplay: "0.10 SOL",
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
    feeDisplay: "+0.10 SOL",
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
    feeDisplay: "+0.10 SOL",
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
    feeDisplay: "+0.05 SOL",
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
    feeDisplay: "+0.05 SOL",
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
    feeDisplay: "+0.15 SOL",
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
    feeDisplay: "+0.10 SOL",
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
    feeDisplay: "0.00 / 0.05 SOL",
    ...computeSplit(PRICING_SOL.vanityCustom3To4Chars),
    nameKey: "vanityMint",
    defaultNamePt: "Vanity Mint Address (1–2 chars Grátis / 3–4 chars +0.05 SOL)",
    defaultNameEn: "Vanity Mint Address (1–2 chars Free / 3–4 chars +0.05 SOL)",
    badge: "Web Worker",
  },
  {
    id: "jitoAtomicBundle",
    route: "/ & /add-liquidity",
    feeSol: PRICING_SOL.jitoAtomicBundle,
    feeDisplay: "+0.20 SOL",
    ...computeSplit(PRICING_SOL.jitoAtomicBundle),
    nameKey: "jitoAtomicBundle",
    defaultNamePt: "Jito Atomic Bundle (Mint + Pool + 1ª Compra Anti-Sniper)",
    defaultNameEn: "Jito Atomic Bundle (Mint + Pool + Anti-Sniper First Buy)",
    badge: "Block 0 MEV",
  },
  {
    id: "createLiquidityPool",
    route: "/add-liquidity",
    feeSol: PRICING_SOL.createLiquidityPool,
    feeDisplay: "0.07 SOL",
    ...computeSplit(PRICING_SOL.createLiquidityPool),
    nameKey: "createLiquidityPool",
    defaultNamePt: "Criar Pool de Liquidez (Raydium CPMM / Meteora DAMM)",
    defaultNameEn: "Create Liquidity Pool (Raydium CPMM / Meteora DAMM)",
    badge: "Creator Fee",
  },
  {
    id: "withdrawLiquiditySol",
    route: "/add-liquidity",
    feeSol: PRICING_SOL.withdrawLiquiditySol,
    feeDisplay: "0.05 SOL",
    ...computeSplit(PRICING_SOL.withdrawLiquiditySol),
    nameKey: "withdrawLiquiditySol",
    defaultNamePt: "Retirar Liquidez em SOL",
    defaultNameEn: "Withdraw Liquidity in SOL",
  },
  {
    id: "burnAndEarnLockLp",
    route: "/burn",
    feeSol: PRICING_SOL.burnAndEarnLockLp,
    feeDisplay: "0.10 SOL",
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
    feeDisplay: "0.07 SOL",
    ...computeSplit(PRICING_SOL.burnStandard),
    nameKey: "burnStandard",
    defaultNamePt: "Queima Padrão + Certificado PNG (~0.00204 SOL restituídos/ATA)",
    defaultNameEn: "Standard Burn + PNG Certificate (~0.00204 SOL rent reclaimed/ATA)",
  },
  {
    id: "massAirdropPerBatch",
    route: "/airdrop",
    feeSol: PRICING_SOL.massAirdropPerBatch,
    feeDisplay: "0.07 SOL",
    ...computeSplit(PRICING_SOL.massAirdropPerBatch),
    nameKey: "massAirdropPerBatch",
    defaultNamePt: "Airdrop em Massa (Multi-Sender por lote)",
    defaultNameEn: "Mass Airdrop (Multi-Sender per batch)",
  },
  {
    id: "holdersSnapshotAddon",
    route: "/airdrop",
    feeSol: PRICING_SOL.holdersSnapshotAddon,
    feeDisplay: "+0.03 SOL",
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
    feeDisplay: "0.07 SOL",
    ...computeSplit(PRICING_SOL.revokeAuthorityStandalone),
    nameKey: "revokeAuthorityStandalone",
    defaultNamePt: "Revogação Avulsa de Autoridade (Mint / Freeze)",
    defaultNameEn: "Standalone Authority Revocation (Mint / Freeze)",
  },
  {
    id: "claimWithheldTaxPerBatch",
    route: "/dashboard",
    feeSol: PRICING_SOL.claimWithheldTaxPerBatch,
    feeDisplay: "0.05 SOL",
    ...computeSplit(PRICING_SOL.claimWithheldTaxPerBatch),
    nameKey: "claimWithheldTaxPerBatch",
    defaultNamePt: "Resgate de Taxas Retidas (Token-2022 WithdrawWithheld)",
    defaultNameEn: "Claim Withheld Transfer Fees (Token-2022)",
    badge: "Tax Claim",
  },
] as const;

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
  items: ModularPricingBreakdownItem[];
} {
  const vanityLength = options.vanityCharLength ?? 0;
  const isPaidVanity = vanityLength >= 3;

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
      active: Boolean(options.hasJitoBundle),
    },
  ];

  const rawTotalSol = items
    .filter((item) => item.active)
    .reduce((sum, item) => sum + item.sol, 0);

  const totalSol = Number(rawTotalSol.toFixed(4));
  const totalLamports = Math.round(totalSol * LAMPORTS_PER_SOL);
  const { affiliateSol, devWalletSol } = computeSplit(totalSol);

  return { totalSol, totalLamports, affiliateSol, devWalletSol, items };
}
