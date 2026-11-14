import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getTokenMetadata as getSplToken2022Metadata,
} from "@solana/spl-token";
import { useCluster } from "@/context/WalletContext";
import {
  ESTIMATED_ATA_RENT_SOL,
  MAINNET_FALLBACK_RPC_ENDPOINTS,
  DEVNET_FALLBACK_RPC_ENDPOINTS,
} from "@/lib/constants";
import { getMetadataCache, setMetadataCache, isCacheItemValid } from "@/lib/cache";

export interface UserToken {
  mint: string;
  amount: string;
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

/**
 * Instant in-memory lookup for top Mainnet tokens (replaces the 15 MB solana.tokenlist.json download).
 */
const KNOWN_MAINNET_TOKENS: Record<string, KnownTokenMeta> = {
  So11111111111111111111111111111111111111112: {
    name: "Wrapped SOL",
    symbol: "WSOL",
    logoURI: "/sol.png",
  },
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
    name: "USD Coin",
    symbol: "USDC",
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: {
    name: "USDT",
    symbol: "USDT",
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
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
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png",
  },
};

const METAPLEX_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

/**
 * Decodes Metaplex Token Metadata v1 account buffer directly in memory (0 extra RPC calls).
 */
function decodeMetaplexMetadataBuffer(
  data: Buffer | Uint8Array
): { name: string; symbol: string; uri: string } | null {
  try {
    const buf = Buffer.from(data);
    // Layout: key (1) + updateAuthority (32) + mint (32) = offset 65
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

async function fetchImageFromMetadataUriWithTimeout(
  uri?: string | null,
  timeoutMs = 2400
): Promise<string> {
  if (!uri) return "";
  const cleanUri = uri.replace(/\0/g, "").trim();
  if (!cleanUri.startsWith("https://")) return "";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(cleanUri, { signal: controller.signal });
    if (response.ok) {
      const offChainMetadata = await response.json();
      if (
        typeof offChainMetadata?.image === "string" &&
        offChainMetadata.image.startsWith("https://")
      ) {
        return offChainMetadata.image;
      }
    }
  } catch {
    // Timed out or unreachable off-chain metadata host; ignore gracefully
  } finally {
    clearTimeout(timer);
  }
  return "";
}

/**
 * Executes a token account query with automatic fast-failover across healthy Solana RPC nodes
 * so Mainnet wallet loading never hangs on a rate-limited endpoint.
 */
async function fetchOwnerTokenAccountsWithFallback(
  primaryConnection: Connection,
  owner: PublicKey,
  cluster: "mainnet-beta" | "devnet"
) {
  const candidateEndpoints =
    cluster === "devnet" ? DEVNET_FALLBACK_RPC_ENDPOINTS : MAINNET_FALLBACK_RPC_ENDPOINTS;

  const queryWithTimeout = async (conn: Connection, ms = 4200) => {
    return Promise.race([
      Promise.all([
        conn.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }, "confirmed"),
        conn.getParsedTokenAccountsByOwner(
          owner,
          { programId: TOKEN_2022_PROGRAM_ID },
          "confirmed"
        ),
      ]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("RPC_TIMEOUT")), ms)
      ),
    ]);
  };

  try {
    const [spl, t22] = await queryWithTimeout(primaryConnection, 3800);
    return { spl, t22, activeConnection: primaryConnection };
  } catch {
    for (const endpoint of candidateEndpoints) {
      try {
        const fallbackConn = new Connection(endpoint, {
          commitment: "confirmed",
          disableRetryOnRateLimit: true,
        });
        const [spl, t22] = await queryWithTimeout(fallbackConn, 4500);
        return { spl, t22, activeConnection: fallbackConn };
      } catch {
        // Try next RPC node
      }
    }
    throw new Error("All Solana RPC endpoints timed out while loading wallet accounts.");
  }
}

