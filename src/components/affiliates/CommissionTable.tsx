"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PRICING_SCHEDULE_TABLE, formatSolAmount } from "@/config/pricing";
import { useLanguage } from "@/context/LanguageContext";
import { getAffiliateCopy } from "@/i18n/affiliates";
import styles from "@/app/affiliates/Affiliates.module.css";

export default function CommissionTable() {
  const { locale } = useLanguage();
  const copy = getAffiliateCopy(locale);
  const usePtPricingLabels = locale === "pt" || locale === "pt-BR";

  // Sort by highest affiliate commission first (percentage-based item last)
  const sortedSchedule = useMemo(() => {
    return [...PRICING_SCHEDULE_TABLE].sort((a, b) => {
      if (a.isPercentageRate && !b.isPercentageRate) return 1;
      if (!a.isPercentageRate && b.isPercentageRate) return -1;
      return b.affiliateSol - a.affiliateSol;
    });
  }, []);

  return (
    <section
      id="commission-table"
      aria-labelledby="commission-table-heading"
      className={styles.dataSection}
    >
      <div className={styles.sectionHeaderRow}>
        <div>
          <h2 id="commission-table-heading" className={styles.sectionTitle}>
            {copy.commissionTableTitle}
          </h2>
          <p className={styles.sectionSubtitle}>{copy.commissionTableSubtitle}</p>
        </div>
        <Link href="/costs" className={styles.inlineLink}>
          {copy.viewFullCostsLink} →
        </Link>
      </div>

      {/* Visual 30/70 Split Bar */}
      <div className={styles.splitBarWrap} aria-label={`${copy.splitBarAffiliateLabel} / ${copy.splitBarDevLabel}`}>
        <div className={styles.splitBarLabels}>
          <span className={styles.accentCell}>{copy.splitBarAffiliateLabel}</span>
          <span className={styles.helperNote}>{copy.splitBarDevLabel}</span>
        </div>
        <div className={styles.splitBarTrack}>
          <div className={styles.splitBarAffiliate} />
          <div className={styles.splitBarDev} />
        </div>
      </div>

      {/* Preserves #commission-table table tbody tr for E2E while stacking into cards on <640px */}
      <table className={`${styles.dataTable} ${styles.responsiveTable}`}>
        <thead>
          <tr>
            <th scope="col">{copy.colService}</th>
            <th scope="col">{copy.colTotalFee}</th>
            <th scope="col" className={styles.highlightCol}>
              {copy.colAffiliateShare}
            </th>
            <th scope="col">{copy.colDevShare}</th>
          </tr>
        </thead>
        <tbody>
          {sortedSchedule.map((item) => {
            const serviceName = usePtPricingLabels ? item.defaultNamePt : item.defaultNameEn;
            const feeText =
              usePtPricingLabels && item.feeDisplayPt ? item.feeDisplayPt : item.feeDisplay;
            const affiliateText = item.isPercentageRate
              ? usePtPricingLabels
                ? item.affiliateDisplayPt
                : item.affiliateDisplayEn
              : `${formatSolAmount(item.affiliateSol, 3, 4)} SOL`;
            const devText = item.isPercentageRate
              ? usePtPricingLabels
                ? item.devWalletDisplayPt
                : item.devWalletDisplayEn
              : `${formatSolAmount(item.devWalletSol, 3, 4)} SOL`;

            return (
              <tr key={item.id}>
                <td data-label={copy.colService}>{serviceName}</td>
                <td data-label={copy.colTotalFee} className={styles.monoCell}>
                  {feeText}
                </td>
                <td
                  data-label={copy.colAffiliateShare}
                  className={`${styles.monoCell} ${styles.accentCell} ${styles.highlightCol}`}
                >
                  {affiliateText}
                </td>
                <td data-label={copy.colDevShare} className={styles.monoCell}>
                  {devText}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
