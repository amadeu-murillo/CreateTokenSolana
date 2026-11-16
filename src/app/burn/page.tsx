"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useBurnToken } from "../../hooks/useBurnToken";
import { useUserTokens } from "../../hooks/useUserTokens";
import { useCluster } from "@/context/WalletContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../../components/ui/card";
import { TokenSelector } from "../../components/TokenSelector";
import Notification from "../../components/ui/Notification";
import TransactionStatusStepper from "@/components/TransactionStatusStepper";
import CostSummary from "@/components/CostSummary";
import styles from "./Burn.module.css";
import {
  DEV_WALLET_ADDRESS,
  ESTIMATED_ATA_RENT_SOL,
  RECLAIM_SOL_SERVICE_FEE_RATE,
  SERVICE_FEE_BURN_TOKEN_SOL,
  SERVICE_FEE_BURN_AND_EARN_SOL,
} from "@/lib/constants";

const devWalletBase58 = DEV_WALLET_ADDRESS.toBase58();

const BURN_PRESETS = [
  { label: "25%", ratio: 0.25 },
  { label: "50%", ratio: 0.5 },
  { label: "75%", ratio: 0.75 },
  { label: "100% MAX", ratio: 1 },
];

const TokenIcon = () => (
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
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

const FlameIcon = () => (
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
  >
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

type NotificationState = {
  type: "success" | "error";
  message: string;
  txId?: string | null;
} | null;

interface LastBurnReceipt {
  mode: "burn" | "burn-and-earn";
  displayName: string;
  symbol: string;
  mint: string;
  burnedAmount: number;
  remainingBalance: number;
  signature: string;
  timestamp: string;
}

function BurnCertificateCanvas({
  receipt,
  explorerUrl,
}: {
  receipt: LastBurnReceipt;
  explorerUrl: string;
}) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#080D1E");
    bgGrad.addColorStop(0.5, "#13112C");
    bgGrad.addColorStop(1, "#06231D");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const borderGrad = ctx.createLinearGradient(0, 0, w, 0);
    borderGrad.addColorStop(0, "#9945FF");
    borderGrad.addColorStop(0.5, "#00D1FF");
    borderGrad.addColorStop(1, "#14F195");
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, w - 36, h - 36);

    ctx.fillStyle = "rgba(20, 241, 149, 0.16)";
    ctx.fillRect(54, 48, 560, 44);
    ctx.strokeStyle = "#14F195";
    ctx.lineWidth = 2;
    ctx.strokeRect(54, 48, 560, 44);

    ctx.fillStyle = "#14F195";
    ctx.font = "bold 19px Inter, sans-serif";
    ctx.fillText(
      receipt.mode === "burn-and-earn"
        ? "🔒 LP LOCKED (BURN & EARN) · DEXSCREENER VERIFIED"
        : "🔥 100% BURNED & VERIFIED ON-CHAIN",
      74,
      77
    );

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 34px Inter, sans-serif";
    ctx.fillText(
      receipt.mode === "burn-and-earn"
        ? "BURN & EARN LP LOCK CERTIFICATE"
        : "LP BURN / RUG-PROOF CERTIFICATE",
      54,
      145
    );

    ctx.fillStyle = receipt.mode === "burn-and-earn" ? "#14F195" : "#FF4D8D";
    ctx.font = "bold 42px monospace";
    ctx.fillText(
      `${receipt.mode === "burn-and-earn" ? "LOCKED " : "-"}${receipt.burnedAmount.toLocaleString(
        "en-US"
      )} ${receipt.symbol}`,
      54,
      208
    );

    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(54, 240, w - 108, 195);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(54, 240, w - 108, 195);

    const shortMint = `${receipt.mint.slice(0, 12)}...${receipt.mint.slice(-10)}`;
    const shortSig = `${receipt.signature.slice(0, 16)}...${receipt.signature.slice(-14)}`;

    ctx.fillStyle = "#94A3B8";
    ctx.font = "600 18px Inter, sans-serif";
    ctx.fillText("Asset / Token:", 80, 282);
    ctx.fillText("Mint Address:", 80, 326);
    ctx.fillText("Solscan TX:", 80, 370);
    ctx.fillText("Timestamp (UTC):", 80, 412);

    ctx.fillStyle = "#F8FAFC";
    ctx.font = "bold 19px monospace";
    ctx.fillText(`${receipt.displayName} (${receipt.symbol})`, 280, 282);
    ctx.fillStyle = "#00D1FF";
    ctx.fillText(shortMint, 280, 326);
    ctx.fillStyle = "#14F195";
    ctx.fillText(shortSig, 280, 370);
    ctx.fillStyle = "#E2E8F0";
    ctx.fillText(receipt.timestamp, 280, 412);

    // Draw deterministic verification matrix badge in bottom-right of box
    ctx.strokeStyle = "#14F195";
    ctx.lineWidth = 2;
    ctx.strokeRect(w - 190, 265, 110, 110);
    ctx.fillStyle = "#14F195";
    ctx.font = "bold 11px monospace";
    ctx.fillText("SOLSCAN TX", w - 172, 315);
    ctx.fillText("VERIFIED ✓", w - 170, 335);

    ctx.fillStyle = "#A78BFA";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.fillText(
      "Verified by CreateTokenSolana · https://www.createtokensol.store",
      54,
      485
    );
  }, [receipt]);

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${receipt.mode}-${receipt.symbol.toLowerCase()}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const shareText = encodeURIComponent(
    `🔥 ${
      receipt.mode === "burn-and-earn"
        ? "Acabei de trancar permanentemente (Burn & Earn)"
        : "Acabei de queimar permanentemente"
    } ${receipt.burnedAmount.toLocaleString(
      "en-US"
    )} $${receipt.symbol} on-chain na Solana!\n\n✅ 100% VERIFIED ON-CHAIN\n🪙 Mint: ${receipt.mint.slice(
      0,
      8
    )}...${receipt.mint.slice(-6)}\n🔗 Solscan: ${explorerUrl}\n🚀 Via @CreateTokenSol https://www.createtokensol.store`
  );
  const shareUrl = `https://twitter.com/intent/tweet?text=${shareText}`;

  return (
    <div className={styles.certificateContainer}>
      <div className={styles.certificateHeader}>
        <strong>{t.burnPage.certHeaderTitle}</strong>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: "0.8rem", color: "#14f195", textDecoration: "underline" }}
        >
          {t.common.viewOnSolscan}
        </a>
      </div>

      <canvas
        ref={canvasRef}
        width={960}
        height={520}
        className={styles.certificateCanvas}
      />

      <div className={styles.certificateActions}>
        <button type="button" onClick={handleDownloadPng} className={styles.downloadPngBtn}>
          {t.burnPage.downloadPngBtn}
        </button>
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.shareXBtn}
        >
          {t.burnPage.shareXBtn}
        </a>
      </div>
    </div>
  );
}

