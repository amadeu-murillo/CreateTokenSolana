import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js"; // MODIFICAÇÃO
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

    if (message.includes("User rejected the request")) {
        return "Transação rejeitada pelo usuário na carteira.";
    }
    if (message.includes("not enough SOL")) {
        return "Falha na transação. Verifique se você possui SOL suficiente para os custos.";
    }
    if (message.includes("Transaction simulation failed")) {
        return "A simulação da transação falhou. Isto pode ser um problema temporário na rede.";
    }
     if (message.includes("blockhash")) {
        return "O blockhash da transação expirou. Por favor, tente novamente.";
    }

    return message;
}

export const useCreateToken = () => {
  const router = useRouter();
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createToken = async (tokenData: TokenData) => {
    if (!publicKey || !sendTransaction) {
      const errorMessage = "Carteira não conectada. Por favor, conecte sua carteira para continuar.";
      setError(errorMessage);
      alert(errorMessage);
      return null;
    }

    if (!connection) {
        const errorMessage = "A conexão com a rede Solana não foi estabelecida.";
        setError(errorMessage);
        alert(errorMessage);
        return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/create-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tokenData, wallet: publicKey.toBase58() }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Falha ao preparar a transação no servidor.');
      }
      
      const transactionBuffer = Buffer.from(result.transaction, 'base64');
      // MODIFICAÇÃO: Desserializando como VersionedTransaction
      const transaction = VersionedTransaction.deserialize(transactionBuffer);
      
      const signature = await sendTransaction(transaction, connection);
      console.log(`Transação enviada com a assinatura: ${signature}`);

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');
      console.log('Transação confirmada!');

      router.push(`/confirmation?status=success&tokenAddress=${result.mintAddress}&txId=${signature}`);
      return { signature, mintAddress: result.mintAddress };

    } catch (err: any) {
      console.error("Erro no processo de criação do token:", err);
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
