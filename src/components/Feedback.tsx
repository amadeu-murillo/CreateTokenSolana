"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCluster } from "@/context/WalletContext";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./Feedback.module.css";

const CheckCircle = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={styles.iconSuccess}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const XCircle = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={styles.iconError}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

type FeedbackProps = {
  success: boolean;
  tokenAddress?: string;
  errorMessage?: string;
  txId?: string | null;
};

interface CachedTokenDossier {
  mintAddress: string;
  signature: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  imageUrl: string;
  tokenStandard: string;
  mintAuthority: boolean;
  freezeAuthority: boolean;
  isMetadataMutable: boolean;
  serviceFeeSol: number;
  network: string;
}

export default function Feedback({ success, tokenAddress, errorMessage, txId }: FeedbackProps) {
  const { getExplorerUrl } = useCluster();
  const { t } = useLanguage();
  const [dossier, setDossier] = useState<CachedTokenDossier | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastCreatedTokenDossier");
      if (raw) {
        const parsed = JSON.parse(raw) as CachedTokenDossier;
        if (!tokenAddress || parsed.mintAddress === tokenAddress) {
          setDossier(parsed);
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }, [tokenAddress]);

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard?.writeText(value);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2200);
  };

  if (success) {
    return (
      <Card className={styles.success}>
        <CardHeader>
          <div className={styles.header}>
            <CheckCircle />
            <CardTitle>{t.confirmationPage.mintedVerifiedTitle}</CardTitle>
          </div>
        </CardHeader>
        <CardContent style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {dossier && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.9rem",
                borderRadius: "0.75rem",
                background: "hsla(var(--muted), 0.55)",
                border: "1px solid hsl(var(--border))",
              }}
            >
              {dossier.imageUrl && (
                <img
                  src={dossier.imageUrl}
                  alt={dossier.name}
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #10b981",
                  }}
                />
              )}
              <div style={{ textAlign: "left", flex: 1 }}>
                <strong style={{ fontSize: "1.05rem", display: "block" }}>
                  {dossier.name} ({dossier.symbol})
                </strong>
                <span style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>
                  Supply: {Number(dossier.supply).toLocaleString("en-US")} · Decimals:{" "}
                  {dossier.decimals} · Standard: {dossier.tokenStandard.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          <div style={{ textAlign: "left" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.3rem",
              }}
            >
              <span style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>
                {t.confirmationPage.mintAddressLabel}
              </span>
              {tokenAddress && (
                <button
                  type="button"
                  onClick={() => handleCopy(tokenAddress, "mint")}
                  style={{
                    fontSize: "0.74rem",
                    padding: "0.15rem 0.55rem",
                    borderRadius: "6px",
                    background: "hsla(var(--primary), 0.16)",
                    color: "hsl(var(--primary))",
                    border: "1px solid hsla(var(--primary), 0.35)",
                    cursor: "pointer",
                  }}
                >
                  {copiedField === "mint" ? t.common.copied : t.common.copy}
                </button>
              )}
            </div>
            <p className={styles.address}>{tokenAddress}</p>
          </div>

          {txId && (
            <div style={{ textAlign: "left" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.3rem",
                }}
              >
                <span style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>
                  {t.confirmationPage.txSignatureLabel}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(txId, "tx")}
                  style={{
                    fontSize: "0.74rem",
                    padding: "0.15rem 0.55rem",
                    borderRadius: "6px",
                    background: "hsla(var(--primary), 0.16)",
                    color: "hsl(var(--primary))",
                    border: "1px solid hsla(var(--primary), 0.35)",
                    cursor: "pointer",
                  }}
                >
                  {copiedField === "tx" ? t.common.copied : t.common.copy}
                </button>
              </div>
              <p className={styles.address}>{txId}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            {tokenAddress && (
              <a
                href={getExplorerUrl("token", tokenAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                {t.confirmationPage.viewTokenSolscan}
              </a>
            )}
            {txId && (
              <a
                href={getExplorerUrl("tx", txId)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                {t.confirmationPage.viewTxSolscan}
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={styles.error}>
      <CardHeader>
        <div className={styles.header}>
          <XCircle />
          <CardTitle>Error</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className={styles.errorMessage}>
          {decodeURIComponent(errorMessage || "Something went wrong while creating the token.")}
        </p>
      </CardContent>
    </Card>
  );
}
