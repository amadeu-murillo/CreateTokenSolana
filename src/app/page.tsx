"use client";

import React from "react";
import Link from "next/link";
import TokenForm from "@/components/TokenForm";
import CostSummary from "@/components/CostSummary";
import { useCluster } from "@/context/WalletContext";
import { useLanguage } from "@/context/LanguageContext";
import createStyles from "@/app/create/Create.module.css";
import homeStyles from "./Home.module.css";
import { DollarSign, HelpCircle, ShieldCheck, Layers, Flame, Send, Settings } from "lucide-react";

export default function Home() {
  const { cluster } = useCluster();
  const { t, locale } = useLanguage();
  const isDevnet = cluster === "devnet";

  const quickGuideContent =
    locale === "pt"
      ? [
          {
            title: "O que é um Token SPL?",
            description:
              "O padrão oficial de tokens fungíveis da Solana. Compatível com todas as carteiras (Phantom, Solflare) e DEXs (Raydium, Meteora, Jupiter).",
          },
          {
            title: "O que é o Token-2022?",
            description:
              "A nova geração do programa de tokens da Solana que suporta Taxa de Transferência automática (Tax Token) direto no protocolo.",
          },
          {
            title: "RugCheck 100/100 (Mint & Freeze)",
            description:
              "Revogar Freeze Authority permite criar Pool de Liquidez (+50 pts). Revogar Mint Authority fixa o supply (+35 pts) e Metadados Imutáveis garantem +15 pts.",
          },
          {
            title: "Mainnet-Beta vs. Devnet",
            description:
              "Na Mainnet-Beta seu token é real e negociável. Na Devnet você pode testar gratuitamente usando SOL de teste do botão Faucet.",
          },
        ]
      : [
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
            title: "RugCheck 100/100 (Mint & Freeze)",
            description:
              "Revoking Freeze Authority unlocks DEX Liquidity Pools (+50 pts). Revoking Mint Authority fixes supply (+35 pts) and Immutable Metadata adds +15 pts.",
          },
          {
            title: "Mainnet-Beta vs. Devnet",
            description:
              "Use the network toggle in the top bar to test token creation and liquidity pools on Devnet for free, or switch to Mainnet-Beta for live deployment.",
          },
        ];

  const ecosystemTools = [
    {
      icon: <Layers size={24} />,
      title: t.nav.liquidityPool,
      description:
        locale === "pt"
          ? "Crie ou retire liquidez em SOL na Raydium CPMM ou Meteora Dynamic AMM em 1 clique."
          : "Initialize or withdraw SOL liquidity on Raydium CPMM or Meteora Dynamic AMM in one click.",
      href: "/add-liquidity",
    },
    {
      icon: <Flame size={24} />,
      title: t.nav.burn,
      description:
        locale === "pt"
          ? "Queime tokens/LP com Certificado PNG oficial e recupere SOL de contas vazias na carteira."
          : "Burn tokens/LP with an official PNG certificate and reclaim SOL from empty token accounts.",
      href: "/burn",
    },
    {
      icon: <Send size={24} />,
      title: t.nav.airdrop,
      description:
        locale === "pt"
          ? "Distribua tokens para centenas de carteiras com criação automática de conta ATA."
          : "Distribute your token to hundreds of wallets at once with automatic ATA creation.",
      href: "/airdrop",
    },
    {
      icon: <Settings size={24} />,
      title: t.nav.manage,
      description:
        locale === "pt"
          ? "Inspecione o RugCheck Score e revogue autoridades de Mint ou Freeze on-chain."
          : "Inspect RugCheck security scores and permanently revoke Mint or Freeze authorities.",
      href: "/dashboard",
    },
    {
      icon: <DollarSign size={24} />,
      title: t.nav.affiliates,
      description:
        locale === "pt"
          ? "Gere seu link exclusivo e receba 30% de comissão em SOL instantaneamente na mesma transação."
          : "Generate your referral link and earn 30% commission in SOL atomically on every launch.",
      href: "/afiliates",
    },
    {
      icon: <ShieldCheck size={24} />,
      title: t.nav.docs,
      description:
        locale === "pt"
          ? "Guias passo a passo sobre tokenomics, liquidez, segurança e auditoria RugCheck."
          : "Read step-by-step guides on tokenomics, liquidity provisioning, and RugCheck security.",
      href: "/documentacao",
    },
  ];

  return (
    <div className={createStyles.pageContainer}>
      <header className={createStyles.header}>
        <div
          className={homeStyles.clusterBanner}
          style={{
            borderColor: isDevnet ? "rgba(245, 158, 11, 0.55)" : "rgba(20, 241, 149, 0.45)",
            background: isDevnet ? "rgba(245, 158, 11, 0.14)" : "rgba(20, 241, 149, 0.1)",
            color: isDevnet ? "#fbbf24" : "#14f195",
          }}
        >
          <span>{isDevnet ? t.home.heroBadgeDevnet : t.home.heroBadgeMainnet}</span>
        </div>
        <h1 className={createStyles.title}>{t.home.heroTitle}</h1>
        <p className={createStyles.description}>{t.home.heroSubtitle}</p>
      </header>

      <div className={createStyles.grid}>
        <div className={createStyles.formContainer}>
          <TokenForm />
        </div>

        <aside className={createStyles.sidebar}>
          <div className={createStyles.infoContainer}>
            <div className={createStyles.sidebarSection}>
              <h3 className={createStyles.sidebarTitle}>
                <DollarSign size={22} /> {t.home.costSummaryTitle}
              </h3>
              <CostSummary operation="createToken" />
            </div>

            <div className={createStyles.sidebarSection}>
              <h3 className={createStyles.sidebarTitle}>
                <HelpCircle size={22} /> {t.home.quickGuideTitle}
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
        <h2 className={homeStyles.sectionTitle}>{t.home.suiteTitle}</h2>
        <p className={homeStyles.sectionDescription}>{t.home.suiteSubtitle}</p>
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
    </div>
  );
}
