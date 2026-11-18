import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { z } from "zod";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  DEV_WALLET_ADDRESS_STRING,
  MAX_AIRDROP_RECIPIENTS_PER_TX,
  MAX_IMAGE_FILE_SIZE_BYTES,
  METAPLEX_METADATA_PROGRAM_ID_STRING,
  ModularPricingOptions,
  RAYDIUM_AMM_V4_PROGRAM_DEVNET_STRING,
  RAYDIUM_AMM_V4_PROGRAM_MAINNET_STRING,
  RAYDIUM_CLMM_PROGRAM_DEVNET_STRING,
  RAYDIUM_CLMM_PROGRAM_MAINNET_STRING,
  RAYDIUM_CPMM_FEE_RECEIVER_DEVNET,
  RAYDIUM_CPMM_FEE_RECEIVER_MAINNET,
  RAYDIUM_CPMM_LEGACY_PROGRAM_ID_DEVNET_STRING,
  RAYDIUM_CPMM_PROGRAM_ID_DEVNET_STRING,
  RAYDIUM_CPMM_PROGRAM_ID_MAINNET_STRING,
  RAYDIUM_LOCK_CPMM_PROGRAM_DEVNET_LEGACY_STRING,
  RAYDIUM_LOCK_CPMM_PROGRAM_DEVNET_STRING,
  RAYDIUM_LOCK_CPMM_PROGRAM_MAINNET_STRING,
  RAYDIUM_ROUTING_PROGRAM_DEVNET_STRING,
  RAYDIUM_ROUTING_PROGRAM_MAINNET_STRING,
  SPL_MEMO_PROGRAM_V1_STRING,
  SPL_MEMO_PROGRAM_V2_STRING,
  calculateModularTokenCreationFee,
  computeSplit,
} from "./constants";

const SYSTEM_PROGRAM_ID_STR = SystemProgram.programId.toBase58();
const COMPUTE_BUDGET_ID_STR = ComputeBudgetProgram.programId.toBase58();
const SYSVAR_RENT_ID_STR = SYSVAR_RENT_PUBKEY.toBase58();
const SPL_TOKEN_ID_STR = TOKEN_PROGRAM_ID.toBase58();
const TOKEN_2022_ID_STR = TOKEN_2022_PROGRAM_ID.toBase58();
const ATA_PROGRAM_ID_STR = ASSOCIATED_TOKEN_PROGRAM_ID.toBase58();

export type TransactionOperationType =
  | "createToken"
  | "createLiquidityPool"
  | "removeLiquidity"
  | "burnToken"
  | "burnAndEarn"
  | "reclaimSol"
  | "airdrop"
  | "manageAuthority"
  | "claimWithheldTax"
  | "tokenVestingLock"
  | "tokenVestingClaim"
  | "volumeBotActivate";

const BASE_CORE_PROGRAMS = [
  SYSTEM_PROGRAM_ID_STR,
  COMPUTE_BUDGET_ID_STR,
  SYSVAR_RENT_ID_STR,
  SPL_TOKEN_ID_STR,
  TOKEN_2022_ID_STR,
  ATA_PROGRAM_ID_STR,
] as const;

export const PROGRAM_WHITELIST_BY_OPERATION: Record<
  TransactionOperationType,
  ReadonlySet<string>
