// src/app/add-liquidity/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import styles from "./AddLiquidity.module.css";

// Ícones SVG
const IconLayers = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>;
const IconZap = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;

export default function AddLiquidityPage() {
    return (
        <div className={styles.pageContainer}>
            <div className={styles.grid}>
                <div className={styles.formContainer}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Criar Pool de Liquidez na Raydium</CardTitle>
                            <CardDescription>
                                Crie um novo pool AMM na Raydium para o seu token.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className={styles.cardContent}>
                           <div className={styles.wipContainer}>
                                <IconZap />
                                <h3 className={styles.wipTitle}>Funcionalidade em Desenvolvimento</h3>
                                <p className={styles.wipText}>
                                    Estamos a trabalhar arduamente para trazer esta funcionalidade de volta o mais rápido possível. Volte em breve!
                                </p>
                           </div>
                        </CardContent>
                    </Card>
                </div>
                <aside className={styles.sidebar}>
                     <h3 className={styles.sidebarTitle}>Em breve...</h3>
                     <Card className={styles.tutorialCard}>
                        <CardContent className={styles.tutorialCardContent}>
                             <div className={styles.tutorialText}>
                                <p className={styles.tutorialTitle}>Criação de Pool Simplificada</p>
                                <p className={styles.tutorialDescription}>
                                    A criação de mercados e pools de liquidez será totalmente automatizada para que possa lançar o seu token em minutos.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    );
}

