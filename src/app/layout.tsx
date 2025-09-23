import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import { WalletProvider } from "@/context/WalletContext";
import ConnectWallet from "@/components/ConnectWallet";
import styles from './Layout.module.css';

export const metadata = {
  title: "Create Token Solana",
  description: "App para criar tokens SPL na blockchain Solana",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <WalletProvider>
          <div className={styles.wrapper}>
            <header className={styles.header}>
              <div className={`${styles.container} ${styles.headerContainer}`}>
                <div className={styles.navContainer}>
                  <Link href="/" className={styles.logoLink}>
                    <span className={styles.logoText}>🚀 CreateToken</span>
                  </Link>
                  <nav className={styles.nav}>
                    <Link href="/create">Criar Token</Link>
                    <Link href="/costs">Custos</Link>
                    <Link href="/settings">Configurações</Link>
                  </nav>
                </div>
                <div className={styles.walletContainer}>
                  <ConnectWallet />
                </div>
              </div>
            </header>
            <main className={`${styles.container} ${styles.main}`}>{children}</main>
            <footer className={styles.footer}>
              <div className={`${styles.container} ${styles.footerContainer}`}>
                <p className={styles.footerText}>
                  © {new Date().getFullYear()} CreateTokenSolana
                </p>
              </div>
            </footer>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
