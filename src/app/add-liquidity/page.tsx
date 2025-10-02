// src/app/add-liquidity/page.tsx
"use client";

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "./AddLiquidity.module.css";
import Notification from '@/components/ui/Notification';
import {type Amm } from '@/lib/idl/amm';

export default function AddLiquidityPage() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    const [baseTokenMint, setBaseTokenMint] = useState('');
    const [baseTokenDecimals, setBaseTokenDecimals] = useState(9);
    const [baseTokenAmount, setBaseTokenAmount] = useState('');
    const [solAmount, setSolAmount] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [signature, setSignature] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!publicKey || !sendTransaction) {
            setFeedback({ type: 'error', message: 'Por favor, conecte sua carteira primeiro.' });
            return;
        }

        setIsLoading(true);
        setFeedback(null);
        setSignature('');

        try {
            const response = await fetch('/api/add-liquidity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    baseTokenMint,
                    baseTokenDecimals: Number(baseTokenDecimals),
                    initialBaseTokenAmount: parseFloat(baseTokenAmount),
                    initialSolAmount: parseFloat(solAmount),
                    userWalletAddress: publicKey.toBase58(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Falha ao construir a transação.');
            }

            const transaction = VersionedTransaction.deserialize(bs58.decode(data.transaction));
            
            // A transação já vem parcialmente assinada do backend
            const txSignature = await sendTransaction(transaction, connection);
            await connection.confirmTransaction(txSignature, 'confirmed');
            setSignature(txSignature);
            
            setFeedback({
                type: 'success',
                message: `Pool de liquidez criado com sucesso! AMM ID: ${data.ammId}`,
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            setFeedback({ type: 'error', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.grid}>
                <div className={styles.formContainer}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Criar Pool de Liquidez</CardTitle>
                            <CardDescription>
                                Crie um novo pool AMM (Token/SOL) com o nosso programa.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <Label htmlFor="baseTokenMint">Endereço do Mint do Token</Label>
                                    <Input id="baseTokenMint" value={baseTokenMint} onChange={(e) => setBaseTokenMint(e.target.value)} placeholder="Ex: 8m...G5" required />
                                </div>
                                <div className={styles.formGroup}>
                                    <Label htmlFor="baseTokenDecimals">Decimais do Token</Label>
                                    <Input id="baseTokenDecimals" type="number" value={baseTokenDecimals} onChange={(e) => setBaseTokenDecimals(parseInt(e.target.value))} required />
                                </div>
                                <div className={styles.formGroup}>
                                    <Label htmlFor="baseTokenAmount">Quantidade de Tokens (Lado Base)</Label>
                                    <Input id="baseTokenAmount" type="number" value={baseTokenAmount} onChange={(e) => setBaseTokenAmount(e.target.value)} placeholder="Ex: 1000000" required />
                                </div>
                                <div className={styles.formGroup}>
                                    <Label htmlFor="solAmount">Quantidade de SOL (Lado Cotação)</Label>
                                    <Input id="solAmount" type="number" value={solAmount} onChange={(e) => setSolAmount(e.target.value)} placeholder="Ex: 10" required />
                                </div>
                                <Button type="submit" disabled={!publicKey || isLoading}>
                                    {isLoading ? 'Criando Pool...' : 'Criar Pool de Liquidez'}
                                </Button>
                            </form>
                            
                            {feedback && (
                                <Notification
                                    message={feedback.message}
                                    type={feedback.type}
                                    onClose={() => setFeedback(null)}
                                    txId={signature}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
                <aside className={styles.sidebar}>
                     <h3 className={styles.sidebarTitle}>Como funciona?</h3>
                     <Card className={styles.tutorialCard}>
                        <CardContent className={styles.tutorialCardContent}>
                             <div className={styles.tutorialText}>
                                <p className={styles.tutorialTitle}>Preço e Liquidez</p>
                                <p className={styles.tutorialDescription}>
                                    O preço inicial do seu token será definido pela proporção entre a quantidade de tokens e a quantidade de SOL que você depositar.
                                    Ex: 1.000.000 tokens e 10 SOL resulta em um preço inicial de 0.00001 SOL por token.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    );
}

// Type for the IDL
export type AmmType = Amm;

