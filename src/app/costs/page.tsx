"use client";

import { useState, useEffect } from "react";
import styles from "./Costs.module.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Costs {
  createToken: string;
  burnToken: string;
  airdrop: string;
  manageAuthority: string;
  createLiquidityPool: string;
  removeLiquidity?: string;
}

const costLabels: Record<keyof Costs, string> = {
  createToken: "Token Creation (0.90 SOL Fee)",
  burnToken: "Token Burn (0.07 SOL Fee)",
  airdrop: "Mass Airdrop (0.07 SOL / Batch)",
  manageAuthority: "Revoke Authority (0.07 SOL Fee)",
  createLiquidityPool: "Create Liquidity Pool (0.07 SOL Fee)",
  removeLiquidity: "Withdraw Liquidity in SOL (0.05 SOL Fee)",
};

export default function CostsPage() {
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
            Estimated costs for all operations on the Solana network, including our platform
            service fee and estimated Solana network rent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className={styles.loading}>Loading costs...</div>
          ) : error ? (
            <div className={styles.error}>Error: {error}</div>
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
