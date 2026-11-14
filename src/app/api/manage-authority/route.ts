import { NextResponse } from "next/server";
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  createSetAuthorityInstruction,
  AuthorityType,
} from "@solana/spl-token";
import { SERVICE_FEE_MANAGE_AUTHORITY_LAMPORTS } from "@/lib/constants";
import {
  checkRateLimit,
  getClientIp,
  manageAuthorityRequestSchema,
} from "@/lib/security";
import {
  buildServiceFeeInstructions,
  getSolanaConnection,
} from "@/lib/services/solanaHelpers";

export const dynamic = "force-dynamic";


export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`manage-authority:${clientIp}`, 15, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${rateLimit.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const rawBody = await request.json();
    const parsed = manageAuthorityRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid authority management parameters." },
        { status: 400 }
      );
    }

    const {
      mint,
      authorityType,
      wallet,
      programId,
      affiliate,
      network = "mainnet-beta",
    } = parsed.data;

    const connection = getSolanaConnection(network);
    const userPublicKey = new PublicKey(wallet);
    const mintPublicKey = new PublicKey(mint);
    const tokenProgramId = new PublicKey(programId);

    const type =
      authorityType === "mint" ? AuthorityType.MintTokens : AuthorityType.FreezeAccount;

    const instructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 15_000 }),
      // Mandatory Service Fee routed to DEV_WALLET_ADDRESS
      ...buildServiceFeeInstructions(
        userPublicKey,
        SERVICE_FEE_MANAGE_AUTHORITY_LAMPORTS,
        affiliate
      ),
      createSetAuthorityInstruction(
        mintPublicKey,
        userPublicKey,
        type,
        null,
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
    console.error("Error managing authority:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error while revoking authority.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
