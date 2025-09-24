import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata } from 'next';
import Link from "next/link";
import { WalletProvider } from "@/context/WalletContext";
import ConnectWallet from "@/components/ConnectWallet";
import styles from './Layout.module.css';
import ThemeSwitcher from "../components/ThemeSwitcher";

// Ícones SVG
const IconPlusCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
);
const IconFlame = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
);
const IconSend = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
);
const IconSettings = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);


const siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

export const metadata: Metadata = {
  title: {
    default: 'Create Token Solana | Ferramenta Completa de Gerenciamento',
    template: '%s | Create Token Solana',
  },
  description: 'Crie, queime, distribua (airdrop) e gerencie seu token SPL na Solana. A ferramenta mais rápida, barata e completa.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'Create Token Solana | Ferramenta Completa de Gerenciamento',
    description: 'Crie, queime e distribua tokens SPL com as menores taxas.',
    url: siteUrl,
    siteName: 'Create Token Solana',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Gerencie seu Token na Solana com a melhor ferramenta do mercado.',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create Token Solana | Ferramenta Completa de Gerenciamento',
    description: 'Crie, queime e distribua tokens SPL com as menores taxas.',
    images: [`${siteUrl}/og-image.png`],
  },
};


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap" rel="stylesheet" />
      </head>
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
                    <Link href="/create" className={styles.navLink}>
                      <IconPlusCircle className={styles.navIcon} />
                      <span>Criar</span>
                    </Link>
                    <Link href="/burn" className={styles.navLink}>
                        <IconFlame className={styles.navIcon} />
                        <span>Queimar</span>
                    </Link>
                    <Link href="/airdrop" className={styles.navLink}>
                        <IconSend className={styles.navIcon} />
                        <span>Airdrop</span>
                    </Link>
                    <Link href="/dashboard" className={styles.navLink}>
                        <IconSettings className={styles.navIcon} />
                        <span>Gerenciar</span>
                    </Link>
                  </nav>
                </div>
                <div className={styles.walletContainer}>
                  <ThemeSwitcher />
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
