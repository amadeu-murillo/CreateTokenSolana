// src/app/create-liquidity-pool/page.tsx
"use client";

import { useState, useEffect } from "react";
import { NATIVE_MINT } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import styles from "./CreateLiquidityPool.module.css";

// Hooks e sua constante de taxa
import { useCreateLiquidityPool } from "@/hooks/useCreateLiquidityPool";
import { useCreateMarket } from "@/hooks/useCreateMarket";
import { useUserTokens } from "@/hooks/useUserTokens";
import { SERVICE_FEE_CREATE_LP_SOL } from "@/lib/constants";

// Componentes de UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TokenSelector } from "@/components/TokenSelector";

// Custo estimado em SOL para a criação do Market ID (Rent)
const MARKET_CREATION_RENT_SOL = 0.35;
// O custo total agora usa a sua constante de taxa
const TOTAL_FEE = MARKET_CREATION_RENT_SOL + SERVICE_FEE_CREATE_LP_SOL;

export default function CreateLiquidityPoolPage() {
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

    // Busca o saldo de SOL do usuário
    useEffect(() => {
        if (publicKey) {
            connection.getBalance(publicKey).then(balance => {
                setSolBalance(balance / 1_000_000_000); // Converte lamports para SOL
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
    const isSuccess = !!signature;

    return (
        <div className={styles.container}>
            <Card className={styles.actionCard}>
                <CardHeader>
                    <CardTitle>Configurar Pool de Liquidez</CardTitle>
                    <CardDescription>
                        Selecione o token e as quantidades para iniciar.
                    </CardDescription>
                </CardHeader>
                <CardContent className={styles.cardContent}>
                    <div className={styles.inputGroup}>
                        <Label>Selecione seu Token</Label>
                        <TokenSelector 
                            tokens={tokens} 
                            selectedTokenMint={selectedTokenMint} 
                            onSelectToken={(mint) => {
                                setSelectedTokenMint(mint);
                                setBaseTokenAmount(''); // Limpa a quantidade ao trocar de token
                            }} 
                            isLoading={isLoadingTokens} 
                            disabled={isLoading} 
                        />
                    </div>
                    {selectedToken && (
                        <div className={styles.inputGroup}>
                             <div className={styles.amountHeader}>
                                <Label htmlFor="base-amount">Quantidade do Seu Token (Base)</Label>
                                <span className={styles.balance}>Saldo: {selectedToken.amount} {selectedToken.symbol}</span>
                            </div>
                            <div className={styles.amountInputContainer}>
                                <Input id="base-amount" type="number" value={baseTokenAmount} onChange={(e) => setBaseTokenAmount(e.target.value)} placeholder="Ex: 10000" disabled={isLoading} />
                                <Button type="button" onClick={handleSetMaxBaseAmount} className={styles.maxButton}>MAX</Button>
                            </div>
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <div className={styles.amountHeader}>
                            <Label htmlFor="quote-amount">Quantidade de SOL (Quote)</Label>
                            {solBalance !== null && <span className={styles.balance}>Saldo: {solBalance.toFixed(4)} SOL</span>}
                        </div>
                        <Input id="quote-amount" type="number" value={quoteTokenAmount} onChange={(e) => setQuoteTokenAmount(e.target.value)} placeholder="Ex: 10" disabled={isLoading} />
                    </div>
                </CardContent>
                <CardFooter className="flex-col items-start gap-4">
                    <Button onClick={handleCreatePool} disabled={isLoading || !selectedTokenMint || !baseTokenAmount || !quoteTokenAmount} className="w-full">
                        {isLoading ? "Processando..." : `Criar Pool ~${TOTAL_FEE.toFixed(4)} SOL`}
                    </Button>
                    {statusMessage && !isSuccess && !error && <p className={`${styles.message} ${styles.status}`}>{statusMessage}</p>}
                    {error && <p className={`${styles.message} ${styles.error}`}>{error}</p>}
                    {isSuccess && ( <p className={`${styles.message} ${styles.success}`}> Pool criado com sucesso! <a href={`https://solscan.io/tx/${signature}`} target="_blank" rel="noopener noreferrer" className={styles.link}>Ver transação</a> </p> )}
                </CardFooter>
            </Card>
            
            <Card className={styles.infoCard}>
                <CardHeader>
                    <CardTitle>Como Funciona?</CardTitle>
                    <CardDescription>Automatize a criação de liquidez em poucos cliques.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className={styles.featureList}>
                        <li><span>1.</span> Selecione um token da sua carteira.</li>
                        <li><span>2.</span> Defina a liquidez inicial (o par sempre será com SOL).</li>
                        <li><span>3.</span> A ferramenta criará o OpenBook Market ID e o Pool de Liquidez na Raydium automaticamente.</li>
                        <li><span>4.</span> Após a confirmação, seu token estará pronto para ser negociado!</li>
                    </ul>
                    <p className={styles.infoText}>O "Custo Total Estimado" refere-se apenas à criação do mercado. A liquidez que você adiciona (Seu Token + SOL) continua sendo sua.</p>
                </CardContent>
            </Card>
        </div>
    );
}