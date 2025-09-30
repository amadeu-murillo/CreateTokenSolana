import { useState } from "react";

export interface CreateRaydiumPoolParams {
  wallet: string;
  baseMint: string;
  baseAmount: string;
  quoteAmount: string;
  baseDecimals: number;
  baseProgramId: string;
}

export function useCreateRaydiumPool() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const createRaydiumPool = async (params: CreateRaydiumPoolParams) => {
    setIsLoading(true);
    setError(null);
    setStatusMessage("Enviando transação...");
    try {
      const response = await fetch("/api/create-raydium-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const result = await response.json();
      if (result.error) {
        setError(result.error);
        setStatusMessage("Erro ao criar pool.");
      } else {
        setSignature(result.transaction ?? "");
        setStatusMessage("Pool criada com sucesso!");
      }
    } catch (e: any) {
      setError(e.message);
      setStatusMessage("Erro inesperado.");
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