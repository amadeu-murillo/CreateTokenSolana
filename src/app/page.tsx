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
  const { t } = useLanguage();
  const isDevnet = cluster === "devnet";

  const ecosystemTools = [
    {
      icon: <Layers size={24} />,
      title: t.nav.liquidityPool,
      description: t.home.ecosystemDesc.liquidityPool,
      href: "/add-liquidity",
    },
    {
      icon: <Flame size={24} />,
      title: t.nav.burn,
      description: t.home.ecosystemDesc.burn,
      href: "/burn",
    },
    {
      icon: <Send size={24} />,
      title: t.nav.airdrop,
      description: t.home.ecosystemDesc.airdrop,
      href: "/airdrop",
    },
    {
      icon: <Settings size={24} />,
      title: t.nav.manage,
      description: t.home.ecosystemDesc.manage,
      href: "/dashboard",
    },
    {
      icon: <DollarSign size={24} />,
      title: t.nav.affiliates,
      description: t.home.ecosystemDesc.affiliates,
      href: "/affiliates",
    },
    {
      icon: <ShieldCheck size={24} />,
      title: t.nav.docs,
      description: t.home.ecosystemDesc.docs,
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

      <div className={createStyles.grid} id="create-form">
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
              {t.home.quickGuide.map((item, index) => (
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
