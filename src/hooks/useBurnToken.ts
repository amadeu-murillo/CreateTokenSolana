import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";

// Função de tratamento de erro aprimorada e padronizada
function getFriendlyErrorMessage(error: any): string {
    const message = error.message || String(error);
    console.error("Burn token error:", error);

    if (message.includes("User rejected the request")) {
        return "Transaction rejected by the user in the wallet.";
    }
    if (message.includes("insufficient lamports")) {
        return "You don't have enough SOL to cover the network fees.";
    }
    if (message.includes("not enough SOL")) {
        return "Transaction failed. Please check if you have enough SOL for fees.";
    }
    if (message.includes("Transaction simulation failed")) {
        return "Transaction simulation failed. Check if the token address is correct and if you have the amount to burn.";
    }
    if (message.includes("blockhash")) {
        return "The transaction blockhash has expired. Please try again.";
    }
    return "An error occurred while burning tokens. Check the console for more details.";
}

export const useBurnToken = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const burnToken = async (mint: string, amount: number, programId: string) => {
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

    try {
      const response = await fetch('/api/burn-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mint, amount, wallet: publicKey.toBase58(), programId }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      const transactionBuffer = Buffer.from(result.transaction, 'base64');
      const transaction = VersionedTransaction.deserialize(transactionBuffer);
      
      const sig = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(sig, 'confirmed');

      setSignature(sig);
      return sig;
      
    } catch (err: any) {
      const friendlyMessage = getFriendlyErrorMessage(err);
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

  return { burnToken, isLoading, error, signature, reset };
};
