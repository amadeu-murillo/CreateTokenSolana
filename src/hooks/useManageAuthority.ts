import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js"; // MODIFICAÇÃO

function getFriendlyErrorMessage(error: any): string {
    const message = error.message || String(error);
    if (message.includes("User rejected the request")) {
        return "Transação rejeitada pelo usuário.";
    }
    return "Ocorreu um erro ao tentar remover a autoridade.";
}

export const useManageAuthority = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const manageAuthority = async (mint: string, authorityType: 'mint' | 'freeze') => {
    if (!publicKey || !sendTransaction) {
      setError("Carteira não conectada.");
      return null;
    }
    if (!connection) {
        setError("A conexão com a rede Solana não foi estabelecida.");
        return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/manage-authority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mint, authorityType, wallet: publicKey.toBase58() }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      const transactionBuffer = Buffer.from(result.transaction, 'base64');
       // MODIFICAÇÃO: Desserializando como VersionedTransaction
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

  return { manageAuthority, isLoading, error };
};
