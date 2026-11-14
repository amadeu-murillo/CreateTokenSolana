import { useState, useCallback } from "react";
import { SendTransactionError } from "@solana/web3.js";

/**
 * Mapa de erros amigáveis da Solana e carteiras Web3 (Phantom / Solflare).
 * Intercepta falhas técnicas de RPC, simulação e assinatura e retorna strings claras para o usuário.
 */
export function parseSolanaError(
  error: unknown,
  defaultContext = "processar a transação"
): string {
  console.error(`[Solana Error - ${defaultContext}]:`, error);

  const rawMessage = error instanceof Error ? error.message : String(error ?? "");
  const logsJoined =
    error instanceof SendTransactionError && Array.isArray(error.logs)
      ? error.logs.join(" ")
      : "";
  const combined = `${rawMessage} ${logsJoined}`;
  const lower = combined.toLowerCase();

  if (combined.includes("This transaction has already been processed")) {
    return "SUCCESS_ALREADY_PROCESSED";
  }

  // 1. User rejected signature in wallet
  if (
    combined.includes("User rejected") ||
    lower.includes("user rejected") ||
    lower.includes("user denied") ||
    lower.includes("transaction cancelled") ||
    lower.includes("4001")
  ) {
    return "Transação cancelada na carteira.";
  }

  // 2. Insufficient funds or hex equivalent (0x1 / custom program error 0x1 / insufficient lamports)
  if (
    lower.includes("insufficient funds") ||
    lower.includes("insufficient lamports") ||
    lower.includes("insufficient sol") ||
    lower.includes("0x1") ||
    combined.includes('"Custom":1}')
  ) {
    return "Saldo insuficiente para cobrir a transação e as taxas.";
  }

  // 3. Blockhash expired or not found
  if (
    lower.includes("blockhash not found") ||
    lower.includes("blockhashnotfound") ||
    lower.includes("block height exceeded") ||
    lower.includes("blockhash")
  ) {
    return "A rede demorou a responder. Tente novamente.";
  }

  if (combined.includes("AccountNotFound")) {
    return "Conta não encontrada na rede selecionada. Verifique se sua carteira possui SOL na rede ativa (Mainnet ou Devnet).";
  }

  if (lower.includes("already in use")) {
    return "Esta conta ou Pool de Liquidez já foi inicializada na blockchain.";
  }

  return rawMessage || `Ocorreu um erro inesperado ao tentar ${defaultContext}.`;
}

export function useErrorHandler() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleError = useCallback((error: unknown, context?: string): string => {
    const friendly = parseSolanaError(error, context);
    setErrorMessage(friendly);
    return friendly;
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    errorMessage,
    handleError,
    clearError,
  };
}
