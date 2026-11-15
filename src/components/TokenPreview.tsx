"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCluster } from "@/context/WalletContext";
import { useLanguage } from "@/context/LanguageContext";
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
  const { t } = useLanguage();
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
        <CardTitle>{t.tokenPreview.cardTitle}</CardTitle>
        <CardDescription>{t.tokenPreview.cardDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={styles.walletSimCard}>
          <div className={styles.walletSimHeader}>
            <span>{t.tokenPreview.headerLabel}</span>
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
                <p className={styles.tokenName}>
                  {name.trim() || t.tokenPreview.defaultTokenName}
                </p>
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
              <span>{t.tokenPreview.decimalsLabel}</span>
              <strong>{Number.isFinite(decimals) ? decimals : 9}</strong>
            </div>
            <div className={styles.metaSpecItem}>
              <span>{t.tokenPreview.transferFeeLabel}</span>
              <strong>
                {tokenStandard === "token-2022" && transferFeeBps > 0
                  ? `${(transferFeeBps / 100).toFixed(2)}%`
                  : "0.00%"}
              </strong>
            </div>
            <div className={styles.metaSpecItem}>
              <span>{t.tokenPreview.metadataLabel}</span>
              <strong>{isImmutable ? t.tokenPreview.immutable : t.tokenPreview.mutable}</strong>
            </div>
          </div>

          {description && description.trim().length > 0 && (
            <p className={styles.descriptionPreview}>{description.trim()}</p>
          )}
        </div>

        <div className={styles.rugCheckBox}>
          <div className={styles.rugCheckHeader}>
            <span className={styles.rugCheckTitle}>{t.tokenPreview.auditTitle}</span>
            <span className={badgeClass}>{rugCheckScore}/100</span>
          </div>

          <div className={styles.progressTrack}>
            <div className={progressFillClass} style={{ width: `${rugCheckScore}%` }} />
          </div>

          <div className={styles.alertsList}>
            {isMintRevoked && isFreezeRevoked && isImmutable && (
              <div className={styles.alertSafe}>{t.tokenPreview.alertSafe}</div>
            )}

            {!isFreezeRevoked && (
              <div className={styles.alertCritical}>{t.tokenPreview.alertFreeze}</div>
            )}

            {!isMintRevoked && (
              <div className={styles.alertWarning}>{t.tokenPreview.alertMint}</div>
            )}

            {!isImmutable && (
              <div className={styles.alertWarning}>{t.tokenPreview.alertMutable}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenPreview;
