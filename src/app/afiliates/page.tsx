"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import ConnectWallet from "../../components/ConnectWallet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import styles from "./Affiliates.module.css"; 

// Icons
const IconWallet = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></svg>;
const IconLink = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/></svg>;
const IconDollarSign = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const IconTrendingUp = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

const tutorialSteps = [
    {
        icon: <IconWallet />,
        title: "Conecte sua Carteira",
        description: "Para gerar seu link de afiliado exclusivo, primeiro você precisa conectar sua carteira Solana."
    },
    {
        icon: <IconLink />,
        title: "Gere e Compartilhe seu Link",
        description: "Seu link de afiliado será gerado automaticamente usando o endereço da sua carteira. Copie e compartilhe com seus amigos e comunidade."
    },
    {
        icon: <IconDollarSign />,
        title: "Receba Comissões em SOL",
        description: `Para cada token criado através do seu link, você recebe 10% da nossa taxa de serviço (0.1 SOL) diretamente na sua carteira, na mesma transação.`
    }
];

// Nova interface para os dados de ganhos
interface AffiliateEarnings {
    totalEarningsSol: number;
    referralCount: number;
}

export default function AfiliatesPage() {
  const { connected, publicKey } = useWallet();
  const [copySuccess, setCopySuccess] = useState(false);
  const [affiliateLink, setAffiliateLink] = useState("");
  // Novos estados para os ganhos
  const [earnings, setEarnings] = useState<AffiliateEarnings | null>(null);
  const [isLoadingEarnings, setIsLoadingEarnings] = useState(false);
  const [errorEarnings, setErrorEarnings] = useState<string | null>(null);


  useEffect(() => {
    if (typeof window !== 'undefined' && connected && publicKey) {
      const baseUrl = window.location.origin;
      // Aponta para a página inicial para capturar o 'ref' em qualquer ponto da navegação
      setAffiliateLink(`${baseUrl}/?ref=${publicKey.toBase58()}`);
    } else {
      setAffiliateLink("");
    }
  }, [connected, publicKey]);
  
  // Novo useEffect para buscar os ganhos
  useEffect(() => {
    const fetchEarnings = async () => {
        if (connected && publicKey) {
            setIsLoadingEarnings(true);
            setErrorEarnings(null);
            try {
                const response = await fetch(`/api/affiliate-earnings?wallet=${publicKey.toBase58()}`);
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Falha ao buscar ganhos.');
                }
                const data = await response.json();
                setEarnings(data);
            } catch (error: any) {
                console.error(error);
                setErrorEarnings(error.message);
                setEarnings(null);
            } finally {
                setIsLoadingEarnings(false);
            }
        }
    };

    fetchEarnings();
  }, [connected, publicKey]);

  const handleCopy = () => {
    navigator.clipboard.writeText(affiliateLink).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }, () => {
      // Lida com erro na cópia se necessário
    });
  };

  return (
    <div className={styles.grid}>
        <div className={styles.mainContent}>
            <div className={styles.contentStack}> {/* Wrapper para empilhar os cards */}
                <Card>
                    <CardHeader>
                        <CardTitle>Programa de Afiliados</CardTitle>
                        <CardDescription>
                            Ganhe SOL por cada novo usuário que criar um token através do seu link de referência.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {connected && publicKey ? (
                            <div className={styles.linkContainer}>
                                <Label htmlFor="affiliate-link">Seu Link de Afiliado Exclusivo</Label>
                                <div className={styles.inputWrapper}>
                                    <Input 
                                        id="affiliate-link"
                                        type="text"
                                        value={affiliateLink}
                                        readOnly 
                                    />
                                    <Button onClick={handleCopy} className={styles.copyButton}>
                                        {copySuccess ? 'Copiado!' : 'Copiar Link'}
                                    </Button>
                                </div>
                                <p>Compartilhe este link. Para cada token criado através dele, você receberá 10% da nossa taxa de serviço diretamente na sua carteira.</p>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Torne-se um Afiliado</h3>
                                <p style={{ marginBottom: '1rem', color: 'hsl(var(--muted-foreground))' }}>Conecte sua carteira para gerar seu link de afiliado instantaneamente.</p>
                                <ConnectWallet />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Novo Card para Ganhos */}
                {connected && publicKey && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Seus Ganhos</CardTitle>
                            <CardDescription>
                                Total de comissões recebidas através do seu link.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingEarnings ? (
                                <p>Carregando seus ganhos...</p>
                            ) : errorEarnings ? (
                                <p className={styles.errorText}>Erro ao carregar ganhos: {errorEarnings}</p>
                            ) : earnings ? (
                                <div className={styles.earningsGrid}>
                                    <div className={styles.earningStat}>
                                        <div className={styles.statHeader}>
                                            <IconTrendingUp />
                                            <span>Ganhos Totais (SOL)</span>
                                        </div>
                                        <p className={styles.statValue}>{earnings.totalEarningsSol.toFixed(4)} SOL</p>
                                    </div>
                                    <div className={styles.earningStat}>
                                        <div className={styles.statHeader}>
                                            <IconUsers />
                                            <span>Referências Convertidas</span>
                                        </div>
                                        <p className={styles.statValue}>{earnings.referralCount}</p>
                                    </div>
                                </div>
                            ) : (
                                <p>Ainda não há dados de ganhos.</p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
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

