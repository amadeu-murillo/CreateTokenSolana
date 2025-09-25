// src/app/create-liquidity-pool/page.tsx
"use client";

import { useState } from "react";
import { NATIVE_MINT } from "@solana/spl-token";
import styles from "./CreateLiquidityPool.module.css";

// Hooks e sua constante de taxa
import { useCreateLiquidityPool } from "@/hooks/useCreateLiquidityPool";
import { useCreateMarket } from "@/hooks/useCreateMarket";
import { useUserTokens } from "@/hooks/useUserTokens";
import { SERVICE_FEE_CREATE_LP_SOL } from "@/lib/constants"; // Usando sua constante

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

    const { tokens, isLoading: isLoadingTokens } = useUserTokens();
    const { createMarket, isLoading: isCreatingMarket, error: marketError } = useCreateMarket();
    const { createLiquidityPool, isLoading: isCreatingPool, error: poolError, signature } = useCreateLiquidityPool();

    const handleCreatePool = async () => {
        if (!selectedTokenMint || !baseTokenAmount || !quoteTokenAmount) { setStatusMessage("Por favor, preencha todos os campos."); return; }
        const selectedToken = tokens.find(t => t.mint === selectedTokenMint);
        if (!selectedToken) { setStatusMessage("Token selecionado não encontrado na sua carteira."); return; }
        setStatusMessage("Passo 1: Criando o OpenBook Market...");
        const marketId = await createMarket(selectedTokenMint, NATIVE_MINT.toBase58(), selectedToken.decimals);
        if (marketId) {
            setStatusMessage("Passo 2: Adicionando liquidez ao pool...");
            await createLiquidityPool({ marketId, baseAmount: parseFloat(baseTokenAmount), quoteAmount: parseFloat(quoteTokenAmount), baseMint: selectedTokenMint, quoteMint: NATIVE_MINT.toBase58() });
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
                        <TokenSelector tokens={tokens} selectedTokenMint={selectedTokenMint} onSelectToken={setSelectedTokenMint} isLoading={isLoadingTokens} disabled={isLoading} />
                    </div>
                    <div className={styles.inputGroup}>
                        <Label htmlFor="base-amount">Quantidade do Seu Token (Base)</Label>
                        <Input id="base-amount" type="number" value={baseTokenAmount} onChange={(e) => setBaseTokenAmount(e.target.value)} placeholder="Ex: 10000" disabled={isLoading} />
                    </div>
                    <div className={styles.inputGroup}>
                        <Label htmlFor="quote-amount">Quantidade de SOL (Quote)</Label>
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