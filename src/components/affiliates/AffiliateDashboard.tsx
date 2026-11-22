"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  Check,
  Copy,
  ExternalLink,
  Info,
  Lock,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { useCluster } from "@/context/WalletContext";
import { useLanguage } from "@/context/LanguageContext";
import { getAffiliateCopy } from "@/i18n/affiliates";
import styles from "@/app/affiliates/Affiliates.module.css";

type PeriodRange = "7d" | "30d" | "90d" | "all";

interface AffiliateTransaction {
  signature: string;
  blockTime: number;
  amount: number;
}

interface AffiliateMetricsResponse {
  range: PeriodRange;
  clicks: number;
  connectedWallets: number;
  conversions: number;
  totalEarningsSol: number;
  transactions: AffiliateTransaction[];
}

const TX_PAGE_SIZE = 10;

export default function AffiliateDashboard() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { getExplorerUrl } = useCluster();
  const { locale } = useLanguage();
  const copy = getAffiliateCopy(locale);

  const [range, setRange] = useState<PeriodRange>("30d");
  const [data, setData] = useState<AffiliateMetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [minutesAgo, setMinutesAgo] = useState(0);
  const [visibleCount, setVisibleCount] = useState(TX_PAGE_SIZE);
  const [copiedSig, setCopiedSig] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    if (!connected || !publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/affiliate-earnings?wallet=${encodeURIComponent(publicKey.toBase58())}&range=${range}`
      );
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || copy.dashboardError);
      }
      const json = (await res.json()) as AffiliateMetricsResponse;
      setData(json);
      setVisibleCount(TX_PAGE_SIZE);
      setLastUpdatedAt(Date.now());
      setMinutesAgo(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.dashboardError);
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey, range, copy.dashboardError]);

  useEffect(() => {
    if (connected && publicKey) {
      loadMetrics();
    } else {
      setData(null);
      setLastUpdatedAt(null);
    }
  }, [connected, publicKey, loadMetrics]);

  useEffect(() => {
    if (!lastUpdatedAt) return;
    const timer = setInterval(() => {
      setMinutesAgo(Math.max(0, Math.floor((Date.now() - lastUpdatedAt) / 60_000)));
    }, 30_000);
    return () => clearInterval(timer);
  }, [lastUpdatedAt]);

  const handleCopySignature = async (sig: string) => {
    try {
      await navigator.clipboard.writeText(sig);
      setCopiedSig(sig);
      setTimeout(() => setCopiedSig(null), 2000);
    } catch {
      // Ignore if clipboard unavailable
    }
  };

  const scrollToGenerator = () => {
    document.getElementById("link-generator")?.scrollIntoView({ behavior: "smooth" });
  };

  // Disconnected teaser state (shows locked/blurred KPIs so visitors discover the dashboard)
  if (!connected || !publicKey) {
    return (
      <section
        id="affiliate-dashboard"
        aria-labelledby="dashboard-heading"
        className={styles.dataSection}
      >
        <div className={styles.sectionHeader}>
          <h2 id="dashboard-heading" className={styles.sectionTitle}>
            {copy.dashboardTitle}
          </h2>
          <p className={styles.sectionSubtitle}>{copy.dashboardDesc}</p>
        </div>

        <div className={styles.teaserLockedGrid}>
          <div className={`${styles.kpiGrid} ${styles.teaserBlurred}`} aria-hidden="true">
            <div className={`${styles.kpiCard} ${styles.kpiCardFeatured}`}>
              <span className={styles.kpiLabel}>{copy.kpiTotalEarned}</span>
              <strong className={styles.kpiValue}>4.2850 SOL</strong>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{copy.kpiClicks}</span>
              <strong className={styles.kpiValue}>312</strong>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{copy.kpiConversions}</span>
              <strong className={styles.kpiValue}>41</strong>
            </div>
          </div>

          <div className={styles.teaserOverlay}>
            <Lock size={22} aria-hidden="true" />
            <h3 className={styles.subHeading}>{copy.dashboardTeaserTitle}</h3>
            <p className={styles.mutedText} style={{ maxWidth: "46ch" }}>
              {copy.dashboardTeaserDesc}
            </p>
            <button
              type="button"
              onClick={() => setVisible(true)}
              className={styles.primaryBtn}
            >
              <Wallet size={16} aria-hidden="true" />
              <span>{copy.dashboardTeaserCta}</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  const periods: ReadonlyArray<{ key: PeriodRange; label: string }> = [
    { key: "7d", label: copy.range7d },
    { key: "30d", label: copy.range30d },
    { key: "90d", label: copy.range90d },
    { key: "all", label: copy.rangeAll },
  ];

  const formatSol = (val: number) =>
    new Intl.NumberFormat(copy.numberLocale, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(val);

  const formatDate = (unixSeconds: number) =>
    unixSeconds
      ? new Intl.DateTimeFormat(copy.numberLocale, {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(unixSeconds * 1000))
      : "—";

  const conversionRate =
    data && data.clicks > 0 ? ((data.conversions / data.clicks) * 100).toFixed(1) : "0.0";

  const updatedLabel =
    minutesAgo === 0
      ? copy.updatedJustNow
      : copy.updatedMinutesAgo.replace("{min}", String(minutesAgo));

  const visibleTransactions = data ? data.transactions.slice(0, visibleCount) : [];

  return (
    <section
      id="affiliate-dashboard"
      aria-labelledby="dashboard-heading"
      className={styles.dataSection}
    >
      <div className={styles.sectionHeaderRow}>
        <div>
          <h2 id="dashboard-heading" className={styles.sectionTitle}>
            {copy.dashboardTitle}
          </h2>
          <p className={styles.sectionSubtitle}>{copy.dashboardDesc}</p>
        </div>

        <div className={styles.dashboardMetaRow}>
          {lastUpdatedAt && <span className={styles.updatedTag}>{updatedLabel}</span>}
          <div className={styles.actionGroup} role="group" aria-label={copy.rangeAria}>
            {periods.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setRange(p.key)}
                aria-pressed={range === p.key}
                className={`${styles.filterBtn} ${range === p.key ? styles.filterBtnActive : ""}`}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={loadMetrics}
              disabled={loading}
              className={styles.iconBtn}
              aria-label={copy.refreshDashboardAria}
            >
              <RefreshCw size={15} aria-hidden="true" className={loading ? styles.spin : ""} />
            </button>
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div role="status" aria-busy="true">
          <div className={styles.kpiGrid}>
            <div className={`${styles.kpiSkeletonCard} ${styles.kpiCardFeatured} ${styles.skeletonPulse}`} />
            <div className={`${styles.kpiSkeletonCard} ${styles.skeletonPulse}`} />
            <div className={`${styles.kpiSkeletonCard} ${styles.skeletonPulse}`} />
          </div>
          <div className={`${styles.tableSkeletonRow} ${styles.skeletonPulse}`} />
          <div className={`${styles.tableSkeletonRow} ${styles.skeletonPulse}`} />
          <div className={`${styles.tableSkeletonRow} ${styles.skeletonPulse}`} />
        </div>
      ) : error ? (
        <div className={styles.errorBox} role="alert">
          <p>{error}</p>
          <button type="button" onClick={loadMetrics} className={styles.ghostBtn}>
            {copy.retryBtn}
          </button>
        </div>
      ) : data ? (
        <>
          <div className={styles.kpiGrid}>
            <div className={`${styles.kpiCard} ${styles.kpiCardFeatured}`}>
              <div className={styles.kpiLabelRow}>
                <span className={styles.kpiLabel}>{copy.kpiTotalEarned}</span>
                <span title={copy.kpiTotalEarnedTip} aria-label={copy.kpiTotalEarnedTip}>
                  <Info size={14} aria-hidden="true" />
                </span>
              </div>
              <strong className={`${styles.kpiValue} ${styles.kpiValueFeatured}`}>
                {formatSol(data.totalEarningsSol)} SOL
              </strong>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiLabelRow}>
                <span className={styles.kpiLabel}>{copy.kpiClicks}</span>
                <span title={copy.kpiClicksTip} aria-label={copy.kpiClicksTip}>
                  <Info size={14} aria-hidden="true" />
                </span>
              </div>
              <strong className={styles.kpiValue}>{data.clicks}</strong>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiLabelRow}>
                <span className={styles.kpiLabel}>{copy.kpiConnectedWallets}</span>
                <span title={copy.kpiConnectedWalletsTip} aria-label={copy.kpiConnectedWalletsTip}>
                  <Info size={14} aria-hidden="true" />
                </span>
              </div>
              <strong className={styles.kpiValue}>{data.connectedWallets}</strong>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiLabelRow}>
                <span className={styles.kpiLabel}>{copy.kpiConversions}</span>
                <span title={copy.kpiConversionsTip} aria-label={copy.kpiConversionsTip}>
                  <Info size={14} aria-hidden="true" />
                </span>
              </div>
              <strong className={styles.kpiValue}>{data.conversions}</strong>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiLabelRow}>
                <span className={styles.kpiLabel}>{copy.kpiConversionRate}</span>
                <span title={copy.kpiConversionRateTip} aria-label={copy.kpiConversionRateTip}>
                  <Info size={14} aria-hidden="true" />
                </span>
              </div>
              <strong className={styles.kpiValue}>{conversionRate}%</strong>
            </div>
          </div>

          {visibleTransactions.length > 0 ? (
            <>
              <table className={`${styles.dataTable} ${styles.responsiveTable}`}>
                <thead>
                  <tr>
                    <th scope="col">{copy.dateCol}</th>
                    <th scope="col">{copy.amountCol}</th>
                    <th scope="col">{copy.txCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTransactions.map((tx) => (
                    <tr key={tx.signature}>
                      <td data-label={copy.dateCol}>{formatDate(tx.blockTime)}</td>
                      <td data-label={copy.amountCol} className={`${styles.monoCell} ${styles.accentCell}`}>
                        +{formatSol(tx.amount)} SOL
                      </td>
                      <td data-label={copy.txCol}>
                        <div className={styles.txSigCell}>
                          <a
                            href={getExplorerUrl("tx", tx.signature)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.inlineLink}
                          >
                            {tx.signature.slice(0, 6)}…{tx.signature.slice(-6)}{" "}
                            <ExternalLink size={13} aria-hidden="true" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopySignature(tx.signature)}
                            className={styles.copyTinyBtn}
                            aria-label={
                              copiedSig === tx.signature ? copy.sigCopied : copy.copySigAria
                            }
                          >
                            {copiedSig === tx.signature ? (
                              <Check size={13} aria-hidden="true" />
                            ) : (
                              <Copy size={13} aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {data.transactions.length > visibleCount && (
                <div className={styles.showMoreWrap}>
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + TX_PAGE_SIZE)}
                    className={styles.ghostBtn}
                  >
                    {copy.showMoreTxBtn}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.stateBox}>
              <svg width="56" height="56" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <rect x="8" y="14" width="48" height="36" rx="8" stroke="currentColor" strokeWidth="2.5" opacity="0.35" />
                <path d="M18 38L28 28L36 34L46 22" stroke="#14F195" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className={styles.emptyTitle}>{copy.emptyStateTitle}</p>
              <p className={styles.mutedText}>{copy.emptyStateDesc}</p>
              <button type="button" onClick={scrollToGenerator} className={styles.primaryBtn}>
                {copy.emptyStateCta}
              </button>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
