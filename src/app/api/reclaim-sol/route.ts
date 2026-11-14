import { NextRequest, NextResponse } from "next/server";
import {
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createCloseAccountInstruction,
} from "@solana/spl-token";
import {
  ESTIMATED_ATA_RENT_LAMPORTS,
  MAX_CLOSE_ACCOUNTS_PER_TX,
  RECLAIM_SOL_SERVICE_FEE_RATE,
  SolanaCluster,
} from "@/lib/constants";
import {
  checkRateLimit,
  getClientIp,
  isValidPublicKey,
  sanitizeErrorMessage,
} from "@/lib/security";
import {
  buildServiceFeeInstructions,
  getSolanaConnection,
} from "@/lib/services/solanaHelpers";

interface ReclaimAccountItem {
  pubkey: string;
  programId: string;
  lamports?: number;
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`reclaim-sol:${clientIp}`, 20, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Please wait ${rateLimit.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      wallet,
      accounts,
      affiliate,
      network = "mainnet-beta",
    }: {
      wallet?: string;
      accounts?: ReclaimAccountItem[];
      affiliate?: string | null;
      network?: SolanaCluster;
    } = body || {};

    if (!wallet || !isValidPublicKey(wallet)) {
      return NextResponse.json(
        { error: "A valid connected Solana wallet address is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(accounts) || accounts.length === 0) {
      return NextResponse.json(
        { error: "No empty token accounts provided to close." },
        { status: 400 }
      );
    }

    const batchAccounts = accounts.slice(0, MAX_CLOSE_ACCOUNTS_PER_TX);
    const targetNetwork: SolanaCluster = network === "devnet" ? "devnet" : "mainnet-beta";
    const connection = getSolanaConnection(targetNetwork);
    const userPublicKey = new PublicKey(wallet);

    const instructions: TransactionInstruction[] = [
      ComputeBudgetProgram.setComputeUnitLimit({
        units: Math.min(400_000, 80_000 + batchAccounts.length * 12_000),
      }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 15_000 }),
    ];

    let totalReclaimedLamports = 0;

    for (const acc of batchAccounts) {
      if (!acc.pubkey || !isValidPublicKey(acc.pubkey)) continue;
      const accountPubkey = new PublicKey(acc.pubkey);
      const tokenProgramId =
        acc.programId === TOKEN_2022_PROGRAM_ID.toBase58()
          ? TOKEN_2022_PROGRAM_ID
          : TOKEN_PROGRAM_ID;

      const rentLamports =
        typeof acc.lamports === "number" && acc.lamports > 0
          ? acc.lamports
          : ESTIMATED_ATA_RENT_LAMPORTS;
      totalReclaimedLamports += rentLamports;

      instructions.push(
        createCloseAccountInstruction(
          accountPubkey,
          userPublicKey,
          userPublicKey,
          [],
          tokenProgramId
        )
      );
    }

    // Phase 4: Deduct 15% service fee from total reclaimed rent atomically in the same transaction
    const serviceFeeLamports = Math.max(
      1_000,
      Math.round(totalReclaimedLamports * RECLAIM_SOL_SERVICE_FEE_RATE)
    );

    instructions.push(
      ...buildServiceFeeInstructions(userPublicKey, serviceFeeLamports, affiliate)
    );

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

    const messageV0 = new TransactionMessage({
      payerKey: userPublicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);
    const base64Transaction = Buffer.from(transaction.serialize()).toString("base64");

    const grossSol = totalReclaimedLamports / LAMPORTS_PER_SOL;
    const feeSol = serviceFeeLamports / LAMPORTS_PER_SOL;
    const netUserSol = Math.max(0, grossSol - feeSol);

    return NextResponse.json({
      transaction: base64Transaction,
      closedCount: batchAccounts.length,
      grossReclaimedSol: Number(grossSol.toFixed(6)),
      serviceFeeSol: Number(feeSol.toFixed(6)),
      netUserSol: Number(netUserSol.toFixed(6)),
      blockhash,
      lastValidBlockHeight,
      network: targetNetwork,
    });
  } catch (error) {
    console.error("Error in /api/reclaim-sol:", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error, "Failed to build Reclaim SOL transaction.") },
      { status: 500 }
    );
  }
}
