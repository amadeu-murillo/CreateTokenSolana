import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import { useCluster } from "@/context/WalletContext";
import { AFFILIATE_COMMISSION_RATE, SERVICE_FEE_CREATE_TOKEN_SOL } from "@/lib/constants";
import { getMetadataCache, setMetadataCache } from "@/lib/cache";
import { verifyTransactionIntegrity } from "@/lib/security";
import { parseSolanaError } from "./useErrorHandler";

export interface TokenData {
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  imageUrl: string;
  description?: string;
  website?: string;
  twitter?: string;
  instagram?: string;
  mintAuthority: boolean;
  freezeAuthority: boolean;
  tokenStandard: "spl" | "token-2022";
  useNativeMetadataExtension?: boolean;
  storageProvider?: "arweave" | "cloudinary";
  transferFee: {
    basisPoints: number;
    maxFee: number;
  };
  isMetadataMutable: boolean;
}

export const useCreateToken = () => {
  const router = useRouter();
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const [isLoading, setIsLoading] = useState(false);
  const [statusStep, setStatusStep] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const createToken = useCallback(
    async (tokenData: TokenData) => {
      if (!publicKey || !sendTransaction) {
        const errorMessage = "Wallet not connected. Please connect your Solana wallet to continue.";
        setError(errorMessage);
        return null;
      }

      if (!connection) {
        const errorMessage = "Connection to the Solana network was not established.";
        setError(errorMessage);
        return null;
      }

      setIsLoading(true);
      setError(null);
      setProgressStep(1);
      setStatusStep("Stage 1/5: Validating token parameters & uploading metadata JSON...");

      try {
        let affiliateRef: string | null = null;
        try {
          affiliateRef = localStorage.getItem("affiliateRef");
        } catch {
          affiliateRef = null;
        }

        const apiPayload = {
          ...tokenData,
          wallet: publicKey.toBase58(),
          affiliate: affiliateRef,
          network: cluster,
        };

        const response = await fetch("/api/create-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiPayload),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to prepare the transaction on the server.");
        }

        setProgressStep(2);
        setStatusStep(
          "Stage 2/5: Verifying program whitelist & simulating transaction on Solana RPC..."
        );

        const transactionBuffer = Buffer.from(result.transaction, "base64");
        const transaction = VersionedTransaction.deserialize(transactionBuffer);

        const integrity = verifyTransactionIntegrity(transaction, publicKey.toBase58());
        if (!integrity.valid) {
          throw new Error(
            integrity.reason || "Transaction failed client-side security verification."
          );
        }

        // Simulate unsigned VersionedTransaction with sigVerify: false & replaceRecentBlockhash: true
        const simulationResult = await connection.simulateTransaction(transaction, {
          sigVerify: false,
          replaceRecentBlockhash: true,
          commitment: "confirmed",
        });

        if (simulationResult.value.err) {
          console.error(
            "Token creation simulation failed:",
            simulationResult.value.err,
            simulationResult.value.logs
          );
          throw new Error(
            `Transaction simulation failed: ${JSON.stringify(simulationResult.value.err)}`
          );
        }

        setProgressStep(3);
        setStatusStep("Stage 3/5: Waiting for signature approval in your Solana wallet...");

        const signature = await sendTransaction(transaction, connection, {
          skipPreflight: false,
          maxRetries: 3,
        });

        setProgressStep(4);
        setStatusStep("Stage 4/5: Broadcasting & confirming block finality on Solana...");

        const blockhashInfo =
          result.blockhash && result.lastValidBlockHeight
            ? {
                blockhash: result.blockhash,
                lastValidBlockHeight: result.lastValidBlockHeight,
              }
            : await connection.getLatestBlockhash("confirmed");

        await connection.confirmTransaction(
          {
            signature,
            blockhash: blockhashInfo.blockhash,
            lastValidBlockHeight: blockhashInfo.lastValidBlockHeight,
          },
          "confirmed"
        );

        setProgressStep(5);
        setStatusStep("Stage 5/5: Token minted on-chain! Indexing metadata & preparing receipt...");

        const effectiveFeeSol = result.serviceFeeSol ?? SERVICE_FEE_CREATE_TOKEN_SOL;

        if (result.mintAddress) {
          const cache = getMetadataCache();
          cache[result.mintAddress] = {
            data: {
              name: tokenData.name,
              symbol: tokenData.symbol,
              logoURI: result.imageUrl || tokenData.imageUrl,
            },
            timestamp: Date.now(),
          };
          setMetadataCache(cache);

          try {
            localStorage.setItem(
              "lastCreatedTokenDossier",
              JSON.stringify({
                mintAddress: result.mintAddress,
                signature,
                name: tokenData.name,
                symbol: tokenData.symbol,
                decimals: tokenData.decimals,
                supply: tokenData.supply,
                imageUrl: result.imageUrl || tokenData.imageUrl,
                metadataUri: result.metadataUri || "",
                tokenStandard: tokenData.tokenStandard,
                mintAuthority: tokenData.mintAuthority,
                freezeAuthority: tokenData.freezeAuthority,
                isMetadataMutable: tokenData.isMetadataMutable,
                serviceFeeSol: effectiveFeeSol,
                network: cluster,
                createdAt: Date.now(),
              })
            );
          } catch {
            // Ignore localStorage quota errors
          }
        }

        if (affiliateRef && affiliateRef !== publicKey.toBase58()) {
          fetch("/api/record-commission", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              affiliateWallet: affiliateRef,
              commissionAmountSOL: effectiveFeeSol * AFFILIATE_COMMISSION_RATE,
              transactionSignature: signature,
              tokenCreatorWallet: publicKey.toBase58(),
              mintAddress: result.mintAddress,
              network: cluster,
            }),
          }).catch((firebaseErr) =>
            console.warn("Warning recording affiliate commission:", firebaseErr)
          );
        }

        router.push(
          `/confirmation?status=success&tokenAddress=${result.mintAddress}&txId=${signature}&network=${cluster}`
        );
        return { signature, mintAddress: result.mintAddress };
      } catch (err) {
        const friendlyMessage = parseSolanaError(err, "create the token");
        setError(friendlyMessage);
        return null;
      } finally {
        setIsLoading(false);
        setStatusStep(null);
        setProgressStep(0);
      }
    },
    [publicKey, sendTransaction, connection, cluster, router]
  );

  const clearError = useCallback(() => setError(null), []);

  return { createToken, isLoading, statusStep, progressStep, error, clearError };
};
