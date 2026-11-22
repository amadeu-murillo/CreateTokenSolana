import { describe, it, expect, beforeEach } from "vitest";
import { Keypair } from "@solana/web3.js";
import {
  AFFILIATE_ATTRIBUTION_WINDOW_MS,
  AFFILIATE_REF_STORAGE_KEY,
  captureAffiliateRef,
  parseStoredAffiliateRef,
  serializeAffiliateRef,
} from "../src/lib/affiliateAttribution";
import {
  computeAffiliateAggregates,
  type AffiliateCommissionRecord,
} from "../src/lib/affiliateEarnings";
import en from "../src/i18n/locales/en";
import ptBR from "../src/i18n/locales/pt-BR";
import es from "../src/i18n/locales/es";
import ru from "../src/i18n/locales/ru";
import zh from "../src/i18n/locales/zh";

function collectLeafKeys(obj: unknown, prefix = ""): string[] {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return prefix ? [prefix] : [];
  }
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...collectLeafKeys(v, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

describe("Affiliate earnings aggregates (>100 records, range, cursor)", () => {
  const nowMs = Date.UTC(2026, 10, 22, 12, 0, 0);
  const nowSec = Math.floor(nowMs / 1000);

  it("aggregates totals accurately across more than 100 commissions with unique wallets and max", () => {
    const records: AffiliateCommissionRecord[] = [];
    for (let i = 0; i < 125; i++) {
      records.push({
        signature: `sig_${String(i).padStart(4, "0")}`,
        blockTime: nowSec - i * 3600,
        createdAtIso: new Date((nowSec - i * 3600) * 1000).toISOString(),
        amount: i === 0 ? 0.25 : 0.1,
        tokenCreatorWallet: `creator_${i % 40}`,
      });
    }

    const page1 = computeAffiliateAggregates({
      records,
      range: "all",
      limit: 10,
      nowMs,
    });

    // 1 * 0.25 + 124 * 0.10 = 12.65 SOL
    expect(page1.totalEarningsSol).toBeCloseTo(12.65, 6);
    expect(page1.commissionsCount).toBe(125);
    expect(page1.uniqueReferredWallets).toBe(40);
    expect(page1.maxCommissionSol).toBeCloseTo(0.25, 6);
    expect(page1.transactions).toHaveLength(10);
    expect(page1.hasMore).toBe(true);
    expect(page1.nextCursor).toBe("sig_0009");

    const page2 = computeAffiliateAggregates({
      records,
      range: "all",
      limit: 10,
      cursor: page1.nextCursor,
      nowMs,
    });

    expect(page2.transactions).toHaveLength(10);
    expect(page2.transactions[0].signature).toBe("sig_0010");
  });

  it("filters records by 7d and 30d range windows", () => {
    const day = 86_400;
    const records: AffiliateCommissionRecord[] = [
      { signature: "s1", blockTime: nowSec - 2 * day, createdAtIso: null, amount: 0.1, tokenCreatorWallet: "w1" },
      { signature: "s2", blockTime: nowSec - 15 * day, createdAtIso: null, amount: 0.2, tokenCreatorWallet: "w2" },
      { signature: "s3", blockTime: nowSec - 60 * day, createdAtIso: null, amount: 0.3, tokenCreatorWallet: "w3" },
    ];

    const res7d = computeAffiliateAggregates({ records, range: "7d", nowMs });
    expect(res7d.commissionsCount).toBe(1);
    expect(res7d.totalEarningsSol).toBeCloseTo(0.1, 6);

    const res30d = computeAffiliateAggregates({ records, range: "30d", nowMs });
    expect(res30d.commissionsCount).toBe(2);
    expect(res30d.totalEarningsSol).toBeCloseTo(0.3, 6);
  });
});

describe("Affiliate ref attribution parsing & 30-day expiration", () => {
  const walletA = Keypair.generate().publicKey.toBase58();
  const walletB = Keypair.generate().publicKey.toBase58();
  const nowMs = Date.UTC(2026, 10, 22, 12, 0, 0);

  beforeEach(() => {
    const store = new Map<string, string>();
    (globalThis as unknown as { window?: unknown }).window = {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
      },
    };
  });

  it("supports legacy plain-string format", () => {
    const parsed = parseStoredAffiliateRef(walletA, nowMs);
    expect(parsed).toEqual({ ref: walletA, capturedAt: null, expired: false });
  });

  it("supports timestamped JSON format and expires after 30 days", () => {
    const freshRaw = serializeAffiliateRef(walletA, nowMs - 10_000);
    const fresh = parseStoredAffiliateRef(freshRaw, nowMs);
    expect(fresh?.ref).toBe(walletA);
    expect(fresh?.expired).toBe(false);

    const expiredRaw = serializeAffiliateRef(
      walletA,
      nowMs - AFFILIATE_ATTRIBUTION_WINDOW_MS - 1_000
    );
    const expired = parseStoredAffiliateRef(expiredRaw, nowMs);
    expect(expired?.expired).toBe(true);
  });

  it("ignores invalid refs without overwriting an existing valid stored ref", () => {
    const first = captureAffiliateRef(walletA, nowMs);
    expect(first.activeRef).toBe(walletA);
    expect(first.capturedNew).toBe(true);

    const invalidAttempt = captureAffiliateRef("not-a-solana-wallet", nowMs + 1000);
    expect(invalidAttempt.activeRef).toBe(walletA);
    expect(invalidAttempt.capturedNew).toBe(false);

    // Last valid click overwrites previous valid ref
    const second = captureAffiliateRef(walletB, nowMs + 2000);
    expect(second.activeRef).toBe(walletB);
    expect(second.capturedNew).toBe(true);

    const stored = (globalThis as unknown as { window: { localStorage: Storage } }).window.localStorage.getItem(
      AFFILIATE_REF_STORAGE_KEY
    );
    expect(stored).toContain(walletB);
  });
});

describe("Affiliate i18n parity across all 5 locales", () => {
  it("keeps identical affiliatesPage keys across en, pt-BR, es, ru, and zh", () => {
    const expectedKeys = collectLeafKeys(en.affiliatesPage);
    const locales = { "pt-BR": ptBR, es, ru, zh };

    for (const [code, dict] of Object.entries(locales)) {
      const actualKeys = collectLeafKeys(dict.affiliatesPage);
      expect(actualKeys, `Locale ${code} affiliatesPage keys mismatch`).toEqual(expectedKeys);
      expect(dict.affiliatesPage.steps.length, `Locale ${code} steps length`).toBe(
        en.affiliatesPage.steps.length
      );
      expect(dict.affiliatesPage.faqItems.length, `Locale ${code} faqItems length`).toBe(
        en.affiliatesPage.faqItems.length
      );
    }
  });
});
