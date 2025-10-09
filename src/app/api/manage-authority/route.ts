import { NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, ComputeBudgetProgram } from '@solana/web3.js';
import { createSetAuthorityInstruction, AuthorityType, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_MANAGE_AUTHORITY_LAMPORTS } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const { mint, authorityType, wallet, programId } = await request.json();

    if (!mint || !authorityType || !wallet || !programId) {
      return NextResponse.json({ error: 'Incomplete data.' }, { status: 400 });
    }
    
    if (programId !== TOKEN_PROGRAM_ID.toBase58() && programId !== TOKEN_2022_PROGRAM_ID.toBase58()) {
        return NextResponse.json({ error: 'Invalid Program ID.' }, { status: 400 });
    }

    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const userPublicKey = new PublicKey(wallet);
    const mintPublicKey = new PublicKey(mint);
    const tokenProgramId = new PublicKey(programId);

    let type: AuthorityType;
    if (authorityType === 'mint') {
        type = AuthorityType.MintTokens;
    } else if (authorityType === 'freeze') {
        type = AuthorityType.FreezeAccount;
    } else {
        return NextResponse.json({ error: 'Invalid authority type.' }, { status: 400 });
    }
    
    const instructions = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10_000 }),
        SystemProgram.transfer({
            fromPubkey: userPublicKey,
            toPubkey: DEV_WALLET_ADDRESS,
            lamports: SERVICE_FEE_MANAGE_AUTHORITY_LAMPORTS,
        }),
        createSetAuthorityInstruction(
            mintPublicKey,
            userPublicKey,
            type,
            null, // Set new authority to null to remove it
            [],
            tokenProgramId
        )
    ];

    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    
    // MODIFICATION: Building and serializing a VersionedTransaction
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
    console.error('Error managing authority:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
