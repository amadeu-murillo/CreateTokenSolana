"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { WalletProvider, useCluster } from "../context/WalletContext";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import ConnectWallet from "./ConnectWallet";
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

function NetworkAndFaucetControls() {
  const { cluster, setCluster } = useCluster();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetStatus, setFaucetStatus] = useState<string | null>(null);

  const handleRequestAirdrop = async () => {
    if (!publicKey || !connection) return;
    setFaucetLoading(true);
    setFaucetStatus(null);
    try {
      const sig = await connection.requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed"
      );
      setFaucetStatus("+1 SOL Added!");
      setTimeout(() => setFaucetStatus(null), 4000);
    } catch {
      window.open("https://faucet.solana.com/", "_blank", "noopener,noreferrer");
    } finally {
      setFaucetLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div className={styles.networkSwitcher} role="group" aria-label="Solana Network Selector">
        <button
          type="button"
          onClick={() => setCluster("mainnet-beta")}
          className={`${styles.networkBtn} ${
            cluster === "mainnet-beta" ? styles.networkBtnMainnet : ""
          }`}
        >
          <span className={styles.networkDotMainnet} />
          Mainnet
        </button>
        <button
          type="button"
          onClick={() => setCluster("devnet")}
          className={`${styles.networkBtn} ${
            cluster === "devnet" ? styles.networkBtnDevnet : ""
          }`}
        >
          <span className={styles.networkDotDevnet} />
          Devnet
        </button>
      </div>

      {cluster === "devnet" && publicKey && (
        <button
          type="button"
          onClick={handleRequestAirdrop}
          disabled={faucetLoading}
          title="Request 1 Devnet SOL for testing"
          style={{
            padding: "0.35rem 0.65rem",
            borderRadius: "8px",
            fontSize: "0.75rem",
            fontWeight: 600,
            background: "rgba(245, 158, 11, 0.14)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            color: "#fbbf24",
            cursor: faucetLoading ? "wait" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {faucetLoading ? "Airdropping..." : faucetStatus || "+1 Devnet SOL"}
        </button>
      )}
    </div>
  );
}

const navLinks = [
  { href: "/", icon: <IconPlusCircle className={styles.navIcon} />, label: "Create Token" },
  { href: "/add-liquidity", icon: <IconLayers className={styles.navIcon} />, label: "Liquidity Pool" },
  { href: "/burn", icon: <IconFlame className={styles.navIcon} />, label: "Burn" },
  { href: "/airdrop", icon: <IconSend className={styles.navIcon} />, label: "Airdrop" },
  { href: "/dashboard", icon: <IconSettings className={styles.navIcon} />, label: "Manage" },
  { href: "/afiliates", icon: <IconDollarSign className={styles.navIcon} />, label: "Affiliates" },
  { href: "/documentacao", icon: <IconBookOpen className={styles.navIcon} />, label: "Docs" },
];

function NavLinks({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();

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
  const clusterSuffix = cluster === "devnet" ? "?cluster=devnet" : "";
  const feeText = `${STANDARD_SERVICE_FEE_SOL.toFixed(2)} SOL`;

  return (
    <footer className={styles.footer}>
      <div className={`${styles.container} ${styles.footerContainer}`}>
        <div className={styles.trustBadgesGrid}>
          <div className={styles.trustBadgeCard}>
            <div className={styles.trustBadgeIcon}>
              <IconShield />
            </div>
            <div>
              <h5>100% Non-Custodial & Program-Whitelisted</h5>
              <p>
                Every transaction is verified against our client-side Solana program whitelist and
                simulated before your wallet signs.
              </p>
            </div>
          </div>

          <div className={styles.trustBadgeCard}>
            <div className={styles.trustBadgeIcon}>
              <IconLayers />
            </div>
            <div>
              <h5>Audited On-Chain Protocols</h5>
              <p>
                Built directly on official Solana SPL Token, Token-2022, Metaplex Token Metadata,
                and Constant-Product AMM Liquidity Vaults.
              </p>
            </div>
          </div>

          <div className={styles.trustBadgeCard}>
            <div className={styles.trustBadgeIcon}>
              <IconPlusCircle />
            </div>
            <div>
              <h5>Standardized {feeText} Dev Fee</h5>
              <p>
                Every platform service routes a flat {feeText} fee atomically on-chain to Dev Wallet
                ({devWalletBase58.slice(0, 6)}...{devWalletBase58.slice(-4)}) with 10% instant
                referral splits.
              </p>
            </div>
          </div>

          <div className={styles.trustBadgeCard}>
            <div className={styles.trustBadgeIcon}>
              <IconSettings />
            </div>
            <div>
              <h5>Mainnet-Beta Default & Devnet Ready</h5>
              <p>
                Defaults to Solana Mainnet-Beta for production launches, with 1-click switching to
                Solana Devnet for testing.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.footerGrid}>
          <div className={styles.footerBranding}>
            <Link href="/" className={styles.logoLink}>
              <span className={styles.logoText}>CreateTokenSolana</span>
            </Link>
            <p className={styles.footerTagline}>
              Swiss-engineered non-custodial launchpad for creating SPL & Token-2022 assets,
              initializing AMM liquidity pools, and managing token authorities on Solana.
            </p>
            <div className={styles.networkStatusBadge}>
              <span className={styles.statusDotOnline} />
              <span>
                Connected to Solana{" "}
                <strong>{cluster === "devnet" ? "Devnet" : "Mainnet-Beta"}</strong> RPC
              </span>
            </div>
          </div>

          <div className={styles.footerColumn}>
            <h4 className={styles.footerColumnTitle}>Platform Services ({feeText})</h4>
            <Link href="/" className={styles.footerLink}>
              Token Creator (0.90 SOL Fee)
            </Link>
            <Link href="/add-liquidity" className={styles.footerLink}>
              Liquidity Pool ({feeText} Fee)
            </Link>
            <Link href="/burn" className={styles.footerLink}>
              Burn Tokens & LP ({feeText} Fee)
            </Link>
            <Link href="/airdrop" className={styles.footerLink}>
              Mass Airdrop ({feeText} / Batch)
            </Link>
            <Link href="/dashboard" className={styles.footerLink}>
              Revoke Authorities ({feeText} Fee)
            </Link>
          </div>

          <div className={styles.footerColumn}>
            <h4 className={styles.footerColumnTitle}>Resources & Transparency</h4>
            <Link href="/afiliates" className={styles.footerLink}>
              Affiliate Program (10% SOL)
            </Link>
            <Link href="/costs" className={styles.footerLink}>
              Transparent Fee Schedule
            </Link>
            <Link href="/documentacao" className={styles.footerLink}>
              Technical Documentation
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
            <h4 className={styles.footerColumnTitle}>Verified On-Chain Programs</h4>
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
            © {new Date().getFullYear()} CreateTokenSolana. All rights reserved. Non-custodial
            interface for the Solana blockchain.
          </p>
          <p className={styles.footerDisclaimer}>
            Security Notice: Always review transaction simulations in your wallet before signing.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname]);

  return (
    <WalletProvider>
      <Suspense fallback={null}>
        <AffiliateTracker />
      </Suspense>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <div className={`${styles.container} ${styles.headerContainer}`}>
            <div className={styles.navContainer}>
              <Link href="/" className={styles.logoLink} onClick={closeMobileMenu}>
                <span className={styles.logoText}>CreateToken</span>
              </Link>
              <NavLinks onLinkClick={closeMobileMenu} />
            </div>

            <div className={styles.rightItemsContainer}>
              <NetworkAndFaucetControls />
              <div className={styles.desktopWalletWrapper}>
                <ConnectWallet />
              </div>
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
            <div className={styles.mobileWalletRow}>
              <ConnectWallet />
            </div>
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || (link.href === "/" && pathname === "/create");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.mobileNavLink} ${isActive ? styles.active : ""}`}
                  onClick={closeMobileMenu}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        <main className={`${styles.container} ${styles.main}`}>{children}</main>

        <TrustFooter />
      </div>
    </WalletProvider>
  );
}
