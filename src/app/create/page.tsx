"use client";

import TokenForm from "@/components/TokenForm";
import CostSummary from "@/components/CostSummary";
import { useLanguage } from "@/context/LanguageContext";
import styles from "@/app/create/Create.module.css";
import { DollarSign, HelpCircle } from "lucide-react";

export default function CreatePage() {
  const { t } = useLanguage();

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t.home.heroTitle}</h1>
        <p className={styles.description}>{t.home.heroSubtitle}</p>
      </header>

      <main className={styles.grid}>
        <div className={styles.formContainer}>
          <TokenForm />
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.infoContainer}>
            <SidebarSection title={t.home.costSummaryTitle} icon={<DollarSign size={24} />}>
              <CostSummary operation="createToken" />
            </SidebarSection>

            <SidebarSection title={t.home.quickGuideTitle} icon={<HelpCircle size={24} />}>
              {t.home.quickGuide.map((item, index) => (
                <InfoItem key={index} title={item.title} description={item.description} />
              ))}
            </SidebarSection>
          </div>
        </aside>
      </main>
    </div>
  );
}

function SidebarSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.sidebarSection}>
      <h3 className={styles.sidebarTitle}>
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function InfoItem({ title, description }: { title: string; description: string }) {
  return (
    <div className={styles.infoItem}>
      <p className={styles.infoTitle}>{title}</p>
      <p className={styles.infoDescription}>{description}</p>
    </div>
  );
}
