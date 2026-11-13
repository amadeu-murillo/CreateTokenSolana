"use client";

import React from "react";
import Link from "next/link";
import TokenForm from "@/components/TokenForm";
import CostSummary from "@/components/CostSummary";
import { useCluster } from "@/context/WalletContext";
import createStyles from "@/app/create/Create.module.css";
import homeStyles from "./Home.module.css";
import { DollarSign, HelpCircle, ShieldCheck, Layers, Flame, Send, Settings } from "lucide-react";

const quickGuideContent = [
  {
    title: "What is an SPL Token?",
    description:
      "The standard fungible token specification on Solana. Ideal for community tokens, governance assets, and meme coins with universal wallet and DEX support.",
  },
  {
    title: "What is Token-2022?",
    description:
      "The next-generation Solana token program supporting protocol-level Transfer Fees (automatic tax on transfers) and advanced extensions.",
  },
  {
    title: "Mint & Freeze Authorities",
    description:
      "Disable Mint Authority for a permanently fixed supply. Keep Freeze Authority disabled if you plan to initialize a Raydium or Meteora Liquidity Pool.",
  },
  {
    title: "Mainnet-Beta vs. Devnet",
    description:
      "Use the network toggle in the top header to test token creation and liquidity pools on Devnet for free, or switch to Mainnet-Beta for live deployment.",
  },
];

const ecosystemTools = [
  {
    icon: <Layers size={24} />,
    title: "Create Liquidity Pool",
    description:
      "Initialize a Raydium CPMM or Meteora Dynamic AMM pool paired with SOL or USDC in one click.",
    href: "/add-liquidity",
  },
  {
    icon: <Flame size={24} />,
    title: "Token & LP Burning",
    description:
      "Permanently burn tokens to reduce circulating supply or burn LP tokens to lock liquidity forever.",
    href: "/burn",
  },
  {
    icon: <Send size={24} />,
    title: "Mass Airdrop Batcher",
    description:
      "Distribute your token to hundreds of wallets at once with automatic Associated Token Account (ATA) creation.",
    href: "/airdrop",
  },
  {
    icon: <Settings size={24} />,
    title: "Authority Management",
    description:
      "Inspect and permanently revoke Mint or Freeze authorities on your existing tokens.",
    href: "/dashboard",
  },
  {
    icon: <DollarSign size={24} />,
    title: "Affiliate Program (10% SOL)",
    description:
      "Generate your referral link and earn 10% commission in SOL atomically on every referred launch.",
    href: "/afiliates",
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Platform Documentation",
    description:
      "Read step-by-step guides on tokenomics, liquidity provisioning, and security best practices.",
    href: "/documentacao",
  },
];

export default function Home() {
  const { cluster } = useCluster();

  return (
    <div className={createStyles.pageContainer}>
      {/* Primary Section: Token Creator on the Home Page */}
      <header className={createStyles.header}>
        <div className={homeStyles.clusterBanner}>
          <span>
            Active Network:{" "}
            <strong>{cluster === "devnet" ? "Solana Devnet (Testnet)" : "Solana Mainnet-Beta"}</strong>
          </span>
        </div>
        <h1 className={createStyles.title}>Create Your Token on Solana</h1>
        <p className={createStyles.description}>
          Launch a custom SPL or Token-2022 asset in under a minute. Configure metadata, supply,
          and authorities with zero coding required.
        </p>
      </header>

      <div className={createStyles.grid}>
        <div className={createStyles.formContainer}>
          <TokenForm />
        </div>

        <aside className={createStyles.sidebar}>
          <div className={createStyles.infoContainer}>
            <div className={createStyles.sidebarSection}>
              <h3 className={createStyles.sidebarTitle}>
                <DollarSign size={22} /> Cost Summary
              </h3>
              <CostSummary operation="createToken" />
            </div>

            <div className={createStyles.sidebarSection}>
              <h3 className={createStyles.sidebarTitle}>
                <HelpCircle size={22} /> Quick Guide
              </h3>
              {quickGuideContent.map((item, index) => (
                <div key={index} className={createStyles.infoItem}>
                  <p className={createStyles.infoTitle}>{item.title}</p>
                  <p className={createStyles.infoDescription}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Ecosystem Suite Section */}
      <section className={homeStyles.featuresSection}>
        <h2 className={homeStyles.sectionTitle}>Complete Token Lifecycle Suite</h2>
        <p className={homeStyles.sectionDescription}>
          Everything you need after minting: initialize liquidity pools, distribute airdrops, burn
          supply, and earn SOL referrals.
        </p>
        <div className={homeStyles.featuresGrid}>
          {ecosystemTools.map((tool) => (
            <Link key={tool.href} href={tool.href}>
              <div className={homeStyles.featureCard}>
                <div className={homeStyles.featureIcon}>{tool.icon}</div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className={homeStyles.faqSection} id="faq">
        <h2 className={homeStyles.sectionTitle}>Frequently Asked Questions</h2>
        <div className={homeStyles.faqGrid}>
          <details className={homeStyles.faqItem}>
            <summary>
              <h3>Do I have full ownership of the token?</h3>
            </summary>
            <p>
              Yes. Your connected wallet is set as the initial deployer and authority. You can
              keep or permanently revoke Mint and Freeze authorities at any time.
            </p>
          </details>
          <details className={homeStyles.faqItem}>
            <summary>
              <h3>Does the platform work on both Solana Devnet and Mainnet?</h3>
            </summary>
            <p>
              Yes! Use the Mainnet / Devnet switcher in the top navigation bar to test token
              creation, liquidity pool initialization, burning, and airdrops on Devnet before
              launching on Mainnet-Beta.
            </p>
          </details>
          <details className={homeStyles.faqItem}>
            <summary>
              <h3>How do I make my token tradable after creation?</h3>
            </summary>
            <p>
              Navigate to the <Link href="/add-liquidity" className={homeStyles.faqLink}>Liquidity Pool</Link>{" "}
              page, select your token, choose Raydium CPMM or Meteora Dynamic AMM, and deposit your
              initial token and SOL/USDC amounts.
            </p>
          </details>
          <details className={homeStyles.faqItem}>
            <summary>
              <h3>How does the 10% Affiliate Program work?</h3>
            </summary>
            <p>
              Visit the <Link href="/afiliates" className={homeStyles.faqLink}>Affiliates</Link>{" "}
              page, connect your wallet, and share your referral link. You receive 10% of the
              platform service fee atomically in the same transaction whenever someone launches a
              token or liquidity pool through your link.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
