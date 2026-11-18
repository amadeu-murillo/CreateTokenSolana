import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useCluster } from "@/context/WalletContext";
import {
  MAX_CLOSE_ACCOUNTS_PER_TX,
  SERVICE_FEE_BURN_AND_EARN_SOL,
  SERVICE_FEE_BURN_TOKEN_SOL,
} from "@/lib/constants";
import { verifyTransactionIntegrity } from "@/lib/security";
import { parseSolanaError } from "./useErrorHandler";
import type { EmptyTokenAccount } from "./useUserTokens";

export interface ReclaimSolResult {
  signature: string;
  closedAccountsCount: number;
  grossReclaimedSol: number;
  serviceFeeSol: number;
  netUserSol: number;
}

export const useBurnToken = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const [isLoading, setIsLoading] = useState(false);
  const [isReclaimingSol, setIsReclaimingSol] = useState(false);
  const [statusStep, setStatusStep] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [reclaimResult, setReclaimResult] = useState<ReclaimSolResult | null>(null);

  const burnToken = useCallback(
    async (
      mint: string,
      amount: number | string,
      programId: string,
      burnMode: "burn" | "burn-and-earn" = "burn"
    ) => {
      if (!publicKey || !sendTransaction) {
        setError("Wallet not connected.");
        return null;
      }
      if (!connection) {
        setError("Connection to the Solana network was not established.");
        return null;
      }

      setIsLoading(true);
      setError(null);
      setSignature(null);
      setProgressStep(1);
      setStatusStep("Stage 1/5: Preparing permanent token burn instruction...");

      try {
        let affiliateRef: string | null = null;
        try {
          affiliateRef = localStorage.getItem("affiliateRef");
        } catch {
          affiliateRef = null;
        }

        const expectedFeeSol =
          burnMode === "burn-and-earn"
            ? SERVICE_FEE_BURN_AND_EARN_SOL
            : SERVICE_FEE_BURN_TOKEN_SOL;

        const response = await fetch("/api/burn-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mint,
            amount: String(amount),
            wallet: publicKey.toBase58(),
            programId,
            burnMode,
            affiliate: affiliateRef,
            network: cluster,
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        setProgressStep(2);
        setStatusStep("Stage 2/5: Auditing program whitelist & transaction integrity...");

        const transactionBuffer = Buffer.from(result.transaction, "base64");
        const transaction = VersionedTransaction.deserialize(new Uint8Array(transactionBuffer));

        const integrity = verifyTransactionIntegrity(transaction, publicKey.toBase58(), {
          operation: burnMode === "burn-and-earn" ? "burnAndEarn" : "burnToken",
          expectedServiceFeeSol: result.serviceFeeSol ?? expectedFeeSol,
          affiliateWallet: affiliateRef,
        });
        if (!integrity.valid) {
          throw new Error(
            integrity.reason || "Transaction failed client-side security verification."
          );
        }

        try {
          const simulation = await connection.simulateTransaction(transaction, {
            sigVerify: false,
            replaceRecentBlockhash: true,
            commitment: "confirmed",
          });

          if (simulation?.value?.err) {
            console.error(
              "Burn simulation failed:",
              simulation.value.err,
              simulation.value.logs
            );
            const logsStr = Array.isArray(simulation.value.logs)
              ? simulation.value.logs.join(" | ")
              : "";
            throw new Error(
              `Burn simulation failed: ${JSON.stringify(simulation.value.err)} ${logsStr}`
            );
          }
        } catch (simErr) {
          if (simErr instanceof Error && simErr.message.startsWith("Burn simulation failed:")) {
            throw simErr;
          }
          console.warn("Non-fatal burn pre-simulation warning (proceeding to wallet):", simErr);
        }

        setProgressStep(3);
        setStatusStep("Stage 3/5: Waiting for signature approval in your wallet...");

        const sig = await sendTransaction(transaction, connection, {
          skipPreflight: false,
          maxRetries: 3,
        });

        setProgressStep(4);
        setStatusStep("Stage 4/5: Confirming permanent burn on Solana blockchain...");

        const blockhashInfo =
          result.blockhash && result.lastValidBlockHeight
            ? {
                blockhash: result.blockhash,
                lastValidBlockHeight: result.lastValidBlockHeight,
              }
            : await connection.getLatestBlockhash("confirmed");

        await connection.confirmTransaction(
          {
            signature: sig,
            blockhash: blockhashInfo.blockhash,
            lastValidBlockHeight: blockhashInfo.lastValidBlockHeight,
          },
          "confirmed"
        );

        setProgressStep(5);
        setStatusStep("Stage 5/5: Burn confirmed on-chain!");
        setSignature(sig);
        return sig;
      } catch (err) {
        setError(parseSolanaError(err, "queimar os tokens"));
        return null;
      } finally {
        setIsLoading(false);
        setStatusStep(null);
        setProgressStep(0);
      }
    },
    [publicKey, sendTransaction, connection, cluster]
  );

  /**
   * Phase 4: Closes up to 20 empty token accounts per transaction, returning rent SOL
   * to the user and routing an 8% service fee (92% net to user) atomically to DEV_WALLET_ADDRESS.
   */
  const reclaimEmptyAccounts = useCallback(
    async (emptyAccounts: EmptyTokenAccount[]): Promise<ReclaimSolResult | null> => {
      if (!publicKey || !sendTransaction) {
        setError("Please connect your Solana wallet to reclaim SOL.");
        return null;
      }
      if (!connection) {
        setError("Connection to the Solana network was not established.");
        return null;
      }
      if (!emptyAccounts || emptyAccounts.length === 0) {
        setError("No empty token accounts found to close.");
        return null;
      }

      setIsReclaimingSol(true);
      setError(null);
      setReclaimResult(null);
      setProgressStep(1);
      setStatusStep("Stage 1/5: Grouping empty token accounts (max 20 per tx)...");

      try {
        let affiliateRef: string | null = null;
        try {
          affiliateRef = localStorage.getItem("affiliateRef");
        } catch {
          affiliateRef = null;
        }

        let totalClosed = 0;
        let totalGrossSol = 0;
        let totalFeeSol = 0;
        let totalNetSol = 0;
        let lastSig = "";

        for (let i = 0; i < emptyAccounts.length; i += MAX_CLOSE_ACCOUNTS_PER_TX) {
          const chunk = emptyAccounts.slice(i, i + MAX_CLOSE_ACCOUNTS_PER_TX);
          const batchNum = Math.floor(i / MAX_CLOSE_ACCOUNTS_PER_TX) + 1;
          const totalBatches = Math.ceil(emptyAccounts.length / MAX_CLOSE_ACCOUNTS_PER_TX);

          setStatusStep(
            `Stage 2/5: Building close-account batch ${batchNum}/${totalBatches} (${chunk.length} empty ATAs)...`
          );
          setProgressStep(2);

          const response = await fetch("/api/reclaim-sol", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              wallet: publicKey.toBase58(),
              accounts: chunk,
              affiliate: affiliateRef,
              network: cluster,
            }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Failed to prepare Reclaim SOL transaction.");
          }

          const txBuffer = Buffer.from(data.transaction, "base64");
          const transaction = VersionedTransaction.deserialize(new Uint8Array(txBuffer));

          const integrity = verifyTransactionIntegrity(transaction, publicKey.toBase58(), {
            operation: "reclaimSol",
            affiliateWallet: affiliateRef,
          });
          if (!integrity.valid) {
            throw new Error(
              integrity.reason || "Transaction failed client-side security verification."
            );
          }

          setProgressStep(3);
          setStatusStep(
            `Stage 3/5: Waiting for wallet signature (Batch ${batchNum}/${totalBatches})...`
          );

          const sig = await sendTransaction(transaction, connection, {
            skipPreflight: false,
            maxRetries: 3,
          });

          setProgressStep(4);
          setStatusStep("Stage 4/5: Confirming account closures & SOL rent recovery on-chain...");

          await connection.confirmTransaction(
            {
              signature: sig,
              blockhash: data.blockhash,
              lastValidBlockHeight: data.lastValidBlockHeight,
            },
            "confirmed"
          );

          lastSig = sig;
          totalClosed += Number(data.closedCount || chunk.length);
          totalGrossSol += Number(data.grossReclaimedSol || 0);
          totalFeeSol += Number(data.serviceFeeSol || 0);
          totalNetSol += Number(data.netUserSol || 0);
        }

        setProgressStep(5);
        setStatusStep("Stage 5/5: All empty accounts closed & SOL returned to your wallet!");

        const finalRes: ReclaimSolResult = {
          signature: lastSig,
          closedAccountsCount: totalClosed,
          grossReclaimedSol: Number(totalGrossSol.toFixed(6)),
          serviceFeeSol: Number(totalFeeSol.toFixed(6)),
          netUserSol: Number(totalNetSol.toFixed(6)),
        };

        setReclaimResult(finalRes);
        return finalRes;
      } catch (err) {
        setError(parseSolanaError(err, "reclaim SOL from empty token accounts"));
        return null;
      } finally {
        setIsReclaimingSol(false);
        setStatusStep(null);
        setProgressStep(0);
      }
    },
    [publicKey, sendTransaction, connection, cluster]
  );

  const reset = useCallback(() => {
    setError(null);
    setSignature(null);
    setReclaimResult(null);
    setStatusStep(null);
    setProgressStep(0);
  }, []);

  return {
    burnToken,
    reclaimEmptyAccounts,
    isLoading,
    isReclaimingSol,
    statusStep,
    progressStep,
    error,
    signature,
    reclaimResult,
    reset,
  };
};
