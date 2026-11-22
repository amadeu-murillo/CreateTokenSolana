import { describe, it, expect, beforeEach } from "vitest";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  AFFILIATE_TTL_MS,
  captureAffiliateFromUrl,
  clearAffiliateAttribution,
  getActiveAffiliateRef,
  isEligibleAffiliateRef,
  isValidSolanaWalletAddress,
  persistAffiliateRef,
} from "@/lib/affiliateAttribution";
import {
  OFFICIAL_DEV_WALLET_STRING,
  PRICING_SOL,
  computeSplit,
} from "@/config/pricing";
import { calculateIllustrativeAffiliateEarnings } from "@/components/affiliates/EarningsCalculator";
import {
  buildServiceFeeInstructions,
  resolveSafeAffiliateSplitInstructions,
} from "@/lib/services/solanaHelpers";

describe("Affiliate Attribution & Split Mechanics", () => {
  const walletA = Keypair.generate().publicKey.toBase58();
  const walletB = Keypair.generate().publicKey.toBase58();
  const payer = Keypair.generate().publicKey;

  beforeEach(() => {
    clearAffiliateAttribution();
  });

  it("validates canonical Base58 ed25519 Solana addresses and rejects PDAs/malformed strings", () => {
    expect(isValidSolanaWalletAddress(walletA)).toBe(true);
    expect(isValidSolanaWalletAddress("invalid-wallet")).toBe(false);
    expect(isValidSolanaWalletAddress("0OIl" + "1".repeat(36))).toBe(false);

    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    );
    expect(isValidSolanaWalletAddress(pda.toBase58())).toBe(false);
  });

  it("blocks self-referral and dev wallet spoofing", () => {
    expect(isEligibleAffiliateRef(walletA, walletA)).toBe(false);
    expect(isEligibleAffiliateRef(OFFICIAL_DEV_WALLET_STRING, payer.toBase58())).toBe(false);
    expect(isEligibleAffiliateRef(walletA, payer.toBase58())).toBe(true);
  });

  it("persists ref for 30 days with last-click overwrite and expires after TTL", () => {
    const t0 = 1_700_000_000_000;
    const saved = persistAffiliateRef(walletA, t0);
    expect(saved?.ref).toBe(walletA);
    expect(getActiveAffiliateRef(t0 + 1000)).toBe(walletA);

    const res = captureAffiliateFromUrl(`?ref=${walletB}`, null, t0 + 5000);
    expect(res.ref).toBe(walletB);
    expect(res.isNewCapture).toBe(true);

    const invalidRes = captureAffiliateFromUrl("?ref=not_a_wallet", null, t0 + 10_000);
    expect(invalidRes.ref).toBe(walletB);
    expect(invalidRes.isNewCapture).toBe(false);

    expect(getActiveAffiliateRef(t0 + 5000 + AFFILIATE_TTL_MS + 1)).toBeNull();
  });

  it("computes illustrative calculator earnings matching pricing.ts", () => {
    const res = calculateIllustrativeAffiliateEarnings(PRICING_SOL.createLiquidityPool, 10, 150);
    expect(res.perReferralSol).toBe(computeSplit(PRICING_SOL.createLiquidityPool).affiliateSol);
    expect(res.monthlySol).toBe(0.21);
    expect(res.monthlyUsd).toBe(31.5);
  });

  it("falls back silently to 100% dev wallet on invalid ref or below rent-exempt new account", async () => {
    const syncInvalid = buildServiceFeeInstructions(payer, 70_000_000, "invalid");
    expect(syncInvalid).toHaveLength(1);

    const mockConnection = {
      getAccountInfo: async () => null,
      getMinimumBalanceForRentExemption: async () => 890_880,
    } as never;

    const lowFeeFallback = await resolveSafeAffiliateSplitInstructions({
      connection: mockConnection,
      userPublicKey: payer,
      totalFeeLamports: 100_000,
      affiliateAddress: walletA,
    });
    expect(lowFeeFallback.usedAffiliateSplit).toBe(false);
    expect(lowFeeFallback.fallbackReason).toBe("below_rent_exempt_new_account");
    expect(lowFeeFallback.instructions).toHaveLength(1);
    expect(lowFeeFallback.devWalletLamports).toBe(100_000);
  });
});
