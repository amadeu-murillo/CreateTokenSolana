import {
    Connection,
    PublicKey,
    SystemProgram,
    VersionedTransaction,
    TransactionMessage,
    ComputeBudgetProgram,
    Keypair,
    TransactionInstruction,
} from '@solana/web3.js';
import {
    DEV_WALLET_ADDRESS,
    RPC_ENDPOINT,
    SERVICE_FEE_CREATE_LP_LAMPORTS,
} from '@/lib/constants';
import { NATIVE_MINT, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createSyncNativeInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import Decimal from 'decimal.js';

// CORREÇÃO: Utiliza 'require' para garantir a compatibilidade com o módulo no ambiente do servidor Next.js
// @ts-ignore
import { DLMM, PriceMath, LbPair } from "@meteora-ag/dlmm-sdk";



interface CreatePoolParams {
    baseTokenMint: string;
    baseTokenDecimals: number;
    initialBaseTokenAmount: number;
    initialSolAmount: number;
    userWalletAddress: string;
}

export async function createMeteoraPoolAndAddLiquidity(params: CreatePoolParams): Promise<{ transaction: string; poolAddress: string }> {
    try {
        if (!PriceMath || !DLMM || !LbPair) {
            console.error("[Meteora Service] Falha ao carregar os módulos do SDK da Meteora.", { DLMM_is_defined: !!DLMM, PriceMath_is_defined: !!PriceMath, LbPair_is_defined: !!LbPair });
            throw new Error("Falha ao carregar os módulos essenciais do SDK da Meteora.");
        }

        const {
            baseTokenMint,
            baseTokenDecimals,
            initialBaseTokenAmount,
            initialSolAmount,
            userWalletAddress,
        } = params;
    
        if (initialBaseTokenAmount <= 0 || initialSolAmount <= 0) {
            throw new Error("As quantidades de token e SOL devem ser maiores que zero.");
        }
    
        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const userPublicKey = new PublicKey(userWalletAddress);
    
        const tokenAMint = new PublicKey(baseTokenMint);
        const tokenBMint = NATIVE_MINT; // WSOL
    
        const amountA = new BN(new Decimal(initialBaseTokenAmount).mul(new Decimal(10).pow(baseTokenDecimals)).toFixed());
        const amountB = new BN(new Decimal(initialSolAmount).mul(new Decimal(10).pow(9)).toFixed());
    
        const binStep = 25;
        
        let initialPrice;
        try {
            const price = Number(initialSolAmount) / Number(initialBaseTokenAmount);
            if (!isFinite(price) || price <= 0) {
                throw new Error(`Preço calculado é inválido: ${price}`);
            }
            initialPrice = PriceMath.priceToBinId(price, binStep);
        } catch (e: any) {
            throw new Error(`Falha ao calcular o preço inicial: ${e.message}`);
        }
    
        const dlmm = new DLMM(connection);
    
        let createPoolTxBuilder;
        try {
            createPoolTxBuilder = await dlmm.createLbPair(
                tokenAMint,
                tokenBMint,
                initialPrice,
                binStep,
                userPublicKey,
            );
        } catch(e: any) {
            throw new Error(`Falha na criação do par de liquidez da Meteora: ${e.message}`);
        }
    
        const lbPairKey = createPoolTxBuilder.lbPair;
    
        const userTokenBAccount = await getAssociatedTokenAddress(tokenBMint, userPublicKey);
    
        const wsolInstructions: TransactionInstruction[] = [];
        const ataExists = await connection.getAccountInfo(userTokenBAccount);
        
        if (!ataExists) {
            wsolInstructions.push(
                createAssociatedTokenAccountInstruction(
                    userPublicKey, userTokenBAccount, userPublicKey, tokenBMint
                )
            );
        }
    
        wsolInstructions.push(
            SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: userTokenBAccount,
                lamports: amountB.toNumber(),
            }),
            createSyncNativeInstruction(userTokenBAccount, TOKEN_PROGRAM_ID)
        );
    
        let addLiquidityTxBuilder;
        try {
            const lbPairState = await LbPair.getLbPair(lbPairKey, connection);
            const lbPairInstance = new LbPair(lbPairState);
        
            const liquidityShape = { amountA, amountB, activeBin: initialPrice, binRange: 10 };
        
            addLiquidityTxBuilder = await lbPairInstance.addLiquidityByRange(userPublicKey, liquidityShape);
        } catch(e: any) {
            throw new Error(`Falha na preparação da liquidez da Meteora: ${e.message}`);
        }
    
        const allInstructions = [
            ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }),
            ...createPoolTxBuilder.transaction.instructions,
            ...wsolInstructions,
            ...addLiquidityTxBuilder.instructions,
            SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: DEV_WALLET_ADDRESS,
                lamports: SERVICE_FEE_CREATE_LP_LAMPORTS,
            })
        ];
    
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
    
        const messageV0 = new TransactionMessage({
            payerKey: userPublicKey,
            recentBlockhash: blockhash,
            instructions: allInstructions,
        }).compileToV0Message();
    
        const transaction = new VersionedTransaction(messageV0);
    
        const signers = [createPoolTxBuilder.lbPairKeypair, ...addLiquidityTxBuilder.signers];
        transaction.sign(signers);
    
        const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64');
    
        return {
            transaction: serializedTransaction,
            poolAddress: lbPairKey.toBase58(),
        };
    } catch (err: any) {
        console.error("--- ERRO FATAL NO SERVIÇO METEORA ---");
        console.error("Mensagem de Erro:", err.message);
        if (err.stack) console.error("Stack Trace:", err.stack);
        console.error("--- FIM DO ERRO FATAL ---");
        throw err;
    }
}

