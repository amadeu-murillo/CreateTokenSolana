import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { useRouter } from "next/navigation";

interface TokenData {
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  imageUrl: string; 
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

    setIsLoading(true);
    setError(null);

    try {
      // 1. Chamar o backend para obter a transação a ser assinada
      const response = await fetch('/api/create-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...tokenData, wallet: publicKey.toBase58() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao preparar a transação no servidor.');
      }

      // 2. Desserializar a transação recebida do backend
      const transactionBuffer = Buffer.from(result.transaction, 'base64');
      const transaction = Transaction.from(transactionBuffer);
      
      // 3. Usar o 'sendTransaction' do adapter para o usuário assinar e enviar
      const signature = await sendTransaction(transaction, connection);
      console.log(`Transação enviada com a assinatura: ${signature}`);

      // 4. Aguardar a confirmação da transação na blockchain
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');
      console.log('Transação confirmada!');

      // 5. Redirecionar para a página de confirmação com sucesso
      router.push(`/confirmation?status=success&tokenAddress=${result.mintAddress}&txId=${signature}`);

      return { signature, mintAddress: result.mintAddress };

    } catch (err: any) {
      console.error("Erro no processo de criação do token:", err);
      const errorMessage = err.message || "Ocorreu um erro desconhecido durante a criação do token.";
      setError(errorMessage);
      // 6. Redirecionar para a página de confirmação com erro
      router.push(`/confirmation?status=error&error=${encodeURIComponent(errorMessage)}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createToken, isLoading, error };
};
