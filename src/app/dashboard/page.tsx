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

// SVG Icons
const IconLock = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const IconCheckCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const IconAlertTriangle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;

// Typing for modal state
type AuthorityModalState = {
    isOpen: boolean;
    mint: string | null;
    type: 'mint' | 'freeze' | null;
    programId: string | null;
};

// Typing for notification state
type NotificationState = {
    type: 'success' | 'error';
    message: string;
    txId?: string | null;
} | null;

const guideSections = [
    {
        icon: <IconLock />,
        title: "What Are Authorities?",
        description: "'Mint' and 'Freeze' authorities are special keys that grant control over a token. The Mint authority can create new tokens, while the Freeze authority can freeze tokens in a specific wallet, preventing transfers."
    },
    {
        icon: <IconCheckCircle />,
        title: "Why Remove Authorities?",
        description: "Removing the Mint authority ('renouncing mint') makes the token’s supply fixed and immutable. Removing the Freeze authority ensures that no one can freeze tokens. Both actions increase decentralization and your community’s trust in the project."
    },
    {
        icon: <IconAlertTriangle />,
        title: "Irreversible Action",
        description: "Be careful: removing an authority is a permanent action on the blockchain. Once removed, it can never be recovered. Think carefully before confirming the transaction."
    }
];

// Component for empty or loading state
const InfoState = ({ message, showSpinner = false }: { message: string, showSpinner?: boolean }) => (
    <div className={styles.infoStateContainer}>
        {showSpinner && <div className={styles.spinner}></div>}
        <p>{message}</p>
    </div>
);

// Component for managing a specific token
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
                    <span>Mint Authority</span>
                    {isMintAuthority ? <span className={styles.statusActive}>Active</span> : <span className={styles.statusRevoked}>Removed</span>}
                </div>
                <div className={styles.authorityStatus}>
                    <span>Freeze Authority</span>
                    {isFreezeAuthority ? <span className={styles.statusActive}>Active</span> : <span className={styles.statusRevoked}>Removed</span>}
                </div>
            </div>
            <div className={styles.actions}>
                {isMintAuthority && <Button className="secondary" onClick={() => onManageClick(token.mint, 'mint', token.programId)}>Remove Mint</Button>}
                {isFreezeAuthority && <Button className="secondary" onClick={() => onManageClick(token.mint, 'freeze', token.programId)}>Remove Freeze</Button>}
                {!isMintAuthority && !isFreezeAuthority && <p className={styles.noActionsText}>No actions available.</p>}
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
                const accountInfo = await connection.getAccountInfo(mintPublicKey);
                const programId = accountInfo?.owner;

                if (!programId || (programId.toBase58() !== TOKEN_PROGRAM_ID.toBase58() && programId.toBase58() !== TOKEN_2022_PROGRAM_ID.toBase58())) {
                     throw new Error("Unknown token program.");
                }

                const info = await getMint(connection, mintPublicKey, 'confirmed', programId);
                setMintInfo(info);
            } catch (err) {
                console.error("Failed to fetch mint info:", err);
                setNotification({ type: 'error', message: 'Failed to fetch token information.' });
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
             setNotification({type: 'success', message: `Authority removed successfully!`, txId: signature});
             const mintPublicKey = new PublicKey(modalState.mint);
             const programId = new PublicKey(modalState.programId);
             const info = await getMint(connection, mintPublicKey, 'confirmed', programId);
             setMintInfo(info);
        } else {
             setNotification({type: 'error', message: manageAuthorityError || "Failed to remove authority."});
        }
        setModalState({ isOpen: false, mint: null, type: null, programId: null });
    };
    
    const renderContent = () => {
        if (!publicKey) return <InfoState message="Connect your wallet to manage your tokens." />;
        if (isLoadingUserTokens) return <InfoState message="Loading your tokens..." showSpinner />;

        return (
            <div className={styles.managementContainer}>
                <div className={styles.field}>
                    <label htmlFor="token-select">Select a Token from Your Wallet</label>
                    <TokenSelector
                        tokens={userTokens}
                        selectedTokenMint={selectedTokenMint}
                        onSelectToken={setSelectedTokenMint}
                        isLoading={isLoadingUserTokens}
                        disabled={isManagingAuthority}
                    />
                </div>

                {isFetchingInfo && <InfoState message="Fetching token information..." showSpinner />}

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
                <h1 className={styles.pageTitle}>Manage Token Authorities</h1>
                <p className={styles.pageDescription}>
                    Revoke the Mint (creation) and Freeze (lock) authorities of your tokens to increase the security and trust of your project.
                </p>
            </header>

            <div className={styles.grid}>
                 <main className={styles.mainContent}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Management Panel</CardTitle>
                            <CardDescription>
                                Select a token from your wallet to view and manage its authorities.
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
                title={`Confirm Removal of ${modalState.type === 'mint' ? 'Mint' : 'Freeze'} Authority`}
                description="This action is irreversible. Once removed, you will no longer be able to use this functionality. Are you sure you want to continue?"
                isLoading={isManagingAuthority}
            />
        </div>
    );
}
