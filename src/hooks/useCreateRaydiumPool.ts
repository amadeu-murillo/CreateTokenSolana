import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";

export interface CreateRaydiumPoolParams {
  baseMint: string;
  baseAmount: string;
  quoteAmount: string;
  baseDecimals: number;
  baseProgramId: string;
}

function getFriendlyErrorMessage(error: any): string {
    const message = error.message || String(error);
    console.error("Create pool error:", error);

    if (message.includes("User rejected the request")) {
        return "Transação rejeitada pelo usuário na carteira.";
    }
    if (message.includes("insufficient lamports") || message.includes("not enough SOL")) {
        return "Falha na transação. Verifique se você possui SOL suficiente para a liquidez e as taxas.";
    }
    if (message.includes("Transaction simulation failed")) {
        return "A simulação da transação falhou. Verifique os valores e se você possui os tokens necessários.";
    }
    if (message.includes("blockhash")) {
        return "O blockhash da transação expirou. Por favor, tente novamente.";
    }
    return "Ocorreu um erro ao criar o pool. Verifique o console para mais detalhes.";
}

export function useCreateRaydiumPool() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const createRaydiumPool = async (params: CreateRaydiumPoolParams & { baseProgramId: string | any }) => {
    if (!publicKey || !sendTransaction) {
        setError("Carteira não conectada.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setSignature(null);
    setStatusMessage("A preparar a transação...");

    try {
      // força `programId` para string
      const safeParams = {
        ...params,
        wallet: publicKey.toBase58(),
        baseProgramId: typeof params.baseProgramId === "string" ? params.baseProgramId : params.baseProgramId.toBase58(),
      };

      const response = await fetch("/api/create-raydium-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(safeParams),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Falha ao criar a transação no servidor.");
      }
      
      setStatusMessage("Por favor, aprove as transações na sua carteira...");

      const transactionBuffer = Buffer.from(result.transaction, 'base64');
      const transaction = VersionedTransaction.deserialize(transactionBuffer);
      
      const sig = await sendTransaction(transaction, connection);

      setStatusMessage("A confirmar transação...");
      await connection.confirmTransaction(sig, 'confirmed');

      setSignature(sig);
      setStatusMessage("Pool criado com sucesso!");
    } catch (e: any) {
      const friendlyMessage = getFriendlyErrorMessage(e);
      setError(friendlyMessage);
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsLoading(false);
    setError(null);
    setSignature(null);
    setStatusMessage(null);
  };

  return { createRaydiumPool, isLoading, error, signature, statusMessage, reset };
}
