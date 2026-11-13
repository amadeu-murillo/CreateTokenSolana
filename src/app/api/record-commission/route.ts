import { NextResponse } from "next/server";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { db, inMemoryCommissionStore, isFirebaseConfigured } from "@/lib/firebase";
import {
  checkRateLimit,
  getClientIp,
  recordCommissionRequestSchema,
  sanitizeErrorMessage,
} from "@/lib/security";
import { getSolanaConnection } from "@/lib/services/solanaHelpers";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`record-commission:${clientIp}`, 10, 60_000);

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
      commissionAmountSOL,
      transactionSignature,
      tokenCreatorWallet,
      mintAddress,
      network = "mainnet-beta",
    } = parsed.data;

    if (affiliateWallet === tokenCreatorWallet) {
      return NextResponse.json(
        { error: "Self-referral is not permitted." },
        { status: 400 }
      );
    }

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

    if (!accountKeys.includes(tokenCreatorWallet) || !accountKeys.includes(affiliateWallet)) {
      return NextResponse.json(
        { error: "Provided wallets did not participate in the verified on-chain transaction." },
        { status: 400 }
      );
    }

    const affiliateKeyIndex = accountKeys.indexOf(affiliateWallet);
    const preBalance = parsedTx.meta?.preBalances?.[affiliateKeyIndex] ?? 0;
    const postBalance = parsedTx.meta?.postBalances?.[affiliateKeyIndex] ?? 0;
    const actualReceivedLamports = Math.max(0, postBalance - preBalance);
    const verifiedCommissionSol =
      actualReceivedLamports > 0
        ? actualReceivedLamports / LAMPORTS_PER_SOL
        : Number(commissionAmountSOL);

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
