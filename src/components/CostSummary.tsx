"use client";

import { useState, useEffect } from "react";
import styles from "./CostSummary.module.css";
import { useLanguage } from "@/context/LanguageContext";
import {
  DEFAULT_MODULAR_PRICING_OPTIONS,
  DEV_WALLET_ADDRESS,
  ESTIMATED_ATA_RENT_SOL,
  ESTIMATED_LP_POOL_RENT_SOL,
  ModularPricingOptions,
  OPERATION_SERVICE_FEES_SOL,
  Operation,
  RAYDIUM_PROTOCOL_CREATE_POOL_FEE_SOL,
  RECLAIM_SOL_SERVICE_FEE_RATE,
  calculateModularTokenCreationFee,
  computeRateSplitPercent,
  computeSplit,
  formatSolAmount,
} from "@/lib/constants";
import { isValidPublicKey } from "@/lib/security";

export type { Operation };

export type Costs = Record<Operation, string>;

export interface CostSummaryProps {
  operation?: Operation;
  modularOptions?: ModularPricingOptions;
  liquiditySol?: number;
}

const SOLANA_ACCOUNT_RENT_SOL = Number(ESTIMATED_ATA_RENT_SOL.toFixed(4));
const SOLANA_LP_POOL_RENT_SOL = Number(ESTIMATED_LP_POOL_RENT_SOL.toFixed(4));
const SOLANA_NETWORK_TX_FEE_SOL = 0.00001;

const OPERATIONS_WITHOUT_NEW_ACCOUNT_RENT = new Set<Operation>([
  "burnToken",
  "burnAndEarn",
  "reclaimSol",
  "removeLiquidity",
  "manageAuthority",
  "claimWithheldTax",
]);

const devWalletBase58 = DEV_WALLET_ADDRESS.toBase58();

