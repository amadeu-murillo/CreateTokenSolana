"use client";

import { useState, useEffect } from 'react';
import styles from "./CostSummary.module.css";

interface Costs {
    totalCost: string;
}

export default function CostSummary() {
  const [costs, setCosts] = useState<Costs | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCosts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/costs');
        if (!response.ok) {
          throw new Error('Falha ao buscar custos');
        }
        const data: Costs = await response.json();
        setCosts(data);
      } catch (error) {
        console.error(error);
        // Fallback para o valor solicitado
        setCosts({
          totalCost: '0.1100',
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
            <div className={`${styles.item} ${styles.total}`}>
                <p>Estimated Total Cost:</p>
                <p>Loading...</p>
            </div>
        </div>
    );
  }

  return (
    <div className={styles.card}>
        <div className={`${styles.item} ${styles.total}`}>
            <p>Estimated Total Cost:</p>
            <p>~{costs?.totalCost ? parseFloat(costs.totalCost).toFixed(2) : '0.12'} SOL</p>
        </div>
    </div>
  );
}
