import { NextResponse } from "next/server";
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  createBurnInstruction,
  getAssociatedTokenAddress,
  getMint,
} from "@solana/spl-token";
import { SERVICE_FEE_BURN_TOKEN_LAMPORTS } from "@/lib/constants";
import {
  burnTokenRequestSchema,
  checkRateLimit,
  getClientIp,
  toRawTokenAmount,
} from "@/lib/security";
import {
  buildServiceFeeInstructions,
  getSolanaConnection,
} from "@/lib/services/solanaHelpers";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`burn-token:${clientIp}`, 20, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${rateLimit.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const rawBody = await request.json();
    const parsed = burnTokenRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid burn token parameters." },
        { status: 400 }
      );
    }

    const {
      mint,
      amount,
      wallet,
      programId,
      affiliate,
      network = "mainnet-beta",
    } = parsed.data;

    const connection = getSolanaConnection(network);
    const userPublicKey = new PublicKey(wallet);
    const mintPublicKey = new PublicKey(mint);
    const tokenProgramId = new PublicKey(programId);

    const mintInfo = await getMint(connection, mintPublicKey, "confirmed", tokenProgramId);
    const rawBurnAmount = toRawTokenAmount(amount, mintInfo.decimals);

    const associatedTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      userPublicKey,
      false,
      tokenProgramId
    );

    const instructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 15_000 }),
      // Mandatory Service Fee routed to DEV_WALLET_ADDRESS
      ...buildServiceFeeInstructions(
        userPublicKey,
        SERVICE_FEE_BURN_TOKEN_LAMPORTS,
        affiliate
      ),
      createBurnInstruction(
        associatedTokenAccount,
        mintPublicKey,
        userPublicKey,
        rawBurnAmount,
        [],
        tokenProgramId
      ),
    ];

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

    const messageV0 = new TransactionMessage({
      payerKey: userPublicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);
    const serializedTransaction = transaction.serialize();
    const base64Transaction = Buffer.from(serializedTransaction).toString("base64");

    return NextResponse.json({
      transaction: base64Transaction,
      blockhash,
      lastValidBlockHeight,
      network,
    });
  } catch (error) {
    console.error("Detailed error while creating burn transaction:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Internal server error while creating the burn transaction.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
