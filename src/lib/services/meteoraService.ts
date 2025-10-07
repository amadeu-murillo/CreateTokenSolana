import {
  Connection,
  PublicKey,
  VersionedTransaction,
  TransactionMessage,
  ComputeBudgetProgram,
  SystemProgram,
  Keypair,
} from '@solana/web3.js';
import {
  NATIVE_MINT,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
} from '@solana/spl-token';
import DLMM from '@meteora-ag/dlmm';
import BN from 'bn.js';
import Decimal from 'decimal.js';

import {
  DEV_WALLET_ADDRESS,
  RPC_ENDPOINT,
  SERVICE_FEE_CREATE_LP_LAMPORTS,
} from '@/lib/constants';

const BASIS_POINT_MAX = 10_000;

/**
 * Converte um price (quotePerBase, ex: SOL per TOKEN) para activeBinId (BN)
 * Fórmula DLMM: price = (1 + binStep/10000)^(binId - 8388608)
 */
function priceToActiveBinId(price: number, binStep: number): { activeId: BN, activeIndex: number } {
  console.log(`[priceToActiveBinId] Input - price: ${price}, binStep: ${binStep}`);
  
  if (!isFinite(price) || price <= 0) {
    throw new Error(`Preço inválido para conversão: ${price}`);
  }
  
  const binStepNum = binStep / BASIS_POINT_MAX;
  console.log(`[priceToActiveBinId] binStepNum: ${binStepNum}`);
  
  // Para DLMM, o preço 1:1 deve resultar em binId próximo ao offset
  // Mas precisamos ajustar ligeiramente para evitar o binId exato do offset
  const adjustedPrice = price === 1 ? 1.0001 : price;
  console.log(`[priceToActiveBinId] adjustedPrice: ${adjustedPrice}`);
  
  const activeIndex = Math.log(adjustedPrice) / Math.log(1 + binStepNum);
  console.log(`[priceToActiveBinId] activeIndex (float): ${activeIndex}`);
  
  const BIN_ID_OFFSET = 8388608; // 1 << 23
  const activeId = Math.round(activeIndex) + BIN_ID_OFFSET;
  console.log(`[priceToActiveBinId] activeId calculado: ${activeId}`);
  
  // Validação de range do Meteora DLMM
  const MIN_BIN_ID = 0;
  const MAX_BIN_ID = (1 << 24) - 1; // 16777215
  
  if (activeId < MIN_BIN_ID || activeId > MAX_BIN_ID) {
    const minPrice = Math.pow(1 + binStepNum, MIN_BIN_ID - BIN_ID_OFFSET);
    const maxPrice = Math.pow(1 + binStepNum, MAX_BIN_ID - BIN_ID_OFFSET);
    console.error(`[priceToActiveBinId] ERRO: activeBinId ${activeId} fora do range [${MIN_BIN_ID}, ${MAX_BIN_ID}]`);
    console.error(`[priceToActiveBinId] Range de preço válido: ${minPrice.toExponential(2)} - ${maxPrice.toExponential(2)}`);
    throw new Error(
      `activeBinId ${activeId} fora do range válido [${MIN_BIN_ID}, ${MAX_BIN_ID}]. ` +
      `Ajuste as quantidades para um preço entre ${minPrice.toExponential(2)} e ${maxPrice.toExponential(2)}`
    );
  }
  
  console.log(`[priceToActiveBinId] ✅ activeBinId válido: ${activeId}`);
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
  feeBps: number;
}) {
  console.log('\n========== INÍCIO buildCreatePairTx ==========');
  console.log('[buildCreatePairTx] Parâmetros recebidos:', JSON.stringify(params, null, 2));
  
  const {
    baseTokenMint,
    baseTokenDecimals,
    initialBaseTokenAmount,
    initialSolAmount,
    userWalletAddress,
    feeBps = 25,
  } = params;

  if (initialBaseTokenAmount <= 0 || initialSolAmount <= 0) {
    throw new Error('As quantidades devem ser maiores que zero.');
  }

  const binStep = feeBps;
  console.log(`[buildCreatePairTx] binStep definido: ${binStep}`);

  const connection = new Connection(RPC_ENDPOINT, 'confirmed');
  const userPublicKey = new PublicKey(userWalletAddress);

  const baseTokenMintPubkey = new PublicKey(baseTokenMint);
  const nativeMintPubkey = NATIVE_MINT; // WSOL

  const tokenX = baseTokenMintPubkey;
  const tokenY = nativeMintPubkey;

  console.log(`[buildCreatePairTx] tokenX (base): ${tokenX.toBase58()}`);
  console.log(`[buildCreatePairTx] tokenY (quote/SOL): ${tokenY.toBase58()}`);

  // Calcular amounts em lamports
  const amountX = new BN(
    new Decimal(initialBaseTokenAmount)
      .mul(new Decimal(10).pow(baseTokenDecimals))
      .toFixed(0)
  );
  const amountY = new BN(
    new Decimal(initialSolAmount)
      .mul(new Decimal(10).pow(9))
      .toFixed(0)
  );

  console.log(`[buildCreatePairTx] amountX (lamports): ${amountX.toString()}`);
  console.log(`[buildCreatePairTx] amountY (lamports): ${amountY.toString()}`);

  // Calcular preço: SOL per TOKEN
  const price = new Decimal(amountY.toString())
    .div(new Decimal(amountX.toString()))
    .toNumber();

  console.log(`[buildCreatePairTx] Preço calculado (SOL per Token): ${price}`);
  console.log(`[buildCreatePairTx] Preço em notação científica: ${price.toExponential()}`);

  if (!isFinite(price) || price <= 0) {
    console.error(`[buildCreatePairTx] ERRO: Preço inválido: ${price}`);
    throw new Error(`Preço inicial inválido ou extremo calculado: ${price}`);
  }

  // Converter preço para activeBinId
  let activeId: BN;
  let activeIndex: number;
  
  try {
    const result = priceToActiveBinId(price, binStep);
    activeId = result.activeId;
    activeIndex = result.activeIndex;
    console.log(`[buildCreatePairTx] ✅ Conversão de preço bem-sucedida`);
  } catch (error) {
    console.error(`[buildCreatePairTx] ERRO na conversão de preço:`, error);
    throw error;
  }

  const binStepBN = new BN(binStep);

  // Criar ATAs
  const userTokenX = await getAssociatedTokenAddress(tokenX, userPublicKey);
  const userTokenY = await getAssociatedTokenAddress(tokenY, userPublicKey);

  console.log(`[buildCreatePairTx] userTokenX ATA: ${userTokenX.toBase58()}`);
  console.log(`[buildCreatePairTx] userTokenY ATA: ${userTokenY.toBase58()}`);

  const preInstructions = [];

  // Verificar e criar ATA para tokenX
  try {
    const tokenXAccountInfo = await connection.getAccountInfo(userTokenX);
    if (!tokenXAccountInfo) {
      console.log(`[buildCreatePairTx] Criando ATA para tokenX`);
      preInstructions.push(
        createAssociatedTokenAccountInstruction(
          userPublicKey,
          userTokenX,
          userPublicKey,
          tokenX
        )
      );
    } else {
      console.log(`[buildCreatePairTx] ATA tokenX já existe`);
    }
  } catch (error) {
    console.error(`[buildCreatePairTx] Erro ao verificar tokenX ATA:`, error);
    throw error;
  }

  // Verificar e criar ATA para tokenY (WSOL)
  try {
    const tokenYAccountInfo = await connection.getAccountInfo(userTokenY);
    if (!tokenYAccountInfo) {
      console.log(`[buildCreatePairTx] Criando ATA para tokenY (WSOL)`);
      preInstructions.push(
        createAssociatedTokenAccountInstruction(
          userPublicKey,
          userTokenY,
          userPublicKey,
          tokenY
        )
      );
    } else {
      console.log(`[buildCreatePairTx] ATA tokenY já existe`);
    }
  } catch (error) {
    console.error(`[buildCreatePairTx] Erro ao verificar tokenY ATA:`, error);
    throw error;
  }

  // Transferir SOL para WSOL ATA
  console.log(`[buildCreatePairTx] Adicionando instrução de transferência SOL: ${amountY.toString()} lamports`);
  preInstructions.push(
    SystemProgram.transfer({
      fromPubkey: userPublicKey,
      toPubkey: userTokenY,
      lamports: amountY.toNumber(),
    })
  );

  // Sync native (wrap SOL)
  console.log(`[buildCreatePairTx] Adicionando instrução syncNative`);
  preInstructions.push(createSyncNativeInstruction(userTokenY));

  console.log("\n--- Parâmetros para createCustomizablePermissionlessLbPair ---");
  console.log(`1. binStep (BN): ${binStepBN.toString()}`);
  console.log(`2. tokenX (Pubkey): ${tokenX.toBase58()}`);
  console.log(`3. tokenY (Pubkey): ${tokenY.toBase58()}`);
  console.log(`4. activeId (BN): ${activeId.toString()}`);
  console.log(`5. feeBps (BN): ${binStepBN.toString()}`);
  console.log(`6. activationType: 0 (Slot)`);
  console.log(`7. hasAlphaVault: false`);
  console.log(`8. creator (Pubkey): ${userPublicKey.toBase58()}`);
  console.log(`9. activationPoint: undefined (ativa imediatamente)`);
  console.log(`10. creatorPoolOnOffControl: false`);
  console.log("------------------------------------------------------------\n");

  let createPairTx;
  try {
    console.log(`[buildCreatePairTx] Chamando DLMM.createCustomizablePermissionlessLbPair...`);
    createPairTx = await DLMM.createCustomizablePermissionlessLbPair(
      connection,
      binStepBN,
      tokenX,
      tokenY,
      activeId,
      binStepBN,
      0,                  // activationType (0 = Slot, 1 = Timestamp)
      false,              // hasAlphaVault
      userPublicKey,      // creator
      undefined,          // activationPoint (null = ativa imediatamente)
      false,              // creatorPoolOnOffControl
      { cluster: 'devnet' }
    );
    console.log(`[buildCreatePairTx] ✅ createCustomizablePermissionlessLbPair retornou com sucesso`);
    console.log(`[buildCreatePairTx] Número de instruções retornadas: ${createPairTx.instructions.length}`);
  } catch (error) {
    console.error(`[buildCreatePairTx] ERRO ao chamar createCustomizablePermissionlessLbPair:`, error);
    throw error;
  }

  // Obter blockhash
  let blockhash;
  try {
    const latestBlockhash = await connection.getLatestBlockhash('confirmed');
    blockhash = latestBlockhash.blockhash;
    console.log(`[buildCreatePairTx] Blockhash obtido: ${blockhash}`);
  } catch (error) {
    console.error(`[buildCreatePairTx] ERRO ao obter blockhash:`, error);
    throw error;
  }

  // Construir mensagem da transação
  const allInstructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }),
    ...preInstructions,
    ...createPairTx.instructions,
    SystemProgram.transfer({
      fromPubkey: userPublicKey,
      toPubkey: new PublicKey(DEV_WALLET_ADDRESS),
      lamports: SERVICE_FEE_CREATE_LP_LAMPORTS,
    }),
  ];

  console.log(`[buildCreatePairTx] Total de instruções na transação: ${allInstructions.length}`);

  const messageV0 = new TransactionMessage({
    payerKey: userPublicKey,
    recentBlockhash: blockhash,
    instructions: allInstructions,
  }).compileToV0Message();

  const versionedTx = new VersionedTransaction(messageV0);
  const serialized = Buffer.from(versionedTx.serialize()).toString('base64');

  console.log(`[buildCreatePairTx] ✅ Transação serializada com sucesso`);
  console.log(`[buildCreatePairTx] Tamanho da transação: ${serialized.length} bytes`);
  console.log('========== FIM buildCreatePairTx ==========\n');

  return {
    serializedCreateTxBase64: serialized,
    activeBinId: activeId.toString(),
    binStep,
    amountX: amountX.toString(),
    amountY: amountY.toString(),
    tokenX: tokenX.toBase58(),
    tokenY: tokenY.toBase58(),
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
  console.log('\n========== INÍCIO buildAddLiquidityTx ==========');
  console.log('[buildAddLiquidityTx] Parâmetros recebidos:', JSON.stringify(params, null, 2));
  
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

  console.log(`[buildAddLiquidityTx] Criando instância DLMM para pool: ${pairPubkey.toBase58()}`);
  
  let dlmmPool;
  try {
    dlmmPool = await DLMM.create(connection, pairPubkey);
    console.log(`[buildAddLiquidityTx] ✅ Instância DLMM criada`);
  } catch (error) {
    console.error(`[buildAddLiquidityTx] ERRO ao criar instância DLMM:`, error);
    throw error;
  }

  const totalXAmount = new BN(new Decimal(addBaseAmount).mul(new Decimal(10).pow(baseTokenDecimals)).toFixed(0));
  const totalYAmount = new BN(new Decimal(addSolAmount).mul(new Decimal(10).pow(9)).toFixed(0));

  console.log(`[buildAddLiquidityTx] totalXAmount: ${totalXAmount.toString()}`);
  console.log(`[buildAddLiquidityTx] totalYAmount: ${totalYAmount.toString()}`);

  try {
    console.log(`[buildAddLiquidityTx] Atualizando estado do pool...`);
    await dlmmPool.refetchStates();
    console.log(`[buildAddLiquidityTx] ✅ Estado do pool atualizado`);
  } catch (error) {
    console.error(`[buildAddLiquidityTx] ERRO ao atualizar estado do pool:`, error);
    throw error;
  }

  const activeBin = dlmmPool.lbPair.activeId;
  console.log(`[buildAddLiquidityTx] Active bin ID: ${activeBin}`);

  const minBinId = activeBin + minBinOffset;
  const maxBinId = activeBin + maxBinOffset;

  console.log(`[buildAddLiquidityTx] Range de bins: ${minBinId} - ${maxBinId}`);

  const strategy = {
    strategyType: 0,  // StrategyType.SpotBalanced
    minBinId: minBinId,
    maxBinId: maxBinId,
  };

  const positionKeypair = Keypair.generate();
  console.log(`[buildAddLiquidityTx] Position keypair gerado: ${positionKeypair.publicKey.toBase58()}`);

  let initAddTx;
  try {
    console.log(`[buildAddLiquidityTx] Inicializando posição e adicionando liquidez...`);
    initAddTx = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
      positionPubKey: positionKeypair.publicKey,
      totalXAmount,
      totalYAmount,
      strategy,
      user: userPublicKey,
      slippage: 1,  // 1% slippage
    });
    console.log(`[buildAddLiquidityTx] ✅ Transação de liquidez criada`);
  } catch (error) {
    console.error(`[buildAddLiquidityTx] ERRO ao criar transação de liquidez:`, error);
    throw error;
  }

  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  console.log(`[buildAddLiquidityTx] Blockhash: ${blockhash}`);

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

  console.log(`[buildAddLiquidityTx] ✅ Transação serializada`);
  console.log('========== FIM buildAddLiquidityTx ==========\n');

  return {
    serializedAddLiquidityTxBase64: serialized,
    positionKeypair: {
      publicKey: positionKeypair.publicKey.toBase58(),
      secretKey: Buffer.from(positionKeypair.secretKey).toString('base64'),
    },
  };
}