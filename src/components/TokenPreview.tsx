"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCluster } from "@/context/WalletContext";
import styles from "@/components/TokenPreview.module.css";

export interface TokenPreviewProps {
  name: string;
  symbol: string;
  imageUrl: string;
  supply: string;
  decimals?: number;
  description?: string;
  tokenStandard: "spl" | "token-2022";
  mintAuthority?: boolean;
  freezeAuthority?: boolean;
  isMetadataMutable?: boolean;
  transferFeeBps?: number;
}

const TokenPreview = ({
  name,
  symbol,
  imageUrl,
  supply,
  decimals = 9,
  description,
  tokenStandard,
  mintAuthority = false,
  freezeAuthority = false,
  isMetadataMutable = false,
  transferFeeBps = 0,
}: TokenPreviewProps) => {
  const { cluster } = useCluster();
  const isDevnet = cluster === "devnet";
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [imageUrl]);

  const formattedSupply = new Intl.NumberFormat("en-US").format(
    Number(String(supply || "0").replace(/\D/g, "")) || 0
  );

  const cleanTicker = (symbol || "TOKEN").trim().toUpperCase().slice(0, 10);
  const monogram = cleanTicker.slice(0, 3) || "SPL";

  const isFreezeRevoked = !freezeAuthority;
  const isMintRevoked = !mintAuthority;
  const isImmutable = !isMetadataMutable;

  let rugCheckScore = 100;
  if (!isFreezeRevoked) rugCheckScore -= 50;
  if (!isMintRevoked) rugCheckScore -= 35;
  if (!isImmutable) rugCheckScore -= 15;
  rugCheckScore = Math.max(0, rugCheckScore);

  const badgeClass =
    rugCheckScore === 100
      ? styles.scoreBadgeSafe
      : rugCheckScore >= 65
        ? styles.scoreBadgeWarning
        : styles.scoreBadgeDanger;

  const progressFillClass =
    rugCheckScore === 100
      ? styles.progressFillSafe
      : rugCheckScore >= 65
        ? styles.progressFillWarning
        : styles.progressFillDanger;

  const hasValidImage = Boolean(imageUrl && imageUrl.trim() !== "" && !imageLoadFailed);

  return (
    <Card className={styles.previewCard}>
      <CardHeader>
        <CardTitle>Simulador de Carteira &amp; Auditoria</CardTitle>
        <CardDescription>
          Visualização reativa em tempo real de como seu ativo será exibido na Phantom, Solflare e
          DexScreener.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={styles.walletSimCard}>
          <div className={styles.walletSimHeader}>
            <span>SOLANA WALLET ASSET PREVIEW</span>
            <span className={isDevnet ? styles.networkBadgeDevnet : styles.networkBadgeMainnet}>
              {isDevnet ? "DEVNET SANDBOX" : "MAINNET-BETA"}
            </span>
          </div>

          <div className={styles.tokenDisplay}>
            {hasValidImage ? (
              <img
                src={imageUrl}
                alt={name || "Token Preview"}
                className={styles.tokenImage}
                onError={() => setImageLoadFailed(true)}
              />
            ) : (
              <div className={styles.tokenPlaceholder} aria-label="Token Logo Placeholder">
                {monogram}
              </div>
            )}

            <div className={styles.tokenInfo}>
              <div className={styles.nameAndBadge}>
                <p className={styles.tokenName}>{name.trim() || "Nome do Token"}</p>
                <span className={styles.tokenBadge}>
                  {tokenStandard === "token-2022" ? "Token-2022" : "SPL"}
                </span>
              </div>
              <p className={styles.tokenSymbol}>${cleanTicker}</p>
            </div>

            <div className={styles.tokenSupply}>
              <p className={styles.supplyValue}>{formattedSupply}</p>
              <p className={styles.supplyLabel}>Supply ({decimals} dec)</p>
            </div>
          </div>

          <div className={styles.metaSpecGrid}>
            <div className={styles.metaSpecItem}>
              <span>Decimais</span>
              <strong>{Number.isFinite(decimals) ? decimals : 9}</strong>
            </div>
            <div className={styles.metaSpecItem}>
              <span>Taxa Transfer</span>
              <strong>
                {tokenStandard === "token-2022" && transferFeeBps > 0
                  ? `${(transferFeeBps / 100).toFixed(2)}%`
                  : "0.00%"}
              </strong>
            </div>
            <div className={styles.metaSpecItem}>
              <span>Metadados</span>
              <strong>{isImmutable ? "Imutável" : "Mutável"}</strong>
            </div>
          </div>

          {description && description.trim().length > 0 && (
            <p className={styles.descriptionPreview}>{description.trim()}</p>
          )}
        </div>

        {/* Dynamic Auditoria & RugCheck Score (0 to 100%) */}
        <div className={styles.rugCheckBox}>
          <div className={styles.rugCheckHeader}>
            <span className={styles.rugCheckTitle}>🛡️ Auditoria &amp; RugCheck Score</span>
            <span className={badgeClass}>{rugCheckScore}/100</span>
          </div>

          <div className={styles.progressTrack}>
            <div className={progressFillClass} style={{ width: `${rugCheckScore}%` }} />
          </div>

          <div className={styles.alertsList}>
            {isMintRevoked && isFreezeRevoked && isImmutable && (
              <div className={styles.alertSafe}>
                🟢 100/100 - Seguro (Padrão DexScreener / RugCheck)
              </div>
            )}

            {!isFreezeRevoked && (
              <div className={styles.alertCritical}>
                🔴 Alerta Crítico: Freeze Authority ativa impede criação de Pool/Swap na Jupiter
              </div>
            )}

            {!isMintRevoked && (
              <div className={styles.alertWarning}>
                🟡 Risco de Diluição: Mint Authority aberta gera alerta nos scanners
              </div>
            )}

            {!isImmutable && (
              <div className={styles.alertWarning}>
                🟡 Metadados Mutáveis: Desative a mutabilidade (+0.05 SOL) para atingir 100/100 no
                RugCheck
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenPreview;
