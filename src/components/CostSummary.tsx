"use client";

import { useState, useEffect } from 'react';
import styles from "./CostSummary.module.css";

const IconZap = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
);

interface Costs {
    networkCost: string;
    serviceFee: string;
    totalCost: string;
}

export default function CostSummary() {
  const [costs, setCosts] = useState<Costs | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCosts = async () => {
      try {
        const response = await fetch('/api/costs');
        if (!response.ok) {
          throw new Error('Falha ao buscar custos');
        }
        const data: Costs = await response.json();
        setCosts(data);
      } catch (error) {
        console.error(error);
        // Em caso de erro, podemos manter os valores estáticos como fallback
        setCosts({
          networkCost: '0.002',
          serviceFee: '0.092',
          totalCost: '0.094',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCosts();
  }, []);

  if (isLoading) {
    return (
        <div className={styles.card}>
            <div className={styles.item}>
                <span>Carregando custos...</span>
            </div>
        </div>
    );
  }

  return (
    <div className={styles.card}>
        <div className={styles.item}>
            <span>💰 Custo da Rede Solana</span>
            <span>~{costs?.networkCost || '0.002'} SOL</span>
        </div>
        <div className={styles.item}>
            <span><IconZap /> Taxa de Serviço</span>
            <span>{costs?.serviceFee || '0.092'} SOL</span>
        </div>
        <hr className={styles.divider} />
        <div className={`${styles.item} ${styles.total}`}>
            <p>Total:</p>
            <p>~{costs?.totalCost || '0.094'} SOL</p>
        </div>
    </div>
  );
}
