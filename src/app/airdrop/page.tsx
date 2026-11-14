"use client";

import React, { Suspense,  useState, useEffect, useMemo, useRef } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAirdrop } from "@/hooks/useAirdrop";
import { useUserTokens } from "@/hooks/useUserTokens";
import { useCluster } from "@/context/WalletContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { TokenSelector } from "@/components/TokenSelector";
import Notification from "@/components/ui/Notification";
import TransactionStatusStepper from "@/components/TransactionStatusStepper";
import CostSummary from "@/components/CostSummary";
import { DEV_WALLET_ADDRESS, SERVICE_FEE_AIRDROP_SOL } from "@/lib/constants";
import styles from "./Airdrop.module.css";

const devWalletBase58 = DEV_WALLET_ADDRESS.toBase58();

interface Recipient {
  address: string;
  amount: number;
  lineNumber: number;
}

interface ParsedResult {
  valid: Recipient[];
  invalid: { line: number; value: string; error: string }[];
  totalAmount: number;
}

const SAMPLE_RECIPIENTS_CSV = [
  "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU,1500",
  "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin,2500",
  "GThUX1Atko4tqhN2NaiTazWSeFWMuiUvfFnyJyUghFMJ,1000",
  "4hSVN9aKqM1nXz8R5v2L9pW3xY7cE2fB6dN4mQ8jE3FE,5000",
].join("\n");

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

