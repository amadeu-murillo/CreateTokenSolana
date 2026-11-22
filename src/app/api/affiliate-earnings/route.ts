import { NextResponse } from "next/server";
import {
  collection,
  count,
  doc,
  getAggregateFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  sum,
  Timestamp,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { db, inMemoryCommissionStore, isFirebaseConfigured } from "@/lib/firebase";
import {
  checkRateLimitAsync,
  getClientIp,
  isValidPublicKey,
  sanitizeErrorMessage,
} from "@/lib/security";
import {
  computeAffiliateAggregates,
  getRangeStartDate,
  normalizeAffiliateRange,
  type AffiliateCommissionRecord,
} from "@/lib/affiliateEarnings";

export const dynamic = "force-dynamic";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
};

export async function GET(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimitAsync(`affiliate-earnings:${clientIp}`, 30, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${rateLimit.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet")?.trim();
  const range = normalizeAffiliateRange(searchParams.get("range"));
  const cursor = searchParams.get("cursor")?.trim() || null;
  const rawLimit = Number(searchParams.get("limit") || "10");
  const pageSize = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 50) : 10;

  if (!wallet || !isValidPublicKey(wallet)) {
    return NextResponse.json(
      { error: "A valid Solana wallet address is required." },
      { status: 400 }
    );
  }

  try {
    if (!isFirebaseConfigured || !db) {
      const records: AffiliateCommissionRecord[] = Array.from(inMemoryCommissionStore.values())
        .filter((r) => r.affiliateWallet === wallet)
        .map((r) => ({
          signature: r.transactionSignature,
          blockTime: r.blockTime || 0,
          createdAtIso: r.blockTime ? new Date(r.blockTime * 1000).toISOString() : null,
          amount: r.commissionAmountSOL,
          tokenCreatorWallet: r.tokenCreatorWallet,
        }));

      const aggregates = computeAffiliateAggregates({
        records,
        range,
        limit: pageSize,
        cursor,
      });

      return NextResponse.json(
        {
          ...aggregates,
          storageMode: "in-memory-fallback" as const,
        },
        { headers: CACHE_HEADERS }
      );
    }

    const commissionsCol = collection(db, "affiliate_commissions");
    const rangeStart = getRangeStartDate(range);
    const baseConstraints: QueryConstraint[] = [where("affiliateWallet", "==", wallet)];
    if (rangeStart) {
      baseConstraints.push(where("createdAt", ">=", Timestamp.fromDate(rangeStart)));
    }

    const aggregateQuery = query(commissionsCol, ...baseConstraints);

    // 1. Server-side aggregation (sum + count) — never truncated at 100 documents
    const aggregateSnap = await getAggregateFromServer(aggregateQuery, {
      totalEarningsSol: sum("commissionAmountSOL"),
      commissionsCount: count(),
    });
    const aggData = aggregateSnap.data();
    const totalEarningsSol = Number((Number(aggData.totalEarningsSol) || 0).toFixed(6));
    const commissionsCount = Number(aggData.commissionsCount) || 0;

    // 2. Paginated recent transactions ordered server-side by createdAt desc
    const pageConstraints: QueryConstraint[] = [
      ...baseConstraints,
      orderBy("createdAt", "desc"),
    ];
    if (cursor) {
      const cursorDocSnap = await getDoc(doc(db, "affiliate_commissions", cursor));
      if (cursorDocSnap.exists()) {
        pageConstraints.push(startAfter(cursorDocSnap));
      }
    }
    pageConstraints.push(limit(pageSize + 1));

    const pageSnap = await getDocs(query(commissionsCol, ...pageConstraints));
    const hasMore = pageSnap.docs.length > pageSize;
    const sliceDocs = hasMore ? pageSnap.docs.slice(0, pageSize) : pageSnap.docs;

    const transactions: AffiliateCommissionRecord[] = sliceDocs.map((docSnap) => {
      const data = docSnap.data();
      const amount = Number(data.commissionAmountSOL) || 0;
      const createdAtDate: Date | null = data.createdAt?.toDate?.() ?? null;
      const rawBlockTime = Number(data.blockTime) || 0;
      const resolvedBlockTime =
        rawBlockTime > 0
          ? rawBlockTime
          : createdAtDate
          ? Math.floor(createdAtDate.getTime() / 1000)
          : 0;

      return {
        signature: data.transactionSignature || docSnap.id,
        blockTime: resolvedBlockTime,
        createdAtIso: createdAtDate ? createdAtDate.toISOString() : null,
        amount,
        tokenCreatorWallet:
          typeof data.tokenCreatorWallet === "string" ? data.tokenCreatorWallet : undefined,
      };
    });

    const nextCursor =
      hasMore && sliceDocs.length > 0 ? sliceDocs[sliceDocs.length - 1].id : null;

    // 3. Max commission & distinct referred creator wallets
    let maxCommissionSol = 0;
    const uniqueWallets = new Set<string>();

    if (commissionsCount > 0) {
      try {
        const maxSnap = await getDocs(
          query(
            commissionsCol,
            ...baseConstraints,
            orderBy("commissionAmountSOL", "desc"),
            limit(1)
          )
        );
        if (!maxSnap.empty) {
          maxCommissionSol = Number(
            (Number(maxSnap.docs[0].data().commissionAmountSOL) || 0).toFixed(6)
          );
        }
      } catch {
        // Fallback if composite index for commissionAmountSOL is still building
        for (const tx of transactions) {
          if (tx.amount > maxCommissionSol) maxCommissionSol = tx.amount;
        }
      }

      // Compute unique referred wallets across the active window (bounded read for scalability)
      const distinctSnap = await getDocs(query(commissionsCol, ...baseConstraints, limit(500)));
      distinctSnap.forEach((docSnap) => {
        const creator = docSnap.data().tokenCreatorWallet;
        if (typeof creator === "string" && creator.trim()) {
          uniqueWallets.add(creator.trim());
        }
      });
    }

    return NextResponse.json(
      {
        totalEarningsSol,
        commissionsCount,
        referralCount: commissionsCount,
        uniqueReferredWallets: uniqueWallets.size,
        maxCommissionSol,
        transactions,
        nextCursor,
        hasMore,
        range,
        storageMode: "firestore" as const,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Error fetching affiliate earnings:", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error, "Failed to load affiliate earnings.") },
      { status: 500 }
    );
  }
}
