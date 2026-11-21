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
import { OFFICIAL_LINKS } from "@/lib/seo";
import { trackEvent } from "@/lib/analytics";

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
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73 2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const IconLayers = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
);
const IconDollarSign = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);
const IconShield = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
);
const IconZap = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);
const IconTrendingUp = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
);
const IconLock = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const IconBookOpen = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
);
const IconGrid = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
);
const IconMenu = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);
const IconX = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

function AffiliateTracker({ onRefChange }: { onRefChange?: (ref: string | null) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && isValidPublicKey(ref)) {
      const cleaned = ref.trim();
      try {
        localStorage.setItem("affiliateRef", cleaned);
      } catch {
        // Ignore storage errors
      }
      trackEvent("affiliate_ref_captured", { has_ref: true });
      onRefChange?.(cleaned);
    } else {
      try {
        const stored = localStorage.getItem("affiliateRef");
        if (stored && isValidPublicKey(stored)) {
          onRefChange?.(stored);
        }
      } catch {
        // Ignore
      }
    }
  }, [searchParams, onRefChange]);

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

/**
 * Row 2 — Dedicated Network & Wallet Bar:
 * Clean, focused strip exclusively for Solana Network selection (Mainnet/Devnet),
 * Devnet Faucet, network status hint, and Connect Wallet.
 */
function NetworkWalletBar() {
  const { cluster } = useCluster();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { t, locale } = useLanguage();
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetStatus, setFaucetStatus] = useState<string | null>(null);

  const isDevnet = cluster === "devnet";
  const isPt = locale === "pt" || locale === "pt-BR";

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
    <div className={styles.walletBarOuter} role="region" aria-label="Network and Wallet Controls">
      <div
        className={`${styles.walletBarInner} ${
          isDevnet ? styles.walletBarDevnet : styles.walletBarMainnet
        }`}
      >
        <div className={styles.walletBarLeft}>
          <NetworkSwitcherPill />

          <span className={styles.walletBarNetworkHint}>
            {isDevnet
              ? isPt
                ? "Ambiente de testes (SOL gratuito)"
                : "Test environment (free Devnet SOL)"
              : isPt
                ? "Rede Principal Solana · RPC Protegido"
                : "Solana Production Network · Protected RPC"}
          </span>

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
        </div>

        <div className={styles.walletBarRight}>
          <div className={styles.floatingWalletBox}>
            <ConnectWallet />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Row 3 — Dedicated DeFi Toolkit Bar:
 * Separate, breathable third bar exclusively for auxiliary DeFi utilities
 * (Reclaim SOL, Vesting & Lock, Airdrop, Manage Authorities, Fee Schedule).
 */
