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
                <h1 className={styles.pageTitle}>Adicionar Liquidez ao Seu Token</h1>
                <p className={styles.pageDescription}>
                    Escolha uma plataforma para criar um pool de liquidez e permitir que seu token seja negociado.
                </p>
            </header>

             <div className={styles.grid}>
                <main className={styles.mainContent}>
                    <div className={styles.optionsGrid}>
                        <Card>
                            <CardHeader>
                                <CardTitle className={styles.cardTitle}>
                                    <IconExternalLink />
                                    Criar Pool na Raydium
                                </CardTitle>
                                <CardDescription>
                                    Use os pools CLMM da Raydium para liquidez concentrada, que pode ser mais eficiente em capital.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className={styles.infoText}>Clique no botão abaixo para ser redirecionado para a página de criação de pool da Raydium. Você precisará conectar sua carteira e seguir as instruções.</p>
                            </CardContent>
                            <div className={styles.cardFooter}>
                                <a href="https://raydium.io/clmm/create-pool/" target="_blank" rel="noopener noreferrer" className={styles.platformButtonLink}>
                                    <Button className="w-full">
                                        Criar na Raydium
                                    </Button>
                                </a>
                            </div>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className={styles.cardTitle}>
                                    <IconExternalLink />
                                    Criar Pool na Meteora
                                </CardTitle>
                                <CardDescription>
                                    A Meteora oferece pools dinâmicos que ajudam a gerenciar a liquidez de forma mais eficaz.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className={styles.infoText}>Clique no botão abaixo para ser redirecionado para a página de criação de pool da Meteora. Você precisará conectar sua carteira e seguir as instruções.</p>
                            </CardContent>
                            <div className={styles.cardFooter}>
                                <a href="https://www.meteora.ag/pools/create" target="_blank" rel="noopener noreferrer" className={styles.platformButtonLink}>
                                    <Button className="w-full secondary">
                                        Criar na Meteora
                                    </Button>
                                </a>
                            </div>
                        </Card>
                    </div>
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
                                Liquidez é a capacidade de um ativo ser facilmente comprado ou vendido sem causar uma mudança drástica em seu preço. Em DeFi, um "pool de liquidez" é um par de tokens (por exemplo, seu token e SOL) bloqueado em um contrato inteligente em uma exchange descentralizada (DEX).
                            </p>
                            <p className={styles.infoText}>
                                Ao fornecer liquidez, você permite que outros negociem seu token, o que é essencial para que ele tenha valor e utilidade no mercado.
                            </p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className={styles.cardTitle}>
                                <IconLayers />
                                Tokens para Liquidez
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
