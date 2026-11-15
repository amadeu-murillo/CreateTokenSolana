"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { WalletProvider, useCluster } from "../context/WalletContext";
import { LanguageProvider, useLanguage } from "../context/LanguageContext";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import ConnectWallet from "./ConnectWallet";
import FloatingLanguageSwitcher from "./FloatingLanguageSwitcher";
import styles from "../app/Layout.module.css";
import ThemeSwitcher from "./ThemeSwitcher";
import { useEffect, Suspense, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { isValidPublicKey } from "@/lib/security";
import { DEV_WALLET_ADDRESS, STANDARD_SERVICE_FEE_SOL } from "@/lib/constants";

const devWalletBase58 = DEV_WALLET_ADDRESS.toBase58();

const IconPlusCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
);
const IconFlame = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
);
const IconSend = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
);
const IconSettings = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73 2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const IconLayers = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
);
const IconBookOpen = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
);
const IconDollarSign = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);
const IconShield = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
);
const IconMenu = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);
const IconX = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

function AffiliateTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && isValidPublicKey(ref)) {
      try {
        localStorage.setItem("affiliateRef", ref.trim());
      } catch {
        // Ignore storage errors
      }
    }
  }, [searchParams]);

  return null;
}

function NetworkSwitcherPill() {
  const { cluster, setCluster } = useCluster();
  const { t } = useLanguage();

  return (
    <div className={styles.networkSwitcher} role="group" aria-label="Solana Network Selector">
      <button
        type="button"
        onClick={() => setCluster("mainnet-beta")}
        className={`${styles.networkBtn} ${
          cluster === "mainnet-beta" ? styles.networkBtnMainnet : ""
        }`}
      >
        <span className={styles.networkDotMainnet} />
        {t.network.mainnetShort}
      </button>
      <button
        type="button"
        onClick={() => setCluster("devnet")}
        className={`${styles.networkBtn} ${
          cluster === "devnet" ? styles.networkBtnDevnet : ""
        }`}
      >
        <span className={styles.networkDotDevnet} />
        {t.network.devnetShort}
      </button>
    </div>
  );
}

function FloatingUnderNavbarDock() {
  const { cluster } = useCluster();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { t } = useLanguage();
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetStatus, setFaucetStatus] = useState<string | null>(null);

  const isDevnet = cluster === "devnet";

  const handleRequestAirdrop = async () => {
    if (!publicKey || !connection) {
      window.open("https://faucet.solana.com/", "_blank", "noopener,noreferrer");
      return;
    }
    setFaucetLoading(true);
    setFaucetStatus(null);
    try {
      const sig = await connection.requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL);
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed"
      );
      setFaucetStatus(t.network.faucetSuccess);
      setTimeout(() => setFaucetStatus(null), 4000);
    } catch {
      window.open("https://faucet.solana.com/", "_blank", "noopener,noreferrer");
    } finally {
      setFaucetLoading(false);
    }
  };

  return (
    <div className={styles.floatingDockOuter} role="region" aria-label="Network and Wallet Controls">
      <div
        className={`${styles.floatingDockBar} ${
          isDevnet ? styles.floatingDockBarDevnet : styles.floatingDockBarMainnet
        }`}
      >
        <div className={styles.floatingDockLeft}>
          <NetworkSwitcherPill />

          <div className={styles.floatingNetworkHint}>
            <span className={isDevnet ? styles.bannerPillDevnet : styles.bannerPillMainnet}>
              {isDevnet ? "🟠 DEVNET SANDBOX" : "🟢 MAINNET LIVE"}
            </span>
            <span className={styles.floatingHintText}>
              {isDevnet ? t.network.devnetBannerTitle : t.network.mainnetBannerTitle}
            </span>
          </div>
        </div>

        <div className={styles.floatingDockRight}>
          {isDevnet && (
            <button
              type="button"
              onClick={handleRequestAirdrop}
              disabled={faucetLoading}
              className={styles.bannerFaucetBtn}
            >
              {faucetLoading
                ? t.network.faucetLoading
                : faucetStatus || t.network.faucetBtn}
            </button>
          )}
          <div className={styles.floatingWalletBox}>
            <ConnectWallet />
          </div>
        </div>
      </div>
    </div>
  );
}

