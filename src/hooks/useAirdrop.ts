import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction, SendTransactionError, Connection } from "@solana/web3.js";

// Enhanced error handling function
async function getFriendlyErrorMessage(error: any, connection: Connection): Promise<string> {
    const message = error.message || String(error);
    console.error("Airdrop error:", error);

    if (error instanceof SendTransactionError) {
        const logs = error.logs;
        if (logs && logs.some(log => log.includes("insufficient lamports"))) {
             return "You don't have enough SOL to cover the network and service fees.";
        }
    }

    if (message.includes("User rejected the request") || message.includes("Transações não assinadas pelo usuário")) {
        return "Transaction rejected by the user in the wallet.";
    }
    if (message.includes("insufficient lamports")) {
        return "You don't have enough SOL to cover the network and service fees.";
    }
    if (message.includes("Transaction simulation failed")) {
        // Specific handling for already processed transaction error
        if (message.includes("This transaction has already been processed")) {
            return "SUCCESS_ALREADY_PROCESSED";
        }
        return "Transaction simulation failed. Check the addresses and make sure you have enough balance.";
    }
    if (message.includes("blockhash")) {
        return "The transaction blockhash has expired. Please try again.";
    }
    return "An error occurred during the airdrop. Check the console for more details.";
}


interface Recipient {
    address: string;
    amount: number;
}

export const useAirdrop = () => {
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const performAirdrop = async (mint: string, recipients: Recipient[], programId: string) => {
    if (!publicKey || !sendTransaction || !signAllTransactions) {
      setError("Wallet not connected or does not support multiple transactions.");
      return;
    }
    if (!connection) {
        setError("Connection to the Solana network was not established.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setSignature(null);

    let firstSignature: string | null = null;

    try {
        const BATCH_SIZE = 10;
        const recipientChunks: Recipient[][] = [];
        if (recipients && recipients.length > 0) {
            for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
                recipientChunks.push(recipients.slice(i, i + BATCH_SIZE));
            }
        } else {
            throw new Error("The recipient list is empty or invalid.");
        }


        const transactions: VersionedTransaction[] = [];
        
        for (let i = 0; i < recipientChunks.length; i++) {
             setSignature(`Preparing transaction ${i + 1} of ${recipientChunks.length}...`);
             const chunk = recipientChunks[i];
             const response = await fetch('/api/airdrop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mint, recipients: chunk, wallet: publicKey.toBase58(), programId }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || `API request failed for batch ${i+1}.`);
            
            const transactionBuffer = Buffer.from(result.transaction, 'base64');
            transactions.push(VersionedTransaction.deserialize(transactionBuffer));
        }

        setSignature(`Waiting for approval of ${transactions.length} transactions...`);
        const signedTransactions = await signAllTransactions(transactions);

        if (!signedTransactions) {
            throw new Error("Transactions not signed by the user.");
        }

        setSignature(`Sending ${signedTransactions.length} transactions...`);

        const signatures = await Promise.all(
            signedTransactions.map(tx => connection.sendRawTransaction(tx.serialize()))
        );

        setSignature('Confirming transactions...');

        firstSignature = signatures[0];
        if (firstSignature) {
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
            await connection.confirmTransaction({
                signature: firstSignature,
                blockhash,
                lastValidBlockHeight
            }, 'confirmed');
        }

        setSignature(firstSignature);
        return firstSignature;

    } catch (err: any) {
      const friendlyMessage = await getFriendlyErrorMessage(err, connection);
      
      if (friendlyMessage === "SUCCESS_ALREADY_PROCESSED") {
        console.log('The transaction has already been processed, treating as success.');
        // Even without the first signature, treat as success.
        const successSignature = firstSignature || 'confirmed';
        setSignature(successSignature);
        setError(null); // Clear any previous error
        return successSignature;
      }

      setError(friendlyMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = useCallback(() => {
    setError(null);
    setSignature(null);
  }, []);

  return { performAirdrop, isLoading, error, signature, reset };
};