> = {
  createToken: new Set([
    ...BASE_CORE_PROGRAMS,
    METAPLEX_METADATA_PROGRAM_ID_STRING,
  ]),
  createLiquidityPool: new Set([
    ...BASE_CORE_PROGRAMS,
    RAYDIUM_CPMM_PROGRAM_ID_MAINNET_STRING,
    RAYDIUM_CPMM_PROGRAM_ID_DEVNET_STRING,
    RAYDIUM_CPMM_LEGACY_PROGRAM_ID_DEVNET_STRING,
  ]),
  removeLiquidity: new Set([
    ...BASE_CORE_PROGRAMS,
    SPL_MEMO_PROGRAM_V2_STRING,
    SPL_MEMO_PROGRAM_V1_STRING,
    RAYDIUM_CPMM_PROGRAM_ID_MAINNET_STRING,
    RAYDIUM_CPMM_PROGRAM_ID_DEVNET_STRING,
    RAYDIUM_CPMM_LEGACY_PROGRAM_ID_DEVNET_STRING,
  ]),
  burnToken: new Set([
    ...BASE_CORE_PROGRAMS,
    SPL_MEMO_PROGRAM_V2_STRING,
    SPL_MEMO_PROGRAM_V1_STRING,
  ]),
  burnAndEarn: new Set([
    ...BASE_CORE_PROGRAMS,
    SPL_MEMO_PROGRAM_V2_STRING,
    SPL_MEMO_PROGRAM_V1_STRING,
    RAYDIUM_LOCK_CPMM_PROGRAM_MAINNET_STRING,
    RAYDIUM_LOCK_CPMM_PROGRAM_DEVNET_STRING,
    RAYDIUM_LOCK_CPMM_PROGRAM_DEVNET_LEGACY_STRING,
  ]),
  reclaimSol: new Set([
    SYSTEM_PROGRAM_ID_STR,
    COMPUTE_BUDGET_ID_STR,
    SPL_TOKEN_ID_STR,
    TOKEN_2022_ID_STR,
  ]),
  airdrop: new Set([
    ...BASE_CORE_PROGRAMS,
    SPL_MEMO_PROGRAM_V2_STRING,
  ]),
  manageAuthority: new Set([
    SYSTEM_PROGRAM_ID_STR,
    COMPUTE_BUDGET_ID_STR,
    SPL_TOKEN_ID_STR,
    TOKEN_2022_ID_STR,
  ]),
  claimWithheldTax: new Set([
    SYSTEM_PROGRAM_ID_STR,
    COMPUTE_BUDGET_ID_STR,
    SPL_TOKEN_ID_STR,
    TOKEN_2022_ID_STR,
    ATA_PROGRAM_ID_STR,
  ]),
  tokenVestingLock: new Set([
    ...BASE_CORE_PROGRAMS,
    SPL_MEMO_PROGRAM_V2_STRING,
    SPL_MEMO_PROGRAM_V1_STRING,
  ]),
  tokenVestingClaim: new Set([
    ...BASE_CORE_PROGRAMS,
    SPL_MEMO_PROGRAM_V2_STRING,
  ]),
  volumeBotActivate: new Set([
    ...BASE_CORE_PROGRAMS,
    RAYDIUM_CPMM_PROGRAM_ID_MAINNET_STRING,
    RAYDIUM_CPMM_PROGRAM_ID_DEVNET_STRING,
  ]),
};

export const WHITELISTED_SOLANA_PROGRAMS = new Set<string>([
  ...BASE_CORE_PROGRAMS,
  METAPLEX_METADATA_PROGRAM_ID_STRING,
  SPL_MEMO_PROGRAM_V2_STRING,
  SPL_MEMO_PROGRAM_V1_STRING,
  RAYDIUM_CPMM_PROGRAM_ID_MAINNET_STRING,
  RAYDIUM_CPMM_PROGRAM_ID_DEVNET_STRING,
  RAYDIUM_CPMM_LEGACY_PROGRAM_ID_DEVNET_STRING,
  RAYDIUM_AMM_V4_PROGRAM_MAINNET_STRING,
  RAYDIUM_AMM_V4_PROGRAM_DEVNET_STRING,
  RAYDIUM_CLMM_PROGRAM_MAINNET_STRING,
  RAYDIUM_CLMM_PROGRAM_DEVNET_STRING,
  RAYDIUM_ROUTING_PROGRAM_MAINNET_STRING,
  RAYDIUM_ROUTING_PROGRAM_DEVNET_STRING,
  RAYDIUM_LOCK_CPMM_PROGRAM_MAINNET_STRING,
  RAYDIUM_LOCK_CPMM_PROGRAM_DEVNET_STRING,
  RAYDIUM_LOCK_CPMM_PROGRAM_DEVNET_LEGACY_STRING,
]);

export interface VerifyTransactionOptions {
  operation?: TransactionOperationType;
  expectedServiceFeeSol?: number;
  modularOptions?: ModularPricingOptions;
  affiliateWallet?: string | null;
  expectedNewAuthority?: string | null;
  allowedTransferDestinations?: string[];
  addressLookupTableAccounts?: AddressLookupTableAccount[];
  loadedAddresses?: {
    writable: PublicKey[];
    readonly: PublicKey[];
  };
}

/**
 * Resolves the full ordered list of account keys for a VersionedTransaction,
 * combining `staticAccountKeys` and any Address Lookup Table (`addressTableLookups`) accounts.
 */
