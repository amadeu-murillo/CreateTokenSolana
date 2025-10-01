"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ManageAuthorityModal from "@/components/ManageAuthorityModal";
import { useManageAuthority } from "@/hooks/useManageAuthority";
import styles from './Dashboard.module.css';
import Notification from "@/components/ui/Notification";
import Image from "next/image";
import { useUserTokens } from "@/hooks/useUserTokens";
import { TokenSelector } from "@/components/TokenSelector";
import { getMint, Mint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

// Tipagem para o estado do modal de confirmação
type AuthorityModalState = {
    isOpen: boolean;
    mint: string | null;
    type: 'mint' | 'freeze' | null;
    programId: string | null;
};

// Tipagem para o estado da notificação
type NotificationState = {
    type: 'success' | 'error';
    message: string;
    txId?: string | null;
} | null;

// Componente para o estado vazio ou de carregamento inicial
const InfoState = ({ message, showSpinner = false }: { message: string, showSpinner?: boolean }) => (
    <div className={styles.infoStateContainer}>
        {showSpinner && <div className={styles.spinner}></div>}
        <p>{message}</p>
    </div>
);

// Componente para o card de gestão de um token específico
const TokenManagementCard = ({ token, mintInfo, onManageClick }: { token: any, mintInfo: Mint, onManageClick: (mint: string, type: 'mint' | 'freeze', programId: string) => void }) => {
    const { publicKey } = useWallet();

    const isMintAuthority = mintInfo.mintAuthority && mintInfo.mintAuthority.equals(publicKey!);
    const isFreezeAuthority = mintInfo.freezeAuthority && mintInfo.freezeAuthority.equals(publicKey!);

    return (
        <div className={styles.tokenCard}>
            <div className={styles.tokenInfo}>
                <Image
                    src={token.logoURI || '/favicon.ico'}
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
                    {isMintAuthority ? <span className={styles.statusActive}>Ativa</span> : <span className={styles.statusRevoked}>Removida</span>}
                </div>
                <div className={styles.authorityStatus}>
                    <span>Autoridade de Freeze</span>
                    {isFreezeAuthority ? <span className={styles.statusActive}>Ativa</span> : <span className={styles.statusRevoked}>Removida</span>}
                </div>
            </div>
            <div className={styles.actions}>
                {isMintAuthority && <Button className="secondary" onClick={() => onManageClick(token.mint, 'mint', token.programId)}>Remover Mint</Button>}
                {isFreezeAuthority && <Button className="secondary" onClick={() => onManageClick(token.mint, 'freeze', token.programId)}>Remover Freeze</Button>}
                {!isMintAuthority && !isFreezeAuthority && <p className={styles.noActionsText}>Nenhuma ação disponível.</p>}
            </div>
        </div>
    )
};


export default function DashboardPage() {
    const { publicKey } = useWallet();
    const { connection } = useConnection();
    const { tokens: userTokens, isLoading: isLoadingUserTokens } = useUserTokens();
    const { manageAuthority, isLoading: isManagingAuthority, error: manageAuthorityError, reset: resetManageAuthority } = useManageAuthority();
    
    const [selectedTokenMint, setSelectedTokenMint] = useState<string>('');
    const [mintInfo, setMintInfo] = useState<Mint | null>(null);
    const [isFetchingInfo, setIsFetchingInfo] = useState(false);
    
    const [notification, setNotification] = useState<NotificationState>(null);
    const [modalState, setModalState] = useState<AuthorityModalState>({ isOpen: false, mint: null, type: null, programId: null });

    const selectedToken = useMemo(() => userTokens.find(t => t.mint === selectedTokenMint), [userTokens, selectedTokenMint]);

    useEffect(() => {
        const fetchMintInfo = async () => {
            if (!selectedTokenMint || !connection) return;

            setIsFetchingInfo(true);
            setMintInfo(null);
            try {
                const mintPublicKey = new PublicKey(selectedTokenMint);
                const programId = new PublicKey(selectedToken?.programId || TOKEN_PROGRAM_ID);
                const info = await getMint(connection, mintPublicKey, 'confirmed', programId);
                setMintInfo(info);
            } catch (err) {
                console.error("Failed to fetch mint info:", err);
                setNotification({ type: 'error', message: 'Falha ao buscar informações do token.' });
            } finally {
                setIsFetchingInfo(false);
            }
        };

        fetchMintInfo();
    }, [selectedTokenMint, connection, selectedToken]);

    const handleManageAuthorityClick = (mint: string, type: 'mint' | 'freeze', programId: string) => {
        setModalState({ isOpen: true, mint, type, programId });
    };

    const handleConfirmManageAuthority = async () => {
        if (!modalState.mint || !modalState.type || !modalState.programId) return;

        setNotification(null);
        resetManageAuthority();

        const signature = await manageAuthority(modalState.mint, modalState.type, modalState.programId);

        if (signature) {
             setNotification({type: 'success', message: `Autoridade removida com sucesso!`, txId: signature});
             // Re-fetch mint info to update UI
             const mintPublicKey = new PublicKey(modalState.mint);
             const programId = new PublicKey(modalState.programId);
             const info = await getMint(connection, mintPublicKey, 'confirmed', programId);
             setMintInfo(info);
        } else {
             setNotification({type: 'error', message: manageAuthorityError || "Falha ao remover autoridade."});
        }
        setModalState({ isOpen: false, mint: null, type: null, programId: null });
    };
    
    const renderContent = () => {
        if (!publicKey) return <InfoState message="Conecte a sua carteira para gerir os seus tokens." />;
        if (isLoadingUserTokens) return <InfoState message="A carregar os seus tokens..." showSpinner />;

        return (
            <div className={styles.managementContainer}>
                <div className={styles.field}>
                    <label htmlFor="token-select">Selecione um Token da sua Carteira</label>
                    <TokenSelector
                        tokens={userTokens}
                        selectedTokenMint={selectedTokenMint}
                        onSelectToken={setSelectedTokenMint}
                        isLoading={isLoadingUserTokens}
                        disabled={isManagingAuthority}
                    />
                </div>

                {isFetchingInfo && <InfoState message="A buscar informações do token..." showSpinner />}

                {mintInfo && selectedToken && (
                    <TokenManagementCard 
                        token={selectedToken} 
                        mintInfo={mintInfo} 
                        onManageClick={handleManageAuthorityClick} 
                    />
                )}
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
                    <CardTitle>Gerir Autoridades do Token</CardTitle>
                    <CardDescription>
                        Selecione um token da sua carteira para visualizar e remover as autoridades de mint e freeze.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>

            <ManageAuthorityModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, mint: null, type: null, programId: null })}
                onConfirm={handleConfirmManageAuthority}
                title={`Confirmar Remoção de Autoridade de ${modalState.type === 'mint' ? 'Mint' : 'Freeze'}`}
                description="Esta ação é irreversível. Após a remoção, não poderá mais usar esta funcionalidade. Tem a certeza de que deseja continuar?"
                isLoading={isManagingAuthority}
            />
        </div>
    );
}
