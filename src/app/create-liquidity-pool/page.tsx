"use client";

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCreateLiquidityPool } from '@/hooks/useCreateLiquidityPool';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import styles from './CreateLiquidityPool.module.css';
import Link from 'next/link';
import { NATIVE_MINT } from '@solana/spl-token';

export default function CreateLiquidityPoolPage() {
    const searchParams = useSearchParams();
    const [mint, setMint] = useState(searchParams.get('mint') || '');
    const [baseAmount, setBaseAmount] = useState('');
    const [quoteAmount, setQuoteAmount] = useState('');
    
    const { createLiquidityPool, isLoading, error, signature } = useCreateLiquidityPool();
    
    const quoteMint = useMemo(() => NATIVE_MINT.toBase58(), []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mint || !baseAmount || !quoteAmount) {
            alert("Por favor, preencha todos os campos.");
            return;
        }
        await createLiquidityPool({
            mint,
            quoteMint,
            baseAmount: Number(baseAmount),
            quoteAmount: Number(quoteAmount)
        });
    };

    return (
        <div className={styles.container}>
            <Card>
                <CardHeader>
                    <CardTitle>Criar Pool de Liquidez</CardTitle>
                    <CardDescription>
                        Torne seu token negociável adicionando liquidez a uma DEX (Raydium).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.field}>
                            <Label htmlFor="mint">Endereço do seu Token (Mint Base)</Label>
                            <Input id="mint" type="text" placeholder="Cole o endereço do seu token" value={mint} onChange={(e) => setMint(e.target.value)} required />
                        </div>
                        <div className={styles.field}>
                            <Label htmlFor="quoteMint">Token de Cotação</Label>
                            <Input id="quoteMint" type="text" value="SOL (Nativo)" disabled />
                        </div>
                         <div className={styles.field}>
                            <Label htmlFor="baseAmount">Quantidade do seu Token</Label>
                            <Input id="baseAmount" type="number" placeholder="Ex: 1000000" value={baseAmount} onChange={(e) => setBaseAmount(e.target.value)} required min="0" />
                        </div>
                         <div className={styles.field}>
                            <Label htmlFor="quoteAmount">Quantidade de SOL</Label>
                            <Input id="quoteAmount" type="number" placeholder="Ex: 10" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} required min="0" />
                        </div>

                        <Button type="submit" disabled={isLoading || !mint || !baseAmount || !quoteAmount}>
                            {isLoading ? 'Criando Pool...' : 'Criar Pool de Liquidez (~0.3 SOL)'}
                        </Button>
                    </form>
                    {error && <p className={styles.error}>{error}</p>}
                    {signature && (
                        <div className={styles.success}>
                            <p>Pool de liquidez criado com sucesso!</p>
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
