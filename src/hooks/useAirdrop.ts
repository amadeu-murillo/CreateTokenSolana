import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";

// Função de tratamento de erro aprimorada e padronizada
function getFriendlyErrorMessage(error: any): string {
    const message = error.message || String(error);
    console.error("Airdrop error:", error);

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
        return "A simulação da transação falhou. Verifique os endereços dos destinatários e se você possui os tokens.";
    }
    if (message.includes("blockhash")) {
        return "O blockhash da transação expirou. Por favor, tente novamente.";
    }
    return "Ocorreu um erro durante o airdrop. Verifique o console para mais detalhes.";
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