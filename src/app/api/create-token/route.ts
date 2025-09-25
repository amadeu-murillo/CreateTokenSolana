// src/app/api/create-token/route.ts

import { NextResponse } from 'next/server';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  ComputeBudgetProgram,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
  ExtensionType,
  getMintLen,
  createInitializeTransferFeeConfigInstruction,
} from '@solana/spl-token';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_CREATE_TOKEN_LAMPORTS } from '@/lib/constants';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createV1, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import { createNoopSigner, createSignerFromKeypair, percentAmount, signerIdentity } from '@metaplex-foundation/umi';

export async function POST(request: Request) {
  try {
    const { 
        name, 
        symbol, 
        imageUrl, 
        decimals, 
        supply, 
        wallet, 
        mintAuthority, 
        freezeAuthority,
        tokenStandard, 
        transferFee, 
        isMetadataMutable 
    } = await request.json();

    const { origin } = new URL(request.url);

    if (!name || !symbol || !imageUrl || decimals === undefined || !supply || !wallet || !tokenStandard) {
      return NextResponse.json({ error: 'Dados incompletos fornecidos.' }, { status: 400 });
    }

    const userPublicKey = new PublicKey(wallet);
    const mintKeypair = Keypair.generate();
    
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const umi = createUmi(RPC_ENDPOINT);
    
    const userUmiSigner = createNoopSigner(fromWeb3JsPublicKey(userPublicKey));
    umi.use(signerIdentity(userUmiSigner));
    const mintKeypairSigner = createSignerFromKeypair(umi, fromWeb3JsKeypair(mintKeypair));
    
    const metadataUri = `${origin}/api/metadata?mint=${mintKeypair.publicKey.toBase58()}`;
    
    const programId = tokenStandard === 'token-2022' ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

    const extensions = tokenStandard === 'token-2022' && transferFee.basisPoints > 0 
        ? [ExtensionType.TransferFeeConfig] 
        : [];
    const mintLen = getMintLen(extensions);
    
    const rentLamports = await connection.getMinimumBalanceForRentExemption(mintLen);

    const associatedTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      userPublicKey,
      false,
      programId
    );

    const instructions: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10_000 }),
        SystemProgram.transfer({
            fromPubkey: userPublicKey,
            toPubkey: DEV_WALLET_ADDRESS,
            lamports: SERVICE_FEE_CREATE_TOKEN_LAMPORTS,
        }),
        SystemProgram.createAccount({
            fromPubkey: userPublicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: mintLen,
            lamports: rentLamports,
            programId: programId,
        }),
    ];

    if (tokenStandard === 'token-2022' && transferFee && transferFee.basisPoints > 0) {
        instructions.push(
            createInitializeTransferFeeConfigInstruction(
                mintKeypair.publicKey,
                userPublicKey,
                userPublicKey,
                transferFee.basisPoints,
                BigInt(transferFee.maxFee),
                programId
            )
        );
    }

    instructions.push(
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        userPublicKey,
        freezeAuthority ? userPublicKey : null,
        programId
      ),
       createAssociatedTokenAccountInstruction(
        userPublicKey,
        associatedTokenAccount,
        userPublicKey,
        mintKeypair.publicKey,
        programId
      ),
      createMintToInstruction(
        mintKeypair.publicKey,
        associatedTokenAccount,
        userPublicKey,
        BigInt(supply * Math.pow(10, decimals)),
        [],
        programId
      )
    );
      
    // CORREÇÃO: A autoridade para criar os metadados DEVE ser a autoridade de mint do token,
    // que é a carteira do usuário (userUmiSigner).
    const createMetadataIx = createV1(umi, {
        mint: fromWeb3JsPublicKey(mintKeypair.publicKey),
        authority: userUmiSigner, // <-- A CORREÇÃO ESTÁ AQUI
        name: name,
        symbol: symbol,
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount(0, 2),
        tokenStandard: TokenStandard.Fungible,
        isMutable: isMetadataMutable,
        payer: userUmiSigner,
        updateAuthority: userUmiSigner,
    }).getInstructions();

    const web3Instructions = createMetadataIx.map(ix => ({
        keys: ix.keys.map(key => ({
            pubkey: new PublicKey(key.pubkey),
            isSigner: key.isSigner,
            isWritable: key.isWritable,
        })),
        programId: new PublicKey(ix.programId),
        data: Buffer.from(ix.data),
    }));
      
    instructions.push(...web3Instructions);

    if (!mintAuthority) {
        instructions.push(
            createSetAuthorityInstruction(
                mintKeypair.publicKey,
                userPublicKey,
                AuthorityType.MintTokens,
                null,
                [],
                programId
            )
        );
    }
      
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    
    const messageV0 = new TransactionMessage({
        payerKey: userPublicKey,
        recentBlockhash: blockhash,
        instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);
    transaction.sign([mintKeypair]);

    const serializedTransaction = transaction.serialize();
    const base64Transaction = Buffer.from(serializedTransaction).toString('base64');

    return NextResponse.json({
      transaction: base64Transaction,
      mintAddress: mintKeypair.publicKey.toBase58(),
    });

  } catch (error) {
    console.error('Erro detalhado ao criar transação:', error);
    let errorMessage = 'Erro interno do servidor ao criar a transação.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

