"use client";

import { useState, useEffect, useCallback, useMemo, type FormEvent } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCluster } from "@/context/WalletContext";
import { useLanguage } from "@/context/LanguageContext";
import { isValidPublicKey } from "@/lib/security";
import {
  DEFAULT_CREATE_TOKEN_FEE_SOL,
  PRICING_SOL,
  computeRateSplitPercent,
  computeSplit,
  formatSolAmount,
} from "@/config/pricing";
import styles from "./Affiliates.module.css";

const IconTrendingUp = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconUsers = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
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

const IconWallet = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const IconRefresh = ({ spinning }: { spinning?: boolean }) => (
  <svg
    aria-hidden="true"
    className={spinning ? styles.spinIcon : undefined}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

const IconCopy = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const IconCheck = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconShieldCheck = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const IconPercent = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

const IconXBrand = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconTelegram = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

interface AffiliateTransaction {
  signature: string;
  blockTime: number;
  amount: number;
}

interface AffiliateEarnings {
  totalEarningsSol: number;
  referralCount: number;
  transactions: AffiliateTransaction[];
}

type DestinationKey = "home" | "reclaim" | "addLiquidity" | "burn" | "airdrop" | "vesting";

const DESTINATION_OPTIONS: ReadonlyArray<{ key: DestinationKey; path: string }> = [
  { key: "home", path: "/" },
  { key: "reclaim", path: "/reclaim" },
  { key: "addLiquidity", path: "/add-liquidity" },
  { key: "burn", path: "/burn" },
  { key: "airdrop", path: "/airdrop" },
  { key: "vesting", path: "/vesting" },
];

function shortenAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function AffiliatesContent() {
  const { connected, publicKey } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const { getExplorerUrl } = useCluster();
  const { t, locale } = useLanguage();

  const [origin, setOrigin] = useState("https://www.createtokensol.store");
  const [selectedDest, setSelectedDest] = useState<DestinationKey>("home");
  const [manualInput, setManualInput] = useState("");
  const [manualWallet, setManualWallet] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [earnings, setEarnings] = useState<AffiliateEarnings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referralsPerMonth, setReferralsPerMonth] = useState(10);

  const connectedWallet = connected && publicKey ? publicKey.toBase58() : null;
  const activeWallet = connectedWallet ?? manualWallet;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Clear manual wallet error when connected wallet takes precedence
  useEffect(() => {
    if (connectedWallet) {
      setManualError(null);
    }
  }, [connectedWallet]);

  const affiliateLink = useMemo(() => {
    if (!activeWallet) return "";
    const dest = DESTINATION_OPTIONS.find((item) => item.key === selectedDest) ?? DESTINATION_OPTIONS[0];
    return `${origin}${dest.path}?ref=${activeWallet}`;
  }, [activeWallet, origin, selectedDest]);

  const fetchEarnings = useCallback(async (walletAddress: string, signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/affiliate-earnings?wallet=${encodeURIComponent(walletAddress)}`,
        { signal }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch earnings.");
      }
      const data: AffiliateEarnings = await response.json();
      if (!signal?.aborted) {
        setEarnings(data);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      if (!signal?.aborted) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  // Automatically reset and load earnings whenever the active wallet changes
  useEffect(() => {
    setEarnings(null);
    setError(null);
    setCopyStatus("idle");

    if (!activeWallet) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    fetchEarnings(activeWallet, controller.signal);

    return () => {
      controller.abort();
    };
  }, [activeWallet, fetchEarnings]);

  const handleManualWalletSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleaned = manualInput.trim();
    if (!isValidPublicKey(cleaned)) {
      setManualError(t.affiliatesPage.manualWalletInvalid);
      return;
    }
    setManualError(null);
    setManualWallet(cleaned);
  };

  const handleClearManualWallet = () => {
    setManualWallet(null);
    setManualInput("");
    setManualError(null);
  };

  const handleCopy = async () => {
    if (!affiliateLink) return;
    try {
      await navigator.clipboard.writeText(affiliateLink);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2500);
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = affiliateLink;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!ok) {
          throw new Error("Fallback copy failed");
        }
        setCopyStatus("copied");
        setTimeout(() => setCopyStatus("idle"), 2500);
      } catch {
        setCopyStatus("error");
        setTimeout(() => setCopyStatus("idle"), 3500);
      }
    }
  };

  const dateFormatter = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return new Intl.DateTimeFormat("en", {
        dateStyle: "short",
        timeStyle: "short",
      });
    }
  }, [locale]);

  const formatTxDate = useCallback(
    (blockTime: number) => {
      if (!blockTime) return "✓";
      return dateFormatter.format(new Date(blockTime * 1000));
    },
    [dateFormatter]
  );

  // Dynamic commission examples derived directly from src/config/pricing.ts
  const commissionExamples = useMemo(() => {
    const standardTokenSplit = computeSplit(DEFAULT_CREATE_TOKEN_FEE_SOL);
    const burnVestingSplit = computeSplit(PRICING_SOL.burnAndEarnLockLp);
    const poolAirdropSplit = computeSplit(PRICING_SOL.createLiquidityPool);
    const reclaimSplit = computeRateSplitPercent(PRICING_SOL.reclaimSolPlatformFeeRate);

    return {
      standardTokenAffiliateSol: standardTokenSplit.affiliateSol,
      rows: [
        {
          id: "standardToken",
          operation: t.affiliatesPage.exampleRows.standardToken,
          fee: `${formatSolAmount(DEFAULT_CREATE_TOKEN_FEE_SOL)} SOL`,
          share: `${formatSolAmount(standardTokenSplit.affiliateSol, 3, 4)} SOL`,
        },
        {
          id: "burnOrVesting",
          operation: t.affiliatesPage.exampleRows.burnOrVesting,
          fee: `${formatSolAmount(PRICING_SOL.burnAndEarnLockLp)} SOL`,
          share: `${formatSolAmount(burnVestingSplit.affiliateSol, 3, 4)} SOL`,
        },
        {
          id: "poolOrAirdrop",
          operation: t.affiliatesPage.exampleRows.poolOrAirdrop,
          fee: `${formatSolAmount(PRICING_SOL.createLiquidityPool)} SOL`,
          share: `${formatSolAmount(poolAirdropSplit.affiliateSol, 3, 4)} SOL`,
        },
        {
          id: "reclaimSol",
          operation: t.affiliatesPage.exampleRows.reclaimSol,
          fee: t.affiliatesPage.exampleRows.reclaimFeeDisplay.replace(
            "{rate}",
            String(reclaimSplit.totalRatePercent)
          ),
          share: t.affiliatesPage.exampleRows.reclaimShareDisplay.replace(
            "{rate}",
            String(reclaimSplit.affiliateRatePercent)
          ),
        },
      ],
    };
  }, [t.affiliatesPage.exampleRows]);

  const estimatedMonthlySol = useMemo(() => {
    return referralsPerMonth * commissionExamples.standardTokenAffiliateSol;
  }, [referralsPerMonth, commissionExamples.standardTokenAffiliateSol]);

  const shareText = t.affiliatesPage.shareMessageTemplate;
  const xShareUrl = affiliateLink
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(affiliateLink)}`
    : "#";
  const telegramShareUrl = affiliateLink
    ? `https://t.me/share/url?url=${encodeURIComponent(affiliateLink)}&text=${encodeURIComponent(shareText)}`
    : "#";

  return (
    <div className={styles.pageContainer}>
      {/* 1. Compact Hero */}
      <header className={styles.pageHeader}>
        <div className={styles.heroBadges} aria-label="Program highlights">
          {t.affiliatesPage.heroBadges.map((badge, idx) => (
            <span key={idx} className={styles.heroBadge}>
              {badge}
            </span>
          ))}
        </div>
        <h1 className={styles.pageTitle}>{t.affiliatesPage.pageTitle}</h1>
        <p className={styles.pageDescription}>{t.affiliatesPage.pageDesc}</p>
      </header>

      {/* 2. Primary Link Generator Card */}
      <section className={styles.primarySection} aria-labelledby="affiliate-link-heading">
        <Card className={styles.primaryCard}>
          <CardHeader>
            <div className={styles.cardHeaderRow}>
              <div>
                <CardTitle id="affiliate-link-heading">{t.affiliatesPage.linkCardTitle}</CardTitle>
                <CardDescription className={styles.cardSubtitle}>
                  {t.affiliatesPage.linkExplanation}
                </CardDescription>
              </div>
              {!connectedWallet && manualWallet && (
                <div className={styles.activeManualPill}>
                  <span className={styles.monoText}>
                    {t.affiliatesPage.manualWalletActiveLabel}: {shortenAddress(manualWallet)}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearManualWallet}
                    className={styles.changeWalletLink}
                  >
                    {t.affiliatesPage.changeWalletBtn}
                  </button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {activeWallet ? (
              <div className={styles.linkContainer}>
                {/* Deep Link Destination Selector */}
                <div className={styles.destinationBlock}>
                  <span className={styles.fieldLabel}>{t.affiliatesPage.destinationLabel}</span>
                  <div className={styles.destinationPills} role="group" aria-label={t.affiliatesPage.destinationLabel}>
                    {DESTINATION_OPTIONS.map((dest) => (
                      <button
                        key={dest.key}
                        type="button"
                        onClick={() => setSelectedDest(dest.key)}
                        className={`${styles.destPill} ${
                          selectedDest === dest.key ? styles.destPillActive : ""
                        }`}
                        aria-pressed={selectedDest === dest.key}
                      >
                        {t.affiliatesPage.destinations[dest.key]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flex Link Input + Copy Button */}
                <div className={styles.linkFlexRow}>
                  <Input
                    id="affiliate-link"
                    type="text"
                    value={affiliateLink}
                    readOnly
                    aria-label={t.affiliatesPage.linkCardTitle}
                    className={styles.linkInput}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <Button
                    type="button"
                    onClick={handleCopy}
                    className={styles.copyButton}
                  >
                    {copyStatus === "copied" ? <IconCheck /> : <IconCopy />}
                    <span>{copyStatus === "copied" ? t.common.copied : t.common.copy}</span>
                  </Button>
                </div>

                {copyStatus === "error" && (
                  <p className={styles.inlineError} role="alert">
                    {t.affiliatesPage.copyErrorText}
                  </p>
                )}

                {/* Direct Social Share Actions */}
                <div className={styles.shareRow}>
                  <a
                    href={xShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.shareButton}
                  >
                    <IconXBrand />
                    <span>{t.affiliatesPage.shareOnX}</span>
                  </a>
                  <a
                    href={telegramShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.shareButton}
                  >
                    <IconTelegram />
                    <span>{t.affiliatesPage.shareOnTelegram}</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className={styles.connectWalletPrompt}>
                <p className={styles.connectPromptText}>{t.affiliatesPage.connectPrompt}</p>
                <div className={styles.connectActions}>
                  <Button
                    type="button"
                    onClick={() => setWalletModalVisible(true)}
                    className={styles.connectCta}
                  >
                    <IconWallet />
                    <span>{t.affiliatesPage.connectWalletBtn}</span>
                  </Button>
                </div>

                <div className={styles.dividerRow} aria-hidden="true">
                  <span className={styles.dividerLine} />
                  <span className={styles.dividerText}>{t.affiliatesPage.orPasteWallet}</span>
                  <span className={styles.dividerLine} />
                </div>

                <form onSubmit={handleManualWalletSubmit} className={styles.manualWalletForm} noValidate>
                  <Input
                    id="manual-affiliate-wallet"
                    type="text"
                    value={manualInput}
                    onChange={(e) => {
                      setManualInput(e.target.value);
                      if (manualError) setManualError(null);
                    }}
                    placeholder={t.affiliatesPage.manualWalletPlaceholder}
                    aria-label={t.affiliatesPage.manualWalletPlaceholder}
                    className={styles.manualWalletInput}
                  />
                  <Button type="submit" className={styles.manualWalletBtn}>
                    {t.affiliatesPage.manualWalletSubmit}
                  </Button>
                </form>
                {manualError && (
                  <p className={styles.inlineError} role="alert">
                    {manualError}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 3. Automatic On-Chain Earnings Dashboard */}
      {activeWallet && (
        <section className={styles.dashboardSection} aria-labelledby="earnings-dashboard-heading">
          <Card>
            <CardHeader>
              <div className={styles.dashboardHeaderRow}>
                <div>
                  <CardTitle id="earnings-dashboard-heading">
                    {t.affiliatesPage.dashboardTitle}
                  </CardTitle>
                  <CardDescription>{t.affiliatesPage.dashboardDesc}</CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={() => fetchEarnings(activeWallet)}
                  disabled={isLoading}
                  className={styles.refreshButton}
                >
                  <IconRefresh spinning={isLoading} />
                  <span>{isLoading ? t.affiliatesPage.refreshingBtn : t.affiliatesPage.refreshBtn}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading && !earnings ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.spinner} aria-hidden="true" />
                  <p>{t.common.loading}</p>
                </div>
              ) : error ? (
                <p className={styles.errorText} role="alert">
                  {error}
                </p>
              ) : earnings ? (
                <div className={styles.earningsDashboard}>
                  <div className={styles.earningsGrid}>
                    <div className={styles.earningStat}>
                      <div className={styles.statHeader}>
                        <IconTrendingUp />
                        <span>{t.affiliatesPage.totalEarningsLabel}</span>
                      </div>
                      <p className={styles.statValue}>
                        {earnings.totalEarningsSol.toFixed(4)} SOL
                      </p>
                    </div>
                    <div className={styles.earningStat}>
                      <div className={styles.statHeader}>
                        <IconUsers />
                        <span>{t.affiliatesPage.verifiedReferralsLabel}</span>
                      </div>
                      <p className={styles.statValue}>{earnings.referralCount}</p>
                    </div>
                  </div>

                  <h3 className={styles.historyTitle}>{t.affiliatesPage.historyTitle}</h3>
                  {earnings.transactions.length > 0 ? (
                    <div className={styles.historyTable} role="table">
                      <div className={styles.historyTableHeader} role="row">
                        <div role="columnheader">{t.affiliatesPage.dateCol}</div>
                        <div role="columnheader" className={styles.amountHeader}>
                          {t.affiliatesPage.amountCol}
                        </div>
                        <div role="columnheader" className={styles.txHeader}>
                          {t.affiliatesPage.txCol}
                        </div>
                      </div>
                      {earnings.transactions.map((tx) => (
                        <div key={tx.signature} className={styles.historyRow} role="row">
                          <div className={styles.historyCell} role="cell">
                            <span className={styles.mobileColLabel}>{t.affiliatesPage.dateCol}</span>
                            <span className={styles.historyDate}>{formatTxDate(tx.blockTime)}</span>
                          </div>
                          <div className={`${styles.historyCell} ${styles.amountCell}`} role="cell">
                            <span className={styles.mobileColLabel}>{t.affiliatesPage.amountCol}</span>
                            <span className={styles.historyAmount}>
                              +{tx.amount.toFixed(4)} SOL
                            </span>
                          </div>
                          <div className={`${styles.historyCell} ${styles.txCell}`} role="cell">
                            <span className={styles.mobileColLabel}>{t.affiliatesPage.txCol}</span>
                            <a
                              href={getExplorerUrl("tx", tx.signature)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.historyLink}
                            >
                              {t.common.viewOnSolscan}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.noHistoryText}>{t.affiliatesPage.noHistoryText}</p>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      )}

      {/* 4. Horizontal "How It Works" Step Cards */}
      <section className={styles.sectionBlock} aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className={styles.sectionHeading}>
          {t.affiliatesPage.howItWorksTitle}
        </h2>
        <ol className={styles.stepsGrid}>
          {t.affiliatesPage.steps.map((step, idx) => (
            <li key={idx} className={styles.stepCard}>
              <span className={styles.stepBadge} aria-hidden="true">
                {idx + 1}
              </span>
              <h3 className={styles.stepCardTitle}>{step.title}</h3>
              <p className={styles.stepCardText}>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 5. Real SOL Commission Examples + Interactive Mini-Simulator */}
      <section className={styles.sectionBlock} aria-labelledby="earnings-examples-heading">
        <div className={styles.examplesLayout}>
          <Card className={styles.examplesCard}>
            <CardHeader>
              <CardTitle id="earnings-examples-heading" className={styles.iconCardTitle}>
                <IconPercent />
                <span>{t.affiliatesPage.earningsExamplesTitle}</span>
              </CardTitle>
              <CardDescription>{t.affiliatesPage.earningsExamplesDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.commissionTable} role="table">
                <div className={styles.commissionTableHeader} role="row">
                  <div role="columnheader">{t.affiliatesPage.operationCol}</div>
                  <div role="columnheader" className={styles.rightCol}>
                    {t.affiliatesPage.serviceFeeCol}
                  </div>
                  <div role="columnheader" className={styles.rightCol}>
                    {t.affiliatesPage.yourShareCol}
                  </div>
                </div>
                {commissionExamples.rows.map((row) => (
                  <div key={row.id} className={styles.commissionRow} role="row">
                    <div className={styles.commissionOp} role="cell">
                      {row.operation}
                    </div>
                    <div className={styles.commissionFee} role="cell">
                      {row.fee}
                    </div>
                    <div className={styles.commissionShare} role="cell">
                      {row.share}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className={styles.simulatorCard}>
            <CardHeader>
              <CardTitle>{t.affiliatesPage.simulatorTitle}</CardTitle>
              <CardDescription>{t.affiliatesPage.simulatorBasisNote}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.simulatorBody}>
                <div className={styles.simulatorControlHeader}>
                  <label htmlFor="referrals-slider" className={styles.fieldLabel}>
                    {t.affiliatesPage.simulatorReferralsLabel}
                  </label>
                  <span className={styles.simulatorCount}>{referralsPerMonth}</span>
                </div>
                <input
                  id="referrals-slider"
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  value={referralsPerMonth}
                  onChange={(e) => setReferralsPerMonth(Number(e.target.value))}
                  className={styles.simulatorSlider}
                />
                <div className={styles.simulatorResultBox}>
                  <span className={styles.simulatorResultLabel}>
                    {t.affiliatesPage.simulatorMonthlyEstimate}
                  </span>
                  <strong className={styles.simulatorResultValue}>
                    {formatSolAmount(estimatedMonthlySol, 3, 3)} SOL
                  </strong>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 6. Transparency + Short Practical FAQ */}
      <section className={styles.sectionBlock} aria-labelledby="affiliate-faq-heading">
        <div className={styles.bottomGrid}>
          <Card className={styles.infoCard}>
            <CardHeader>
              <CardTitle className={styles.iconCardTitle}>
                <IconShieldCheck />
                <span>{t.affiliatesPage.transparentCardTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className={styles.infoCardStack}>
              <p className={styles.infoText}>{t.affiliatesPage.commissionCardText}</p>
              <p className={styles.technicalNote}>{t.affiliatesPage.transparentCardText}</p>
            </CardContent>
          </Card>

          <Card className={styles.faqCard}>
            <CardHeader>
              <CardTitle id="affiliate-faq-heading">{t.affiliatesPage.faqTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.faqList}>
                {t.affiliatesPage.faqItems.map((item, idx) => (
                  <details key={idx} className={styles.faqItem} open={idx === 0}>
                    <summary className={styles.faqQuestion}>{item.question}</summary>
                    <p className={styles.faqAnswer}>{item.answer}</p>
                  </details>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default function AfiliatesPage() {
  return <AffiliatesContent />;
}
