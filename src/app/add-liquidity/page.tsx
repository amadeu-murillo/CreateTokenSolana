// src/app/add-liquidity/page.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "./AddLiquidity.module.css";
import Notification from '@/components/ui/Notification';
import { TokenSelector } from '@/components/TokenSelector';
import { useUserTokens } from '@/hooks/useUserTokens';
import { SERVICE_FEE_CREATE_LP_SOL } from '@/lib/constants';

// Ícones para a seção de ajuda
const IconInfo = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;

export default function AddLiquidityPage() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const { tokens: userTokens, isLoading: isLoadingUserTokens } = useUserTokens();

    const [selectedTokenMint, setSelectedTokenMint] = useState('');
    const [baseTokenAmount, setBaseTokenAmount] = useState('');
    const [solAmount, setSolAmount] = useState('');
    const [solBalance, setSolBalance] = useState(0);
    
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string; txId?: string } | null>(null);

    const selectedToken = useMemo(() => userTokens.find(t => t.mint === selectedTokenMint) || null, [userTokens, selectedTokenMint]);

    useEffect(() => {
        const fetchSolBalance = async () => {
            if (publicKey) {
                const balance = await connection.getBalance(publicKey);
                setSolBalance(balance / LAMPORTS_PER_SOL);
            }
        };
        fetchSolBalance();
    }, [publicKey, connection]);

    const handleSetMax = (type: 'token' | 'sol') => {
        if (type === 'token' && selectedToken) {
            setBaseTokenAmount(selectedToken.amount);
        }
        if (type === 'sol') {
            // Deixar uma pequena margem para taxas de transação
            const margin = 0.01;
            const maxSol = solBalance > SERVICE_FEE_CREATE_LP_SOL + margin 
                ? solBalance - SERVICE_FEE_CREATE_LP_SOL - margin 
                : 0;
            setSolAmount(maxSol.toFixed(4));
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!publicKey || !sendTransaction || !selectedToken) {
            setFeedback({ type: 'error', message: 'Por favor, conecte sua carteira e selecione um token.' });
            return;
        }

        setIsLoading(true);
        setFeedback(null);

        try {
            const payload = {
                baseTokenMint: selectedToken.mint,
                baseTokenDecimals: selectedToken.decimals,
                initialBaseTokenAmount: parseFloat(baseTokenAmount),
                initialSolAmount: parseFloat(solAmount),
                userWalletAddress: publicKey.toBase58(),
            };

            const response = await fetch('/api/add-liquidity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Falha ao construir a transação no backend.');
            }
            
            const transactionBuffer = Buffer.from(data.transaction, 'base64');
            const transaction = VersionedTransaction.deserialize(transactionBuffer);
            
            const txSignature = await sendTransaction(transaction, connection);
            
            await connection.confirmTransaction(txSignature, 'confirmed');
            
            setFeedback({
                type: 'success',
                message: `Pool de liquidez criado com sucesso! AMM ID: ${data.ammId}`,
                txId: txSignature
            });

            // Reset form
            setSelectedTokenMint('');
            setBaseTokenAmount('');
            setSolAmount('');
            // refetch sol balance
            const balance = await connection.getBalance(publicKey);
            setSolBalance(balance / LAMPORTS_PER_SOL);

        } catch (error: any) {
            const errorMessage = error.message || 'Ocorreu um erro desconhecido.';
            setFeedback({ type: 'error', message: `Erro: ${errorMessage}` });
        } finally {
            setIsLoading(false);
        }
    };

    const isButtonDisabled = !publicKey || isLoading || !selectedToken || !baseTokenAmount || !solAmount;

    return (
        <div className={styles.pageContainer}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Adicionar Liquidez</h1>
                <p className={styles.pageDescription}>
                    Crie um novo pool de liquidez (Token/SOL) para permitir que seu token seja negociado.
                </p>
            </header>

            <div className={styles.container}>
                <Card className={styles.actionCard}>
                    <form onSubmit={handleSubmit}>
                        <CardContent className={styles.cardContent}>
                             {feedback && (
                                <Notification
                                    message={feedback.message}
                                    type={feedback.type}
                                    onClose={() => setFeedback(null)}
                                    txId={feedback.txId}
                                />
                            )}
                            <div className={styles.inputGroup}>
                                <Label htmlFor="token-select">Selecione o Token</Label>
                                <TokenSelector
                                    tokens={userTokens}
                                    selectedTokenMint={selectedTokenMint}
                                    onSelectToken={setSelectedTokenMint}
                                    isLoading={isLoadingUserTokens}
                                    disabled={isLoading}
                                />
                            </div>
                            
                            <div className={styles.inputGroup}>
                                <div className={styles.labelContainer}>
                                    <Label htmlFor="baseTokenAmount">Quantidade de Tokens</Label>
                                    {selectedToken && <span className={styles.balance}>Saldo: {parseFloat(selectedToken.amount).toLocaleString()}</span>}
                                </div>
                                <div className={styles.amountInputContainer}>
                                    <Input 
                                      id="baseTokenAmount" 
                                      type="number" 
                                      value={baseTokenAmount} 
                                      onChange={(e) => setBaseTokenAmount(e.target.value)} 
                                      placeholder="Ex: 1000000" 
                                      required 
                                      disabled={!selectedToken || isLoading}
                                    />
                                    <Button type="button" onClick={() => handleSetMax('token')} className={styles.maxButton1} disabled={!selectedToken || isLoading}>
                                        MAX
                                    </Button>
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                 <div className={styles.labelContainer}>
                                    <Label htmlFor="solAmount">Quantidade de SOL</Label>
                                    <span className={styles.balance}>Saldo: {solBalance.toFixed(4)} SOL</span>
                                </div>
                                <div className={styles.amountInputContainer}>
                                    <Input 
                                      id="solAmount" 
                                      type="number" 
                                      value={solAmount} 
                                      onChange={(e) => setSolAmount(e.target.value)} 
                                      placeholder="Ex: 10" 
                                      required 
                                      disabled={!publicKey || isLoading}
                                    />
                                     <Button type="button" onClick={() => handleSetMax('sol')} className={styles.maxButton1} disabled={!publicKey || isLoading}>
                                        MAX
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isButtonDisabled} className="w-full">
                                {isLoading ? 'A criar pool...' : `Criar Pool de Liquidez (Taxa: ${SERVICE_FEE_CREATE_LP_SOL} SOL)`}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <aside className={styles.infoCard}>
                     <Card>
                         <CardHeader>
                            <CardTitle className={styles.sidebarTitle}>Como funciona?</CardTitle>
                         </CardHeader>
                         <CardContent>
                             <div className={styles.infoBox}>
                                <IconInfo />
                                <span>
                                    O preço inicial do seu token será definido pela proporção entre a quantidade de tokens e a quantidade de SOL que você depositar.
                                    Ex: 1.000.000 tokens e 10 SOL resulta em um preço inicial de 0.00001 SOL por token.
                                </span>
                             </div>
                         </CardContent>
                     </Card>
                </aside>
            </div>
        </div>
    );
}
