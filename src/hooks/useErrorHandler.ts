import { useState, useCallback } from "react";
import { SendTransactionError } from "@solana/web3.js";

/**
 * Mapa de erros amigáveis da Solana e carteiras Web3 (Phantom / Solflare).
 * Distingue claramente entre falta de SOL para taxas/rent e falta de saldo de Token na ATA.
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

  // If the server already returned a detailed Portuguese or explicit diagnostic message, preserve it verbatim
  if (
    rawMessage.startsWith("Saldo de SOL insuficiente") ||
    rawMessage.startsWith("Quantidade de tokens insuficiente") ||
    rawMessage.startsWith("Sua carteira não possui saldo") ||
    rawMessage.startsWith("O contrato do token") ||
    rawMessage.startsWith("Insufficient SOL balance on") ||
    rawMessage.startsWith("Insufficient token balance")
  ) {
    return rawMessage;
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

  // 2. SPL Token Error: Insufficient token units in ATA (TokenError::InsufficientFunds)
  if (
    combined.includes("Error: insufficient funds") &&
    (combined.includes("Tokenkeg") || combined.includes("TokenzQd"))
  ) {
    return "Saldo insuficiente do token selecionado na carteira para realizar esta operação. Clique em Atualizar Carteira e tente novamente.";
  }

  // 3. SystemProgram: Insufficient SOL lamports for transfer or rent
  if (
    lower.includes("insufficient lamports") ||
    lower.includes("insufficientfundsforfee") ||
    lower.includes("insufficientfundsforrent") ||
    lower.includes("resultwithnegativelamports")
  ) {
    return "Saldo de SOL insuficiente na rede selecionada para cobrir a taxa e o aluguel de conta. Verifique se sua carteira (Phantom/Solflare) está na mesma rede selecionada no topo da página (Mainnet ou Devnet).";
  }

  // 4. Blockhash expired or not found
  if (
    lower.includes("blockhash not found") ||
    lower.includes("blockhashnotfound") ||
    lower.includes("block height exceeded")
  ) {
    return "A rede demorou a responder (blockhash expirado). Tente novamente.";
  }

  if (combined.includes("AccountNotFound")) {
    return "Conta não encontrada na rede selecionada. Verifique se sua carteira possui SOL na rede ativa (Mainnet ou Devnet — e não em Testnet).";
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
