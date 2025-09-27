// src/app/add-liquidity/page.tsx
"use client";

import { useState, useEffect } from "react";
import { NATIVE_MINT } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import styles from "./AddLiquidity.module.css";

// Hooks
import { useCreateLiquidityPool } from "@/hooks/useCreateLiquidityPool";
import { useCreateMarket } from "@/hooks/useCreateMarket";
import { useUserTokens } from "@/hooks/useUserTokens";
import { SERVICE_FEE_CREATE_LP_SOL } from "@/lib/constants";

// Componentes
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TokenSelector } from "@/components/TokenSelector";
import Notification from "@/components/ui/Notification";

// Custo estimado em SOL para a criação do Market ID (Rent)
const MARKET_CREATION_RENT_SOL = 0.35;
const TOTAL_FEE = MARKET_CREATION_RENT_SOL + SERVICE_FEE_CREATE_LP_SOL;

// Ícones SVG para o tutorial
const IconLayers = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>;
const IconPlusCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>;
const IconZap = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>

const tutorialSteps = [
    {
        icon: <IconLayers />,
        title: "Criação do Market ID",
        description: "Um OpenBook Market ID é necessário para que a Raydium possa criar o pool. Faremos isso por você."
    },
    {
        icon: <IconPlusCircle />,
        title: "Adicionar Liquidez",
        description: "Você define a quantidade inicial do seu token e de SOL. Essa liquidez inicial determinará o preço de partida."
    },
    {
        icon: <IconZap />,
        title: "Lançamento Imediato",
        description: "Após a confirmação, o pool é criado e seu token fica instantaneamente disponível para negociação na Raydium."
    }
];

export default function AddLiquidityPage() {
    const [selectedTokenMint, setSelectedTokenMint] = useState("");
    const [baseTokenAmount, setBaseTokenAmount] = useState("");
    const [quoteTokenAmount, setQuoteTokenAmount] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [solBalance, setSolBalance] = useState<number | null>(null);

    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const { tokens, isLoading: isLoadingTokens } = useUserTokens();
    const { createMarket, isLoading: isCreatingMarket, error: marketError } = useCreateMarket();
    const { createLiquidityPool, isLoading: isCreatingPool, error: poolError, signature } = useCreateLiquidityPool();

    useEffect(() => {
        if (publicKey) {
            connection.getBalance(publicKey).then(balance => {
                setSolBalance(balance / 1_000_000_000);
            });
        }
    }, [publicKey, connection]);

    const selectedToken = tokens.find(t => t.mint === selectedTokenMint);

    const handleSetMaxBaseAmount = () => {
        if (selectedToken) {
            setBaseTokenAmount(selectedToken.amount);
        }
    };

    const handleCreatePool = async () => {
        if (!selectedTokenMint || !baseTokenAmount || !quoteTokenAmount) {
            setStatusMessage("Por favor, preencha todos os campos.");
            return;
        }
        if (!selectedToken) {
            setStatusMessage("Token selecionado não encontrado na sua carteira.");
            return;
        }
        if (parseFloat(baseTokenAmount) > parseFloat(selectedToken.amount)) {
            setStatusMessage(`A quantidade do token excede seu saldo de ${parseFloat(selectedToken.amount).toLocaleString()} ${selectedToken.symbol}.`);
            return;
        }

        setStatusMessage("Passo 1: Criando o OpenBook Market...");
        const marketId = await createMarket(selectedTokenMint, NATIVE_MINT.toBase58(), selectedToken.decimals);

        if (marketId) {
            setStatusMessage("Passo 2: Adicionando liquidez ao pool...");
            await createLiquidityPool({
                marketId,
                baseAmount: parseFloat(baseTokenAmount),
                quoteAmount: parseFloat(quoteTokenAmount),
                baseMint: selectedTokenMint,
                quoteMint: NATIVE_MINT.toBase58()
            });
            setStatusMessage("Processo iniciado. Verificando a transação...");
        } else {
            setStatusMessage("Falha ao criar o OpenBook Market. Verifique o console para mais detalhes.");
        }
    };

    const isLoading = isCreatingMarket || isCreatingPool;
    const error = marketError || poolError;

    const clearNotifications = () => {
        // Esta função pode ser usada para limpar erros se necessário
    };

    return (
        <div className={styles.grid}>
            <div className={styles.formContainer}>
                <Card>
                    <CardHeader>
                        <CardTitle>Adicionar Liquidez</CardTitle>
                        <CardDescription>
                            Crie um novo pool de liquidez na Raydium para o seu token. O par será sempre com SOL.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className={styles.cardContent}>
                        {error && <Notification type="error" message={error} onClose={clearNotifications} />}
                        {signature && <Notification type="success" message="Pool de liquidez criado com sucesso!" txId={signature} onClose={clearNotifications} />}
                        {!signature && !error && statusMessage && <Notification type="info" message={statusMessage} onClose={clearNotifications} />}

                        <div className={styles.inputGroup}>
                            <Label>Selecione seu Token</Label>
                            <TokenSelector 
                                tokens={tokens} 
                                selectedTokenMint={selectedTokenMint} 
                                onSelectToken={(mint) => {
                                    setSelectedTokenMint(mint);
                                    setBaseTokenAmount('');
                                }} 
                                isLoading={isLoadingTokens} 
                                disabled={isLoading} 
                            />
                        </div>

                        {selectedToken && (
                            <div className={styles.inputGroup}>
                                 <div className={styles.amountHeader}>
                                    <Label htmlFor="base-amount">Quantidade de {selectedToken.symbol || 'Token'}</Label>
                                    <span className={styles.balance}>Saldo: {parseFloat(selectedToken.amount).toLocaleString()}</span>
                                </div>
                                <div className={styles.amountInputContainer}>
                                    <Input 
                                        id="base-amount" 
                                        type="number" 
                                        value={baseTokenAmount} 
                                        onChange={(e) => setBaseTokenAmount(e.target.value)} 
                                        placeholder="Ex: 10000" 
                                        disabled={isLoading}
                                        className={styles.inputWithButton}
                                    />
                                    <Button type="button" onClick={handleSetMaxBaseAmount} className={styles.maxButton}>MAX</Button>
                                </div>
                            </div>
                        )}

                        <div className={styles.inputGroup}>
                            <div className={styles.amountHeader}>
                                <Label htmlFor="quote-amount">Quantidade de SOL</Label>
                                {solBalance !== null && <span className={styles.balance}>Saldo: {solBalance.toFixed(4)}</span>}
                            </div>
                            <Input id="quote-amount" type="number" value={quoteTokenAmount} onChange={(e) => setQuoteTokenAmount(e.target.value)} placeholder="Ex: 10" disabled={isLoading} />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleCreatePool} disabled={isLoading || !selectedTokenMint || !baseTokenAmount || !quoteTokenAmount} className="w-full">
                            {isLoading ? "Processando..." : `Criar Pool e Adicionar Liquidez (~${TOTAL_FEE.toFixed(4)} SOL)`}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            <div className={styles.sidebar}>
                <h3 className={styles.sidebarTitle}>Como Funciona?</h3>
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