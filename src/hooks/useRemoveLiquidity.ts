import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useCluster } from "@/context/WalletContext";
import {
  AFFILIATE_COMMISSION_RATE,
  SERVICE_FEE_REMOVE_LP_SOL,
  SolanaCluster,
} from "@/lib/constants";
import { verifyTransactionIntegrity } from "@/lib/security";
import { QuoteAsset, RemoveLiquidityParams, RemoveLiquidityResponse } from "@/types/api";
import { parseSolanaError } from "./useErrorHandler";

export interface RemoveLiquidityResult {
  signature: string;
  poolId: string;
  lpMint: string;
  baseMint: string;
  quoteToken: QuoteAsset;
  lpPairLabel: "LP-SOL" | "LP-USDC";
  quoteVaultAddress: string;
  withdrawnQuote: number;
  withdrawPercentage: number;
  estimatedQuoteReturned: string;
  estimatedBaseReturned: string;
  serviceFeeSol: number;
}

interface StoredLpPoolEntry {
  poolId?: string;
  poolAddress?: string;
  lpMintAddress?: string;
  baseMint?: string;
  quoteToken?: QuoteAsset;
  network?: string;
}

export const useRemoveLiquidity = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { cluster } = useCluster();

  const [isLoading, setIsLoading] = useState(false);
  const [statusStep, setStatusStep] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [removeResult, setRemoveResult] = useState<RemoveLiquidityResult | null>(null);

  const removeLiquidity = useCallback(
    async (params: RemoveLiquidityParams): Promise<RemoveLiquidityResult | null> => {
      if (!publicKey || !sendTransaction) {
        setError("Please connect your Solana wallet to withdraw liquidity.");
        return null;
      }
      if (!connection) {
        setError("Connection to the Solana network was not established.");
        return null;
      }

      const targetNetwork: SolanaCluster = params.network || cluster;

      setIsLoading(true);
      setError(null);
      setRemoveResult(null);
      setProgressStep(1);
      setStatusStep(
        `Stage 1/5: Fetching Raydium CPMM pool state & preparing withdrawal on ${targetNetwork}...`
      );

      try {
        let affiliateRef: string | null = null;
        try {
          affiliateRef = localStorage.getItem("affiliateRef");
        } catch {
          affiliateRef = null;
        }

        let resolvedPoolId = params.poolId;
        let resolvedLpMint = params.lpMint;
        try {
          const rawMap = localStorage.getItem("createdLpPoolsMap");
          if (rawMap) {
            const parsedMap: Record<string, StoredLpPoolEntry> = JSON.parse(rawMap);
            const candidateEntry =
              (params.poolId && parsedMap[params.poolId]) ||
              (params.lpMint && parsedMap[params.lpMint]) ||
              parsedMap[params.baseMint];

            if (candidateEntry) {
              if (!resolvedPoolId) {
                resolvedPoolId = candidateEntry.poolId || candidateEntry.poolAddress;
              }
              if (!resolvedLpMint && candidateEntry.lpMintAddress) {
                resolvedLpMint = candidateEntry.lpMintAddress;
              }
            }
          }
        } catch {
          // Ignore localStorage parse errors
        }

        const response = await fetch("/api/remove-liquidity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...params,
            poolId: resolvedPoolId,
            lpMint: resolvedLpMint,
            wallet: publicKey.toBase58(),
            affiliate: affiliateRef,
            network: targetNetwork,
          }),
        });

        const data: RemoveLiquidityResponse & { error?: string } = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to build liquidity withdrawal transaction.");
        }

        setProgressStep(2);
        setStatusStep(
          "Stage 2/5: Auditing program whitelist & simulating Raydium CPMM withdrawal..."
        );

        const txBuffer = Buffer.from(data.transaction, "base64");
        const transaction = VersionedTransaction.deserialize(new Uint8Array(txBuffer));

        const integrity = verifyTransactionIntegrity(transaction, publicKey.toBase58(), {
          operation: "removeLiquidity",
          expectedServiceFeeSol: SERVICE_FEE_REMOVE_LP_SOL,
          affiliateWallet: affiliateRef,
        });
        if (!integrity.valid) {
          throw new Error(
            integrity.reason || "Transaction failed client-side security verification."
          );
        }

        const simulation = await connection.simulateTransaction(transaction, {
          sigVerify: false,
          replaceRecentBlockhash: true,
          commitment: "confirmed",
        });

        if (simulation.value.err) {
          console.error("Withdraw simulation error:", simulation.value.err, simulation.value.logs);
          throw new Error(
            `Withdrawal simulation failed: ${JSON.stringify(simulation.value.err)}`
          );
        }

        setProgressStep(3);
        setStatusStep("Stage 3/5: Waiting for signature approval in your Solana wallet...");

        const signature = await sendTransaction(transaction, connection, {
          skipPreflight: false,
          maxRetries: 3,
        });

        setProgressStep(4);
        setStatusStep("Stage 4/5: Confirming Raydium CPMM liquidity withdrawal on-chain...");

        await connection.confirmTransaction(
          {
            signature,
            blockhash: data.blockhash,
            lastValidBlockHeight: data.lastValidBlockHeight,
          },
          "confirmed"
        );

        const quoteToken: QuoteAsset = data.quoteToken === "USDC" ? "USDC" : "SOL";
        const lpPairLabel: "LP-SOL" | "LP-USDC" =
          data.lpPairLabel || (quoteToken === "USDC" ? "LP-USDC" : "LP-SOL");

        setProgressStep(5);
        setStatusStep(
          `Stage 5/5: Raydium CPMM ${lpPairLabel} liquidity withdrawn (${quoteToken})!`
        );

        if (affiliateRef && affiliateRef !== publicKey.toBase58()) {
          fetch("/api/record-commission", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              affiliateWallet: affiliateRef,
              commissionAmountSOL: SERVICE_FEE_REMOVE_LP_SOL * AFFILIATE_COMMISSION_RATE,
              transactionSignature: signature,
              tokenCreatorWallet: publicKey.toBase58(),
              mintAddress: data.baseMint || params.baseMint,
              network: targetNetwork,
            }),
          }).catch(() => {});
        }

        const parsedQuote = parseFloat(String(data.estimatedQuoteReturned || "0")) || 0;

        const finalResult: RemoveLiquidityResult = {
          signature,
          poolId: String(data.poolId || resolvedPoolId || ""),
          lpMint: String(data.lpMint || resolvedLpMint || ""),
          baseMint: String(data.baseMint || params.baseMint),
          quoteToken,
          lpPairLabel,
          quoteVaultAddress: String(
            data.quoteVaultAddress || data.poolId || params.baseMint
          ),
          withdrawnQuote:
            typeof data.withdrawnQuote === "number" ? data.withdrawnQuote : parsedQuote,
          withdrawPercentage: params.withdrawPercentage,
          estimatedQuoteReturned: String(
            data.estimatedQuoteReturned || parsedQuote.toFixed(quoteToken === "USDC" ? 2 : 6)
          ),
          estimatedBaseReturned: String(data.estimatedBaseReturned || "0"),
          serviceFeeSol: SERVICE_FEE_REMOVE_LP_SOL,
        };

        setRemoveResult(finalResult);
        return finalResult;
      } catch (err) {
        setError(parseSolanaError(err, "withdraw liquidity from Raydium CPMM"));
        return null;
      } finally {
        setIsLoading(false);
        setStatusStep(null);
        setProgressStep(0);
      }
    },
    [publicKey, sendTransaction, connection, cluster]
  );

  const reset = useCallback(() => {
    setError(null);
    setRemoveResult(null);
    setStatusStep(null);
    setProgressStep(0);
  }, []);

  return {
    removeLiquidity,
    isLoading,
    statusStep,
    progressStep,
    error,
    removeResult,
    withdrawResult: removeResult,
    reset,
  };
};
