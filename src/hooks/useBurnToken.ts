import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useRouter } from "next/navigation";

// Função de tratamento de erro aprimorada e padronizada
function getFriendlyErrorMessage(error: any): string {
    const message = error.message || String(error);
    console.error("Burn token error:", error);

    if (message.includes("User rejected the request")) {
        return "Transação rejeitada pelo usuário na carteira.";
    }
    if (message.includes("insufficient lamports")) {
        return "Você não possui SOL suficiente para cobrir as taxas da rede.";
    }
    if (message.includes("not enough SOL")) {
        return "Falha na transação. Verifique se você possui SOL suficiente para as taxas.";
    }
    if (message.includes("Transaction simulation failed")) {
        return "A simulação da transação falhou. Verifique se o endereço do token está correto e se você possui a quantidade a ser queimada.";
    }
    if (message.includes("blockhash")) {
        return "O blockhash da transação expirou. Por favor, tente novamente.";
    }
    return "Ocorreu um erro ao queimar os tokens. Verifique o console para mais detalhes.";
}

export const useBurnToken = () => {
  const router = useRouter();
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const burnToken = async (mint: string, amount: number) => {
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
    setSignature(null);

    try {
      const response = await fetch('/api/burn-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mint, amount, wallet: publicKey.toBase58() }),
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
