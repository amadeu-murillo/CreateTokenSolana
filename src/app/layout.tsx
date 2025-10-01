"use client";

import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import { WalletProvider } from "../context/WalletContext";
import ConnectWallet from "../components/ConnectWallet";
import styles from './Layout.module.css';
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";


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
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73 2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const IconLayers = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
);
const IconBookOpen = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
);
const IconDollarSign = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);


function AffiliateTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      localStorage.setItem('affiliateRef', ref);
    }
  }, [searchParams]);

  return null; // Este componente não renderiza nada
}

function NavLinks() {
  const pathname = usePathname();
  const navLinks = [
    { href: "/create", icon: <IconPlusCircle className={styles.navIcon} />, label: "Criar" },
    { href: "/add-liquidity", icon: <IconLayers className={styles.navIcon} />, label: "Liquidez" },
    { href: "/burn", icon: <IconFlame className={styles.navIcon} />, label: "Queimar" },
    { href: "/airdrop", icon: <IconSend className={styles.navIcon} />, label: "Airdrop" },
    { href: "/dashboard", icon: <IconSettings className={styles.navIcon} />, label: "Gerenciar" },
    { href: "/afiliates", icon: <IconDollarSign className={styles.navIcon} />, label: "Afiliados" },
    { href: "/documentacao", icon: <IconBookOpen className={styles.navIcon} />, label: "Documentação" },
  ];

  return (
    <nav className={styles.nav}>
      {navLinks.map(link => (
        <Link key={link.href} href={link.href} className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}>
          {link.icon}
          <span>{link.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <title>Create Token Solana</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <WalletProvider>
          <Suspense fallback={null}>
            <AffiliateTracker />
          </Suspense>
          <div className={styles.wrapper}>
            <header className={styles.header}>
              <div className={`${styles.container} ${styles.headerContainer}`}>
                <div className={styles.navContainer}>
                  <Link href="/" className={styles.logoLink}>
                    <span className={styles.logoText}>🚀 CreateToken</span>
                  </Link>
                  <NavLinks />
                </div>
                <div className={styles.walletContainer}>
                  <ThemeSwitcher />
                  {/* O botão da carteira foi movido para o container flutuante abaixo */}
                </div>
              </div>
            </header>

            <div className={styles.floatingWalletContainer}>
              <ConnectWallet />
            </div>
            
            <main className={`${styles.container} ${styles.main}`}>{children}</main>
            
            <footer className={styles.footer}>
              <div className={`${styles.container} ${styles.footerContainer}`}>
                <div className={styles.footerGrid}>
                  <div className={styles.footerBranding}>
                    <Link href="/" className={styles.logoLink}>
                      <span className={styles.logoText}>🚀 CreateToken</span>
                    </Link>
                    <p className={styles.footerTagline}>
                      A forma mais fácil e segura de lançar e gerenciar tokens na rede Solana.
                    </p>
                    
                  </div>
                  <div className={styles.footerColumn}>
                    <h4 className={styles.footerColumnTitle}>Ferramentas</h4>
                    <Link href="/create" className={styles.footerLink}>Criar Token</Link>
                    <Link href="/add-liquidity" className={styles.footerLink}>Criar Liquidez</Link>
                    <Link href="/burn" className={styles.footerLink}>Queimar Tokens</Link>
                    <Link href="/airdrop" className={styles.footerLink}>Airdrop</Link>
                    <Link href="/dashboard" className={styles.footerLink}>Gerenciar</Link>
                  </div>
                  <div className={styles.footerColumn}>
                    <h4 className={styles.footerColumnTitle}>Recursos</h4>
                    <a href="/#faq" className={styles.footerLink}>FAQ</a>
                    <Link href="/costs" className={styles.footerLink}>Custos</Link>
                    <Link href="/afiliates" className={styles.footerLink}>Programa de Afiliados</Link>
                    <Link href="/documentacao" className={styles.footerLink}>Documentação</Link>
                  </div>
                </div>
                <div className={styles.footerBottom}>
                  <p className={styles.footerText}>
                    © {new Date().getFullYear()} CreateTokenSolana. Todos os direitos reservados.
                  </p>
                  <p className={styles.footerDisclaimer}>
                      Sempre verifique as transações em sua carteira.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}


