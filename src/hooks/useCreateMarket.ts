// src/hooks/useCreateMarket.ts
import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';

export const useCreateMarket = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createMarket = async (baseMint: string, quoteMint: string, baseDecimals: number): Promise<string | null> => {
        if (!publicKey) {
            setError("Wallet not connected");
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/create-market', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    baseMint,
                    quoteMint,
                    baseDecimals,
                    wallet: publicKey.toBase58(),
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to create market transaction");

            const transaction = Transaction.from(Buffer.from(data.transaction, 'base64'));
            const signature = await sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature, 'confirmed');

            return data.marketId;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return { createMarket, isLoading, error };
};