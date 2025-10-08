"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import styles from './AddLiquidity.module.css';
import Link from "next/link";

// Ícones
const IconLayers = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>;
const IconInfo = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const IconExternalLink = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>;


export default function AddLiquidityPage() {
    return (
        <div className={styles.pageContainer}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Adicionar Liquidez ao seu Token</h1>
                <p className={styles.pageDescription}>
                    Funcionalidade em desenvolvimento. Em breve, você poderá criar pools de liquidez diretamente aqui.
                </p>
            </header>

             <div className={styles.grid}>
                <main className={styles.mainContent}>
                    <Card>
                        <CardHeader>
                            <CardTitle className={styles.cardTitle}>
                                <IconExternalLink />
                                Use a Meteora por enquanto
                            </CardTitle>
                            <CardDescription>
                                A criação de pools de liquidez nativa está sendo finalizada. Enquanto isso, você pode utilizar a criação de liquidez da Meteora, uma das principais plataformas de liquidez da Solana.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <p className={styles.infoText}>Clique no botão abaixo para ser redirecionado para a página de criação de pools da Meteora. Você precisará conectar sua carteira lá e seguir as instruções.</p>
                        </CardContent>
                        <div className={styles.cardFooter}>
                            <a href="https://www.meteora.ag/pools/create" target="_blank" rel="noopener noreferrer" className={styles.meteoraButtonLink}>
                                <Button className="w-full">
                                    Criar Pool de Liquidez na Meteora
                                </Button>
                            </a>
                        </div>
                    </Card>
                </main>
                 <aside className={styles.sidebar}>
                     <Card>
                        <CardHeader>
                            <CardTitle className={styles.cardTitle}>
                                <IconInfo />
                                O que é Liquidez?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className={styles.infoContent}>
                            <p className={styles.infoText}>
                                Liquidez é a capacidade de um ativo ser comprado ou vendido facilmente sem causar uma mudança drástica em seu preço. Em DeFi, um "pool de liquidez" é um par de tokens (por exemplo, seu token e SOL) trancado em um contrato inteligente em uma exchange descentralizada (DEX).
                            </p>
                            <p className={styles.infoText}>
                                Ao fornecer liquidez, você permite que outras pessoas negociem seu token, o que é essencial para que ele tenha valor e utilidade no mercado.
                            </p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className={styles.cardTitle}>
                                <IconLayers />
                                Tipos de Tokens para Liquidez
                            </CardTitle>
                        </CardHeader>
                        <CardContent className={styles.infoContent}>
                            <p className={styles.infoText}>
                                Normalmente, um pool é formado pelo seu token e um token de alta liquidez, como:
                            </p>
                            <ul className={styles.tokenList}>
                                <li><strong>SOL:</strong> A criptomoeda nativa da Solana. A maioria dos novos tokens começa com um par TOKEN/SOL.</li>
                                <li><strong>USDC:</strong> Uma stablecoin atrelada ao dólar americano, oferecendo um par de negociação estável.</li>
                            </ul>
                             <p className={styles.infoText}>
                                A proporção inicial de tokens que você deposita no pool definirá o preço de lançamento do seu ativo.
                            </p>
                        </CardContent>
                    </Card>
                </aside>
            </div>

        </div>
    );
}
