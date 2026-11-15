"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Feedback from "@/components/Feedback";
import Notification from "@/components/ui/Notification";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./Confirmation.module.css";

function ConfirmationContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const tokenAddress = searchParams.get("tokenAddress");
  const txId = searchParams.get("txId");
  const errorMessage = searchParams.get("error");

  const [isInfoVisible, setIsInfoVisible] = useState(true);

  const encodedMint = tokenAddress ? encodeURIComponent(tokenAddress) : "";

  return (
    <div className={styles.contentWrapper}>
      <h2 className={styles.title}>{t.confirmationPage.pageTitle}</h2>

      {status === "success" && isInfoVisible && (
        <Notification
          type="info"
          message={t.confirmationPage.infoBanner}
          onClose={() => setIsInfoVisible(false)}
        />
      )}

      {status === "success" && tokenAddress ? (
        <>
          <Feedback success={true} tokenAddress={tokenAddress} txId={txId} />

          <div className={styles.funnelCard}>
            <h3 className={styles.funnelTitle}>{t.confirmationPage.funnelTitle}</h3>
            <p className={styles.funnelSubtitle}>
              {t.confirmationPage.funnelSubtitle} (
              <code>
                {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}
              </code>
              )
            </p>

            <div className={styles.funnelStepsGrid}>
              <Link
                href={`/add-liquidity?mint=${encodedMint}`}
                className={styles.stepActionLink}
              >
                <div className={styles.stepInfo}>
                  <span className={styles.stepBadge}>{t.confirmationPage.step1Badge}</span>
                  <strong>{t.confirmationPage.step1Title}</strong>
                  <span>{t.confirmationPage.step1Desc}</span>
                </div>
                <span className={styles.stepArrow}>→</span>
              </Link>

              <Link href={`/burn?mint=${encodedMint}`} className={styles.stepActionLink}>
                <div className={styles.stepInfo}>
                  <span className={styles.stepBadge}>{t.confirmationPage.step2Badge}</span>
                  <strong>{t.confirmationPage.step2Title}</strong>
                  <span>{t.confirmationPage.step2Desc}</span>
                </div>
                <span className={styles.stepArrow}>→</span>
              </Link>

              <Link href={`/airdrop?mint=${encodedMint}`} className={styles.stepActionLink}>
                <div className={styles.stepInfo}>
                  <span className={styles.stepBadge}>{t.confirmationPage.step3Badge}</span>
                  <strong>{t.confirmationPage.step3Title}</strong>
                  <span>{t.confirmationPage.step3Desc}</span>
                </div>
                <span className={styles.stepArrow}>→</span>
              </Link>
            </div>
          </div>
        </>
      ) : (
        <Feedback success={false} errorMessage={errorMessage || "An unknown error occurred."} />
      )}

      <div className={styles.linkContainer}>
        <Link href="/" className={styles.link}>
          {t.confirmationPage.backToCreator}
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <div className={styles.container}>
      <Suspense fallback={<div>Loading...</div>}>
        <ConfirmationContent />
      </Suspense>
    </div>
  );
}
