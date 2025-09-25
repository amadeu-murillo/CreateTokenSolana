"use client";

import { useState } from 'react';
import { useAirdrop } from '@/hooks/useAirdrop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import styles from './Airdrop.module.css';
import Link from 'next/link';

interface Recipient {
    address: string;
    amount: number;
}

// Ícones SVG para o guia
const TokenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

const tutorialSteps = [
    {
        icon: <TokenIcon />,
        title: "Endereço do Token (Mint)",
        description: "Insira o endereço do token que você deseja distribuir. Apenas o criador ou detentor dos tokens pode realizar o airdrop."
    },
    {
        icon: <UsersIcon />,
        title: "Lista de Destinatários",
        description: "Formate sua lista com um endereço e uma quantidade por linha, separados por vírgula, espaço ou ponto e vírgula. A plataforma criará as contas de token para os destinatários, se necessário."
    }
];

export default function AirdropPage() {
    const [mint, setMint] = useState('');
    const [recipientsText, setRecipientsText] = useState('');
    const { performAirdrop, isLoading, error, signature } = useAirdrop();

    const parseRecipients = (): Recipient[] => {
        return recipientsText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line)
            .map(line => {
                const parts = line.split(/[,;\s]+/);
                const address = parts[0];
                const amount = parseFloat(parts[1]);
                return { address, amount };
            })
            .filter(r => r.address && !isNaN(r.amount) && r.amount > 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const recipients = parseRecipients();
        if (recipients.length === 0) {
            alert("Por favor, insira destinatários válidos.");
            return;
        }
        await performAirdrop(mint, recipients);
    };

    return (
        <div className={styles.grid}>
            <div className={styles.formContainer}>
                <Card>
                    <CardHeader>
                        <CardTitle>Ferramenta de Airdrop</CardTitle>
                        <CardDescription>
                            Distribua tokens para múltiplos endereços de uma só vez.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.field}>
                                <Label htmlFor="mint">Endereço do Token (Mint)</Label>
                                <Input id="mint" type="text" placeholder="Cole o endereço do mint do token" value={mint} onChange={(e) => setMint(e.target.value)} required />
                            </div>
                            <div className={styles.field}>
                                <Label htmlFor="recipients">Lista de Destinatários</Label>
                                <textarea
                                    id="recipients"
                                    placeholder="Um por linha: Endereço,Quantidade&#10;Ex: 4hSVN...E3FEf,1000"
                                    value={recipientsText}
                                    onChange={(e) => setRecipientsText(e.target.value)}
                                    className={styles.textarea}
                                    rows={10}
                                    required
                                />
                                <p className={styles.fieldDescription}>Separe o endereço e a quantidade por vírgula, ponto e vírgula ou espaço.</p>
                            </div>
                            <Button type="submit" disabled={isLoading || !mint || !recipientsText}>
                                {isLoading ? 'Enviando...' : `Fazer Airdrop (Custo: 0.05 SOL + taxas)`}
                            </Button>
                        </form>
                        {error && <p className={styles.error}>{error}</p>}
                        {signature && (
                            <div className={styles.success}>
                                <p>Airdrop enviado com sucesso!</p>
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
