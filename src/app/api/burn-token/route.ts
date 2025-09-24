import { NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { createBurnInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
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

    const associatedTokenAccount = await getAssociatedTokenAddress(mintPublicKey, userPublicKey);

    const transaction = new Transaction({
        feePayer: userPublicKey,
        ...(await connection.getLatestBlockhash('confirmed')),
    });

    // 1. Adicionar taxa de serviço
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: DEV_WALLET_ADDRESS,
        lamports: SERVICE_FEE_BURN_TOKEN_LAMPORTS,
      })
    );

    // 2. Adicionar instrução de queima de token
    transaction.add(
      createBurnInstruction(
        associatedTokenAccount,
        mintPublicKey,
        userPublicKey,
        amount * Math.pow(10, 9) // Assumindo 9 decimais, idealmente buscaria do mint
      )
    );

    const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
    const base64Transaction = serializedTransaction.toString('base64');

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
