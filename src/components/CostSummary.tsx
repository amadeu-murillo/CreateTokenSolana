"use client";

import { useState, useEffect } from "react";
import styles from "./CostSummary.module.css";
import {
  DEV_WALLET_ADDRESS,
  SERVICE_FEE_CREATE_TOKEN_SOL,
  SERVICE_FEE_BURN_TOKEN_SOL,
  SERVICE_FEE_AIRDROP_SOL,
  SERVICE_FEE_MANAGE_AUTHORITY_SOL,
  SERVICE_FEE_CREATE_LP_SOL,
} from "@/lib/constants";

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

const serviceFeeByOperation: Record<Operation, number> = {
  createToken: SERVICE_FEE_CREATE_TOKEN_SOL,
  burnToken: SERVICE_FEE_BURN_TOKEN_SOL,
  airdrop: SERVICE_FEE_AIRDROP_SOL,
  manageAuthority: SERVICE_FEE_MANAGE_AUTHORITY_SOL,
  createLiquidityPool: SERVICE_FEE_CREATE_LP_SOL,
};

const devWalletBase58 = DEV_WALLET_ADDRESS.toBase58();

export default function CostSummary({ operation }: CostSummaryProps) {
  const [costs, setCosts] = useState<Costs | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCosts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/costs");
        if (!response.ok) {
          throw new Error("Failed to fetch costs");
        }
        const data: Costs = await response.json();
        setCosts(data);
      } catch (error) {
        console.error(error);
        setCosts({
          createToken: "0.0800",
          burnToken: "0.0800",
          airdrop: "0.0800",
          manageAuthority: "0.0800",
          createLiquidityPool: "0.0800",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCosts();
  }, []);

  const costValue = costs ? costs[operation] : "...";
  const devFee = serviceFeeByOperation[operation];

  return (
    <div className={styles.card}>
      <div className={`${styles.item} ${styles.total}`}>
        <p>Service Fee (Dev Wallet):</p>
        <p>{devFee.toFixed(2)} SOL</p>
      </div>
      <div className={styles.item} style={{ marginTop: "0.35rem", fontSize: "0.82rem" }}>
        <p>Estimated Total (+ Rent):</p>
        <p>{isLoading ? "Loading..." : `~${parseFloat(costValue).toFixed(2)} SOL`}</p>
      </div>
      <p className={styles.disclaimer}>
        Standardized 0.07 SOL service fee routes atomically on-chain to Dev Wallet (
        {devWalletBase58.slice(0, 6)}...{devWalletBase58.slice(-4)}).
      </p>
    </div>
  );
}
