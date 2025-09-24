import { NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
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

    const transaction = new Transaction({
        feePayer: userPublicKey,
        ...(await connection.getLatestBlockhash('confirmed')),
    });
    
    // 1. Adicionar taxa de serviço
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: DEV_WALLET_ADDRESS,
        lamports: SERVICE_FEE_MANAGE_AUTHORITY_LAMPORTS,
      })
    );

    // 2. Adicionar instrução para remover autoridade
    let type: AuthorityType;
    if (authorityType === 'mint') {
        type = AuthorityType.MintTokens;
    } else if (authorityType === 'freeze') {
        type = AuthorityType.FreezeAccount;
    } else {
        return NextResponse.json({ error: 'Tipo de autoridade inválido.' }, { status: 400 });
    }

    transaction.add(
      createSetAuthorityInstruction(
        mintPublicKey,
        userPublicKey,
        type,
        null // Definir a nova autoridade como nula para removê-la
      )
    );

    const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
    const base64Transaction = serializedTransaction.toString('base64');

    return NextResponse.json({
      transaction: base64Transaction,
    });

  } catch (error) {
    console.error('Erro ao gerenciar autoridade:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
