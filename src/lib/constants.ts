import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * RF-01: Chave da carteira de desenvolvimento para receber taxas de serviço.
 * Esta é a carteira que receberá a taxa de 0.092 SOL por cada token criado.
 */
export const DEV_WALLET_ADDRESS = new PublicKey('4hSVNpgfh1tzn91jgbpH6fVEQ25b63Vd9cvLMJhE3FEf');

/**
 * RF-02: Endpoint RPC da Helius para a mainnet.
 * Usar um RPC dedicado como o da Helius é recomendado para produção para garantir
 * confiabilidade e performance superiores em comparação com os RPCs públicos.
 */
export const RPC_ENDPOINT = 'https://mainnet.helius-rpc.com/?api-key=2e9c5f4b-aacf-4903-a787-0c431a50ffff';

/**
 * RF-03: Taxa de serviço em SOL.
 * Valor fixo cobrado pela plataforma para a criação de um token.
 */
export const SERVICE_FEE_SOL = 0.092;

/**
 * Taxa de serviço em Lamports (a menor unidade do SOL).
 */
export const SERVICE_FEE_LAMPORTS = SERVICE_FEE_SOL * LAMPORTS_PER_SOL;
