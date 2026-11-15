import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  AFFILIATE_COMMISSION_RATE as PRICING_AFFILIATE_RATE,
  DEV_AFFILIATE_SHARE_RATE as PRICING_DEV_RATE,
  ModularPricingBreakdownItem,
  ModularPricingOptions,
  OFFICIAL_DEV_WALLET_STRING,
  PRICING_SOL,
  calculateModularTokenCreationFee,
} from "@/config/pricing";

export type SolanaCluster = "mainnet-beta" | "devnet";

function resolveSafeDevWallet(): PublicKey {
  const raw = (process.env.NEXT_PUBLIC_DEV_WALLET_ADDRESS || "").trim();
  if (raw) {
    try {
      return new PublicKey(raw);
    } catch {
      // Fallback to default valid dev wallet if env var is malformed
    }
  }
  return new PublicKey(OFFICIAL_DEV_WALLET_STRING);
}

export const DEV_WALLET_ADDRESS = resolveSafeDevWallet();
export const DEV_WALLET_ADDRESS_STRING = DEV_WALLET_ADDRESS.toBase58();

export const MAINNET_RPC_ENDPOINT =
  (typeof window === "undefined" ? process.env.SOLANA_RPC_URL : undefined) ||
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  "https://solana-rpc.publicnode.com";

export const MAINNET_FALLBACK_RPC_ENDPOINTS: string[] = [
  ...(process.env.NEXT_PUBLIC_HELIUS_RPC_URL ? [process.env.NEXT_PUBLIC_HELIUS_RPC_URL] : []),
  ...(process.env.NEXT_PUBLIC_RPC_URL ? [process.env.NEXT_PUBLIC_RPC_URL] : []),
  ...(process.env.NEXT_PUBLIC_SOLANA_RPC_URL ? [process.env.NEXT_PUBLIC_SOLANA_RPC_URL] : []),
  "https://solana-rpc.publicnode.com",
  "https://rpc.ankr.com/solana",
  "https://api.mainnet-beta.solana.com",
];

export const DEVNET_RPC_ENDPOINT =
  (typeof window === "undefined" ? process.env.SOLANA_DEVNET_RPC_URL : undefined) ||
  process.env.NEXT_PUBLIC_DEVNET_RPC_URL ||
  "https://api.devnet.solana.com";

export const DEVNET_FALLBACK_RPC_ENDPOINTS: string[] = [
  ...(process.env.NEXT_PUBLIC_DEVNET_RPC_URL ? [process.env.NEXT_PUBLIC_DEVNET_RPC_URL] : []),
  "https://solana-devnet.publicnode.com",
  "https://api.devnet.solana.com",
];

export const RPC_ENDPOINT = MAINNET_RPC_ENDPOINT;

export function getRpcEndpoint(cluster: SolanaCluster = "mainnet-beta"): string {
  return cluster === "devnet" ? DEVNET_RPC_ENDPOINT : MAINNET_RPC_ENDPOINT;
}

export function getSolscanUrl(
  type: "tx" | "token" | "account",
  identifier: string,
  cluster: SolanaCluster = "mainnet-beta"
): string {
  const suffix = cluster === "devnet" ? "?cluster=devnet" : "";
  return `https://solscan.io/${type}/${identifier}${suffix}`;
}

export const MODULAR_FEE_BASE_CREATE_SOL = PRICING_SOL.baseMint;
export const MODULAR_FEE_REVOKE_FREEZE_SOL = PRICING_SOL.revokeFreeze;
export const MODULAR_FEE_REVOKE_MINT_SOL = PRICING_SOL.revokeMint;
export const MODULAR_FEE_IMMUTABLE_METADATA_SOL = PRICING_SOL.immutableMetadata;
export const MODULAR_FEE_CUSTOM_CREATOR_SOL = PRICING_SOL.customCreator;
export const MODULAR_FEE_TRANSFER_FEE_EXT_SOL = PRICING_SOL.transferFeeExt;
export const MODULAR_FEE_SOULBOUND_EXT_SOL = PRICING_SOL.soulboundExt;
export const MODULAR_FEE_PERMANENT_DELEGATE_EXT_SOL = PRICING_SOL.permanentDelegateExt;
export const MODULAR_FEE_VANITY_MINT_SOL = PRICING_SOL.vanityCustom3To4Chars;
export const MODULAR_FEE_JITO_BUNDLE_SOL = PRICING_SOL.jitoAtomicBundle;

export type { ModularPricingOptions, ModularPricingBreakdownItem };
export { calculateModularTokenCreationFee };

export const STANDARD_SERVICE_FEE_SOL = PRICING_SOL.createLiquidityPool;
export const SERVICE_FEE_CREATE_TOKEN_SOL = 0.35;
export const SERVICE_FEE_BURN_TOKEN_SOL = PRICING_SOL.burnStandard;
export const SERVICE_FEE_BURN_AND_EARN_SOL = PRICING_SOL.burnAndEarnLockLp;
export const SERVICE_FEE_AIRDROP_SOL = PRICING_SOL.massAirdropPerBatch;
export const SERVICE_FEE_SNAPSHOT_HOLDERS_SOL = PRICING_SOL.holdersSnapshotAddon;
export const SERVICE_FEE_MANAGE_AUTHORITY_SOL = PRICING_SOL.revokeAuthorityStandalone;
export const SERVICE_FEE_CLAIM_WITHHELD_TAX_SOL = PRICING_SOL.claimWithheldTaxPerBatch;
export const SERVICE_FEE_CREATE_LP_SOL = PRICING_SOL.createLiquidityPool;
export const SERVICE_FEE_CREATE_LP_DEVNET_SOL = PRICING_SOL.createLiquidityPool;
export const SERVICE_FEE_REMOVE_LP_SOL = PRICING_SOL.withdrawLiquiditySol;

