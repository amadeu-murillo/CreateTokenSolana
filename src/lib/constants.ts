import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * RF-01: Chave da carteira de desenvolvimento para receber taxas de serviço.
 */
export const DEV_WALLET_ADDRESS = new PublicKey('4hSVNpgfh1tzn91jgbpH6fVEQ25b63Vd9cvLMJhE3FEf');

/**
 * RF-02: Endpoint RPC da Helius para a mainnet.
 */
export const RPC_ENDPOINT = 'https://mainnet.helius-rpc.com/?api-key=2e9c5f4b-aacf-4903-a787-0c431a50ffff';

/**
 * RF-03: Taxas de serviço em SOL.
 */
export const SERVICE_FEE_CREATE_TOKEN_SOL = 0.092;
export const SERVICE_FEE_BURN_TOKEN_SOL = 0.05;
export const SERVICE_FEE_AIRDROP_SOL = 0.05;
export const SERVICE_FEE_MANAGE_AUTHORITY_SOL = 0.05;


/**
 * Taxas de serviço em Lamports (a menor unidade do SOL).
 */
export const SERVICE_FEE_CREATE_TOKEN_LAMPORTS = SERVICE_FEE_CREATE_TOKEN_SOL * LAMPORTS_PER_SOL;
export const SERVICE_FEE_BURN_TOKEN_LAMPORTS = SERVICE_FEE_BURN_TOKEN_SOL * LAMPORTS_PER_SOL;
export const SERVICE_FEE_AIRDROP_LAMPORTS = SERVICE_FEE_AIRDROP_SOL * LAMPORTS_PER_SOL;
export const SERVICE_FEE_MANAGE_AUTHORITY_LAMPORTS = SERVICE_FEE_MANAGE_AUTHORITY_SOL * LAMPORTS_PER_SOL;
