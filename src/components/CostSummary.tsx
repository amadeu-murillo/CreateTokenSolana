"use client";

import { useState, useEffect } from "react";
import styles from "./CostSummary.module.css";
import { useLanguage } from "@/context/LanguageContext";
import {
  DEV_WALLET_ADDRESS,
  ESTIMATED_ATA_RENT_SOL,
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

const SOLANA_ACCOUNT_RENT_SOL = Number(ESTIMATED_ATA_RENT_SOL.toFixed(4));
const SOLANA_NETWORK_TX_FEE_SOL = 0.00001;

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

  const isCreateToken = operation === "createToken";
  const modularCalculation = calculateModularTokenCreationFee(liveModularOptions);

  const activeServiceFeeSol = isCreateToken
    ? modularCalculation.totalSol
    : (serviceFeeByOperation[operation] ?? 0.05);

  const estimatedTotalSol =
    activeServiceFeeSol + SOLANA_ACCOUNT_RENT_SOL + SOLANA_NETWORK_TX_FEE_SOL;

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
      <div className={styles.headerRow}>
        <span className={styles.headerTitle}>{t.costs.headerTitle}</span>
        <span className={styles.headerBadge}>{t.costs.headerBadge}</span>
      </div>

      <ul className={styles.costList}>
        <li className={styles.costListItem}>
          <span>{t.costs.rentLabel}</span>
          <span className={styles.costValueMono}>~{SOLANA_ACCOUNT_RENT_SOL.toFixed(3)} SOL</span>
        </li>
        <li className={styles.costListItem}>
          <span>{t.costs.networkFeeLabel}</span>
          <span className={styles.costValueMono}>~{SOLANA_NETWORK_TX_FEE_SOL.toFixed(5)} SOL</span>
        </li>
        <li className={styles.costListItem}>
          <span>{t.costs.serviceFeeLabel}</span>
          <span className={styles.costValueMono}>{activeServiceFeeSol.toFixed(2)} SOL</span>
        </li>
      </ul>

      {isCreateToken && (
        <div className={styles.breakdownList}>
          {modularCalculation.items.map((item) => (
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
      )}

      <div className={styles.estimatedTotalBox}>
        <div className={styles.estimatedTotalLabel}>
          <strong>{t.costs.estimatedWalletTotal}</strong>
          <span>{t.costs.singleSignatureSub}</span>
        </div>
        <span className={styles.estimatedTotalValue}>
          ~{estimatedTotalSol.toFixed(4)} SOL
        </span>
      </div>

      <p className={styles.disclaimer}>
        {t.costs.atomicDisclaimer} ({devWalletBase58.slice(0, 6)}...
        {devWalletBase58.slice(-4)}).
      </p>
    </div>
  );
}
