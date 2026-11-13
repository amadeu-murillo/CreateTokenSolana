import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useCluster } from "@/context/WalletContext";
import { verifyTransactionIntegrity } from "@/lib/security";
import { parseSolanaError } from "./useErrorHandler";

export const useBurnToken = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const [isLoading, setIsLoading] = useState(false);
  const [statusStep, setStatusStep] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const burnToken = useCallback(
    async (mint: string, amount: number, programId: string) => {
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

        const response = await fetch("/api/burn-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mint,
            amount,
            wallet: publicKey.toBase58(),
            programId,
            affiliate: affiliateRef,
            network: cluster,
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        setProgressStep(2);
        setStatusStep("Stage 2/5: Auditing program whitelist & transaction integrity...");

        const transactionBuffer = Buffer.from(result.transaction, "base64");
        const transaction = VersionedTransaction.deserialize(transactionBuffer);

        const integrity = verifyTransactionIntegrity(transaction, publicKey.toBase58());
        if (!integrity.valid) {
          throw new Error(
            integrity.reason || "Transaction failed client-side security verification."
          );
        }

        setProgressStep(3);
        setStatusStep("Stage 3/5: Waiting for signature approval in your wallet...");

        const sig = await sendTransaction(transaction, connection);

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
        setError(parseSolanaError(err, "burn tokens"));
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
    setSignature(null);
    setStatusStep(null);
    setProgressStep(0);
  }, []);

  return { burnToken, isLoading, statusStep, progressStep, error, signature, reset };
};
