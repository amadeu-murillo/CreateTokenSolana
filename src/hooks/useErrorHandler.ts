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
    return "Transaction simulation failed (AccountNotFound): please ensure your wallet holds SOL on the selected network (Mainnet-Beta or Devnet).";
  }

  if (
    message.includes("insufficient lamports") ||
    message.includes("not enough SOL") ||
    message.includes('"Custom":1}')
  ) {
    return "Insufficient SOL balance in your wallet to cover the service fee, liquidity deposit, and Solana account rent.";
  }

  if (message.includes("insufficient funds")) {
    return "Insufficient token balance in your wallet to complete this operation.";
  }

  if (message.includes("blockhash") || message.includes("BlockhashNotFound")) {
    return "Transaction blockhash expired. Please click the button again to generate a fresh blockhash.";
  }

  return message || `An unexpected error occurred while trying to ${defaultContext}.`;
}
