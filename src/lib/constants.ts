import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getCpmmPdaAmmConfigId } from "@raydium-io/raydium-sdk-v2";
import {
  AFFILIATE_COMMISSION_RATE as PRICING_AFFILIATE_RATE,
  DEFAULT_CREATE_TOKEN_FEE_SOL,
  DEFAULT_MODULAR_PRICING_OPTIONS,
  DEV_AFFILIATE_SHARE_RATE as PRICING_DEV_RATE,
  ModularPricingBreakdownItem,
  ModularPricingOptions,
  OFFICIAL_DEV_WALLET_STRING,
  OPERATION_SERVICE_FEES_SOL,
  Operation,
  PRICING_SOL,
  calculateModularTokenCreationFee,
  computeRateSplitPercent,
  computeSplit,
  formatSolAmount,
  getTokenCreationFeeRangeSol,
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

function isValidServerClusterUrl(
  url: string | undefined,
  targetCluster: SolanaCluster
): url is string {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return false;
  if (trimmed.includes("YOUR_") || trimmed.includes("your_")) return false;
  const lower = trimmed.toLowerCase();
  if (targetCluster === "mainnet-beta" && lower.includes("devnet")) return false;
  if (targetCluster === "devnet" && lower.includes("mainnet")) return false;
  return true;
}

/**
 * Public (keyless) fallback endpoints.
 * SECURITY (Phase 1.1): Never include NEXT_PUBLIC_HELIUS_RPC_URL or any keyed RPC URL in client bundles.
 * Keyed RPCs are read strictly on the server (`typeof window === "undefined"`) via `SOLANA_RPC_URL` / `SOLANA_DEVNET_RPC_URL`.
 */
export const MAINNET_FALLBACK_RPC_ENDPOINTS: string[] = Array.from(
  new Set([
    ...(typeof window === "undefined" &&
    isValidServerClusterUrl(process.env.SOLANA_RPC_URL, "mainnet-beta")
      ? [process.env.SOLANA_RPC_URL!.trim()]
      : []),
    "https://api.mainnet-beta.solana.com",
    "https://solana-rpc.publicnode.com",
  ])
);

export const MAINNET_RPC_ENDPOINT =
  MAINNET_FALLBACK_RPC_ENDPOINTS[0] || "https://api.mainnet-beta.solana.com";

export const DEVNET_FALLBACK_RPC_ENDPOINTS: string[] = Array.from(
  new Set([
    ...(typeof window === "undefined" &&
    isValidServerClusterUrl(process.env.SOLANA_DEVNET_RPC_URL, "devnet")
      ? [process.env.SOLANA_DEVNET_RPC_URL!.trim()]
      : []),
    "https://api.devnet.solana.com",
    "https://solana-devnet.publicnode.com",
  ])
);

export const DEVNET_RPC_ENDPOINT =
  DEVNET_FALLBACK_RPC_ENDPOINTS[0] || "https://api.devnet.solana.com";

export const RPC_ENDPOINT = MAINNET_RPC_ENDPOINT;

/**
 * Returns the RPC endpoint for the given cluster.
 * In the browser, ALL RPC requests strictly go through `/api/rpc?cluster=${cluster}`
 * so no API keys are ever exposed in the client bundle.
 */
export function getRpcEndpoint(cluster: SolanaCluster = "mainnet-beta"): string {
  if (typeof window !== "undefined") {
    const origin = window.location?.origin || "http://localhost:3000";
    return `${origin}/api/rpc?cluster=${cluster}`;
  }
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
export const MODULAR_FEE_JITO_MULTI_WALLET_SOL = PRICING_SOL.jitoMultiWalletBundle;

export type { ModularPricingOptions, ModularPricingBreakdownItem, Operation };
export {
  DEFAULT_CREATE_TOKEN_FEE_SOL,
  DEFAULT_MODULAR_PRICING_OPTIONS,
  OPERATION_SERVICE_FEES_SOL,
  calculateModularTokenCreationFee,
  computeRateSplitPercent,
  computeSplit,
  formatSolAmount,
  getTokenCreationFeeRangeSol,
};

export const STANDARD_SERVICE_FEE_SOL = PRICING_SOL.createLiquidityPool;
export const SERVICE_FEE_CREATE_TOKEN_SOL = DEFAULT_CREATE_TOKEN_FEE_SOL;
export const SERVICE_FEE_BURN_TOKEN_SOL = PRICING_SOL.burnStandard;
export const SERVICE_FEE_BURN_AND_EARN_SOL = PRICING_SOL.burnAndEarnLockLp;
export const SERVICE_FEE_AIRDROP_SOL = PRICING_SOL.massAirdropPerBatch;
export const SERVICE_FEE_SNAPSHOT_HOLDERS_SOL = PRICING_SOL.holdersSnapshotAddon;
export const SERVICE_FEE_MANAGE_AUTHORITY_SOL = PRICING_SOL.revokeAuthorityStandalone;
export const SERVICE_FEE_CLAIM_WITHHELD_TAX_SOL = PRICING_SOL.claimWithheldTaxPerBatch;
export const SERVICE_FEE_CREATE_LP_SOL = PRICING_SOL.createLiquidityPool;
export const SERVICE_FEE_CREATE_LP_DEVNET_SOL = PRICING_SOL.createLiquidityPool;
export const SERVICE_FEE_REMOVE_LP_SOL = PRICING_SOL.withdrawLiquiditySol;
export const RAYDIUM_PROTOCOL_CREATE_POOL_FEE_SOL =
  PRICING_SOL.raydiumProtocolCreatePoolFeeSol;
export const ESTIMATED_LP_POOL_RENT_SOL = PRICING_SOL.estimatedLpPoolRentSol;

export const SERVICE_FEE_VOLUME_BOT_STARTER_SOL = PRICING_SOL.volumeBotStarter100;
export const SERVICE_FEE_VOLUME_BOT_GROWTH_SOL = PRICING_SOL.volumeBotGrowth300;
export const SERVICE_FEE_VOLUME_BOT_TRENDING_SOL = PRICING_SOL.volumeBotTrending750;
export const SERVICE_FEE_TOKEN_VESTING_LOCK_SOL = PRICING_SOL.tokenVestingLock;
export const SERVICE_FEE_BLINK_SWAP_SOL = PRICING_SOL.blinkSwapServiceFeeSol;

export const AFFILIATE_COMMISSION_RATE = PRICING_AFFILIATE_RATE;
export const DEV_AFFILIATE_SHARE_RATE = PRICING_DEV_RATE;

export const ESTIMATED_ATA_RENT_SOL = PRICING_SOL.estimatedAtaRentReclaimSol;
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
export const SERVICE_FEE_VOLUME_BOT_STARTER_LAMPORTS = Math.round(
  SERVICE_FEE_VOLUME_BOT_STARTER_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_VOLUME_BOT_GROWTH_LAMPORTS = Math.round(
  SERVICE_FEE_VOLUME_BOT_GROWTH_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_VOLUME_BOT_TRENDING_LAMPORTS = Math.round(
  SERVICE_FEE_VOLUME_BOT_TRENDING_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_TOKEN_VESTING_LOCK_LAMPORTS = Math.round(
  SERVICE_FEE_TOKEN_VESTING_LOCK_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_BLINK_SWAP_LAMPORTS = Math.round(
  SERVICE_FEE_BLINK_SWAP_SOL * LAMPORTS_PER_SOL
);

export function getLpServiceFeeLamports(cluster: SolanaCluster = "mainnet-beta"): number {
  return cluster === "devnet"
    ? SERVICE_FEE_CREATE_LP_DEVNET_LAMPORTS
    : SERVICE_FEE_CREATE_LP_LAMPORTS;
}

// ============================================================================
// Consolidated Canonical Program & Mint Addresses (Phase 4.18)
// ============================================================================
export const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
export const USDC_MINT_MAINNET = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
export const USDC_MINT_DEVNET = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
export const USDC_MINT = USDC_MINT_MAINNET;

export const METAPLEX_METADATA_PROGRAM_ID_STRING =
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
export const METAPLEX_METADATA_PROGRAM_ID = new PublicKey(
  METAPLEX_METADATA_PROGRAM_ID_STRING
);

export const SPL_MEMO_PROGRAM_V2_STRING =
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
export const SPL_MEMO_PROGRAM_V1_STRING =
  "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo";
export const SPL_MEMO_PROGRAM_ID = new PublicKey(SPL_MEMO_PROGRAM_V2_STRING);

export const RAYDIUM_CPMM_PROGRAM_ID_MAINNET_STRING =
  "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C";
export const RAYDIUM_CPMM_PROGRAM_ID_DEVNET_STRING =
  "DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb";
export const RAYDIUM_CPMM_LEGACY_PROGRAM_ID_DEVNET_STRING =
  "CPMDWBwJDtYax9qW7AyRuVC19Cc4L4Vcy4n2BHAbHkCW";

export const RAYDIUM_CPMM_PROGRAM_ID_MAINNET = new PublicKey(
  RAYDIUM_CPMM_PROGRAM_ID_MAINNET_STRING
);
export const RAYDIUM_CPMM_AMM_CONFIG_MAINNET = new PublicKey(
  "D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2"
);
export const RAYDIUM_CPMM_FEE_RECEIVER_MAINNET = new PublicKey(
  "DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8"
);

export const RAYDIUM_CPMM_PROGRAM_ID_DEVNET = new PublicKey(
  RAYDIUM_CPMM_PROGRAM_ID_DEVNET_STRING
);
export const RAYDIUM_CPMM_LEGACY_PROGRAM_ID_DEVNET = new PublicKey(
  RAYDIUM_CPMM_LEGACY_PROGRAM_ID_DEVNET_STRING
);
export const RAYDIUM_CPMM_AMM_CONFIG_DEVNET = getCpmmPdaAmmConfigId(
  RAYDIUM_CPMM_PROGRAM_ID_DEVNET,
  0
).publicKey;
export const RAYDIUM_CPMM_LEGACY_AMM_CONFIG_DEVNET = new PublicKey(
  "9zSzfkYy6awexsHvmggeH36pfVUdDGyCcwmjT3AQPBj6"
);
export const RAYDIUM_CPMM_FEE_RECEIVER_DEVNET = new PublicKey(
  "3oE58BKVt8KuYkGxx8zBojugnymWmBiyafWgMrnb6eYy"
);

export const RAYDIUM_AMM_V4_PROGRAM_MAINNET_STRING =
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8";
export const RAYDIUM_AMM_V4_PROGRAM_DEVNET_STRING =
  "DRaya7Kj3aMWQSy19kSjvmuwq9docCHofyP9kanQGaav";
export const RAYDIUM_CLMM_PROGRAM_MAINNET_STRING =
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK";
export const RAYDIUM_CLMM_PROGRAM_DEVNET_STRING =
  "DRayAUgENGQBKVaX8owNhgzkEDyoHTGVEGHVJT1E9pfH";
export const RAYDIUM_ROUTING_PROGRAM_MAINNET_STRING =
  "routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS";
export const RAYDIUM_ROUTING_PROGRAM_DEVNET_STRING =
  "DRaybByLpbUL57LJARs3j8BitTxVfzBg351EaMr5UTCd";
export const RAYDIUM_LOCK_CPMM_PROGRAM_MAINNET_STRING =
  "LockrWmn6K5twhz3y9w1dQERbmgSaRkfnTeTKbpofwE";
export const RAYDIUM_LOCK_CPMM_PROGRAM_DEVNET_STRING =
  "DRay25Usp3YJAi7beckgpGUC7mGJ2cR1AVPxhYfwVCUX";
export const RAYDIUM_LOCK_CPMM_PROGRAM_DEVNET_LEGACY_STRING =
  "DLockwT7X7sxtLmGH9g5kmfcjaBtncdbUmi738m5bvQC";

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
      usdcMint: USDC_MINT_DEVNET,
      wsolMint: WSOL_MINT,
    };
  }
  return {
    raydiumProgramId: RAYDIUM_CPMM_PROGRAM_ID_MAINNET,
    raydiumAmmConfig: RAYDIUM_CPMM_AMM_CONFIG_MAINNET,
    raydiumFeeReceiver: RAYDIUM_CPMM_FEE_RECEIVER_MAINNET,
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
