// src/types/api.ts

export interface CreatePoolWithSolParams {
  baseTokenMint: string;
  baseTokenDecimals: number;
  initialBaseTokenAmount: number;
  initialSolAmount: number;
  userWalletAddress: string;
}

export interface CreatePoolWithSolResponse {
  transaction: string;
  ammId: string;
  lpTokenAddress: string;
}

// --- Novos Tipos para a Criação do Mercado ---

export interface CreateMarketParams {
  baseTokenMint: string;
  baseTokenDecimals: number;
  quoteTokenMint: string;
  quoteTokenDecimals: number;
  userWalletAddress: string;
}

export interface InitializePoolParams {
  userWalletAddress: string;
  marketId: string;
  baseToken: { mint: string; decimals: number };
  quoteToken: { mint: string; decimals: number };
  baseAmount: number;
  quoteAmount: number;
}

export interface InitializePoolResponse {
  transaction: string;
  ammId: string;
  lpMintAddress: string;
}

export interface CreateMarketResponse {
  transaction: string;
  marketId: string;
}