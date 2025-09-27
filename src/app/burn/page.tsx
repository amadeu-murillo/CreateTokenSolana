// src/app/burn/page.tsx

"use client";

import { useState } from 'react';
import { useBurnToken } from '@/hooks/useBurnToken';
import { useUserTokens } from '@/hooks/useUserTokens';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { TokenSelector } from '@/components/TokenSelector'; // Importar o novo seletor
import Notification from '@/components/ui/Notification';
import styles from './Burn.module.css';

// Ícones SVG
const TokenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></svg>;
const FlameIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;

const tutorialSteps = [
    {
        icon: <TokenIcon />,
        title: "Selecione o Token",
        description: "Escolha o token que você deseja queimar diretamente da sua carteira. A queima removerá tokens permanentemente da circulação."
    },
    {
        icon: <FlameIcon />,
        title: "Quantidade a Queimar",
        description: "Defina a quantidade de tokens a ser removida. Você pode usar o botão 'MAX' para queimar todo o saldo ou inserir um valor manualmente."
    }
];

export default function BurnPage() {
    const [selectedTokenMint, setSelectedTokenMint] = useState('');
    const [amount, setAmount] = useState('');
    const { burnToken, isLoading, error, signature } = useBurnToken();
    const { tokens: userTokens, isLoading: isLoadingUserTokens } = useUserTokens();

    // Deriva o token selecionado a partir do mint
    const selectedToken = userTokens.find(t => t.mint === selectedTokenMint) || null;

    const handleSetMaxAmount = () => {
        if (selectedToken) {
            setAmount(selectedToken.amount);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedToken) {
            await burnToken(selectedToken.mint, Number(amount));
        }
    };

    return (
        <div className={styles.grid}>
            <div className={styles.formContainer}>
                <Card>
                    <CardHeader>
                        <CardTitle>Queimar Tokens (Burn)</CardTitle>
                        <CardDescription>
                            Remova permanentemente uma quantidade de tokens de circulação. Esta ação é irreversível.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className={styles.cardContent}>
                            {error && <Notification type="error" message={error} onClose={() => {}} />}
                            {signature && <Notification type="success" message="Tokens queimados com sucesso!" txId={signature} onClose={() => {}} />}
                            
                            <div className={styles.field}>
                                <Label htmlFor="token-select">Selecione o Token</Label>
                                <TokenSelector
                                    tokens={userTokens}
                                    selectedTokenMint={selectedTokenMint}
                                    onSelectToken={(mint) => {
                                        setSelectedTokenMint(mint);
                                        setAmount(''); // Limpa a quantidade ao trocar
                                    }}
                                    isLoading={isLoadingUserTokens}
                                    disabled={isLoading}
                                />
                            </div>

                            {selectedToken && (
                                <div className={styles.field}>
                                    <div className={styles.amountHeader}>
                                        <Label htmlFor="amount">Quantidade a Queimar</Label>
                                        <span className={styles.balance}>Saldo: {parseFloat(selectedToken.amount).toLocaleString()} {selectedToken.symbol}</span>
                                    </div>
                                    <div className={styles.amountInputContainer}>
                                        <Input 
                                            id="amount" 
                                            type="number" 
                                            placeholder="Ex: 1000" 
                                            value={amount} 
                                            onChange={(e) => setAmount(e.target.value)} 
                                            required 
                                            min="0"
                                            max={selectedToken.amount}
                                            disabled={isLoading}
                                        />
                                        <Button type="button" onClick={handleSetMaxAmount} className={styles.maxButton} disabled={isLoading}>
                                            MAX
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isLoading || !selectedToken || !amount} className="w-full">
                                {isLoading ? 'Queimando...' : `Queimar Tokens`}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
            <div className={styles.sidebar}>
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
            </div>
        </div>
    );
}