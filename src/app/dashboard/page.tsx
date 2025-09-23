"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import styles from './Dashboard.module.css';

interface TokenHistoryItem {
    signature: string;
    mint: string;
    blockTime?: number | null;
}

const HistoryItem = ({ item }: { item: TokenHistoryItem }) => (
    <div className={styles.historyItem}>
        <div>
            <p className={styles.mintAddressLabel}>Endereço do Token (Mint)</p>
            <p className={styles.mintAddress}>{item.mint}</p>
            {item.blockTime && (
                <p className={styles.creationDate}>
                    Criado em: {new Date(item.blockTime * 1000).toLocaleString()}
                </p>
            )}
        </div>
        <a 
            href={`https://solscan.io/token/${item.mint}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.solscanLink}
        >
            Ver no Solscan
        </a>
    </div>
);

export default function DashboardPage() {
    const { publicKey } = useWallet();
    const [history, setHistory] = useState<TokenHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!publicKey) return;

            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/token-history?wallet=${publicKey.toBase58()}`);
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Falha ao buscar o histórico');
                }
                const data = await response.json();
                setHistory(data.history);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [publicKey]);

    return (
        <div className={styles.container}>
            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Criação de Tokens</CardTitle>
                    <CardDescription>
                        Veja os tokens que você criou com esta carteira. 
                        A busca é limitada às últimas 100 transações.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!publicKey ? (
                        <p className={styles.infoText}>Conecte sua carteira para ver o histórico.</p>
                    ) : isLoading ? (
                        <p className={styles.infoText}>Carregando histórico...</p>
                    ) : error ? (
                        <p className={`${styles.infoText} ${styles.errorText}`}>{error}</p>
                    ) : history.length > 0 ? (
                        <div className={styles.historyList}>
                            {history.map(item => (
                                <HistoryItem key={item.signature} item={item} />
                            ))}
                        </div>
                    ) : (
                        <p className={styles.infoText}>Nenhum token criado encontrado nas últimas transações.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
