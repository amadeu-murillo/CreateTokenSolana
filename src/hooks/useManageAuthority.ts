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

        const transactionBuffer = Buffer.from(result.transaction, "base64");
        const transaction = VersionedTransaction.deserialize(transactionBuffer);

        const integrity = verifyTransactionIntegrity(transaction, publicKey.toBase58());
        if (!integrity.valid) {
          throw new Error(integrity.reason || "Transaction failed client-side security verification.");
        }

        const signature = await sendTransaction(transaction, connection);

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

        return signature;
      } catch (err) {
        setError(parseSolanaError(err, "revoke token authority"));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [publicKey, sendTransaction, connection, cluster]
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { manageAuthority, isLoading, error, reset };
};
