"use client";

import { useState, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "./AddLiquidity.module.css";
import Notification from '@/components/ui/Notification';
import { TokenSelector } from '@/components/TokenSelector';
import { useUserTokens } from '@/hooks/useUserTokens';
import { SERVICE_FEE_CREATE_LP_SOL } from '@/lib/constants';

const IconInfo = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;

export default function AddLiquidityPage() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const { tokens: userTokens, isLoading: isLoadingUserTokens } = useUserTokens();

    const [selectedTokenMint, setSelectedTokenMint] = useState('');
    const [tokenAmount, setTokenAmount] = useState('');
    const [solAmount, setSolAmount] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string; poolAddress?: string, txId?: string } | null>(null);

    const selectedToken = useMemo(() => userTokens.find(t => t.mint === selectedTokenMint) || null, [userTokens, selectedTokenMint]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!publicKey || !sendTransaction || !selectedToken) {
            setFeedback({ type: 'error', message: 'Por favor, conecte a carteira e preencha todos os campos.' });
            return;
        }

        setIsLoading(true);
        setFeedback(null);

        try {
            const payload = {
                userWalletAddress: publicKey.toBase58(),
                baseTokenMint: selectedToken.mint,
                baseTokenDecimals: selectedToken.decimals,
                initialBaseTokenAmount: Number(tokenAmount),
                initialSolAmount: Number(solAmount),
            };

            const response = await fetch('/api/create-liquidity-pool', {
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
            
            setFeedback({ type: 'info', message: 'Aguardando confirmação da transação...' });
            
            await connection.confirmTransaction(txSignature, 'confirmed');
            
            setFeedback({
                type: 'success',
                message: `Pool de liquidez criado com sucesso na Meteora!`,
                poolAddress: data.poolAddress,
                txId: txSignature
            });

        } catch (error: any) {
            const errorMessage = error.message || 'Ocorreu um erro desconhecido.';
            setFeedback({ type: 'error', message: `Erro: ${errorMessage}` });
        } finally {
            setIsLoading(false);
        }
    };
    
    const isButtonDisabled = !publicKey || isLoading || !selectedToken || !tokenAmount || !solAmount;

    return (
        <div className={styles.pageContainer}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Criar Pool de Liquidez</h1>
                <p className={styles.pageDescription}>
                    Crie um novo pool de liquidez (Token/SOL) na Meteora para permitir que seu token seja negociado.
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
                            {feedback?.type === 'success' && feedback.poolAddress && (
                                <a href={`https://app.meteora.ag/dlmm/${feedback.poolAddress}`} target="_blank" rel="noopener noreferrer" className={styles.link}>
                                    Ver pool na Meteora
                                </a>
                            )}
                            <div className={styles.inputGroup}>
                                <Label htmlFor="token-select">Seu Token</Label>
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
                                    <Label htmlFor="tokenAmount">Quantidade de {selectedToken?.symbol || 'Tokens'} a depositar</Label>
                                    {selectedToken && <span className={styles.balance}>Saldo: {parseFloat(selectedToken.amount).toLocaleString()}</span>}
                                </div>
                                <div className={styles.amountInputContainer}>
                                    <Input id="tokenAmount" type="number" value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)} placeholder="Ex: 1000000" required disabled={!selectedToken || isLoading} />
                                    {selectedToken && (
                                        <Button type="button" onClick={() => setTokenAmount(selectedToken.amount)} className={styles.maxButton1} disabled={isLoading}>
                                            MAX
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <Label htmlFor="solAmount">Quantidade de SOL a depositar</Label>
                                <Input id="solAmount" type="number" value={solAmount} onChange={(e) => setSolAmount(e.target.value)} placeholder="Ex: 10" required disabled={isLoading} />
                            </div>
                        </CardContent>
                        <CardFooter className={styles.cardFooter}>
                            <Button type="submit" disabled={isButtonDisabled} className="w-full">
                                {isLoading ? 'Criando pool...' : `Criar Pool na Meteora (Taxa: ${SERVICE_FEE_CREATE_LP_SOL} SOL + Custo de Rede)`}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <aside className={styles.infoCard}>
                     <Card>
                         <CardHeader>
                            <CardTitle className={styles.sidebarTitle}>Como Funciona</CardTitle>
                         </CardHeader>
                         <CardContent>
                             <div className={styles.infoBox}>
                                <IconInfo />
                                <span>
                                    Este processo criará um pool de liquidez dinâmico (DLMM) na Meteora. A proporção inicial de tokens e SOL que você depositar definirá o preço inicial do seu token.
                                </span>
                             </div>
                         </CardContent>
                     </Card>
                </aside>
            </div>
        </div>
    );
}
