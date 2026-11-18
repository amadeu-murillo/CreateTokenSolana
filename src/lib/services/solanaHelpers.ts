import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Umi, createNoopSigner, signerIdentity, percentAmount } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createV1, TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import {
  AFFILIATE_COMMISSION_RATE,
  DEVNET_FALLBACK_RPC_ENDPOINTS,
  DEV_WALLET_ADDRESS,
  MAINNET_FALLBACK_RPC_ENDPOINTS,
  SERVICE_FEE_CREATE_TOKEN_LAMPORTS,
  SolanaCluster,
  getRpcEndpoint,
} from "@/lib/constants";
import { isValidPublicKey } from "@/lib/security";

interface JsonRpcPayload {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: unknown;
}

/**
 * Executes a single JSON-RPC 2.0 request across the ordered list of cluster RPC endpoints,
 * automatically failing over if an endpoint returns HTTP 4xx/5xx, times out, or returns an
 * API-key / rate-limit / batch JSON-RPC error, and normalizing `id` as a string so
 * `@solana/web3.js` superstruct (`union of type | type`) never receives `undefined` or `id: null`.
 */
export async function dispatchSingleJsonRpcRequest(
  reqObj: JsonRpcPayload,
  endpoints: string[]
): Promise<Record<string, unknown>> {
  const safeId =
    typeof reqObj?.id === "string"
      ? reqObj.id
      : reqObj?.id !== undefined && reqObj?.id !== null
      ? String(reqObj.id)
      : "1";

  const normalizedPayload = {
    jsonrpc: "2.0",
    id: safeId,
    method: reqObj?.method,
    params: reqObj?.params ?? [],
  };
  const bodyStr = JSON.stringify(normalizedPayload);

  let lastRpcError: Record<string, unknown> | null = null;
  let lastErrorMsg = "All Solana RPC endpoints failed.";

  for (const endpoint of endpoints) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: bodyStr,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        lastErrorMsg = `HTTP ${res.status}: ${res.statusText}`;
        continue;
      }

      const data = (await res.json()) as Record<string, unknown> | null;
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        continue;
      }

      if ("error" in data && data.error) {
        const errObj = data.error as { code?: number; message?: string };
        const errMsg = String(errObj?.message || "").toLowerCase();
        const errCode = Number(errObj?.code || 0);

        const isRetriableRpcError =
          errCode === 429 ||
          errCode === -32429 ||
          errCode === -32401 ||
          errCode === -32600 ||
          errCode === -32005 ||
          errMsg.includes("api key") ||
          errMsg.includes("unauthorized") ||
          errMsg.includes("rate limit") ||
          errMsg.includes("too many") ||
          errMsg.includes("batch") ||
          errMsg.includes("not allowed");

        lastRpcError = {
          jsonrpc: "2.0",
          id: safeId,
          error: data.error,
        };

        if (isRetriableRpcError) {
          continue;
        }

        return lastRpcError;
      }

      if ("result" in data) {
        return {
          jsonrpc: "2.0",
          id: safeId,
          result: data.result,
        };
      }
    } catch (err) {
      clearTimeout(timer);
      lastErrorMsg = err instanceof Error ? err.message : "RPC fetch failed";
    }
  }

  if (lastRpcError) {
    return lastRpcError;
  }

  return {
    jsonrpc: "2.0",
    id: safeId,
    error: {
      code: -32000,
      message: lastErrorMsg,
    },
  };
}

/**
 * Handles both single JSON-RPC requests and `@solana/web3.js` JSON-RPC batch arrays (`[req1, req2, ...]`).
 */
export async function executeResilientSolanaRpc(
  parsedBody: unknown,
  cluster: SolanaCluster
): Promise<unknown> {
  const endpoints =
    cluster === "devnet" ? DEVNET_FALLBACK_RPC_ENDPOINTS : MAINNET_FALLBACK_RPC_ENDPOINTS;

  if (Array.isArray(parsedBody)) {
    return Promise.all(
      parsedBody.map((item) =>
        dispatchSingleJsonRpcRequest((item || {}) as JsonRpcPayload, endpoints)
      )
    );
  }

  return dispatchSingleJsonRpcRequest((parsedBody || {}) as JsonRpcPayload, endpoints);
}

/**
 * Creates a Solana `Connection` with a batch-safe, multi-endpoint failover `fetch` middleware.
 */
export function getSolanaConnection(cluster: SolanaCluster = "mainnet-beta"): Connection {
  const primaryEndpoint = getRpcEndpoint(cluster);

  if (typeof window === "undefined") {
    return new Connection(primaryEndpoint, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 60_000,
      disableRetryOnRateLimit: true,
      fetch: async (input, init) => {
        try {
          if (init?.method === "POST" && typeof init.body === "string") {
            const parsed = JSON.parse(init.body);
            const resultPayload = await executeResilientSolanaRpc(parsed, cluster);
            return new Response(JSON.stringify(resultPayload), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
        } catch {
          // Fall through to native fetch if body isn't standard JSON-RPC
        }
        return fetch(input, init);
      },
    });
  }

  return new Connection(primaryEndpoint, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60_000,
    disableRetryOnRateLimit: true,
  });
}

/**
 * Phase 2.10: Dynamically computes ComputeUnitLimit (via `simulateTransaction` + 25% safety margin)
 * and ComputeUnitPrice (via `getRecentPrioritizationFees` median non-zero fee), falling back cleanly
 * to `defaultUnits` and `defaultMicroLamports` if simulation cannot run prior to signing.
 */
