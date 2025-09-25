import { NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, ComputeBudgetProgram } from '@solana/web3.js';
import { createBurnInstruction, getAssociatedTokenAddress, getMint } from '@solana/spl-token';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_BURN_TOKEN_LAMPORTS } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const { mint, amount, wallet } = await request.json();

    if (!mint || !amount || !wallet) {
      return NextResponse.json({ error: 'Dados incompletos: mint, amount e wallet são obrigatórios.' }, { status: 400 });
    }

    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const userPublicKey = new PublicKey(wallet);
    const mintPublicKey = new PublicKey(mint);

    // Buscar as informações do mint para obter os decimais
    const mintInfo = await getMint(connection, mintPublicKey);

    const associatedTokenAccount = await getAssociatedTokenAddress(mintPublicKey, userPublicKey);

    const instructions = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10_000 }),
        SystemProgram.transfer({
            fromPubkey: userPublicKey,
            toPubkey: DEV_WALLET_ADDRESS,
            lamports: SERVICE_FEE_BURN_TOKEN_LAMPORTS,
        }),
        createBurnInstruction(
            associatedTokenAccount,
            mintPublicKey,
            userPublicKey,
            BigInt(amount * Math.pow(10, mintInfo.decimals))
        )
    ];

    const { blockhash } = await connection.getLatestBlockhash('confirmed');

    // MODIFICAÇÃO: Construindo e serializando uma VersionedTransaction
    const messageV0 = new TransactionMessage({
        payerKey: userPublicKey,
        recentBlockhash: blockhash,
        instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);

    const serializedTransaction = transaction.serialize();
    const base64Transaction = Buffer.from(serializedTransaction).toString('base64');

    return NextResponse.json({
      transaction: base64Transaction,
    });

  } catch (error) {
    console.error('Erro detalhado ao criar transação de queima:', error);
    let errorMessage = 'Erro interno do servidor ao criar a transação de queima.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
