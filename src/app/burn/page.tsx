"use client";

import { useState, useEffect } from 'react';
import { useBurnToken } from '../../hooks/useBurnToken';
import { useUserTokens } from '../../hooks/useUserTokens';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { TokenSelector } from '../../components/TokenSelector';
import Notification from '../../components/ui/Notification';
import styles from './Burn.module.css';

// SVG Icons
const TokenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></svg>;
const FlameIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;

const tutorialSteps = [
    {
        icon: <TokenIcon />,
        title: "Select the Token",
        description: "Choose the token you want to burn directly from your wallet. Burning will permanently remove tokens from circulation."
    },
    {
        icon: <FlameIcon />,
        title: "Amount to Burn",
        description: "Set the number of tokens to be removed. You can use the 'MAX' button to burn your entire balance or enter a value manually."
    }
];

type NotificationState = {
    type: 'success' | 'error';
    message: string;
    txId?: string | null;
} | null;

export default function BurnPage() {
    const [selectedTokenMint, setSelectedTokenMint] = useState('');
    const [amount, setAmount] = useState('');
    const [notification, setNotification] = useState<NotificationState>(null);
    const { burnToken, isLoading, error, reset } = useBurnToken();
    const { tokens: userTokens, isLoading: isLoadingUserTokens } = useUserTokens();

    const selectedToken = userTokens.find(t => t.mint === selectedTokenMint) || null;
    
    useEffect(() => {
        if (error) {
            setNotification({ type: 'error', message: error });
        }
    }, [error]);

    useEffect(() => {
        // Clear hook state when unmounting the component
        return () => {
            reset();
        }
    }, [reset]);

    const handleSetMaxAmount = () => {
        if (selectedToken) {
            setAmount(selectedToken.amount);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setNotification(null);
        reset();
        
        if (selectedToken) {
            // FIX: Pass the selected token’s programId to the burn function
            const signature = await burnToken(selectedToken.mint, Number(amount), selectedToken.programId);
            if (signature) {
                setNotification({
                    type: 'success',
                    message: `Success! ${amount} ${selectedToken.symbol || 'tokens'} have been burned.`,
                    txId: signature
                });
                setSelectedTokenMint('');
                setAmount('');
            }
        }
    };

    const handleCloseNotification = () => {
        setNotification(null);
        reset();
    };


    return (
        <div className={styles.grid}>
            <div className={styles.formContainer}>
                <Card>
                    <CardHeader>
                        <CardTitle>Burn Tokens</CardTitle>
                        <CardDescription>
                            Permanently remove a certain amount of tokens from circulation. This action is irreversible.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className={styles.cardContent}>
                            {notification && (
                                <Notification
                                    type={notification.type}
                                    message={notification.message}
                                    txId={notification.txId}
                                    onClose={handleCloseNotification}
                                />
                            )}
                            
                            <div className={styles.field}>
                                <Label htmlFor="token-select">Select Token</Label>
                                <TokenSelector
                                    tokens={userTokens}
                                    selectedTokenMint={selectedTokenMint}
                                    onSelectToken={(mint) => {
                                        setSelectedTokenMint(mint);
                                        setAmount(''); // Clear amount when switching
                                    }}
                                    isLoading={isLoadingUserTokens}
                                    disabled={isLoading}
                                />
                            </div>

                            {selectedToken && (
                                <div className={styles.field}>
                                    <div className={styles.amountHeader}>
                                        <Label htmlFor="amount">Amount to Burn</Label>
                                        <span className={styles.balance}>Balance: {parseFloat(selectedToken.amount).toLocaleString()} {selectedToken.symbol}</span>
                                    </div>
                                    <div className={styles.amountInputContainer}>
                                        <Input 
                                            id="amount" 
                                            type="number" 
                                            placeholder="E.g.: 1000" 
                                            value={amount} 
                                            onChange={(e) => setAmount(e.target.value)} 
                                            required 
                                            min="0"
                                            max={selectedToken.amount}
                                            disabled={isLoading}
                                        />
                                        <Button type="button" onClick={handleSetMaxAmount} className={styles.maxButton} disabled={isLoading}>
                                            MAX
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isLoading || !selectedToken || !amount} className="w-full">
                                {isLoading ? 'Burning...' : `Burn Tokens (Cost: ~0.05 SOL + fees)`}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
            <div className={styles.sidebar}>
                <h3 className={styles.sidebarTitle}>How It Works</h3>
                 {tutorialSteps.map((step, index) => (
                    <Card key={index} className={styles.tutorialCard}>
                        <CardContent className={styles.tutorialCardContent}>
                            <div className={styles.tutorialIcon}>{step.icon}</div>
                            <div className={styles.tutorialText}>
                                <p className={styles.tutorialTitle}>{step.title}</p>
                                <p className={styles.tutorialDescription}>{step.description}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
