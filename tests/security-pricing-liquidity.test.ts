import { describe, it, expect } from "vitest";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  AuthorityType,
  TOKEN_PROGRAM_ID,
  createSetAuthorityInstruction,
} from "@solana/spl-token";
import {
  DEFAULT_CREATE_TOKEN_FEE_SOL,
  OFFICIAL_DEV_WALLET_PUBKEY,
  OPERATION_SERVICE_FEES_SOL,
  PRICING_SOL,
  calculateModularTokenCreationFee,
  computeRateSplitPercent,
  computeSplit,
  formatSolAmount,
  getTokenCreationFeeRangeSol,
} from "@/config/pricing";
import {
  getClientIp,
  isValidPublicKey,
  sanitizeErrorMessage,
  toRawTokenAmount,
  verifyTransactionIntegrity,
} from "@/lib/security";
import {
  getFallbackCpmmConfigs,
  resolveCpmmFeeConfig,
} from "@/lib/services/liquidityPoolService";

describe("Phase 3 — Pricing Single Source of Truth (src/config/pricing.ts)", () => {
  it("computes default modular token creation fee dynamically (0.35 SOL)", () => {
    expect(DEFAULT_CREATE_TOKEN_FEE_SOL).toBe(0.35);
    expect(OPERATION_SERVICE_FEES_SOL.createToken).toBe(0.35);
  });

  it("computes exact 30% affiliate / 70% dev wallet lamport splits without rounding loss", () => {
    const split = computeSplit(0.35);
    expect(split.totalLamports).toBe(350_000_000);
    expect(split.affiliateLamports).toBe(105_000_000);
    expect(split.devWalletLamports).toBe(245_000_000);
    expect(split.affiliateLamports + split.devWalletLamports).toBe(split.totalLamports);
  });

  it("computes Reclaim SOL split as a percentage rate (8% fee / 92% net) rather than SOL", () => {
    const rateSplit = computeRateSplitPercent(PRICING_SOL.reclaimSolPlatformFeeRate);
    expect(rateSplit.totalRatePercent).toBe(8);
    expect(rateSplit.netUserRatePercent).toBe(92);
    expect(rateSplit.affiliateRatePercent).toBe(2.4);
    expect(rateSplit.devWalletRatePercent).toBe(5.6);
  });

  it("formats small SOL amounts like 0.005 SOL without rounding to 0.01", () => {
    expect(formatSolAmount(0.005)).toBe("0.005");
    expect(formatSolAmount(0.1)).toBe("0.10");
    expect(formatSolAmount(0.35)).toBe("0.35");
  });

  it("dynamically computes min and max token creation fee range", () => {
    const range = getTokenCreationFeeRangeSol();
    expect(range.minSol).toBe(0.1);
    expect(range.recommendedSol).toBe(0.35);
    expect(range.maxStandardSol).toBe(0.55);
    expect(range.maxFullSuiteSol).toBeGreaterThan(range.maxStandardSol);
  });
});

