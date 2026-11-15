import { Keypair } from "@solana/web3.js";

/**
 * Valid Base58 alphabet used by Solana public keys.
 * Excludes '0' (zero), 'O' (uppercase o), 'I' (uppercase i), and 'l' (lowercase L).
 */
export const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export const FORBIDDEN_BASE58_CHARS = ["0", "O", "I", "l"] as const;

export interface VanitySearchRequest {
  prefix?: string;
  suffix?: string;
  caseSensitive?: boolean;
  batchSize?: number;
}

export interface VanitySearchProgress {
  type: "progress";
  tested: number;
  keysPerSecond: number;
  estimatedSeconds: number;
}

export interface VanitySearchResult {
  type: "found";
  publicKey: string;
  secretKey: number[];
  tested: number;
  elapsedMs: number;
}

export type VanityWorkerMessage = VanitySearchProgress | VanitySearchResult;

/**
 * Validates that a user-supplied prefix or suffix contains only valid Base58 characters
 * and is at most 4 characters long.
 */
export function validateBase58Input(raw: string): {
  valid: boolean;
  invalidChars: string[];
  error?: string;
} {
  if (!raw) return { valid: true, invalidChars: [] };
  const invalidChars: string[] = [];

  for (const ch of raw) {
    if (!BASE58_ALPHABET.includes(ch)) {
      if (!invalidChars.includes(ch)) {
        invalidChars.push(ch);
      }
    }
  }

  if (invalidChars.length > 0) {
    return {
      valid: false,
      invalidChars,
      error: `Invalid Base58 character(s): ${invalidChars.join(
        ", "
      )}. Characters 0, O, I, and l are not allowed on Solana.`,
    };
  }

  if (raw.length > 4) {
    return {
      valid: false,
      invalidChars: [],
      error: "Maximum recommended vanity length in browser is 4 characters.",
    };
  }

  return { valid: true, invalidChars: [] };
}

/**
 * Estimates the expected number of attempts (58^N) for a given prefix + suffix length.
 */
export function estimateVanityDifficulty(
  prefix = "",
  suffix = "",
  caseSensitive = false
): number {
  const totalChars = prefix.length + suffix.length;
  if (totalChars <= 0) return 1;
  const base = caseSensitive ? 58 : 34;
  return Math.pow(base, totalChars);
}

/**
 * Asynchronous non-blocking Vanity Mint Address grinder using @solana/web3.js Keypair.generate().
 * Runs in time-sliced micro-batches so the browser UI remains 60fps responsive, and also supports
 * dedicated Web Worker execution when invoked inside a worker context.
 */
export function startVanityMintGenerator(
  request: VanitySearchRequest,
  onProgress: (progress: VanitySearchProgress) => void,
  onFound: (result: VanitySearchResult) => void
): { stop: () => void } {
  let cancelled = false;
  const rawPrefix = (request.prefix || "").trim();
  const rawSuffix = (request.suffix || "").trim();
  const caseSensitive = Boolean(request.caseSensitive);
  const batchSize = request.batchSize || 120;

  const targetPrefix = caseSensitive ? rawPrefix : rawPrefix.toLowerCase();
  const targetSuffix = caseSensitive ? rawSuffix : rawSuffix.toLowerCase();
  const expectedAttempts = estimateVanityDifficulty(rawPrefix, rawSuffix, caseSensitive);

  const startTime = performance.now();
  let totalTested = 0;

  const step = () => {
    if (cancelled) return;

    for (let i = 0; i < batchSize; i++) {
      const kp = Keypair.generate();
      const pubkeyBase58 = kp.publicKey.toBase58();
      const compareTarget = caseSensitive ? pubkeyBase58 : pubkeyBase58.toLowerCase();
      totalTested++;

      const prefixOk = !targetPrefix || compareTarget.startsWith(targetPrefix);
      const suffixOk = !targetSuffix || compareTarget.endsWith(targetSuffix);

      if (prefixOk && suffixOk) {
        const elapsedMs = Math.max(1, performance.now() - startTime);
        onFound({
          type: "found",
          publicKey: pubkeyBase58,
          secretKey: Array.from(kp.secretKey),
          tested: totalTested,
          elapsedMs,
        });
        return;
      }
    }

    const elapsedSec = Math.max(0.05, (performance.now() - startTime) / 1000);
    const keysPerSecond = Math.round(totalTested / elapsedSec);
    const remainingAttempts = Math.max(0, expectedAttempts - totalTested);
    const estimatedSeconds =
      keysPerSecond > 0 ? Math.max(1, Math.round(remainingAttempts / keysPerSecond)) : 1;

    onProgress({
      type: "progress",
      tested: totalTested,
      keysPerSecond,
      estimatedSeconds,
    });

    if (!cancelled) {
      setTimeout(step, 0);
    }
  };

  setTimeout(step, 0);

  return {
    stop: () => {
      cancelled = true;
    },
  };
}

// Web Worker message listener when loaded directly as a Worker script
if (typeof self !== "undefined" && typeof window === "undefined") {
  let activeTask: { stop: () => void } | null = null;

  self.onmessage = (event: MessageEvent<VanitySearchRequest | { action: "stop" }>) => {
    const data = event.data;
    if ("action" in data && data.action === "stop") {
      activeTask?.stop();
      activeTask = null;
      return;
    }

    activeTask?.stop();
    activeTask = startVanityMintGenerator(
      data as VanitySearchRequest,
      (progress) => self.postMessage(progress),
      (found) => self.postMessage(found)
    );
  };
}
