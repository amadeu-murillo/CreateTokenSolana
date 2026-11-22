export type AffiliateRange = "7d" | "30d" | "90d" | "all";

export interface AffiliateCommissionRecord {
  signature: string;
  blockTime: number;
  createdAtIso: string | null;
  amount: number;
  tokenCreatorWallet?: string;
}

export interface AffiliateAggregatesResult {
  totalEarningsSol: number;
  commissionsCount: number;
  referralCount: number;
  uniqueReferredWallets: number;
  maxCommissionSol: number;
  transactions: AffiliateCommissionRecord[];
  nextCursor: string | null;
  hasMore: boolean;
  range: AffiliateRange;
}

export function normalizeAffiliateRange(raw?: string | null): AffiliateRange {
  if (raw === "7d" || raw === "30d" || raw === "90d" || raw === "all") {
    return raw;
  }
  return "all";
}

export function getRangeStartDate(range: AffiliateRange, nowMs: number = Date.now()): Date | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return new Date(nowMs - days * 24 * 60 * 60 * 1000);
}

/**
 * Pure aggregation + range filtering + cursor pagination over commission records.
 * Used by the in-memory fallback and unit-tested directly via Vitest.
 */
export function computeAffiliateAggregates(params: {
  records: ReadonlyArray<AffiliateCommissionRecord>;
  range?: AffiliateRange;
  limit?: number;
  cursor?: string | null;
  nowMs?: number;
}): AffiliateAggregatesResult {
  const range = params.range ?? "all";
  const pageSize = Math.min(Math.max(params.limit ?? 10, 1), 50);
  const startDate = getRangeStartDate(range, params.nowMs);
  const startSeconds = startDate ? Math.floor(startDate.getTime() / 1000) : null;

  const filtered = params.records.filter((rec) => {
    if (startSeconds === null) return true;
    const ts =
      rec.blockTime > 0
        ? rec.blockTime
        : rec.createdAtIso
        ? Math.floor(Date.parse(rec.createdAtIso) / 1000)
        : 0;
    return ts >= startSeconds;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (b.blockTime !== a.blockTime) return b.blockTime - a.blockTime;
    return b.signature.localeCompare(a.signature);
  });

  let totalEarningsSol = 0;
  let maxCommissionSol = 0;
  const uniqueWallets = new Set<string>();

  for (const rec of sorted) {
    const amt = Number.isFinite(rec.amount) ? rec.amount : 0;
    totalEarningsSol += amt;
    if (amt > maxCommissionSol) {
      maxCommissionSol = amt;
    }
    if (rec.tokenCreatorWallet) {
      uniqueWallets.add(rec.tokenCreatorWallet);
    }
  }

  let startIndex = 0;
  if (params.cursor) {
    const cursorIdx = sorted.findIndex((item) => item.signature === params.cursor);
    if (cursorIdx >= 0) {
      startIndex = cursorIdx + 1;
    }
  }

  const pageSlice = sorted.slice(startIndex, startIndex + pageSize);
  const hasMore = startIndex + pageSize < sorted.length;
  const nextCursor =
    hasMore && pageSlice.length > 0 ? pageSlice[pageSlice.length - 1].signature : null;

  return {
    totalEarningsSol: Number(totalEarningsSol.toFixed(6)),
    commissionsCount: sorted.length,
    referralCount: sorted.length,
    uniqueReferredWallets: uniqueWallets.size,
    maxCommissionSol: Number(maxCommissionSol.toFixed(6)),
    transactions: pageSlice,
    nextCursor,
    hasMore,
    range,
  };
}
