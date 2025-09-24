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

// RF-07: Endpoint para Construção da Transação de Criação de Token
export async function POST(request: Request) {
  try {
    // 1. Extrair e validar os dados do corpo da requisição
    const { decimals, supply, wallet, mintAuthority, freezeAuthority } = await request.json();

    if (decimals === undefined || !supply || !wallet) {
      return NextResponse.json({ error: 'Dados incompletos fornecidos (decimais, supply, wallet).' }, { status: 400 });
    }

    const userPublicKey = new PublicKey(wallet);
    const mintKeypair = Keypair.generate();
    
    // 2. Conectar-se à rede Solana (Mainnet)
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');

    // 3. Calcular o aluguel (rent exemption) para a nova conta do mint
    const rentLamports = await getMinimumBalanceForRentExemptMint(connection);

    // 4. Obter o endereço da Associated Token Account (ATA) do usuário
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      userPublicKey
    );

    // 5. Construir a transação com todas as instruções necessárias
    const transaction = new Transaction({
        feePayer: userPublicKey,
        // Definir um blockhash recente para evitar erros de transação expirada
        ...(await connection.getLatestBlockhash('confirmed')),
    }).add(
      // Instrução 1: Transferir a taxa de serviço para a carteira de desenvolvimento
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: DEV_WALLET_ADDRESS,
        lamports: SERVICE_FEE_LAMPORTS,
      }),
      // Instrução 2: Criar a conta para o mint do novo token, paga pelo usuário
      SystemProgram.createAccount({
        fromPubkey: userPublicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: rentLamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      // Instrução 3: Inicializar o mint com as propriedades do token
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        userPublicKey, // Mint Authority (usuário que pode criar novos tokens)
        freezeAuthority ? userPublicKey : null, // Freeze Authority (usuário que pode congelar contas de token)
        TOKEN_PROGRAM_ID
      ),
      // Instrução 4: Criar la conta de token associada (ATA) para a carteira do usuário
      createAssociatedTokenAccountInstruction(
        userPublicKey,
        associatedTokenAccount,
        userPublicKey,
        mintKeypair.publicKey
      ),
      // Instrução 5: Mintar (criar) o fornecimento inicial para a ATA do usuário
      createMintToInstruction(
        mintKeypair.publicKey,
        associatedTokenAccount,
        userPublicKey, // Mint Authority
        BigInt(supply * Math.pow(10, decimals)) // O fornecimento precisa ser em BigInt
      )
    );

    // Instrução 6 (Opcional): Revogar a autoridade de mint se o usuário desejar
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

    // 6. Serializar a transação com assinatura parcial do mint
    // A carteira do usuário no front-end será a primeira a assinar (como pagador).
    // A assinatura do mintKeypair é necessária pois é uma nova conta sendo criada.
    transaction.partialSign(mintKeypair);

    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false, // A assinatura do usuário (pagador) ainda é necessária
    });
    
    const base64Transaction = serializedTransaction.toString('base64');

    // 7. Retornar a transação serializada e o endereço do mint para o front-end
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