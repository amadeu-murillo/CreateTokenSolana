import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useCluster } from "@/context/WalletContext";
import { MAX_AIRDROP_RECIPIENTS_PER_TX } from "@/lib/constants";
import { verifyTransactionIntegrity } from "@/lib/security";
import { parseSolanaError } from "./useErrorHandler";

interface Recipient {
  address: string;
  amount: number;
}

export const useAirdrop = () => {
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const performAirdrop = useCallback(
    async (mint: string, recipients: Recipient[], programId: string) => {
      if (!publicKey || !sendTransaction || !signAllTransactions) {
        setError("Wallet not connected or does not support batch transaction signing.");
        return null;
      }
      if (!connection) {
        setError("Connection to the Solana network was not established.");
        return null;
      }

      setIsLoading(true);
      setError(null);
      setSignature(null);

      let firstSignature: string | null = null;

      try {
        const batchSize = Math.min(10, MAX_AIRDROP_RECIPIENTS_PER_TX);
        const recipientChunks: Recipient[][] = [];

        if (recipients && recipients.length > 0) {
          for (let i = 0; i < recipients.length; i += batchSize) {
            recipientChunks.push(recipients.slice(i, i + batchSize));
          }
        } else {
          throw new Error("The recipient list is empty or invalid.");
        }

        const affiliateRef =
          typeof window !== "undefined" ? localStorage.getItem("affiliateRef") : null;
        const transactions: VersionedTransaction[] = [];

        for (let i = 0; i < recipientChunks.length; i++) {
          setSignature(`Preparing batch ${i + 1} of ${recipientChunks.length}...`);
          const chunk = recipientChunks[i];
          const response = await fetch("/api/airdrop", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mint,
              recipients: chunk,
              wallet: publicKey.toBase58(),
              programId,
              network: cluster,
              affiliate: affiliateRef,
            }),
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || `Failed to prepare batch ${i + 1}.`);
          }

          const transactionBuffer = Buffer.from(result.transaction, "base64");
          const deserializedTx = VersionedTransaction.deserialize(transactionBuffer);
          const integrity = verifyTransactionIntegrity(deserializedTx, publicKey.toBase58());
          if (!integrity.valid) {
            throw new Error(integrity.reason || `Batch ${i + 1} failed client-side security check.`);
          }
          transactions.push(deserializedTx);
        }

        setSignature(`Waiting for approval of ${transactions.length} transaction(s) in wallet...`);
        const signedTransactions = await signAllTransactions(transactions);

        if (!signedTransactions || signedTransactions.length === 0) {
          throw new Error("Transactions were not signed by the user.");
        }

        setSignature(`Sending ${signedTransactions.length} transaction(s) to Solana...`);
        const signatures = await Promise.all(
          signedTransactions.map((tx) =>
            connection.sendRawTransaction(tx.serialize(), { maxRetries: 3 })
          )
        );

        setSignature("Confirming transactions on-chain...");
        firstSignature = signatures[0];

        if (firstSignature) {
          const { blockhash, lastValidBlockHeight } =
            await connection.getLatestBlockhash("confirmed");
          await connection.confirmTransaction(
            {
              signature: firstSignature,
              blockhash,
              lastValidBlockHeight,
            },
            "confirmed"
          );
        }

        setSignature(firstSignature);
        return firstSignature;
      } catch (err) {
        const friendlyMessage = parseSolanaError(err, "execute the airdrop");

        if (friendlyMessage === "SUCCESS_ALREADY_PROCESSED") {
          const successSignature = firstSignature || "confirmed";
          setSignature(successSignature);
          setError(null);
          return successSignature;
        }

        setError(friendlyMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [publicKey, sendTransaction, signAllTransactions, connection, cluster]
  );

  const reset = useCallback(() => {
    setError(null);
    setSignature(null);
  }, []);

  return { performAirdrop, isLoading, error, signature, reset };
};
