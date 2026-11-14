"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useBurnToken } from "../../hooks/useBurnToken";
import { useUserTokens } from "../../hooks/useUserTokens";
import { useCluster } from "@/context/WalletContext";
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

const tutorialSteps = [
  {
    icon: <TokenIcon />,
    title: "1. Seleção Direta da Carteira",
    description:
      "Todos os tokens SPL, Token-2022 e LP da sua carteira conectada aparecem automaticamente (ou são pré-selecionados via ?mint=).",
  },
  {
    icon: <FlameIcon />,
    title: "2. Certificado Visual & Reclaim SOL",
    description: `Após queimar, baixe seu Certificado PNG oficial '100% BURNED & VERIFIED ON-CHAIN' e compartilhe no X. Aproveite também para fechar contas vazias e recuperar seu SOL.`,
  },
];

type NotificationState = {
  type: "success" | "error";
  message: string;
  txId?: string | null;
} | null;

interface LastBurnReceipt {
  displayName: string;
  symbol: string;
  mint: string;
  burnedAmount: number;
  remainingBalance: number;
  signature: string;
  timestamp: string;
}

/**
 * Phase 3: Renders the high-definition HTML5 <canvas> "LP Burn / Rug-Proof" Visual Certificate
 * with "Baixar Imagem PNG" and "Compartilhar no X" actions.
 */
function BurnCertificateCanvas({
  receipt,
  explorerUrl,
}: {
  receipt: LastBurnReceipt;
  explorerUrl: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Deep Solana Aurora Background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#080D1E");
    bgGrad.addColorStop(0.5, "#13112C");
    bgGrad.addColorStop(1, "#06231D");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Decorative Glow Border
    const borderGrad = ctx.createLinearGradient(0, 0, w, 0);
    borderGrad.addColorStop(0, "#9945FF");
    borderGrad.addColorStop(0.5, "#00D1FF");
    borderGrad.addColorStop(1, "#14F195");
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, w - 36, h - 36);

    // 3. Top Pill Badge: "🔥 100% BURNED & VERIFIED ON-CHAIN"
    ctx.fillStyle = "rgba(20, 241, 149, 0.16)";
    ctx.fillRect(54, 48, 490, 44);
    ctx.strokeStyle = "#14F195";
    ctx.lineWidth = 2;
    ctx.strokeRect(54, 48, 490, 44);

    ctx.fillStyle = "#14F195";
    ctx.font = "bold 20px Inter, sans-serif";
    ctx.fillText("🔥 100% BURNED & VERIFIED ON-CHAIN", 74, 77);

    // 4. Main Headline & Burned Amount
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 36px Inter, sans-serif";
    ctx.fillText("LP BURN / RUG-PROOF CERTIFICATE", 54, 145);

    ctx.fillStyle = "#FF4D8D";
    ctx.font = "bold 44px monospace";
    ctx.fillText(
      `-${receipt.burnedAmount.toLocaleString("en-US")} ${receipt.symbol}`,
      54,
      208
    );

    // 5. On-Chain Verification Details Box
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
    ctx.fillText("TX Signature:", 80, 370);
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

    // 6. Platform Watermark Footer
    ctx.fillStyle = "#A78BFA";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.fillText(
      "Verified by CreateTokenSolana · https://www.createtoken.sbs",
      54,
      485
    );
  }, [receipt]);

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `burn-certificate-${receipt.symbol.toLowerCase()}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const shareText = encodeURIComponent(
    `🔥 Acabei de queimar permanentemente ${receipt.burnedAmount.toLocaleString(
      "en-US"
    )} $${receipt.symbol} on-chain na Solana!\n\n✅ 100% BURNED & VERIFIED ON-CHAIN\n🪙 Mint: ${receipt.mint.slice(
      0,
      8
    )}...${receipt.mint.slice(-6)}\n🔗 Solscan: ${explorerUrl}\n🚀 Via @CreateTokenSol https://www.createtoken.sbs`
  );
  const shareUrl = `https://twitter.com/intent/tweet?text=${shareText}`;

  return (
    <div className={styles.certificateContainer}>
      <div className={styles.certificateHeader}>
        <strong>🏆 Certificado Oficial LP Burn / Rug-Proof</strong>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: "0.8rem", color: "#14f195", textDecoration: "underline" }}
        >
          Ver Transação no Solscan ↗
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
          ⬇️ Baixar Imagem PNG
        </button>
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.shareXBtn}
        >
          𝕏 Compartilhar no X (Twitter)
        </a>
      </div>
    </div>
  );
}

