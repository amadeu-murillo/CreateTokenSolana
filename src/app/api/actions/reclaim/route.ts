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
  ACTIONS_CORS_HEADERS,
  ActionGetResponse,
  ActionPostResponse,
} from "@/lib/solana/actionsCors";
import {
  ESTIMATED_ATA_RENT_LAMPORTS,
  MAX_CLOSE_ACCOUNTS_PER_TX,
  RECLAIM_SOL_SERVICE_FEE_RATE,
  SolanaCluster,
} from "@/lib/constants";
import { SITE_URL } from "@/lib/seo";
import { isValidPublicKey, sanitizeErrorMessage } from "@/lib/security";
import {
  buildServiceFeeInstructions,
  getSolanaConnection,
} from "@/lib/services/solanaHelpers";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ACTIONS_CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ref = searchParams.get("ref") || "";
  const network = searchParams.get("network") === "devnet" ? "devnet" : "mainnet-beta";
  const queryParts: string[] = [];
  if (ref && isValidPublicKey(ref)) {
    queryParts.push(`ref=${encodeURIComponent(ref)}`);
  }
  if (network === "devnet") {
    queryParts.push("network=devnet");
  }
  const suffix = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  const payload: ActionGetResponse = {
    type: "action",
    icon: `${SITE_URL}/sol.png`,
    title: "Reclaim Locked SOL Rent (Keep 92% Net)",
    description:
      "Automatically scan your wallet for zero-balance SPL & Token-2022 accounts and close up to 20 empty ATAs in a single transaction (~0.00204 SOL recovered per account · 92% net to you, 8% platform fee with 30% affiliate split).",
    label: "Scan & Close Empty Accounts",
    links: {
      actions: [
        {
          type: "transaction",
          label: "Scan & Close Empty Accounts",
          href: `/api/actions/reclaim${suffix}`,
        },
      ],
    },
  };

  return NextResponse.json(payload, { status: 200, headers: ACTIONS_CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const accountStr = typeof body?.account === "string" ? body.account.trim() : "";

    if (!accountStr || !isValidPublicKey(accountStr)) {
      return NextResponse.json(
        { message: "A valid Solana wallet public key ('account') is required." },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const ref = searchParams.get("ref");
    const cluster: SolanaCluster =
      searchParams.get("network") === "devnet" ? "devnet" : "mainnet-beta";

    const connection = getSolanaConnection(cluster);
    const userPublicKey = new PublicKey(accountStr);

    const [splAccounts, token2022Accounts] = await Promise.all([
      connection.getParsedTokenAccountsByOwner(
        userPublicKey,
        { programId: TOKEN_PROGRAM_ID },
        "confirmed"
      ),
      connection.getParsedTokenAccountsByOwner(
        userPublicKey,
        { programId: TOKEN_2022_PROGRAM_ID },
        "confirmed"
      ),
    ]);

    const combined = [
      ...splAccounts.value.map((acc) => ({
        pubkey: acc.pubkey,
        lamports: acc.account.lamports,
        info: acc.account.data.parsed?.info,
        programId: TOKEN_PROGRAM_ID,
      })),
      ...token2022Accounts.value.map((acc) => ({
        pubkey: acc.pubkey,
        lamports: acc.account.lamports,
        info: acc.account.data.parsed?.info,
        programId: TOKEN_2022_PROGRAM_ID,
      })),
    ];

    const emptyAccounts = combined.filter((item) => {
      const amountStr = item.info?.tokenAmount?.amount ?? "0";
      const isFrozen = item.info?.state === "frozen";
      return amountStr === "0" && !isFrozen;
    });

    const batchToClose = emptyAccounts.slice(0, MAX_CLOSE_ACCOUNTS_PER_TX);

    const instructions: TransactionInstruction[] = [
      ComputeBudgetProgram.setComputeUnitLimit({
        units: Math.min(400_000, 80_000 + Math.max(1, batchToClose.length) * 12_000),
      }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 15_000 }),
    ];

    let totalReclaimedLamports = 0;

    for (const acc of batchToClose) {
      const rentLamports =
        typeof acc.lamports === "number" && acc.lamports > 0
          ? acc.lamports
          : ESTIMATED_ATA_RENT_LAMPORTS;
      totalReclaimedLamports += rentLamports;

      instructions.push(
        createCloseAccountInstruction(
          acc.pubkey,
          userPublicKey,
          userPublicKey,
          [],
          acc.programId
        )
      );
    }

    // 8% platform fee (70% Dev / 30% Affiliate) via buildServiceFeeInstructions
    const serviceFeeLamports =
      totalReclaimedLamports > 0
        ? Math.max(1_000, Math.round(totalReclaimedLamports * RECLAIM_SOL_SERVICE_FEE_RATE))
        : 5_000;

    instructions.push(
      ...buildServiceFeeInstructions(userPublicKey, serviceFeeLamports, ref)
    );

    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    const msgV0 = new TransactionMessage({
      payerKey: userPublicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(msgV0);
    const base64Transaction = Buffer.from(transaction.serialize()).toString("base64");

    const netSol = Math.max(
      0,
      (totalReclaimedLamports - serviceFeeLamports) / LAMPORTS_PER_SOL
    );

    const responsePayload: ActionPostResponse = {
      type: "transaction",
      transaction: base64Transaction,
      message:
        batchToClose.length > 0
          ? `Closing ${batchToClose.length} empty token account(s) to recover +${netSol.toFixed(
              5
            )} SOL net (92% to your wallet).`
          : "No zero-balance token accounts found in your wallet.",
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (error) {
    return NextResponse.json(
      { message: sanitizeErrorMessage(error, "Failed to build Reclaim SOL Blink transaction.") },
      { status: 500, headers: ACTIONS_CORS_HEADERS }
    );
  }
}
