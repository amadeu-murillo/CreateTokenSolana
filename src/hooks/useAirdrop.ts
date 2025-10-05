import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction, SendTransactionError } from "@solana/web3.js";

// Função de tratamento de erro aprimorada
async function getFriendlyErrorMessage(error: any, connection: any): Promise<string> {
    const message = error.message || String(error);
    console.error("Airdrop error:", error);

    if (error instanceof SendTransactionError) {
        const logs = await error.getLogs(connection);
        if (logs && logs.some(log => log.includes("insufficient lamports"))) {
             return "Você não possui SOL suficiente para cobrir as taxas da rede e do serviço.";
        }
    }

    if (message.includes("User rejected the request")) {
        return "Transação rejeitada pelo usuário na carteira.";
    }
    if (message.includes("insufficient lamports")) {
        return "Você não possui SOL suficiente para cobrir as taxas da rede e do serviço.";
    }
    if (message.includes("Transaction simulation failed")) {
         if (message.includes("already been processed")) {
            return "Esta transação já foi processada. Se o erro persistir, atualize a página.";
        }
        return "A simulação da transação falhou. Verifique os endereços e se você possui saldo suficiente.";
    }
    if (message.includes("blockhash")) {
        return "O blockhash da transação expirou. Por favor, tente novamente.";
    }
    return "Ocorreu um erro durante o airdrop. Verifique o console para mais detalhes.";
}


interface Recipient {
    address: string;
    amount: number;
}

export const useAirdrop = () => {
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const performAirdrop = async (mint: string, recipients: Recipient[], programId: string) => {
    if (!publicKey || !sendTransaction || !signAllTransactions) {
      setError("Carteira não conectada ou não suporta múltiplas transações.");
      return;
    }
    if (!connection) {
        setError("A conexão com a rede Solana não foi estabelecida.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setSignature(null);

    try {
        const BATCH_SIZE = 10;
        const recipientChunks: Recipient[][] = [];
        for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
            recipientChunks.push(recipients.slice(i, i + BATCH_SIZE));
        }

        const transactions: VersionedTransaction[] = [];
        
        for (let i = 0; i < recipientChunks.length; i++) {
             setSignature(`Preparando transação ${i + 1} de ${recipientChunks.length}...`);
             const chunk = recipientChunks[i];
             const response = await fetch('/api/airdrop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mint, recipients: chunk, wallet: publicKey.toBase58(), programId }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || `Falha na API para o lote ${i+1}.`);
            
            const transactionBuffer = Buffer.from(result.transaction, 'base64');
            transactions.push(VersionedTransaction.deserialize(transactionBuffer));
        }

        setSignature(`Aguardando aprovação para ${transactions.length} transações...`);
        const signedTransactions = await signAllTransactions(transactions);

        let firstSignature: string | null = null;
        for (let i = 0; i < signedTransactions.length; i++) {
            const signedTx = signedTransactions[i];
            setSignature(`Enviando transação ${i + 1} de ${signedTransactions.length}...`);
            const sig = await connection.sendRawTransaction(signedTx.serialize());
            await connection.confirmTransaction(sig, 'confirmed');
            if (!firstSignature) {
                firstSignature = sig;
            }
        }

        setSignature(firstSignature);
        return firstSignature;

    } catch (err: any) {
      const friendlyMessage = await getFriendlyErrorMessage(err, connection);
      setError(friendlyMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = useCallback(() => {
    setError(null);
    setSignature(null);
  }, []);

  return { performAirdrop, isLoading, error, signature, reset };
};

