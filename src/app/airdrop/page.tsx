"use client";

import React, { Suspense, useState, useEffect, useMemo, useRef } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { useAirdrop } from "@/hooks/useAirdrop";
import { useUserTokens } from "@/hooks/useUserTokens";
import { useCluster } from "@/context/WalletContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DEV_WALLET_ADDRESS,
  SERVICE_FEE_AIRDROP_SOL,
  SERVICE_FEE_SNAPSHOT_HOLDERS_SOL,
} from "@/lib/constants";
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

const KNOWN_DEX_POOL_OWNERS = new Set([
  "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1", // Raydium V4 Authority
  "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C", // Raydium CPMM
  "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB", // Meteora DAMM
]);

const TokenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></svg>
);
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

const TUTORIAL_ICONS = [<TokenIcon key="t" />, <UsersIcon key="u" />, <CheckIcon key="c" />];

function AirdropPageInner() {
  const { connection } = useConnection();
  const { cluster, setCluster } = useCluster();
  const { t, locale } = useLanguage();
  const isPt = locale === "pt" || locale === "pt-BR";

  const [selectedTokenMint, setSelectedTokenMint] = useState("");
  const [recipientsText, setRecipientsText] = useState("");
  const [uniformAmount, setUniformAmount] = useState("1000");
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Phase 6.1: On-Chain Holders Snapshot state
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [snapshotMint, setSnapshotMint] = useState("");
  const [snapshotLimit, setSnapshotLimit] = useState<number>(100);
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [snapshotUsed, setSnapshotUsed] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  const { performAirdrop, isLoading, statusStep, progressStep, error, signature, reset } =
    useAirdrop();
  const { tokens: userTokens, isLoading: isLoadingUserTokens, refreshTokens } = useUserTokens();

  const selectedToken = useMemo(
    () => userTokens.find((tk) => tk.mint === selectedTokenMint) || null,
    [userTokens, selectedTokenMint]
  );

  const handleRunHoldersSnapshot = async () => {
    if (!connection || !snapshotMint.trim()) return;
    setIsSnapshotting(true);
    setSnapshotError(null);

    try {
      const targetMint = new PublicKey(snapshotMint.trim());
      const largest = await connection.getTokenLargestAccounts(targetMint, "confirmed");
      const nonZero = largest.value.filter((item) => Number(item.uiAmount || 0) > 0);

      const resolvedOwners: string[] = [];
      const amtPerHolder = parseFloat(uniformAmount) || 1000;

      for (const acc of nonZero.slice(0, snapshotLimit)) {
        try {
          const parsedInfo = await connection.getParsedAccountInfo(acc.address, "confirmed");
          const data = parsedInfo.value?.data;
          if (data && "parsed" in data) {
            const ownerAddr: string | undefined = data.parsed?.info?.owner;
            if (
              ownerAddr &&
              !KNOWN_DEX_POOL_OWNERS.has(ownerAddr) &&
              !resolvedOwners.includes(ownerAddr)
            ) {
              resolvedOwners.push(ownerAddr);
            }
          }
        } catch {
          // Skip unresolvable token account
        }
      }

      if (resolvedOwners.length === 0) {
        throw new Error(
          isPt
            ? "Nenhum holder elegível encontrado para este Mint nesta rede."
            : "No eligible holders found for this Mint on the active network."
        );
      }

      const lines = resolvedOwners.map((addr) => `${addr},${amtPerHolder}`);
      setRecipientsText(lines.join("\n"));
      setSnapshotUsed(true);
    } catch (err) {
      setSnapshotError(
        err instanceof Error ? err.message : "Failed to snapshot token holders."
      );
    } finally {
      setIsSnapshotting(false);
    }
  };

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
          error: "Invalid format (Address,Amount).",
        });
        return;
      }

      try {
        new PublicKey(address);
      } catch {
        lineError = "Invalid Base58 address.";
      }

      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        lineError = lineError ? `${lineError} Invalid amount.` : "Invalid amount.";
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
    setSnapshotUsed(false);
    reset();
  };

  const BATCH_SIZE = 10;
  const numBatches =
    parsedResult && parsedResult.valid ? Math.ceil(parsedResult.valid.length / BATCH_SIZE) : 0;
  const snapshotAddonSol = snapshotUsed ? SERVICE_FEE_SNAPSHOT_HOLDERS_SOL : 0;
  const totalFee = (numBatches * SERVICE_FEE_AIRDROP_SOL + snapshotAddonSol).toFixed(2);
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
          message={`✓ Airdrop (${cluster}): ${parsedResult?.totalAmount.toLocaleString() || ""} ${selectedToken?.symbol || "tokens"} → ${parsedResult?.valid.length || 0} wallets.`}
          txId={signature}
          onClose={clearAll}
        />
        <Button onClick={clearAll} className="w-full" style={{ maxWidth: "400px", marginTop: "1rem" }}>
          {t.airdropPage.launchAnotherBtn}
        </Button>
      </div>
    );
  }

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
            {t.airdropPage.feeBadgeLabel}{" "}
            <strong>{SERVICE_FEE_AIRDROP_SOL.toFixed(2)} SOL</strong>
          </span>
        </div>

        <h1>{t.airdropPage.pageTitle}</h1>
        <p>{t.airdropPage.pageDesc}</p>
      </header>

      <div className={styles.grid}>
        <div className={styles.formContainer}>
          <Card>
            <CardHeader>
              <CardTitle>
                {t.airdropPage.cardTitle} ({cluster})
              </CardTitle>
              <CardDescription>
                {t.airdropPage.cardDescPrefix}{" "}
                <strong>{SERVICE_FEE_AIRDROP_SOL.toFixed(2)} SOL</strong> (
                <code>
                  {devWalletBase58.slice(0, 6)}...{devWalletBase58.slice(-4)}
                </code>
                ).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.form}>
                {error && <Notification type="error" message={error} onClose={reset} />}

                <TransactionStatusStepper
                  isActive={isLoading}
                  currentStepIndex={progressStep}
                  statusMessage={statusStep || signature}
                  operationTitle={`${t.airdropPage.processingAirdropStatus} (${numBatches} batches · ${cluster})`}
                />

                <div className={styles.field}>
                  <div className={styles.toolbarRow}>
                    <Label htmlFor="token-select">{t.airdropPage.step1SelectLabel}</Label>
                    {selectedToken && (
                      <span className={styles.fieldDescription}>
                        {t.common.availableBalance}{" "}
                        <strong>{walletTokenBalance.toLocaleString()}</strong>{" "}
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

                {/* Phase 6.1: Automatic On-Chain Holders Snapshot Extractor */}
                <div className={styles.field}>
                  <div className={styles.toolbarRow}>
                    <button
                      type="button"
                      onClick={() => setSnapshotOpen((prev) => !prev)}
                      className={styles.toolChipBtn}
                      style={{
                        borderColor: "rgba(20, 241, 149, 0.45)",
                        color: "#14f195",
                        fontWeight: 700,
                      }}
                    >
                      📸{" "}
                      {isPt
                        ? `Importar Holders de Qualquer Token (Snapshot On-Chain · +${SERVICE_FEE_SNAPSHOT_HOLDERS_SOL.toFixed(2)} SOL)`
                        : `Import Holders from Any Token (On-Chain Snapshot · +${SERVICE_FEE_SNAPSHOT_HOLDERS_SOL.toFixed(2)} SOL)`}
                    </button>
                  </div>

                  {snapshotOpen && (
                    <div
                      style={{
                        padding: "0.95rem",
                        borderRadius: "0.75rem",
                        border: "1px solid rgba(20, 241, 149, 0.35)",
                        background: "rgba(20, 241, 149, 0.06)",
                        marginTop: "0.5rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                        <div style={{ flex: 1, minWidth: "240px" }}>
                          <Label htmlFor="snapshotMintInput">
                            {isPt ? "Mint Address do Token Alvo" : "Target Token Mint Address"}
                          </Label>
                          <Input
                            id="snapshotMintInput"
                            placeholder="Ex: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
                            value={snapshotMint}
                            onChange={(e) => setSnapshotMint(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>{isPt ? "Limite de Top Carteiras" : "Max Top Holders"}</Label>
                          <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.35rem" }}>
                            {[100, 500].map((lim) => (
                              <button
                                key={lim}
                                type="button"
                                onClick={() => setSnapshotLimit(lim)}
                                className={styles.toolChipBtn}
                                style={{
                                  background:
                                    snapshotLimit === lim ? "rgba(20, 241, 149, 0.2)" : undefined,
                                  color: snapshotLimit === lim ? "#14f195" : undefined,
                                }}
                              >
                                Top {lim}
                              </button>
                            ))}
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={handleRunHoldersSnapshot}
                          disabled={isSnapshotting || !snapshotMint.trim()}
                        >
                          {isSnapshotting
                            ? isPt
                              ? "Extraindo Holders..."
                              : "Snapshotting..."
                            : isPt
                              ? "⚡ Extrair Snapshot On-Chain"
                              : "⚡ Extract On-Chain Snapshot"}
                        </Button>
                      </div>
                      {snapshotError && (
                        <p style={{ color: "#fca5a5", fontSize: "0.8rem" }}>{snapshotError}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.field}>
                  <div className={styles.toolbarRow}>
                    <Label htmlFor="recipients">{t.airdropPage.step2RecipientsLabel}</Label>
                    <div className={styles.quickToolsGroup}>
                      <button
                        type="button"
                        onClick={handleLoadSample}
                        disabled={isLoading}
                        className={styles.toolChipBtn}
                      >
                        {t.airdropPage.loadSampleBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className={styles.toolChipBtn}
                      >
                        {t.airdropPage.importCsvBtn}
                      </button>
                      {recipientsText && (
                        <button
                          type="button"
                          onClick={() => {
                            setRecipientsText("");
                            setSnapshotUsed(false);
                          }}
                          disabled={isLoading}
                          className={styles.toolChipBtn}
                        >
                          {t.airdropPage.clearListBtn}
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

                  <div className={styles.uniformBar}>
                    <span>{t.airdropPage.uniformLabel}</span>
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
                      {t.airdropPage.applyAllBtn}
                    </button>
                  </div>

                  <textarea
                    id="recipients"
                    placeholder={t.airdropPage.textareaPlaceholder}
                    value={recipientsText}
                    onChange={(e) => setRecipientsText(e.target.value)}
                    className={styles.textarea}
                    rows={8}
                    disabled={isLoading}
                  />
                  <p className={styles.fieldDescription}>{t.airdropPage.textareaHint}</p>
                </div>

                {parsedResult && (
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryTitle}>
                      <span>{t.airdropPage.summaryTitle}</span>
                      <span>
                        {parsedResult.invalid.length === 0 && parsedResult.valid.length > 0
                          ? t.airdropPage.readyToBroadcast
                          : t.airdropPage.reviewRequired}
                      </span>
                    </div>

                    {parsedResult.invalid.length > 0 && (
                      <div className={styles.errorList}>
                        <ul>
                          {parsedResult.invalid.slice(0, 5).map((item) => (
                            <li key={item.line}>
                              #{item.line}: {item.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className={styles.summaryMetricsGrid}>
                      <div className={styles.summaryMetricBox}>
                        <span>{t.airdropPage.validWalletsLabel}</span>
                        <strong className={styles.textEmerald}>{parsedResult.valid.length}</strong>
                      </div>
                      <div className={styles.summaryMetricBox}>
                        <span>{t.airdropPage.totalTokensLabel}</span>
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
                        <span>{t.airdropPage.atomicBatchesLabel}</span>
                        <strong>{numBatches}</strong>
                      </div>
                      <div className={styles.summaryMetricBox}>
                        <span>{t.airdropPage.totalServiceFeeLabel}</span>
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
                {t.airdropPage.validateBtn}
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={isSubmitDisabled}>
                {isLoading
                  ? statusStep || signature || t.airdropPage.processingAirdropStatus
                  : `${t.airdropPage.sendAirdropBtn} (${totalFee} SOL)`}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <aside className={styles.sidebar}>
          <CostSummary operation="airdrop" />

          <h3 className={styles.sidebarTitle}>{t.airdropPage.sidebarTitle}</h3>
          {t.airdropPage.tutorialSteps.map((step, index) => (
            <Card key={index} className={styles.tutorialCard}>
              <CardContent className={styles.tutorialCardContent}>
                <div className={styles.tutorialIcon}>{TUTORIAL_ICONS[index]}</div>
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
