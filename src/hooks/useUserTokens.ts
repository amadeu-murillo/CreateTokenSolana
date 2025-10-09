// src/hooks/useUserTokens.ts

import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { fetchDigitalAsset, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey as umiPublicKey } from '@metaplex-foundation/umi';
import { RPC_ENDPOINT } from '@/lib/constants';
import { getMetadataCache, setMetadataCache, isCacheItemValid } from '@/lib/cache';

// Interface for the Solana token list
interface SolanaToken {
    chainId: number;
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI: string;
}

// Interface for the user's token
export interface UserToken {
    mint: string;
    amount: string;
    decimals: number;
    name?: string;
    symbol?: string;
    logoURI?: string;
    programId: string; // Added to identify the token type
}

// Function to introduce a small delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useUserTokens = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [tokens, setTokens] = useState<UserToken[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [tokenMap, setTokenMap] = useState<Map<string, SolanaToken>>(new Map());

    const umi = createUmi(RPC_ENDPOINT).use(mplTokenMetadata());

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

    useEffect(() => {
        const fetchUserTokens = async () => {
            if (!publicKey) {
                setTokens([]);
                return;
            }

            setIsLoading(true);
            try {
                const [tokenAccounts, token2022Accounts] = await Promise.all([
                    connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID }),
                    connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_2022_PROGRAM_ID })
                ]);

                // Adds the programId to each account for later filtering
                const allAccounts = [
                    ...tokenAccounts.value.map(acc => ({ ...acc, programId: TOKEN_PROGRAM_ID.toBase58() })),
                    ...token2022Accounts.value.map(acc => ({ ...acc, programId: TOKEN_2022_PROGRAM_ID.toBase58() }))
                ]
                    .filter(acc => acc.account.data.parsed.info.tokenAmount.uiAmount > 0);

                const resolvedTokens: UserToken[] = [];
                const BATCH_SIZE = 5; // Process 5 tokens at a time
                const DELAY_MS = 500; // Half a second delay between batches
                const metadataCache = getMetadataCache();

                for (let i = 0; i < allAccounts.length; i += BATCH_SIZE) {
                    const batch = allAccounts.slice(i, i + BATCH_SIZE);
                    const batchPromises = batch.map(async (accountInfo) => {
                        const { mint, tokenAmount } = accountInfo.account.data.parsed.info;
                        const tokenData = tokenMap.get(mint);

                        if (tokenData) {
                            return {
                                mint,
                                amount: tokenAmount.uiAmountString,
                                decimals: tokenAmount.decimals,
                                name: tokenData.name,
                                symbol: tokenData.symbol,
                                logoURI: tokenData.logoURI,
                                programId: accountInfo.programId,
                            };
                        } else {
                            // --- OTIMIZAÇÃO: Lógica de Cache ---
                            const cachedToken = metadataCache[mint];
                            if (isCacheItemValid(cachedToken)) {
                                return {
                                    mint,
                                    amount: tokenAmount.uiAmountString,
                                    decimals: tokenAmount.decimals,
                                    ...cachedToken.data,
                                    programId: accountInfo.programId,
                                };
                            }

                            // Se não estiver no cache ou estiver expirado, busca na rede
                            try {
                                const asset = await fetchDigitalAsset(umi, umiPublicKey(mint));
                                
                                // ***** INÍCIO DA CORREÇÃO *****
                                // A `asset.metadata.uri` é a URL para o JSON, não para a imagem.
                                // Precisamos buscar esse JSON para encontrar a URL da imagem.
                                let finalLogoURI = '';
                                if (asset.metadata.uri) {
                                    try {
                                        const response = await fetch(asset.metadata.uri);
                                        if (response.ok) {
                                            const offChainMetadata = await response.json();
                                            // A URL da imagem está dentro da propriedade 'image' do JSON
                                            finalLogoURI = offChainMetadata.image || '';
                                        }
                                    } catch (fetchErr) {
                                        console.error(`Failed to fetch off-chain metadata from ${asset.metadata.uri}:`, fetchErr);
                                    }
                                }
                                // ***** FIM DA CORREÇÃO *****

                                const metadata = {
                                    name: asset.metadata.name,
                                    symbol: asset.metadata.symbol,
                                    logoURI: finalLogoURI, // Usar a URL da imagem corrigida
                                };

                                // Salva os novos metadados no cache
                                metadataCache[mint] = { data: metadata, timestamp: Date.now() };

                                return {
                                    mint,
                                    amount: tokenAmount.uiAmountString,
                                    decimals: tokenAmount.decimals,
                                    ...metadata,
                                    programId: accountInfo.programId,
                                };
                            } catch (e) {
                                console.error(`Failed to fetch metadata for mint ${mint}:`, e);
                                return {
                                    mint,
                                    amount: tokenAmount.uiAmountString,
                                    decimals: tokenAmount.decimals,
                                    name: 'Unknown Token',
                                    symbol: mint.substring(0, 6),
                                    logoURI: '',
                                    programId: accountInfo.programId,
                                };
                            }
                        }
                    });

                    const batchResults = await Promise.all(batchPromises);
                    resolvedTokens.push(...batchResults);

                    // Adds a delay if there are more batches to process
                    if (i + BATCH_SIZE < allAccounts.length) {
                        await sleep(DELAY_MS);
                    }
                }
                
                // Salva o cache atualizado no final do processo
                setMetadataCache(metadataCache);
                setTokens(resolvedTokens);

            } catch (error) {
                console.error("Failed to fetch user's tokens:", error);
                setTokens([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserTokens();
    }, [publicKey, connection, tokenMap]);

    return { tokens, isLoading };
};
