import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * RF-01: Chave da carteira de desenvolvimento para receber taxas de serviço.
 * MODIFICAÇÃO: Lendo a partir de variáveis de ambiente para maior segurança.
 */
export const DEV_WALLET_ADDRESS = new PublicKey(
    /*process.env.NEXT_PUBLIC_DEV_WALLET_ADDRESS || '4hSVNpgfh1tzn91jgbpH6fVEQ25b63Vd9cvLMJhE3FEf'*/
     'CP6teSg2LUxQsSBBtwZ9xjG2aZjjznhfCvGED9LNgjrJ'
     
);

/**
 * RF-02: Endpoint RPC da Helius para a mainnet.
 * MODIFICAÇÃO: A chave de API agora é gerenciada por variáveis de ambiente.
 */
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
export const RPC_ENDPOINT = 'https://devnet.helius-rpc.com/?api-key=2e9c5f4b-aacf-4903-a787-0c431a50ffff';
export const CLOUDINARY_URL='cloudinary://376481879818689:YfZk9mhp8eVA6xaZOZzHbF2H_qM@dgurmzcht';
 
/*
export const RPC_ENDPOINT = 'https://mainnet.helius-rpc.com/?api-key=2e9c5f4b-aacf-4903-a787-0c431a50ffff';
*/

/**
 * RF-03: Taxas de serviço em SOL.
 */
export const SERVICE_FEE_CREATE_TOKEN_SOL = 0.092;
export const SERVICE_FEE_BURN_TOKEN_SOL = 0.05;
export const SERVICE_FEE_AIRDROP_SOL = 0.05;
export const SERVICE_FEE_MANAGE_AUTHORITY_SOL = 0.05;
// MODIFICAÇÃO: Adicionada nova taxa de serviço para pool de liquidez
export const SERVICE_FEE_CREATE_LP_SOL = 0.1;


/**
 * Taxas de serviço em Lamports (a menor unidade do SOL).
 */
export const SERVICE_FEE_CREATE_TOKEN_LAMPORTS = SERVICE_FEE_CREATE_TOKEN_SOL * LAMPORTS_PER_SOL;
export const SERVICE_FEE_BURN_TOKEN_LAMPORTS = SERVICE_FEE_BURN_TOKEN_SOL * LAMPORTS_PER_SOL;
export const SERVICE_FEE_AIRDROP_LAMPORTS = SERVICE_FEE_AIRDROP_SOL * LAMPORTS_PER_SOL;
export const SERVICE_FEE_MANAGE_AUTHORITY_LAMPORTS = SERVICE_FEE_MANAGE_AUTHORITY_SOL * LAMPORTS_PER_SOL;
// MODIFICAÇÃO: Adicionada nova taxa de serviço para pool de liquidez em lamports
export const SERVICE_FEE_CREATE_LP_LAMPORTS = SERVICE_FEE_CREATE_LP_SOL * LAMPORTS_PER_SOL;
