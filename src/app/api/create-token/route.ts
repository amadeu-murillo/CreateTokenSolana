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
  getMintLen,
  ExtensionType,
  createInitializeTransferFeeConfigInstruction,
} from '@solana/spl-token';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_CREATE_TOKEN_LAMPORTS } from '@/lib/constants';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createV1, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import { createNoopSigner, signerIdentity, percentAmount } from '@metaplex-foundation/umi';

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
        isMetadataMutable,
        tokenStandard,
        transferFee,
        affiliate
    } = await request.json();

    if (!name || !symbol || !imageUrl || decimals === undefined || !supply || !wallet) {
      return NextResponse.json({ error: 'Dados incompletos fornecidos.' }, { status: 400 });
    }

    // CORREÇÃO: Garante que 'supply' seja tratado como um número, independentemente do tipo recebido.
    const numericSupply = typeof supply === 'string'
        ? Number(supply.replace(/[^0-9]/g, ''))
        : Number(supply);

    if (isNaN(numericSupply) || numericSupply <= 0) {
        return NextResponse.json({ error: 'Fornecimento inválido.' }, { status: 400 });
    }

    const userPublicKey = new PublicKey(wallet);
    const mintKeypair = Keypair.generate();
    
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const umi = createUmi(RPC_ENDPOINT);
    
    const userUmiSigner = createNoopSigner(fromWeb3JsPublicKey(userPublicKey));
    umi.use(signerIdentity(userUmiSigner));
    
    const programId = tokenStandard === 'token-2022' ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
    
    const extensions = (tokenStandard === 'token-2022' && transferFee && transferFee.basisPoints > 0)
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
    ];

    let affiliatePublicKey: PublicKey | null = null;
    try {
      if (affiliate && affiliate !== userPublicKey.toBase58()) {
        affiliatePublicKey = new PublicKey(affiliate);
      }
    } catch (error) {
      console.warn('Endereço de afiliado inválido recebido:', affiliate);
      affiliatePublicKey = null;
    }

    if (affiliatePublicKey) {
      const affiliateCommission = Math.round(SERVICE_FEE_CREATE_TOKEN_LAMPORTS * 0.10);
      const developerCut = SERVICE_FEE_CREATE_TOKEN_LAMPORTS - affiliateCommission;
      instructions.push(SystemProgram.transfer({ fromPubkey: userPublicKey, toPubkey: affiliatePublicKey, lamports: affiliateCommission }));
      instructions.push(SystemProgram.transfer({ fromPubkey: userPublicKey, toPubkey: DEV_WALLET_ADDRESS, lamports: developerCut }));
    } else {
      instructions.push(SystemProgram.transfer({ fromPubkey: userPublicKey, toPubkey: DEV_WALLET_ADDRESS, lamports: SERVICE_FEE_CREATE_TOKEN_LAMPORTS }));
    }

    instructions.push(
        SystemProgram.createAccount({
            fromPubkey: userPublicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: mintLen,
            lamports: rentLamports,
            programId: programId,
        })
    );

    if (extensions.length > 0) {
        instructions.push(
            createInitializeTransferFeeConfigInstruction(
                mintKeypair.publicKey,
                userPublicKey,
                userPublicKey,
                transferFee.basisPoints,
                BigInt(transferFee.maxFee * Math.pow(10, decimals)),
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
            BigInt(numericSupply * Math.pow(10, decimals)), // Usa a variável corrigida
            [],
            programId
        )
    );
      
    const createMetadataIx = createV1(umi, {
        mint: fromWeb3JsPublicKey(mintKeypair.publicKey),
        authority: userUmiSigner,
        name: name,
        symbol: symbol,
        uri: imageUrl,
        sellerFeeBasisPoints: percentAmount(0, 2),
        tokenStandard: tokenStandard === 'token-2022' ? TokenStandard.Fungible : TokenStandard.FungibleAsset,
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

