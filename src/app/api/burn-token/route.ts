import { NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, ComputeBudgetProgram } from '@solana/web3.js';
import { createBurnInstruction, getAssociatedTokenAddress, getMint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_BURN_TOKEN_LAMPORTS } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const { mint, amount, wallet, programId } = await request.json();

    if (!mint || !amount || !wallet || !programId) {
      return NextResponse.json({ error: 'Incomplete data: mint, amount, wallet, and programId are required.' }, { status: 400 });
    }

    // Validate if the programId is one of the known ones
    if (programId !== TOKEN_PROGRAM_ID.toBase58() && programId !== TOKEN_2022_PROGRAM_ID.toBase58()) {
        return NextResponse.json({ error: 'Invalid Program ID.' }, { status: 400 });
    }

    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const userPublicKey = new PublicKey(wallet);
    const mintPublicKey = new PublicKey(mint);
    const tokenProgramId = new PublicKey(programId);

    // Fetch mint information to obtain decimals
    const mintInfo = await getMint(connection, mintPublicKey, 'confirmed', tokenProgramId);

    const associatedTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey, 
        userPublicKey,
        false,
        tokenProgramId // Uses the correct programId
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
            tokenProgramId // Uses the correct programId
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
    console.error('Detailed error while creating burn transaction:', error);
    let errorMessage = 'Internal server error while creating the burn transaction.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
