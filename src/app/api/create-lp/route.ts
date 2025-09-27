import { NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, ComputeBudgetProgram, TransactionInstruction } from '@solana/web3.js';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_CREATE_LP_LAMPORTS } from '@/lib/constants';
import { Liquidity, DEVNET_PROGRAM_ID, MAINNET_PROGRAM_ID, Market, TxVersion, Token } from '@raydium-io/raydium-sdk';
import { NATIVE_MINT, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from "bn.js";

interface CreateLpRequest {
    wallet: string;
    baseMint: string;
    quoteMint: string;
    baseAmount: number;
    quoteAmount: number;
    marketId: string;
    baseDecimals: number;
}

export async function POST(request: Request) {
    try {
        const { wallet, baseMint, quoteMint, baseAmount, quoteAmount, marketId, baseDecimals }: CreateLpRequest = await request.json();

        if (!wallet || !baseMint || !quoteMint || !baseAmount || !quoteAmount || !marketId || baseDecimals === undefined) {
            return NextResponse.json({ error: 'Dados da requisição incompletos.' }, { status: 400 });
        }

        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const userPublicKey = new PublicKey(wallet);

        const quotePublicKey = new PublicKey(quoteMint);
        if (!quotePublicKey.equals(NATIVE_MINT)) {
            return NextResponse.json({ error: 'O token de cotação deve ser SOL para este endpoint.' }, { status: 400 });
        }
        
        // CORREÇÃO: Usar a classe Token do SDK do Raydium em vez de objetos simples ou TokenInfo.
        const baseToken = new Token(TOKEN_PROGRAM_ID, new PublicKey(baseMint), baseDecimals);
        const quoteToken = new Token(TOKEN_PROGRAM_ID, NATIVE_MINT, 9, 'SOL', 'SOL');
        
        const { innerTransactions } = await Liquidity.makeCreatePoolV4InstructionV2Simple({
            connection,
            programId: DEVNET_PROGRAM_ID.AmmV4,
            marketInfo: {
                marketId: new PublicKey(marketId),
                programId: DEVNET_PROGRAM_ID.OPENBOOK_MARKET,
            },
            baseMintInfo: baseToken,
            quoteMintInfo: quoteToken,
            baseAmount: new BN(Math.floor(baseAmount * Math.pow(10, baseToken.decimals))),
            quoteAmount: new BN(Math.floor(quoteAmount * Math.pow(10, quoteToken.decimals))),
            startTime: new BN(0),
            ownerInfo: {
                feePayer: userPublicKey,
                wallet: userPublicKey,
                tokenAccounts: [],
                useSOLBalance: true,
            },
            associatedOnly: true,
            checkCreateATAOwner: true,
            makeTxVersion: TxVersion.V0,
            feeDestinationId: new PublicKey("7YttLkHDoNj9wyDur5pM1A4MG1m8RHj9tBg2VtfGTvn2"),
        });

        let allInstructions: TransactionInstruction[] = [];
        for (const tx of innerTransactions) {
            allInstructions.push(...tx.instructions);
        }

        const instructions: TransactionInstruction[] = [
            ComputeBudgetProgram.setComputeUnitLimit({ units: 800_000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25_000 }),
            SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: DEV_WALLET_ADDRESS,
                lamports: SERVICE_FEE_CREATE_LP_LAMPORTS,
            }),
            ...allInstructions
        ];

        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        
        const messageV0 = new TransactionMessage({
            payerKey: userPublicKey,
            recentBlockhash: blockhash,
            instructions,
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);

        for (const tx of innerTransactions) {
            transaction.sign(tx.signers);
        }

        const serializedTransaction = transaction.serialize();
        const base64Transaction = Buffer.from(serializedTransaction).toString('base64');

        return NextResponse.json({ transaction: base64Transaction });

    } catch (error) {
        console.error('Erro ao criar pool de liquidez:', error);
        return NextResponse.json({ error: 'Erro interno do servidor ao criar a transação.' }, { status: 500 });
    }
}

