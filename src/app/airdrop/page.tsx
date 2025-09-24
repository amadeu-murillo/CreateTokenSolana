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
        <div className={styles.container}>
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
                            {isLoading ? 'Enviando...' : `Fazer Airdrop (Custo: ${"0.05"} SOL + taxas)`}
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
    );
}