function BurnPageContent() {
  const { cluster, setCluster, getExplorerUrl } = useCluster();
  const [selectedTokenMint, setSelectedTokenMint] = useState("");
  const [amount, setAmount] = useState("");
  const [notification, setNotification] = useState<NotificationState>(null);
  const [lastBurnReceipt, setLastBurnReceipt] = useState<LastBurnReceipt | null>(null);

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
    () => userTokens.find((t) => t.mint === selectedTokenMint) || null,
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
    if (!selectedToken) return "Selected Wallet Token";
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
          message: `Sucesso! ${numericAmount.toLocaleString()} ${cleanSymbol} queimados permanentemente na rede ${cluster}.`,
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
        message: `Resgate concluído! ${res.closedAccountsCount} contas vazias fechadas e +${res.netUserSol.toFixed(
          5
        )} SOL devolvidos para sua carteira.`,
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

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.topNetworkRow}>
          <div className={styles.networkPillGroup}>
            <span>Active Network:</span>
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
            Standardized Burn Fee: <strong>{SERVICE_FEE_BURN_TOKEN_SOL.toFixed(2)} SOL</strong>
          </span>
        </div>

        <h1 className={styles.pageTitle}>On-Chain Token & LP Burner + Reclaim SOL</h1>
        <p className={styles.pageDescription}>
          Selecione qualquer token ou LP token diretamente da sua carteira conectada, gere seu
          Certificado Visual Rug-Proof em PNG e recupere o SOL preso em contas vazias.
        </p>
      </header>

      <div className={styles.grid}>
        <div className={styles.formContainer}>
          {/* 1. Token & LP Burner Card */}
          <Card>
            <CardHeader>
              <CardTitle>Burn Tokens or LP Tokens ({cluster})</CardTitle>
              <CardDescription>
                Escolha seu token ou LP token diretamente da sua carteira conectada. Taxa de
                serviço: <strong>{SERVICE_FEE_BURN_TOKEN_SOL.toFixed(2)} SOL</strong> enviada para
                Dev Wallet{" "}
                <code>
                  {devWalletBase58.slice(0, 6)}...{devWalletBase58.slice(-4)}
                </code>
                .
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
                      ? `Closing Empty Token Accounts on ${cluster}`
                      : `Burning ${selectedTokenDisplayLabel} on ${cluster}`
                  }
                />

                <div className={styles.field}>
                  <div className={styles.amountHeader}>
                    <Label htmlFor="token-select">
                      1. Select Token or LP Token Directly from Your Wallet
                    </Label>
                    <button
                      type="button"
                      onClick={refreshTokens}
                      disabled={isLoadingUserTokens || isLoading}
                      className={styles.presetBtn}
                    >
                      ↻ Refresh Wallet
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

                {isLoadingUserTokens && !selectedToken && (
                  <div className={styles.skeletonImpactCard} aria-busy="true">
                    <div className={styles.skeletonMetricBox} />
                    <div className={styles.skeletonMetricBox} />
                    <div className={styles.skeletonMetricBox} />
                    <div className={styles.skeletonMetricBox} />
                  </div>
                )}

                {selectedToken && (
                  <>
                    <div className={styles.field}>
                      <div className={styles.amountHeader}>
                        <Label htmlFor="amount">2. Amount to Burn</Label>
                        <div className={styles.presetRow}>
                          <span className={styles.balance}>
                            Wallet Balance: {walletBalance.toLocaleString()}
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
                          placeholder="E.g.: 100000"
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
                        <strong>🔥 Live Deflationary Burn Impact Preview</strong>
                        <span className={styles.irreversibleBadge}>IRREVERSIBLE ON-CHAIN</span>
                      </div>
                      <div className={styles.impactGrid}>
                        <div className={styles.impactMetric}>
                          <span>Current Wallet Balance</span>
                          <strong>{walletBalance.toLocaleString()}</strong>
                        </div>
                        <div className={styles.impactMetric}>
                          <span>Amount to Destroy</span>
                          <strong className={styles.textRose}>
                            -{numericAmount.toLocaleString()}
                          </strong>
                        </div>
                        <div className={styles.impactMetric}>
                          <span>Remaining Balance</span>
                          <strong className={styles.textEmerald}>
                            {remainingBalance.toLocaleString()}
                          </strong>
                        </div>
                        <div className={styles.impactMetric}>
                          <span>Share of Holdings Burned</span>
                          <strong className={styles.textRose}>{pctBurned.toFixed(2)}%</strong>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Phase 3: HTML5 Canvas Visual Burn Certificate */}
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
                    ? statusStep || "Executing On-Chain Burn..."
                    : `🔥 Burn ${numericAmount > 0 ? numericAmount.toLocaleString() : "Selected"} Wallet Tokens (Fee: ${SERVICE_FEE_BURN_TOKEN_SOL.toFixed(2)} SOL)`}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Phase 4: Viral Tool "Recuperar SOL" (Close Empty Token Accounts) */}
          <div className={styles.reclaimSolCard} id="reclaim-sol">
            <div>
              <span className={styles.irreversibleBadge} style={{ background: "rgba(20,241,149,0.16)", borderColor: "rgba(20,241,149,0.4)", color: "#14f195" }}>
                💎 FERRAMENTA VIRAL · CLOSE EMPTY TOKEN ACCOUNTS
              </span>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: "0.5rem" }}>
                Recuperar SOL de Contas Vazias (Rent Recovery)
              </h3>
              <p style={{ fontSize: "0.86rem", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }}>
                Cada token zerado na sua carteira mantém ~{ESTIMATED_ATA_RENT_SOL.toFixed(5)} SOL
                bloqueados de aluguel (rent). Feche até 20 contas vazias por transação e receba seu
                SOL de volta instantaneamente.
              </p>
            </div>

            <div className={styles.reclaimBanner}>
              <span>
                Você possui <strong>{emptyAccounts.length}</strong> contas vazias na carteira =
              </span>
              <strong>~{totalReclaimableSol.toFixed(5)} SOL disponível para resgate</strong>
            </div>

            <div className={styles.reclaimMetricsGrid}>
              <div className={styles.impactMetric}>
                <span>Contas Vazias (Saldo 0)</span>
                <strong>{emptyAccounts.length} ATAs</strong>
              </div>
              <div className={styles.impactMetric}>
                <span>Taxa Plataforma (15%)</span>
                <strong>~{estimatedReclaimFeeSol.toFixed(5)} SOL</strong>
              </div>
              <div className={styles.impactMetric}>
                <span>Líquido para Você (85%)</span>
                <strong className={styles.textEmerald}>
                  +{estimatedNetReclaimSol.toFixed(5)} SOL
                </strong>
              </div>
            </div>

            {reclaimResult && (
              <div className={styles.reclaimBanner}>
                <span>
                  ✓ {reclaimResult.closedAccountsCount} contas fechadas (+
                  {reclaimResult.netUserSol.toFixed(5)} SOL recebidos)
                </span>
                <a
                  href={getExplorerUrl("tx", reclaimResult.signature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#14f195", fontSize: "0.8rem", textDecoration: "underline" }}
                >
                  Ver TX no Solscan ↗
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
                ? statusStep || "Recuperando SOL..."
                : emptyAccounts.length > 0
                  ? `⚡ Recuperar Meu SOL Agora (+${estimatedNetReclaimSol.toFixed(4)} SOL Líquido)`
                  : "Nenhuma Conta Vazia Encontrada na Carteira Conectada"}
            </Button>
          </div>
        </div>

        <div className={styles.sidebar}>
          <CostSummary operation="burnToken" />

          <h3 className={styles.sidebarTitle}>How Token & LP Burning Works</h3>
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
                <p className={styles.tutorialTitle}>Want to Withdraw SOL Liquidity?</p>
                <p className={styles.tutorialDescription}>
                  If you want to recover your deposited SOL liquidity before burning LP tokens, use
                  the{" "}
                  <Link href="/add-liquidity?mode=withdraw">
                    <strong>Withdraw Liquidity in SOL (0.05 SOL)</strong>
                  </Link>{" "}
                  tool.
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
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading Token Burner...</div>}>
      <BurnPageContent />
    </Suspense>
  );
}
