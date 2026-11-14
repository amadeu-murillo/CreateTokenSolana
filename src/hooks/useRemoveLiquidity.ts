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
import { parseSolanaError } from "./useErrorHandler";

export interface RemoveLiquidityResult {
  signature: string;
  baseMint: string;
  wsolVaultAddress: string;
  withdrawnSol: number;
  withdrawPercentage: number;
  estimatedSolReturned: string;
  serviceFeeSol: number;
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
    async (params: {
      baseMint: string;
      lpMint?: string;
      withdrawPercentage: number;
      programId?: string;
      network?: SolanaCluster;
    }): Promise<RemoveLiquidityResult | null> => {
      if (!publicKey || !sendTransaction) {
        setError("Please connect your Solana wallet to withdraw liquidity.");
        return null;
      }
      if (!connection) {
        setError("Connection to the Solana network was not established.");
        return null;
      }

      const targetNetwork = params.network || cluster;

      setIsLoading(true);
      setError(null);
      setRemoveResult(null);
      setProgressStep(1);
      setStatusStep("Stage 1/5: Preparing SOL liquidity withdrawal & WSOL unwrap instructions...");

      try {
        let affiliateRef: string | null = null;
        try {
          affiliateRef = localStorage.getItem("affiliateRef");
        } catch {
          affiliateRef = null;
        }

        const response = await fetch("/api/remove-liquidity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...params,
            wallet: publicKey.toBase58(),
            affiliate: affiliateRef,
            network: targetNetwork,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to build liquidity withdrawal transaction.");
        }

        setProgressStep(2);
        setStatusStep(
          "Stage 2/5: Auditing program whitelist & simulating SOL withdrawal on Solana..."
        );

        const txBuffer = Buffer.from(data.transaction, "base64");
        const transaction = VersionedTransaction.deserialize(txBuffer);

        const integrity = verifyTransactionIntegrity(transaction, publicKey.toBase58());
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
        setStatusStep("Stage 4/5: Confirming SOL liquidity withdrawal on-chain...");

        await connection.confirmTransaction(
          {
            signature,
            blockhash: data.blockhash,
            lastValidBlockHeight: data.lastValidBlockHeight,
          },
          "confirmed"
        );

        setProgressStep(5);
        setStatusStep("Stage 5/5: SOL liquidity withdrawn & unwrapped to your wallet!");

        if (affiliateRef && affiliateRef !== publicKey.toBase58()) {
          fetch("/api/record-commission", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              affiliateWallet: affiliateRef,
              commissionAmountSOL: SERVICE_FEE_REMOVE_LP_SOL * AFFILIATE_COMMISSION_RATE,
              transactionSignature: signature,
              tokenCreatorWallet: publicKey.toBase58(),
              mintAddress: params.baseMint,
              network: targetNetwork,
            }),
          }).catch(() => {});
        }

        const parsedSol = parseFloat(String(data.estimatedSolReturned || "0")) || 0;

        const finalResult: RemoveLiquidityResult = {
          signature,
          baseMint: params.baseMint,
          wsolVaultAddress: String(data.wsolVaultAddress || params.baseMint),
          withdrawnSol: typeof data.withdrawnSol === "number" ? data.withdrawnSol : parsedSol,
          withdrawPercentage: params.withdrawPercentage,
          estimatedSolReturned: String(data.estimatedSolReturned || parsedSol.toFixed(4)),
          serviceFeeSol: SERVICE_FEE_REMOVE_LP_SOL,
        };

        setRemoveResult(finalResult);
        return finalResult;
      } catch (err) {
        setError(parseSolanaError(err, "withdraw SOL liquidity"));
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
