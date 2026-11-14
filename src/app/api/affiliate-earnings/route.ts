import { NextResponse } from "next/server";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db, inMemoryCommissionStore, isFirebaseConfigured } from "@/lib/firebase";
import { checkRateLimit, getClientIp, isValidPublicKey, sanitizeErrorMessage } from "@/lib/security";

export const dynamic = "force-dynamic";


interface AffiliateTransaction {
  signature: string;
  blockTime: number;
  amount: number;
}

export async function GET(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`affiliate-earnings:${clientIp}`, 30, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${rateLimit.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");

  if (!wallet || !isValidPublicKey(wallet)) {
    return NextResponse.json(
      { error: "A valid Solana wallet address is required." },
      { status: 400 }
    );
  }

  try {
    if (!isFirebaseConfigured || !db) {
      const records = Array.from(inMemoryCommissionStore.values()).filter(
        (r) => r.affiliateWallet === wallet
      );
      const totalEarningsSol = records.reduce((acc, r) => acc + r.commissionAmountSOL, 0);
      const transactions: AffiliateTransaction[] = records
        .map((r) => ({
          signature: r.transactionSignature,
          blockTime: r.blockTime,
          amount: r.commissionAmountSOL,
        }))
        .sort((a, b) => b.blockTime - a.blockTime)
        .slice(0, 10);

      return NextResponse.json({
        totalEarningsSol,
        referralCount: records.length,
        transactions,
        storageMode: "in-memory-fallback",
      });
    }

    const commissionsCol = collection(db, "affiliate_commissions");
    const q = query(commissionsCol, where("affiliateWallet", "==", wallet), limit(100));

    const querySnapshot = await getDocs(q);

    let totalEarnings = 0;
    const transactions: AffiliateTransaction[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const amount = Number(data.commissionAmountSOL) || 0;
      totalEarnings += amount;

      const createdAtTimestamp = data.createdAt?.toDate?.();
      transactions.push({
        signature: data.transactionSignature || docSnap.id,
        blockTime: createdAtTimestamp ? Math.floor(createdAtTimestamp.getTime() / 1000) : 0,
        amount,
      });
    });

    transactions.sort((a, b) => b.blockTime - a.blockTime);

    return NextResponse.json({
      totalEarningsSol: totalEarnings,
      referralCount: querySnapshot.size,
      transactions: transactions.slice(0, 10),
      storageMode: "firestore",
    });
  } catch (error) {
    console.error("Error fetching affiliate earnings:", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error, "Failed to load affiliate earnings.") },
      { status: 500 }
    );
  }
}
