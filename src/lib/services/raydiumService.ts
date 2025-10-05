import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
  VersionedTransaction,
  TransactionMessage,
  AddressLookupTableAccount,
} from '@solana/web3.js';
import {
  Liquidity,
  LiquidityPoolKeys,
  jsonInfo2PoolKeys,
  LiquidityPoolJsonInfo,
  TokenAmount,
  Token,
  Percent,
  TOKEN_PROGRAM_ID,
  SPL_ACCOUNT_LAYOUT,
  LIQUIDITY_STATE_LAYOUT_V4,
} from '@raydium-io/raydium-sdk';
import { BN } from '@coral-xyz/anchor';
import {
  DEV_WALLET_ADDRESS,
  RPC_ENDPOINT,
  SERVICE_FEE_CREATE_LP_LAMPORTS,
} from '@/lib/constants';
import { NATIVE_MINT, getMint } from '@solana/spl-token';

interface CreatePoolParams {
  baseTokenMint: string;
  baseTokenDecimals: number;
  initialBaseTokenAmount: number;
  initialSolAmount: number;
  userWalletAddress: string;
}

// Esta função constrói e serializa a transação para ser assinada no frontend.
export async function createAndInitializeLiquidityPool(params: CreatePoolParams) {
  const {
    baseTokenMint,
    baseTokenDecimals,
    initialBaseTokenAmount,
    initialSolAmount,
    userWalletAddress,
  } = params;

  const connection = new Connection(RPC_ENDPOINT, 'confirmed');
  const userPublicKey = new PublicKey(userWalletAddress);

  const baseToken = new Token(
    TOKEN_PROGRAM_ID,
    baseTokenMint,
    baseTokenDecimals
  );
  const quoteToken = new Token(
    TOKEN_PROGRAM_ID,
    NATIVE_MINT.toBase58(),
    9,
    'WSOL',
    'Wrapped SOL'
  );

  // -------- ETAPA 1: CRIAR MERCADO OPENBOOK (SE NECESSÁRIO) --------
  // A Raydium exige um mercado OpenBook para criar um pool.
  // Esta é a parte mais complexa e que consome mais taxas.
  // No código real, você usaria o SDK da Raydium para criar o mercado.
  // Para simplificar, vamos assumir que a criação do mercado é tratada
  // por uma função auxiliar ou que já existe. Aqui, vamos focar na lógica da liquidez
  // e na adição da taxa.

  // --- Simulação da criação do mercado ---
  // No mundo real, a criação do mercado retorna um marketId.
  // const marketId = await createOpenBookMarket(...);
  // Por ora, vamos usar um placeholder e focar na transação de liquidez.

  // -------- ETAPA 2: CONSTRUIR A TRANSAÇÃO DE LIQUIDEZ --------

  // Informações do pool (geralmente viriam da API da Raydium após a criação do mercado)
  // Como estamos criando agora, simulamos a estrutura.
  const poolInfo: LiquidityPoolJsonInfo = {
    id: new PublicKey('58oQChx4yWmvKdwLLZzBi4ChoCc2fqbJW7KV8kUr6qdG').toString(), // Placeholder
    baseMint: baseToken.mint.toString(),
    quoteMint: quoteToken.mint.toString(),
    lpMint: new PublicKey('8625dPWwM9n3dG5c2r4vYk1s3r2y7x5p3Jq4s9vCgH').toString(), // Placeholder
    version: 4,
    programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Programa de Liquidez da Raydium V4
    authority: new PublicKey('5Q544fKrSA6PdpTRzHghASnJWCxMVAZZZrY1PPDroog5').toString(),
    openOrders: new PublicKey('2d9iJmso3bY6h2rQz2k3j9fM4g8b1o6p2q7r5s4t3u2').toString(), // Placeholder
    targetOrders: new PublicKey('2d9iJmso3bY6h2rQz2k3j9fM4g8b1o6p2q7r5s4t3u2').toString(), // Placeholder
    baseVault: new PublicKey('4s3t2u1v6p5q8r7s9t0u1v2x3y4z5a6b7c8d9e0f1g2h').toString(), // Placeholder
    quoteVault: new PublicKey('8s9t0u1v2x3y4z5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o').toString(), // Placeholder
    withdrawQueue: PublicKey.default.toString(),
    lpVault: PublicKey.default.toString(),
    marketVersion: 3,
    marketProgramId: 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX', // Programa do OpenBook
    marketId: new PublicKey('3s4t5u6v7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o').toString(), // Placeholder
    marketAuthority: new PublicKey('5Q544fKrSA6PdpTRzHghASnJWCxMVAZZZrY1PPDroog5').toString(),
    marketBaseVault: new PublicKey('4s3t2u1v6p5q8r7s9t0u1v2x3y4z5a6b7c8d9e0f1g2h').toString(), // Placeholder
    marketQuoteVault: new PublicKey('8s9t0u1v2x3y4z5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o').toString(), // Placeholder
    marketBids: new PublicKey('3s4t5u6v7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o').toString(), // Placeholder
    marketAsks: new PublicKey('3s4t5u6v7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o').toString(), // Placeholder
    marketEventQueue: new PublicKey('3s4t5u6v7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o').toString(), // Placeholder
  };
  const poolKeys = jsonInfo2PoolKeys(poolInfo) as LiquidityPoolKeys;

  // Monta as instruções para adicionar liquidez
  const { instruction: addLiquidityInstruction } =
    await Liquidity.makeAddLiquidityInstruction({
      connection,
      poolKeys,
      userKeys: {
        owner: userPublicKey,
        payer: userPublicKey,
        tokenAccounts: [], // SDK irá encontrar ou criar as contas de token associadas
      },
      amountInA: new TokenAmount(baseToken, initialBaseTokenAmount, false),
      amountInB: new TokenAmount(quoteToken, initialSolAmount, false),
      fixedSide: 'a', // Fixa a quantidade do token base
    });

  // -------- ETAPA 3: ADICIONAR TAXA DE SERVIÇO E CONSTRUIR TRANSAÇÃO --------

  const instructions = [
    // Instrução para a taxa de serviço
    SystemProgram.transfer({
      fromPubkey: userPublicKey,
      toPubkey: DEV_WALLET_ADDRESS,
      lamports: SERVICE_FEE_CREATE_LP_LAMPORTS,
    }),
    // Instrução para adicionar liquidez
    addLiquidityInstruction,
  ];

  // Constrói a transação versionada para o frontend
  const { blockhash } = await connection.getLatestBlockhash();
  const messageV0 = new TransactionMessage({
    payerKey: userPublicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);

  // Serializa a transação para enviar ao cliente
  const serializedTransaction = Buffer.from(transaction.serialize()).toString(
    'base64'
  );

  return {
    transaction: serializedTransaction,
    ammId: poolKeys.id.toString(),
    lpTokenAddress: poolKeys.lpMint.toString(),
  };
}