describe("Phase 1 & 4 — Security Helpers, Strict toRawTokenAmount & PublicKey Validation", () => {
  it("converts valid decimal amounts to raw BigInt units", () => {
    expect(toRawTokenAmount("1000", 9)).toBe(BigInt("1000000000000"));
    expect(toRawTokenAmount("1.25", 6)).toBe(BigInt("1250000"));
    expect(toRawTokenAmount(0.5, 9)).toBe(BigInt("500000000"));
  });

  it("throws an explicit error when fractional digits exceed token decimals (no silent truncation)", () => {
    expect(() => toRawTokenAmount("1.1234567", 6)).toThrow(/exceeds the token's maximum of 6 decimals/);
    expect(() => toRawTokenAmount("10.5", 0)).toThrow(/exceeds the token's maximum of 0 decimals/);
  });

  it("rejects zero, negative, or malformed token amounts", () => {
    expect(() => toRawTokenAmount("0", 9)).toThrow();
    expect(() => toRawTokenAmount("-5", 9)).toThrow();
    expect(() => toRawTokenAmount("abc", 9)).toThrow();
  });

  it("masks all RPC URLs (http/https/ws/wss) and API keys in sanitizeErrorMessage", () => {
    const rawErr = new Error(
      "Fetch failed at https://mainnet.helius-rpc.com/?api-key=2e9c5f4b-aacf-4903 and wss://devnet.helius-rpc.com?apikey=secret123 with Bearer tok_999"
    );
    const sanitized = sanitizeErrorMessage(rawErr);
    expect(sanitized).not.toContain("helius-rpc.com");
    expect(sanitized).not.toContain("2e9c5f4b");
    expect(sanitized).not.toContain("secret123");
    expect(sanitized).not.toContain("tok_999");
    expect(sanitized).toContain("[RPC_URL_REDACTED]");
  });

  it("validates Solana base58 public keys accurately", () => {
    expect(isValidPublicKey(OFFICIAL_DEV_WALLET_PUBKEY.toBase58())).toBe(true);
    expect(isValidPublicKey("invalid-key")).toBe(false);
    expect(isValidPublicKey("")).toBe(false);
  });

  it("extracts trusted platform IP or isolated fingerprint (never shared 'anonymous')", () => {
    const reqWithVercelIp = new Request("https://www.createtokensol.store/api/create-token", {
      headers: { "x-vercel-forwarded-for": "203.0.113.42, 10.0.0.1" },
    });
    expect(getClientIp(reqWithVercelIp)).toBe("203.0.113.42");

    const reqWithoutIp = new Request("https://www.createtokensol.store/api/create-token", {
      headers: { "user-agent": "Mozilla/5.0 TestAgent" },
    });
    const fallbackId = getClientIp(reqWithoutIp);
    expect(fallbackId).not.toBe("anonymous");
    expect(fallbackId.startsWith("fp_")).toBe(true);
  });
});

describe("Phase 2.8 — resolveCpmmFeeConfig Strict Fee Tier Validation", () => {
  const cpmmProgramId = new PublicKey("CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C");
  const fallbackConfigs = getFallbackCpmmConfigs(cpmmProgramId);

  it("resolves valid Raydium CPMM fee tiers (25, 100, 200, 400 bps)", async () => {
    const res25 = await resolveCpmmFeeConfig({
      cpmmProgramId,
      feeTierBps: 25,
      network: "mainnet-beta",
      overrideConfigs: fallbackConfigs,
    });
    expect(res25.selectedConfig.tradeFeeRate).toBe(2500);

    const res100 = await resolveCpmmFeeConfig({
      cpmmProgramId,
      feeTierBps: 100,
      network: "mainnet-beta",
      overrideConfigs: fallbackConfigs,
    });
    expect(res100.selectedConfig.tradeFeeRate).toBe(10000);
  });

  it("throws an explicit error when an unsupported feeTierBps is requested", async () => {
    await expect(
      resolveCpmmFeeConfig({
        cpmmProgramId,
        feeTierBps: 30,
        network: "mainnet-beta",
        overrideConfigs: fallbackConfigs,
      })
    ).rejects.toThrow(/Unsupported Raydium CPMM fee tier: 30 bps/);
  });
});

describe("Phase 1.2 — verifyTransactionIntegrity Deep Instruction & Malicious Transaction Audit", () => {
  const userKeypair = Keypair.generate();
  const userPubkey = userKeypair.publicKey;
  const mintKeypair = Keypair.generate();
  const affiliateKeypair = Keypair.generate();
  const attackerKeypair = Keypair.generate();
  const recentBlockhash = "11111111111111111111111111111111";

  function buildV0Tx(
    payerKey: PublicKey,
    instructions: TransactionInstruction[]
  ): VersionedTransaction {
    const msg = new TransactionMessage({
      payerKey,
      recentBlockhash,
      instructions,
    }).compileToV0Message();
    return new VersionedTransaction(msg);
  }

  it("accepts a valid token creation transaction with exact Dev Wallet fee and null SetAuthority", () => {
    const modularOptions = {
      revokeFreeze: true,
      revokeMint: true,
      immutableMetadata: true,
      customCreatorInfo: false,
      hasTransferFeeExtension: false,
    };
    const { totalLamports } = calculateModularTokenCreationFee(modularOptions);

    const tx = buildV0Tx(userPubkey, [
      SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: OFFICIAL_DEV_WALLET_PUBKEY,
        lamports: totalLamports,
      }),
      createSetAuthorityInstruction(
        mintKeypair.publicKey,
        userPubkey,
        AuthorityType.MintTokens,
        null,
        [],
        TOKEN_PROGRAM_ID
      ),
    ]);

    const check = verifyTransactionIntegrity(tx, userPubkey.toBase58(), {
      operation: "createToken",
      modularOptions,
    });
    expect(check.valid).toBe(true);
  });

  it("accepts a valid 30% affiliate / 70% dev wallet split transaction", () => {
    const feeSol = 0.07;
    const split = computeSplit(feeSol);

    const tx = buildV0Tx(userPubkey, [
      SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: OFFICIAL_DEV_WALLET_PUBKEY,
        lamports: split.devWalletLamports,
      }),
      SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: affiliateKeypair.publicKey,
        lamports: split.affiliateLamports,
      }),
    ]);

    const check = verifyTransactionIntegrity(tx, userPubkey.toBase58(), {
      operation: "burnToken",
      expectedServiceFeeSol: feeSol,
      affiliateWallet: affiliateKeypair.publicKey.toBase58(),
    });
    expect(check.valid).toBe(true);
  });

  it("BLOCKS a malicious transaction transferring SOL to an unauthorized attacker wallet", () => {
    const tx = buildV0Tx(userPubkey, [
      SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: attackerKeypair.publicKey,
        lamports: Math.round(0.35 * LAMPORTS_PER_SOL),
      }),
    ]);

    const check = verifyTransactionIntegrity(tx, userPubkey.toBase58(), {
      operation: "createToken",
      expectedServiceFeeSol: 0.35,
    });
    expect(check.valid).toBe(false);
    expect(check.reason).toContain("unauthorized SystemProgram.transfer");
  });

  it("BLOCKS a transaction with a tampered service fee amount", () => {
    const tx = buildV0Tx(userPubkey, [
      SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: OFFICIAL_DEV_WALLET_PUBKEY,
        lamports: Math.round(0.95 * LAMPORTS_PER_SOL), // Inflated fee!
      }),
    ]);

    const check = verifyTransactionIntegrity(tx, userPubkey.toBase58(), {
      operation: "burnToken",
      expectedServiceFeeSol: 0.07,
    });
    expect(check.valid).toBe(false);
    expect(check.reason).toContain("Service fee amount mismatch");
  });

  it("BLOCKS a malicious SetAuthority instruction assigning authority to an attacker", () => {
    const tx = buildV0Tx(userPubkey, [
      createSetAuthorityInstruction(
        mintKeypair.publicKey,
        userPubkey,
        AuthorityType.MintTokens,
        attackerKeypair.publicKey, // Malicious authority hijack!
        [],
        TOKEN_PROGRAM_ID
      ),
    ]);

    const check = verifyTransactionIntegrity(tx, userPubkey.toBase58(), {
      operation: "manageAuthority",
    });
    expect(check.valid).toBe(false);
    expect(check.reason).toContain("Blocked unauthorized SetAuthority");
  });

  it("BLOCKS a transaction invoking a program not in the operation-specific whitelist", () => {
    const rogueProgramId = Keypair.generate().publicKey;
    const tx = buildV0Tx(userPubkey, [
      new TransactionInstruction({
        programId: rogueProgramId,
        keys: [{ pubkey: userPubkey, isSigner: true, isWritable: true }],
        data: Buffer.from([1, 2, 3]),
      }),
    ]);

    const check = verifyTransactionIntegrity(tx, userPubkey.toBase58(), {
      operation: "manageAuthority",
    });
    expect(check.valid).toBe(false);
    expect(check.reason).toContain("Blocked unauthorized program ID");
  });
});
