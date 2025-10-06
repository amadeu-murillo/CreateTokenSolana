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
 * formula: price = (1 + bin_step / BASIS_POINT_MAX) ^ active_index
 * => active_index = log(price) / log(1 + bin_step / BASIS_POINT_MAX)
 * armazenamos activeBinId = round(active_index) + BIN_ID_OFFSET
 */
function priceToActiveBinId(price: number, binStep: number): BN {
  if (!isFinite(price) || price <= 0) throw new Error('Preço inválido para conversão.');
  const ratio = 1 + binStep / BASIS_POINT_MAX;
  const activeIndex = Math.log(price) / Math.log(ratio);
  const activeId = Math.round(activeIndex) + BIN_ID_OFFSET;
  return new BN(activeId);
}

/**
 * Constrói a transação (unsigned) para criar o LB pair.
 * - Retorna: { serializedCreateTxBase64, suggestedFeePayer }
 *
 * IMPORTANTE: este TX deve ser assinado e enviado pelo criador/payer (user).
 */
export async function buildCreatePairTx(params: {
  baseTokenMint: string;
  baseTokenDecimals: number;
  initialBaseTokenAmount: number;
  initialSolAmount: number;
  userWalletAddress: string;
  binStep?: number; // opcional, default 25
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

  // amounts em unidades inteiras (BN)
  const amountA = new BN(
    new Decimal(initialBaseTokenAmount)
      .mul(new Decimal(10).pow(baseTokenDecimals))
      .toFixed(0)
  );
  const amountB = new BN(
    new Decimal(initialSolAmount)
      .mul(new Decimal(10).pow(9)) // SOL tem 9 decimais
      .toFixed(0)
  );

  // calcula activeBinId usando a fórmula da doc
  const price = new Decimal(initialSolAmount).div(new Decimal(initialBaseTokenAmount)).toNumber();
  if (!isFinite(price) || price <= 0) {
    throw new Error(`Preço inicial inválido calculado: ${price}`);
  }
  const activeBinId = priceToActiveBinId(price, binStep);

  // binStep e baseFactor exigidos pelo SDK (BN)
  const binStepBN = new BN(binStep);
  const baseFactorBN = new BN(10000); // valor típico (ver docs / preset params se quiser casar)

  // --- Monta a transação de criação do par pelo SDK ---
  // Usamos a função documentada do SDK para criar um pair permissionless customizável.
  // signature: DLMM.createCustomizablePermissionlessLbPair(...)
  // (ver doc SDK Functions).
  const createPairTx = await DLMM.createCustomizablePermissionlessLbPair(
    connection,
    binStepBN,
    tokenAMint,
    tokenBMint,
    activeBinId, // BN
    new BN(100), // feeBps (exemplo 100 = 1%) - ajuste conforme necessário
    0, // activationType (0 = Slot por exemplo). Se preferir, importe ActivationType do SDK.
    false, // hasAlphaVault
    userPublicKey,
    undefined, // activationPoint
    false, // creatorPoolOnOffControl
    { cluster: 'devnet' } // opt (opcional)
  );

  // createPairTx é um web3.Transaction contendo instruções.
  // Montamos um VersionedTransaction (unsigned) e serializamos para base64
  const { blockhash } = await connection.getLatestBlockhash('confirmed');

  const messageV0 = new TransactionMessage({
    payerKey: userPublicKey,
    recentBlockhash: blockhash,
    instructions: [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }),
      ...createPairTx.instructions,
      // adicionamos transferência de taxa para dev (opcional)
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: new PublicKey(DEV_WALLET_ADDRESS),
        lamports: SERVICE_FEE_CREATE_LP_LAMPORTS,
      }),
    ],
  }).compileToV0Message();

  const versionedTx = new VersionedTransaction(messageV0);
  // NÃO assinei nem adicionei signers aqui — deixo para quem irá enviar (wallet do usuário).
  const serialized = Buffer.from(versionedTx.serialize()).toString('base64');

  return {
    serializedCreateTxBase64: serialized,
    // devolvo alguns dados úteis
    activeBinId: activeBinId.toString(),
    binStep,
    amountA: amountA.toString(),
    amountB: amountB.toString(),
  };
}

/**
 * Depois que o par foi criado on-chain (tx confirmada) e você tem o `pairAddress`,
 * use essa função para montar a transação que inicializa a posição e adiciona liquidez.
 *
 * Essa função retorna um unsigned VersionedTransaction (base64) pronto para assinar.
 *
 * Parâmetros mínimos: pairAddress (string), quantias em base/sol (same as above),
 * e o userWalletAddress (payer).
 */
export async function buildAddLiquidityTx(params: {
  pairAddress: string;
  baseTokenDecimals: number;
  addBaseAmount: number;
  addSolAmount: number;
  userWalletAddress: string;
  // opções de strategy:
  minBinOffset?: number; // quantos bins à esquerda do active
  maxBinOffset?: number; // quantos bins à direita do active
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

  // monta dlmmPool (instância da pool criada)
  const dlmmPool = await DLMM.create(connection, pairPubkey);

  // converte amounts para BN
  const totalXAmount = new BN(new Decimal(addBaseAmount).mul(new Decimal(10).pow(baseTokenDecimals)).toFixed(0));
  const totalYAmount = new BN(new Decimal(addSolAmount).mul(new Decimal(10).pow(9)).toFixed(0));

  // Obter activeBin do pool (refetch se necessário)
  await dlmmPool.refetchStates();
  const activeBin = dlmmPool.lbPair.activeId; // normalmente um número/BN

  // Calcular min/max bin ID (relativo)
  const minBinId = new BN((new BN(activeBin).toNumber() + minBinOffset));
  const maxBinId = new BN((new BN(activeBin).toNumber() + maxBinOffset));

  // Strategy simples: SpotBalanced (exemplo). Ajuste conforme SDK/StrategyType do seu pacote.
  const strategy = {
    strategyType: 0, // se quiser, importe StrategyType do SDK
    minBinId: minBinId.toNumber(),
    maxBinId: maxBinId.toNumber(),
  };

  // cria um novo keypair para a posição (é comum a posição ser uma nova account)
  const positionKeypair = Keypair.generate();

  // Gera a transação que inicializa a posição e adiciona liquidez
  const initAddTx = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
    positionPubKey: positionKeypair.publicKey,
    totalXAmount,
    totalYAmount,
    strategy,
    user: userPublicKey,
    slippage: 0,
  });

  // Monta VersionedTransaction (unsigned) com as instruções retornadas
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

  // IMPORTANTE: quem for assinar essa tx precisa também incluir `positionKeypair` como signer.
  // retornamos positionKeypair aqui para que o serviço/cliente saiba o signer necessário.
  return {
    serializedAddLiquidityTxBase64: serialized,
    positionKeypair: {
      publicKey: positionKeypair.publicKey.toBase58(),
      secretKey: Buffer.from(positionKeypair.secretKey).toString('base64'), // **se você gerar no servidor**: trate com segurança!
    },
  };
}
