"use client";

import { useState, useEffect } from "react";
import styles from "./Costs.module.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";

interface Costs {
  createToken: string;
  burnToken: string;
  airdrop: string;
  manageAuthority: string;
  createLiquidityPool: string;
  removeLiquidity?: string;
}

export default function CostsPage() {
  const { t } = useLanguage();
  const [costs, setCosts] = useState<Costs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/costs");
        if (!response.ok) {
          throw new Error("Failed to fetch costs from the server.");
        }
        const data: Costs = await response.json();
        setCosts(data);
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCosts();
  }, []);

  const costLabels: Record<keyof Costs, string> = {
    createToken: t.costsPage.labels.createToken,
    burnToken: t.costsPage.labels.burnToken,
    airdrop: t.costsPage.labels.airdrop,
    manageAuthority: t.costsPage.labels.manageAuthority,
    createLiquidityPool: t.costsPage.labels.createLiquidityPool,
    removeLiquidity: t.costsPage.labels.removeLiquidity,
  };

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader>
          <CardTitle className={styles.title}>{t.costsPage.pageTitle}</CardTitle>
          <CardDescription>{t.costsPage.pageDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className={styles.loading}>{t.costsPage.loading}</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : costs ? (
            <div className={styles.costList}>
              {(Object.keys(costs) as Array<keyof Costs>).map((key) => (
                <div key={key} className={styles.costItem}>
                  <span>{costLabels[key] || key}</span>
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
