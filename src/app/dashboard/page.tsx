"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ManageAuthorityModal from "@/components/ManageAuthorityModal";
import { useManageAuthority } from "@/hooks/useManageAuthority";
import styles from './Dashboard.module.css';
import Notification from "@/components/ui/Notification"; // Importar o novo componente

interface TokenHistoryItem {
    signature: string;
    mint: string;
    blockTime?: number | null;
}

type AuthorityModalState = {
    isOpen: boolean;
    mint: string | null;
    type: 'mint' | 'freeze' | null;
};

// Modificação: O estado da notificação agora inclui um txId opcional
type NotificationState = {
    type: 'success' | 'error';
    message: string;
    txId?: string | null;
} | null;

const HistoryItem = ({ item, onManageAuthorityClick }: { item: TokenHistoryItem, onManageAuthorityClick: (mint: string, type: 'mint' | 'freeze') => void }) => (
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
        <div className={styles.actionsContainer}>
             <Button className={styles.actionButton} onClick={() => onManageAuthorityClick(item.mint, 'mint')}>Remover Autoridade de Mint</Button>
             <Button className={styles.actionButton} onClick={() => onManageAuthorityClick(item.mint, 'freeze')}>Remover Autoridade de Freeze</Button>
            <a 
                href={`https://solscan.io/token/${item.mint}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.solscanLink}
            >
                Ver no Solscan
            </a>
        </div>
    </div>
);

export default function DashboardPage() {
    const { publicKey } = useWallet();
    const [history, setHistory] = useState<TokenHistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [errorHistory, setErrorHistory] = useState<string | null>(null);
    const [notification, setNotification] = useState<NotificationState>(null);

    const { manageAuthority, isLoading: isManagingAuthority, error: manageAuthorityError } = useManageAuthority();

    const [modalState, setModalState] = useState<AuthorityModalState>({ isOpen: false, mint: null, type: null });

    const fetchHistory = async () => {
        if (!publicKey) return;
        setIsLoadingHistory(true);
        setErrorHistory(null);
        setNotification(null);
        try {
            const response = await fetch(`/api/token-history?wallet=${publicKey.toBase58()}`);
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Falha ao buscar o histórico');
            }
            const data = await response.json();
            setHistory(data.history);
        } catch (err: any) {
            setErrorHistory(err.message);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [publicKey]);

    const handleManageAuthorityClick = (mint: string, type: 'mint' | 'freeze') => {
        setModalState({ isOpen: true, mint, type });
    };

    const handleConfirmManageAuthority = async () => {
        if (!modalState.mint || !modalState.type) return;

        setNotification(null);
        const signature = await manageAuthority(modalState.mint, modalState.type);

        if (signature) {
             // Modificação: Atualiza o estado da notificação com txId para sucesso
             setNotification({type: 'success', message: `Autoridade removida com sucesso!`, txId: signature});
             fetchHistory(); // Re-fetch history to reflect changes
        } else {
             // Modificação: Atualiza o estado da notificação para erro
             setNotification({type: 'error', message: manageAuthorityError || "Falha ao remover autoridade."});
        }
        setModalState({ isOpen: false, mint: null, type: null });
    };

    return (
        <div className={styles.container}>
             {/* Modificação: Usa o novo componente de Notificação */}
             {notification && (
                <Notification
                    type={notification.type}
                    message={notification.message}
                    txId={notification.txId}
                    onClose={() => setNotification(null)}
                />
            )}
            <Card>
                <CardHeader>
                    <CardTitle>Gerenciamento de Tokens</CardTitle>
                    <CardDescription>
                        Veja os tokens que você criou e gerencie suas autoridades.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!publicKey ? (
                        <p className={styles.infoText}>Conecte sua carteira para ver o histórico.</p>
                    ) : isLoadingHistory ? (
                        <p className={styles.infoText}>Carregando histórico...</p>
                    ) : errorHistory ? (
                        <p className={`${styles.infoText} ${styles.errorText}`}>{errorHistory}</p>
                    ) : history.length > 0 ? (
                        <div className={styles.historyList}>
                            {history.map(item => (
                                <HistoryItem key={item.signature} item={item} onManageAuthorityClick={handleManageAuthorityClick} />
                            ))}
                        </div>
                    ) : (
                        <p className={styles.infoText}>Nenhum token criado encontrado nas últimas transações.</p>
                    )}
                </CardContent>
            </Card>

            <ManageAuthorityModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, mint: null, type: null })}
                onConfirm={handleConfirmManageAuthority}
                title={`Confirmar Remoção de Autoridade de ${modalState.type === 'mint' ? 'Mint' : 'Freeze'}`}
                description="Esta ação é irreversível. Após a remoção, você não poderá mais criar novos tokens (mint) ou congelar contas de token (freeze). Tem certeza de que deseja continuar?"
                isLoading={isManagingAuthority}
            />
        </div>
    );
}
