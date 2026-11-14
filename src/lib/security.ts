import {
  ComputeBudgetProgram,
  PublicKey,
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
  MAX_AIRDROP_RECIPIENTS_PER_TX,
  MAX_IMAGE_FILE_SIZE_BYTES,
  METEORA_DAMM_PROGRAM_ID,
  RAYDIUM_CPMM_PROGRAM_ID_DEVNET,
  RAYDIUM_CPMM_PROGRAM_ID_MAINNET,
} from "./constants";

/**
 * Official whitelisted Solana Program IDs allowed in client-signed transactions.
 */
export const WHITELISTED_SOLANA_PROGRAMS = new Set<string>([
  SystemProgram.programId.toBase58(),
  ComputeBudgetProgram.programId.toBase58(),
  TOKEN_PROGRAM_ID.toBase58(),
  TOKEN_2022_PROGRAM_ID.toBase58(),
  ASSOCIATED_TOKEN_PROGRAM_ID.toBase58(),
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s", // Metaplex Token Metadata Program
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr", // SPL Memo Program v2
  RAYDIUM_CPMM_PROGRAM_ID_MAINNET.toBase58(),
  RAYDIUM_CPMM_PROGRAM_ID_DEVNET.toBase58(),
  METEORA_DAMM_PROGRAM_ID.toBase58(),
]);

export function verifyTransactionIntegrity(
  transaction: VersionedTransaction,
  expectedFeePayerBase58: string
): { valid: boolean; reason?: string } {
  try {
    const staticKeys = transaction.message.staticAccountKeys;
    if (!staticKeys || staticKeys.length === 0) {
      return { valid: false, reason: "Transaction contains no account keys." };
    }

    const feePayer = staticKeys[0]?.toBase58();
    if (feePayer !== expectedFeePayerBase58) {
      return {
        valid: false,
        reason: `Security alert: Transaction fee payer (${feePayer}) does not match connected wallet (${expectedFeePayerBase58}).`,
      };
    }

    for (const ix of transaction.message.compiledInstructions) {
      const programKey = staticKeys[ix.programIdIndex];
      if (!programKey) {
        return {
          valid: false,
          reason: "Security alert: Transaction references an out-of-bounds program index.",
        };
      }
      const programIdStr = programKey.toBase58();
      if (!WHITELISTED_SOLANA_PROGRAMS.has(programIdStr)) {
        return {
          valid: false,
          reason: `Security alert: Blocked unauthorized program ID (${programIdStr}) in transaction.`,
        };
      }
    }

    return { valid: true };
  } catch (err: any) {
    return {
      valid: false,
      reason: `Failed to verify transaction integrity: ${err?.message || "Unknown error"}`,
    };
  }
}

export function sanitizeErrorMessage(rawMessage: unknown, fallback = "Operation failed."): string {
  const msg =
    rawMessage instanceof Error
      ? rawMessage.message
      : typeof rawMessage === "string"
      ? rawMessage
      : fallback;

  return msg
    .replace(/api[-_]?key=[a-zA-Z0-9\-_]+/gi, "api-key=[REDACTED]")
    .replace(/https?:\/\/[^\s/]*helius[^\s]*/gi, "[RPC_ENDPOINT_REDACTED]");
}

export function isValidPublicKey(address: string): boolean {
  try {
    const pubkey = new PublicKey(address);
    return PublicKey.isOnCurve(pubkey.toBytes()) || pubkey.toBase58() === address;
  } catch {
    return false;
  }
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

export const tokenProgramIdSchema = z
  .string()
  .trim()
  .refine(
    (val) => val === TOKEN_PROGRAM_ID.toBase58() || val === TOKEN_2022_PROGRAM_ID.toBase58(),
    { message: "Invalid Token Program ID (must be SPL Token or Token-2022)." }
  );

export function toRawTokenAmount(amount: string | number, decimals: number): bigint {
  if (decimals < 0 || decimals > 18 || !Number.isInteger(decimals)) {
    throw new Error(`Invalid token decimals: ${decimals}`);
  }

  const normalized = String(amount).replace(/,/g, "").trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`Invalid token amount: "${amount}"`);
  }

  const [integerPart, fractionPart = ""] = normalized.split(".");
  const paddedFraction = fractionPart.slice(0, decimals).padEnd(decimals, "0");
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

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as any)) {
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

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  identifier: string,
  maxRequests = 20,
  windowMs = 60_000
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  const entry = rateLimitStore.get(identifier) || { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (entry.timestamps.length >= maxRequests) {
    const oldest = entry.timestamps[0] || now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    rateLimitStore.set(identifier, entry);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  entry.timestamps.push(now);
  rateLimitStore.set(identifier, entry);

  if (rateLimitStore.size > 2000) {
    for (const [key, val] of rateLimitStore.entries()) {
      if (val.timestamps.every((ts) => ts <= windowStart)) {
        rateLimitStore.delete(key);
      }
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - entry.timestamps.length),
    retryAfterSeconds: 0,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "anonymous";
}

export const createTokenRequestSchema = z.object({
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
  dex: z.enum(["raydium-cpmm", "meteora-damm"]).default("raydium-cpmm"),
  baseMint: solanaAddressSchema,
  quoteToken: z.enum(["SOL", "USDC"]).default("SOL"),
  baseAmount: z.union([z.number().positive(), z.string().min(1)]),
  quoteAmount: z.union([z.number().positive(), z.string().min(1)]),
  feeTierBps: z.number().int().min(1).max(1000).default(25),
  startTime: z.number().int().nonnegative().nullable().optional(),
  revokeFreezeIfActive: z.boolean().default(true),
  wallet: solanaAddressSchema,
  programId: tokenProgramIdSchema.optional(),
  affiliate: z.string().trim().nullable().optional(),
  network: solanaClusterSchema.optional(),
});

export const recordCommissionRequestSchema = z.object({
  affiliateWallet: solanaAddressSchema,
  commissionAmountSOL: z.number().positive().max(10),
  transactionSignature: z.string().trim().min(64).max(100),
  tokenCreatorWallet: solanaAddressSchema,
  mintAddress: solanaAddressSchema,
  network: solanaClusterSchema.optional(),
});
