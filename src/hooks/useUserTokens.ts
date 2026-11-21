import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  ExtensionType,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getExtensionData,
} from "@solana/spl-token";
import { useCluster } from "@/context/WalletContext";
import {
  DEVNET_FALLBACK_RPC_ENDPOINTS,
  ESTIMATED_ATA_RENT_SOL,
  MAINNET_FALLBACK_RPC_ENDPOINTS,
  METAPLEX_METADATA_PROGRAM_ID,
} from "@/lib/constants";
import { getMetadataCache, setMetadataCache, isCacheItemValid } from "@/lib/cache";
import { sanitizeErrorMessage } from "@/lib/security";

export interface UserToken {
  mint: string;
  amount: string;
  rawAmount: string;
  decimals: number;
  name?: string;
  symbol?: string;
  logoURI?: string;
  programId: string;
  isLpToken?: boolean;
  pairedBaseMint?: string;
  pairedLpMint?: string;
}

export type RichToken = UserToken;

export interface EmptyTokenAccount {
  pubkey: string;
  mint: string;
  programId: string;
  lamports: number;
  rentSol: number;
}

interface KnownTokenMeta {
  name: string;
  symbol: string;
  logoURI: string;
}

const KNOWN_MAINNET_TOKENS: Record<string, KnownTokenMeta> = {
  So11111111111111111111111111111111111111112: {
    name: "Wrapped SOL",
    symbol: "WSOL",
    logoURI: "/sol.png",
  },
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
    name: "USD Coin",
    symbol: "USDC",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: {
    name: "USDT",
    symbol: "USDT",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
  },
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: {
    name: "Bonk",
    symbol: "BONK",
    logoURI: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I",
  },
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: {
    name: "Jupiter",
    symbol: "JUP",
    logoURI: "https://static.jup.ag/jup/icon.png",
  },
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": {
    name: "Raydium",
    symbol: "RAY",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png",
  },
};

/**
 * Formats a raw integer token amount (`BigInt`) into a precise decimal string without float loss.
 */
export function formatRawAmountToUiString(rawAmountStr: string, decimals: number): string {
  try {
    const raw = BigInt(rawAmountStr || "0");
    if (raw <= BigInt(0)) return "0";
    if (decimals <= 0) return raw.toString();

    const divisor = BigInt(10) ** BigInt(decimals);
    const whole = raw / divisor;
    const rem = raw % divisor;
    if (rem === BigInt(0)) return whole.toString();

    const fracStr = rem.toString().padStart(decimals, "0").replace(/0+$/, "");
    return `${whole.toString()}.${fracStr}`;
  } catch {
    return "0";
  }
}

/**
 * Decodes Metaplex Token Metadata v1 account buffer directly in memory (0 extra RPC calls).
 */
function decodeMetaplexMetadataBuffer(
  data: Buffer | Uint8Array
): { name: string; symbol: string; uri: string } | null {
  try {
    const buf = Buffer.from(data);
    if (buf.length < 77) return null;
    let offset = 65;

    const nameLen = buf.readUInt32LE(offset);
    offset += 4;
    if (nameLen > 200 || offset + nameLen > buf.length) return null;
    const name = buf
      .subarray(offset, offset + nameLen)
      .toString("utf8")
      .replace(/\0/g, "")
      .trim();
    offset += nameLen;

    const symbolLen = buf.readUInt32LE(offset);
    offset += 4;
    if (symbolLen > 100 || offset + symbolLen > buf.length) return null;
    const symbol = buf
      .subarray(offset, offset + symbolLen)
      .toString("utf8")
      .replace(/\0/g, "")
      .trim();
    offset += symbolLen;

    const uriLen = buf.readUInt32LE(offset);
    offset += 4;
    if (uriLen > 500 || offset + uriLen > buf.length) return null;
    const uri = buf
      .subarray(offset, offset + uriLen)
      .toString("utf8")
      .replace(/\0/g, "")
      .trim();

    if (!name && !symbol) return null;
    return { name, symbol, uri };
  } catch {
    return null;
  }
}

/**
 * Decodes Token-2022 native TokenMetadata extension directly from a Mint account buffer
 * fetched in a single batched `getMultipleAccountsInfo` call (Phase 4.17).
 */
