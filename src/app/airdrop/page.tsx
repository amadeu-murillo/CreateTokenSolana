"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAirdrop } from '@/hooks/useAirdrop';
import { useUserTokens } from '@/hooks/useUserTokens';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { TokenSelector } from '@/components/TokenSelector';
import Notification from '@/components/ui/Notification';
import styles from './Airdrop.module.css';
import { PublicKey } from '@solana/web3.js';

interface Recipient {
    address: string;
    amount: number;
    lineNumber: number;
}

interface ParsedResult {
    valid: Recipient[];
    invalid: { line: number; value: string; error: string }[];
    totalAmount: number;
}

// Ícones SVG
const TokenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;


const tutorialSteps = [
    {
        icon: <TokenIcon />,
        title: "Selecione o Token",
        description: "Escolha o token que você deseja distribuir diretamente da sua carteira. A ferramenta funciona tanto para tokens SPL padrão quanto para Token-2022."
    },
    {
        icon: <UsersIcon />,
        title: "Prepare sua Lista",
        description: "Formate sua lista com um endereço e uma quantidade por linha, separados por vírgula, espaço ou ponto e vírgula."
    },
     {
        icon: <CheckIcon />,
        title: "Valide e Envie",
        description: "Após inserir a lista, clique em 'Validar' para ver um resumo e corrigir possíveis erros. Depois, confirme para enviar o airdrop em uma única transação."
    }
];

export default function AirdropPage() {
    const [selectedTokenMint, setSelectedTokenMint] = useState('');
    const [recipientsText, setRecipientsText] = useState('');
    const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
    const { performAirdrop, isLoading, error, signature, reset } = useAirdrop();
    const { tokens: userTokens, isLoading: isLoadingUserTokens } = useUserTokens();

    const selectedToken = useMemo(() => userTokens.find(t => t.mint === selectedTokenMint) || null, [userTokens, selectedTokenMint]);
    
    useEffect(() => {
        // Limpa o resultado da validação se o texto ou o token mudar
        setParsedResult(null);
    }, [recipientsText, selectedTokenMint]);

    const handleParseAndValidate = () => {
        const lines = recipientsText.split('\n').map(line => line.trim()).filter(line => line);
        const result: ParsedResult = { valid: [], invalid: [], totalAmount: 0 };
        let totalAmount = 0;

        lines.forEach((line, index) => {
            const parts = line.split(/[,;\s]+/);
            const address = parts[0];
            const amountStr = parts[1];
            
            let error = '';
            if (!address || !amountStr) {
                error = 'Formato inválido.';
            } else if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
                error = 'Endereço Solana inválido.';
            } else {
                 try {
                    new PublicKey(address);
                } catch (e) {
                    error = 'Endereço Solana inválido.';
                }
            }

            const amount = parseFloat(amountStr);
            if (isNaN(amount) || amount <= 0) {
                error = error ? error + ' Quantidade inválida.' : 'Quantidade inválida.';
            }

            if (error) {
                result.invalid.push({ line: index + 1, value: line, error });
            } else {
                result.valid.push({ address, amount, lineNumber: index + 1 });
                totalAmount += amount;
            }
        });
        result.totalAmount = totalAmount;
        setParsedResult(result);
    };

    const handleSubmit = async () => {
        if (!parsedResult || parsedResult.valid.length === 0 || !selectedToken) {
            return;
        }
        await performAirdrop(selectedToken.mint, parsedResult.valid, selectedToken.programId);
    };

    const clearAll = () => {
        setSelectedTokenMint('');
        setRecipientsText('');
        setParsedResult(null);
        reset();
    }

    return (
        <div className={styles.grid}>
            <div className={styles.formContainer}>
                <Card>
                    <CardHeader>
                        <CardTitle>Ferramenta de Airdrop</CardTitle>
                        <CardDescription>
                            Distribua tokens SPL e Token-2022 para múltiplos endereços de uma só vez.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {signature ? (
                             <div className={styles.successContainer}>
                                <Notification type="success" message="Airdrop enviado com sucesso!" txId={signature} onClose={clearAll} />
                                <Button onClick={clearAll} className="w-full">Fazer Novo Airdrop</Button>
                             </div>
                        ) : (
                        <div className={styles.form}>
                             {error && <Notification type="error" message={error} onClose={reset} />}
                            <div className={styles.field}>
                                <Label htmlFor="token-select">Selecione o Token</Label>
                                 <TokenSelector
                                    tokens={userTokens}
                                    selectedTokenMint={selectedTokenMint}
                                    onSelectToken={setSelectedTokenMint}
                                    isLoading={isLoadingUserTokens}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className={styles.field}>
                                <Label htmlFor="recipients">Lista de Destinatários</Label>
                                <textarea
                                    id="recipients"
                                    placeholder="Um por linha: Endereço,Quantidade&#10;Ex: 4hSVN...E3FEf,1000"
                                    value={recipientsText}
                                    onChange={(e) => setRecipientsText(e.target.value)}
                                    className={styles.textarea}
                                    rows={8}
                                    disabled={isLoading}
                                />
                                <p className={styles.fieldDescription}>Separe o endereço e a quantidade por vírgula, ponto e vírgula ou espaço.</p>
                            </div>
                            
                            {parsedResult && (
                                <div className={styles.summaryCard}>
                                    <h4 className={styles.summaryTitle}>Resumo da Validação</h4>
                                    {parsedResult.invalid.length > 0 && (
                                        <div className={styles.errorList}>
                                            <p><strong>Erros encontrados:</strong></p>
                                            <ul>
                                                {parsedResult.invalid.slice(0, 5).map(item => (
                                                    <li key={item.line}>Linha {item.line}: {item.error}</li>
                                                ))}
                                                {parsedResult.invalid.length > 5 && <li>... e mais {parsedResult.invalid.length - 5} erros.</li>}
                                            </ul>
                                        </div>
                                    )}
                                    {parsedResult.valid.length > 0 && (
                                        <div className={styles.summaryInfo}>
                                            <p><span>Destinatários Válidos:</span> <strong>{parsedResult.valid.length}</strong></p>
                                            <p><span>Total de Tokens a Enviar:</span> <strong>{parsedResult.totalAmount.toLocaleString()} {selectedToken?.symbol}</strong></p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        )}
                    </CardContent>
                    {!signature && (
                    <CardFooter className={styles.footerActions}>
                        <Button 
                            onClick={handleParseAndValidate} 
                            disabled={isLoading || !selectedTokenMint || !recipientsText}
                            className="secondary"
                        >
                            Validar Lista
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            disabled={isLoading || !parsedResult || parsedResult.invalid.length > 0 || parsedResult.valid.length === 0}
                        >
                            {isLoading ? 'Enviando...' : `Enviar Airdrop (Custo: ~0.05 SOL)`}
                        </Button>
                    </CardFooter>
                    )}
                </Card>
            </div>
            <aside className={styles.sidebar}>
                 <h3 className={styles.sidebarTitle}>Como Funciona</h3>
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
            </aside>
        </div>
    );
}
