// src/app/api/create-token/route.ts
import { NextResponse } from 'next/server';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType
} from '@solana/spl-token';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_LAMPORTS } from '@/lib/constants';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createV1, mplTokenMetadata, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import { transactionBuilder, createSignerFromKeypair, percentAmount } from '@metaplex-foundation/umi'; // <<< CORREÇÃO AQUI

export async function POST(request: Request) {
  try {
    const { name, symbol, imageUrl, decimals, supply, wallet, mintAuthority, freezeAuthority } = await request.json();

    if (!name || !symbol || !imageUrl || decimals === undefined || !supply || !wallet) {
      return NextResponse.json({ error: 'Dados incompletos fornecidos.' }, { status: 400 });
    }

    const userPublicKey = new PublicKey(wallet);
    const mintKeypair = Keypair.generate();
    
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');

    const umi = createUmi(RPC_ENDPOINT);
    
    // Adaptar o Keypair do web3.js para um Signer do Umi
    const umiSigner = createSignerFromKeypair(umi, fromWeb3JsKeypair(mintKeypair));
    
    // Construir as instruções com Umi
    const createMetadataIx = createV1(umi, {
        mint: fromWeb3JsPublicKey(mintKeypair.publicKey),
        authority: umiSigner,
        name: name,
        symbol: symbol,
        uri: imageUrl,
        sellerFeeBasisPoints: percentAmount(0, 2), // <<< CORREÇÃO AQUI
        tokenStandard: TokenStandard.Fungible,
        isMutable: true,
        collection: null,
        uses: null,
    }).getInstructions();

    // Converter as instruções do Umi para o formato do web3.js
    const web3Instructions = createMetadataIx.map(ix => ({
        keys: ix.keys.map(key => ({
            pubkey: new PublicKey(key.pubkey),
            isSigner: key.isSigner,
            isWritable: key.isWritable,
        })),
        programId: new PublicKey(ix.programId),
        data: Buffer.from(ix.data),
    }));

    const rentLamports = await getMinimumBalanceForRentExemptMint(connection);
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      userPublicKey
    );

    const transaction = new Transaction({
        feePayer: userPublicKey,
        ...(await connection.getLatestBlockhash('confirmed')),
    }).add(
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: DEV_WALLET_ADDRESS,
        lamports: SERVICE_FEE_LAMPORTS,
      }),
      SystemProgram.createAccount({
        fromPubkey: userPublicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: rentLamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        userPublicKey,
        freezeAuthority ? userPublicKey : null,
        TOKEN_PROGRAM_ID
      ),
      createAssociatedTokenAccountInstruction(
        userPublicKey,
        associatedTokenAccount,
        userPublicKey,
        mintKeypair.publicKey
      ),
      createMintToInstruction(
        mintKeypair.publicKey,
        associatedTokenAccount,
        userPublicKey,
        BigInt(supply * Math.pow(10, decimals))
      ),
      ...web3Instructions
    );

    if (!mintAuthority) {
        transaction.add(
            createSetAuthorityInstruction(
                mintKeypair.publicKey,
                userPublicKey,
                AuthorityType.MintTokens,
                null
            )
        );
    }

    transaction.partialSign(mintKeypair);

    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
    });
    
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