function decodeToken2022NativeMetadataFromMintBuffer(
  mintData: Buffer | Uint8Array
): { name: string; symbol: string; uri: string } | null {
  try {
    const extBuf = getExtensionData(ExtensionType.TokenMetadata, Buffer.from(mintData));
    if (!extBuf || extBuf.length < 76) return null;

    // Layout: updateAuthority (32) + mint (32) + name (4 + len) + symbol (4 + len) + uri (4 + len)
    let offset = 64;
    const nameLen = extBuf.readUInt32LE(offset);
    offset += 4;
    if (nameLen > 200 || offset + nameLen > extBuf.length) return null;
    const name = extBuf
      .subarray(offset, offset + nameLen)
      .toString("utf8")
      .replace(/\0/g, "")
      .trim();
    offset += nameLen;

    const symbolLen = extBuf.readUInt32LE(offset);
    offset += 4;
    if (symbolLen > 100 || offset + symbolLen > extBuf.length) return null;
    const symbol = extBuf
      .subarray(offset, offset + symbolLen)
      .toString("utf8")
      .replace(/\0/g, "")
      .trim();
    offset += symbolLen;

    const uriLen = extBuf.readUInt32LE(offset);
    offset += 4;
    if (uriLen > 500 || offset + uriLen > extBuf.length) return null;
    const uri = extBuf
      .subarray(offset, offset + uriLen)
      .toString("utf8")
      .replace(/\0/g, "")
      .trim();

    if (!name && !symbol) return null;
    return { name, symbol, uri };
  } catch {
    return null;
  }
}

const ALLOWED_METADATA_HOSTS = new Set<string>([
  "arweave.net",
  "gateway.irys.xyz",
  "devnet.irys.xyz",
  "node1.irys.xyz",
  "node2.irys.xyz",
  "res.cloudinary.com",
  "ipfs.io",
  "cloudflare-ipfs.com",
  "nftstorage.link",
  "gateway.pinata.cloud",
  "raw.githubusercontent.com",
  "shdw-drive.genesysgo.net",
  "static.jup.ag",
]);

const MAX_METADATA_JSON_BYTES = 64 * 1024; // 64 KiB cap

export function isSafeMetadataUri(rawUri?: string | null): string | null {
  if (!rawUri) return null;
  const cleaned = rawUri.replace(/\0/g, "").trim();
  const normalized = cleaned.startsWith("ar://")
    ? `https://arweave.net/${cleaned.slice(5)}`
    : cleaned;

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "https:") return null;
    const host = parsed.hostname.toLowerCase();
    // Block localhost, private IPs, and untrusted hosts
    if (
      host === "localhost" ||
      host.startsWith("127.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.endsWith(".local")
    ) {
      return null;
    }
    const isAllowed =
      ALLOWED_METADATA_HOSTS.has(host) ||
      Array.from(ALLOWED_METADATA_HOSTS).some((domain) => host.endsWith(`.${domain}`));
    if (!isAllowed) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Phase 4.17: Safely fetches off-chain metadata JSON with host allowlist, timeout cleanup,
 * and strict 64 KiB response byte limit.
 */
async function fetchImageFromMetadataUriSafe(
  uri?: string | null,
  timeoutMs = 2400
): Promise<string> {
  const safeUri = isSafeMetadataUri(uri);
  if (!safeUri) return "";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(safeUri, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return "";

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_METADATA_JSON_BYTES) {
      controller.abort();
      return "";
    }

    const reader = response.body?.getReader();
    let jsonText = "";
    if (reader) {
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.byteLength;
          if (totalBytes > MAX_METADATA_JSON_BYTES) {
            await reader.cancel();
            return "";
          }
          chunks.push(value);
        }
      }
      jsonText = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
    } else {
      jsonText = await response.text();
      if (jsonText.length > MAX_METADATA_JSON_BYTES) return "";
    }

    const offChainMetadata = JSON.parse(jsonText) as { image?: unknown };
    if (typeof offChainMetadata?.image === "string") {
      const safeImage = isSafeMetadataUri(offChainMetadata.image);
      if (safeImage) return safeImage;
    }
  } catch {
    // Ignore timeout, network error, or invalid JSON
  } finally {
    clearTimeout(timer);
  }
  return "";
}

/**
 * Executes a token account query with proper timer cleanup in `finally` and throws on complete RPC failure
 * so `useUserTokens` can distinguish an RPC error from an empty wallet (Phase 4.17).
 */
