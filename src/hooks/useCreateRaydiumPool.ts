// src/hooks/useCreateRaydiumPool.ts
import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";

function getFriendlyErrorMessage(error: any): string {
    const message = error.message || String(error);
    console.error("Create Raydium Pool error:", error);

    if (message.includes("User rejected the request")) {
        return "Transação rejeitada pelo usuário na carteira.";
    }
    if (message.includes("not enough SOL")) {
        return "Falha na transação. Verifique se possui SOL suficiente para as taxas e para a liquidez.";
    }
    if (message.includes("Transaction simulation failed")) {
        return "A simulação da transação falhou. Verifique os dados e o saldo dos tokens e tente novamente.";
    }
    if (message.includes("blockhash")) {
        return "O blockhash da transação expirou. Por favor, tente novamente.";
    }
    return "Ocorreu um erro ao criar o pool de liquidez. Verifique o console para mais detalhes.";
}

interface CreateRaydiumData {
    baseMint: string;
    quoteMint: string;
    baseAmount: string;
    quoteAmount: string;
    baseDecimals: number;
}

export const useCreateRaydiumPool = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const createRaydiumPool = async (data: CreateRaydiumData) => {
    if (!publicKey || !sendTransaction) {
      setError("Carteira não conectada.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSignature(null);
    setStatusMessage("Preparando a transação para o pool da Raydium...");

    try {
        const response = await fetch('/api/create-raydium-pool', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, wallet: publicKey.toBase58() }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Falha ao criar o pool de liquidez na Raydium");

        const transaction = VersionedTransaction.deserialize(Buffer.from(result.transaction, 'base64'));

        setStatusMessage("Aguardando aprovação da transação na sua carteira...");
        const txSignature = await sendTransaction(transaction, connection);
        
        setStatusMessage("Confirmando a transação na blockchain...");
        await connection.confirmTransaction(txSignature, 'confirmed');

        setSignature(txSignature);
        setStatusMessage("Pool de liquidez criado com sucesso!");

    } catch (err: any) {
        const friendlyMessage = getFriendlyErrorMessage(err);
        setError(friendlyMessage);
        setStatusMessage(null);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };
  
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setSignature(null);
    setStatusMessage(null);
  }, []);

  return { createRaydiumPool, isLoading, error, signature, statusMessage, reset };
};
