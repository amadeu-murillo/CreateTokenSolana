// src/app/api/create-market/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { MarketV2, Token, TOKEN_PROGRAM_ID } from '@raydium-io/raydium-sdk';
import { NATIVE_MINT } from '@solana/spl-token';
// Importando suas constantes centralizadas
import { DEV_WALLET_ADDRESS, SERVICE_FEE_CREATE_LP_LAMPORTS } from '@/lib/constants';

export async function POST(req: NextRequest) {
    try {
        const { baseMint, quoteMint, wallet, baseDecimals } = await req.json();
        const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_HOST!);
        const payer = new PublicKey(wallet);

        const baseToken = new Token(TOKEN_PROGRAM_ID, new PublicKey(baseMint), baseDecimals);
        const quoteToken = new Token(TOKEN_PROGRAM_ID, NATIVE_MINT, 9, 'WSOL', 'Wrapped SOL');

        const { innerTransactions, address } = await MarketV2.makeCreateMarketInstructionSimple({
            connection,
            wallet: payer,
            baseInfo: baseToken,
            quoteInfo: quoteToken,
            lotSize: 1, 
            tickSize: 0.000001,
            dexProgramId: new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
            makeTxVersion: 0, 
        });

        const marketTransaction = new Transaction();
        innerTransactions[0].instructions.forEach(instruction => marketTransaction.add(instruction));
        
        // Adiciona a instrução da taxa de serviço usando sua constante em Lamports
        marketTransaction.add(
            SystemProgram.transfer({
                fromPubkey: payer,
                toPubkey: DEV_WALLET_ADDRESS,
                lamports: SERVICE_FEE_CREATE_LP_LAMPORTS, // Usando sua constante
            })
        );

        const finalTransaction = marketTransaction;
        const { blockhash } = await connection.getLatestBlockhash();
        finalTransaction.recentBlockhash = blockhash;
        finalTransaction.feePayer = payer;

        innerTransactions[0].signers.forEach(signer => {
            finalTransaction.partialSign(signer);
        });

        const serializedTransaction = finalTransaction.serialize({
            requireAllSignatures: false,
        });

        return NextResponse.json({
            transaction: serializedTransaction.toString('base64'),
            marketId: address.marketId.toBase58(),
        });

    } catch (error: any) {
        console.error("Erro ao criar o mercado:", error);
        return NextResponse.json({ error: `Erro no servidor: ${error.message}` }, { status: 500 });
    }
}