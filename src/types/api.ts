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