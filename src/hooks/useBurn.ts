import { useMutation } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";

// Parâmetros para a nossa chamada de API
interface BurnTokenParams {
    tokenAddress: string;
    amount: number;
    wallet: PublicKey;
}

// Função que faz a chamada para o endpoint da API
const burnTokenApi = async ({ tokenAddress, amount, wallet }: BurnTokenParams) => {
    const response = await fetch('/api/burn-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            tokenAddress,
            amount,
            wallet: wallet.toBase58(), // A API espera a chave da carteira como string
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        // A mensagem de erro será mais amigável para o utilizador
        throw new Error(getFriendlyErrorMessage(errorData.message || 'Failed to burn token'));
    }

    return response.json();
};

// Função para traduzir erros técnicos em mensagens claras
function getFriendlyErrorMessage(message: string): string {
    if (message.includes("Invalid token account")) {
        return "Invalid token account. Please check the token address.";
    } else if (message.includes("Not enough tokens to burn")) {
        return "Not enough tokens to burn. Please check the amount.";
    } else if (message.includes("User denied transaction signature")) {
        return "Transaction cancelled. Please try again.";
    }
    return "An unknown error occurred. Please try again.";
}

// O hook useBurn que utiliza o useMutation do react-query
export const useBurn = () => {
    return useMutation({
        mutationFn: burnTokenApi,
    });
};