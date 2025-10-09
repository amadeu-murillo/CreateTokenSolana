import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useRouter } from "next/navigation";

interface TokenData {
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  imageUrl: string;
  mintAuthority: boolean;
  freezeAuthority: boolean;
  tokenStandard: 'spl' | 'token-2022';
  transferFee: {
      basisPoints: number;
      maxFee: number;
  };
  isMetadataMutable: boolean;
}

function getFriendlyErrorMessage(error: any): string {
    const message = error.message || String(error);
    console.error("Create token error:", error);

    if (message.includes("User rejected the request")) {
        return "Transaction rejected by the user in the wallet.";
    }
    // Erro de saldo insuficiente para rent
    if (message.includes("insufficient lamports")) {
        return "You don't have enough SOL to cover the network fees.";
    }
    if (message.includes("not enough SOL")) {
        return "Transaction failed. Please check if you have enough SOL for the costs.";
    }
    // Exemplo de erro de símbolo (simulado, a lógica real pode estar no backend)
    if (message.includes("Token symbol already in use")) {
        return "This symbol is already in use. Please choose another one.";
    }
    if (message.includes("Transaction simulation failed")) {
        return "Transaction simulation failed. This may be a temporary network issue or invalid data.";
    }
     if (message.includes("blockhash")) {
        return "The transaction blockhash has expired. Please try again.";
    }

    return "An error occurred while creating the token. Check the console for more details.";
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
      alert(errorMessage);
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
      // Passo 3: Ler a referência do localStorage
      const affiliateRef = localStorage.getItem('affiliateRef');

      const response = await fetch('/api/create-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...tokenData, 
          wallet: publicKey.toBase58(),
          affiliate: affiliateRef // Enviar a referência para o backend
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to prepare the transaction on the server.');
      }
      
      const transactionBuffer = Buffer.from(result.transaction, 'base64');
      const transaction = VersionedTransaction.deserialize(transactionBuffer);
      
      const signature = await sendTransaction(transaction, connection);
      console.log(`Transaction sent with signature: ${signature}`);

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');
      console.log('Transaction confirmed!');

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
