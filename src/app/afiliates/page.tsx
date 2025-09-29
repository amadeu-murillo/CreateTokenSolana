"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import styles from "./Affiliates.module.css"; 

// --- Ícones ---
const IconWallet = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></svg>;
const IconLink = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/></svg>;
const IconDollarSign = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const IconTrendingUp = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

const tutorialSteps = [
    { icon: <IconWallet />, title: "Conecte a sua Carteira", description: "Para gerar o seu link de afiliado exclusivo, primeiro precisa de conectar a sua carteira Solana." },
    { icon: <IconLink />, title: "Gere e Partilhe o seu Link", description: "O seu link de afiliado será gerado automaticamente. Copie e partilhe com os seus amigos e comunidade." },
    { icon: <IconDollarSign />, title: "Receba Comissões em SOL", description: "Por cada token criado através do seu link, recebe 10% da nossa taxa de serviço diretamente na sua carteira." }
];

interface AffiliateTransaction {
    signature: string;
    blockTime: number;
    amount: number;
}

interface AffiliateEarnings {
    totalEarningsSol: number;
    referralCount: number;
    transactions: AffiliateTransaction[];
}

export default function AfiliatesPage() {
  const { connected, publicKey } = useWallet();
  const [copySuccess, setCopySuccess] = useState(false);
  const [affiliateLink, setAffiliateLink] = useState("");
  const [earnings, setEarnings] = useState<AffiliateEarnings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && connected && publicKey) {
      const baseUrl = window.location.origin;
      setAffiliateLink(`${baseUrl}/?ref=${publicKey.toBase58()}`);
    } else {
      setAffiliateLink("");
    }
  }, [connected, publicKey]);

  const handleFetchEarnings = useCallback(async () => {
    if (connected && publicKey) {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/affiliate-earnings?wallet=${publicKey.toBase58()}`);
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Falha ao buscar ganhos.');
            }
            const data: AffiliateEarnings = await response.json();
            setEarnings(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }
  }, [connected, publicKey]);

  useEffect(() => {
    // Busca os ganhos automaticamente quando a carteira é conectada
    if(connected && publicKey) {
        handleFetchEarnings();
    }
  }, [connected, publicKey, handleFetchEarnings]);

  const handleCopy = () => {
    navigator.clipboard.writeText(affiliateLink).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    });
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Programa de Afiliados</h1>
        <p className={styles.pageDescription}>Ganhe SOL por ajudar a expandir o ecossistema Solana. Partilhe o seu link e receba comissões por cada token criado.</p>
      </header>

      <div className={styles.grid}>
          <div className={styles.mainContent}>
              <div className={styles.contentStack}>
                  <Card>
                      <CardHeader>
                          <CardTitle>O seu Link de Afiliado</CardTitle>
                      </CardHeader>
                      <CardContent>
                          {connected && publicKey ? (
                              <div className={styles.linkContainer}>
                                  <div className={styles.inputWrapper}>
                                      <Input id="affiliate-link" type="text" value={affiliateLink} readOnly />
                                      <Button onClick={handleCopy} className={styles.copyButton}>
                                          {copySuccess ? 'Copiado!' : 'Copiar'}
                                      </Button>
                                  </div>
                              </div>
                          ) : (
                              <div className={styles.connectWalletPrompt}>
                                  <p>Conecte a sua carteira para gerar o seu link de afiliado.</p>
                              </div>
                          )}
                      </CardContent>
                  </Card>
                  
                  {connected && publicKey && (
                      <Card>
                          <CardHeader>
                              <CardTitle>Painel de Ganhos</CardTitle>
                              <CardDescription>Acompanhe o seu desempenho e comissões.</CardDescription>
                          </CardHeader>
                          <CardContent>
                              {isLoading ? (
                                  <div className={styles.loadingContainer}>
                                      <div className={styles.spinner}></div>
                                      <p>A carregar os seus ganhos...</p>
                                  </div>
                              ) : error ? (
                                  <p className={styles.errorText}>Erro ao carregar ganhos: {error}</p>
                              ) : earnings ? (
                                  <div className={styles.earningsDashboard}>
                                      <div className={styles.earningsGrid}>
                                          <div className={styles.earningStat}>
                                              <div className={styles.statHeader}><IconTrendingUp /><span>Ganhos Totais</span></div>
                                              <p className={styles.statValue}>{earnings.totalEarningsSol.toFixed(4)} SOL</p>
                                          </div>
                                          <div className={styles.earningStat}>
                                              <div className={styles.statHeader}><IconUsers /><span>Referências</span></div>
                                              <p className={styles.statValue}>{earnings.referralCount}</p>
                                          </div>
                                      </div>
                                      
                                      <h4 className={styles.historyTitle}>Últimas Comissões</h4>
                                      {earnings.transactions.length > 0 ? (
                                          <div className={styles.historyTable}>
                                              {earnings.transactions.map(tx => (
                                                  <div key={tx.signature} className={styles.historyRow}>
                                                      <div className={styles.historyDate}>
                                                          {new Date(tx.blockTime * 1000).toLocaleString()}
                                                      </div>
                                                      <div className={styles.historyAmount}>
                                                          +{tx.amount.toFixed(4)} SOL
                                                      </div>
                                                      <a href={`https://solscan.io/tx/${tx.signature}`} target="_blank" rel="noopener noreferrer" className={styles.historyLink}>
                                                          Ver Tx
                                                      </a>
                                                  </div>
                                              ))}
                                          </div>
                                      ) : (
                                          <p className={styles.noHistoryText}>Ainda não há transações de comissão.</p>
                                      )}
                                  </div>
                              ) : null}
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
    </div>
  );
}
