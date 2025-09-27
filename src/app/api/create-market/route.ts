// src/app/api/create-market/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { MarketV2, Token, TOKEN_PROGRAM_ID, DEVNET_PROGRAM_ID } from '@raydium-io/raydium-sdk';
import { NATIVE_MINT } from '@solana/spl-token';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_CREATE_LP_LAMPORTS } from '@/lib/constants';

export async function POST(req: NextRequest) {
    try {
        const { baseMint, quoteMint, wallet, baseDecimals } = await req.json();

        if (!baseMint || !quoteMint || !wallet || baseDecimals === undefined) {
            return NextResponse.json({ error: 'Parâmetros ausentes.' }, { status: 400 });
        }

        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const payer = new PublicKey(wallet);

        const baseToken = new Token(TOKEN_PROGRAM_ID, new PublicKey(baseMint), baseDecimals);
        const quoteToken = new Token(TOKEN_PROGRAM_ID, NATIVE_MINT, 9, 'WSOL', 'Wrapped SOL');

        // A criação de mercado retorna múltiplas transações que precisam ser enviadas sequencialmente
        const { innerTransactions, address } = await MarketV2.makeCreateMarketInstructionSimple({
            connection,
            wallet: payer,
            baseInfo: baseToken,
            quoteInfo: quoteToken,
            lotSize: 1, 
            tickSize: 0.000001,
            dexProgramId: DEVNET_PROGRAM_ID.OPENBOOK_MARKET, // FIX: Usa o ID correto do OpenBook para devnet
            makeTxVersion: 0, // Usa transações legadas para simplificar a assinatura parcial
        });

        // Adiciona a taxa de serviço à primeira transação
        innerTransactions[0].instructions.unshift(
            SystemProgram.transfer({
                fromPubkey: payer,
                toPubkey: DEV_WALLET_ADDRESS,
                lamports: SERVICE_FEE_CREATE_LP_LAMPORTS,
            })
        );
        
        const { blockhash } = await connection.getLatestBlockhash('confirmed');

        const transactions = innerTransactions.map(tx => {
            const transaction = new Transaction();
            transaction.add(...tx.instructions);
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = payer;

            tx.signers.forEach(signer => {
                transaction.partialSign(signer);
            });

            return transaction.serialize({ requireAllSignatures: false }).toString('base64');
        });

        return NextResponse.json({
            transactions: transactions, // Retorna um array de transações
            marketId: address.marketId.toBase58(),
        });

    } catch (error: any) {
        console.error("Erro ao criar o mercado:", error);
        return NextResponse.json({ error: `Erro no servidor: ${error.message}` }, { status: 500 });
    }
}