export default function CostSummary({
  operation = "createToken",
  modularOptions,
  liquiditySol = 0,
}: CostSummaryProps) {
  const langCtx = useLanguage();
  const t = langCtx?.t;
  const [liveModularOptions, setLiveModularOptions] = useState<ModularPricingOptions>(
    modularOptions || DEFAULT_MODULAR_PRICING_OPTIONS
  );
  const [hasActiveAffiliate, setHasActiveAffiliate] = useState<boolean>(false);

  useEffect(() => {
    if (modularOptions) {
      setLiveModularOptions(modularOptions);
    }
  }, [modularOptions]);

  useEffect(() => {
    const checkAffiliate = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const fromQuery = urlParams.get("ref");
        const stored = localStorage.getItem("affiliateRef");
        const candidate = (fromQuery || stored || "").trim();
        setHasActiveAffiliate(
          Boolean(
            candidate &&
              isValidPublicKey(candidate) &&
              candidate !== devWalletBase58
          )
        );
      } catch {
        setHasActiveAffiliate(false);
      }
    };

    checkAffiliate();

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
  const isCreateLp = operation === "createLiquidityPool";
  const isReclaimSol = operation === "reclaimSol";

  const modularCalculation = calculateModularTokenCreationFee(liveModularOptions);

  // Strict lookup in OPERATION_SERVICE_FEES_SOL (no hardcoded 0.35 or ?? 0.07 fallback)
  const activeServiceFeeSol: number = isCreateToken
    ? modularCalculation.totalSol
    : OPERATION_SERVICE_FEES_SOL[operation];

  const activeSplit = isCreateToken
    ? {
        affiliateSol: modularCalculation.affiliateSol,
        devWalletSol: modularCalculation.devWalletSol,
      }
    : computeSplit(activeServiceFeeSol);

  const reclaimRateSplit = computeRateSplitPercent(RECLAIM_SOL_SERVICE_FEE_RATE);

  const effectiveAccountRentSol = OPERATIONS_WITHOUT_NEW_ACCOUNT_RENT.has(operation)
    ? 0
    : isCreateLp
    ? SOLANA_LP_POOL_RENT_SOL
    : SOLANA_ACCOUNT_RENT_SOL;

  const raydiumProtocolFeeSol = isCreateLp ? RAYDIUM_PROTOCOL_CREATE_POOL_FEE_SOL : 0;
  const safeLiquiditySol = isCreateLp && liquiditySol > 0 ? Number(liquiditySol) : 0;

  const estimatedTotalSol =
    activeServiceFeeSol +
    raydiumProtocolFeeSol +
    safeLiquiditySol +
    effectiveAccountRentSol +
    SOLANA_NETWORK_TX_FEE_SOL;

  const localizedLabelMap: Record<string, string> = {
    base: t?.costs?.baseCreate || "Base Token Creation Fee (Mint)",
    revokeFreeze: t?.costs?.revokeFreeze || "Revoke Freeze Authority (Pool Ready)",
    revokeMint: t?.costs?.revokeMint || "Revoke Mint Authority (Fixed Supply)",
    immutable: t?.costs?.immutable || "Immutable Metadata Lock",
    customCreator: t?.costs?.customCreator || "Custom Creator Info (Metadata)",
    transferFeeExt: t?.costs?.transferFeeExt || "Tax Token / Transfer Fee Ext (Token-2022)",
    soulboundExt: "Soulbound / Non-Transferable (Token-2022)",
    permanentDelegateExt: "Permanent Delegate (Token-2022)",
    vanityMint: "Vanity Mint Address (3–4 chars)",
    jitoBundle: "Jito Atomic Bundle (Mint + Pool + Buy)",
    jitoMultiWalletBundle: "Jito Multi-Wallet Bundle (Anti-Bubblemaps 4–8 Wallets)",
  };

  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <span className={styles.headerTitle}>
          {t?.costs?.headerTitle || "On-Chain Cost Transparency"}
        </span>
        <span className={styles.headerBadge}>{t?.costs?.headerBadge || "100% Atomic"}</span>
      </div>

      <ul className={styles.costList}>
        {effectiveAccountRentSol > 0 && (
          <li className={styles.costListItem}>
            <span>{t?.costs?.rentLabel || "Network account rent (Est.):"}</span>
            <span className={styles.costValueMono}>
              ~{formatSolAmount(effectiveAccountRentSol, 3, 4)} SOL
            </span>
          </li>
        )}

        {isCreateLp && (
          <li className={styles.costListItem}>
            <span>Raydium CPMM Protocol Fee (createPoolFee):</span>
            <span className={styles.costValueMono}>
              {formatSolAmount(raydiumProtocolFeeSol)} SOL
            </span>
          </li>
        )}

        {isCreateLp && safeLiquiditySol > 0 && (
          <li className={styles.costListItem}>
            <span>Initial Pool Liquidity (SOL):</span>
            <span className={styles.costValueMono}>
              {formatSolAmount(safeLiquiditySol, 2, 4)} SOL
            </span>
          </li>
        )}

        <li className={styles.costListItem}>
          <span>{t?.costs?.networkFeeLabel || "Network tx fee:"}</span>
          <span className={styles.costValueMono}>~{SOLANA_NETWORK_TX_FEE_SOL.toFixed(5)} SOL</span>
        </li>

        <li className={styles.costListItem}>
          <span>{t?.costs?.serviceFeeLabel || "Service fee:"}</span>
          <span className={styles.costValueMono}>
            {isReclaimSol
              ? `${reclaimRateSplit.totalRatePercent}% (${reclaimRateSplit.netUserRatePercent}% Net)`
              : `${formatSolAmount(activeServiceFeeSol)} SOL`}
          </span>
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
              <strong>+{formatSolAmount(item.sol)} SOL</strong>
            </div>
          ))}
        </div>
      )}

      <div className={styles.estimatedTotalBox}>
        <div className={styles.estimatedTotalLabel}>
          <strong>{t?.costs?.estimatedWalletTotal || "Estimated Total"}</strong>
          <span>
            {t?.costs?.singleSignatureSub || "Single wallet signature"}
            {hasActiveAffiliate &&
              (isReclaimSol
                ? ` · 30% Aff (${reclaimRateSplit.affiliateRatePercent}%) / 70% Dev (${reclaimRateSplit.devWalletRatePercent}%)`
                : ` · 30% Aff (${formatSolAmount(activeSplit.affiliateSol, 3, 4)} SOL) / 70% Dev (${formatSolAmount(activeSplit.devWalletSol, 3, 4)} SOL)`)}
          </span>
        </div>
        <span className={styles.estimatedTotalValue}>
          {isReclaimSol
            ? `${reclaimRateSplit.netUserRatePercent}% Net to Wallet`
            : `~${formatSolAmount(estimatedTotalSol, 4, 4)} SOL`}
        </span>
      </div>

      <p className={styles.disclaimer}>
        {hasActiveAffiliate
          ? t?.costs?.atomicDisclaimer ||
            "Charged atomically in the same transaction with an instant 30% affiliate / 70% Dev Wallet split."
          : "Charged atomically in the same on-chain transaction."}{" "}
        ({devWalletBase58.slice(0, 6)}...{devWalletBase58.slice(-4)}).
      </p>
    </div>
  );
}
