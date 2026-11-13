import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

export type SolanaCluster = "mainnet-beta" | "devnet";

/**
 * RF-01: Developer wallet address that receives the standardized 0.07 SOL service fee
 * across ALL platform operations (Create Token, Create Liquidity Pool, Burn Token,
 * Mass Airdrop, and Manage/Revoke Authority).
 */
export const DEV_WALLET_ADDRESS_STRING =
  process.env.NEXT_PUBLIC_DEV_WALLET_ADDRESS || "CP6teSg2LUxQsSBBtwZ9xjG2aZjjznhfCvGED9LNgjrJ";

export const DEV_WALLET_ADDRESS = new PublicKey(DEV_WALLET_ADDRESS_STRING);

/**
 * RF-02: Cluster-aware RPC endpoints (Mainnet-Beta default and Devnet optional).
 */
export const MAINNET_RPC_ENDPOINT =
  (typeof window === "undefined" ? process.env.SOLANA_RPC_URL : undefined) ||
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

export const DEVNET_RPC_ENDPOINT =
  (typeof window === "undefined" ? process.env.SOLANA_DEVNET_RPC_URL : undefined) ||
  process.env.NEXT_PUBLIC_DEVNET_RPC_URL ||
  "https://api.devnet.solana.com";

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

/**
 * RF-03: Standardized Mandatory Service Fee (0.07 SOL) routed to DEV_WALLET_ADDRESS
 * across every single platform service on both Mainnet-Beta and Devnet.
 */
export const STANDARD_SERVICE_FEE_SOL = 0.07;
export const SERVICE_FEE_CREATE_TOKEN_SOL = 0.07;
export const SERVICE_FEE_BURN_TOKEN_SOL = 0.07;
export const SERVICE_FEE_AIRDROP_SOL = 0.07;
export const SERVICE_FEE_MANAGE_AUTHORITY_SOL = 0.07;
export const SERVICE_FEE_CREATE_LP_SOL = 0.07;
export const SERVICE_FEE_CREATE_LP_DEVNET_SOL = 0.07;
export const AFFILIATE_COMMISSION_RATE = 0.10; // 10% atomic referral commission (0.007 SOL per operation)

/**
 * Standardized Service Fees in Lamports (70,000,000 lamports = 0.07 SOL).
 */
export const STANDARD_SERVICE_FEE_LAMPORTS = Math.round(
  STANDARD_SERVICE_FEE_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_CREATE_TOKEN_LAMPORTS = Math.round(
  SERVICE_FEE_CREATE_TOKEN_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_BURN_TOKEN_LAMPORTS = Math.round(
  SERVICE_FEE_BURN_TOKEN_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_AIRDROP_LAMPORTS = Math.round(
  SERVICE_FEE_AIRDROP_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_MANAGE_AUTHORITY_LAMPORTS = Math.round(
  SERVICE_FEE_MANAGE_AUTHORITY_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_CREATE_LP_LAMPORTS = Math.round(
  SERVICE_FEE_CREATE_LP_SOL * LAMPORTS_PER_SOL
);
export const SERVICE_FEE_CREATE_LP_DEVNET_LAMPORTS = Math.round(
  SERVICE_FEE_CREATE_LP_DEVNET_SOL * LAMPORTS_PER_SOL
);

export function getLpServiceFeeLamports(cluster: SolanaCluster = "mainnet-beta"): number {
  return cluster === "devnet"
    ? SERVICE_FEE_CREATE_LP_DEVNET_LAMPORTS
    : SERVICE_FEE_CREATE_LP_LAMPORTS;
}

/**
 * DEX Program IDs and Quote Token Mints for Mainnet-Beta & Devnet.
 */
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

/**
 * Operational security limits.
 */
export const MAX_AIRDROP_RECIPIENTS_PER_TX = 20;
export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
] as const;
