"use client";

import { useState } from 'react';
import { useBurnToken } from '@/hooks/useBurnToken';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import styles from './Burn.module.css';
import Link from 'next/link';

export default function BurnPage() {
    const [mint, setMint] = useState('');
    const [amount, setAmount] = useState('');
    const { burnToken, isLoading, error, signature } = useBurnToken();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await burnToken(mint, Number(amount));
    };

    return (
        <div className={styles.container}>
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
                            {isLoading ? 'Queimando...' : `Queimar Tokens (Custo: ${"0.05"} SOL)`}
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
    );
}