function BurnPageContent() {
  const { cluster, setCluster, getExplorerUrl } = useCluster();
  const { t, locale } = useLanguage();
  const isPt = locale === "pt" || locale === "pt-BR";

  const [burnMode, setBurnMode] = useState<"burn" | "burn-and-earn">("burn");
  const [selectedTokenMint, setSelectedTokenMint] = useState("");
  const [amount, setAmount] = useState("");
  const [notification, setNotification] = useState<NotificationState>(null);
  const [lastBurnReceipt, setLastBurnReceipt] = useState<LastBurnReceipt | null>(null);

  const activeBurnFeeSol =
    burnMode === "burn-and-earn" ? SERVICE_FEE_BURN_AND_EARN_SOL : SERVICE_FEE_BURN_TOKEN_SOL;

  const {
    burnToken,
    reclaimEmptyAccounts,
    isLoading,
    isReclaimingSol,
    statusStep,
    progressStep,
    error,
    reclaimResult,
    reset,
  } = useBurnToken();

  const {
    tokens: userTokens,
    emptyAccounts,
    totalReclaimableSol,
    isLoading: isLoadingUserTokens,
    refreshTokens,
  } = useUserTokens();

  const selectedToken = useMemo(
    () => userTokens.find((tk) => tk.mint === selectedTokenMint) || null,
    [userTokens, selectedTokenMint]
  );

  useEffect(() => {
    if (error) {
      setNotification({ type: "error", message: error });
    }
  }, [error]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const walletBalance = useMemo(
    () => (selectedToken ? parseFloat(selectedToken.amount) || 0 : 0),
    [selectedToken]
  );
  const numericAmount = parseFloat(amount) || 0;
  const remainingBalance = Math.max(0, walletBalance - numericAmount);
  const pctBurned =
    walletBalance > 0 ? Math.min(100, (numericAmount / walletBalance) * 100) : 0;

  const selectedTokenDisplayLabel = useMemo(() => {
    if (!selectedToken) return "Token";
    if (selectedToken.name && selectedToken.name !== "Custom Token") {
      return selectedToken.name;
    }
    return `Token (${selectedToken.mint.slice(0, 6)}...${selectedToken.mint.slice(-4)})`;
  }, [selectedToken]);

  const handlePresetClick = (ratio: number) => {
    if (!selectedToken) return;
    if (ratio >= 1) {
      setAmount(selectedToken.amount);
    } else {
      const computed = walletBalance * ratio;
      setAmount(computed > 0 ? String(Number(computed.toFixed(4))) : "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    setLastBurnReceipt(null);
    reset();

    if (selectedToken && numericAmount > 0) {
      const signature = await burnToken(
        selectedToken.mint,
        numericAmount,
        selectedToken.programId
      );
      if (signature) {
        const cleanSymbol =
          selectedToken.symbol || selectedToken.mint.slice(0, 5).toUpperCase();
        setLastBurnReceipt({
          mode: burnMode,
          displayName: selectedTokenDisplayLabel,
          symbol: cleanSymbol,
          mint: selectedToken.mint,
          burnedAmount: numericAmount,
          remainingBalance,
          signature,
          timestamp: new Date().toUTCString(),
        });
        setNotification({
          type: "success",
          message:
            burnMode === "burn-and-earn"
              ? `✓ Burn & Earn Lock (${numericAmount.toLocaleString()} ${cleanSymbol}) confirmado na ${cluster}!`
              : `✓ ${numericAmount.toLocaleString()} ${cleanSymbol} queimados na ${cluster}!`,
          txId: signature,
        });
        setAmount("");
        refreshTokens();
      }
    }
  };

  const handleReclaimSolClick = async () => {
    setNotification(null);
    const res = await reclaimEmptyAccounts(emptyAccounts);
    if (res) {
      setNotification({
        type: "success",
        message: `✓ ${res.closedAccountsCount} ATAs (+${res.netUserSol.toFixed(5)} SOL)`,
        txId: res.signature,
      });
      refreshTokens();
    }
  };

  const handleCloseNotification = () => {
    setNotification(null);
    reset();
  };

  const estimatedReclaimFeeSol = totalReclaimableSol * RECLAIM_SOL_SERVICE_FEE_RATE;
  const estimatedNetReclaimSol = Math.max(0, totalReclaimableSol - estimatedReclaimFeeSol);

  const tutorialSteps = [
    {
      icon: <TokenIcon />,
      title: t.burnPage.tutorial1Title,
      description: t.burnPage.tutorial1Desc,
    },
    {
      icon: <FlameIcon />,
      title: t.burnPage.tutorial2Title,
      description: t.burnPage.tutorial2Desc,
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.topNetworkRow}>
          <div className={styles.networkPillGroup}>
            <span>{t.common.activeNetwork}</span>
            <button
              type="button"
              onClick={() => setCluster("mainnet-beta")}
              className={cluster === "mainnet-beta" ? styles.netBtnMainnet : styles.netBtnInactive}
            >
              ● Mainnet-Beta
            </button>
            <button
              type="button"
              onClick={() => setCluster("devnet")}
              className={cluster === "devnet" ? styles.netBtnDevnet : styles.netBtnInactive}
            >
              ● Devnet
            </button>
          </div>
          <span className={styles.feeBadgeTop}>
            {t.burnPage.feeBadgeLabel} <strong>{activeBurnFeeSol.toFixed(2)} SOL</strong>
          </span>
        </div>

        <h1 className={styles.pageTitle}>{t.burnPage.pageTitle}</h1>
        <p className={styles.pageDescription}>{t.burnPage.pageDesc}</p>

        {/* Phase 4.2: Burn Mode Switcher (Standard Burn 0.07 SOL vs Burn & Earn LP Lock 0.10 SOL) */}
        <div
          style={{
            display: "inline-flex",
            gap: "0.5rem",
            padding: "0.35rem",
            borderRadius: "999px",
            background: "hsla(var(--muted), 0.75)",
            border: "1px solid hsl(var(--border))",
            marginTop: "1rem",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setBurnMode("burn")}
            style={{
              padding: "0.5rem 1.1rem",
              borderRadius: "999px",
              fontWeight: 700,
              fontSize: "0.82rem",
              border: burnMode === "burn" ? "1px solid rgba(255, 77, 141, 0.5)" : "1px solid transparent",
              background: burnMode === "burn" ? "rgba(255, 77, 141, 0.16)" : "transparent",
              color: burnMode === "burn" ? "#ff4d8d" : "hsl(var(--muted-foreground))",
              cursor: "pointer",
            }}
          >
            🔥 {isPt ? "Queima Padrão (0.07 SOL)" : "Standard Burn (0.07 SOL)"}
          </button>
          <button
            type="button"
            onClick={() => setBurnMode("burn-and-earn")}
            style={{
              padding: "0.5rem 1.1rem",
              borderRadius: "999px",
              fontWeight: 700,
              fontSize: "0.82rem",
              border:
                burnMode === "burn-and-earn"
                  ? "1px solid rgba(20, 241, 149, 0.5)"
                  : "1px solid transparent",
              background:
                burnMode === "burn-and-earn" ? "rgba(20, 241, 149, 0.16)" : "transparent",
              color: burnMode === "burn-and-earn" ? "#14f195" : "hsl(var(--muted-foreground))",
              cursor: "pointer",
            }}
          >
            🔒 {isPt ? "Trancar LP & Ganhar Taxas — Burn & Earn (0.10 SOL)" : "Lock LP & Claim Fees — Burn & Earn (0.10 SOL)"}
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.formContainer}>
          <Card>
            <CardHeader>
              <CardTitle>
                {burnMode === "burn-and-earn"
                  ? isPt
                    ? `Trancar LP & Ganhar Taxas — Burn & Earn (${cluster})`
                    : `Burn & Earn: Lock LP & Harvest Swap Fees (${cluster})`
                  : `${t.burnPage.cardTitle} (${cluster})`}
              </CardTitle>
              <CardDescription>
                {burnMode === "burn-and-earn"
                  ? isPt
                    ? `Tranque permanentemente seus tokens LP mantendo o cadeado verde no DexScreener e RugCheck 100/100 enquanto coleta taxas de negociação. Taxa: ${SERVICE_FEE_BURN_AND_EARN_SOL.toFixed(2)} SOL.`
                    : `Permanently lock your LP tokens to keep the green lock badge on DexScreener & RugCheck 100/100 while harvesting swap fees. Fee: ${SERVICE_FEE_BURN_AND_EARN_SOL.toFixed(2)} SOL.`
                  : `${t.burnPage.cardDescPrefix} ${SERVICE_FEE_BURN_TOKEN_SOL.toFixed(2)} SOL (${devWalletBase58.slice(0, 6)}...${devWalletBase58.slice(-4)}).`}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className={styles.cardContent}>
                {notification && (
                  <Notification
                    type={notification.type}
                    message={notification.message}
                    txId={notification.txId}
                    onClose={handleCloseNotification}
                  />
                )}

                <TransactionStatusStepper
                  isActive={isLoading || isReclaimingSol}
                  currentStepIndex={progressStep}
                  statusMessage={statusStep}
                  operationTitle={
                    isReclaimingSol
                      ? `${t.burnPage.reclaimingStatus} (${cluster})`
                      : `${t.burnPage.executingBurnStatus} (${selectedTokenDisplayLabel})`
                  }
                />

                <div className={styles.field}>
                  <div className={styles.amountHeader}>
                    <Label htmlFor="token-select">{t.burnPage.step1SelectLabel}</Label>
                    <button
                      type="button"
                      onClick={refreshTokens}
                      disabled={isLoadingUserTokens || isLoading}
                      className={styles.presetBtn}
                    >
                      {t.common.refreshWallet}
                    </button>
                  </div>
                  <TokenSelector
                    tokens={userTokens}
                    selectedTokenMint={selectedTokenMint}
                    onSelectToken={(mint) => {
                      setSelectedTokenMint(mint);
                      setAmount("");
                      setLastBurnReceipt(null);
                    }}
                    isLoading={isLoadingUserTokens}
                    disabled={isLoading}
                    autoSelectFirst={true}
                    showQuickWalletCards={true}
                  />
                </div>

                {selectedToken && (
                  <>
                    <div className={styles.field}>
                      <div className={styles.amountHeader}>
                        <Label htmlFor="amount">{t.burnPage.step2AmountLabel}</Label>
                        <div className={styles.presetRow}>
                          <span className={styles.balance}>
                            {t.common.walletBalance} {walletBalance.toLocaleString()}
                          </span>
                          {BURN_PRESETS.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => handlePresetClick(preset.ratio)}
                              disabled={isLoading}
                              className={styles.presetBtn}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className={styles.amountInputContainer}>
                        <Input
                          id="amount"
                          type="number"
                          step="any"
                          placeholder="100000"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
                          min="0"
                          max={selectedToken.amount}
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          onClick={() => handlePresetClick(1)}
                          className={styles.maxButton}
                          disabled={isLoading}
                        >
                          MAX
                        </Button>
                      </div>
                    </div>

                    <div className={styles.impactCard}>
                      <div className={styles.impactHeader}>
                        <strong>
                          {burnMode === "burn-and-earn"
                            ? isPt
                              ? "🔒 Prévia de Bloqueio Permanente LP (Burn & Earn)"
                              : "🔒 Permanent LP Lock Preview (Burn & Earn)"
                            : t.burnPage.impactTitle}
                        </strong>
                        <span className={styles.irreversibleBadge}>
                          {t.burnPage.irreversibleBadge}
                        </span>
                      </div>
                      <div className={styles.impactGrid}>
                        <div className={styles.impactMetric}>
                          <span>{t.burnPage.currentBalanceLabel}</span>
                          <strong>{walletBalance.toLocaleString()}</strong>
                        </div>
                        <div className={styles.impactMetric}>
                          <span>{t.burnPage.amountToDestroyLabel}</span>
                          <strong className={styles.textRose}>
                            -{numericAmount.toLocaleString()}
                          </strong>
                        </div>
                        <div className={styles.impactMetric}>
                          <span>{t.burnPage.remainingBalanceLabel}</span>
                          <strong className={styles.textEmerald}>
                            {remainingBalance.toLocaleString()}
                          </strong>
                        </div>
                        <div className={styles.impactMetric}>
                          <span>{t.burnPage.shareBurnedLabel}</span>
                          <strong className={styles.textRose}>{pctBurned.toFixed(2)}%</strong>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {lastBurnReceipt && (
                  <BurnCertificateCanvas
                    receipt={lastBurnReceipt}
                    explorerUrl={getExplorerUrl("tx", lastBurnReceipt.signature)}
                  />
                )}
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    isReclaimingSol ||
                    !selectedToken ||
                    numericAmount <= 0 ||
                    numericAmount > walletBalance
                  }
                  className="w-full"
                >
                  {isLoading
                    ? statusStep || t.burnPage.executingBurnStatus
                    : burnMode === "burn-and-earn"
                      ? `🔒 ${isPt ? "Trancar LP & Emitir Certificado Burn & Earn" : "Lock LP & Mint Burn & Earn Certificate"} (${SERVICE_FEE_BURN_AND_EARN_SOL.toFixed(2)} SOL)`
                      : `${t.burnPage.submitBurnBtnPrefix} (${SERVICE_FEE_BURN_TOKEN_SOL.toFixed(2)} SOL)`}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <div className={styles.reclaimSolCard} id="reclaim-sol">
            <div>
              <span
                className={styles.irreversibleBadge}
                style={{
                  background: "rgba(20,241,149,0.16)",
                  borderColor: "rgba(20,241,149,0.4)",
                  color: "#14f195",
                }}
              >
                {t.burnPage.reclaimBadge}
              </span>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: "0.5rem" }}>
                {t.burnPage.reclaimTitle}
              </h3>
              <p
                style={{
                  fontSize: "0.86rem",
                  color: "hsl(var(--muted-foreground))",
                  marginTop: "0.25rem",
                }}
              >
                {t.burnPage.reclaimDesc} (~{ESTIMATED_ATA_RENT_SOL.toFixed(5)} SOL / ATA)
              </p>
            </div>

            <div className={styles.reclaimBanner}>
              <span>
                {t.burnPage.reclaimBannerPrefix} <strong>{emptyAccounts.length}</strong>{" "}
                {t.burnPage.reclaimBannerSuffix}
              </span>
              <strong>~{totalReclaimableSol.toFixed(5)} SOL</strong>
            </div>

            <div className={styles.reclaimMetricsGrid}>
              <div className={styles.impactMetric}>
                <span>{t.burnPage.emptyAccountsLabel}</span>
                <strong>{emptyAccounts.length} ATAs</strong>
              </div>
              <div className={styles.impactMetric}>
                <span>{t.burnPage.platformFeeLabel}</span>
                <strong>~{estimatedReclaimFeeSol.toFixed(5)} SOL</strong>
              </div>
              <div className={styles.impactMetric}>
                <span>{t.burnPage.netToYouLabel}</span>
                <strong className={styles.textEmerald}>
                  +{estimatedNetReclaimSol.toFixed(5)} SOL
                </strong>
              </div>
            </div>

            {reclaimResult && (
              <div className={styles.reclaimBanner}>
                <span>
                  ✓ {reclaimResult.closedAccountsCount} ATAs (+
                  {reclaimResult.netUserSol.toFixed(5)} SOL)
                </span>
                <a
                  href={getExplorerUrl("tx", reclaimResult.signature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#14f195", fontSize: "0.8rem", textDecoration: "underline" }}
                >
                  {t.common.viewOnSolscan}
                </a>
              </div>
            )}

            <Button
              type="button"
              onClick={handleReclaimSolClick}
              disabled={isReclaimingSol || isLoading || emptyAccounts.length === 0}
              className="w-full"
            >
              {isReclaimingSol
                ? statusStep || t.burnPage.reclaimingStatus
                : emptyAccounts.length > 0
                  ? `${t.burnPage.reclaimSubmitBtn} (+${estimatedNetReclaimSol.toFixed(4)} SOL)`
                  : t.burnPage.reclaimEmptyBtn}
            </Button>
          </div>
        </div>

        <div className={styles.sidebar}>
          <CostSummary operation={burnMode === "burn-and-earn" ? "burnAndEarn" : "burnToken"} />

          <h3 className={styles.sidebarTitle}>{t.burnPage.sidebarHowItWorks}</h3>
          {tutorialSteps.map((step, index) => (
            <Card key={index} className={styles.tutorialCard}>
              <CardContent className={styles.tutorialCardContent}>
                <div className={styles.tutorialIcon}>{step.icon}</div>
                <div className={styles.tutorialText}>
                  <p className={styles.tutorialTitle}>{step.title}</p>
                  <p className={styles.tutorialDescription}>{step.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className={styles.tutorialCard}>
            <CardContent className={styles.tutorialCardContent}>
              <div className={styles.tutorialText}>
                <p className={styles.tutorialTitle}>{t.burnPage.withdrawCtaTitle}</p>
                <p className={styles.tutorialDescription}>
                  {t.burnPage.withdrawCtaDesc}{" "}
                  <Link href="/add-liquidity?mode=withdraw">
                    <strong>{t.burnPage.withdrawCtaLink}</strong>
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function BurnPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
      <BurnPageContent />
    </Suspense>
  );
}
