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
        return "Transação rejeitada pelo utilizador na carteira.";
    }
    // Erro de saldo insuficiente para rent
    if (message.includes("insufficient lamports")) {
        return "Você não possui SOL suficiente para cobrir as taxas da rede.";
    }
    if (message.includes("not enough SOL")) {
        return "Falha na transação. Verifique se possui SOL suficiente para os custos.";
    }
    // Exemplo de erro de símbolo (simulado, a lógica real pode estar no backend)
    if (message.includes("Token symbol already in use")) {
        return "Este símbolo já foi utilizado. Por favor, escolha outro.";
    }
    if (message.includes("Transaction simulation failed")) {
        return "A simulação da transação falhou. Isto pode ser um problema temporário na rede ou dados inválidos.";
    }
     if (message.includes("blockhash")) {
        return "O blockhash da transação expirou. Por favor, tente novamente.";
    }

    return "Ocorreu um erro ao criar o token. Verifique o console para mais detalhes.";
}

export const useCreateToken = () => {
  const router = useRouter();
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createToken = async (tokenData: TokenData) => {
    if (!publicKey || !sendTransaction) {
      const errorMessage = "Carteira não conectada. Por favor, conecte a sua carteira para continuar.";
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