export function resolveTransactionAccountKeys(
  transaction: VersionedTransaction,
  options?: VerifyTransactionOptions
): { keys: PublicKey[]; error?: string } {
  const staticKeys = [...(transaction.message.staticAccountKeys || [])];
  const lookups = transaction.message.addressTableLookups || [];

  if (lookups.length === 0) {
    return { keys: staticKeys };
  }

  if (options?.loadedAddresses) {
    return {
      keys: [
        ...staticKeys,
        ...(options.loadedAddresses.writable || []),
        ...(options.loadedAddresses.readonly || []),
      ],
    };
  }

  if (
    options?.addressLookupTableAccounts &&
    options.addressLookupTableAccounts.length > 0
  ) {
    const writableKeys: PublicKey[] = [];
    const readonlyKeys: PublicKey[] = [];

    for (const lookup of lookups) {
      const table = options.addressLookupTableAccounts.find((t) =>
        t.key.equals(lookup.accountKey)
      );
      if (!table) {
        return {
          keys: [],
          error: `Security alert: Missing Address Lookup Table account (${lookup.accountKey.toBase58()}).`,
        };
      }
      for (const wIdx of lookup.writableIndexes) {
        const resolved = table.state.addresses[wIdx];
        if (!resolved) {
          return {
            keys: [],
            error: `Security alert: Out-of-bounds writable index ${wIdx} in Address Lookup Table.`,
          };
        }
        writableKeys.push(resolved);
      }
      for (const rIdx of lookup.readonlyIndexes) {
        const resolved = table.state.addresses[rIdx];
        if (!resolved) {
          return {
            keys: [],
            error: `Security alert: Out-of-bounds readonly index ${rIdx} in Address Lookup Table.`,
          };
        }
        readonlyKeys.push(resolved);
      }
    }

    return { keys: [...staticKeys, ...writableKeys, ...readonlyKeys] };
  }

  return {
    keys: [],
    error:
      "Security alert: Transaction contains unresolved Address Lookup Table references without provided lookup accounts.",
  };
}

function readUInt32LE(buf: Uint8Array, offset = 0): number {
  return (
    (buf[offset] |
      (buf[offset + 1] << 8) |
      (buf[offset + 2] << 16) |
      (buf[offset + 3] << 24)) >>>
    0
  );
}

function readBigUInt64LE(buf: Uint8Array, offset = 0): bigint {
  const low = BigInt(readUInt32LE(buf, offset));
  const high = BigInt(readUInt32LE(buf, offset + 4));
  return (high << BigInt(32)) + low;
}

/**
 * Simplified, canonical Solana Base58 PublicKey validator (Phase 4.18).
 */
export function isValidPublicKey(address: string): boolean {
  if (typeof address !== "string") return false;
  const trimmed = address.trim();
  if (trimmed.length < 32 || trimmed.length > 44) return false;
  try {
    return new PublicKey(trimmed).toBase58() === trimmed;
  } catch {
    return false;
  }
}

/**
 * Phase 1.2: Deep instruction-level security audit for VersionedTransactions before wallet signing.
 * Validates:
 * 1. Fee payer matches `expectedFeePayerBase58`.
 * 2. Every invoked program belongs to the operation-specific whitelist (`PROGRAM_WHITELIST_BY_OPERATION[operation]`).
 * 3. Every `SystemProgram.transfer` from the user goes ONLY to `DEV_WALLET_ADDRESS`, a valid `affiliateWallet`,
 *    or an internal ATA/vault created in the same transaction — and matches the exact fee/split from `calculateModularTokenCreationFee` / `computeSplit`.
 * 4. Every SPL Token / Token-2022 `SetAuthority` instruction sets `newAuthority` to `null` (or `expectedNewAuthority`).
 * 5. Supports Address Lookup Tables (`addressTableLookups`).
 */
