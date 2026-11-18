import { NextResponse } from "next/server";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { db, inMemoryCommissionStore, isFirebaseConfigured } from "@/lib/firebase";
import {
  AFFILIATE_COMMISSION_RATE,
  DEV_AFFILIATE_SHARE_RATE,
  DEV_WALLET_ADDRESS_STRING,
} from "@/lib/constants";
import {
  checkRateLimitAsync,
  getClientIp,
  recordCommissionRequestSchema,
  sanitizeErrorMessage,
} from "@/lib/security";
import { getSolanaConnection } from "@/lib/services/solanaHelpers";

export const dynamic = "force-dynamic";

const SYSTEM_PROGRAM_ID_STR = SystemProgram.programId.toBase58();

/**
 * Extracts verified SystemProgram.transfer lamports sent by `tokenCreatorWallet`
 * to `DEV_WALLET_ADDRESS_STRING` and `affiliateWallet` from a parsed on-chain transaction.
 */
function extractVerifiedAffiliateSplitFromParsedTx(params: {
  parsedTx: NonNullable<Awaited<ReturnType<ReturnType<typeof getSolanaConnection>["getParsedTransaction"]>>>;
  tokenCreatorWallet: string;
  affiliateWallet: string;
}): {
  devLamports: number;
  affiliateLamports: number;
  validSplit: boolean;
} {
  const { parsedTx, tokenCreatorWallet, affiliateWallet } = params;
  let devLamports = 0;
  let affiliateLamports = 0;

  const inspectInstructionList = (instructions: unknown[]) => {
    for (const rawIx of instructions) {
      if (!rawIx || typeof rawIx !== "object") continue;
      const ix = rawIx as {
        programId?: { toBase58?: () => string } | string;
        parsed?: {
          type?: string;
          info?: {
            source?: string;
            destination?: string;
            lamports?: number | string;
          };
        };
      };

      const progId =
        typeof ix.programId === "string"
          ? ix.programId
          : typeof ix.programId?.toBase58 === "function"
          ? ix.programId.toBase58()
          : "";

      if (progId === SYSTEM_PROGRAM_ID_STR && ix.parsed?.type === "transfer") {
        const source = ix.parsed.info?.source;
        const destination = ix.parsed.info?.destination;
        const lamports = Number(ix.parsed.info?.lamports || 0);

        if (source === tokenCreatorWallet && lamports > 0) {
          if (destination === DEV_WALLET_ADDRESS_STRING) {
            devLamports += lamports;
          } else if (destination === affiliateWallet) {
            affiliateLamports += lamports;
          }
        }
      }
    }
  };

  inspectInstructionList(parsedTx.transaction.message.instructions as unknown[]);
  if (Array.isArray(parsedTx.meta?.innerInstructions)) {
    for (const inner of parsedTx.meta.innerInstructions) {
      if (Array.isArray(inner?.instructions)) {
        inspectInstructionList(inner.instructions as unknown[]);
      }
    }
  }

  if (devLamports <= 0 || affiliateLamports <= 0) {
    return { devLamports, affiliateLamports, validSplit: false };
  }

  // Verify the 30% affiliate / 70% dev wallet split ratio on-chain (within 5 lamports rounding tolerance)
  const totalFeeLamports = devLamports + affiliateLamports;
  const expectedAffiliateLamports = Math.round(
    totalFeeLamports * AFFILIATE_COMMISSION_RATE
  );
  const expectedDevLamports = Math.round(totalFeeLamports * DEV_AFFILIATE_SHARE_RATE);

  const validSplit =
    Math.abs(affiliateLamports - expectedAffiliateLamports) <= 5 &&
    Math.abs(devLamports - expectedDevLamports) <= 5;

  return { devLamports, affiliateLamports, validSplit };
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = await checkRateLimitAsync(`record-commission:${clientIp}`, 10, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Please wait ${rateLimit.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const rawBody = await request.json();
    const parsed = recordCommissionRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid commission data." },
        { status: 400 }
      );
    }

    const {
      affiliateWallet,
      transactionSignature,
      tokenCreatorWallet,
      mintAddress,
      network = "mainnet-beta",
    } = parsed.data;

    // 1. Block self-affiliation and Dev Wallet spoofing
    if (
      affiliateWallet === tokenCreatorWallet ||
      affiliateWallet === DEV_WALLET_ADDRESS_STRING
    ) {
      return NextResponse.json(
        { error: "Self-referral or Dev Wallet referral is not permitted." },
        { status: 400 }
      );
    }

    // 2. Prevent duplicate recording by signature
    if (inMemoryCommissionStore.has(transactionSignature)) {
      return NextResponse.json(
        { error: "This transaction signature has already been recorded." },
        { status: 409 }
      );
    }

    if (isFirebaseConfigured && db) {
      const commissionRef = doc(db, "affiliate_commissions", transactionSignature);
      const existingDoc = await getDoc(commissionRef);
      if (existingDoc.exists()) {
        return NextResponse.json(
          { error: "This transaction signature has already been recorded." },
          { status: 409 }
        );
      }
    }

    // 3. Fetch transaction from RPC and verify on-chain transfers (NEVER trust client commissionAmountSOL)
    const connection = getSolanaConnection(network);
    const parsedTx = await connection.getParsedTransaction(transactionSignature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });

    if (!parsedTx || parsedTx.meta?.err !== null) {
      return NextResponse.json(
        { error: "Transaction was not found on-chain or failed execution." },
        { status: 400 }
      );
    }

    const accountKeys = parsedTx.transaction.message.accountKeys.map((k) =>
      typeof k === "string" ? k : k.pubkey.toBase58()
    );

    if (accountKeys[0] !== tokenCreatorWallet) {
      return NextResponse.json(
        { error: "Transaction fee payer does not match tokenCreatorWallet." },
        { status: 400 }
      );
    }

    if (
      !accountKeys.includes(affiliateWallet) ||
      !accountKeys.includes(DEV_WALLET_ADDRESS_STRING)
    ) {
      return NextResponse.json(
        {
          error:
            "On-chain transaction does not contain verified transfers to both the Dev Wallet and Affiliate Wallet.",
        },
        { status: 400 }
      );
    }

    const { devLamports, affiliateLamports, validSplit } =
      extractVerifiedAffiliateSplitFromParsedTx({
        parsedTx,
        tokenCreatorWallet,
        affiliateWallet,
      });

    if (!validSplit) {
      return NextResponse.json(
        {
          error: `On-chain transfer verification failed: expected atomic 30%/70% split from ${tokenCreatorWallet}, but found ${affiliateLamports} affiliate lamports and ${devLamports} dev lamports.`,
        },
        { status: 400 }
      );
    }

    const verifiedCommissionSol = Number(
      (affiliateLamports / LAMPORTS_PER_SOL).toFixed(6)
    );

    inMemoryCommissionStore.set(transactionSignature, {
      affiliateWallet,
      commissionAmountSOL: verifiedCommissionSol,
      transactionSignature,
      tokenCreatorWallet,
      mintAddress,
      network,
      blockTime: parsedTx.blockTime || Math.floor(Date.now() / 1000),
    });

    if (isFirebaseConfigured && db) {
      const commissionRef = doc(db, "affiliate_commissions", transactionSignature);
      await setDoc(commissionRef, {
        affiliateWallet,
        commissionAmountSOL: verifiedCommissionSol,
        devWalletAmountSOL: Number((devLamports / LAMPORTS_PER_SOL).toFixed(6)),
        transactionSignature,
        tokenCreatorWallet,
        mintAddress,
        network,
        verifiedOnChain: true,
        createdAt: serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      verifiedCommissionSol,
      message: "Commission verified on-chain and recorded successfully.",
    });
  } catch (error) {
    console.error("Error recording affiliate commission:", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error, "Internal server error while recording commission.") },
      { status: 500 }
    );
  }
}
