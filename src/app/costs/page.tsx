"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import styles from "./Costs.module.css";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import {
  AFFILIATE_COMMISSION_RATE,
  DEFAULT_CREATE_TOKEN_FEE_SOL,
  DEV_AFFILIATE_SHARE_RATE,
  OFFICIAL_DEV_WALLET_STRING,
  PRICING_SCHEDULE_TABLE,
  PRICING_SOL,
  PricingScheduleItem,
  formatSolAmount,
  getTokenCreationFeeRangeSol,
} from "@/config/pricing";

type CategoryFilter = "all" | "mint" | "liquidity" | "burn_vesting" | "growth";

function getItemCategory(id: string): CategoryFilter {
  if (
    [
      "baseMint",
      "revokeFreeze",
      "revokeMint",
      "immutableMetadata",
      "customCreator",
      "transferFeeExt",
      "soulboundOrDelegateExt",
      "vanityMint",
    ].includes(id)
  ) {
    return "mint";
  }
  if (
    [
      "jitoAtomicBundle",
      "jitoMultiWalletBundle",
      "createLiquidityPool",
      "withdrawLiquiditySol",
    ].includes(id)
  ) {
    return "liquidity";
  }
  if (
    [
      "reclaimSolPlatformFeeRate",
      "burnAndEarnLockLp",
      "burnStandard",
      "tokenVestingLock",
    ].includes(id)
  ) {
    return "burn_vesting";
  }
  return "growth";
}

/**
 * Splits a route string (such as "/ & /add-liquidity" or "/api/actions/token/[mint]")
 * into individual segments and determines whether each segment is a safe static page href
 * or a dynamic/API endpoint that must NOT be passed into Next.js App Router <Link>.
 */
function parseRouteSegments(routeStr: string): Array<{
  label: string;
  safeHref: string | null;
}> {
  if (!routeStr) {
    return [{ label: "/", safeHref: "/" }];
  }

  return routeStr
    .split("&")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((segment) => {
      // Dynamic route segments (e.g. [mint]) or /api/* endpoints cannot be passed as literal Dynamic hrefs to Next.js <Link>
      if (
        segment.includes("[") ||
        segment.includes("]") ||
        segment.startsWith("/api/")
      ) {
        return { label: segment, safeHref: null };
      }

      if (segment.startsWith("/")) {
        const cleanHref = segment.split(" ")[0];
        return { label: segment, safeHref: cleanHref };
      }

      return { label: segment, safeHref: null };
    });
}

