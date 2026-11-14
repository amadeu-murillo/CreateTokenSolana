import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export interface CliArguments {
  config?: string | undefined;
  network?: string | undefined;
  baseMint?: string | undefined;
  poolAddress?: string | undefined;
  airdrop?: boolean | undefined;
  help?: boolean | undefined;
}

export interface CommandOption {
  flag: string;
  description: string;
  required: boolean;
  type: "string" | "boolean";
  example?: string;
}

export interface TokenMetadata {
  uri?: string;
  image?: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  instagram?: string;
}

export interface TokenConfig {
  supply: number;
  decimals: number;
  tokenMintKeypairFilePath?: string;
  name: string;
  symbol: string;
  metadata: TokenMetadata;
  authorities: {
    mint: string | null;
    freeze: string | null;
    update: string | null;
  };
  sellerFeeBasisPoints: number;
  creators: Array<{ address: string; verified: boolean; share: number }> | null;
  collection: { verified: boolean; key: string } | null;
  uses: { useMethod: string; remaining: number; total: number } | null;
}

export type AllocationByAmount = {
  address: PublicKey;
  amount: BN;
  percentage: number;
};

export interface NetworkConfig {
  rpcUrl: string;
  airdropAmount: number;
}
