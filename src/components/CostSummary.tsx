"use client";

import { useState, useEffect } from "react";
import styles from "./CostSummary.module.css";
import { useLanguage } from "@/context/LanguageContext";
import {
  DEV_WALLET_ADDRESS,
  ModularPricingOptions,
  calculateModularTokenCreationFee,
  SERVICE_FEE_BURN_TOKEN_SOL,
  SERVICE_FEE_AIRDROP_SOL,
  SERVICE_FEE_MANAGE_AUTHORITY_SOL,
  SERVICE_FEE_CREATE_LP_SOL,
  SERVICE_FEE_REMOVE_LP_SOL,
} from "@/lib/constants";

export interface Costs {
  createToken: string;
  burnToken: string;
  airdrop: string;
  manageAuthority: string;
  createLiquidityPool: string;
  removeLiquidity: string;
}

export type Operation = keyof Costs;

export interface CostSummaryProps {
  operation?: Operation;
  modularOptions?: ModularPricingOptions;
}

const DEFAULT_MODULAR_OPTIONS: ModularPricingOptions = {
  revokeFreeze: true,
  revokeMint: true,
  immutableMetadata: true,
  customCreatorInfo: false,
  hasTransferFeeExtension: false,
};

const serviceFeeByOperation: Record<Operation, number> = {
  createToken: 0.35,
  burnToken: SERVICE_FEE_BURN_TOKEN_SOL,
  airdrop: SERVICE_FEE_AIRDROP_SOL,
  manageAuthority: SERVICE_FEE_MANAGE_AUTHORITY_SOL,
  createLiquidityPool: SERVICE_FEE_CREATE_LP_SOL,
  removeLiquidity: SERVICE_FEE_REMOVE_LP_SOL,
};

const devWalletBase58 = DEV_WALLET_ADDRESS.toBase58();

export default function CostSummary({
  operation = "createToken",
  modularOptions,
}: CostSummaryProps) {
  const { t } = useLanguage();
  const [liveModularOptions, setLiveModularOptions] = useState<ModularPricingOptions>(
    modularOptions || DEFAULT_MODULAR_OPTIONS
  );

  useEffect(() => {
    if (modularOptions) {
      setLiveModularOptions(modularOptions);
    }
  }, [modularOptions]);

  useEffect(() => {
    const handleModularUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<ModularPricingOptions>;
      if (customEvent.detail) {
        setLiveModularOptions(customEvent.detail);
      }
    };
    window.addEventListener("modular-fee-update", handleModularUpdate);
    return () => window.removeEventListener("modular-fee-update", handleModularUpdate);
  }, []);

  if (operation === "createToken") {
    const { totalSol, items } = calculateModularTokenCreationFee(liveModularOptions);
    const networkRentSol = 0.015;
    const grandTotalSol = totalSol + networkRentSol;

    const localizedLabelMap: Record<string, string> = {
      base: t.costs.baseCreate,
      revokeFreeze: t.costs.revokeFreeze,
      revokeMint: t.costs.revokeMint,
      immutable: t.costs.immutable,
      customCreator: t.costs.customCreator,
      transferFeeExt: t.costs.transferFeeExt,
    };

    return (
      <div className={styles.card}>
        <div className={styles.breakdownList}>
          {items.map((item) => (
            <div
              key={item.key}
              className={item.active ? styles.breakdownRow : styles.breakdownRowInactive}
            >
              <span>
                {item.active ? "✓" : "○"} {localizedLabelMap[item.key] || item.label}
              </span>
              <strong>+{item.sol.toFixed(2)} SOL</strong>
            </div>
          ))}
        </div>

        <div className={`${styles.item} ${styles.total}`}>
          <p>{t.costs.totalModular}</p>
          <p>{totalSol.toFixed(2)} SOL</p>
        </div>

        <div className={styles.item} style={{ fontSize: "0.78rem", opacity: 0.85 }}>
          <span>{t.costs.networkRent}</span>
          <span>~{networkRentSol.toFixed(3)} SOL</span>
        </div>

        <div className={styles.item} style={{ fontSize: "0.84rem", fontWeight: 700 }}>
          <span>{t.costs.estimatedWalletTotal}</span>
          <span style={{ color: "#34d399", fontFamily: "JetBrains Mono, monospace" }}>
            ~{grandTotalSol.toFixed(3)} SOL
          </span>
        </div>

        <p className={styles.disclaimer}>
          {t.costs.atomicDisclaimer} ({devWalletBase58.slice(0, 6)}...
          {devWalletBase58.slice(-4)}).
        </p>
      </div>
    );
  }

  const devFee = serviceFeeByOperation[operation] ?? 0.07;
  const estimatedTotal = devFee + 0.01;

  return (
    <div className={styles.card}>
      <div className={`${styles.item} ${styles.total}`}>
        <p>Service Fee (Dev Wallet):</p>
        <p>{devFee.toFixed(2)} SOL</p>
      </div>
      <div className={styles.item} style={{ marginTop: "0.25rem", fontSize: "0.82rem" }}>
        <span>{t.costs.estimatedWalletTotal}</span>
        <span style={{ fontFamily: "JetBrains Mono, monospace", color: "#34d399" }}>
          ~{estimatedTotal.toFixed(2)} SOL
        </span>
      </div>
      <p className={styles.disclaimer}>
        {t.costs.atomicDisclaimer} ({devWalletBase58.slice(0, 6)}...
        {devWalletBase58.slice(-4)}).
      </p>
    </div>
  );
}
