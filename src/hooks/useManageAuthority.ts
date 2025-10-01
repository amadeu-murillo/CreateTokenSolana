import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";

// Função de tratamento de erro aprimorada e padronizada
function getFriendlyErrorMessage(error: any): string {
    const message = error.message || String(error);
    console.error("Manage authority error:", error);

    if (message.includes("User rejected the request")) {
        return "Transação rejeitada pelo usuário na carteira.";
    }
    if (message.includes("not enough SOL")) {
        return "Falha na transação. Verifique se você possui SOL suficiente para as taxas.";
    }
    if (message.includes("Transaction simulation failed")) {
        return "A simulação da transação falhou. Verifique se você ainda possui a autoridade sobre este token.";
    }
    if (message.includes("blockhash")) {
        return "O blockhash da transação expirou. Por favor, tente novamente.";
    }
    return "Ocorreu um erro ao remover a autoridade. Verifique o console para mais detalhes.";
}

export const useManageAuthority = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const manageAuthority = async (mint: string, authorityType: 'mint' | 'freeze', programId: string) => {
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
