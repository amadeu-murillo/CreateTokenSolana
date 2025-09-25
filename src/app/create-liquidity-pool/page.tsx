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

// Ícones SVG para o guia
const BookOpen = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const TokenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></svg>;
const SolanaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/></svg>;
const RatioIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.25 21.25 2.75 2.75"/><path d="M2.75 21.25 21.25 2.75"/></svg>;

const tutorialSteps = [
    {
        icon: <BookOpen />,
        title: "OpenBook Market ID",
        description: "Para que seu token seja negociável, ele precisa de um 'mercado'. O Market ID é o endereço desse mercado. Se não tiver um, você pode criar facilmente em plataformas como OpenBook-DEX."
    },
    {
        icon: <TokenIcon />,
        title: "Seu Token (Base)",
        description: "Este é o endereço do token que você criou. Ele será o token 'base' no par de negociação, por exemplo, MEU-SOL."
    },
    {
        icon: <SolanaIcon />,
        title: "SOL (Cotação)",
        description: "O SOL (Wrapped SOL) será o token de 'cotação', usado para comprar e vender o seu token. A plataforma preenche isso automaticamente para você."
    },
    {
        icon: <RatioIcon />,
        title: "Liquidez Inicial",
        description: "A proporção entre a quantidade do seu token e a quantidade de SOL definirá o preço inicial. Ex: 1.000.000 MEU e 10 SOL estabelece o preço inicial."
    }
];

export default function CreateLiquidityPoolPage() {
    const searchParams = useSearchParams();
    const [baseMint, setBaseMint] = useState(searchParams.get('mint') || '');
    const [baseAmount, setBaseAmount] = useState('');
    const [quoteAmount, setQuoteAmount] = useState('');
    const [marketId, setMarketId] = useState('');

    const { createLiquidityPool, isLoading, error, signature } = useCreateLiquidityPool();
    
    const quoteMint = useMemo(() => NATIVE_MINT.toBase58(), []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!baseMint || !baseAmount || !quoteAmount || !marketId) {
            alert("Por favor, preencha todos os campos.");
            return;
        }
        await createLiquidityPool({
            baseMint,
            quoteMint,
            baseAmount: Number(baseAmount),
            quoteAmount: Number(quoteAmount),
            marketId,
        });
    };

    return (
        <div className={styles.grid}>
            <div className={styles.formContainer}>
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
                                {isLoading ? 'Criando Pool...' : `Criar Pool de Liquidez (Custo: ~0.1 SOL + taxas)`}
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
            <div className={styles.sidebar}>
                <h3 className={styles.sidebarTitle}>Guia de Preenchimento</h3>
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
