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

// Ícones SVG
const IconLock = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const IconCheckCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const IconAlertTriangle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;


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

const guideSections = [
    {
        icon: <IconLock />,
        title: "O que são Autoridades?",
        description: "As autoridades de 'Mint' e 'Freeze' são chaves especiais que dão controle sobre o token. A autoridade de Mint pode criar novos tokens, enquanto a de Freeze pode congelar tokens em uma carteira específica, impedindo transferências."
    },
    {
        icon: <IconCheckCircle />,
        title: "Por que Remover as Autoridades?",
        description: "Remover a autoridade de Mint ('renunciar ao mint') torna o fornecimento do token fixo e imutável. Remover a de Freeze garante que ninguém poderá ter seus tokens bloqueados. Ambas as ações aumentam a descentralização e a confiança da sua comunidade no projeto."
    },
    {
        icon: <IconAlertTriangle />,
        title: "Ação Irreversível",
        description: "Tenha atenção: remover uma autoridade é uma ação permanente na blockchain. Uma vez removida, ela nunca mais poderá ser recuperada. Pense com cuidado antes de confirmar a transação."
    }
];

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
                // CORREÇÃO: O programId pode não estar disponível imediatamente, então buscamos a informação do mint primeiro para determinar o programId.
                const accountInfo = await connection.getAccountInfo(mintPublicKey);
                const programId = accountInfo?.owner;

                if (!programId || (programId.toBase58() !== TOKEN_PROGRAM_ID.toBase58() && programId.toBase58() !== TOKEN_2022_PROGRAM_ID.toBase58())) {
                     throw new Error("Programa de token desconhecido.");
                }

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
    }, [selectedTokenMint, connection]);

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
        <div className={styles.pageContainer}>
             {notification && (
                <Notification
                    type={notification.type}
                    message={notification.message}
                    txId={notification.txId}
                    onClose={() => setNotification(null)}
                />
            )}

            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Gerenciar Autoridades do Token</h1>
                <p className={styles.pageDescription}>
                    Revogue as autoridades de Mint (criação) e Freeze (congelamento) dos seus tokens para aumentar a segurança e a confiança do seu projeto.
                </p>
            </header>

            <div className={styles.grid}>
                 <main className={styles.mainContent}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Painel de Gerenciamento</CardTitle>
                            <CardDescription>
                                Selecione um token da sua carteira para visualizar e gerenciar suas autoridades.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderContent()}
                        </CardContent>
                    </Card>
                </main>

                <aside className={styles.sidebar}>
                    {guideSections.map((section, index) => (
                         <Card key={index} className={styles.guideCard}>
                            <CardContent className={styles.guideCardContent}>
                                <div className={styles.guideIcon}>{section.icon}</div>
                                <div>
                                    <p className={styles.guideTitle}>{section.title}</p>
                                    <p className={styles.guideDescription}>{section.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </aside>
            </div>


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
