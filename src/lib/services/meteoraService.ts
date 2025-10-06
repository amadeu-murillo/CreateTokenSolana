import {
  Connection,
  PublicKey,
  VersionedTransaction,
  TransactionMessage,
  ComputeBudgetProgram,
  SystemProgram,
  TransactionInstruction,
  Keypair,
} from '@solana/web3.js';
import {
  NATIVE_MINT,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import DLMM from '@meteora-ag/dlmm';
import BN from 'bn.js';
import Decimal from 'decimal.js';

// seus constantes (RPC_ENDPOINT, DEV_WALLET_ADDRESS, SERVICE_FEE_CREATE_LP_LAMPORTS)
import {
  DEV_WALLET_ADDRESS,
  RPC_ENDPOINT,
  SERVICE_FEE_CREATE_LP_LAMPORTS,
} from '@/lib/constants';

const BASIS_POINT_MAX = 10_000;
const BIN_ID_OFFSET = 1 << 23; // 8388608 (usado nos exemplos da doc)

/**
 * Converte um price (quotePerBase, ex: SOL per TOKEN) para activeBinId (BN)
 */
function priceToActiveBinId(price: number, binStep: number): { activeId: BN, activeIndex: number } {
  if (!isFinite(price) || price <= 0) throw new Error('Preço inválido para conversão.');
  const ratio = 1 + binStep / BASIS_POINT_MAX;
  const activeIndex = Math.log(price) / Math.log(ratio);
  const activeId = Math.round(activeIndex) + BIN_ID_OFFSET;
  return { activeId: new BN(activeId), activeIndex };
}

/**
 * Constrói a transação (unsigned) para criar o LB pair.
 */
export async function buildCreatePairTx(params: {
  baseTokenMint: string;
  baseTokenDecimals: number;
  initialBaseTokenAmount: number;
  initialSolAmount: number;
  userWalletAddress: string;
  binStep?: number; // opcional
}) {
  const {
    baseTokenMint,
    baseTokenDecimals,
    initialBaseTokenAmount,
    initialSolAmount,
    userWalletAddress,
    binStep = 25, 
  } = params;

  if (initialBaseTokenAmount <= 0 || initialSolAmount <= 0) {
    throw new Error('As quantidades devem ser maiores que zero.');
  }

  const connection = new Connection(RPC_ENDPOINT, 'confirmed');
  const userPublicKey = new PublicKey(userWalletAddress);

  const tokenAMint = new PublicKey(baseTokenMint);
  const tokenBMint = NATIVE_MINT; // WSOL

  const amountA = new BN(
    new Decimal(initialBaseTokenAmount)
      .mul(new Decimal(10).pow(baseTokenDecimals))
      .toFixed(0)
  );
  const amountB = new BN(
    new Decimal(initialSolAmount)
      .mul(new Decimal(10).pow(9))
      .toFixed(0)
  );

  // O preço é calculado usando as menores unidades (atoms e lamports) para
  // máxima precisão, evitando erros de ponto flutuante com valores normalizados.
  const price = new Decimal(amountB.toString())
    .div(new Decimal(amountA.toString()))
    .toNumber();
    
  console.log(`[Debug Meteora] Usando binStep: ${binStep}`);
  console.log(`[Debug Meteora] Preço (SOL por Token) calculado: ${price.toExponential()}`);

  if (!isFinite(price) || price <= 0) {
    throw new Error(`Preço inicial inválido ou extremo calculado: ${price}`);
  }

  const { activeId, activeIndex } = priceToActiveBinId(price, binStep);
  console.log(`[Debug Meteora] activeIndex calculado: ${Math.round(activeIndex)}`);
  console.log(`[Debug Meteora] activeBinId calculado: ${activeId.toString()}`);

  // --- VALIDAÇÃO DE PREÇO EXTREMO (FINAL E MAIS RÍGIDA) ---
  // Os logs confirmaram que a simulação on-chain falha mesmo com um activeIndex de -926.
  // Isso indica que o programa da Meteora exige uma proporção de preço inicial
  // muito mais próxima de 1. Reduzimos drasticamente o limite para forçar isso.
  const PRICE_INDEX_SAFETY_LIMIT = 500;
  if (Math.abs(activeIndex) > PRICE_INDEX_SAFETY_LIMIT) {
    throw new Error(
      `A proporção de preço é muito extrema (Índice: ${Math.round(activeIndex)}). Por favor, use uma proporção de valores mais próxima.`
    );
  }

  const binStepBN = new BN(binStep);

  const createPairTx = await DLMM.createCustomizablePermissionlessLbPair(
    connection,
    binStepBN,
    tokenAMint,
    tokenBMint,
    activeId,
    new BN(100),
    0,
    false,
    userPublicKey,
    undefined,
    false,
    { cluster: 'devnet' } 
  );

  const { blockhash } = await connection.getLatestBlockhash('confirmed');

  const messageV0 = new TransactionMessage({
    payerKey: userPublicKey,
    recentBlockhash: blockhash,
    instructions: [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }),
      ...createPairTx.instructions,
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: new PublicKey(DEV_WALLET_ADDRESS),
        lamports: SERVICE_FEE_CREATE_LP_LAMPORTS,
      }),
    ],
  }).compileToV0Message();

  const versionedTx = new VersionedTransaction(messageV0);
  const serialized = Buffer.from(versionedTx.serialize()).toString('base64');

  return {
    serializedCreateTxBase64: serialized,
    activeBinId: activeId.toString(),
    binStep,
    amountA: amountA.toString(),
    amountB: amountB.toString(),
  };
}

