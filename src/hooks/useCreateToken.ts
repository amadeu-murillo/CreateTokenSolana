import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import { SERVICE_FEE_CREATE_TOKEN_SOL } from "@/lib/constants";

interface TokenData {
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  imageUrl: string;
  description?: string;
  website?: string;
  twitter?: string;
  instagram?: string;
  mintAuthority: boolean;
  freezeAuthority: boolean;
  tokenStandard: 'spl' | 'token-2022';
  transferFee: {
      basisPoints: number;
      maxFee: number;
  };
  isMetadataMutable: boolean;
}

/**
 * Translates technical blockchain errors into user-friendly messages.
 * @param error The error object caught during the transaction process.
 * @returns A user-friendly error string.
 */
function getFriendlyErrorMessage(error: any): string {
    // Log the original and complete error for advanced debugging.
    console.error("Original Error from Wallet:", error);
    
    const message = error.message || String(error);

    // Specifically check for "AccountNotFound" in simulation errors.
    // This is the most common error and is usually due to insufficient SOL.
    if (message.includes("AccountNotFound")) {
        return "Transaction simulation failed. This is often caused by insufficient SOL in your wallet to pay for transaction fees and account rent. Please ensure you have at least 0.2 SOL and try again.";
    }

    if (error.logs) {
        console.error("Simulation Logs:", error.logs);
        return `Transaction simulation failed. Check the browser console for technical details. Message: ${message}`;
    }

    if (message.includes("User rejected the request")) {
        return "Transaction rejected by the user in the wallet.";
    }
    if (message.includes("insufficient lamports")) {
        return "You do not have enough SOL to cover network fees.";
    }
    if (message.includes("not enough SOL")) {
        return "Transaction failed. Make sure you have enough SOL for costs.";
    }
    if (message.includes("Token symbol already in use")) {
        return "This symbol is already in use. Please choose another.";
    }
    if (message.includes("Transaction simulation failed")) {
        return `Transaction simulation failed: ${message}. This may be an issue with token data or a temporary network problem.`;
    }
    if (message.includes("blockhash")) {
        return "The transaction blockhash has expired. Please try again.";
    }

    return `An unexpected error occurred: ${message}. Check the console for more details.`;
}

export const useCreateToken = () => {
  const router = useRouter();
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createToken = async (tokenData: TokenData) => {
    if (!publicKey || !sendTransaction) {
      const errorMessage = "Wallet not connected. Please connect your wallet to continue.";
      setError(errorMessage);
      alert(errorMessage); // Using alert as a fallback for critical connection issues.
      return null;
    }

    if (!connection) {
        const errorMessage = "Connection to the Solana network was not established.";
        setError(errorMessage);
        alert(errorMessage);
        return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const affiliateRef = localStorage.getItem('affiliateRef');

      const apiPayload = { 
          ...tokenData, 
          wallet: publicKey.toBase58(),
          affiliate: affiliateRef
      };

      console.log("Sending to API /api/create-token:", apiPayload);

      const response = await fetch('/api/create-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });

      const result = await response.json();
      console.log("Received from API /api/create-token:", result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to prepare the transaction on the server.');
      }
      
      const transactionBuffer = Buffer.from(result.transaction, 'base64');
      const transaction = VersionedTransaction.deserialize(transactionBuffer);
      
      console.log("Transaction deserialized. Starting simulation...", transaction);

      // **Transaction simulation to obtain detailed error logs**
      const simulationResult = await connection.simulateTransaction(transaction, { commitment: "confirmed" });
      if (simulationResult.value.err) {
        console.error("Transaction simulation failed:", simulationResult.value.err);
        console.error("Simulation logs:", simulationResult.value.logs);
        // MODIFICATION: Pass the specific error from the simulation into the thrown Error.
        const simulationError = simulationResult.value.err;
        throw new Error(`Transaction simulation failed: ${JSON.stringify(simulationError)}. Logs: ${JSON.stringify(simulationResult.value.logs)}`);
      }
      
      console.log("Simulation successful. Sending transaction to wallet...");
      const signature = await sendTransaction(transaction, connection);
      console.log(`Transaction sent with signature: ${signature}`);

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');
      console.log('Transaction confirmed!');

      // Record commission in Firebase if an affiliate was involved
      if (affiliateRef && affiliateRef !== publicKey.toBase58()) {
        (async () => {
          try {
            const commissionResponse = await fetch('/api/record-commission', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                affiliateWallet: affiliateRef,
                commissionAmountSOL: SERVICE_FEE_CREATE_TOKEN_SOL * 0.10,
                transactionSignature: signature,
                tokenCreatorWallet: publicKey.toBase58(),
                mintAddress: result.mintAddress,
              }),
            });

            if (!commissionResponse.ok) {
              const errorData = await commissionResponse.json();
              throw new Error(errorData.error || 'Unknown error recording commission');
            }

            const commissionResult = await commissionResponse.json();
            console.log('Commission recorded successfully:', commissionResult);
          } catch (firebaseError) {
            console.error("Failed to record commission in Firebase:", firebaseError);
          }
        })();
      }

      router.push(`/confirmation?status=success&tokenAddress=${result.mintAddress}&txId=${signature}`);
      return { signature, mintAddress: result.mintAddress };

    } catch (err: any) {
      const friendlyMessage = getFriendlyErrorMessage(err);
      setError(friendlyMessage);
      router.push(`/confirmation?status=error&error=${encodeURIComponent(friendlyMessage)}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createToken, isLoading, error };
};
