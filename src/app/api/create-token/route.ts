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
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
  getMintLen,
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
        isMetadataMutable 
    } = await request.json();

    // Validação Simplificada: removido tokenStandard e transferFee
    if (!name || !symbol || !imageUrl || decimals === undefined || !supply || !wallet) {
      return NextResponse.json({ error: 'Dados incompletos fornecidos.' }, { status: 400 });
    }

    const userPublicKey = new PublicKey(wallet);
    const mintKeypair = Keypair.generate();
    
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const umi = createUmi(RPC_ENDPOINT);
    
    // UMI precisa de um signer, mas como a transação será assinada no frontend,
    // usamos um NoopSigner que apenas armazena a chave pública do usuário.
    const userUmiSigner = createNoopSigner(fromWeb3JsPublicKey(userPublicKey));
    umi.use(signerIdentity(userUmiSigner));
    
    // Focando apenas no padrão SPL
    const programId = TOKEN_PROGRAM_ID;
    const mintLen = getMintLen([]); // Sem extensões
    
    const rentLamports = await connection.getMinimumBalanceForRentExemption(mintLen);

    const associatedTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      userPublicKey,
      false,
      programId
    );

    // Instruções para a transação
    const instructions: TransactionInstruction[] = [
        // Otimiza o custo e o processamento da transação
        ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10_000 }),
        
        // Taxa de serviço da plataforma
        SystemProgram.transfer({
            fromPubkey: userPublicKey,
            toPubkey: DEV_WALLET_ADDRESS,
            lamports: SERVICE_FEE_CREATE_TOKEN_LAMPORTS,
        }),

        // Cria a conta para o mint do token
        SystemProgram.createAccount({
            fromPubkey: userPublicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: mintLen,
            lamports: rentLamports,
            programId: programId,
        }),

        // Inicializa o mint com as propriedades definidas
        createInitializeMintInstruction(
            mintKeypair.publicKey,
            decimals,
            userPublicKey, // Mint Authority inicial é o usuário
            freezeAuthority ? userPublicKey : null, // Freeze Authority opcional
            programId
        ),

        // Cria a conta de token associada na carteira do usuário
        createAssociatedTokenAccountInstruction(
            userPublicKey,
            associatedTokenAccount,
            userPublicKey,
            mintKeypair.publicKey,
            programId
        ),

        // Envia (mints) o fornecimento inicial para a conta do usuário
        createMintToInstruction(
            mintKeypair.publicKey,
            associatedTokenAccount,
            userPublicKey,
            BigInt(supply * Math.pow(10, decimals)),
            [],
            programId
        )
    ];
      
    // Cria a instrução para os metadados do token (padrão Metaplex)
    const createMetadataIx = createV1(umi, {
        mint: fromWeb3JsPublicKey(mintKeypair.publicKey),
        authority: userUmiSigner,
        name: name,
        symbol: symbol,
        uri: imageUrl,
        sellerFeeBasisPoints: percentAmount(0, 2), // Taxa de royalties (0% neste caso)
        tokenStandard: TokenStandard.Fungible,
        isMutable: isMetadataMutable,
        payer: userUmiSigner, // O usuário paga pela criação
        updateAuthority: userUmiSigner, // O usuário é a autoridade de atualização
    }).getInstructions();

    // Converte a instrução de Metadados do UMI para o formato do web3.js
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

    // Se o usuário decidiu renunciar à autoridade de mint, adiciona a instrução
    if (!mintAuthority) {
        instructions.push(
            createSetAuthorityInstruction(
                mintKeypair.publicKey,
                userPublicKey,
                AuthorityType.MintTokens,
                null, // A nova autoridade é nula, renunciando ao poder de criar mais tokens
                [],
                programId
            )
        );
    }
      
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    
    // Compila as instruções em uma transação versionada (padrão atual da Solana)
    const messageV0 = new TransactionMessage({
        payerKey: userPublicKey,
        recentBlockhash: blockhash,
        instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);
    // Assina a transação com a chave do mint (criada no backend)
    transaction.sign([mintKeypair]);

    // Serializa a transação para enviar ao frontend e ser assinada pela carteira do usuário
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
