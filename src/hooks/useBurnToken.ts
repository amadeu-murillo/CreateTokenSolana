import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { useRouter } from "next/navigation";

// Função genérica para tratar erros de transação
function getFriendlyErrorMessage(error: any): string {
    const message = error.message || String(error);

    if (message.includes("User rejected the request")) {
        return "Transação rejeitada pelo usuário na carteira.";
    }
    if (message.includes("not enough SOL")) {
        return "Falha na transação. Verifique se você possui SOL suficiente para os custos.";
    }
    // Adicione mais tratamentos de erro conforme necessário
    return "Ocorreu um erro. Por favor, tente novamente.";
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
      return;
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
      const transaction = Transaction.from(transactionBuffer);
      
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

  return { burnToken, isLoading, error, signature };
};
