"use client";

import { useState, useEffect, useMemo } from "react";
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
import { DEV_WALLET_ADDRESS, SERVICE_FEE_BURN_TOKEN_SOL } from "@/lib/constants";

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
    title: "1. Select Standard or LP Token",
    description:
      "Choose any SPL, Token-2022, or LP token from your connected wallet. Burning LP tokens permanently locks pool liquidity.",
  },
  {
    icon: <FlameIcon />,
    title: "2. Preview Impact & Confirm",
    description: `Use quick percentage presets (25% – 100% MAX) to preview remaining supply. Standardized ${SERVICE_FEE_BURN_TOKEN_SOL.toFixed(2)} SOL fee routed atomically to Dev Wallet (${devWalletBase58.slice(0, 6)}...${devWalletBase58.slice(-4)}).`,
  },
];

type NotificationState = {
  type: "success" | "error";
  message: string;
  txId?: string | null;
} | null;

interface LastBurnReceipt {
  symbol: string;
  mint: string;
  burnedAmount: number;
  remainingBalance: number;
  signature: string;
}

export default function BurnPage() {
  const { cluster, setCluster, getExplorerUrl } = useCluster();
  const [selectedTokenMint, setSelectedTokenMint] = useState("");
  const [amount, setAmount] = useState("");
  const [notification, setNotification] = useState<NotificationState>(null);
  const [lastBurnReceipt, setLastBurnReceipt] = useState<LastBurnReceipt | null>(null);
  const { burnToken, isLoading, statusStep, progressStep, error, reset } = useBurnToken();
  const { tokens: userTokens, isLoading: isLoadingUserTokens, refreshTokens } = useUserTokens();

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
        setLastBurnReceipt({
          symbol: selectedToken.symbol || "TOKEN",
          mint: selectedToken.mint,
          burnedAmount: numericAmount,
          remainingBalance,
          signature,
        });
        setNotification({
          type: "success",
          message: `Success! ${numericAmount.toLocaleString()} ${selectedToken.symbol || "tokens"} permanently burned on ${cluster}.`,
          txId: signature,
        });
        setAmount("");
        refreshTokens();
      }
    }
  };

  const handleCloseNotification = () => {
    setNotification(null);
    reset();
  };

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

        <h1 className={styles.pageTitle}>On-Chain Token & LP Burner</h1>
        <p className={styles.pageDescription}>
          Permanently destroy SPL, Token-2022, or LP tokens from circulation on Solana ({cluster})
          using verifiable <code>burnChecked</code> instructions.
        </p>
      </header>

      <div className={styles.grid}>
        <div className={styles.formContainer}>
          <Card>
            <CardHeader>
              <CardTitle>Configure Deflationary Token Burn ({cluster})</CardTitle>
              <CardDescription>
                Select a token or LP token from your wallet and choose the exact amount to destroy.
                Service Fee: <strong>{SERVICE_FEE_BURN_TOKEN_SOL.toFixed(2)} SOL</strong> routed to
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
                  isActive={isLoading}
                  currentStepIndex={progressStep}
                  statusMessage={statusStep}
                  operationTitle={`Burning ${selectedToken?.symbol || "Tokens"} on ${cluster}`}
                />

                <div className={styles.field}>
                  <Label htmlFor="token-select">1. Select Token or LP Token from Wallet</Label>
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
                  />
                </div>

                {selectedToken && (
                  <>
                    <div className={styles.field}>
                      <div className={styles.amountHeader}>
                        <Label htmlFor="amount">
                          2. Amount of {selectedToken.symbol} to Burn
                        </Label>
                        <div className={styles.presetRow}>
                          <span className={styles.balance}>
                            Balance: {walletBalance.toLocaleString()} {selectedToken.symbol}
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

                    {/* Live Deflationary Burn Impact Simulator */}
                    <div className={styles.impactCard}>
                      <div className={styles.impactHeader}>
                        <strong>🔥 Live Deflationary Burn Impact Preview</strong>
                        <span className={styles.irreversibleBadge}>IRREVERSIBLE ON-CHAIN</span>
                      </div>
                      <div className={styles.impactGrid}>
                        <div className={styles.impactMetric}>
                          <span>Current Wallet Balance</span>
                          <strong>
                            {walletBalance.toLocaleString()} {selectedToken.symbol}
                          </strong>
                        </div>
                        <div className={styles.impactMetric}>
                          <span>Amount to Destroy</span>
                          <strong className={styles.textRose}>
                            -{numericAmount.toLocaleString()} {selectedToken.symbol}
                          </strong>
                        </div>
                        <div className={styles.impactMetric}>
                          <span>Remaining Balance</span>
                          <strong className={styles.textEmerald}>
                            {remainingBalance.toLocaleString()} {selectedToken.symbol}
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

                {lastBurnReceipt && (
                  <div className={styles.burnReceiptBox}>
                    <strong>✓ Verified On-Chain Burn Certificate</strong>
                    <div className={styles.burnReceiptRow}>
                      <span>Tokens Permanently Destroyed:</span>
                      <strong className={styles.textRose}>
                        {lastBurnReceipt.burnedAmount.toLocaleString()} {lastBurnReceipt.symbol}
                      </strong>
                    </div>
                    <div className={styles.burnReceiptRow}>
                      <span>Remaining Wallet Balance:</span>
                      <strong className={styles.textEmerald}>
                        {lastBurnReceipt.remainingBalance.toLocaleString()} {lastBurnReceipt.symbol}
                      </strong>
                    </div>
                    <div className={styles.burnReceiptRow}>
                      <span>Transaction Signature:</span>
                      <a
                        href={getExplorerUrl("tx", lastBurnReceipt.signature)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <code>
                          {lastBurnReceipt.signature.slice(0, 10)}...
                          {lastBurnReceipt.signature.slice(-8)} ↗
                        </code>
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    !selectedToken ||
                    numericAmount <= 0 ||
                    numericAmount > walletBalance
                  }
                  className="w-full"
                >
                  {isLoading
                    ? statusStep || "Executing On-Chain Burn..."
                    : `🔥 Burn ${numericAmount > 0 ? numericAmount.toLocaleString() : ""} ${selectedToken?.symbol || "Tokens"} (Fee: ${SERVICE_FEE_BURN_TOKEN_SOL.toFixed(2)} SOL)`}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        <div className={styles.sidebar}>
          <CostSummary />

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
                <p className={styles.tutorialTitle}>Want to Withdraw SOL Instead?</p>
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
