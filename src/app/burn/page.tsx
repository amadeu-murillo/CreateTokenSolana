"use client";

import { useState } from 'react';
import { useBurnToken } from '@/hooks/useBurnToken';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import styles from './Burn.module.css';
import Link from 'next/link';

// Ícones SVG para o guia
const TokenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></svg>;
const FlameIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;

const tutorialSteps = [
    {
        icon: <TokenIcon />,
        title: "Endereço do Token (Mint)",
        description: "Cole o endereço único do token que você deseja queimar. A queima removerá tokens permanentemente da circulação."
    },
    {
        icon: <FlameIcon />,
        title: "Quantidade a Queimar",
        description: "Defina a quantidade exata de tokens a ser removida. Lembre-se, esta ação é irreversível e os tokens não podem ser recuperados."
    }
];

export default function BurnPage() {
    const [mint, setMint] = useState('');
    const [amount, setAmount] = useState('');
    const { burnToken, isLoading, error, signature } = useBurnToken();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await burnToken(mint, Number(amount));
    };

    return (
        <div className={styles.grid}>
            <div className={styles.formContainer}>
                <Card>
                    <CardHeader>
                        <CardTitle>Queimar Tokens (Burn)</CardTitle>
                        <CardDescription>
                            Remova permanentemente uma quantidade de tokens de circulação. Esta ação é irreversível.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.field}>
                                <Label htmlFor="mint">Endereço do Token (Mint)</Label>
                                <Input id="mint" type="text" placeholder="Cole o endereço do mint do token" value={mint} onChange={(e) => setMint(e.target.value)} required />
                            </div>
                            <div className={styles.field}>
                                <Label htmlFor="amount">Quantidade a Queimar</Label>
                                <Input id="amount" type="number" placeholder="Ex: 1000" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0" />
                            </div>
                            <Button type="submit" disabled={isLoading || !mint || !amount}>
                                {isLoading ? 'Queimando...' : `Queimar Tokens (Custo: 0.05 SOL + taxas)`}
                            </Button>
                        </form>
                        {error && <p className={styles.error}>{error}</p>}
                        {signature && (
                            <div className={styles.success}>
                                <p>Tokens queimados com sucesso!</p>
                                <Link href={`https://solscan.io/tx/${signature}`} target="_blank" rel="noopener noreferrer">
                                    Ver transação no Solscan
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className={styles.sidebar}>
                <h3 className={styles.sidebarTitle}>Como Funciona</h3>
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
