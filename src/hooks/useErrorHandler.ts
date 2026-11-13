import { SendTransactionError } from "@solana/web3.js";

/**
 * Translates technical Solana RPC, simulation, and wallet adapter errors into clear, actionable English messages.
 */
export function parseSolanaError(
  error: unknown,
  defaultContext = "process the transaction"
): string {
  console.error(`[Solana Error - ${defaultContext}]:`, error);

  if (error instanceof SendTransactionError && error.logs) {
    if (error.logs.some((log) => log.includes("insufficient lamports"))) {
      return "Insufficient SOL balance to cover network fees, account rent, and service fee.";
    }
    if (error.logs.some((log) => log.includes("already in use"))) {
      return "This account or Liquidity Pool has already been initialized on the blockchain.";
    }
  }

  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes("User rejected the request") ||
    message.includes("User denied") ||
    message.includes("rejected")
  ) {
    return "Transaction rejected by the user in the wallet.";
  }

  if (message.includes("This transaction has already been processed")) {
    return "SUCCESS_ALREADY_PROCESSED";
  }

  if (message.includes("AccountNotFound")) {
    return "Transaction simulation failed (AccountNotFound): please ensure you have at least 0.15 SOL in your wallet to cover network rent and fees.";
  }

  if (message.includes("insufficient lamports") || message.includes("not enough SOL")) {
    return "Insufficient SOL balance to cover network and service fees.";
  }

  if (message.includes("insufficient funds")) {
    return "Insufficient token balance in your wallet to complete this operation.";
  }

  if (message.includes("blockhash")) {
    return "Transaction blockhash expired. Please try again.";
  }

  if (message.includes("Transaction simulation failed")) {
    return "Transaction simulation failed: please verify your SOL/token balances and account permissions.";
  }

  return message || `An unexpected error occurred while trying to ${defaultContext}.`;
}
