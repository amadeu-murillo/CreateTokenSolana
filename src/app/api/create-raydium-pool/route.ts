import { NextResponse } from 'next/server';
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { 
  NATIVE_MINT, 
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  createCloseAccountInstruction
} from '@solana/spl-token';
import {
  Token,
  DEVNET_PROGRAM_ID,
  MAINNET_PROGRAM_ID,
  TxVersion,
  Clmm,
  TokenAmount,
  Price,
} from '@raydium-io/raydium-sdk';
import BN from 'bn.js';
import Decimal from 'decimal.js';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_CREATE_LP_LAMPORTS } from '@/lib/constants';

// Configuração CLMM (defina manualmente)
const TICK_SPACING = 64;
const FEE_RATE = 500; // 0.05%
const isMainnet = RPC_ENDPOINT.includes('mainnet');
const RAYDIUM_PROGRAM_ID = isMainnet ? MAINNET_PROGRAM_ID.CLMM : DEVNET_PROGRAM_ID.CLMM;

interface CreateRaydiumPoolRequest {
  wallet: string;
  baseMint: string;
  baseAmount: string;
  quoteAmount: string;
  baseDecimals: number;
  baseProgramId: string;
}

function priceToTick(price: number, tickSpacing: number) {
  // Fórmula baseada em Raydium CLMM V1
  // tick = floor(log_1.0001(price))
  const logBase = Math.log(1.0001);
  let tick = Math.floor(Math.log(price) / logBase);
  // Ajusta para múltiplo do tickSpacing
  tick = Math.floor(tick / tickSpacing) * tickSpacing;
  return tick;
}

export async function POST(request: Request) {
  try {
    const {
      wallet,
      baseMint,
      baseAmount,
      quoteAmount,
      baseDecimals,
      baseProgramId,
    }: CreateRaydiumPoolRequest = await request.json();

    if (!wallet || !baseMint || !baseAmount || !quoteAmount || baseDecimals === undefined || !baseProgramId) {
      return NextResponse.json({ error: 'Dados da requisição incompletos.' }, { status: 400 });
    }

    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const userPublicKey = new PublicKey(wallet);

    const baseToken = new Token(new PublicKey(baseProgramId), new PublicKey(baseMint), baseDecimals);
    const quoteToken = Token.WSOL;

    const instructions: TransactionInstruction[] = [
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: DEV_WALLET_ADDRESS,
        lamports: SERVICE_FEE_CREATE_LP_LAMPORTS,
      }),
      ComputeBudgetProgram.setComputeUnitLimit({ units: 800000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 })
    ];
    const signers = [];

    // ---- WSOL handling ----
    const quoteLamports = new BN(new Decimal(quoteAmount).times(new Decimal(10).pow(9)).toFixed(0));
    const wsolAta = await getAssociatedTokenAddress(NATIVE_MINT, userPublicKey);
    const wsolAccountInfo = await connection.getAccountInfo(wsolAta);

    if (!wsolAccountInfo) {
      instructions.push(
        createAssociatedTokenAccountInstruction(userPublicKey, wsolAta, userPublicKey, NATIVE_MINT)
      );
    }
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: wsolAta,
        lamports: BigInt(quoteLamports.toString()),
      }),
      createSyncNativeInstruction(wsolAta)
    );

    // ==== PRICE and TICKS ====
    // Converta quantidades para BN
    const baseAmountBn = new BN(new Decimal(baseAmount).times(new Decimal(10).pow(baseDecimals)).toFixed(0));
    // price = baseAmount / quoteAmount (ajustado para decimais)
    const priceNum = Number(baseAmountBn.toString()) / Number(quoteLamports.toString());
    // Calcula o tick central
    const currentTick = priceToTick(priceNum, TICK_SPACING);
    const tickLower = currentTick - 100 * TICK_SPACING;
    const tickUpper = currentTick + 100 * TICK_SPACING;

    // Price para CLMM v1
    const initialPrice = new Price(
      baseToken, baseAmountBn,
      quoteToken, quoteLamports
    );

    // --- Pool creation (adaptado para v1) ---
    const { poolId, innerTransactions: createPoolTx } = await Clmm.makeCreatePoolInstructions({
      connection,
      programId: RAYDIUM_PROGRAM_ID,
      // clmmConfig: não existe nesta versão, então não inclua
      mintA: baseToken,
      mintB: quoteToken,
      initialPrice,
      owner: userPublicKey,
      makeTxVersion: TxVersion.V0,
      tickSpacing: TICK_SPACING,
      feeRate: FEE_RATE,
    });
    instructions.push(...createPoolTx.flatMap(tx => tx.instructions));
    signers.push(...createPoolTx.flatMap(tx => tx.signers));

    // --- Abrir posição (adicionar liquidez) ---
    const { innerTransactions: openPositionTx } = await Clmm.makeOpenPositionFromBaseInstruction({
      connection,
      poolId,
      tickLower,
      tickUpper,
      base: new TokenAmount(baseToken, baseAmountBn, true),
      owner: userPublicKey,
      associatedOnly: true,
      checkCreateATAOwner: true,
      makeTxVersion: TxVersion.V0,
    });
    instructions.push(...openPositionTx.flatMap(tx => tx.instructions));
    signers.push(...openPositionTx.flatMap(tx => tx.signers));

    // --- Fechar conta WSOL ---
    instructions.push(
      createCloseAccountInstruction(wsolAta, userPublicKey, userPublicKey)
    );

    // --- Serialização da transação ---
    const { blockhash } = await connection.getLatestBlockhash('confirmed');

    const messageV0 = new TransactionMessage({
      payerKey: userPublicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);

    if (signers.length > 0) {
      transaction.sign(signers);
    }

    const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64');

    return NextResponse.json({
      transaction: serializedTransaction,
    });

  } catch (error) {
    console.error('Erro ao criar pool de liquidez CLMM na Raydium:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor ao criar a transação.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}