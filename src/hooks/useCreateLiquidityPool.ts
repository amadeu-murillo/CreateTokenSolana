import { useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { useRouter } from 'next/navigation';

interface CreateLiquidityPoolData {
    baseMint: string;
    baseAmount: number;
    quoteAmount: number;
    binStep: number;
}

function getFriendlyErrorMessage(error: any): string {
    const message = error.message || String(error);
    console.error("Create Liquidity Pool error:", error);

    if (message.includes("User rejected the request")) {
        return "Transação rejeitada pelo utilizador na carteira.";
    }
    if (message.includes("insufficient lamports")) {
        return "Você não possui SOL suficiente para cobrir o valor da liquidez e as taxas de rede.";
    }
    if (message.includes("Transaction simulation failed")) {
        return "A simulação da transação falhou. Verifique se o pool já não existe ou se os saldos são suficientes.";
    }
    if (message.includes("blockhash")) {
        return "O blockhash da transação expirou. Por favor, tente novamente.";
    }
     if (message.includes("0x1775")) { // Pool already exists
        return "Este pool de liquidez já existe. Você pode adicionar mais liquidez diretamente em DEXs como a Meteora.";
    }

    return "Ocorreu um erro ao criar o pool de liquidez. Verifique o console para mais detalhes.";
}

export const useCreateLiquidityPool = () => {
    const router = useRouter();
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const createLiquidityPool = useCallback(async (data: CreateLiquidityPoolData) => {
        if (!publicKey || !sendTransaction) {
            setError("Carteira não conectada.");
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/add-liquidity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    wallet: publicKey.toBase58(),
                    quoteMint: 'So11111111111111111111111111111111111111112' // Endereço do Wrapped SOL
                })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Falha ao preparar a transação no servidor.');
            }

            const transactionBuffer = Buffer.from(result.transaction, 'base64');
            const transaction = VersionedTransaction.deserialize(transactionBuffer);
            
            const signature = await sendTransaction(transaction, connection);
            
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            }, 'confirmed');

            router.push(`/confirmation?status=success&lpAddress=${result.poolAddress}&txId=${signature}`);
            return { signature, poolAddress: result.poolAddress };

        } catch (err: any) {
            const friendlyMessage = getFriendlyErrorMessage(err);
            setError(friendlyMessage);
            router.push(`/confirmation?status=error&error=${encodeURIComponent(friendlyMessage)}`);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [publicKey, connection, sendTransaction, router]);

    const reset = useCallback(() => {
        setError(null);
    }, []);

    return { createLiquidityPool, isLoading, error, reset };
};
