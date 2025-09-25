// src/app/api/create-token/route.ts

import { NextResponse } from 'next/server';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  MINT_SIZE,
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
import { createSignerFromKeypair, percentAmount, signerIdentity } from '@metaplex-foundation/umi';

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
        // MODIFICAÇÃO: Recebe novos campos do frontend
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
    
    const umiSigner = createSignerFromKeypair(umi, fromWeb3JsKeypair(mintKeypair));
    umi.use(signerIdentity(umiSigner));
    
    const metadataUri = `${origin}/api/metadata?mint=${mintKeypair.publicKey.toBase58()}`;
    
    // MODIFICAÇÃO: Lógica para determinar o programId (SPL ou Token-2022)
    const programId = tokenStandard === 'token-2022' ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

    // MODIFICAÇÃO: Lógica para calcular o tamanho do mint com base nas extensões
    // Determine o tamanho da conta do mint com base nas extensões
    const extensions = tokenStandard === 'token-2022' ? [ExtensionType.TransferFeeConfig] : [];
    const mintLen = getMintLen(extensions);
    
    // MODIFICAÇÃO: Corrigido o nome da função para obter o rent.
    const rentLamports = await connection.getMinimumBalanceForRentExemption(mintLen);

    const associatedTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      userPublicKey,
      false, // allowOwnerOffCurve
      programId // Use o programId correto
    );

    const transaction = new Transaction({
        feePayer: userPublicKey,
        ...(await connection.getLatestBlockhash('confirmed')),
    });

    transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }), // Aumenta o limite para transações mais complexas
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 })
    );

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: DEV_WALLET_ADDRESS,
        lamports: SERVICE_FEE_CREATE_TOKEN_LAMPORTS,
      }),
      SystemProgram.createAccount({
        fromPubkey: userPublicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: mintLen, // Usa o tamanho calculado
        lamports: rentLamports,
        programId: programId, // Usa o programId correto
      })
    );
      
    // MODIFICAÇÃO: Adiciona a instrução de taxa de transferência se for Token-2022
    if (tokenStandard === 'token-2022' && transferFee && transferFee.basisPoints > 0) {
        transaction.add(
            createInitializeTransferFeeConfigInstruction(
                mintKeypair.publicKey,
                userPublicKey, // transferFeeConfigAuthority
                userPublicKey, // withdrawWithheldAuthority
                transferFee.basisPoints,
                BigInt(transferFee.maxFee),
                programId
            )
        );
    }

    transaction.add(
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        userPublicKey,
        freezeAuthority ? userPublicKey : null,
        programId // Usa o programId correto
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
      
    // MODIFICAÇÃO: Lógica de metadados movida para depois das instruções principais
    const createMetadataIx = createV1(umi, {
        mint: fromWeb3JsPublicKey(mintKeypair.publicKey),
        authority: umiSigner,
        name: name,
        symbol: symbol,
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount(0, 2),
        tokenStandard: tokenStandard === 'token-2022' ? TokenStandard.Fungible : TokenStandard.FungibleAsset,
        isMutable: isMetadataMutable, // Usa o valor do formulário
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
      
    transaction.add(...web3Instructions);

    if (!mintAuthority) {
        transaction.add(
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
      
    transaction.partialSign(mintKeypair);

    const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
    const base64Transaction = serializedTransaction.toString('base64');

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

