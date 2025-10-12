import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * RF-01: Chave da carteira de desenvolvimento para receber taxas de serviço.
 */
export const DEV_WALLET_ADDRESS = new PublicKey(
     'CP6teSg2LUxQsSBBtwZ9xjG2aZjjznhfCvGED9LNgjrJ'
);

/**
 * RF-02: Endpoint RPC da Helius para a devnet.
 */

export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "";

export const CLOUDINARY_URL='cloudinary://376481879818689:YfZk9mhp8eVA6xaZOZzHbF2H_qM@dgurmzcht';
 

/**
 * RF-03: Taxas de serviço em SOL.
 */
export const SERVICE_FEE_CREATE_TOKEN_SOL = 0.122;
export const SERVICE_FEE_BURN_TOKEN_SOL = 0.059;
export const SERVICE_FEE_AIRDROP_SOL = 0.059;
export const SERVICE_FEE_MANAGE_AUTHORITY_SOL = 0.059;
// MODIFICAÇÃO: Taxa de serviço para criação de pool de liquidez atualizada
export const SERVICE_FEE_CREATE_LP_SOL = 0.5;


/**
 * Taxas de serviço em Lamports (a menor unidade do SOL).
 */
export const SERVICE_FEE_CREATE_TOKEN_LAMPORTS = SERVICE_FEE_CREATE_TOKEN_SOL * LAMPORTS_PER_SOL;
export const SERVICE_FEE_BURN_TOKEN_LAMPORTS = SERVICE_FEE_BURN_TOKEN_SOL * LAMPORTS_PER_SOL;
export const SERVICE_FEE_AIRDROP_LAMPORTS = SERVICE_FEE_AIRDROP_SOL * LAMPORTS_PER_SOL;
export const SERVICE_FEE_MANAGE_AUTHORITY_LAMPORTS = SERVICE_FEE_MANAGE_AUTHORITY_SOL * LAMPORTS_PER_SOL;
// MODIFICAÇÃO: Adicionada nova taxa de serviço para pool de liquidez em lamports
export const SERVICE_FEE_CREATE_LP_LAMPORTS = SERVICE_FEE_CREATE_LP_SOL * LAMPORTS_PER_SOL;