function DeFiToolkitBar({ affiliateRef }: { affiliateRef?: string | null }) {
  const pathname = usePathname();
  const { t, locale } = useLanguage();
  const isPt = locale === "pt" || locale === "pt-BR";

  const withRef = (basePath: string) =>
    affiliateRef ? `${basePath}?ref=${encodeURIComponent(affiliateRef)}` : basePath;

  const secondaryTools = [
    {
      href: "/reclaim",
      icon: <IconZap className={styles.toolBarIcon} />,
      label: isPt ? "Recuperar SOL" : "Reclaim SOL",
      badge: "92% Net",
      accentClass: styles.toolAccentEmerald,
    },
    {
      href: "/vesting",
      icon: <IconLock className={styles.toolBarIcon} />,
      label: "Vesting & Lock",
      badge: "Cert PNG",
      accentClass: styles.toolAccentViolet,
    },
    {
      href: "/airdrop",
      icon: <IconSend className={styles.toolBarIcon} />,
      label: t.nav.airdrop,
      accentClass: styles.toolAccentCyan,
    },
    {
      href: "/dashboard",
      icon: <IconSettings className={styles.toolBarIcon} />,
      label: t.nav.manage,
      accentClass: styles.toolAccentAmber,
    },
    {
      href: "/costs",
      icon: <IconShield className={styles.toolBarIcon} />,
      label: isPt ? "Tabela de Taxas" : "Fee Schedule",
      badge: "30/70",
      accentClass: styles.toolAccentNeon,
    },
  ];

  return (
    <div className={styles.toolkitBarOuter} role="region" aria-label="DeFi Utilities Bar">
      <div className={styles.toolkitBarInner}>
        <div className={styles.toolkitBarTag}>
          <IconGrid />
          <span>{isPt ? "Ferramentas DeFi" : "DeFi Tools"}</span>
        </div>

        <nav className={styles.toolkitBarList} aria-label="Secondary DeFi Utilities">
          {secondaryTools.map((tool) => {
            const isActive = pathname === tool.href;
            return (
              <Link
                key={tool.href}
                href={withRef(tool.href)}
                className={`${styles.toolkitPill} ${isActive ? styles.toolkitPillActive : ""}`}
              >
                <span className={`${styles.toolkitIconBox} ${tool.accentClass}`}>
                  {tool.icon}
                </span>
                <span className={styles.toolkitPillLabel}>{tool.label}</span>
                {tool.badge && <span className={styles.toolkitMiniBadge}>{tool.badge}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

/**
 * Row 1 — Primary Top Navigation Bar:
 * Focused strictly on the 5 core user journeys so items never overflow or wrap on desktop.
 * Row 2 handles Network & Wallet, Row 3 houses DeFi Tools, and Documentation lives in the Footer.
 */
function NavLinks({
  onLinkClick,
  mobile = false,
  affiliateRef,
}: {
  onLinkClick?: () => void;
  mobile?: boolean;
  affiliateRef?: string | null;
}) {
  const pathname = usePathname();
  const { t, locale } = useLanguage();
  const isPt = locale === "pt" || locale === "pt-BR";

  const withRef = (basePath: string) =>
    affiliateRef ? `${basePath}?ref=${encodeURIComponent(affiliateRef)}` : basePath;

  const primaryLinks = [
    { href: "/", icon: <IconPlusCircle className={styles.navIcon} />, label: t.nav.createToken },
    { href: "/add-liquidity", icon: <IconLayers className={styles.navIcon} />, label: t.nav.liquidityPool },
    { href: "/volume-bot", icon: <IconTrendingUp className={styles.navIcon} />, label: "Volume Bot" },
    { href: "/burn", icon: <IconFlame className={styles.navIcon} />, label: t.nav.burn },
    { href: "/afiliates", icon: <IconDollarSign className={styles.navIcon} />, label: t.nav.affiliates },
  ];

  const secondaryMobileLinks = [
    { href: "/reclaim", icon: <IconZap className={styles.navIcon} />, label: isPt ? "Recuperar SOL (92% Net)" : "Reclaim SOL (92% Net)" },
    { href: "/vesting", icon: <IconLock className={styles.navIcon} />, label: "Vesting & LP Lock" },
    { href: "/airdrop", icon: <IconSend className={styles.navIcon} />, label: t.nav.airdrop },
    { href: "/dashboard", icon: <IconSettings className={styles.navIcon} />, label: t.nav.manage },
    { href: "/costs", icon: <IconShield className={styles.navIcon} />, label: isPt ? "Tabela de Custos" : "Fee Schedule" },
    { href: "/documentacao", icon: <IconBookOpen className={styles.navIcon} />, label: t.nav.docs },
  ];

  if (mobile) {
    return (
      <>
        <div className={styles.mobileDrawerGroupLabel}>
          {isPt ? "Menu Principal" : "Primary Navigation"}
        </div>
        {primaryLinks.map((link) => {
          const isActive =
            pathname === link.href || (link.href === "/" && pathname === "/create");
          return (
            <Link
              key={link.href}
              href={withRef(link.href)}
              className={`${styles.mobileNavLink} ${isActive ? styles.active : ""}`}
              onClick={onLinkClick}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          );
        })}

        <div className={styles.mobileDrawerGroupLabel} style={{ marginTop: "0.5rem" }}>
          {isPt ? "Ferramentas DeFi & Recursos" : "DeFi Tools & Resources"}
        </div>
        {secondaryMobileLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={withRef(link.href)}
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
      {primaryLinks.map((link) => {
        const isActive =
          pathname === link.href || (link.href === "/" && pathname === "/create");
        return (
          <Link
            key={link.href}
            href={withRef(link.href)}
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

function TrustFooter({ affiliateRef }: { affiliateRef?: string | null }) {
  const { cluster } = useCluster();
  const { t, locale } = useLanguage();
  const isPt = locale === "pt" || locale === "pt-BR";
  const clusterSuffix = cluster === "devnet" ? "?cluster=devnet" : "";
  const feeText = `${STANDARD_SERVICE_FEE_SOL.toFixed(2)} SOL`;
  const badgeIcons = [<IconShield key="s" />, <IconLayers key="l" />, <IconPlusCircle key="p" />, <IconSettings key="g" />];
  const withRef = (basePath: string) =>
    affiliateRef ? `${basePath}?ref=${encodeURIComponent(affiliateRef)}` : basePath;

  return (
    <footer className={styles.footer}>
      <div className={`${styles.container} ${styles.footerContainer}`}>
        {/* Prominent Footer Documentation & Technical Guide Banner */}
        <div className={styles.footerDocsCallout}>
          <div className={styles.footerDocsCalloutLeft}>
            <div className={styles.footerDocsIconBox}>
              <IconBookOpen />
            </div>
            <div>
              <h4 className={styles.footerDocsTitle}>
                {isPt
                  ? "Documentação Técnica & Guia Completo de Lançamento (RugCheck 100/100)"
                  : "Technical Documentation & Complete Launch Guide (100/100 RugCheck)"}
              </h4>
              <p className={styles.footerDocsDesc}>
                {isPt
                  ? "Consulte o passo a passo de criação SPL/Token-2022, pools Raydium CPMM, Jito Bundles, Cofre de Vesting e tabela transparente de taxas on-chain."
                  : "Explore our step-by-step guide for SPL/Token-2022 minting, Raydium CPMM pools, Jito Bundles, Vesting Vaults, and transparent on-chain fees."}
              </p>
            </div>
          </div>
          <div className={styles.footerDocsActions}>
            <Link href={withRef("/documentacao")} className={styles.footerDocsPrimaryBtn}>
              <IconBookOpen className={styles.navIcon} />
              <span>{t.nav.docs}</span>
            </Link>
            <Link href={withRef("/costs")} className={styles.footerDocsSecondaryBtn}>
              <span>{isPt ? "Ver Tabela de Custos" : "View Fee Schedule"}</span>
            </Link>
          </div>
        </div>

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
            <Link href={withRef("/")} className={styles.logoLink}>
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
            <Link href={withRef("/")} className={styles.footerLink}>
              {t.nav.createToken}
            </Link>
            <Link href={withRef("/add-liquidity")} className={styles.footerLink}>
              {t.nav.liquidityPool} ({feeText})
            </Link>
            <Link href={withRef("/volume-bot")} className={styles.footerLink}>
              Volume & Maker Booster (0.05–0.25 SOL)
            </Link>
            <Link href={withRef("/vesting")} className={styles.footerLink}>
              Token Vesting & LP Lock (0.10 SOL)
            </Link>
            <Link href={withRef("/reclaim")} className={styles.footerLink}>
              Reclaim SOL (92% Net / 8% Fee)
            </Link>
            <Link href={withRef("/burn")} className={styles.footerLink}>
              {t.nav.burn}
            </Link>
            <Link href={withRef("/airdrop")} className={styles.footerLink}>
              {t.nav.airdrop} ({feeText})
            </Link>
            <Link href={withRef("/dashboard")} className={styles.footerLink}>
              {t.nav.manage} ({feeText})
            </Link>
          </div>

          <div className={styles.footerColumn}>
            <h4 className={styles.footerColumnTitle}>{t.footer.resourcesTitle}</h4>
            <Link href={withRef("/documentacao")} className={styles.footerLinkHighlight}>
              📖 {t.nav.docs}
            </Link>
            <Link href={withRef("/costs")} className={styles.footerLink}>
              {t.costsPage?.pageTitle || "Transparent Costs & Fees Table"}
            </Link>
            <Link href={withRef("/afiliates")} className={styles.footerLink}>
              {t.nav.affiliates} (30% Split)
            </Link>
            <a
              href={OFFICIAL_LINKS.xUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              𝕏 Official (@CreateTokenSols) ↗
            </a>
            <a
              href={`mailto:${OFFICIAL_LINKS.supportEmail}`}
              className={styles.footerLink}
            >
              {OFFICIAL_LINKS.supportEmail}
            </a>
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
              href={`https://solscan.io/account/MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr${clusterSuffix}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLinkMono}
            >
              SPL Memo: MemoSq4g...mfcHr ↗
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

function WalletAnalyticsTracker() {
  const { connected, wallet } = useWallet();
  const { cluster } = useCluster();

  useEffect(() => {
    if (connected) {
      trackEvent("wallet_connected", {
        wallet_name: wallet?.adapter?.name || "unknown",
        cluster,
      });
    }
  }, [connected, wallet, cluster]);

  return null;
}

function InnerAppShell({
  children,
  affiliateRef,
}: {
  children: ReactNode;
  affiliateRef: string | null;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { cluster } = useCluster();

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname]);

  const isDevnet = cluster === "devnet";
  const homeHref = affiliateRef ? `/?ref=${encodeURIComponent(affiliateRef)}` : "/";

  return (
    <div className={styles.wrapper} data-cluster={cluster} data-network={cluster}>
      {/* Bar 1: Primary Header & Core Navigation */}
      <header className={isDevnet ? styles.headerDevnet : styles.header}>
        <div className={`${styles.container} ${styles.headerContainer}`}>
          <div className={styles.navContainer}>
            <Link href={homeHref} className={styles.logoLink} onClick={closeMobileMenu}>
              <span className={styles.logoText}>CreateTokenSolana</span>
              {isDevnet && (
                <span className={styles.devnetHeaderBadge} title="Solana Devnet">
                  ● DEVNET
                </span>
              )}
            </Link>
            <NavLinks onLinkClick={closeMobileMenu} affiliateRef={affiliateRef} />
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
          <NavLinks onLinkClick={closeMobileMenu} mobile affiliateRef={affiliateRef} />
        </div>
      )}

      {/* Bar 2: Network & Wallet Bar */}
      <NetworkWalletBar />

      {/* Bar 3: Dedicated DeFi Toolkit Bar */}
      <DeFiToolkitBar affiliateRef={affiliateRef} />

      <main className={`${styles.container} ${styles.main}`}>{children}</main>

      <TrustFooter affiliateRef={affiliateRef} />

      <FloatingLanguageSwitcher />
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [affiliateRef, setAffiliateRef] = useState<string | null>(null);

  return (
    <LanguageProvider>
      <WalletProvider>
        <Suspense fallback={null}>
          <AffiliateTracker onRefChange={setAffiliateRef} />
        </Suspense>
        <WalletAnalyticsTracker />
        <InnerAppShell affiliateRef={affiliateRef}>{children}</InnerAppShell>
      </WalletProvider>
    </LanguageProvider>
  );
}
