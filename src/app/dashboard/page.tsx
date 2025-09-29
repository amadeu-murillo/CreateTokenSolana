"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import ManageAuthorityModal from "@/components/ManageAuthorityModal";
import { useManageAuthority } from "@/hooks/useManageAuthority";
import styles from './Dashboard.module.css';
import Notification from "@/components/ui/Notification";
import Image from "next/image";

// Tipagem para os dados do token que virão da API
interface ManagedToken {
    mint: string;
    name: string;
    symbol: string;
    uri: string;
    mintAuthority: string | null;
    freezeAuthority: string | null;
}

type AuthorityModalState = {
    isOpen: boolean;
    mint: string | null;
    type: 'mint' | 'freeze' | null;
};

type NotificationState = {
    type: 'success' | 'error';
    message: string;
    txId?: string | null;
} | null;

// Componente para exibir o estado de carregamento
const LoadingState = () => (
    <div className={styles.infoStateContainer}>
        <div className={styles.spinner}></div>
        <p>A carregar os seus tokens...</p>
    </div>
);

// Componente para o estado vazio
const EmptyState = () => (
    <div className={styles.infoStateContainer}>
        <h3 className={styles.emptyStateTitle}>Nenhum token encontrado</h3>
        <p className={styles.emptyStateText}>Parece que ainda não criou nenhum token ou já removeu a sua autoridade de todos eles.</p>
        <Link href="/create">
            <Button>Criar o meu Primeiro Token</Button>
        </Link>
    </div>
);

// Componente para o card de cada token
const TokenManagementCard = ({ token, onManageClick }: { token: ManagedToken, onManageClick: (mint: string, type: 'mint' | 'freeze') => void }) => (
    <div className={styles.tokenCard}>
        <div className={styles.tokenInfo}>
            <Image 
                src={token.uri || '/favicon.ico'} 
                alt={token.name} 
                width={48} 
                height={48} 
                className={styles.tokenImage}
                onError={(e) => { (e.target as HTMLImageElement).src = '/favicon.ico'; }}
            />
            <div>
                <h4 className={styles.tokenName}>{token.name}</h4>
                <p className={styles.tokenSymbol}>{token.symbol}</p>
                <a 
                    href={`https://solscan.io/token/${token.mint}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.solscanLink}
                >
                    {token.mint.slice(0, 6)}...{token.mint.slice(-6)}
                </a>
            </div>
        </div>
        <div className={styles.authorityInfo}>
             <div className={styles.authorityStatus}>
                <span>Autoridade de Mint</span>
                {token.mintAuthority ? <span className={styles.statusActive}>Ativa</span> : <span className={styles.statusRevoked}>Removida</span>}
            </div>
             <div className={styles.authorityStatus}>
                <span>Autoridade de Freeze</span>
                {token.freezeAuthority ? <span className={styles.statusActive}>Ativa</span> : <span className={styles.statusRevoked}>Removida</span>}
            </div>
        </div>
        <div className={styles.actions}>
            {token.mintAuthority && <Button className="secondary" onClick={() => onManageClick(token.mint, 'mint')}>Remover Mint</Button>}
            {token.freezeAuthority && <Button className="secondary" onClick={() => onManageClick(token.mint, 'freeze')}>Remover Freeze</Button>}
            {!token.mintAuthority && !token.freezeAuthority && <p className={styles.noActionsText}>Nenhuma ação disponível.</p>}
        </div>
    </div>
);


export default function DashboardPage() {
    const { publicKey } = useWallet();
    const [managedTokens, setManagedTokens] = useState<ManagedToken[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<NotificationState>(null);

    const { manageAuthority, isLoading: isManagingAuthority, error: manageAuthorityError } = useManageAuthority();
    const [modalState, setModalState] = useState<AuthorityModalState>({ isOpen: false, mint: null, type: null });

    const fetchManagedTokens = async () => {
        if (!publicKey) {
            setIsLoading(false);
            setManagedTokens([]);
            return;
        }
        setIsLoading(true);
        setError(null);
        setNotification(null);
        try {
            const response = await fetch(`/api/token-history?wallet=${publicKey.toBase58()}`);
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Falha ao buscar os tokens');
            }
            const data = await response.json();
            setManagedTokens(data.tokens);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchManagedTokens();
    }, [publicKey]);

    const handleManageAuthorityClick = (mint: string, type: 'mint' | 'freeze') => {
        setModalState({ isOpen: true, mint, type });
    };

    const handleConfirmManageAuthority = async () => {
        if (!modalState.mint || !modalState.type) return;

        setNotification(null);
        const signature = await manageAuthority(modalState.mint, modalState.type);

        if (signature) {
             setNotification({type: 'success', message: `Autoridade removida com sucesso!`, txId: signature});
             // Re-fetch tokens to update the UI
             fetchManagedTokens();
        } else {
             setNotification({type: 'error', message: manageAuthorityError || "Falha ao remover autoridade."});
        }
        setModalState({ isOpen: false, mint: null, type: null });
    };
    
    const renderContent = () => {
        if (!publicKey) return <p className={styles.infoStateContainer}>Conecte a sua carteira para gerir os seus tokens.</p>;
        if (isLoading) return <LoadingState />;
        if (error) return <p className={`${styles.infoStateContainer} ${styles.errorText}`}>{error}</p>;
        if (managedTokens.length === 0) return <EmptyState />;

        return (
             <div className={styles.tokenGrid}>
                {managedTokens.map(token => (
                    <TokenManagementCard key={token.mint} token={token} onManageClick={handleManageAuthorityClick} />
                ))}
            </div>
        );
    }

    return (
        <div className={styles.container}>
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
                    <CardTitle>Gerir Tokens</CardTitle>
                    <CardDescription>
                        Veja e gira as autoridades dos tokens que criou.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>

            <ManageAuthorityModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, mint: null, type: null })}
                onConfirm={handleConfirmManageAuthority}
                title={`Confirmar Remoção de Autoridade de ${modalState.type === 'mint' ? 'Mint' : 'Freeze'}`}
                description="Esta ação é irreversível. Após a remoção, não poderá mais criar novos tokens (mint) ou congelar contas de token (freeze). Tem a certeza de que deseja continuar?"
                isLoading={isManagingAuthority}
            />
        </div>
    );
}