export function verifyTransactionIntegrity(
  transaction: VersionedTransaction,
  expectedFeePayerBase58: string,
  options?: VerifyTransactionOptions
): { valid: boolean; reason?: string } {
  try {
    const resolved = resolveTransactionAccountKeys(transaction, options);
    if (resolved.error) {
      return { valid: false, reason: resolved.error };
    }

    const accountKeys = resolved.keys;
    if (accountKeys.length === 0) {
      return { valid: false, reason: "Transaction contains no account keys." };
    }

    const feePayer = accountKeys[0]?.toBase58();
    if (feePayer !== expectedFeePayerBase58) {
      return {
        valid: false,
        reason: `Security alert: Transaction fee payer (${feePayer}) does not match connected wallet (${expectedFeePayerBase58}).`,
      };
    }

    const allowedPrograms = options?.operation
      ? PROGRAM_WHITELIST_BY_OPERATION[options.operation]
      : WHITELISTED_SOLANA_PROGRAMS;

    // Collect accounts initialized or used as token/WSOL ATAs within the same transaction
    const internalTransactionAccounts = new Set<string>([
      expectedFeePayerBase58,
      RAYDIUM_CPMM_FEE_RECEIVER_MAINNET.toBase58(),
      RAYDIUM_CPMM_FEE_RECEIVER_DEVNET.toBase58(),
      ...(options?.allowedTransferDestinations || []),
    ]);

    for (const ix of transaction.message.compiledInstructions) {
      const programKey = accountKeys[ix.programIdIndex];
      if (!programKey) {
        return {
          valid: false,
          reason: "Security alert: Transaction references an out-of-bounds program index.",
        };
      }
      const progStr = programKey.toBase58();
      if (progStr === ATA_PROGRAM_ID_STR && ix.accountKeyIndexes.length >= 2) {
        const ataKey = accountKeys[ix.accountKeyIndexes[1]];
        if (ataKey) internalTransactionAccounts.add(ataKey.toBase58());
      }
      if (progStr === SYSTEM_PROGRAM_ID_STR && ix.data.length >= 4) {
        const sysIxType = readUInt32LE(ix.data, 0);
        // CreateAccount (0) or CreateAccountWithSeed (3)
        if ((sysIxType === 0 || sysIxType === 3) && ix.accountKeyIndexes.length >= 2) {
          const createdKey = accountKeys[ix.accountKeyIndexes[1]];
          if (createdKey) internalTransactionAccounts.add(createdKey.toBase58());
        }
      }
    }

    const validAffiliate =
      options?.affiliateWallet &&
      isValidPublicKey(options.affiliateWallet) &&
      options.affiliateWallet.trim() !== expectedFeePayerBase58 &&
      options.affiliateWallet.trim() !== DEV_WALLET_ADDRESS_STRING
        ? options.affiliateWallet.trim()
        : null;

    let transferredToDevLamports = BigInt(0);
    let transferredToAffiliateLamports = BigInt(0);

    for (const ix of transaction.message.compiledInstructions) {
      const programKey = accountKeys[ix.programIdIndex];
      if (!programKey) {
        return {
          valid: false,
          reason: "Security alert: Transaction references an out-of-bounds program index.",
        };
      }

      const programIdStr = programKey.toBase58();
      if (!allowedPrograms.has(programIdStr)) {
        return {
          valid: false,
          reason: `Security alert: Blocked unauthorized program ID (${programIdStr}) for operation ${
            options?.operation || "default"
          }.`,
        };
      }

      for (const accIdx of ix.accountKeyIndexes) {
        if (accIdx < 0 || accIdx >= accountKeys.length) {
          return {
            valid: false,
            reason: `Security alert: Instruction references out-of-bounds account index (${accIdx}).`,
          };
        }
      }

      // (a) Decode and validate SystemProgram instructions
      if (programIdStr === SYSTEM_PROGRAM_ID_STR && ix.data.length >= 4) {
        const sysIxIndex = readUInt32LE(ix.data, 0);
        // SystemProgram.transfer === 2 (12-byte data: u32 index + u64 lamports)
        if (sysIxIndex === 2) {
          if (ix.data.length < 12 || ix.accountKeyIndexes.length < 2) {
            return {
              valid: false,
              reason: "Security alert: Malformed SystemProgram.transfer instruction.",
            };
          }
          const fromPubkey = accountKeys[ix.accountKeyIndexes[0]].toBase58();
          const toPubkey = accountKeys[ix.accountKeyIndexes[1]].toBase58();
          const lamports = readBigUInt64LE(ix.data, 4);

          if (fromPubkey === expectedFeePayerBase58) {
            if (toPubkey === DEV_WALLET_ADDRESS_STRING) {
              transferredToDevLamports += lamports;
            } else if (validAffiliate && toPubkey === validAffiliate) {
              transferredToAffiliateLamports += lamports;
            } else if (!internalTransactionAccounts.has(toPubkey)) {
              return {
                valid: false,
                reason: `Security alert: Blocked unauthorized SystemProgram.transfer of ${lamports.toString()} lamports to unknown recipient (${toPubkey}).`,
              };
            }
          }
        }
      }

      // (b) Decode and validate SPL Token & Token-2022 SetAuthority (Discriminator = 6)
      if (
        (programIdStr === SPL_TOKEN_ID_STR || programIdStr === TOKEN_2022_ID_STR) &&
        ix.data.length >= 3 &&
        ix.data[0] === 6
      ) {
        const authorityOption = ix.data[2];
        if (authorityOption === 1) {
          if (ix.data.length < 35) {
            return {
              valid: false,
              reason: "Security alert: Malformed SetAuthority instruction payload.",
            };
          }
          const newAuthorityPubkey = new PublicKey(ix.data.slice(3, 35)).toBase58();
          if (
            !options?.expectedNewAuthority ||
            newAuthorityPubkey !== options.expectedNewAuthority
          ) {
            return {
              valid: false,
              reason: `Security alert: Blocked unauthorized SetAuthority attempting to assign authority to ${newAuthorityPubkey}.`,
            };
          }
        } else if (authorityOption !== 0) {
          return {
            valid: false,
            reason: `Security alert: Invalid authority option (${authorityOption}) in SetAuthority instruction.`,
          };
        } else if (options?.expectedNewAuthority) {
          return {
            valid: false,
            reason: "Security alert: Expected non-null authority assignment in SetAuthority.",
          };
        }
      }
    }

    // Validate exact service fee & 30%/70% split when modularOptions or expectedServiceFeeSol is provided
    const expectedFeeSol = options?.modularOptions
      ? calculateModularTokenCreationFee(options.modularOptions).totalSol
      : options?.expectedServiceFeeSol;

    if (typeof expectedFeeSol === "number" && expectedFeeSol > 0) {
      const split = computeSplit(expectedFeeSol);
      if (validAffiliate) {
        const expectedDev = BigInt(split.devWalletLamports);
        const expectedAff = BigInt(split.affiliateLamports);
        const devDiff =
          transferredToDevLamports >= expectedDev
            ? transferredToDevLamports - expectedDev
            : expectedDev - transferredToDevLamports;
        const affDiff =
          transferredToAffiliateLamports >= expectedAff
            ? transferredToAffiliateLamports - expectedAff
            : expectedAff - transferredToAffiliateLamports;

        if (devDiff > BigInt(2) || affDiff > BigInt(2)) {
          return {
            valid: false,
            reason: `Security alert: Service fee split mismatch. Expected ${expectedDev.toString()} dev / ${expectedAff.toString()} affiliate lamports, but transaction transfers ${transferredToDevLamports.toString()} / ${transferredToAffiliateLamports.toString()} lamports.`,
          };
        }
      } else {
        const expectedTotal = BigInt(split.totalLamports);
        const totalDiff =
          transferredToDevLamports >= expectedTotal
            ? transferredToDevLamports - expectedTotal
            : expectedTotal - transferredToDevLamports;

        if (totalDiff > BigInt(2) || transferredToAffiliateLamports > BigInt(0)) {
          return {
            valid: false,
            reason: `Security alert: Service fee amount mismatch. Expected ${expectedTotal.toString()} lamports to Dev Wallet, but transaction transfers ${transferredToDevLamports.toString()} lamports.`,
          };
        }
      }
    }

    return { valid: true };
  } catch (err: unknown) {
    return {
      valid: false,
      reason: `Failed to verify transaction integrity: ${
        (err instanceof Error ? err.message : String(err)) || "Unknown error"
      }`,
    };
  }
}

