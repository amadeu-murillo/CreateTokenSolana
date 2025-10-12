"use client";

import TokenForm from '@/components/TokenForm';
import CostSummary from '@/components/CostSummary';
import styles from '@/app/create/Create.module.css';

// Ícones SVG como componentes para clareza
const IconInfo = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const IconDollarSign = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;

// Conteúdo do guia da barra lateral
const infoItems = [
    {
        title: "What is an SPL Token?",
        description: "It is the fundamental standard for creating fungible tokens (coins) on the Solana network. Ideal for most projects that need a simple and efficient token."
    },
    {
        title: "What is Token-2022?",
        description: "It is an extension of the SPL standard that adds new features such as transfer fees, interest, and much more — directly at the protocol level."
    },
    {
        title: "Mint and Freeze Authorities",
        description: "Keeping the 'Mint' authority allows you to create more tokens in the future. The 'Freeze' authority allows you to freeze tokens in specific wallets. Renouncing them makes the token more decentralized and its supply immutable."
    },
    // AVISO ADICIONADO
    {
        title: "Tip: Did your token 'disappear'?",
        description: "After creation, wallets like Phantom may automatically hide your token. To display it, go to 'Manage Token List', search for it, and enable visibility. It is safe in your wallet!"
    }
];

export default function CreatePage() {
  return (
    <div className={styles.pageContainer}>
        <div className={styles.header}>
            <h1 className={styles.title}>Create Your Token on Solana</h1>
            <p className={styles.description}>Fill in the details below to create your new SPL token on the Solana network. Simple, fast, and secure.</p>
        </div>
        <div className={styles.grid}>
          <div className={styles.formContainer}>
            <TokenForm />
          </div>
          <aside className={styles.sidebar}>
            <div className={styles.infoContainer}>
                <div className={styles.sidebarSection}>
                    <h3 className={styles.sidebarTitle}><IconDollarSign /> Cost Summary</h3>
                     <CostSummary operation="createToken" />
                </div>
                <div className={styles.sidebarSection}>
                    <h3 className={styles.sidebarTitle}><IconInfo /> Quick Guide</h3>
                    {infoItems.map((item, index) => (
                        <div key={index} className={styles.infoItem}>
                            <p className={styles.infoTitle}>{item.title}</p>
                            <p className={styles.infoDescription}>{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
          </aside>
        </div>
    </div>
  );
}
