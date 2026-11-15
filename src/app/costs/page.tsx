"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./Costs.module.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import {
  AFFILIATE_COMMISSION_RATE,
  DEV_AFFILIATE_SHARE_RATE,
  OFFICIAL_DEV_WALLET_STRING,
  PRICING_SCHEDULE_TABLE,
  PRICING_SOL,
  PricingScheduleItem,
} from "@/config/pricing";

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

  return (
    <div className={styles.container} style={{ maxWidth: "1120px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      <Card>
        <CardHeader>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            <CardTitle className={styles.title}>{pageTitle}</CardTitle>
            <span
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: "999px",
                fontSize: "0.75rem",
                fontWeight: 700,
                background: "rgba(20, 241, 149, 0.14)",
                border: "1px solid rgba(20, 241, 149, 0.4)",
                color: "#14f195",
              }}
            >
              30% Affiliate / 70% Dev Split · Atomic On-Chain
            </span>
          </div>
          <CardDescription>{pageDesc}</CardDescription>
        </CardHeader>

        <CardContent>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.86rem",
                textAlign: "left",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid hsl(var(--border))",
                    color: "hsl(var(--muted-foreground))",
                    fontSize: "0.76rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <th style={{ padding: "0.75rem 0.6rem" }}>
                    {isPt ? "Módulo / Funcionalidade" : "Module / Feature"}
                  </th>
                  <th style={{ padding: "0.75rem 0.6rem" }}>
                    {isPt ? "Rota" : "Route"}
                  </th>
                  <th style={{ padding: "0.75rem 0.6rem", textAlign: "right" }}>
                    {isPt ? "Taxa em SOL" : "Service Fee"}
                  </th>
                  <th style={{ padding: "0.75rem 0.6rem", textAlign: "right", color: "#14f195" }}>
                    {isPt ? "Split Afiliado (30%)" : "Affiliate (30%)"}
                  </th>
                  <th style={{ padding: "0.75rem 0.6rem", textAlign: "right", color: "#a78bfa" }}>
                    {isPt ? "Split Dev Wallet (70%)" : "Dev Wallet (70%)"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((item) => {
                  const displayName = isPt ? item.defaultNamePt : item.defaultNameEn;
                  const targetHref = item.route.includes("/add-liquidity") && !item.route.startsWith("/ ")
                    ? "/add-liquidity"
                    : item.route.startsWith("/")
                      ? item.route.split(" ")[0]
                      : "/";

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid hsla(var(--border), 0.55)",
                      }}
                    >
                      <td style={{ padding: "0.8rem 0.6rem", fontWeight: 600 }}>
                        <span>{displayName}</span>
                        {item.badge && (
                          <span
                            style={{
                              marginLeft: "0.5rem",
                              padding: "0.12rem 0.45rem",
                              borderRadius: "6px",
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              background: "rgba(153, 69, 255, 0.16)",
                              border: "1px solid rgba(153, 69, 255, 0.35)",
                              color: "#c4b5fd",
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "0.8rem 0.6rem", fontFamily: "monospace", fontSize: "0.8rem" }}>
                        <Link
                          href={targetHref}
                          style={{ color: "#00d1ff", textDecoration: "underline" }}
                        >
                          {item.route}
                        </Link>
                      </td>
                      <td
                        style={{
                          padding: "0.8rem 0.6rem",
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontWeight: 700,
                        }}
                      >
                        {item.feeDisplay}
                      </td>
                      <td
                        style={{
                          padding: "0.8rem 0.6rem",
                          textAlign: "right",
                          fontFamily: "monospace",
                          color: "#14f195",
                          fontWeight: 600,
                        }}
                      >
                        {item.affiliateSol.toFixed(3)} SOL
                      </td>
                      <td
                        style={{
                          padding: "0.8rem 0.6rem",
                          textAlign: "right",
                          fontFamily: "monospace",
                          color: "#c4b5fd",
                        }}
                      >
                        {item.devWalletSol.toFixed(3)} SOL
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: "1.25rem",
              padding: "0.95rem 1.1rem",
              borderRadius: "0.75rem",
              background: "hsla(var(--muted), 0.55)",
              border: "1px solid hsl(var(--border))",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: "0.75rem",
              fontSize: "0.82rem",
            }}
          >
            <span>
              {isPt ? "Aluguel de Conta Solana (ATA Rent Exemption):" : "Solana Account Rent Exemption:"}{" "}
              <strong>~{networkRentSol} SOL</strong>{" "}
              {isPt ? "(100% restituível em /burn)" : "(100% reclaimable in /burn)"}
            </span>
            <span style={{ fontFamily: "monospace" }}>
              Dev Wallet:{" "}
              <a
                href={`https://solscan.io/account/${OFFICIAL_DEV_WALLET_STRING}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#14f195", textDecoration: "underline" }}
              >
                {OFFICIAL_DEV_WALLET_STRING.slice(0, 8)}...{OFFICIAL_DEV_WALLET_STRING.slice(-6)} ↗
              </a>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
