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
  LiquidityMath,
  SqrtPriceMath,
  TickMath
} from '@raydium-io/raydium-sdk';
import BN from 'bn.js';
import Decimal from 'decimal.js';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_CREATE_LP_LAMPORTS } from '@/lib/constants';

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

export async function POST(request: Request) {
  try {
    const body: CreateRaydiumPoolRequest = await request.json();
    const { wallet, baseMint, baseAmount, quoteAmount, baseDecimals, baseProgramId } = body;

    if (!wallet || !baseMint || !baseAmount || !quoteAmount || baseDecimals === undefined || !baseProgramId) {
      return NextResponse.json({ error: 'Dados da requisição incompletos.' }, { status: 400 });
    }

    // validação extra
    if (typeof baseMint !== "string" || typeof baseProgramId !== "string") {
      return NextResponse.json({ error: "baseMint e baseProgramId devem ser strings base58." }, { status: 400 });
    }

    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const userPublicKey = new PublicKey(wallet);

    const baseToken = new Token(new PublicKey(baseProgramId.trim()), new PublicKey(baseMint.trim()), baseDecimals);
    const quoteToken = Token.WSOL;

    const instructions: TransactionInstruction[] = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 800000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: DEV_WALLET_ADDRESS,
        lamports: SERVICE_FEE_CREATE_LP_LAMPORTS,
      }),
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
    const baseAmountBn = new BN(new Decimal(baseAmount).times(new Decimal(10).pow(baseDecimals)).toFixed(0));
    
    const initialPrice = new Price(baseToken, baseAmountBn, quoteToken, quoteLamports);
    
    const currentSqrtPriceX64 = SqrtPriceMath.priceToSqrtPriceX64(initialPrice);
    const currentTick = TickMath.sqrtPriceX64ToTick(currentSqrtPriceX64);
    
    const tickSpacing = 60; 
    const tickLower = TickMath.getInitializableTickIndex(currentTick, tickSpacing) - 200 * tickSpacing;
    const tickUpper = TickMath.getInitializableTickIndex(currentTick, tickSpacing) + 200 * tickSpacing;

    const { amountA, amountB } = LiquidityMath.getAmountsFromLiquidity({
        currentSqrtPrice: currentSqrtPriceX64,
        tickLower,
        tickUpper,
        liquidity: LiquidityMath.getLiquidityFromTokenAmount({
          amount: new TokenAmount(baseToken, baseAmountBn, true),
          currentSqrtPrice: currentSqrtPriceX64,
          tickLower,
          tickUpper,
        }),
        slippage: 0.005,
    });

    const { poolId, innerTransactions: createPoolTx } = await Clmm.makeCreatePoolInstructions({
      connection,
      programId: RAYDIUM_PROGRAM_ID,
      mintA: baseToken,
      mintB: quoteToken,
      initialPrice,
      owner: userPublicKey,
      makeTxVersion: TxVersion.V0,
      tickSpacing,
    });

    instructions.push(...createPoolTx.innerTransactions.flatMap(tx => tx.instructions));
    signers.push(...createPoolTx.innerTransactions.flatMap(tx => tx.signers));

    const { innerTransactions: openPositionTx } = await Clmm.makeOpenPositionFromLiquidityInstruction({
      connection,
      poolId,
      tickLower,
      tickUpper,
      liquidity: LiquidityMath.getLiquidityFromTokenAmount({
        amount: new TokenAmount(baseToken, amountA, true),
        currentSqrtPrice: currentSqrtPriceX64,
        tickLower,
        tickUpper,
      }),
      owner: userPublicKey,
      makeTxVersion: TxVersion.V0,
      associatedOnly: true,
      checkCreateATAOwner: true,
    });

    instructions.push(...openPositionTx.innerTransactions.flatMap(tx => tx.instructions));
    signers.push(...openPositionTx.innerTransactions.flatMap(tx => tx.signers));

    instructions.push(
      createCloseAccountInstruction(wsolAta, userPublicKey, userPublicKey)
    );

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
