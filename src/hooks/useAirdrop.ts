import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js"; // MODIFICAÇÃO

function getFriendlyErrorMessage(error: any): string {
    const message = error.message || String(error);
    if (message.includes("User rejected the request")) {
        return "Transação rejeitada pelo usuário na carteira.";
    }
    return "Ocorreu um erro durante o airdrop.";
}

interface Recipient {
    address: string;
    amount: number;
}

export const useAirdrop = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const performAirdrop = async (mint: string, recipients: Recipient[]) => {
    if (!publicKey || !sendTransaction) {
      setError("Carteira não conectada.");
      return;
    }
    if (!connection) {
        setError("A conexão com a rede Solana não foi estabelecida.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setSignature(null);

    try {
      const response = await fetch('/api/airdrop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mint, recipients, wallet: publicKey.toBase58() }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      const transactionBuffer = Buffer.from(result.transaction, 'base64');
      // MODIFICAÇÃO: Desserializando como VersionedTransaction
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

  return { performAirdrop, isLoading, error, signature };
};
