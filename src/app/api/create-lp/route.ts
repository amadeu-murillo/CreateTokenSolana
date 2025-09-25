import { NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, ComputeBudgetProgram, TransactionInstruction } from '@solana/web3.js';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_CREATE_LP_LAMPORTS } from '@/lib/constants';
import { Liquidity, DEVNET_PROGRAM_ID, MAINNET_PROGRAM_ID, Market, TxVersion } from '@raydium-io/raydium-sdk'; // MODIFICAÇÃO: Importa TxVersion
import { NATIVE_MINT, getMint } from '@solana/spl-token';
import BN from "bn.js";

interface CreateLpRequest {
    wallet: string;
    baseMint: string;
    quoteMint: string;
    baseAmount: number;
    quoteAmount: number;
    marketId: string;
}

export async function POST(request: Request) {
    try {
        const { wallet, baseMint, quoteMint, baseAmount, quoteAmount, marketId }: CreateLpRequest = await request.json();

        if (!wallet || !baseMint || !quoteMint || !baseAmount || !quoteAmount || !marketId) {
            return NextResponse.json({ error: 'Dados da requisição incompletos.' }, { status: 400 });
        }

        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const userPublicKey = new PublicKey(wallet);

        const baseMintInfo = await getMint(connection, new PublicKey(baseMint));
        const quoteMintInfo = await getMint(connection, new PublicKey(quoteMint));
        
        // Obter as instruções para criar e inicializar o pool de liquidez do Raydium SDK
        const { innerTransactions } = await Liquidity.makeCreatePoolV4InstructionV2Simple({
            connection,
            programId: MAINNET_PROGRAM_ID.AmmV4, // MODIFICAÇÃO: Corrigido de LIQUIDITY_V4 para AmmV4
            marketInfo: {
                marketId: new PublicKey(marketId),
                programId: MAINNET_PROGRAM_ID.OPENBOOK_MARKET,
            },
            baseMintInfo: { mint: baseMintInfo.address, decimals: baseMintInfo.decimals },
            quoteMintInfo: { mint: quoteMintInfo.address, decimals: quoteMintInfo.decimals },
            baseAmount: new BN(baseAmount * Math.pow(10, baseMintInfo.decimals)),
            quoteAmount: new BN(quoteAmount * Math.pow(10, quoteMintInfo.decimals)),
            startTime: new BN(0),
            ownerInfo: {
                feePayer: userPublicKey,
                wallet: userPublicKey,
                tokenAccounts: [], // O SDK irá encontrar as ATAs corretas
                useSOLBalance: true, // Importante se um dos tokens for SOL
            },
            associatedOnly: true,
            checkCreateATAOwner: true,
            // MODIFICAÇÃO: Adicionadas propriedades obrigatórias
            makeTxVersion: TxVersion.V0, 
            feeDestinationId: new PublicKey("7YttLkHDoNj9wyDur5pM1A4MG1m8RHj9tBg2VtfGTvn2"), // Carteira oficial de taxas da Raydium
        });

        // Coletar todas as instruções em um único array
        let allInstructions: TransactionInstruction[] = [];
        for (const tx of innerTransactions) {
            allInstructions.push(...tx.instructions);
        }

        // Adicionar taxa de serviço e compute budget
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

        // O SDK do Raydium pode exigir a assinatura de contas temporárias que ele cria.
        // Precisamos assinar com esses keypairs antes de enviar para o frontend.
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



