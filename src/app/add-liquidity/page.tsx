// src/app/add-liquidity/page.tsx
"use client";

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
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
        console.log("LOG: A função handleSubmit foi acionada.");

        if (!publicKey || !sendTransaction) {
            const errorMsg = 'Por favor, conecte sua carteira primeiro.';
            console.error("LOG: Erro de pré-condição:", errorMsg);
            setFeedback({ type: 'error', message: errorMsg });
            return;
        }

        setIsLoading(true);
        setFeedback(null);
        setSignature('');

        try {
            const payload = {
                baseTokenMint,
                baseTokenDecimals: Number(baseTokenDecimals),
                initialBaseTokenAmount: parseFloat(baseTokenAmount),
                initialSolAmount: parseFloat(solAmount),
                userWalletAddress: publicKey.toBase58(),
            };
            console.log("LOG: Enviando payload para /api/add-liquidity:", JSON.stringify(payload, null, 2));

            const response = await fetch('/api/add-liquidity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            
            console.log(`LOG: Resposta da API recebida com status: ${response.status} ${response.statusText}`);

            const data = await response.json();
            console.log("LOG: Dados da resposta (JSON):", data);

            if (!response.ok) {
                throw new Error(data.error || 'Falha ao construir a transação no backend.');
            }

            if (!data.transaction) {
                 throw new Error("O backend não retornou uma transação serializada.");
            }
            
            console.log("LOG: Transação (base64) recebida do backend:", data.transaction);

            const transactionBuffer = Buffer.from(data.transaction, 'base64');
            const transaction = VersionedTransaction.deserialize(transactionBuffer);
            
            console.log("LOG: Transação deserializada com sucesso. Objeto da transação:", transaction);
            console.log("LOG: Assinaturas presentes na transação (antes de enviar para a carteira):", transaction.signatures);

            // A linha a seguir é onde o erro original ocorre.
            console.log("LOG: Enviando transação para a carteira para assinatura e envio...");
            const txSignature = await sendTransaction(transaction, connection);
            
            console.log("LOG: Transação enviada com sucesso. Assinatura:", txSignature);

            console.log("LOG: Aguardando confirmação da transação...");
            await connection.confirmTransaction(txSignature, 'confirmed');
            console.log("LOG: Transação confirmada com sucesso.");
            
            setSignature(txSignature);
            
            setFeedback({
                type: 'success',
                message: `Pool de liquidez criado com sucesso! AMM ID: ${data.ammId}`,
            });

        } catch (error: any) {
            // Log detalhado do erro capturado no frontend.
            console.error("--- ERRO DETALHADO NO HANDLESUBMIT (CLIENT-SIDE) ---");
            console.error("Tipo de Erro:", error?.constructor?.name);
            console.error("Mensagem do Erro:", error.message);
            console.error("Stack do Erro:", error.stack);
            // Alguns erros de carteira têm informações adicionais
            if (error.logs) {
                console.error("Logs da transação (se disponíveis):", error.logs);
            }
            console.error("Objeto completo do erro:", JSON.stringify(error, null, 2));
            console.error("--- FIM DO ERRO DETALHADO ---");

            const errorMessage = error.message || 'Ocorreu um erro desconhecido.';
            setFeedback({ type: 'error', message: `Erro: ${errorMessage}` });
        } finally {
            setIsLoading(false);
            console.log("LOG: A execução de handleSubmit foi finalizada.");
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
