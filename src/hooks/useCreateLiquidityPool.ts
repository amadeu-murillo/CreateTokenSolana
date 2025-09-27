// src/hooks/useCreateLiquidityPool.ts
import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";

function getFriendlyErrorMessage(error: any): string {
    const message = error.message || String(error);
    console.error("Create LP error:", error);

    if (message.includes("User rejected the request")) {
        return "Transação rejeitada pelo usuário na carteira.";
    }
    if (message.includes("not enough SOL")) {
        return "Falha na transação. Verifique se você possui SOL suficiente para as taxas e para a liquidez.";
    }
    if (message.includes("Transaction simulation failed")) {
        return "A simulação da transação falhou. Verifique se o Market ID e o endereço do token estão corretos.";
    }
    if (message.includes("blockhash")) {
        return "O blockhash da transação expirou. Por favor, tente novamente.";
    }
    return "Ocorreu um erro ao criar o pool de liquidez. Verifique o console para mais detalhes.";
}

interface CreateLpData {
    baseMint: string;
    quoteMint: string;
    baseAmount: number;
    quoteAmount: number;
    baseDecimals: number;
}

export const useCreateLiquidityPool = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const createLiquidityPool = async (data: CreateLpData) => {
    if (!publicKey || !sendTransaction) {
      setError("Carteira não conectada.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSignature(null);
    setStatusMessage("Iniciando processo...");

    try {
        // Etapa 1: Criar o mercado
        setStatusMessage("Passo 1: Criando o OpenBook Market...");
        const marketResponse = await fetch('/api/create-market', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                baseMint: data.baseMint,
                quoteMint: NATIVE_MINT.toBase58(),
                baseDecimals: data.baseDecimals,
                wallet: publicKey.toBase58(),
            }),
        });

        const marketResult = await marketResponse.json();
        if (!marketResponse.ok) throw new Error(marketResult.error || "Falha ao criar o mercado");

        const marketTransaction = VersionedTransaction.deserialize(Buffer.from(marketResult.transaction, 'base64'));
        const marketSignature = await sendTransaction(marketTransaction, connection);
        await connection.confirmTransaction(marketSignature, 'confirmed');
        const marketId = marketResult.marketId;

        // Etapa 2: Criar o pool de liquidez
        setStatusMessage("Passo 2: Adicionando liquidez ao pool...");
        const lpResponse = await fetch('/api/create-lp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, marketId, wallet: publicKey.toBase58() }),
        });

        const lpResult = await lpResponse.json();
        if (!lpResponse.ok) throw new Error(lpResult.error || "Falha ao criar o pool de liquidez");

        const lpTransaction = VersionedTransaction.deserialize(Buffer.from(lpResult.transaction, 'base64'));
        const lpSignature = await sendTransaction(lpTransaction, connection);
        await connection.confirmTransaction(lpSignature, 'confirmed');

        setSignature(lpSignature);
        setStatusMessage("Pool de liquidez criado com sucesso!");

    } catch (err: any) {
        const friendlyMessage = getFriendlyErrorMessage(err);
        setError(friendlyMessage);
        setStatusMessage(null);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  return { createLiquidityPool, isLoading, error, signature, statusMessage };
};