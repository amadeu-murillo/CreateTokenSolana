"use client";

import { useState, useEffect } from 'react';
import styles from "./CostSummary.module.css";

interface Costs {
  createToken: string;
  burnToken: string;
  airdrop: string;
  manageAuthority: string;
  createLiquidityPool: string;
}

type Operation = keyof Costs;

interface CostSummaryProps {
  operation: Operation;
}

const operationLabels: Record<Operation, string> = {
  createToken: "Token Creation",
  burnToken: "Token Burn",
  airdrop: "Airdrop (per batch)",
  manageAuthority: "Manage Authority",
  createLiquidityPool: "Liquidity Pool Creation",
};

export default function CostSummary({ operation }: CostSummaryProps) {
  const [costs, setCosts] = useState<Costs | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCosts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/costs');
        if (!response.ok) {
          throw new Error('Failed to fetch costs');
        }
        const data: Costs = await response.json();
        setCosts(data);
      } catch (error) {
        console.error(error);
        // Fallback para valores padrão em caso de erro na API
        setCosts({
          createToken: '0.1320',
          burnToken: '0.0690',
          airdrop: '0.0690',
          manageAuthority: '0.0690',
          createLiquidityPool: '0.2600',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCosts();
  }, []);

  const costValue = costs ? costs[operation] : '...';

  return (
    <div className={styles.card}>
      <div className={`${styles.item} ${styles.total}`}>
        <p>Estimated Total Cost:</p>
        <p>{isLoading ? 'Loading...' : `~${parseFloat(costValue).toFixed(3)} SOL`}</p>
      </div>
      <p className={styles.disclaimer}>
        The cost includes service fees and an estimate of Solana network fees, which may vary.
      </p>
    </div>
  );
}
