"use client";

import { useState, useEffect } from 'react';
import styles from './Costs.module.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Interface para definir a estrutura dos custos
interface Costs {
  createToken: string;
  burnToken: string;
  airdrop: string;
  manageAuthority: string;
  createLiquidityPool: string;
}

// Mapeamento de chaves de operação para nomes legíveis
const costLabels: Record<keyof Costs, string> = {
  createToken: "Token Creation",
  burnToken: "Token Burn",
  airdrop: "Airdrop (per batch)",
  manageAuthority: "Manage Authority",
  createLiquidityPool: "Liquidity Pool Creation",
};

export default function CostsPage() {
  const [costs, setCosts] = useState<Costs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Função para buscar os custos da API
    const fetchCosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/costs');
        if (!response.ok) {
          throw new Error('Failed to fetch costs from the server.');
        }
        const data: Costs = await response.json();
        setCosts(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCosts();
  }, []);

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader>
          <CardTitle className={styles.title}>Cost Summary</CardTitle>
          <CardDescription>
            Estimated costs for various operations on the Solana network. These values include our service fee and an estimate for network fees, which can fluctuate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className={styles.loading}>Loading costs...</div>
          ) : error ? (
            <div className={styles.error}>Error: {error}</div>
          ) : costs ? (
            <div className={styles.costList}>
              {/* Mapeia e exibe cada custo retornado pela API */}
              {(Object.keys(costs) as Array<keyof Costs>).map((key) => (
                <div key={key} className={styles.costItem}>
                  <span>{costLabels[key]}</span>
                  <span className={styles.costValue}>~{costs[key]} SOL</span>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
