import { NextResponse } from "next/server";
import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getMint,
} from "@solana/spl-token";
import {
  SERVICE_FEE_AIRDROP_LAMPORTS,
  SERVICE_FEE_SNAPSHOT_HOLDERS_LAMPORTS,
} from "@/lib/constants";
import {
  airdropRequestSchema,
  checkRateLimit,
  getClientIp,
  isValidPublicKey,
  toRawTokenAmount,
} from "@/lib/security";
import {
  buildServiceFeeInstructions,
  getSolanaConnection,
} from "@/lib/services/solanaHelpers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`airdrop:${clientIp}`, 30, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${rateLimit.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const rawBody = await request.json();
    const parsed = airdropRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid airdrop data." },
        { status: 400 }
      );
    }

    const {
      mint,
      recipients,
      wallet,
      programId,
      affiliate,
      network = "mainnet-beta",
    } = parsed.data;

    const includeSnapshotFee = Boolean(rawBody?.includeSnapshotFee);
    const lookupTableAddressStr =
      typeof rawBody?.lookupTableAddress === "string" ? rawBody.lookupTableAddress.trim() : "";

    const connection = getSolanaConnection(network);
    const payerPublicKey = new PublicKey(wallet);
    const mintPublicKey = new PublicKey(mint);
    const tokenProgramId = new PublicKey(programId);

    const mintInfo = await getMint(connection, mintPublicKey, "confirmed", tokenProgramId);

    const totalBatchFeeLamports =
      SERVICE_FEE_AIRDROP_LAMPORTS +
      (includeSnapshotFee ? SERVICE_FEE_SNAPSHOT_HOLDERS_LAMPORTS : 0);

    const instructions: TransactionInstruction[] = [
      ComputeBudgetProgram.setComputeUnitLimit({
        units: Math.min(1_400_000, 120_000 + 38_000 * recipients.length),
      }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 15_000 }),
      // Mandatory Service Fee per batch routed atomically (70% Dev / 30% Affiliate)
      ...buildServiceFeeInstructions(payerPublicKey, totalBatchFeeLamports, affiliate),
    ];

    const sourceTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      payerPublicKey,
      false,
      tokenProgramId
    );

    const destinationAtas = await Promise.all(
      recipients.map(async (recipient) => {
        const destinationPublicKey = new PublicKey(recipient.address);
        return getAssociatedTokenAddress(
          mintPublicKey,
          destinationPublicKey,
          false,
          tokenProgramId
        );
      })
    );

    const accountsInfo = await connection.getMultipleAccountsInfo(destinationAtas);

    recipients.forEach((recipient, index) => {
      const destinationPublicKey = new PublicKey(recipient.address);
      const destinationAta = destinationAtas[index];
      const accountInfo = accountsInfo[index];
      const rawTransferAmount = toRawTokenAmount(recipient.amount, mintInfo.decimals);

      if (accountInfo === null) {
        instructions.push(
          createAssociatedTokenAccountIdempotentInstruction(
            payerPublicKey,
            destinationAta,
            destinationPublicKey,
            mintPublicKey,
            tokenProgramId
          )
        );
      }

      instructions.push(
        createTransferCheckedInstruction(
          sourceTokenAccount,
          mintPublicKey,
          destinationAta,
          payerPublicKey,
          rawTransferAmount,
          mintInfo.decimals,
          [],
          tokenProgramId
        )
      );
    });

    // Optional Address Lookup Table (ALT) compression support for high-density batches
    const lookupTableAccounts: AddressLookupTableAccount[] = [];
    if (lookupTableAddressStr && isValidPublicKey(lookupTableAddressStr)) {
      try {
        const altRes = await connection.getAddressLookupTable(
          new PublicKey(lookupTableAddressStr)
        );
        if (altRes.value) {
          lookupTableAccounts.push(altRes.value);
        }
      } catch {
        // Fallback to standard v0 message if ALT is not found
      }
    }

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

    const messageV0 = new TransactionMessage({
      payerKey: payerPublicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message(lookupTableAccounts);

    const transaction = new VersionedTransaction(messageV0);
    const serializedTransaction = transaction.serialize();
    const base64Transaction = Buffer.from(serializedTransaction).toString("base64");

    return NextResponse.json({
      transaction: base64Transaction,
      blockhash,
      lastValidBlockHeight,
      network,
      altCompressed: lookupTableAccounts.length > 0,
    });
  } catch (error) {
    console.error("Error in airdrop API:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Internal server error while preparing airdrop batch.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
