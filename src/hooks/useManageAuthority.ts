import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";

// Função de tratamento de erro aprimorada e padronizada
function getFriendlyErrorMessage(error: any): string {
    const message = error.message || String(error);
    console.error("Manage authority error:", error);

    if (message.includes("User rejected the request")) {
        return "Transaction rejected by the user in the wallet.";
    }
    if (message.includes("not enough SOL")) {
        return "Transaction failed. Please check if you have enough SOL for the fees.";
    }
    if (message.includes("Transaction simulation failed")) {
        return "Transaction simulation failed. Please check if you still have authority over this token.";
    }
    if (message.includes("blockhash")) {
        return "The transaction blockhash has expired. Please try again.";
    }
    return "An error occurred while removing the authority. Check the console for more details.";
}

export const useManageAuthority = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const manageAuthority = async (mint: string, authorityType: 'mint' | 'freeze', programId: string) => {
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
      const response = await fetch('/api/manage-authority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mint, authorityType, wallet: publicKey.toBase58(), programId }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      const transactionBuffer = Buffer.from(result.transaction, 'base64');
      const transaction = VersionedTransaction.deserialize(transactionBuffer);
      
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      return signature;

    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { manageAuthority, isLoading, error, reset };
};
