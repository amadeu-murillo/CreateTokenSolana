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
                throw new Error(data.error || 'Failed to fetch earnings.');
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
        <h1 className={styles.pageTitle}>Affiliate Program: Earn SOL by Referring</h1>
        <p className={styles.pageDescription}>
            Join our affiliate program and earn <span className={styles.highlight}>10% commission</span> in SOL for every token created through your link. Payments are automatic and transparent, directly to your wallet.
        </p>
      </header>

      <div className={styles.grid}>
          <div className={styles.mainContent}>
              <div className={styles.contentStack}>
                  <Card>
                      <CardHeader>
                          <CardTitle>Your Personal Affiliate Link</CardTitle>
                      </CardHeader>
                      <CardContent>
                          {connected && publicKey ? (
                              <div className={styles.linkContainer}>
                                  <p className={styles.linkExplanation}>This is your exclusive link. The `ref` parameter contains your public key, which allows us to track your referrals.</p>
                                  <div className={styles.inputWrapper}>
                                      <Input id="affiliate-link" type="text" value={affiliateLink} readOnly />
                                      <Button onClick={handleCopy} className={styles.copyButto}>
                                          {copySuccess ? 'Copied!' : 'Copy'}
                                      </Button>
                                  </div>
                              </div>
                          ) : (
                              <div className={styles.connectWalletPrompt}>
                                  <p>Connect your wallet to generate your affiliate link.</p>
                              </div>
                          )}
                      </CardContent>
                  </Card>
                  
                  {connected && publicKey && (
                    <>
                        <Button onClick={handleToggleEarnings} className="w-full">
                            {showEarnings ? 'Hide Earnings Panel' : 'View My Earnings'}
                        </Button>
                      {showEarnings && (
                          <Card>
                              <CardHeader>
                                  <CardTitle>Earnings Panel</CardTitle>
                                  <CardDescription>Track your performance and commissions received.</CardDescription>
                              </CardHeader>
                              <CardContent>
                                  {isLoading ? (
                                      <div className={styles.loadingContainer}>
                                          <div className={styles.spinner}></div>
                                          <p>Loading your earnings...</p>
                                      </div>
                                  ) : error ? (
                                      <p className={styles.errorText}>Error loading earnings: {error}</p>
                                  ) : earnings ? (
                                      <div className={styles.earningsDashboard}>
                                          <div className={styles.earningsGrid}>
                                              <div className={styles.earningStat}>
                                                  <div className={styles.statHeader}><IconTrendingUp /><span>Total Earnings</span></div>
                                                  <p className={styles.statValue}>{earnings.totalEarningsSol.toFixed(4)} SOL</p>
                                              </div>
                                              <div className={styles.earningStat}>
                                                  <div className={styles.statHeader}><IconUsers /><span>Referrals</span></div>
                                                  <p className={styles.statValue}>{earnings.referralCount}</p>
                                              </div>
                                          </div>
                                          
                                          <h4 className={styles.historyTitle}>Last 10 Commissions</h4>
                                          {earnings.transactions.length > 0 ? (
                                              <div className={styles.historyTable}>
                                                  <div className={styles.historyTableHeader}>
                                                      <div>Date</div>
                                                      <div className={styles.amountHeader}>Amount</div>
                                                      <div className={styles.txHeader}>Transaction</div>
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
                                                              View on Solscan
                                                          </a>
                                                      </div>
                                                  ))}
                                              </div>
                                          ) : (
                                              <p className={styles.noHistoryText}>No commission transactions yet.</p>
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
                        <CardTitle className={styles.sidebarCardTitle}><IconZap /> How It Works</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className={styles.stepList}>
                            <li className={styles.stepItem}>
                                <strong>1. Connect Your Wallet:</strong> Your wallet’s public address is used as your unique referral code.
                            </li>
                            <li className={styles.stepItem}>
                                <strong>2. Copy Your Link:</strong> Your affiliate link is generated automatically. It includes `?ref=YOUR_WALLET`.
                            </li>
                             <li className={styles.stepItem}>
                                <strong>3. Share and Refer:</strong> Share the link. Anyone who uses it to create a token becomes your referral.
                            </li>
                             <li className={styles.stepItem}>
                                <strong>4. Receive Commissions:</strong> For each created token, 10% of our fee is sent to your wallet in the same transaction.
                            </li>
                        </ol>
                    </CardContent>
                </Card>
                 <Card className={styles.sidebarCard}>
                    <CardHeader>
                        <CardTitle className={styles.sidebarCardTitle}><IconPercent /> Your Commission</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className={styles.sidebarText}>You receive <strong className={styles.highlight}>10%</strong> of our 0.1 SOL service fee, which equals <strong className={styles.highlight}>0.01 SOL</strong> for every successfully created token through your link.</p>
                    </CardContent>
                </Card>
                <Card className={styles.sidebarCard}>
                    <CardHeader>
                        <CardTitle className={styles.sidebarCardTitle}><IconShieldCheck /> Transparent Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className={styles.sidebarText}>Commissions are paid atomically (in the same transaction) via Solana’s System Program. This ensures payments are instant and fail-proof. You can verify all your commissions on the blockchain.</p>
                    </CardContent>
                </Card>
          </aside>
      </div>
    </div>
  );
}