export const useUserTokens = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { cluster } = useCluster();
  const [tokens, setTokens] = useState<UserToken[]>([]);
  const [emptyAccounts, setEmptyAccounts] = useState<EmptyTokenAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchGenerationRef = useRef(0);

  const fetchUserTokens = useCallback(async () => {
    if (!publicKey) {
      setTokens([]);
      setEmptyAccounts([]);
      setIsLoading(false);
      return;
    }

    const currentGen = ++fetchGenerationRef.current;
    setIsLoading(true);

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

      // 1. Detect all empty ATAs (amount === "0") for Phase 4 Reclaim SOL
      const detectedEmptyAccounts: EmptyTokenAccount[] = rawCombined
        .filter((acc) => {
          const info = acc.account.data.parsed?.info;
          const rawAmount = info?.tokenAmount?.amount ?? "0";
          const isFrozen = info?.state === "frozen";
          return rawAmount === "0" && !isFrozen;
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

      // 2. Build Phase-A Instant Token List (< 300ms) so UI unlocks immediately!
      const positiveAccounts = rawCombined.filter(
        (acc) => Number(acc.account.data.parsed?.info?.tokenAmount?.uiAmount || 0) > 0
      );

      const metadataCache = getMetadataCache();
      const uncachedMints: Array<{ mint: string; programId: string }> = [];

      const initialTokens: UserToken[] = positiveAccounts.map((accountInfo) => {
        const { mint, tokenAmount } = accountInfo.account.data.parsed.info;
        const lpEntry = lpPoolsMap[mint];

        if (lpEntry && lpEntry.lpMintAddress === mint && lpEntry.baseMint) {
          return {
            mint,
            amount: tokenAmount.uiAmountString,
            decimals: tokenAmount.decimals,
            name: `LP Pool (${lpEntry.baseMint.slice(0, 4)}.../${lpEntry.quoteToken || "SOL"})`,
            symbol: "LP-SOL",
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
            amount: tokenAmount.uiAmountString,
            decimals: tokenAmount.decimals,
            name: knownToken.name,
            symbol: knownToken.symbol,
            logoURI: knownToken.logoURI,
            programId: accountInfo.programId,
            pairedLpMint: lpEntry?.lpMintAddress,
          };
        }

        const cachedToken = metadataCache[mint];
        if (isCacheItemValid(cachedToken) && cachedToken.data?.name) {
          return {
            mint,
            amount: tokenAmount.uiAmountString,
            decimals: tokenAmount.decimals,
            name: cachedToken.data.name,
            symbol: cachedToken.data.symbol || mint.slice(0, 4).toUpperCase(),
            logoURI: cachedToken.data.logoURI || "/sol.png",
            programId: accountInfo.programId,
            pairedLpMint: lpEntry?.lpMintAddress,
          };
        }

        uncachedMints.push({ mint, programId: accountInfo.programId });
        const shortMint = `${mint.slice(0, 4)}...${mint.slice(-4)}`;
        return {
          mint,
          amount: tokenAmount.uiAmountString,
          decimals: tokenAmount.decimals,
          name: `Token (${shortMint})`,
          symbol: mint.slice(0, 4).toUpperCase(),
          logoURI: "/sol.png",
          programId: accountInfo.programId,
          pairedLpMint: lpEntry?.lpMintAddress,
        };
      });

      // Prepend newly created token from localStorage if minted within the last 10 minutes
      try {
        const lastRaw = localStorage.getItem("lastCreatedTokenDossier");
        if (lastRaw) {
          const lastDossier = JSON.parse(lastRaw);
          const isRecent = Date.now() - (lastDossier.createdAt || 0) < 10 * 60 * 1000;
          if (
            isRecent &&
            lastDossier.mintAddress &&
            lastDossier.network === cluster &&
            !initialTokens.some((t) => t.mint === lastDossier.mintAddress)
          ) {
            initialTokens.unshift({
              mint: lastDossier.mintAddress,
              amount: String(lastDossier.supply || "0"),
              decimals: Number(lastDossier.decimals ?? 9),
              name: lastDossier.name || "New Token",
              symbol: lastDossier.symbol || "TOKEN",
              logoURI: lastDossier.imageUrl || "/sol.png",
              programId:
                lastDossier.tokenStandard === "token-2022"
                  ? TOKEN_2022_PROGRAM_ID.toBase58()
                  : TOKEN_PROGRAM_ID.toBase58(),
            });
          }
        }
      } catch {
        // Ignore storage read errors
      }

      // Unlock UI immediately with Phase-A tokens!
      setTokens(initialTokens);
      setIsLoading(false);

      // 3. Phase-B Non-Blocking Background Metadata Enrichment (Single Batched RPC Call!)
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

      await Promise.all(
        batchTargets.map(async (target, idx) => {
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

          // Fallback for Token-2022 native metadata extension
          if (target.programId === TOKEN_2022_PROGRAM_ID.toBase58()) {
            try {
              const nativeMeta = await getSplToken2022Metadata(
                activeConnection,
                new PublicKey(target.mint),
                "confirmed",
                TOKEN_2022_PROGRAM_ID
              );
              if (nativeMeta) {
                const cleanName = nativeMeta.name.replace(/\0/g, "").trim();
                const cleanSymbol = nativeMeta.symbol.replace(/\0/g, "").trim();
                decodedByMint.set(target.mint, {
                  name: cleanName,
                  symbol: cleanSymbol,
                  logoURI: "/sol.png",
                });
                if (nativeMeta.uri) {
                  offChainUriQueue.push({
                    mint: target.mint,
                    uri: nativeMeta.uri,
                    name: cleanName,
                    symbol: cleanSymbol,
                  });
                }
              }
            } catch {
              // Ignore
            }
          }
        })
      );

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

      // Resolve off-chain logos in parallel with 2.4s timeout per URI
      if (offChainUriQueue.length > 0 && currentGen === fetchGenerationRef.current) {
        const logoResults = await Promise.all(
          offChainUriQueue.slice(0, 20).map(async (entry) => {
            const logoURI = await fetchImageFromMetadataUriWithTimeout(entry.uri, 2400);
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
    } catch (error) {
      console.error("Failed to fetch user tokens:", error);
      if (currentGen === fetchGenerationRef.current) {
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
    refreshTokens: fetchUserTokens,
  };
};
