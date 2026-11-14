import { useState, useEffect, useMemo, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getTokenMetadata as getSplToken2022Metadata,
} from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fetchDigitalAsset, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey as umiPublicKey } from "@metaplex-foundation/umi";
import { useCluster } from "@/context/WalletContext";
import { ESTIMATED_ATA_RENT_SOL } from "@/lib/constants";
import { getMetadataCache, setMetadataCache, isCacheItemValid } from "@/lib/cache";

interface SolanaToken {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
}

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

/**
 * Phase 4: Represents an Associated Token Account (ATA) with exact balance === 0
 * whose rent (~0.00203928 SOL) can be reclaimed via createCloseAccountInstruction.
 */
export interface EmptyTokenAccount {
  pubkey: string;
  mint: string;
  programId: string;
  lamports: number;
  rentSol: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchImageFromMetadataUri(uri?: string | null): Promise<string> {
  if (!uri) return "";
  const cleanUri = uri.replace(/\0/g, "").trim();
  if (!cleanUri.startsWith("https://")) return "";
  try {
    const response = await fetch(cleanUri);
    if (response.ok) {
      const offChainMetadata = await response.json();
      if (
        typeof offChainMetadata.image === "string" &&
        offChainMetadata.image.startsWith("https://")
      ) {
        return offChainMetadata.image;
      }
    }
  } catch (err) {
    console.warn(`Failed to fetch off-chain JSON metadata from ${cleanUri}:`, err);
  }
  return "";
}

export const useUserTokens = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { cluster, rpcEndpoint } = useCluster();
  const [tokens, setTokens] = useState<UserToken[]>([]);
  const [emptyAccounts, setEmptyAccounts] = useState<EmptyTokenAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenMap, setTokenMap] = useState<Map<string, SolanaToken>>(new Map());

  const umi = useMemo(
    () => createUmi(rpcEndpoint).use(mplTokenMetadata()),
    [rpcEndpoint]
  );

  useEffect(() => {
    let isMounted = true;
    const fetchTokenList = async () => {
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json"
        );
        if (!response.ok) return;
        const data = await response.json();
        const tokenList: SolanaToken[] = data.tokens || [];
        if (isMounted) {
          setTokenMap(new Map(tokenList.map((token) => [token.address, token])));
        }
      } catch (error) {
        console.warn("Could not fetch static Solana token list:", error);
      }
    };
    fetchTokenList();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchUserTokens = useCallback(async () => {
    if (!publicKey) {
      setTokens([]);
      setEmptyAccounts([]);
      return;
    }

    setIsLoading(true);
    try {
      let lpPoolsMap: Record<string, any> = {};
      try {
        const rawLp = localStorage.getItem("createdLpPoolsMap");
        if (rawLp) lpPoolsMap = JSON.parse(rawLp);
      } catch {
        lpPoolsMap = {};
      }

      const [tokenAccounts, token2022Accounts] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: TOKEN_PROGRAM_ID },
          "confirmed"
        ),
        connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: TOKEN_2022_PROGRAM_ID },
          "confirmed"
        ),
      ]);

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

      // Phase 4: Filter all ATAs with balance === 0 that can be closed to reclaim SOL rent
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
          lamports: acc.account.lamports || Math.round(ESTIMATED_ATA_RENT_SOL * LAMPORTS_PER_SOL),
          rentSol: acc.account.lamports
            ? acc.account.lamports / LAMPORTS_PER_SOL
            : ESTIMATED_ATA_RENT_SOL,
        }));

      setEmptyAccounts(detectedEmptyAccounts);

      const allAccounts = rawCombined.filter(
        (acc) => acc.account.data.parsed.info.tokenAmount.uiAmount > 0
      );

      const resolvedTokens: UserToken[] = [];
      const BATCH_SIZE = 5;
      const DELAY_MS = 180;
      const metadataCache = getMetadataCache();

      for (let i = 0; i < allAccounts.length; i += BATCH_SIZE) {
        const batch = allAccounts.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (accountInfo) => {
          const { mint, tokenAmount } = accountInfo.account.data.parsed.info;
          const lpEntry = lpPoolsMap[mint];

          if (lpEntry && lpEntry.lpMintAddress === mint) {
            return {
              mint,
              amount: tokenAmount.uiAmountString,
              decimals: tokenAmount.decimals,
              name: `LP Pool Token (${lpEntry.baseMint.slice(0, 4)}.../${lpEntry.quoteToken || "SOL"})`,
              symbol: "LP-SOL",
              logoURI: "/favicon.ico",
              programId: accountInfo.programId,
              isLpToken: true,
              pairedBaseMint: lpEntry.baseMint,
              pairedLpMint: mint,
            };
          }

          const tokenData = tokenMap.get(mint);
          if (tokenData) {
            return {
              mint,
              amount: tokenAmount.uiAmountString,
              decimals: tokenAmount.decimals,
              name: tokenData.name,
              symbol: tokenData.symbol,
              logoURI: tokenData.logoURI,
              programId: accountInfo.programId,
              pairedLpMint: lpEntry?.lpMintAddress,
            };
          }

          const cachedToken = metadataCache[mint];
          if (isCacheItemValid(cachedToken) && cachedToken.data?.logoURI) {
            return {
              mint,
              amount: tokenAmount.uiAmountString,
              decimals: tokenAmount.decimals,
              ...cachedToken.data,
              programId: accountInfo.programId,
              pairedLpMint: lpEntry?.lpMintAddress,
            };
          }

          try {
            const asset = await fetchDigitalAsset(umi, umiPublicKey(mint));
            const finalLogoURI = await fetchImageFromMetadataUri(asset.metadata.uri);

            const metadata = {
              name: asset.metadata.name.replace(/\0/g, "").trim(),
              symbol: asset.metadata.symbol.replace(/\0/g, "").trim(),
              logoURI: finalLogoURI,
            };

            metadataCache[mint] = { data: metadata, timestamp: Date.now() };

            return {
              mint,
              amount: tokenAmount.uiAmountString,
              decimals: tokenAmount.decimals,
              ...metadata,
              programId: accountInfo.programId,
              pairedLpMint: lpEntry?.lpMintAddress,
            };
          } catch {
            if (accountInfo.programId === TOKEN_2022_PROGRAM_ID.toBase58()) {
              try {
                const nativeMeta = await getSplToken2022Metadata(
                  connection,
                  new PublicKey(mint),
                  "confirmed",
                  TOKEN_2022_PROGRAM_ID
                );
                if (nativeMeta) {
                  const finalLogoURI = await fetchImageFromMetadataUri(nativeMeta.uri);
                  const metadata = {
                    name: nativeMeta.name.replace(/\0/g, "").trim(),
                    symbol: nativeMeta.symbol.replace(/\0/g, "").trim(),
                    logoURI: finalLogoURI,
                  };
                  metadataCache[mint] = { data: metadata, timestamp: Date.now() };
                  return {
                    mint,
                    amount: tokenAmount.uiAmountString,
                    decimals: tokenAmount.decimals,
                    ...metadata,
                    programId: accountInfo.programId,
                    pairedLpMint: lpEntry?.lpMintAddress,
                  };
                }
              } catch {
                // Fall through
              }
            }

            const shortMint = `${mint.slice(0, 4)}...${mint.slice(-4)}`;
            return {
              mint,
              amount: tokenAmount.uiAmountString,
              decimals: tokenAmount.decimals,
              name: cachedToken?.data?.name || `Wallet Token (${shortMint})`,
              symbol: cachedToken?.data?.symbol || shortMint,
              logoURI: cachedToken?.data?.logoURI || "/favicon.ico",
              programId: accountInfo.programId,
              pairedLpMint: lpEntry?.lpMintAddress,
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        resolvedTokens.push(...batchResults);

        if (i + BATCH_SIZE < allAccounts.length) {
          await sleep(DELAY_MS);
        }
      }

      try {
        const lastRaw = localStorage.getItem("lastCreatedTokenDossier");
        if (lastRaw) {
          const lastDossier = JSON.parse(lastRaw);
          const isRecent = Date.now() - (lastDossier.createdAt || 0) < 10 * 60 * 1000;
          if (
            isRecent &&
            lastDossier.mintAddress &&
            lastDossier.network === cluster &&
            !resolvedTokens.some((t) => t.mint === lastDossier.mintAddress)
          ) {
            resolvedTokens.unshift({
              mint: lastDossier.mintAddress,
              amount: String(lastDossier.supply || "0"),
              decimals: Number(lastDossier.decimals ?? 9),
              name: lastDossier.name || "New Token",
              symbol: lastDossier.symbol || "TOKEN",
              logoURI: lastDossier.imageUrl || "/favicon.ico",
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

      setMetadataCache(metadataCache);
      setTokens(resolvedTokens);
    } catch (error) {
      console.error("Failed to fetch user's tokens:", error);
      setTokens([]);
      setEmptyAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, cluster, tokenMap, umi]);

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
