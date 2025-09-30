// src/app/add-liquidity/page.tsx
"use client";

import { useReducer, useEffect, useCallback } from "react";
import { NATIVE_MINT } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import styles from "./AddLiquidity.module.css";

// Hooks
import { useCreateRaydiumPool } from "@/hooks/useCreateRaydiumPool";
import { useUserTokens } from "@/hooks/useUserTokens";
import { SERVICE_FEE_CREATE_LP_SOL } from "@/lib/constants";

// Componentes
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TokenSelector } from "@/components/TokenSelector";
import Notification from "@/components/ui/Notification";

const TOTAL_FEE = SERVICE_FEE_CREATE_LP_SOL;

// Ícones SVG
const IconLayers = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>;
const IconPlusCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>;
const IconZap = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;

const tutorialSteps = [
    {
        icon: <IconLayers />,
        title: "Criação de Pool CPMM",
        description: "Um pool de liquidez (Constant Product Market Maker) será criado na Raydium para o seu par de tokens."
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

interface State {
    selectedTokenMint: string;
    baseTokenAmount: string;
    quoteTokenAmount: string;
    solBalance: number | null;
}

type Action =
    | { type: 'SET_FIELD'; field: keyof State; value: string | number | null }
    | { type: 'SET_SOL_BALANCE'; payload: number };

const initialState: State = {
    selectedTokenMint: "",
    baseTokenAmount: "",
    quoteTokenAmount: "",
    solBalance: null,
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.value };
        case 'SET_SOL_BALANCE':
            return { ...state, solBalance: action.payload };
        default:
            return state;
    }
}

export default function AddLiquidityPage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { selectedTokenMint, baseTokenAmount, quoteTokenAmount, solBalance } = state;

    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const { tokens, isLoading: isLoadingTokens } = useUserTokens();
    const { createRaydiumPool, isLoading, error, signature, statusMessage, reset } = useCreateRaydiumPool();

    useEffect(() => {
        if (publicKey) {
            connection.getBalance(publicKey).then(balance => {
                dispatch({ type: 'SET_SOL_BALANCE', payload: balance / 1_000_000_000 });
            });
        }
    }, [publicKey, connection]);

    const selectedToken = tokens.find(t => t.mint === selectedTokenMint);

    const handleCreatePool = async () => {
        if (!selectedToken) {
            alert("Por favor, selecione um token.");
            return;
        }

        await createRaydiumPool({
            baseAmount: baseTokenAmount,
            quoteAmount: quoteTokenAmount,
            baseMint: selectedTokenMint,
            quoteMint: NATIVE_MINT.toBase58(),
            baseDecimals: selectedToken.decimals,
        });
    };

    const clearNotifications = useCallback(() => {
        reset();
    }, [reset]);
    
    const handleAmountChange = (field: 'baseTokenAmount' | 'quoteTokenAmount', value: string, maxAmount?: string) => {
        let formattedValue = value.replace(/,/g, '.');
        if (!/^\d*\.?\d*$/.test(formattedValue)) return;
        if (maxAmount && parseFloat(formattedValue) > parseFloat(maxAmount)) formattedValue = maxAmount;
        if (formattedValue !== '' && parseFloat(formattedValue) < 0) formattedValue = '0';
        dispatch({ type: 'SET_FIELD', field, value: formattedValue });
    };

    return (
        <div className={styles.grid}>
            <div className={styles.formContainer}>
                <Card>
                    <CardHeader>
                        <CardTitle>Criar Pool de Liquidez na Raydium</CardTitle>
                        <CardDescription>
                            Crie um novo pool CPMM na Raydium para o seu token. O par será sempre com SOL e não necessita de um Market ID.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className={styles.cardContent}>
                        {error && <Notification type="error" message={error} onClose={clearNotifications} />}
                        {signature && <Notification type="success" message="Pool de liquidez criado com sucesso!" txId={signature} onClose={clearNotifications} />}
                        {!signature && !error && statusMessage && <Notification type="info" message={statusMessage} onClose={clearNotifications} />}

                        <div className={styles.inputGroup}>
                            <Label>Selecione seu Token (SPL & Token-2022)</Label>
                            <TokenSelector
                                tokens={tokens}
                                selectedTokenMint={selectedTokenMint}
                                onSelectToken={(mint) => {
                                    dispatch({ type: 'SET_FIELD', field: 'selectedTokenMint', value: mint });
                                    dispatch({ type: 'SET_FIELD', field: 'baseTokenAmount', value: '' });
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
                                <Input
                                    id="base-amount"
                                    type="text"
                                    inputMode="decimal"
                                    value={baseTokenAmount}
                                    onChange={(e) => handleAmountChange('baseTokenAmount', e.target.value, selectedToken.amount)}
                                    placeholder={`Ex: 10000`}
                                    disabled={isLoading}
                                />
                            </div>
                        )}

                        <div className={styles.inputGroup}>
                            <div className={styles.amountHeader}>
                                <Label htmlFor="quote-amount">Quantidade de SOL</Label>
                                {solBalance !== null && <span className={styles.balance}>Saldo: {solBalance.toFixed(4)}</span>}
                            </div>
                            <Input 
                                id="quote-amount" 
                                type="text"
                                inputMode="decimal"
                                value={quoteTokenAmount} 
                                onChange={(e) => handleAmountChange('quoteTokenAmount', e.target.value)} 
                                placeholder="Ex: 10" 
                                disabled={isLoading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleCreatePool} disabled={isLoading || !selectedTokenMint || !baseTokenAmount || !quoteTokenAmount} className="w-full">
                            {isLoading ? "Processando..." : `Criar Pool na Raydium (~${TOTAL_FEE.toFixed(2)} SOL de taxa)`}
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
