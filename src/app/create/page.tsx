"use client";

import TokenForm from "@/components/TokenForm";
import CostSummary from "@/components/CostSummary";
import styles from "@/app/create/Create.module.css";
import { DollarSign, HelpCircle } from "lucide-react";

// Conteúdo do guia da barra lateral desacoplado para melhor organização
const quickGuideContent = [
  {
    title: "What is an SPL Token?",
    description:
      "It is the fundamental standard for creating fungible tokens (currencies) on the Solana network. Ideal for most projects that need a simple and efficient token.",
  },
  {
    title: "What is Token-2022?",
    description:
      "It is an extension of the SPL standard that adds new features such as transfer fees, interest, and more — directly at the protocol level.",
  },
  {
    title: "Mint and Freeze Authorities",
    description:
      "Keeping the 'Mint' authority allows you to create more tokens in the future. The 'Freeze' authority allows you to freeze tokens in specific wallets. Renouncing them makes the token more decentralized and its supply immutable.",
  },
  {
    title: "Tip: Did your token 'disappear'?",
    description:
      "After creation, wallets like Phantom may automatically hide your token. To display it, go to 'Manage Token List', search for it, and enable visibility. It's safe in your wallet!",
  },
];

export default function CreatePage() {
  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Create Your Token on Solana</h1>
        <p className={styles.description}>
          Fill in the details below to create your new SPL token on the Solana
          network. Simple, fast, and secure.
        </p>
      </header>

      <main className={styles.grid}>
        <div className={styles.formContainer}>
          <TokenForm />
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.infoContainer}>
            <SidebarSection
              title="Cost Summary"
              icon={<DollarSign size={24} />}
            >
              <CostSummary operation="createToken" />
            </SidebarSection>

            <SidebarSection title="Quick Guide" icon={<HelpCircle size={24} />}>
              {quickGuideContent.map((item, index) => (
                <InfoItem
                  key={index}
                  title={item.title}
                  description={item.description}
                />
              ))}
            </SidebarSection>
          </div>
        </aside>
      </main>
    </div>
  );
}

// Componentes auxiliares para uma melhor legibilidade e reutilização
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

function InfoItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className={styles.infoItem}>
      <p className={styles.infoTitle}>{title}</p>
      <p className={styles.infoDescription}>{description}</p>
    </div>
  );
}