export default function CostsPage() {
  const langCtx = useLanguage();
  const locale = langCtx?.locale || "en";
  const t = langCtx?.t;

  const [schedule, setSchedule] = useState<ReadonlyArray<PricingScheduleItem>>(
    PRICING_SCHEDULE_TABLE
  );
  const [networkRentSol, setNetworkRentSol] = useState<string>(
    PRICING_SOL.estimatedAtaRentReclaimSol.toFixed(5)
  );
  const [category, setCategory] = useState<CategoryFilter>("all");

  useEffect(() => {
    let active = true;
    fetch("/api/costs")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (Array.isArray(data.schedule) && data.schedule.length > 0) {
          setSchedule(data.schedule);
        }
        if (data.networkRent) {
          setNetworkRentSol(String(data.networkRent));
        }
      })
      .catch(() => {
        // Keep static fallback schedule from src/config/pricing.ts on network failure
      });
    return () => {
      active = false;
    };
  }, []);

  const isPt = locale === "pt" || locale === "pt-BR";
  const feeRange = useMemo(() => getTokenCreationFeeRangeSol(), []);

  const filteredSchedule = useMemo(() => {
    if (category === "all") return schedule;
    return schedule.filter((item) => getItemCategory(item.id) === category);
  }, [schedule, category]);

  const pageTitle =
    t?.costsPage?.pageTitle ||
    (isPt
      ? "Tabela Transparente de Custos & Comissionamento On-Chain"
      : "Transparent On-Chain Fee & Affiliate Split Schedule");
  const pageDesc =
    t?.costsPage?.pageDesc ||
    (isPt
      ? `Todas as taxas são cobradas de forma 100% atômica na mesma transação principal, com split automático de ${Math.round(
          AFFILIATE_COMMISSION_RATE * 100
        )}% para Afiliados e ${Math.round(DEV_AFFILIATE_SHARE_RATE * 100)}% para a Dev Wallet.`
      : `All service fees are charged 100% atomically inside the user's main transaction, with an automatic ${Math.round(
          AFFILIATE_COMMISSION_RATE * 100
        )}% Affiliate / ${Math.round(DEV_AFFILIATE_SHARE_RATE * 100)}% Dev Wallet split.`);

  const categories: Array<{ id: CategoryFilter; labelPt: string; labelEn: string }> = [
    { id: "all", labelPt: "Todos os Módulos", labelEn: "All Modules" },
    { id: "mint", labelPt: "Criação & Token-2022", labelEn: "Token Mint & 2022" },
    { id: "liquidity", labelPt: "Liquidez & Jito MEV", labelEn: "Liquidity & Jito MEV" },
    { id: "burn_vesting", labelPt: "Burn, Reclaim & Vesting", labelEn: "Burn, Reclaim & Vesting" },
    { id: "growth", labelPt: "Volume, Airdrop & Blinks", labelEn: "Volume, Airdrop & Blinks" },
  ];

  return (
    <div className={styles.container}>
      {/* KPI Highlights */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            {isPt ? "Criação de Token (Base → Recomendado)" : "Token Mint (Base → Recommended)"}
          </span>
          <span className={styles.kpiValue}>
            {formatSolAmount(PRICING_SOL.baseMint)} → {formatSolAmount(DEFAULT_CREATE_TOKEN_FEE_SOL)} SOL
          </span>
          <span className={styles.kpiHint}>
            {isPt
              ? `Intervalo completo: ${feeRange.minDisplay} a ${feeRange.maxStandardDisplay}`
              : `Full modular range: ${feeRange.minDisplay} to ${feeRange.maxStandardDisplay}`}
          </span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            {isPt ? "Pool Raydium CPMM (Serviço + Protocolo)" : "Raydium CPMM Pool (Service + Protocol)"}
          </span>
          <span className={styles.kpiValue}>
            {formatSolAmount(PRICING_SOL.createLiquidityPool)} +{" "}
            {formatSolAmount(PRICING_SOL.raydiumProtocolCreatePoolFeeSol)} SOL
          </span>
          <span className={styles.kpiHint}>
            {isPt
              ? `+ ~${formatSolAmount(PRICING_SOL.estimatedLpPoolRentSol, 3, 3)} SOL rent das contas CPMM`
              : `+ ~${formatSolAmount(PRICING_SOL.estimatedLpPoolRentSol, 3, 3)} SOL CPMM account rent`}
          </span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            {isPt ? "Recuperação de Aluguel (Reclaim SOL)" : "Rent Recovery (Reclaim SOL)"}
          </span>
          <span className={styles.kpiValue}>
            {isPt ? "92% Líquido" : "92% Net to User"}
          </span>
          <span className={styles.kpiHint}>
            {isPt
              ? `~${networkRentSol} SOL/ATA · Taxa 8% (2.4% Afiliado / 5.6% Dev)`
              : `~${networkRentSol} SOL/ATA · 8% Fee (2.4% Affiliate / 5.6% Dev)`}
          </span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            {isPt ? "Split Atômico de Afiliados" : "Atomic Affiliate Split"}
          </span>
          <span className={styles.kpiValuePurple}>30% Aff / 70% Dev</span>
          <span className={styles.kpiHint}>
            {isPt
              ? "Liquidado na mesma transação via SystemProgram.transfer"
              : "Settled in the exact same transaction via SystemProgram.transfer"}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className={styles.heroHeader}>
            <div className={styles.heroTopRow}>
              <h1 className={styles.title}>{pageTitle}</h1>
              <span className={styles.atomicSplitBadge}>
                <span className={styles.atomicPulseDot} />
                30% Affiliate / 70% Dev Split · Atomic On-Chain
              </span>
            </div>
            <p className={styles.subtitle}>{pageDesc}</p>
          </div>

          <div className={styles.filterToolbar}>
            <div className={styles.filterPills} role="tablist" aria-label="Filter fee categories">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`${styles.filterPill} ${
                    category === cat.id ? styles.filterPillActive : ""
                  }`}
                >
                  {isPt ? cat.labelPt : cat.labelEn}
                </button>
              ))}
            </div>
            <span className={styles.countInfo}>
              {filteredSchedule.length} / {schedule.length}{" "}
              {isPt ? "operações listadas" : "operations listed"}
            </span>
          </div>
        </CardHeader>

        <CardContent>
          <div className={styles.tableWrapper}>
            <table className={styles.pricingTable}>
              <thead>
                <tr>
                  <th>{isPt ? "Módulo / Funcionalidade" : "Module / Feature"}</th>
                  <th>{isPt ? "Rota / Endpoint" : "Route / Endpoint"}</th>
                  <th style={{ textAlign: "right" }}>
                    {isPt ? "Taxa de Serviço" : "Service Fee"}
                  </th>
                  <th style={{ textAlign: "right", color: "#14f195" }}>
                    {isPt ? "Split Afiliado (30%)" : "Affiliate (30%)"}
                  </th>
                  <th style={{ textAlign: "right", color: "#c4b5fd" }}>
                    {isPt ? "Split Dev Wallet (70%)" : "Dev Wallet (70%)"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedule.map((item) => {
                  const displayName = isPt ? item.defaultNamePt : item.defaultNameEn;
                  const segments = parseRouteSegments(item.route);
                  const feeText =
                    isPt && item.feeDisplayPt ? item.feeDisplayPt : item.feeDisplay;

                  const affiliateText = item.isPercentageRate
                    ? isPt
                      ? item.affiliateDisplayPt || "30% da taxa (2.4% do rent)"
                      : item.affiliateDisplayEn || "30% of fee (2.4% of rent)"
                    : `${formatSolAmount(item.affiliateSol, 3, 4)} SOL`;

                  const devWalletText = item.isPercentageRate
                    ? isPt
                      ? item.devWalletDisplayPt || "70% da taxa (5.6% do rent)"
                      : item.devWalletDisplayEn || "70% of fee (5.6% of rent)"
                    : `${formatSolAmount(item.devWalletSol, 3, 4)} SOL`;

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className={styles.featureCell}>
                          <span>{displayName}</span>
                          {item.badge && (
                            <span className={styles.featureBadge}>{item.badge}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.routeChipsWrap}>
                          {segments.map((seg, idx) =>
                            seg.safeHref ? (
                              <Link
                                key={`${item.id}-seg-${idx}`}
                                href={seg.safeHref}
                                className={styles.routeLinkChip}
                              >
                                <span>{seg.label}</span>
                                <span aria-hidden="true">↗</span>
                              </Link>
                            ) : (
                              <code
                                key={`${item.id}-seg-${idx}`}
                                className={styles.apiRouteChip}
                                title={
                                  isPt
                                    ? "Endpoint de Action/Blink dinâmico (substitua [mint] pelo endereço do token)"
                                    : "Dynamic Solana Action/Blink endpoint (replace [mint] with token address)"
                                }
                              >
                                ⚡ {seg.label}
                              </code>
                            )
                          )}
                        </div>
                      </td>
                      <td className={styles.feeCell}>{feeText}</td>
                      <td className={styles.affiliateCell}>{affiliateText}</td>
                      <td className={styles.devCell}>{devWalletText}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.footerNoteBar}>
            <span>
              {isPt
                ? "Aluguel de Conta Solana (ATA Rent Exemption):"
                : "Solana Account Rent Exemption:"}{" "}
              <strong>~{networkRentSol} SOL</strong>{" "}
              {isPt
                ? "(restituível em /reclaim e /burn)"
                : "(reclaimable in /reclaim and /burn)"}
            </span>
            <span style={{ fontFamily: "monospace" }}>
              Dev Wallet:{" "}
              <a
                href={`https://solscan.io/account/${OFFICIAL_DEV_WALLET_STRING}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.devWalletLink}
              >
                {OFFICIAL_DEV_WALLET_STRING.slice(0, 8)}...
                {OFFICIAL_DEV_WALLET_STRING.slice(-6)} ↗
              </a>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
