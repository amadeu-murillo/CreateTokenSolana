import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import { WalletProvider } from "@/context/WalletContext";
import ConnectWallet from "@/components/ConnectWallet";
import styles from './Layout.module.css';

// Ícones SVG para navegação
const IconPlusCircle = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const IconCreditCard = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IconSettings = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);


export const metadata = {
  title: "Create Token Solana",
  description: "App para criar tokens SPL na blockchain Solana",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="dark">
        <WalletProvider>
          <div className={styles.wrapper}>
            <header className={styles.header}>
              <div className={`${styles.container} ${styles.headerContainer}`}>
                <div className={styles.navContainer}>
                  <Link href="/" className={styles.logoLink}>
                    <span className={styles.logoText}>🚀 CreateToken</span>
                  </Link>
                  <nav className={styles.nav}>
                    <Link href="/create" className={styles.navLink}>
                      <IconPlusCircle className={styles.navIcon} />
                      <span>Criar Token</span>
                    </Link>
                    <Link href="/costs" className={styles.navLink}>
                       <IconCreditCard className={styles.navIcon} />
                       <span>Custos</span>
                    </Link>
                    
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
                  © {new Date().getFullYear()} CreateTokenSolana. Feito com ❤️.
                </p>
              </div>
            </footer>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
