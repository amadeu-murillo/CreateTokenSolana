// src/app/api/create-market/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction, SystemProgram, VersionedTransaction } from '@solana/web3.js';
import { MarketV2, Token, TOKEN_PROGRAM_ID } from '@raydium-io/raydium-sdk';
import { NATIVE_MINT } from '@solana/spl-token';
import { DEV_WALLET_ADDRESS, SERVICE_FEE_CREATE_LP_LAMPORTS } from '@/lib/constants';

export async function POST(req: NextRequest) {
    try {
        const { baseMint, quoteMint, wallet, baseDecimals } = await req.json();

        if (!baseMint || !quoteMint || !wallet || baseDecimals === undefined) {
            return NextResponse.json({ error: 'Parâmetros ausentes.' }, { status: 400 });
        }

        const connection = new Connection('https://devnet.helius-rpc.com/?api-key=2e9c5f4b-aacf-4903-a787-0c431a50ffff');
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

        const transaction = new Transaction();
        innerTransactions[0].instructions.forEach(instruction => transaction.add(instruction));

        transaction.add(
            SystemProgram.transfer({
                fromPubkey: payer,
                toPubkey: DEV_WALLET_ADDRESS,
                lamports: SERVICE_FEE_CREATE_LP_LAMPORTS,
            })
        );

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = payer;

        innerTransactions[0].signers.forEach(signer => {
            transaction.partialSign(signer);
        });

        const serializedTransaction = transaction.serialize({
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