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
    const [baseMint, setBaseMint] = useState(searchParams.get('mint') || '');
    const [baseAmount, setBaseAmount] = useState('');
    const [quoteAmount, setQuoteAmount] = useState('');
    const [marketId, setMarketId] = useState(''); // MODIFICAÇÃO: Adicionado estado para o Market ID

    const { createLiquidityPool, isLoading, error, signature } = useCreateLiquidityPool();
    
    // O token de cotação será sempre SOL (Wrapped SOL)
    const quoteMint = useMemo(() => NATIVE_MINT.toBase58(), []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!baseMint || !baseAmount || !quoteAmount || !marketId) { // MODIFICAÇÃO: Validar marketId
            alert("Por favor, preencha todos os campos.");
            return;
        }
        await createLiquidityPool({
            baseMint,
            quoteMint,
            baseAmount: Number(baseAmount),
            quoteAmount: Number(quoteAmount),
            marketId, // MODIFICAÇÃO: Passar marketId
        });
    };

    return (
        <div className={styles.container}>
            <Card>
                <CardHeader>
                    <CardTitle>Criar Pool de Liquidez</CardTitle>
                    <CardDescription>
                        Torne seu token negociável em uma DEX (Raydium) fornecendo liquidez inicial.
                         <a href="https://docs.raydium.io/services/creating-a-liquidity-pool" target="_blank" rel="noopener noreferrer" className={styles.link}> Saiba mais.</a>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {/* MODIFICAÇÃO: Adicionado campo para OpenBook Market ID */}
                        <div className={styles.field}>
                            <Label htmlFor="marketId">OpenBook Market ID</Label>
                            <Input id="marketId" type="text" placeholder="Cole o Market ID do OpenBook" value={marketId} onChange={(e) => setMarketId(e.target.value)} required />
                            <p className={styles.fieldDescription}>
                                Um Market ID é necessário. Se você não tem um, pode criá-lo em plataformas como <a href="https://openbook-dex.org/market/create" target="_blank" rel="noopener noreferrer" className={styles.link}>OpenBook</a>.
                            </p>
                        </div>
                        <div className={styles.field}>
                            <Label htmlFor="baseMint">Endereço do seu Token (Base)</Label>
                            <Input id="baseMint" type="text" placeholder="Cole o endereço do seu token" value={baseMint} onChange={(e) => setBaseMint(e.target.value)} required />
                        </div>
                         <div className={styles.field}>
                            <Label htmlFor="baseAmount">Quantidade do seu Token</Label>
                            <Input id="baseAmount" type="number" placeholder="Ex: 1000000" value={baseAmount} onChange={(e) => setBaseAmount(e.target.value)} required min="0" />
                        </div>
                         <div className={styles.field}>
                            <Label htmlFor="quoteAmount">Quantidade de SOL (Cotação)</Label>
                            <Input id="quoteAmount" type="number" placeholder="Ex: 10" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} required min="0" />
                             <p className={styles.fieldDescription}>Esta será a liquidez inicial em SOL pareada com o seu token.</p>
                        </div>

                        <Button type="submit" disabled={isLoading || !baseMint || !baseAmount || !quoteAmount || !marketId}>
                            {isLoading ? 'Criando Pool...' : `Criar Pool de Liquidez (Custo: ${"0.1"} SOL + taxas)`}
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
