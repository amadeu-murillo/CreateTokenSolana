import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

interface TokenData {
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  imageUrl: string;
}

export const useCreateToken = () => {
  const { publicKey, sendTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createToken = async (tokenData: TokenData) => {
    if (!publicKey) {
      setError("Carteira não conectada");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/create-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...tokenData, wallet: publicKey.toBase58() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao criar o token');
      }
      
      // Lógica para assinar e enviar a transação seria aqui
      // const transaction = Transaction.from(Buffer.from(result.transaction, 'base64'));
      // const signature = await sendTransaction(transaction, connection);
      // await connection.confirmTransaction(signature, 'processed');

      return result;
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro desconhecido");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createToken, isLoading, error };
};
