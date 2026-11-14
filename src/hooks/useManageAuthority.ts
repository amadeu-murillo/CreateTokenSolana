import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useCluster } from "@/context/WalletContext";
import { verifyTransactionIntegrity } from "@/lib/security";
import { parseSolanaError } from "./useErrorHandler";

export const useManageAuthority = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const [isLoading, setIsLoading] = useState(false);
  const [statusStep, setStatusStep] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const manageAuthority = useCallback(
    async (mint: string, authorityType: "mint" | "freeze", programId: string) => {
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
      setProgressStep(0);
      setStatusStep(
        `Building ${authorityType === "mint" ? "Mint" : "Freeze"} Authority revocation transaction...`
      );

      try {
        let affiliateRef: string | null = null;
        try {
          affiliateRef = localStorage.getItem("affiliateRef");
        } catch {
          affiliateRef = null;
        }

        const response = await fetch("/api/manage-authority", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mint,
            authorityType,
            wallet: publicKey.toBase58(),
            programId,
            affiliate: affiliateRef,
            network: cluster,
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        setProgressStep(1);
        setStatusStep("Verifying program whitelist & simulating revocation on-chain...");

        const transactionBuffer = Buffer.from(result.transaction, "base64");
        const transaction = VersionedTransaction.deserialize(new Uint8Array(transactionBuffer));

        const integrity = verifyTransactionIntegrity(transaction, publicKey.toBase58());
        if (!integrity.valid) {
          throw new Error(
            integrity.reason || "Transaction failed client-side security verification."
          );
        }

        const simulation = await connection.simulateTransaction(transaction, {
          sigVerify: false,
          replaceRecentBlockhash: true,
          commitment: "processed",
        });

        if (simulation.value.err) {
          throw new Error(
            `Simulation failed before signing: ${JSON.stringify(simulation.value.err)}`
          );
        }

        setProgressStep(2);
        setStatusStep("Waiting for wallet signature approval...");

        const signature = await sendTransaction(transaction, connection, {
          skipPreflight: false,
          maxRetries: 3,
        });

        setProgressStep(3);
        setStatusStep("Confirming permanent authority revocation on Solana...");

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

        setProgressStep(4);
        setStatusStep("Authority permanently revoked on-chain!");

        return signature;
      } catch (err) {
        setError(parseSolanaError(err, "revoke token authority"));
        return null;
      } finally {
        setIsLoading(false);
        setStatusStep(null);
      }
    },
    [publicKey, sendTransaction, connection, cluster]
  );

  const reset = useCallback(() => {
    setError(null);
    setStatusStep(null);
    setProgressStep(0);
  }, []);

  return { manageAuthority, isLoading, statusStep, progressStep, error, reset };
};
