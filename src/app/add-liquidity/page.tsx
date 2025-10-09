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
                <h1 className={styles.pageTitle}>Add Liquidity to Your Token</h1>
                <p className={styles.pageDescription}>
                    Feature under development. Soon, you’ll be able to create liquidity pools directly here.
                </p>
            </header>

             <div className={styles.grid}>
                <main className={styles.mainContent}>
                    <Card>
                        <CardHeader>
                            <CardTitle className={styles.cardTitle}>
                                <IconExternalLink />
                                Use Meteora for now
                            </CardTitle>
                            <CardDescription>
                                The native liquidity pool creation is being finalized. Meanwhile, you can use Meteora’s liquidity creation, one of the main liquidity platforms on Solana.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <p className={styles.infoText}>Click the button below to be redirected to Meteora’s pool creation page. You’ll need to connect your wallet there and follow the instructions.</p>
                        </CardContent>
                        <div className={styles.cardFooter}>
                            <a href="https://www.meteora.ag/pools/create" target="_blank" rel="noopener noreferrer" className={styles.meteoraButtonLink}>
                                <Button className="w-full">
                                    Create Liquidity Pool on Meteora
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
                                What is Liquidity?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className={styles.infoContent}>
                            <p className={styles.infoText}>
                                Liquidity is the ability of an asset to be easily bought or sold without causing a drastic change in its price. In DeFi, a “liquidity pool” is a pair of tokens (for example, your token and SOL) locked in a smart contract on a decentralized exchange (DEX).
                            </p>
                            <p className={styles.infoText}>
                                By providing liquidity, you enable others to trade your token, which is essential for it to have value and utility in the market.
                            </p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className={styles.cardTitle}>
                                <IconLayers />
                                Token Types for Liquidity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className={styles.infoContent}>
                            <p className={styles.infoText}>
                                Typically, a pool is formed by your token and a high-liquidity token such as:
                            </p>
                            <ul className={styles.tokenList}>
                                <li><strong>SOL:</strong> The native cryptocurrency of Solana. Most new tokens start with a TOKEN/SOL pair.</li>
                                <li><strong>USDC:</strong> A stablecoin pegged to the US dollar, offering a stable trading pair.</li>
                            </ul>
                             <p className={styles.infoText}>
                                The initial ratio of tokens you deposit in the pool will define the launch price of your asset.
                            </p>
                        </CardContent>
                    </Card>
                </aside>
            </div>

        </div>
    );
}
