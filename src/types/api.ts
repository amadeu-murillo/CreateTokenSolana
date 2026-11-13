import { SolanaCluster } from "@/lib/constants";

export type SupportedDex = "raydium-cpmm" | "meteora-damm";
export type QuoteAsset = "SOL" | "USDC";

export interface CreateLiquidityPoolParams {
  dex: SupportedDex;
  baseMint: string;
  quoteToken: QuoteAsset;
  baseAmount: number;
  quoteAmount: number;
  feeTierBps: number;
  startTime?: number | null;
  revokeFreezeIfActive?: boolean;
  programId?: string;
  network?: SolanaCluster;
}

export interface CreateLiquidityPoolResponse {
  transaction: string;
  poolAddress: string;
  lpMintAddress: string;
  baseVaultAddress: string;
  quoteVaultAddress: string;
  dex: SupportedDex;
  initialPrice: number;
  freezeAuthorityRevokedInTx: boolean;
  blockhash: string;
  lastValidBlockHeight: number;
  network: SolanaCluster;
}