const UsersIcon = () => (
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CheckIcon = () => (
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
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const tutorialSteps = [
  {
    icon: <TokenIcon />,
    title: "1. Select Token from Wallet",
    description:
      "Choose any SPL or Token-2022 asset from your connected wallet to distribute to your community.",
  },
  {
    icon: <UsersIcon />,
    title: "2. Import CSV or Paste Wallets",
    description:
      "Paste Address,Amount pairs, upload a .CSV/.TXT file, or apply a uniform token amount across all addresses.",
  },
  {
    icon: <CheckIcon />,
    title: "3. Automatic ATA Creation & Batching",
    description: `Automatically creates missing Associated Token Accounts (ATAs) and batches up to 10 recipients per transaction (${SERVICE_FEE_AIRDROP_SOL.toFixed(2)} SOL fee per batch routed to Dev Wallet).`,
  },
];

function AirdropPageInner() {
  const { cluster, setCluster } = useCluster();
  const [selectedTokenMint, setSelectedTokenMint] = useState("");
  const [recipientsText, setRecipientsText] = useState("");
  const [uniformAmount, setUniformAmount] = useState("1000");
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { performAirdrop, isLoading, statusStep, progressStep, error, signature, reset } =
    useAirdrop();
  const { tokens: userTokens, isLoading: isLoadingUserTokens, refreshTokens } = useUserTokens();

  const selectedToken = useMemo(
    () => userTokens.find((t) => t.mint === selectedTokenMint) || null,
    [userTokens, selectedTokenMint]
  );

  const parseRecipients = (text: string): ParsedResult => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const result: ParsedResult = { valid: [], invalid: [], totalAmount: 0 };
    let totalAmount = 0;

    lines.forEach((line, idx) => {
      const lineNumber = idx + 1;
      const parts = line.split(/[\s,;]+/).filter(Boolean);
      const address = parts[0];
      const amountStr = parts[1];
      let lineError = "";

      if (!address || !amountStr) {
        result.invalid.push({
          line: lineNumber,
          value: line,
          error: "Incomplete pair of wallet address and token amount.",
        });
        return;
      }

      try {
        new PublicKey(address);
      } catch {
        lineError = "Invalid Solana base58 address.";
      }

      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        lineError = lineError ? `${lineError} Invalid token amount.` : "Invalid token amount.";
      }

      if (lineError) {
        result.invalid.push({ line: lineNumber, value: line, error: lineError });
      } else {
        result.valid.push({ address, amount, lineNumber });
        totalAmount += amount;
      }
    });

    result.totalAmount = totalAmount;
    return result;
  };

  // Auto-parse live whenever text changes so user gets immediate feedback
  useEffect(() => {
    if (!recipientsText.trim()) {
      setParsedResult(null);
      return;
    }
    setParsedResult(parseRecipients(recipientsText));
  }, [recipientsText]);

  const handleLoadSample = () => {
    setRecipientsText(SAMPLE_RECIPIENTS_CSV);
  };

  const handleApplyUniformAmount = () => {
    const amt = parseFloat(uniformAmount);
    if (isNaN(amt) || amt <= 0 || !recipientsText.trim()) return;
    const updatedLines = recipientsText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const firstToken = line.split(/[\s,;]+/)[0];
        return `${firstToken},${amt}`;
      });
    setRecipientsText(updatedLines.join("\n"));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setRecipientsText(reader.result.trim());
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleParseAndValidate = () => {
    setParsedResult(parseRecipients(recipientsText));
  };

  const handleSubmit = async () => {
    if (!parsedResult || parsedResult.valid.length === 0 || !selectedToken) return;
    const sig = await performAirdrop(
      selectedToken.mint,
      parsedResult.valid,
      selectedToken.programId
    );
    if (sig) {
      refreshTokens();
    }
  };

  const clearAll = () => {
    setSelectedTokenMint("");
    setRecipientsText("");
    setParsedResult(null);
    reset();
  };

  const BATCH_SIZE = 10;
  const numBatches =
    parsedResult && parsedResult.valid ? Math.ceil(parsedResult.valid.length / BATCH_SIZE) : 0;
  const totalFee = (numBatches * SERVICE_FEE_AIRDROP_SOL).toFixed(2);
  const walletTokenBalance = selectedToken ? parseFloat(selectedToken.amount) || 0 : 0;
  const hasEnoughTokenBalance =
    !selectedToken || !parsedResult || parsedResult.totalAmount <= walletTokenBalance;

  const isSubmitDisabled =
    isLoading ||
    !parsedResult ||
    parsedResult.invalid.length > 0 ||
    parsedResult.valid.length === 0 ||
    !selectedToken ||
    !hasEnoughTokenBalance;

  if (signature && !isLoading && !error) {
    return (
      <div className={styles.centeredContainer}>
        <Notification
          type="success"
          message={`Airdrop completed on ${cluster}! Distributed ${parsedResult?.totalAmount.toLocaleString() || ""} ${selectedToken?.symbol || "tokens"} across ${parsedResult?.valid.length || 0} wallets (${numBatches} batch${numBatches === 1 ? "" : "es"}).`}
          txId={signature}
          onClose={clearAll}
        />
        <Button onClick={clearAll} className="w-full" style={{ maxWidth: "400px", marginTop: "1rem" }}>
          📦 Launch Another Airdrop
        </Button>
      </div>
    );
  }

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
            Standardized Batch Fee:{" "}
            <strong>{SERVICE_FEE_AIRDROP_SOL.toFixed(2)} SOL / Batch</strong>
          </span>
        </div>

        <h1>Mass Token Airdrop & Multi-Sender</h1>
        <p>
          Distribute SPL or Token-2022 tokens to multiple Solana wallets in batched atomic
          transactions on {cluster}. Automatically initializes recipient ATAs when needed.
        </p>
      </header>

      <div className={styles.grid}>
        <div className={styles.formContainer}>
          <Card>
            <CardHeader>
              <CardTitle>Configure Multi-Send Airdrop ({cluster})</CardTitle>
              <CardDescription>
                Select your token, import or paste recipient addresses, and validate balances before
                broadcasting. Service Fee: <strong>{SERVICE_FEE_AIRDROP_SOL.toFixed(2)} SOL</strong>{" "}
                per batch routed to Dev Wallet{" "}
                <code>
                  {devWalletBase58.slice(0, 6)}...{devWalletBase58.slice(-4)}
                </code>
                .
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.form}>
                {error && <Notification type="error" message={error} onClose={reset} />}

                <TransactionStatusStepper
                  isActive={isLoading}
                  currentStepIndex={progressStep}
                  statusMessage={statusStep || signature}
                  operationTitle={`Broadcasting ${numBatches} Airdrop Batch(es) on ${cluster}`}
                />

                <div className={styles.field}>
                  <div className={styles.toolbarRow}>
                    <Label htmlFor="token-select">1. Select Token to Distribute</Label>
                    {selectedToken && (
                      <span className={styles.fieldDescription}>
                        Available Balance: <strong>{walletTokenBalance.toLocaleString()}</strong>{" "}
                        {selectedToken.symbol}
                      </span>
                    )}
                  </div>
                  <TokenSelector
                    tokens={userTokens}
                    selectedTokenMint={selectedTokenMint}
                    onSelectToken={setSelectedTokenMint}
                    isLoading={isLoadingUserTokens}
                    disabled={isLoading}
                  />
                </div>

                <div className={styles.field}>
                  <div className={styles.toolbarRow}>
                    <Label htmlFor="recipients">2. Recipient Wallet List (Address,Amount)</Label>
                    <div className={styles.quickToolsGroup}>
                      <button
                        type="button"
                        onClick={handleLoadSample}
                        disabled={isLoading}
                        className={styles.toolChipBtn}
                      >
                        📄 Load Sample List
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className={styles.toolChipBtn}
                      >
                        📁 Import CSV / TXT
                      </button>
                      {recipientsText && (
                        <button
                          type="button"
                          onClick={() => setRecipientsText("")}
                          disabled={isLoading}
                          className={styles.toolChipBtn}
                        >
                          ✕ Clear List
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                        style={{ display: "none" }}
                      />
                    </div>
                  </div>

                  {/* Uniform Amount Quick-Fill Helper */}
                  <div className={styles.uniformBar}>
                    <span>⚡ Set Uniform Amount for All Wallets:</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={uniformAmount}
                      onChange={(e) => setUniformAmount(e.target.value)}
                      className={styles.uniformInput}
                      placeholder="1000"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={handleApplyUniformAmount}
                      disabled={isLoading || !recipientsText.trim()}
                      className={styles.toolChipBtn}
                    >
                      Apply to All Lines
                    </button>
                  </div>

                  <textarea
                    id="recipients"
                    placeholder={
                      "One recipient per line: WalletAddress,TokenAmount\nExample:\n7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU,1500\n9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin,2500"
                    }
                    value={recipientsText}
                    onChange={(e) => setRecipientsText(e.target.value)}
                    className={styles.textarea}
                    rows={8}
                    disabled={isLoading}
                  />
                  <p className={styles.fieldDescription}>
                    Separate each wallet address and token amount with a comma, space, or semicolon.
                  </p>
                </div>

                {parsedResult && (
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryTitle}>
                      <span>📊 Live Airdrop Validation & Cost Summary</span>
                      <span>
                        {parsedResult.invalid.length === 0 && parsedResult.valid.length > 0
                          ? "✓ Ready to Broadcast"
                          : "⚠️ Review Required"}
                      </span>
                    </div>

                    {parsedResult.invalid.length > 0 && (
                      <div className={styles.errorList}>
                        <p>
                          <strong>{parsedResult.invalid.length} formatting issue(s) found:</strong>
                        </p>
                        <ul>
                          {parsedResult.invalid.slice(0, 5).map((item) => (
                            <li key={item.line}>
                              Line {item.line}: {item.error}
                            </li>
                          ))}
                          {parsedResult.invalid.length > 5 && (
                            <li>... and {parsedResult.invalid.length - 5} more errors.</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {!hasEnoughTokenBalance && (
                      <div className={styles.errorList}>
                        <p>
                          <strong>Insufficient {selectedToken?.symbol} Balance:</strong> This list
                          requires {parsedResult.totalAmount.toLocaleString()}{" "}
                          {selectedToken?.symbol}, but your wallet holds{" "}
                          {walletTokenBalance.toLocaleString()} {selectedToken?.symbol}.
                        </p>
                      </div>
                    )}

                    <div className={styles.summaryMetricsGrid}>
                      <div className={styles.summaryMetricBox}>
                        <span>Valid Wallets</span>
                        <strong className={styles.textEmerald}>{parsedResult.valid.length}</strong>
                      </div>
                      <div className={styles.summaryMetricBox}>
                        <span>Total Tokens to Send</span>
                        <strong
                          className={
                            hasEnoughTokenBalance ? styles.textEmerald : styles.textRose
                          }
                        >
                          {parsedResult.totalAmount.toLocaleString()}{" "}
                          {selectedToken?.symbol || "TOKENS"}
                        </strong>
                      </div>
                      <div className={styles.summaryMetricBox}>
                        <span>Atomic Tx Batches</span>
                        <strong>{numBatches} Batch(es)</strong>
                      </div>
                      <div className={styles.summaryMetricBox}>
                        <span>Total Service Fee</span>
                        <strong>{totalFee} SOL</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className={styles.footerActions}>
              <Button
                type="button"
                onClick={handleParseAndValidate}
                disabled={isLoading || !recipientsText.trim()}
                className="secondary"
              >
                ✓ Validate Recipient List
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={isSubmitDisabled}>
                {isLoading
                  ? statusStep || signature || "Processing Airdrop..."
                  : `📦 Send Airdrop (${totalFee} SOL Fee)`}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <aside className={styles.sidebar}>
          <CostSummary operation="airdrop" />

          <h3 className={styles.sidebarTitle}>How Multi-Send Works</h3>
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
        </aside>
      </div>
    </div>
  );
}

export default function AirdropPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
      <AirdropPageInner />
    </Suspense>
  );
}
