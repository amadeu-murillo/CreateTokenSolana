import { SolanaCluster } from "@/lib/constants";

export type SupportedDex = "raydium-cpmm";
export type QuoteAsset = "SOL" | "USDC";

export interface CreateLiquidityPoolParams {
  dex?: SupportedDex;
  baseMint: string;
  quoteToken: QuoteAsset;
  baseAmount: number | string;
  quoteAmount: number | string;
  feeTierBps: number;
  startTime?: number | null;
  revokeFreezeIfActive?: boolean;
  programId?: string;
  network?: SolanaCluster;
  jitoBundle?: {
    enabled: boolean;
    firstBuySol?: number;
    jitoTipSol?: number;
    isMultiWalletBundle?: boolean;
    multiWalletBuys?: Array<{ secretKey: Uint8Array; buyAmountSol: number }>;
  };
}

export interface CreateLiquidityPoolResponse {
  transaction: string;
  poolAddress: string;
  lpMintAddress: string;
  baseVaultAddress: string;
  quoteVaultAddress: string;
  dex: SupportedDex;
  initialPrice: number;
  lpTokensMinted?: string;
  serviceFeeSol?: number;
  freezeAuthorityRevokedInTx: boolean;
  blockhash: string;
  lastValidBlockHeight: number;
  network: SolanaCluster;
}

export interface RemoveLiquidityParams {
  baseMint: string;
  poolId?: string;
  lpMint?: string;
  withdrawPercentage: number;
  programId?: string;
  network?: SolanaCluster;
}

export interface RemoveLiquidityResponse {
  transaction: string;
  poolId: string;
  lpMint: string;
  baseMint: string;
  quoteToken: QuoteAsset;
  lpPairLabel: "LP-SOL" | "LP-USDC";
  quoteVaultAddress: string;
  withdrawnQuote: number;
  withdrawPercentage: number;
  estimatedQuoteReturned: string;
  estimatedBaseReturned: string;
  serviceFeeSol: number;
  blockhash: string;
  lastValidBlockHeight: number;
  network: SolanaCluster;
}