export async function buildDynamicComputeBudgetInstructions(params: {
  connection: Connection;
  payerKey: PublicKey;
  instructions: TransactionInstruction[];
  defaultUnits?: number;
  defaultMicroLamports?: number;
}): Promise<TransactionInstruction[]> {
  const {
    connection,
    payerKey,
    instructions,
    defaultUnits = 450_000,
    defaultMicroLamports = 35_000,
  } = params;

  let computedUnits = defaultUnits;
  let computedMicroLamports = defaultMicroLamports;

  try {
    const probeMessage = new TransactionMessage({
      payerKey,
      recentBlockhash: "11111111111111111111111111111111",
      instructions: [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
        ...instructions,
      ],
    }).compileToV0Message();

    const probeTx = new VersionedTransaction(probeMessage);

    const [simResp, recentFees] = await Promise.all([
      connection
        .simulateTransaction(probeTx, {
          sigVerify: false,
          replaceRecentBlockhash: true,
          commitment: "confirmed",
        })
        .catch(() => null),
      connection.getRecentPrioritizationFees().catch(() => []),
    ]);

    const unitsConsumed = simResp?.value?.unitsConsumed ?? 0;
    if (unitsConsumed > 0 && !simResp?.value?.err) {
      computedUnits = Math.min(
        1_400_000,
        Math.max(150_000, Math.ceil(unitsConsumed * 1.25))
      );
    }

    if (Array.isArray(recentFees) && recentFees.length > 0) {
      const nonZeroFees = recentFees
        .map((f) => Number(f.prioritizationFee || 0))
        .filter((f) => f > 0)
        .sort((a, b) => a - b);

      if (nonZeroFees.length > 0) {
        const medianFee = nonZeroFees[Math.floor(nonZeroFees.length / 2)];
        computedMicroLamports = Math.min(
          250_000,
          Math.max(10_000, Math.ceil(medianFee * 1.2))
        );
      }
    }
  } catch {
    // Use safe fallback defaults if RPC does not support simulation before signing
  }

  return [
    ComputeBudgetProgram.setComputeUnitLimit({ units: computedUnits }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: computedMicroLamports }),
  ];
}

export function getUmiInstance(
  userPublicKey: PublicKey,
  cluster: SolanaCluster = "mainnet-beta"
): Umi {
  const umi = createUmi(getRpcEndpoint(cluster));
  const userUmiSigner = createNoopSigner(fromWeb3JsPublicKey(userPublicKey));
  umi.use(signerIdentity(userUmiSigner));
  return umi;
}

/**
 * Phase 2: Instant On-Chain Affiliate Commission Split inside the same principal transaction:
 * - If NO valid affiliate (or self-referral): sends 100% of totalFeeLamports to DEV_WALLET_ADDRESS.
 * - If a valid affiliate exists: splits into two SystemProgram.transfer instructions in the same transaction:
 *   70% of lamports to DEV_WALLET_ADDRESS and 30% directly to the affiliate wallet.
 */
export function buildServiceFeeInstructions(
  userPublicKey: PublicKey,
  totalFeeLamports: number = SERVICE_FEE_CREATE_TOKEN_LAMPORTS,
  affiliateAddress?: string | null
): TransactionInstruction[] {
  const instructions: TransactionInstruction[] = [];
  let affiliatePublicKey: PublicKey | null = null;

  if (
    affiliateAddress &&
    isValidPublicKey(affiliateAddress) &&
    affiliateAddress.trim() !== userPublicKey.toBase58() &&
    affiliateAddress.trim() !== DEV_WALLET_ADDRESS.toBase58()
  ) {
    affiliatePublicKey = new PublicKey(affiliateAddress.trim());
  }

  if (affiliatePublicKey) {
    const affiliateCommission = Math.round(totalFeeLamports * AFFILIATE_COMMISSION_RATE); // 30%
    const developerCut = totalFeeLamports - affiliateCommission; // 70%

    instructions.push(
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: DEV_WALLET_ADDRESS,
        lamports: developerCut,
      }),
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: affiliatePublicKey,
        lamports: affiliateCommission,
      })
    );
  } else {
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: DEV_WALLET_ADDRESS,
        lamports: totalFeeLamports,
      })
    );
  }

  return instructions;
}

/**
 * Generates Metaplex Token Metadata v1 instructions converted to web3.js TransactionInstructions.
 * Supports both classic SPL Token (TOKEN_PROGRAM_ID) and Token-2022 (TOKEN_2022_PROGRAM_ID) mints.
 */
export function buildMetaplexMetadataInstructions(params: {
  userPublicKey: PublicKey;
  mintPublicKey: PublicKey;
  name: string;
  symbol: string;
  metadataUri: string;
  isMetadataMutable: boolean;
  cluster?: SolanaCluster;
  splTokenProgram?: PublicKey;
}): TransactionInstruction[] {
  const {
    userPublicKey,
    mintPublicKey,
    name,
    symbol,
    metadataUri,
    isMetadataMutable,
    cluster = "mainnet-beta",
    splTokenProgram = TOKEN_PROGRAM_ID,
  } = params;
  const umi = getUmiInstance(userPublicKey, cluster);
  const userUmiSigner = umi.identity;

  const createMetadataIx = createV1(umi, {
    mint: fromWeb3JsPublicKey(mintPublicKey),
    authority: userUmiSigner,
    name,
    symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(0, 2),
    tokenStandard: TokenStandard.Fungible,
    isMutable: isMetadataMutable,
    payer: userUmiSigner,
    updateAuthority: userUmiSigner,
    splTokenProgram: fromWeb3JsPublicKey(splTokenProgram),
  }).getInstructions();

  return createMetadataIx.map((ix) => ({
    keys: ix.keys.map((key) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    programId: new PublicKey(ix.programId),
    data: Buffer.from(ix.data),
  }));
}