/**
 * Adiciona liquidez a um par já existente.
 */
export async function buildAddLiquidityTx(params: {
  pairAddress: string;
  baseTokenDecimals: number;
  addBaseAmount: number;
  addSolAmount: number;
  userWalletAddress: string;
  minBinOffset?: number; 
  maxBinOffset?: number; 
}) {
  const {
    pairAddress,
    baseTokenDecimals,
    addBaseAmount,
    addSolAmount,
    userWalletAddress,
    minBinOffset = -5,
    maxBinOffset = 5,
  } = params;

  if (addBaseAmount <= 0 || addSolAmount <= 0) {
    throw new Error('Quantias para adicionar devem ser > 0.');
  }

  const connection = new Connection(RPC_ENDPOINT, 'confirmed');
  const userPublicKey = new PublicKey(userWalletAddress);
  const pairPubkey = new PublicKey(pairAddress);

  const dlmmPool = await DLMM.create(connection, pairPubkey);

  const totalXAmount = new BN(new Decimal(addBaseAmount).mul(new Decimal(10).pow(baseTokenDecimals)).toFixed(0));
  const totalYAmount = new BN(new Decimal(addSolAmount).mul(new Decimal(10).pow(9)).toFixed(0));

  await dlmmPool.refetchStates();
  const activeBin = dlmmPool.lbPair.activeId;

  const minBinId = new BN((new BN(activeBin).toNumber() + minBinOffset));
  const maxBinId = new BN((new BN(activeBin).toNumber() + maxBinOffset));

  const strategy = {
    strategyType: 0, 
    minBinId: minBinId.toNumber(),
    maxBinId: maxBinId.toNumber(),
  };

  const positionKeypair = Keypair.generate();

  const initAddTx = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
    positionPubKey: positionKeypair.publicKey,
    totalXAmount,
    totalYAmount,
    strategy,
    user: userPublicKey,
    slippage: 0,
  });

  const { blockhash } = await connection.getLatestBlockhash('confirmed');

  const messageV0 = new TransactionMessage({
    payerKey: userPublicKey,
    recentBlockhash: blockhash,
    instructions: [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }),
      ...initAddTx.instructions,
    ],
  }).compileToV0Message();

  const versionedTx = new VersionedTransaction(messageV0);
  const serialized = Buffer.from(versionedTx.serialize()).toString('base64');

  return {
    serializedAddLiquidityTxBase64: serialized,
    positionKeypair: {
      publicKey: positionKeypair.publicKey.toBase58(),
      secretKey: Buffer.from(positionKeypair.secretKey).toString('base64'),
    },
  };
}

