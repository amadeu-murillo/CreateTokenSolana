"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import styles from "./Affiliates.module.css";

// --- Ícones ---
const IconWallet = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></svg>;
const IconLink = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/></svg>;
const IconTrendingUp = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconZap = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;
const IconPercent = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>;
const IconShieldCheck = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>;


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
  const [showEarnings, setShowEarnings] = useState(false);

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

  const handleCopy = () => {
    navigator.clipboard.writeText(affiliateLink).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    });
  };
  
  const handleToggleEarnings = () => {
      if (!showEarnings && !earnings) {
          handleFetchEarnings();
      }
      setShowEarnings(!showEarnings);
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Programa de Afiliados: Ganhe SOL por Indicar</h1>
        <p className={styles.pageDescription}>
            Participe do nosso programa de afiliados e ganhe <span className={styles.highlight}>10% de comissão</span> em SOL por cada token criado através do seu link. O pagamento é automático e transparente, direto na sua carteira.
        </p>
      </header>

      <div className={styles.grid}>
          <div className={styles.mainContent}>
              <div className={styles.contentStack}>
                  <Card>
                      <CardHeader>
                          <CardTitle>O seu Link de Afiliado Pessoal</CardTitle>
                      </CardHeader>
                      <CardContent>
                          {connected && publicKey ? (
                              <div className={styles.linkContainer}>
                                  <p className={styles.linkExplanation}>Este é o seu link exclusivo. O parâmetro `ref` contém a sua chave pública, que nos permite rastrear as suas indicações.</p>
                                  <div className={styles.inputWrapper}>
                                      <Input id="affiliate-link" type="text" value={affiliateLink} readOnly />
                                      <Button onClick={handleCopy} className={styles.copyButto}>
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
                    <>
                        <Button onClick={handleToggleEarnings} className="w-full">
                            {showEarnings ? 'Ocultar Painel de Ganhos' : 'Consultar Meus Ganhos'}
                        </Button>
                      {showEarnings && (
                          <Card>
                              <CardHeader>
                                  <CardTitle>Painel de Ganhos</CardTitle>
                                  <CardDescription>Acompanhe o seu desempenho e comissões recebidas.</CardDescription>
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
                                                  <div className={styles.statHeader}><IconUsers /><span>Indicações</span></div>
                                                  <p className={styles.statValue}>{earnings.referralCount}</p>
                                              </div>
                                          </div>
                                          
                                          <h4 className={styles.historyTitle}>Últimas 10 Comissões</h4>
                                          {earnings.transactions.length > 0 ? (
                                              <div className={styles.historyTable}>
                                                  <div className={styles.historyTableHeader}>
                                                      <div>Data</div>
                                                      <div className={styles.amountHeader}>Valor</div>
                                                      <div className={styles.txHeader}>Transação</div>
                                                  </div>
                                                  {earnings.transactions.map(tx => (
                                                      <div key={tx.signature} className={styles.historyRow}>
                                                          <div className={styles.historyDate}>
                                                              {new Date(tx.blockTime * 1000).toLocaleString()}
                                                          </div>
                                                          <div className={styles.historyAmount}>
                                                              +{tx.amount.toFixed(4)} SOL
                                                          </div>
                                                          <a href={`https://solscan.io/tx/${tx.signature}`} target="_blank" rel="noopener noreferrer" className={styles.historyLink}>
                                                              Ver no Solscan
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
                      </>
                  )}
              </div>
          </div>
          <aside className={styles.sidebar}>
                <Card className={styles.sidebarCard}>
                    <CardHeader>
                        <CardTitle className={styles.sidebarCardTitle}><IconZap /> Como Funciona?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className={styles.stepList}>
                            <li className={styles.stepItem}>
                                <strong>1. Conecte a sua Carteira:</strong> O endereço público da sua carteira é usado como seu código de referência exclusivo.
                            </li>
                            <li className={styles.stepItem}>
                                <strong>2. Copie o seu Link:</strong> O seu link de afiliado é gerado automaticamente. Ele contém `?ref=SUA_CARTEIRA`.
                            </li>
                             <li className={styles.stepItem}>
                                <strong>3. Partilhe e Indique:</strong> Divulgue o link. Qualquer pessoa que o utilize para criar um token será sua indicação.
                            </li>
                             <li className={styles.stepItem}>
                                <strong>4. Receba Comissões:</strong> Por cada token criado, 10% da nossa taxa é enviada para a sua carteira na mesma transação.
                            </li>
                        </ol>
                    </CardContent>
                </Card>
                 <Card className={styles.sidebarCard}>
                    <CardHeader>
                        <CardTitle className={styles.sidebarCardTitle}><IconPercent /> A sua Comissão</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className={styles.sidebarText}>Você recebe <strong className={styles.highlight}>10%</strong> da nossa taxa de serviço de 0.1 SOL, o que equivale a <strong className={styles.highlight}>0.01 SOL</strong> por cada token criado com sucesso através do seu link.</p>
                    </CardContent>
                </Card>
                <Card className={styles.sidebarCard}>
                    <CardHeader>
                        <CardTitle className={styles.sidebarCardTitle}><IconShieldCheck /> Pagamentos Transparentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className={styles.sidebarText}>As comissões são pagas de forma atómica (na mesma transação) através de um System Program da Solana. Isto garante que o pagamento é instantâneo e à prova de falhas. Pode verificar todas as suas comissões na blockchain.</p>
                    </CardContent>
                </Card>
          </aside>
      </div>
    </div>
  );
}
