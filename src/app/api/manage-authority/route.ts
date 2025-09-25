import { NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, ComputeBudgetProgram } from '@solana/web3.js';
import { createSetAuthorityInstruction, AuthorityType } from '@solana/spl-token';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_MANAGE_AUTHORITY_LAMPORTS } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const { mint, authorityType, wallet } = await request.json();

    if (!mint || !authorityType || !wallet) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const userPublicKey = new PublicKey(wallet);
    const mintPublicKey = new PublicKey(mint);

    let type: AuthorityType;
    if (authorityType === 'mint') {
        type = AuthorityType.MintTokens;
    } else if (authorityType === 'freeze') {
        type = AuthorityType.FreezeAccount;
    } else {
        return NextResponse.json({ error: 'Tipo de autoridade inválido.' }, { status: 400 });
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
            null // Definir a nova autoridade como nula para removê-la
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
    console.error('Erro ao gerenciar autoridade:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
