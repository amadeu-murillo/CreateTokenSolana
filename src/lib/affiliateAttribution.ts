import { PublicKey } from "@solana/web3.js";
import { isValidPublicKey } from "@/lib/security";

export const AFFILIATE_REF_STORAGE_KEY = "affiliateRef";
export const PENDING_COMMISSIONS_STORAGE_KEY = "pendingAffiliateCommissions";
export const AFFILIATE_ATTRIBUTION_WINDOW_DAYS = 30;
export const AFFILIATE_ATTRIBUTION_WINDOW_MS =
  AFFILIATE_ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/**
 * Attribution precedence rule:
 * "last-click" — a new valid `?ref=<wallet>` overwrites any previously stored referral
 * and refreshes the 30-day attribution window. Invalid refs are ignored and never
 * overwrite an existing valid referral.
 */
export const AFFILIATE_ATTRIBUTION_RULE = "last-click" as const;

export interface StoredAffiliateRefPayload {
  ref: string;
  capturedAt: number;
}

export interface ParsedAffiliateRef {
  ref: string;
  capturedAt: number | null;
  expired: boolean;
}

export interface PendingCommissionPayload {
  affiliateWallet: string;
  commissionAmountSOL: number;
  transactionSignature: string;
  tokenCreatorWallet: string;
  mintAddress: string;
  network: string;
  attempts?: number;
  lastAttemptAt?: number;
}

/**
 * Validates that an address is both a syntactically valid Solana public key
 * AND lies on the Ed25519 curve (rejecting PDAs / off-curve program addresses).
 */
export function isOnCurvePublicKey(address: string): boolean {
  if (!isValidPublicKey(address)) return false;
  try {
    return PublicKey.isOnCurve(new PublicKey(address.trim()).toBytes());
  } catch {
    return false;
  }
}

/**
 * Parses `affiliateRef` from either the legacy plain-string format (`"7xK9..."`)
 * or the timestamped JSON format (`{"ref":"7xK9...","capturedAt":1700000000000}`).
 * Never throws on malformed values.
 */
export function parseStoredAffiliateRef(
  raw: string | null | undefined,
  nowMs: number = Date.now()
): ParsedAffiliateRef | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Timestamped JSON format
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as Partial<StoredAffiliateRefPayload>;
      if (!parsed || typeof parsed.ref !== "string") return null;
      const cleanedRef = parsed.ref.trim();
      if (!isValidPublicKey(cleanedRef)) return null;
      const capturedAt =
        typeof parsed.capturedAt === "number" && Number.isFinite(parsed.capturedAt)
          ? parsed.capturedAt
          : null;
      const expired =
        capturedAt !== null && nowMs - capturedAt > AFFILIATE_ATTRIBUTION_WINDOW_MS;
      return { ref: cleanedRef, capturedAt, expired };
    } catch {
      return null;
    }
  }

  // Legacy plain-string format (kept backwards-compatible)
  if (isValidPublicKey(trimmed)) {
    return { ref: trimmed, capturedAt: null, expired: false };
  }

  return null;
}

export function serializeAffiliateRef(ref: string, capturedAt: number = Date.now()): string {
  const payload: StoredAffiliateRefPayload = { ref: ref.trim(), capturedAt };
  return JSON.stringify(payload);
}

/**
 * Reads the currently active affiliate wallet from localStorage, returning `null`
 * if absent, invalid, or expired beyond the 30-day attribution window.
 */
export function getStoredAffiliateRef(nowMs: number = Date.now()): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AFFILIATE_REF_STORAGE_KEY);
    const parsed = parseStoredAffiliateRef(raw, nowMs);
    if (!parsed) return null;
    if (parsed.expired) {
      window.localStorage.removeItem(AFFILIATE_REF_STORAGE_KEY);
      return null;
    }
    return parsed.ref;
  } catch {
    return null;
  }
}

/**
 * Captures a `?ref=` query parameter using last-click attribution with a 30-day window.
 * Invalid candidates are safely ignored without overwriting a valid stored referral.
 */
export function captureAffiliateRef(
  candidateRef: string | null | undefined,
  nowMs: number = Date.now()
): { activeRef: string | null; capturedNew: boolean } {
  if (typeof window === "undefined") {
    return { activeRef: null, capturedNew: false };
  }

  if (typeof candidateRef === "string" && isValidPublicKey(candidateRef.trim())) {
    const cleaned = candidateRef.trim();
    try {
      window.localStorage.setItem(
        AFFILIATE_REF_STORAGE_KEY,
        serializeAffiliateRef(cleaned, nowMs)
      );
    } catch {
      // Ignore storage quota / privacy mode errors
    }
    return { activeRef: cleaned, capturedNew: true };
  }

  return { activeRef: getStoredAffiliateRef(nowMs), capturedNew: false };
}

function readPendingCommissions(): PendingCommissionPayload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_COMMISSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePendingCommissions(items: PendingCommissionPayload[]): void {
  if (typeof window === "undefined") return;
  try {
    if (items.length === 0) {
      window.localStorage.removeItem(PENDING_COMMISSIONS_STORAGE_KEY);
    } else {
      window.localStorage.setItem(
        PENDING_COMMISSIONS_STORAGE_KEY,
        JSON.stringify(items.slice(-20))
      );
    }
  } catch {
    // Ignore storage errors
  }
}

export function enqueuePendingCommission(payload: PendingCommissionPayload): void {
  const existing = readPendingCommissions().filter(
    (item) => item.transactionSignature !== payload.transactionSignature
  );
  existing.push({
    ...payload,
    attempts: (payload.attempts ?? 0) + 1,
    lastAttemptAt: Date.now(),
  });
  writePendingCommissions(existing);
}

export function removePendingCommission(transactionSignature: string): void {
  const remaining = readPendingCommissions().filter(
    (item) => item.transactionSignature !== transactionSignature
  );
  writePendingCommissions(remaining);
}

const RETRY_DELAYS_MS = [600, 1500, 3000];

/**
 * Posts a commission record to `/api/record-commission` with exponential backoff (up to 3 attempts).
 * If transient failures persist, queues the payload in localStorage for automatic retry on the next visit.
 */
export async function recordCommissionWithRetry(
  payload: PendingCommissionPayload,
  maxAttempts: number = 3
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch("/api/record-commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateWallet: payload.affiliateWallet,
          commissionAmountSOL: payload.commissionAmountSOL,
          transactionSignature: payload.transactionSignature,
          tokenCreatorWallet: payload.tokenCreatorWallet,
          mintAddress: payload.mintAddress,
          network: payload.network,
        }),
      });

      // Success, already recorded (409), or permanent validation rejection (400)
      if (response.ok || response.status === 409 || response.status === 400) {
        removePendingCommission(payload.transactionSignature);
        return response.ok || response.status === 409;
      }
    } catch {
      // Transient network error — retry with backoff
    }

    if (attempt < maxAttempts - 1) {
      const delay = RETRY_DELAYS_MS[attempt] ?? 2000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  enqueuePendingCommission(payload);
  return false;
}

/**
 * Flushes any queued commission records saved in localStorage from prior failed attempts.
 */
export async function flushPendingCommissions(): Promise<void> {
  const pending = readPendingCommissions();
  if (pending.length === 0) return;

  for (const item of pending) {
    // Give up after 10 lifetime attempts to avoid infinite loops on stale txs
    if ((item.attempts ?? 0) >= 10) {
      removePendingCommission(item.transactionSignature);
      continue;
    }
    await recordCommissionWithRetry(item, 1);
  }
}
