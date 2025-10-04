"use client";

import { useState, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "./AddLiquidity.module.css";
import Notification from '@/components/ui/Notification';
import { useUserTokens } from '@/hooks/useUserTokens';
import { TokenSelector } from '@/components/TokenSelector';
import { orcaLiquidityService } from '@/lib/services/orcaWhirlpoolService';

export default function AddLiquidityPage() {
    const { connection } = useConnection();
    const { wallet, publicKey } = useWallet();
    const { tokens: userTokens, isLoading: isLoadingUserTokens } = useUserTokens();

    // Estados do formulário
    const [selectedTokenMint, setSelectedTokenMint] = useState('');
    const [tokenAmount, setTokenAmount] = useState('');
    const [solAmount, setSolAmount] = useState('');
    const [lowerPrice, setLowerPrice] = useState('');
    const [upperPrice, setUpperPrice] = useState('');
    
    // Estados de controle da UI
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [signature, setSignature] = useState('');

    const selectedToken = useMemo(() => userTokens.find(t => t.mint === selectedTokenMint), [userTokens, selectedTokenMint]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!wallet || !publicKey || !selectedToken) {
            setFeedback({ type: 'error', message: 'Por favor, conecte sua carteira e selecione um token.' });
            return;
        }

        setIsLoading(true);
        setFeedback(null);
        setSignature('');

        try {
            setStatusMessage('Encontrando o pool de liquidez...');
            const poolAddress = await orcaLiquidityService.findPoolAddressForTokens(selectedToken.mint);

            if (!poolAddress) {
                throw new Error(`Não foi encontrado um pool de liquidez SOL para o token ${selectedToken.symbol}.`);
            }
            setStatusMessage('Pool encontrado. Criando a transação...');

            const result = await orcaLiquidityService.addLiquidity(wallet, connection, {
                poolAddress,
                tokenMint: selectedToken.mint,
                tokenAmount: parseFloat(tokenAmount),
                solAmount: parseFloat(solAmount),
                lowerPrice: parseFloat(lowerPrice),
                upperPrice: parseFloat(upperPrice),
            });

            setSignature(result.transactionSignature);
            setFeedback({
                type: 'success',
                message: `Posição de liquidez criada com sucesso! NFT da Posição: ${result.positionNftMint}`,
            });

        } catch (error: any) {
            setFeedback({ type: 'error', message: `Erro: ${error.message}` });
        } finally {
            setIsLoading(false);
            setStatusMessage('');
        }
    };

    return (
        <div className={styles.pageContainer}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Adicionar Liquidez (Token/SOL)</h1>
                <p className={styles.pageDescription}>
                    Selecione um token da sua carteira para prover liquidez em um par com SOL.
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
                                    txId={signature}
                                />
                            )}
                            
                            <div className={styles.inputGroup}>
                                <Label htmlFor="token-select">Selecione o seu Token</Label>
                                <TokenSelector
                                    tokens={userTokens}
                                    selectedTokenMint={selectedTokenMint}
                                    onSelectToken={setSelectedTokenMint}
                                    isLoading={isLoadingUserTokens}
                                    disabled={isLoading}
                                />
                            </div>

                            {selectedToken && (
                                <>
                                    <div className={styles.inputGroup}>
                                        <div className={styles.labelContainer}>
                                            <Label htmlFor="tokenAmount">Quantidade de {selectedToken.symbol}</Label>
                                            <span className={styles.balance}>Saldo: {selectedToken.amount}</span>
                                        </div>
                                        <Input id="tokenAmount" type="number" value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)} placeholder={`Ex: 1000 ${selectedToken.symbol}`} required disabled={isLoading} />
                                    </div>
                                     <div className={styles.inputGroup}>
                                        <Label htmlFor="solAmount">Quantidade de SOL</Label>
                                        <Input id="solAmount" type="number" value={solAmount} onChange={(e) => setSolAmount(e.target.value)} placeholder="Ex: 10.5" required disabled={isLoading} />
                                    </div>
                                </>
                            )}


                            <div className={styles.inputGroup}>
                                <Label htmlFor="lowerPrice">Preço Mínimo (Faixa)</Label>
                                <Input id="lowerPrice" type="number" value={lowerPrice} onChange={(e) => setLowerPrice(e.target.value)} placeholder="Preço do token em SOL" required disabled={isLoading} />
                            </div>

                            <div className={styles.inputGroup}>
                                <Label htmlFor="upperPrice">Preço Máximo (Faixa)</Label>
                                <Input id="upperPrice" type="number" value={upperPrice} onChange={(e) => setUpperPrice(e.target.value)} placeholder="Preço do token em SOL" required disabled={isLoading} />
                            </div>
                        </CardContent>
                        <CardFooter className={styles.cardFooter}>
                             <Button type="submit" disabled={isLoading || !publicKey || !selectedToken} className="w-full">
                                {isLoading ? statusMessage || 'Processando...' : 'Adicionar Liquidez'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
                <aside className={styles.sidebar}>
                   <Card className={styles.infoCard}>
                         <CardHeader>
                            <CardTitle className={styles.sidebarTitle}>Como Funciona</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={styles.infoBox}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                <span>Esta ferramenta encontrará automaticamente o pool de liquidez Token/SOL correto na Orca. Se um pool não existir, a operação falhará.</span>
                            </div>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    );
}

