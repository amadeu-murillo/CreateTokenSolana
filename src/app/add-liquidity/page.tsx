"use client";

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCreateLiquidityPool } from '@/hooks/useCreateLiquidityPool';
import { useUserTokens } from '@/hooks/useUserTokens';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { TokenSelector } from '@/components/TokenSelector';
import Notification from '@/components/ui/Notification';
import styles from './AddLiquidity.module.css';

const IconZap = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;

const LiquidityFormComponent = () => {
    const searchParams = useSearchParams();
    const initialMint = searchParams.get('mint') || '';

    const [selectedTokenMint, setSelectedTokenMint] = useState(initialMint);
    const [baseAmount, setBaseAmount] = useState('');
    const [quoteAmount, setQuoteAmount] = useState('');
    const [binStep, setBinStep] = useState(20);

    const { createLiquidityPool, isLoading, error, reset } = useCreateLiquidityPool();
    const { tokens: userTokens, isLoading: isLoadingUserTokens } = useUserTokens();

    const selectedToken = useMemo(() => userTokens.find(t => t.mint === selectedTokenMint) || null, [userTokens, selectedTokenMint]);

    const handleSetMaxAmount = () => {
        if (selectedToken) {
            setBaseAmount(selectedToken.amount);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedToken) return;

        await createLiquidityPool({
            baseMint: selectedToken.mint,
            baseAmount: Number(baseAmount),
            quoteAmount: Number(quoteAmount),
            binStep,
        });
    };
    
    const price = (Number(quoteAmount) / Number(baseAmount)) || 0;

    return (
        <div className={styles.container}>
            <main className={styles.actionCard}>
                <Card>
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle>Criar Pool de Liquidez na Meteora</CardTitle>
                            <CardDescription>
                                Crie um mercado para o seu token pareando-o com SOL. Isto permitirá que outras pessoas o comprem e vendam.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className={styles.cardContent}>
                            {error && <Notification type="error" message={error} onClose={reset} />}
                             <div className={styles.inputGroup}>
                                <Label>Seu Token (Token Base)</Label>
                                <TokenSelector
                                    tokens={userTokens}
                                    selectedTokenMint={selectedTokenMint}
                                    onSelectToken={setSelectedTokenMint}
                                    isLoading={isLoadingUserTokens}
                                    disabled={isLoading}
                                />
                                {selectedToken && (
                                    <div className={styles.amountInputContainer}>
                                        <div className={styles.amountHeader}>
                                            <Label htmlFor="baseAmount">Quantidade do seu Token</Label>
                                            <span className={styles.balance}>Saldo: {parseFloat(selectedToken.amount).toLocaleString()}</span>
                                        </div>
                                        <div className={styles.inputWithButton}>
                                            <Input id="baseAmount" type="number" placeholder="Ex: 1000000" value={baseAmount} onChange={(e) => setBaseAmount(e.target.value)} required disabled={isLoading} className={styles.amountInput}/>
                                            <Button type="button" onClick={handleSetMaxAmount} className={styles.maxButton} disabled={isLoading}>MAX</Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={styles.inputGroup}>
                                <Label>Token de Cotação</Label>
                                <div className={styles.quoteDisplay}>
                                    <img src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png" alt="SOL" width={24} height={24} />
                                    <span>SOL (Solana)</span>
                                </div>
                                <div className={styles.amountInputContainer}>
                                     <div className={styles.amountHeader}>
                                        <Label htmlFor="quoteAmount">Quantidade de SOL</Label>
                                    </div>
                                    <Input id="quoteAmount" type="number" placeholder="Ex: 10" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} required disabled={isLoading} />
                                </div>
                            </div>
                            
                             <div className={styles.inputGroup}>
                                <Label>Volatilidade do Par (Bin Step)</Label>
                                <div className={styles.segmentedControl}>
                                    <button type="button" className={binStep === 10 ? styles.active : ''} onClick={() => setBinStep(10)}>Baixa</button>
                                    <button type="button" className={binStep === 25 ? styles.active : ''} onClick={() => setBinStep(25)}>Média</button>
                                    <button type="button" className={binStep === 50 ? styles.active : ''} onClick={() => setBinStep(50)}>Alta</button>
                                </div>
                                <p className={styles.fieldDescription}>"Baixa" para stablecoins, "Média" para pares comuns, "Alta" para tokens mais voláteis.</p>
                            </div>
                            
                            {price > 0 && (
                                <div className={styles.summary}>
                                    <p>Preço Inicial: <strong>1 {selectedToken?.symbol || 'Token'} ≈ {price.toExponential(6)} SOL</strong></p>
                                </div>
                            )}

                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isLoading || !selectedToken || !baseAmount || !quoteAmount} className="w-full">
                                {isLoading ? 'Criando Pool...' : `Criar Pool de Liquidez (Custo: ~0.25 SOL + taxas)`}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </main>
            <aside className={styles.infoCard}>
                 <Card>
                    <CardHeader>
                        <CardTitle className={styles.sidebarTitle}><IconZap /> O que é um Pool de Liquidez?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={styles.infoText}>
                            Um pool de liquidez é como um cofre com dois tipos de tokens. Ele permite que qualquer pessoa troque um token pelo outro a um preço determinado pela proporção dos tokens no cofre. Ao criar um, você está definindo o preço inicial do seu token e permitindo que ele seja negociado.
                        </p>
                    </CardContent>
                </Card>
            </aside>
        </div>
    );
}

export default function AddLiquidityPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <LiquidityFormComponent />
        </Suspense>
    )
}
