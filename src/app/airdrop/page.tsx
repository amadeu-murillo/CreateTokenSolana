"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAirdrop } from '@/hooks/useAirdrop';
import { useUserTokens } from '@/hooks/useUserTokens';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { TokenSelector } from '@/components/TokenSelector';
import Notification from '@/components/ui/Notification';
import styles from './Airdrop.module.css';
import { PublicKey } from '@solana/web3.js';
import { SERVICE_FEE_AIRDROP_SOL } from '@/lib/constants';

// --- Tipos e Interfaces ---
interface Recipient {
    address: string;
    amount: number;
    lineNumber: number;
}

interface ParsedResult {
    valid: Recipient[];
    invalid: { line: number; value: string; error: string }[];
    totalAmount: number;
}

// --- Ícones SVG ---
const TokenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;


// --- Componentes Auxiliares ---
const tutorialSteps = [
    { icon: <TokenIcon />, title: "1. Select the Token", description: "Choose the token you want to distribute from your wallet." },
    { icon: <UsersIcon />, title: "2. Provide the Recipients", description: "Paste in the text area the list of addresses and amounts to send." },
    { icon: <CheckIcon />, title: "3. Validate and Send", description: "Click 'Validate' to check your list. After validation, confirm to send the airdrop." }
];

// --- Componente Principal ---
export default function AirdropPage() {
    const [selectedTokenMint, setSelectedTokenMint] = useState('');
    const [recipientsText, setRecipientsText] = useState('');
    const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);

    const { performAirdrop, isLoading, error, signature, reset } = useAirdrop();
    const { tokens: userTokens, isLoading: isLoadingUserTokens } = useUserTokens();

    const selectedToken = useMemo(() => userTokens.find(t => t.mint === selectedTokenMint) || null, [userTokens, selectedTokenMint]);

    useEffect(() => {
        setParsedResult(null);
    }, [recipientsText, selectedTokenMint]);

    const parseRecipients = (text: string): ParsedResult => {
        const parts = text.split(/[\s,;]+/).filter(p => p);
        const result: ParsedResult = { valid: [], invalid: [], totalAmount: 0 };
        let totalAmount = 0;
    
        for (let i = 0; i < parts.length; i += 2) {
            const address = parts[i];
            const amountStr = parts[i + 1];
            const lineNumber = Math.floor(i / 2) + 1;
            let error = '';
    
            if (!address || !amountStr) {
                result.invalid.push({ line: lineNumber, value: `${address || ''}`, error: 'Incomplete pair of address and amount.' });
                continue;
            }
    
            try {
                new PublicKey(address);
            } catch (e) {
                error = 'Invalid Solana address.';
            }
    
            const amount = parseFloat(amountStr);
            if (isNaN(amount) || amount <= 0) {
                error = error ? error + ' Invalid amount.' : 'Invalid amount.';
            }
    
            if (error) {
                result.invalid.push({ line: lineNumber, value: `${address} ${amountStr}`, error });
            } else {
                result.valid.push({ address, amount, lineNumber });
                totalAmount += amount;
            }
        }
        result.totalAmount = totalAmount;
        return result;
    };

    const handleParseAndValidate = () => {
        setParsedResult(parseRecipients(recipientsText));
    };

    const handleSubmit = async () => {
        if (!parsedResult || parsedResult.valid.length === 0 || !selectedToken) return;
        await performAirdrop(selectedToken.mint, parsedResult.valid, selectedToken.programId);
    };

    const clearAll = () => {
        setSelectedTokenMint('');
        setRecipientsText('');
        setParsedResult(null);
        reset();
    };
    
    const BATCH_SIZE = 10;
    const numBatches = parsedResult && parsedResult.valid ? Math.ceil(parsedResult.valid.length / BATCH_SIZE) : 0;
    const totalFee = (numBatches * SERVICE_FEE_AIRDROP_SOL).toFixed(4);
    
    const isSubmitDisabled = isLoading || !parsedResult || parsedResult.invalid.length > 0 || parsedResult.valid.length === 0 || !selectedToken;

    if (signature && !isLoading && !error) {
        return (
            <div className={styles.centeredContainer}>
                <Notification
                    type="success"
                    message={`Airdrop completed successfully! The first transaction out of ${numBatches} is shown below.`}
                    txId={signature}
                    onClose={clearAll}
                />
                <Button onClick={clearAll} className="w-full" style={{ maxWidth: '400px', marginTop: '1rem' }}>Make New Airdrop</Button>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <header className={styles.pageHeader}>
                <h1>Mass Airdrop Tool</h1>
                <p>Distribute tokens quickly and efficiently to multiple addresses on the Solana network.</p>
            </header>
            <div className={styles.grid}>
                <div className={styles.formContainer}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Configure Airdrop</CardTitle>
                            <CardDescription>
                                Select the token and add the recipient list to get started.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className={styles.form}>
                                {error && <Notification type="error" message={error} onClose={reset} />}
                                <div className={styles.field}>
                                    <Label htmlFor="token-select">1. Select Token</Label>
                                    <TokenSelector
                                        tokens={userTokens}
                                        selectedTokenMint={selectedTokenMint}
                                        onSelectToken={setSelectedTokenMint}
                                        isLoading={isLoadingUserTokens}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <Label htmlFor="recipients">2. Paste Recipient List</Label>
                                    <textarea
                                        id="recipients"
                                        placeholder={"One per line: Address,Amount\nEx: 4hSVN...E3FEf,1000"}
                                        value={recipientsText}
                                        onChange={(e) => setRecipientsText(e.target.value)}
                                        className={styles.textarea}
                                        rows={8}
                                        disabled={isLoading}
                                    />
                                    <p className={styles.fieldDescription}>Separate address and amount with comma, space, or semicolon.</p>
                                </div>

                                {parsedResult && (
                                    <div className={styles.summaryCard}>
                                        <h4 className={styles.summaryTitle}>Validation Summary</h4>
                                        {parsedResult.invalid.length > 0 && (
                                            <div className={styles.errorList}>
                                                <p><strong>{parsedResult.invalid.length} errors found:</strong></p>
                                                <ul>
                                                    {parsedResult.invalid.slice(0, 5).map(item => (
                                                        <li key={item.line}>Line {item.line}: {item.error}</li>
                                                    ))}
                                                    {parsedResult.invalid.length > 5 && <li>... and {parsedResult.invalid.length - 5} more errors.</li>}
                                                </ul>
                                            </div>
                                        )}
                                        {parsedResult.valid.length > 0 ? (
                                            <div className={styles.summaryInfo}>
                                                <p><span>Valid Recipients:</span> <strong>{parsedResult.valid.length}</strong></p>
                                                <p><span>Total Tokens to Send:</span> <strong>{parsedResult.totalAmount.toLocaleString()} {selectedToken?.symbol}</strong></p>
                                                <p><span>Estimated Cost (Fees):</span> <strong>~{totalFee} SOL</strong></p>
                                            </div>
                                        ) : <p>No valid recipients in the list.</p>}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className={styles.footerActions}>
                            <Button onClick={handleParseAndValidate} disabled={isLoading || !selectedTokenMint || !recipientsText} className="secondary">
                                Validate List
                            </Button>
                            <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
                                {isLoading ? (signature || 'Processing...') : `Send Airdrop`}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
                <aside className={styles.sidebar}>
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
                </aside>
            </div>
        </div>
    );
}
