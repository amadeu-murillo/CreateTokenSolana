"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import styles from "./Documentation.module.css";

const IconPlusCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>;
const IconFlame = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
const IconSend = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73 2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconBookOpen = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const IconDollarSign = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const IconLayers = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>;

interface DocBullet {
  label: string;
  text: string;
}

interface DocSection {
  icon: React.ReactNode;
  title: string;
  id: string;
  summary: string;
  intro: string;
  bullets: DocBullet[];
}

const documentationSections: DocSection[] = [
  {
    icon: <IconPlusCircle />,
    title: "Token Creation (SPL and Token-2022)",
    id: "criar-token",
    summary:
      "Learn how to create your own fungible token on Solana by defining its essential properties and metadata.",
    intro:
      "The token creation process allows you to launch a digital asset on the Solana blockchain in a single atomic transaction:",
    bullets: [
      {
        label: "Token Details:",
        text: "Define the Name (e.g., 'Moon Coin'), Symbol (e.g., 'MOON'), Decimals (usually 9 for fractional amounts), and Total Supply using exact BigInt precision.",
      },
      {
        label: "Metadata (Image):",
        text: "Your token image is validated for binary integrity and linked using the Metaplex Fungible Token standard.",
      },
      {
        label: "Token Standard:",
        text: "Choose between Standard SPL (universal compatibility) and Token-2022 (supports protocol-level transfer fee extensions).",
      },
      {
        label: "Authorities:",
        text: "Disable 'Mint Authority' for a permanently fixed supply and 'Freeze Authority' to ensure compatibility with decentralized exchanges.",
      },
    ],
  },
  {
    icon: <IconLayers />,
    title: "Liquidity Pool Creation (Raydium & Meteora)",
    id: "criar-liquidez",
    summary:
      "Allow your token to be publicly traded by initializing an on-chain AMM pool on Raydium CPMM or Meteora Dynamic AMM.",
    intro:
      "A token without liquidity cannot be traded. Creating a liquidity pool pairs your token with SOL or USDC:",
    bullets: [
      {
        label: "Raydium CPMM & Meteora DAMM:",
        text: "Initialize constant-product pools directly without needing an expensive legacy OpenBook Market ID.",
      },
      {
        label: "Setting the Initial Price:",
        text: "The ratio of Base Tokens and Quote Assets (SOL/USDC) deposited sets the initial launch price and market cap.",
      },
      {
        label: "Automatic Freeze Authority Check:",
        text: "If your token still has an active Freeze Authority, our builder can revoke it atomically in the same transaction before initializing the pool.",
      },
      {
        label: "LP Tokens:",
        text: "You receive 100% of the initial LP tokens in your wallet, which can be held or burned to permanently lock liquidity.",
      },
    ],
  },
  {
    icon: <IconFlame />,
    title: "Token Burning",
    id: "queimar-tokens",
    summary: "Reduce your token's total supply or burn LP tokens permanently on-chain.",
    intro:
      "Token burning is an irreversible deflationary mechanism that destroys tokens from circulation:",
    bullets: [
      {
        label: "Irreversible Action:",
        text: "Once tokens or LP tokens are burned on the Solana blockchain, they are permanently destroyed.",
      },
      {
        label: "SPL & Token-2022 Support:",
        text: "Select any token in your wallet, enter the amount (or click MAX), and sign the transaction.",
      },
    ],
  },
  {
    icon: <IconSend />,
    title: "Mass Distribution (Airdrop)",
    id: "airdrop",
    summary: "Send your token to multiple wallets in batched atomic transactions.",
    intro:
      "Airdrops enable fast community distribution and reward campaigns:",
    bullets: [
      {
        label: "Smart Validation:",
        text: "Validates every recipient PublicKey and token amount before building transactions.",
      },
      {
        label: "Automatic ATA Creation:",
        text: "Automatically initializes Associated Token Accounts (ATAs) idempotently for recipients who do not yet hold your token.",
      },
    ],
  },
  {
    icon: <IconSettings />,
    title: "Authority Management",
    id: "gerenciar-tokens",
    summary: "Inspect your tokens and renounce Mint and Freeze authorities on-chain.",
    intro:
      "The Management Dashboard lets you verify and revoke privileges on any token you control:",
    bullets: [
      {
        label: "Renounce Mint Authority:",
        text: "Makes the total token supply permanently fixed so no additional tokens can ever be minted.",
      },
      {
        label: "Renounce Freeze Authority:",
        text: "Prevents any wallet from being frozen and is required before creating liquidity pools on Raydium.",
      },
    ],
  },
  {
    icon: <IconDollarSign />,
    title: "Affiliate Program",
    id: "afiliados",
    summary: "Earn 10% SOL commissions automatically on every referred transaction.",
    intro:
      "Our affiliate program splits the service fee atomically inside the same Solana transaction:",
    bullets: [
      {
        label: "Exclusive Link:",
        text: "Connect your wallet to generate your `?ref=YOUR_WALLET` referral link.",
      },
      {
        label: "On-Chain Verification:",
        text: "Commissions are transferred directly to your wallet via SystemProgram.transfer and verified on-chain before appearing in your dashboard.",
      },
    ],
  },
];

export default function DocumentationPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <IconBookOpen />
        <h1 className={styles.title}>Platform Documentation</h1>
        <p className={styles.subtitle}>
          A complete guide to using all CreateTokenSolana features safely.
        </p>
      </header>

      <div className={styles.grid}>
        <aside className={styles.sidebar}>
          <nav className={styles.toc}>
            <h3 className={styles.tocTitle}>Navigation</h3>
            <ul>
              {documentationSections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className={styles.tocLink}>
                    {section.icon}
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className={styles.content}>
          {documentationSections.map((section) => (
            <section key={section.id} id={section.id} className={styles.section}>
              <Card>
                <CardHeader>
                  <CardTitle className={styles.sectionTitle}>{section.title}</CardTitle>
                  <CardDescription className={styles.sectionSummary}>
                    {section.summary}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={styles.detailsContainer}>
                    <p>{section.intro}</p>
                    <ul className={styles.detailsList}>
                      {section.bullets.map((bullet, idx) => (
                        <li key={idx}>
                          <strong>{bullet.label}</strong> {bullet.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