async function fetchOwnerTokenAccountsWithFallback(
  primaryConnection: Connection,
  owner: PublicKey,
  cluster: "mainnet-beta" | "devnet"
) {
  const proxyEndpoint =
    typeof window !== "undefined" && window.location?.origin
      ? `${window.location.origin}/api/rpc?cluster=${cluster}`
      : null;

  const rawCandidates =
    cluster === "devnet" ? DEVNET_FALLBACK_RPC_ENDPOINTS : MAINNET_FALLBACK_RPC_ENDPOINTS;

  const browserSafeCandidates = [
    ...(proxyEndpoint ? [proxyEndpoint] : []),
    ...rawCandidates.filter((url) => !url.includes("publicnode.com")),
  ];

  const queryWithTimeout = async (conn: Connection, ms = 8500) => {
    let timerId: ReturnType<typeof setTimeout> | null = null;
    try {
      return await Promise.race([
        Promise.all([
          conn.getParsedTokenAccountsByOwner(
            owner,
            { programId: TOKEN_PROGRAM_ID },
            "confirmed"
          ),
          conn.getParsedTokenAccountsByOwner(
            owner,
            { programId: TOKEN_2022_PROGRAM_ID },
            "confirmed"
          ),
        ]),
        new Promise<never>((_, reject) => {
          timerId = setTimeout(() => reject(new Error("RPC_TIMEOUT")), ms);
        }),
      ]);
    } finally {
      if (timerId !== null) {
        clearTimeout(timerId);
      }
    }
  };

  let lastError: unknown = null;
  try {
    const [spl, t22] = await queryWithTimeout(primaryConnection, 8500);
    return { spl, t22, activeConnection: primaryConnection };
  } catch (err) {
    lastError = err;
    for (const endpoint of browserSafeCandidates) {
      try {
        const fallbackConn = new Connection(endpoint, {
          commitment: "confirmed",
          disableRetryOnRateLimit: true,
        });
        const [spl, t22] = await queryWithTimeout(fallbackConn, 9000);
        return { spl, t22, activeConnection: fallbackConn };
      } catch (fallbackErr) {
        lastError = fallbackErr;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("Failed to query token accounts from Solana RPC.");
  }
}

export const useUserTokens = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { cluster } = useCluster();
  const [tokens, setTokens] = useState<UserToken[]>([]);
  const [emptyAccounts, setEmptyAccounts] = useState<EmptyTokenAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchGenerationRef = useRef(0);

  const fetchUserTokens = useCallback(async () => {
    if (!publicKey) {
      setTokens([]);
      setEmptyAccounts([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const currentGen = ++fetchGenerationRef.current;
    setIsLoading(true);
    setError(null);

    try {
      let lpPoolsMap: Record<
        string,
        {
          baseSymbol?: string;
          quoteToken?: string;
          dex?: string;
          baseMint?: string;
          lpMintAddress?: string;
          poolAddress?: string;
        }
      > = {};
      try {
        const rawLp = localStorage.getItem("createdLpPoolsMap");
        if (rawLp) lpPoolsMap = JSON.parse(rawLp);
      } catch {
        lpPoolsMap = {};
      }

      const {
        spl: tokenAccounts,
        t22: token2022Accounts,
        activeConnection,
      } = await fetchOwnerTokenAccountsWithFallback(connection, publicKey, cluster);

      if (currentGen !== fetchGenerationRef.current) return;

      const rawCombined = [
        ...tokenAccounts.value.map((acc) => ({
          ...acc,
          programId: TOKEN_PROGRAM_ID.toBase58(),
        })),
        ...token2022Accounts.value.map((acc) => ({
          ...acc,
          programId: TOKEN_2022_PROGRAM_ID.toBase58(),
        })),
      ];

      // 1. Detect all empty ATAs using raw integer amount === "0"
      const detectedEmptyAccounts: EmptyTokenAccount[] = rawCombined
        .filter((acc) => {
          const info = acc.account.data.parsed?.info;
          const rawAmount = String(info?.tokenAmount?.amount ?? "0");
          const isFrozen = info?.state === "frozen";
          return BigInt(rawAmount) === BigInt(0) && !isFrozen;
        })
        .map((acc) => ({
          pubkey: acc.pubkey.toBase58(),
          mint: acc.account.data.parsed.info.mint as string,
          programId: acc.programId,
          lamports:
            acc.account.lamports || Math.round(ESTIMATED_ATA_RENT_SOL * LAMPORTS_PER_SOL),
          rentSol: acc.account.lamports
            ? acc.account.lamports / LAMPORTS_PER_SOL
            : ESTIMATED_ATA_RENT_SOL,
        }));

      setEmptyAccounts(detectedEmptyAccounts);

      // 2. Filter positive accounts strictly via raw BigInt amount > 0 (never floating-point uiAmount)
      const positiveAccounts = rawCombined.filter((acc) => {
        const rawStr = String(acc.account.data.parsed?.info?.tokenAmount?.amount ?? "0");
        try {
          return BigInt(rawStr) > BigInt(0);
        } catch {
          return false;
        }
      });

      const metadataCache = getMetadataCache();
      const uncachedMints: Array<{ mint: string; programId: string }> = [];

      const initialTokens: UserToken[] = positiveAccounts.map((accountInfo) => {
        const { mint, tokenAmount } = accountInfo.account.data.parsed.info;
        const rawAmountStr = String(tokenAmount.amount ?? "0");
        const decimals = Number(tokenAmount.decimals ?? 0);
        const uiAmountStr =
          typeof tokenAmount.uiAmountString === "string" && tokenAmount.uiAmountString.length > 0
            ? tokenAmount.uiAmountString
            : formatRawAmountToUiString(rawAmountStr, decimals);

        const lpEntry = lpPoolsMap[mint];

        if (lpEntry && lpEntry.lpMintAddress === mint && lpEntry.baseMint) {
          const quoteSymbol = lpEntry.quoteToken === "USDC" ? "USDC" : "SOL";
          return {
            mint,
            amount: uiAmountStr,
            rawAmount: rawAmountStr,
            decimals,
            name: `LP Pool (${lpEntry.baseMint.slice(0, 4)}.../${quoteSymbol})`,
            symbol: `LP-${quoteSymbol}`,
            logoURI: "/sol.png",
            programId: accountInfo.programId,
            isLpToken: true,
            pairedBaseMint: lpEntry.baseMint,
            pairedLpMint: mint,
          };
        }

        const knownToken = KNOWN_MAINNET_TOKENS[mint];
        if (knownToken) {
          return {
            mint,
            amount: uiAmountStr,
            rawAmount: rawAmountStr,
            decimals,
            name: knownToken.name,
            symbol: knownToken.symbol,
            logoURI: knownToken.logoURI,
            programId: accountInfo.programId,
            pairedLpMint: lpEntry?.lpMintAddress,
          };
        }

        const cachedToken = metadataCache[mint];
        const cachedData = cachedToken?.data as { name?: string; symbol?: string; logoURI?: string } | undefined;
        if (isCacheItemValid(cachedToken) && cachedData?.name) {
          return {
            mint,
            amount: uiAmountStr,
            rawAmount: rawAmountStr,
            decimals,
            name: cachedData.name,
            symbol: cachedData.symbol || mint.slice(0, 4).toUpperCase(),
            logoURI: cachedData.logoURI || "/sol.png",
            programId: accountInfo.programId,
            pairedLpMint: lpEntry?.lpMintAddress,
          };
        }

        uncachedMints.push({ mint, programId: accountInfo.programId });
        const shortMint = `${mint.slice(0, 4)}...${mint.slice(-4)}`;
        return {
          mint,
          amount: uiAmountStr,
          rawAmount: rawAmountStr,
          decimals,
          name: `Token (${shortMint})`,
          symbol: mint.slice(0, 4).toUpperCase(),
          logoURI: "/sol.png",
          programId: accountInfo.programId,
          pairedLpMint: lpEntry?.lpMintAddress,
        };
      });

      setTokens(initialTokens);
      setIsLoading(false);

      // 3. Batched Metadata Enrichment: Metaplex PDAs + Token-2022 Mint Accounts in batched getMultipleAccountsInfo
      if (uncachedMints.length === 0) return;

      const batchTargets = uncachedMints.slice(0, 50);
      const metadataPdas = batchTargets.map(({ mint }) => {
        const mintPk = new PublicKey(mint);
        const [pda] = PublicKey.findProgramAddressSync(
          [
            new Uint8Array(Buffer.from("metadata")),
            new Uint8Array(METAPLEX_METADATA_PROGRAM_ID.toBuffer()),
            new Uint8Array(mintPk.toBuffer()),
          ],
          METAPLEX_METADATA_PROGRAM_ID
        );
        return pda;
      });

      const pdaAccountInfos = await activeConnection.getMultipleAccountsInfo(
        metadataPdas,
        "confirmed"
      );

      if (currentGen !== fetchGenerationRef.current) return;

      const offChainUriQueue: Array<{ mint: string; uri: string; name: string; symbol: string }> =
        [];
      const decodedByMint = new Map<string, { name: string; symbol: string; logoURI: string }>();
      const unresolvedToken2022Mints: string[] = [];

      batchTargets.forEach((target, idx) => {
        const info = pdaAccountInfos[idx];
        if (info?.data) {
          const parsed = decodeMetaplexMetadataBuffer(info.data);
          if (parsed) {
            decodedByMint.set(target.mint, {
              name: parsed.name,
              symbol: parsed.symbol,
              logoURI: "/sol.png",
            });
            if (parsed.uri) {
              offChainUriQueue.push({
                mint: target.mint,
                uri: parsed.uri,
                name: parsed.name,
                symbol: parsed.symbol,
              });
            }
            return;
          }
        }

        if (target.programId === TOKEN_2022_PROGRAM_ID.toBase58()) {
          unresolvedToken2022Mints.push(target.mint);
        }
      });

      // Batch-read all unresolved Token-2022 Mint accounts in a single RPC call
      if (unresolvedToken2022Mints.length > 0) {
        const t22MintPubkeys = unresolvedToken2022Mints.map((m) => new PublicKey(m));
        const t22MintInfos = await activeConnection.getMultipleAccountsInfo(
          t22MintPubkeys,
          "confirmed"
        );

        t22MintInfos.forEach((mintAcc, idx) => {
          const mintStr = unresolvedToken2022Mints[idx];
          if (mintAcc?.data) {
            const nativeMeta = decodeToken2022NativeMetadataFromMintBuffer(mintAcc.data);
            if (nativeMeta) {
              decodedByMint.set(mintStr, {
                name: nativeMeta.name,
                symbol: nativeMeta.symbol,
                logoURI: "/sol.png",
              });
              if (nativeMeta.uri) {
                offChainUriQueue.push({
                  mint: mintStr,
                  uri: nativeMeta.uri,
                  name: nativeMeta.name,
                  symbol: nativeMeta.symbol,
                });
              }
            }
          }
        });
      }

      if (decodedByMint.size > 0 && currentGen === fetchGenerationRef.current) {
        setTokens((prev) =>
          prev.map((item) => {
            const enriched = decodedByMint.get(item.mint);
            if (!enriched) return item;
            return {
              ...item,
              name: enriched.name || item.name,
              symbol: enriched.symbol || item.symbol,
            };
          })
        );
      }

      if (offChainUriQueue.length > 0 && currentGen === fetchGenerationRef.current) {
        const logoResults = await Promise.all(
          offChainUriQueue.slice(0, 20).map(async (entry) => {
            const logoURI = await fetchImageFromMetadataUriSafe(entry.uri, 2400);
            return { ...entry, logoURI: logoURI || "/sol.png" };
          })
        );

        if (currentGen !== fetchGenerationRef.current) return;

        const updatedCache = getMetadataCache();
        const logoMap = new Map<string, { name: string; symbol: string; logoURI: string }>();

        for (const res of logoResults) {
          const metaObj = {
            name: res.name,
            symbol: res.symbol,
            logoURI: res.logoURI,
          };
          updatedCache[res.mint] = { data: metaObj, timestamp: Date.now() };
          logoMap.set(res.mint, metaObj);
        }
        setMetadataCache(updatedCache);

        setTokens((prev) =>
          prev.map((item) => {
            const finalMeta = logoMap.get(item.mint);
            if (!finalMeta) return item;
            return {
              ...item,
              name: finalMeta.name || item.name,
              symbol: finalMeta.symbol || item.symbol,
              logoURI: finalMeta.logoURI || item.logoURI,
            };
          })
        );
      }
    } catch (err) {
      console.error("Failed to fetch user tokens:", err);
      if (currentGen === fetchGenerationRef.current) {
        setError(
          sanitizeErrorMessage(
            err,
            "Não foi possível carregar os tokens da carteira. Tente novamente."
          )
        );
        setIsLoading(false);
      }
    }
  }, [publicKey, connection, cluster]);

  useEffect(() => {
    fetchUserTokens();
  }, [fetchUserTokens]);

  const totalReclaimableSol = useMemo(
    () =>
      emptyAccounts.reduce(
        (sum, acc) => sum + (acc.rentSol || ESTIMATED_ATA_RENT_SOL),
        0
      ),
    [emptyAccounts]
  );

  return {
    tokens,
    emptyAccounts,
    totalReclaimableSol,
    isLoading,
    error,
    refreshTokens: fetchUserTokens,
  };
};
