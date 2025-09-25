// src/hooks/useUserTokens.ts
import { useState, useEffect, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Interface para a lista de tokens da Solana
interface SolanaToken {
    chainId: number;
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI: string;
}

// Interface para o token do usuário, agora com nome e símbolo
interface UserToken {
    mint: string;
    amount: string;
    decimals: number;
    name?: string;
    symbol?: string;
    logoURI?: string;
}

export const useUserTokens = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [tokens, setTokens] = useState<UserToken[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [tokenMap, setTokenMap] = useState<Map<string, SolanaToken>>(new Map());

    // Busca a lista de tokens da Solana apenas uma vez
    useEffect(() => {
        const fetchTokenList = async () => {
            try {
                const response = await fetch('https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json');
                const data = await response.json();
                const tokenList: SolanaToken[] = data.tokens;
                setTokenMap(new Map(tokenList.map(token => [token.address, token])));
            } catch (error) {
                console.error("Failed to fetch Solana token list:", error);
            }
        };
        fetchTokenList();
    }, []);

    // Busca os tokens do usuário quando a carteira ou a lista de tokens mudar
    useEffect(() => {
        const fetchUserTokens = async () => {
            if (!publicKey || tokenMap.size === 0) {
                setTokens([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await connection.getParsedTokenAccountsByOwner(
                    publicKey,
                    { programId: TOKEN_PROGRAM_ID }
                );
                
                const userTokens = response.value.map(accountInfo => {
                    const mint = accountInfo.account.data.parsed.info.mint;
                    const tokenData = tokenMap.get(mint);
                    return {
                        mint,
                        amount: accountInfo.account.data.parsed.info.tokenAmount.uiAmountString,
                        decimals: accountInfo.account.data.parsed.info.tokenAmount.decimals,
                        name: tokenData?.name,
                        symbol: tokenData?.symbol,
                        logoURI: tokenData?.logoURI,
                    };
                }).filter(token => token.amount && parseFloat(token.amount) > 0);

                setTokens(userTokens);
            } catch (error) {
                console.error("Failed to fetch user tokens:", error);
                setTokens([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserTokens();
    }, [publicKey, connection, tokenMap]);

    return { tokens, isLoading };
};