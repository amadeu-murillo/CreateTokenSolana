import { NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, ComputeBudgetProgram } from '@solana/web3.js';
import { createBurnInstruction, getAssociatedTokenAddress, getMint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_BURN_TOKEN_LAMPORTS } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const { mint, amount, wallet, programId } = await request.json();

    if (!mint || !amount || !wallet || !programId) {
      return NextResponse.json({ error: 'Dados incompletos: mint, amount, wallet e programId são obrigatórios.' }, { status: 400 });
    }

    // Valida se o programId é um dos conhecidos
    if (programId !== TOKEN_PROGRAM_ID.toBase58() && programId !== TOKEN_2022_PROGRAM_ID.toBase58()) {
        return NextResponse.json({ error: 'Program ID inválido.' }, { status: 400 });
    }

    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const userPublicKey = new PublicKey(wallet);
    const mintPublicKey = new PublicKey(mint);
    const tokenProgramId = new PublicKey(programId);

    // Buscar as informações do mint para obter os decimais
    const mintInfo = await getMint(connection, mintPublicKey, 'confirmed', tokenProgramId);

    const associatedTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey, 
        userPublicKey,
        false,
        tokenProgramId // Usa o programId correto
    );

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
            BigInt(amount * Math.pow(10, mintInfo.decimals)),
            [],
            tokenProgramId // Usa o programId correto
        )
    ];

    const { blockhash } = await connection.getLatestBlockhash('confirmed');

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
