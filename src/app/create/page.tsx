"use client";

import TokenForm from '@/components/TokenForm';
import CostSummary from '@/components/CostSummary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import styles from '@/app/create/Create.module.css';

// Ícones SVG como componentes para clareza
const IconInfo = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const IconDollarSign = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;

// Conteúdo do guia lateral
const infoItems = [
    {
        title: "O que é um Token SPL?",
        description: "É o padrão fundamental para criar tokens fungíveis (moedas) na rede Solana. Ideal para a maioria dos projetos que precisam de um token simples e eficiente."
    },
    {
        title: "O que é o Token-2022?",
        description: "É uma extensão do padrão SPL que adiciona novas funcionalidades, como taxas de transferência, juros e muito mais, diretamente no nível do protocolo."
    },
    {
        title: "Autoridades de Mint e Freeze",
        description: "Manter a autoridade de 'Mint' permite criar mais tokens no futuro. A de 'Freeze' permite congelar tokens em carteiras específicas. Renunciar a elas torna o token mais descentralizado e seu fornecimento imutável."
    }
];

export default function CreatePage() {
  return (
    <div className={styles.pageContainer}>
        <div className={styles.header}>
            <h1 className={styles.title}>Crie seu Token na Solana</h1>
            <p className={styles.description}>Preencha os detalhes abaixo para criar seu novo token SPL na rede Solana. Simples, rápido e seguro.</p>
        </div>
        <div className={styles.grid}>
          <div className={styles.formContainer}>
            <TokenForm />
          </div>
          <aside className={styles.sidebar}>
            <div className={styles.infoContainer}>
                <div className={styles.sidebarSection}>
                    <h3 className={styles.sidebarTitle}><IconInfo /> Guia Rápido</h3>
                    {infoItems.map((item, index) => (
                        <div key={index} className={styles.infoItem}>
                            <p className={styles.infoTitle}>{item.title}</p>
                            <p className={styles.infoDescription}>{item.description}</p>
                        </div>
                    ))}
                </div>
                <div className={styles.sidebarSection}>
                     <h3 className={styles.sidebarTitle}><IconDollarSign /> Resumo de Custos</h3>
                     <CostSummary />
                </div>
            </div>
          </aside>
        </div>
    </div>
  );
}
