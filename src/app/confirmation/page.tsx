"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Feedback from "@/components/Feedback";
import Notification from "@/components/ui/Notification";
import { useLanguage } from "@/context/LanguageContext";
import { trackEvent } from "@/lib/analytics";
import styles from "./Confirmation.module.css";

function ConfirmationContent() {
  const { t, locale } = useLanguage();
  const isPt = locale === "pt" || locale === "pt-BR";
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const tokenAddress = searchParams.get("tokenAddress");
  const txId = searchParams.get("txId");
  const errorMessage = searchParams.get("error");

  const [isInfoVisible, setIsInfoVisible] = useState(true);

  const encodedMint = tokenAddress ? encodeURIComponent(tokenAddress) : "";
  const publicTokenPath = tokenAddress ? `/token/${encodedMint}` : "/";
  const tokenPublicUrl = tokenAddress
    ? `https://www.createtokensol.store/token/${tokenAddress}`
    : "https://www.createtokensol.store";

  const localizedShareCopy = (() => {
    switch (locale) {
      case "pt":
      case "pt-BR":
        return {
          x: `🚀 Acabei de lançar meu token na Solana com blindagem RugCheck 100/100!\n\n🪙 Mint: ${tokenAddress}\n🔗 Página oficial: ${tokenPublicUrl}\nVia @CreateTokenSols`,
          tg: "🚀 Confira nosso novo token verificado na Solana!",
        };
      case "es":
        return {
          x: `🚀 ¡Acabo de lanzar mi token en Solana con protección RugCheck 100/100!\n\n🪙 Mint: ${tokenAddress}\n🔗 Página oficial: ${tokenPublicUrl}\nVía @CreateTokenSols`,
          tg: "🚀 ¡Mira nuestro nuevo token verificado en Solana!",
        };
      case "ru":
        return {
          x: `🚀 Я только что запустил свой токен в Solana с защитой RugCheck 100/100!\n\n🪙 Mint: ${tokenAddress}\n🔗 Официальная страница: ${tokenPublicUrl}\nЧерез @CreateTokenSols`,
          tg: "🚀 Посмотрите наш новый верифицированный токен в Solana!",
        };
      case "zh":
        return {
          x: `🚀 我刚刚在 Solana 上发布了带有 RugCheck 100/100 安全认证的代币！\n\n🪙 Mint: ${tokenAddress}\n🔗 官方页面: ${tokenPublicUrl}\nVia @CreateTokenSols`,
          tg: "🚀 查看我们在 Solana 上新发布的链上认证代币！",
        };
      case "en":
      default:
        return {
          x: `🚀 Just launched my Solana token with 100/100 RugCheck security!\n\n🪙 Mint: ${tokenAddress}\n🔗 Official page: ${tokenPublicUrl}\nVia @CreateTokenSols`,
          tg: "🚀 Check out our newly verified token on Solana!",
        };
    }
  })();

  const shareUrlX = tokenAddress
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(localizedShareCopy.x)}`
    : "https://x.com/CreateTokenSols";
  const shareUrlTelegram = tokenAddress
    ? `https://t.me/share/url?url=${encodeURIComponent(tokenPublicUrl)}&text=${encodeURIComponent(localizedShareCopy.tg)}`
    : "https://t.me";

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

          {/* Phase 6.2: 1-Click Public Token Page & Social Share */}
          <div
            style={{
              marginTop: "1.25rem",
              padding: "1rem 1.25rem",
              borderRadius: "0.85rem",
              border: "1px solid rgba(20, 241, 149, 0.45)",
              background: "rgba(20, 241, 149, 0.08)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <div>
              <strong style={{ display: "block", fontSize: "0.95rem", color: "#14f195" }}>
                🌐 {isPt ? "Abrir & Compartilhar Página Pública do Token (X / Telegram)" : "Open & Share Public Token Page (X / Telegram)"}
              </strong>
              <span style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>
                <code>/token/{tokenAddress.slice(0, 8)}...{tokenAddress.slice(-6)}</code>
              </span>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <Link
                href={publicTokenPath}
                style={{
                  padding: "0.5rem 0.9rem",
                  borderRadius: "0.6rem",
                  background: "#14f195",
                  color: "#09090b",
                  fontWeight: 800,
                  fontSize: "0.8rem",
                }}
              >
                {isPt ? "🔗 Abrir Página do Token" : "🔗 Open Token Page"}
              </Link>
              <a
                href={shareUrlX}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("share_clicked", { channel: "x", page: "confirmation", locale })}
                style={{
                  padding: "0.5rem 0.85rem",
                  borderRadius: "0.6rem",
                  border: "1px solid rgba(255,255,255,0.25)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                }}
              >
                𝕏 Share
              </a>
              <a
                href={shareUrlTelegram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("share_clicked", { channel: "telegram", page: "confirmation", locale })}
                style={{
                  padding: "0.5rem 0.85rem",
                  borderRadius: "0.6rem",
                  border: "1px solid rgba(0, 209, 255, 0.45)",
                  color: "#00d1ff",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                }}
              >
                ✈️ Telegram
              </a>
            </div>
          </div>

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
