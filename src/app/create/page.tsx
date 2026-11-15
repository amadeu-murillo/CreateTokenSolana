"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TokenForm from "@/components/TokenForm";
import CostSummary from "@/components/CostSummary";
import { useLanguage } from "@/context/LanguageContext";
import styles from "@/app/create/Create.module.css";
import { DollarSign, HelpCircle } from "lucide-react";

function CreateRedirectAndForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const langCtx = useLanguage();
  const t = langCtx?.t;

  useEffect(() => {
    const qs = searchParams?.toString();
    const target = qs ? `/?${qs}#create-form` : "/#create-form";
    router.replace(target);
  }, [router, searchParams]);

  const quickGuide = t?.home?.quickGuide || [];

  return (
    <div className={styles.pageContainer} id="create-form">
      <header className={styles.header}>
        <h1 className={styles.title}>
          {t?.home?.heroTitle || "Create Your Solana Token in Seconds"}
        </h1>
        <p className={styles.description}>
          {t?.home?.heroSubtitle ||
            "Launch SPL or Token-2022 assets with 100/100 RugCheck security and Arweave metadata."}
        </p>
      </header>

      <main className={styles.grid}>
        <div className={styles.formContainer}>
          <TokenForm />
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.infoContainer}>
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarTitle}>
                <DollarSign size={24} /> {t?.home?.costSummaryTitle || "Cost Summary"}
              </h3>
              <CostSummary operation="createToken" />
            </div>

            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarTitle}>
                <HelpCircle size={24} /> {t?.home?.quickGuideTitle || "Quick Guide"}
              </h3>
              {quickGuide.map((item, index) => (
                <div key={index} className={styles.infoItem}>
                  <p className={styles.infoTitle}>{item.title}</p>
                  <p className={styles.infoDescription}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading Token Creator...</div>}>
      <CreateRedirectAndForm />
    </Suspense>
  );
}
