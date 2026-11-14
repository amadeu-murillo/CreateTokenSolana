import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import styles from "@/components/TokenPreview.module.css";

export interface TokenPreviewProps {
  name: string;
  symbol: string;
  imageUrl: string;
  supply: string;
  tokenStandard: "spl" | "token-2022";
  mintAuthority?: boolean;
  freezeAuthority?: boolean;
  isMetadataMutable?: boolean;
}

const TokenPreview = ({
  name,
  symbol,
  imageUrl,
  supply,
  tokenStandard,
  mintAuthority = false,
  freezeAuthority = false,
  isMetadataMutable = false,
}: TokenPreviewProps) => {
  const formattedSupply = new Intl.NumberFormat("en-US").format(
    Number(String(supply || "0").replace(/\D/g, "")) || 0
  );

  // Phase 1: Calculate dynamic RugCheck Score (0 to 100)
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

  return (
    <Card className={styles.previewCard}>
      <CardHeader>
        <CardTitle>Token Preview & RugCheck Audit</CardTitle>
        <CardDescription>
          Live preview of how your token appears in wallets, DexScreener, and RugCheck scanners.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={styles.tokenDisplay}>
          <img
            src={imageUrl || "https://placehold.co/80x80/24293E/FFFFFF?text=?"}
            alt="Token Preview"
            className={styles.tokenImage}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://placehold.co/80x80/24293E/FFFFFF?text=?";
            }}
          />
          <div className={styles.tokenInfo}>
            <div className={styles.nameAndBadge}>
              <p className={styles.tokenName}>{name || "My Token"}</p>
              <span className={styles.tokenBadge}>
                {tokenStandard === "token-2022" ? "Token-2022" : "SPL"}
              </span>
            </div>
            <p className={styles.tokenSymbol}>{symbol || "MTK"}</p>
          </div>
          <div className={styles.tokenSupply}>
            <p className={styles.supplyValue}>{formattedSupply}</p>
            <p className={styles.supplyLabel}>Total Supply</p>
          </div>
        </div>

        {/* Phase 1: Dynamic Auditoria & RugCheck Score (0 to 100%) */}
        <div className={styles.rugCheckBox}>
          <div className={styles.rugCheckHeader}>
            <span className={styles.rugCheckTitle}>🛡️ Auditoria & RugCheck Score</span>
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