function NavLinks({ onLinkClick, mobile = false }: { onLinkClick?: () => void; mobile?: boolean }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navLinks = [
    { href: "/", icon: <IconPlusCircle className={styles.navIcon} />, label: t.nav.createToken },
    { href: "/add-liquidity", icon: <IconLayers className={styles.navIcon} />, label: t.nav.liquidityPool },
    { href: "/burn", icon: <IconFlame className={styles.navIcon} />, label: t.nav.burn },
    { href: "/airdrop", icon: <IconSend className={styles.navIcon} />, label: t.nav.airdrop },
    { href: "/dashboard", icon: <IconSettings className={styles.navIcon} />, label: t.nav.manage },
    { href: "/afiliates", icon: <IconDollarSign className={styles.navIcon} />, label: t.nav.affiliates },
    { href: "/documentacao", icon: <IconBookOpen className={styles.navIcon} />, label: t.nav.docs },
  ];

  if (mobile) {
    return (
      <>
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href || (link.href === "/" && pathname === "/create");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileNavLink} ${isActive ? styles.active : ""}`}
              onClick={onLinkClick}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <nav className={styles.nav} aria-label="Primary Navigation">
      {navLinks.map((link) => {
        const isActive =
          pathname === link.href || (link.href === "/" && pathname === "/create");
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.navLink} ${isActive ? styles.active : ""}`}
            onClick={onLinkClick}
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function TrustFooter() {
  const { cluster } = useCluster();
  const { t } = useLanguage();
  const clusterSuffix = cluster === "devnet" ? "?cluster=devnet" : "";
  const feeText = `${STANDARD_SERVICE_FEE_SOL.toFixed(2)} SOL`;
  const badgeIcons = [<IconShield key="s" />, <IconLayers key="l" />, <IconPlusCircle key="p" />, <IconSettings key="g" />];

  return (
    <footer className={styles.footer}>
      <div className={`${styles.container} ${styles.footerContainer}`}>
        <div className={styles.trustBadgesGrid}>
          {t.footer.badges.map((badge, idx) => (
            <div key={idx} className={styles.trustBadgeCard}>
              <div className={styles.trustBadgeIcon}>{badgeIcons[idx]}</div>
              <div>
                <h5>{badge.title}</h5>
                <p>{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footerGrid}>
          <div className={styles.footerBranding}>
            <Link href="/" className={styles.logoLink}>
              <span className={styles.logoText}>CreateTokenSolana</span>
              {cluster === "devnet" && (
                <span className={styles.devnetHeaderBadge} title="Solana Devnet">
                  ● DEVNET
                </span>
              )}
            </Link>
            <p className={styles.footerTagline}>{t.footer.tagline}</p>
            <div className={styles.networkStatusBadge}>
              <span className={styles.statusDotOnline} />
              <span>
                {t.footer.connectedTo}:{" "}
                <strong>{cluster === "devnet" ? t.network.devnetShort : t.network.mainnetShort}</strong>
              </span>
            </div>
          </div>

          <div className={styles.footerColumn}>
            <h4 className={styles.footerColumnTitle}>{t.footer.servicesTitle}</h4>
            <Link href="/" className={styles.footerLink}>
              {t.nav.createToken} (0.10–0.55 SOL)
            </Link>
            <Link href="/add-liquidity" className={styles.footerLink}>
              {t.nav.liquidityPool} ({feeText})
            </Link>
            <Link href="/burn" className={styles.footerLink}>
              {t.nav.burn}
            </Link>
            <Link href="/airdrop" className={styles.footerLink}>
              {t.nav.airdrop} ({feeText})
            </Link>
            <Link href="/dashboard" className={styles.footerLink}>
              {t.nav.manage} ({feeText})
            </Link>
          </div>

          <div className={styles.footerColumn}>
            <h4 className={styles.footerColumnTitle}>{t.footer.resourcesTitle}</h4>
            <Link href="/afiliates" className={styles.footerLink}>
              {t.nav.affiliates}
            </Link>
            <Link href="/costs" className={styles.footerLink}>
              {t.costsPage?.pageTitle || "Transparent Costs & Fees Table"}
            </Link>
            <Link href="/documentacao" className={styles.footerLink}>
              {t.nav.docs}
            </Link>
            <a
              href={`https://solscan.io/account/${devWalletBase58}${clusterSuffix}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLinkMono}
            >
              Dev Fee Wallet: {devWalletBase58.slice(0, 6)}...{devWalletBase58.slice(-4)} ↗
            </a>
          </div>

          <div className={styles.footerColumn}>
            <h4 className={styles.footerColumnTitle}>{t.footer.programsTitle}</h4>
            <a
              href={`https://solscan.io/account/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA${clusterSuffix}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLinkMono}
            >
              SPL Token: Tokenkeg...VQ5DA ↗
            </a>
            <a
              href={`https://solscan.io/account/TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb${clusterSuffix}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLinkMono}
            >
              Token-2022: TokenzQd...PxuEb ↗
            </a>
            <a
              href={`https://solscan.io/account/metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s${clusterSuffix}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLinkMono}
            >
              Metaplex: metaqbxx...18x1s ↗
            </a>
            <a
              href={`https://solscan.io/account/CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C${clusterSuffix}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLinkMono}
            >
              Raydium CPMM: CPMMoo8L...qKP1C ↗
            </a>
            <a
              href={`https://solscan.io/account/Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB${clusterSuffix}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLinkMono}
            >
              Meteora DAMM: Eo7WjKq6...n5UaB ↗
            </a>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.footerText}>
            © {new Date().getFullYear()} CreateTokenSolana. {t.footer.rightsReserved}
          </p>
          <p className={styles.footerDisclaimer}>{t.footer.securityNotice}</p>
        </div>
      </div>
    </footer>
  );
}

function InnerAppShell({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { cluster } = useCluster();

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname]);

  const isDevnet = cluster === "devnet";

  return (
    <div className={styles.wrapper} data-cluster={cluster} data-network={cluster}>
      <header className={isDevnet ? styles.headerDevnet : styles.header}>
        <div className={`${styles.container} ${styles.headerContainer}`}>
          <div className={styles.navContainer}>
            <Link href="/" className={styles.logoLink} onClick={closeMobileMenu}>
              <span className={styles.logoText}>CreateTokenSolana</span>
              {isDevnet && (
                <span className={styles.devnetHeaderBadge} title="Solana Devnet">
                  ● DEVNET
                </span>
              )}
            </Link>
            <NavLinks onLinkClick={closeMobileMenu} />
          </div>

          <div className={styles.rightItemsContainer}>
            <ThemeSwitcher />
            <button
              className={styles.mobileMenuButton}
              onClick={toggleMobileMenu}
              aria-label="Toggle Menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <IconX /> : <IconMenu />}
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className={styles.mobileNav}>
          <NavLinks onLinkClick={closeMobileMenu} mobile />
        </div>
      )}

      <FloatingUnderNavbarDock />

      <main className={`${styles.container} ${styles.main}`}>{children}</main>

      <TrustFooter />

      <FloatingLanguageSwitcher />
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <WalletProvider>
        <Suspense fallback={null}>
          <AffiliateTracker />
        </Suspense>
        <InnerAppShell>{children}</InnerAppShell>
      </WalletProvider>
    </LanguageProvider>
  );
}