/**
 * Phase 1.5: Masks ANY RPC URL (http/https/ws/wss) and ANY api-key / token / secret in error messages.
 */
export function sanitizeErrorMessage(rawMessage: unknown, fallback = "Operation failed."): string {
  const msg =
    rawMessage instanceof Error
      ? rawMessage.message
      : typeof rawMessage === "string"
      ? rawMessage
      : fallback;

  return msg
    .replace(
      /(?:api[-_]?key|apikey|access[-_]?token|auth[-_]?token|token|secret|key)\s*[:=]\s*["']?[a-zA-Z0-9\-_.~+/=]+["']?/gi,
      "api-key=[REDACTED]"
    )
    .replace(/Bearer\s+[a-zA-Z0-9\-_.~+/=]+/gi, "Bearer [REDACTED]")
    .replace(/(?:https?|wss?):\/\/[^\s"'<>)\]]+/gi, "[RPC_URL_REDACTED]");
}

export const solanaClusterSchema = z
  .enum(["mainnet-beta", "devnet"])
  .default("mainnet-beta");

export const solanaAddressSchema = z
  .string()
  .trim()
  .min(32, "Invalid Solana address.")
  .max(44, "Invalid Solana address.")
  .refine(isValidPublicKey, { message: "Invalid Solana public key." });

export const optionalSolanaAddressSchema = z.preprocess(
  (val) => (typeof val === "string" && val.trim() === "" ? undefined : val ?? undefined),
  solanaAddressSchema.optional()
);

export const tokenProgramIdSchema = z
  .string()
  .trim()
  .refine(
    (val) => val === TOKEN_PROGRAM_ID.toBase58() || val === TOKEN_2022_PROGRAM_ID.toBase58(),
    { message: "Invalid Token Program ID (must be SPL Token or Token-2022)." }
  );

/**
 * Phase 4.18: Strict decimal conversion to raw BigInt token units.
 * Throws an error if the fractional precision exceeds `decimals` instead of silently truncating.
 */
export function toRawTokenAmount(amount: string | number, decimals: number): bigint {
  if (decimals < 0 || decimals > 18 || !Number.isInteger(decimals)) {
    throw new Error(`Invalid token decimals: ${decimals}`);
  }

  const normalized = String(amount).replace(/,/g, "").trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`Invalid token amount: "${amount}"`);
  }

  const [integerPart, fractionPart = ""] = normalized.split(".");
  if (fractionPart.length > decimals) {
    throw new Error(
      `Token amount "${amount}" has ${fractionPart.length} decimal places, which exceeds the token's maximum of ${decimals} decimals.`
    );
  }

  const paddedFraction = fractionPart.padEnd(decimals, "0");
  const combined = `${integerPart}${paddedFraction}`.replace(/^0+(?=\d)/, "");

  const raw = BigInt(combined || "0");
  if (raw <= BigInt(0)) {
    throw new Error("Converted token amount must be greater than zero.");
  }
  return raw;
}

export function sanitizeHttpsUrl(rawUrl?: string | null): string | undefined {
  if (!rawUrl || !rawUrl.trim()) return undefined;
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith("ar://")) {
    return `https://arweave.net/${trimmed.slice(5)}`;
  }
  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (parsed.protocol !== "https:") {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export function validateImageBuffer(
  buffer: Buffer,
  mimeType: string
): { valid: boolean; error?: string } {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "Empty image file." };
  }

  if (buffer.length > MAX_IMAGE_FILE_SIZE_BYTES) {
    return { valid: false, error: "File exceeds the maximum allowed size of 5 MB." };
  }

  if (!(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return {
      valid: false,
      error: "Unsupported image format. Please upload PNG, JPG, WEBP, or GIF.",
    };
  }

  if (buffer.length < 12) {
    return { valid: false, error: "Corrupted or truncated image file." };
  }

  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isGif =
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38;
  const isWebp =
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP";

  if (!isPng && !isJpeg && !isGif && !isWebp) {
    return {
      valid: false,
      error: "Invalid binary signature: uploaded file is not a valid image.",
    };
  }

  return { valid: true };
}

// ============================================================================
// Phase 1.4: Distributed Rate Limiter (Upstash Redis / Vercel KV REST API)
// + Trusted Platform IP Extraction (Zero shared "anonymous" bucket)
// ============================================================================
interface RateLimitEntry {
  timestamps: number[];
}

const localRateLimitFallback = new Map<string, RateLimitEntry>();

function fnv1aHashHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function getUpstashConfig(): { url: string; token: string } | null {
  const url = (
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    ""
  ).trim();
  const token = (
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    ""
  ).trim();

  if (
    url &&
    token &&
    url.startsWith("https://") &&
    !url.includes("your-instance") &&
    !token.includes("YOUR_")
  ) {
    return { url: url.replace(/\/+$/, ""), token };
  }
  return null;
}

/**
 * Extracts the client IP from trusted platform headers (Vercel, Cloudflare, reverse proxies).
 * Never returns a shared "anonymous" bucket: if no IP header is present, derives an isolated
 * fingerprint bucket from request headers so distinct clients never share rate-limit state.
 */
export function getClientIp(request: Request): string {
  const trustedHeaders = [
    "x-vercel-forwarded-for",
    "cf-connecting-ip",
    "x-real-ip",
    "x-forwarded-for",
  ];

  for (const headerName of trustedHeaders) {
    const raw = request.headers.get(headerName);
    if (raw) {
      const candidate = raw.split(",")[0]?.trim();
      if (candidate && candidate.length >= 3 && candidate !== "unknown") {
        return candidate;
      }
    }
  }

  const ua = request.headers.get("user-agent") || "";
  const lang = request.headers.get("accept-language") || "";
  const chUa = request.headers.get("sec-ch-ua") || "";
  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const fingerprintSource = `${ua}|${lang}|${chUa}|${origin}`;

  if (fingerprintSource !== "|||") {
    return `fp_${fnv1aHashHex(fingerprintSource)}`;
  }

  return `ephemeral_${fnv1aHashHex(request.url || String(Date.now()))}`;
}

function checkLocalSlidingWindow(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  const entry = localRateLimitFallback.get(identifier) || { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (entry.timestamps.length >= maxRequests) {
    const oldest = entry.timestamps[0] || now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    localRateLimitFallback.set(identifier, entry);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  entry.timestamps.push(now);
  localRateLimitFallback.set(identifier, entry);

  if (localRateLimitFallback.size > 2000) {
    for (const [key, val] of localRateLimitFallback.entries()) {
      if (val.timestamps.every((ts) => ts <= windowStart)) {
        localRateLimitFallback.delete(key);
      }
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - entry.timestamps.length),
    retryAfterSeconds: 0,
  };
}

/**
 * Distributed rate limiter backed by Upstash Redis / Vercel KV REST API when configured,
 * with automatic local sliding-window fallback for local development and unit tests.
 */
export async function checkRateLimitAsync(
  identifier: string,
  maxRequests = 20,
  windowMs = 60_000
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  const upstash = getUpstashConfig();
  if (upstash) {
    try {
      const windowBucket = Math.floor(Date.now() / windowMs);
      const redisKey = `cts:rl:${identifier}:${windowBucket}`;
      const pipelineRes = await fetch(`${upstash.url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstash.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", redisKey],
          ["PEXPIRE", redisKey, windowMs, "NX"],
          ["PTTL", redisKey],
        ]),
      });

      if (pipelineRes.ok) {
        const results = (await pipelineRes.json()) as Array<{ result?: number }>;
        const currentCount = Number(results?.[0]?.result ?? 1);
        const pttlMs = Number(results?.[2]?.result ?? windowMs);
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((pttlMs > 0 ? pttlMs : windowMs) / 1000)
        );
        const allowed = currentCount <= maxRequests;
        return {
          allowed,
          remaining: Math.max(0, maxRequests - currentCount),
          retryAfterSeconds: allowed ? 0 : retryAfterSeconds,
        };
      }
    } catch {
      // Fall back to local sliding window if Redis REST call fails
    }
  }

  return checkLocalSlidingWindow(identifier, maxRequests, windowMs);
}

export function checkRateLimit(
  identifier: string,
  maxRequests = 20,
  windowMs = 60_000
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const upstash = getUpstashConfig();
  if (upstash) {
    // Fire-and-forget async increment in Upstash Redis while returning deterministic state
    void checkRateLimitAsync(identifier, maxRequests, windowMs);
  }
  return checkLocalSlidingWindow(identifier, maxRequests, windowMs);
}

// ============================================================================
// Phase 1.6 & Phase 2.7: Strict Request Schemas (No vanitySecretKey on server,
// No unsupported meteora-damm or creatorFeeEnabled/creatorFeeBps)
// ============================================================================
export const createTokenRequestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Token name is required.")
      .max(32, "Token name cannot exceed 32 characters.")
      .refine((val) => !/[<>]/.test(val), "Token name contains invalid characters."),
    symbol: z
      .string()
      .trim()
      .min(1, "Token symbol is required.")
      .max(10, "Token symbol cannot exceed 10 characters.")
      .refine((val) => !/[<>]/.test(val), "Token symbol contains invalid characters."),
    imageUrl: z.string().trim().url("Invalid image URL."),
    decimals: z.number().int().min(0).max(9),
    supply: z.union([z.number().positive(), z.string().min(1)]),
    wallet: solanaAddressSchema,
    mintAuthority: z.boolean().default(false),
    freezeAuthority: z.boolean().default(false),
    isMetadataMutable: z.boolean().default(false),
    tokenStandard: z.enum(["spl", "token-2022"]).default("spl"),
    useNativeMetadataExtension: z.boolean().default(false),
    storageProvider: z.enum(["arweave", "cloudinary"]).default("arweave"),
    metadataUri: z.string().trim().url().optional(),
    customCreator: z
      .object({
        enabled: z.boolean().default(false),
        name: z.string().trim().max(64).optional(),
        website: z.string().trim().max(200).optional(),
      })
      .optional(),
    transferFee: z
      .object({
        basisPoints: z.number().int().min(0).max(10000).default(0),
        maxFee: z.number().min(0).default(0),
      })
      .optional(),
    soulbound: z.boolean().optional().default(false),
    permanentDelegate: z.boolean().optional().default(false),
    // Phase 1.6: Only the public key of the vanity mint is accepted on the server;
    // the vanity keypair secretKey NEVER leaves the client browser.
    vanityPublicKey: optionalSolanaAddressSchema,
    vanitySecretKey: z
      .undefined({
        invalid_type_error:
          "Security policy: vanitySecretKey must never be transmitted to the server. Send vanityPublicKey and sign client-side.",
      })
      .optional(),
    vanityCharLength: z.number().int().min(0).max(6).optional().default(0),
    jitoBundle: z
      .object({
        enabled: z.boolean().default(false),
        liquiditySol: z.number().min(0).optional(),
        poolSupplyPercent: z.number().min(1).max(100).optional(),
        firstBuySol: z.number().min(0).optional(),
        jitoTipSol: z.number().min(0.001).max(0.05).optional(),
        isMultiWalletBundle: z.boolean().optional().default(false),
      })
      .optional(),
    affiliate: z.string().trim().nullable().optional(),
    description: z.string().trim().max(500).optional(),
    website: z.string().trim().max(200).optional(),
    twitter: z.string().trim().max(100).optional(),
    instagram: z.string().trim().max(100).optional(),
    network: solanaClusterSchema.optional(),
  });

export const burnTokenRequestSchema = z.object({
  mint: solanaAddressSchema,
  amount: z.union([z.number().positive(), z.string().min(1)]),
  wallet: solanaAddressSchema,
  programId: tokenProgramIdSchema,
  affiliate: z.string().trim().nullable().optional(),
  network: solanaClusterSchema.optional(),
});

export const airdropRequestSchema = z.object({
  mint: solanaAddressSchema,
  wallet: solanaAddressSchema,
  programId: tokenProgramIdSchema,
  affiliate: z.string().trim().nullable().optional(),
  network: solanaClusterSchema.optional(),
  recipients: z
    .array(
      z.object({
        address: solanaAddressSchema,
        amount: z.union([z.number().positive(), z.string().min(1)]),
      })
    )
    .min(1, "Recipient list cannot be empty.")
    .max(
      MAX_AIRDROP_RECIPIENTS_PER_TX,
      `Maximum of ${MAX_AIRDROP_RECIPIENTS_PER_TX} recipients per transaction batch.`
    ),
});

export const manageAuthorityRequestSchema = z.object({
  mint: solanaAddressSchema,
  authorityType: z.enum(["mint", "freeze"]),
  wallet: solanaAddressSchema,
  programId: tokenProgramIdSchema,
  affiliate: z.string().trim().nullable().optional(),
  network: solanaClusterSchema.optional(),
});

export const createLiquidityPoolRequestSchema = z.object({
  dex: z.literal("raydium-cpmm").default("raydium-cpmm"),
  baseMint: solanaAddressSchema,
  quoteToken: z.enum(["SOL", "USDC"]).default("SOL"),
  baseAmount: z.union([z.number().positive(), z.string().min(1)]),
  quoteAmount: z.union([z.number().positive(), z.string().min(1)]),
  feeTierBps: z.number().int().min(1).max(10000).default(25),
  startTime: z.number().int().nonnegative().nullable().optional(),
  revokeFreezeIfActive: z.boolean().default(true),
  wallet: solanaAddressSchema,
  programId: tokenProgramIdSchema.optional(),
  affiliate: z.string().trim().nullable().optional(),
  network: solanaClusterSchema.optional(),
});

export const removeLiquidityRequestSchema = z.object({
  baseMint: solanaAddressSchema,
  poolId: optionalSolanaAddressSchema,
  lpMint: optionalSolanaAddressSchema,
  withdrawPercentage: z.coerce
    .number()
    .min(1, "Withdraw percentage must be at least 1%.")
    .max(100, "Withdraw percentage cannot exceed 100%.")
    .default(100),
  wallet: solanaAddressSchema,
  programId: tokenProgramIdSchema.optional(),
  affiliate: z.string().trim().nullable().optional(),
  network: solanaClusterSchema.optional(),
});

export const recordCommissionRequestSchema = z.object({
  affiliateWallet: solanaAddressSchema,
  commissionAmountSOL: z.number().positive().max(10).optional(),
  transactionSignature: z.string().trim().min(64).max(100),
  tokenCreatorWallet: solanaAddressSchema,
  mintAddress: solanaAddressSchema,
  network: solanaClusterSchema.optional(),
});