export const AFFILIATE_COMMISSION_RATE = PRICING_AFFILIATE_RATE;
export const DEV_AFFILIATE_SHARE_RATE = PRICING_DEV_RATE;

export const ESTIMATED_ATA_RENT_SOL = 0.00203928;
export const ESTIMATED_ATA_RENT_LAMPORTS = 2_039_280;
export const RECLAIM_SOL_SERVICE_FEE_RATE = PRICING_SOL.reclaimSolPlatformFeeRate;
export const MAX_CLOSE_ACCOUNTS_PER_TX = 20;

export const STANDARD_SERVICE_FEE_LAMPORTS = Math.round(
  STANDARD_SERVICE_FEE_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_CREATE_TOKEN_LAMPORTS = Math.round(
  SERVICE_FEE_CREATE_TOKEN_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_BURN_TOKEN_LAMPORTS = Math.round(
  SERVICE_FEE_BURN_TOKEN_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_BURN_AND_EARN_LAMPORTS = Math.round(
  SERVICE_FEE_BURN_AND_EARN_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_AIRDROP_LAMPORTS = Math.round(
  SERVICE_FEE_AIRDROP_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_SNAPSHOT_HOLDERS_LAMPORTS = Math.round(
  SERVICE_FEE_SNAPSHOT_HOLDERS_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_MANAGE_AUTHORITY_LAMPORTS = Math.round(
  SERVICE_FEE_MANAGE_AUTHORITY_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_CLAIM_WITHHELD_TAX_LAMPORTS = Math.round(
  SERVICE_FEE_CLAIM_WITHHELD_TAX_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_CREATE_LP_LAMPORTS = Math.round(
  SERVICE_FEE_CREATE_LP_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_CREATE_LP_DEVNET_LAMPORTS = Math.round(
  SERVICE_FEE_CREATE_LP_DEVNET_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_REMOVE_LP_LAMPORTS = Math.round(
  SERVICE_FEE_REMOVE_LP_SOL * LAMPORTS_PER_SOL
);

export function getLpServiceFeeLamports(cluster: SolanaCluster = "mainnet-beta"): number {
  return cluster === "devnet"
    ? SERVICE_FEE_CREATE_LP_DEVNET_LAMPORTS
    : SERVICE_FEE_CREATE_LP_LAMPORTS;
}

export const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
export const USDC_MINT_MAINNET = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
export const USDC_MINT_DEVNET = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
export const USDC_MINT = USDC_MINT_MAINNET;

export const RAYDIUM_CPMM_PROGRAM_ID_MAINNET = new PublicKey(
  "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C"
);
export const RAYDIUM_CPMM_AMM_CONFIG_MAINNET = new PublicKey(
  "D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2"
);
export const RAYDIUM_CPMM_FEE_RECEIVER_MAINNET = new PublicKey(
  "DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8"
);

export const RAYDIUM_CPMM_PROGRAM_ID_DEVNET = new PublicKey(
  "CPMDWBwJDtYax9qW7AyRuVC19Cc4L4Vcy4n2BHAbHkCW"
);
export const RAYDIUM_CPMM_AMM_CONFIG_DEVNET = new PublicKey(
  "9zSzfkYy6awexsHvmggeH36pfVUdDGyCcwmjT3AQPBj6"
);
export const RAYDIUM_CPMM_FEE_RECEIVER_DEVNET = new PublicKey(
  "G11FKBRaAkHAKuLCgLM6K6NUc9rTjPAznRCjZifrTQe2"
);

export const METEORA_DAMM_PROGRAM_ID = new PublicKey(
  "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB"
);
export const METEORA_DLMM_PROGRAM_ID = new PublicKey(
  "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo"
);

export function getClusterDexConfig(cluster: SolanaCluster = "mainnet-beta") {
  if (cluster === "devnet") {
    return {
      raydiumProgramId: RAYDIUM_CPMM_PROGRAM_ID_DEVNET,
      raydiumAmmConfig: RAYDIUM_CPMM_AMM_CONFIG_DEVNET,
      raydiumFeeReceiver: RAYDIUM_CPMM_FEE_RECEIVER_DEVNET,
      meteoraDammProgramId: METEORA_DAMM_PROGRAM_ID,
      usdcMint: USDC_MINT_DEVNET,
      wsolMint: WSOL_MINT,
    };
  }
  return {
    raydiumProgramId: RAYDIUM_CPMM_PROGRAM_ID_MAINNET,
    raydiumAmmConfig: RAYDIUM_CPMM_AMM_CONFIG_MAINNET,
    raydiumFeeReceiver: RAYDIUM_CPMM_FEE_RECEIVER_MAINNET,
    meteoraDammProgramId: METEORA_DAMM_PROGRAM_ID,
    usdcMint: USDC_MINT_MAINNET,
    wsolMint: WSOL_MINT,
  };
}

export const MAX_AIRDROP_RECIPIENTS_PER_TX = 20;
export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
] as const;
