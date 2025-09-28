"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import ConnectWallet from "@/components/ConnectWallet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import styles from "./Affiliates.module.css"; 

// Icons
const IconWallet = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></svg>;
const IconLink = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/></svg>;
const IconDollarSign = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;

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


export default function AfiliatesPage() {
  const { connected, publicKey } = useWallet();
  const [copySuccess, setCopySuccess] = useState(false);
  const [affiliateLink, setAffiliateLink] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined' && connected && publicKey) {
      const baseUrl = window.location.origin;
      setAffiliateLink(`${baseUrl}/create?ref=${publicKey.toBase58()}`);
    } else {
      setAffiliateLink("");
    }
  }, [connected, publicKey]);

  const handleCopy = () => {
    navigator.clipboard.writeText(affiliateLink).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }, () => {
      // Handle copy error
    });
  };

  return (
    <div className={styles.grid}>
        <div className={styles.mainContent}>
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

