// src/app/add-liquidity/page.tsx
"use client";

import { useReducer, useEffect } from "react";
import { NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import styles from "./AddLiquidity.module.css";

// Hooks
import { useCreateLiquidityPool } from "@/hooks/useCreateLiquidityPool";
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

// 1. Definindo o tipo para o nosso estado
interface State {
    selectedTokenMint: string;
    baseTokenAmount: string;
    quoteTokenAmount: string;
    solBalance: number | null;
}

// 2. Definindo os tipos para nossas ações
type Action =
    | { type: 'SET_FIELD'; field: keyof State; value: string | number | null }
    | { type: 'SET_SOL_BALANCE'; payload: number };

const initialState: State = {
    selectedTokenMint: "",
    baseTokenAmount: "",
    quoteTokenAmount: "",
    solBalance: null,
};

// 3. Aplicando os tipos na função reducer
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
    const { createLiquidityPool, isLoading, error, signature, statusMessage } = useCreateLiquidityPool();

    // Filtra para incluir apenas tokens SPL padrão, que são compatíveis com a Raydium
    const splTokens = tokens.filter(token => token.programId === TOKEN_PROGRAM_ID.toBase58());

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

        await createLiquidityPool({
            baseAmount: parseFloat(baseTokenAmount),
            quoteAmount: parseFloat(quoteTokenAmount),
            baseMint: selectedTokenMint,
            quoteMint: NATIVE_MINT.toBase58(),
            baseDecimals: selectedToken.decimals,
        });
    };

    const clearNotifications = () => {
        // Lógica para limpar notificações, se necessário
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
                            <Label>Selecione seu Token (Apenas SPL)</Label>
                            <TokenSelector
                                tokens={splTokens}
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
                                    type="number"
                                    value={baseTokenAmount}
                                    onChange={(e) => {
                                        let value = e.target.value;
                                        if (selectedToken && parseFloat(value) > parseFloat(selectedToken.amount)) {
                                            value = selectedToken.amount;
                                        }
                                        if (value !== '' && parseFloat(value) < 0) {
                                            value = '0';
                                        }
                                        dispatch({ type: 'SET_FIELD', field: 'baseTokenAmount', value: value });
                                    }}
                                    placeholder={`Ex: 10000`}
                                    disabled={isLoading}
                                    max={selectedToken.amount}
                                />
                            </div>
                        )}

                        <div className={styles.inputGroup}>
                            <div className={styles.amountHeader}>
                                <Label htmlFor="quote-amount">Quantidade de SOL</Label>
                                {solBalance !== null && <span className={styles.balance}>Saldo: {solBalance.toFixed(4)}</span>}
                            </div>
                            <Input id="quote-amount" type="number" value={quoteTokenAmount} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'quoteTokenAmount', value: e.target.value })} placeholder="Ex: 10" disabled={isLoading} />
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

