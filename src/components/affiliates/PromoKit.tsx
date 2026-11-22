"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getAffiliateCopy } from "@/i18n/affiliates";
import styles from "@/app/affiliates/Affiliates.module.css";

type TemplateLang = "en" | "pt" | "es";

const BANNER_SIZES = [
  { id: "x-og", label: "X / Open Graph (1200×628)", width: 1200, height: 628 },
  { id: "square", label: "Feed / Instagram (1080×1080)", width: 1080, height: 1080 },
  { id: "telegram", label: "Telegram / Banner (800×418)", width: 800, height: 418 },
] as const;

function renderBannerDataUrl(width: number, height: number): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#09090B";
  ctx.fillRect(0, 0, width, height);

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "rgba(153, 69, 255, 0.28)");
  grad.addColorStop(1, "rgba(20, 241, 149, 0.2)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = Math.max(2, Math.round(width * 0.002));
  ctx.strokeRect(24, 24, width - 48, height - 48);

  const pad = Math.round(width * 0.06);
  ctx.fillStyle = "#14F195";
  ctx.font = `600 ${Math.round(height * 0.04)}px Inter, sans-serif`;
  ctx.fillText("CREATETOKENSOLANA · NON-CUSTODIAL SOLANA LAUNCHPAD", pad, pad + 36);

  ctx.fillStyle = "#FAFAFA";
  ctx.font = `700 ${Math.round(height * 0.082)}px Inter, sans-serif`;
  ctx.fillText("SPL / Token-2022 & DeFi Tools", pad, Math.round(height * 0.45));

  ctx.fillStyle = "#A1A1AA";
  ctx.font = `400 ${Math.round(height * 0.042)}px Inter, sans-serif`;
  ctx.fillText(
    "Raydium CPMM Pools · Vesting Lock · Mass Airdrop · Reclaim SOL",
    pad,
    Math.round(height * 0.57)
  );

  ctx.fillStyle = "#E4E4E7";
  ctx.font = `500 ${Math.round(height * 0.036)}px monospace`;
  ctx.fillText("www.createtokensol.store", pad, height - pad);

  return canvas.toDataURL("image/png");
}

interface PromoKitProps {
  activeReferralUrl: string;
}

export default function PromoKit({ activeReferralUrl }: PromoKitProps) {
  const { t, locale } = useLanguage();
  const copy = getAffiliateCopy(locale);

  const [templateLang, setTemplateLang] = useState<TemplateLang>(
    locale === "pt" || locale === "pt-BR" ? "pt" : locale === "es" ? "es" : "en"
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    const generated: Record<string, string> = {};
    for (const b of BANNER_SIZES) {
      generated[b.id] = renderBannerDataUrl(Math.round(b.width / 2), Math.round(b.height / 2));
    }
    setThumbs(generated);
  }, []);

  const linkToInject = activeReferralUrl || copy.disconnectedPlaceholderUrl;

  const handleCopyText = async (id: string, text: string) => {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2200);
    } catch {
      setCopyError(copy.clipboardError);
    }
  };

  const handleDownloadBanner = (width: number, height: number, id: string) => {
    const dataUrl = renderBannerDataUrl(width, height);
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `createtokensolana-banner-${id}-${width}x${height}.png`;
    a.click();
  };

  return (
    <section id="promo-kit" aria-labelledby="promo-kit-heading" className={styles.infoSection}>
      <div className={styles.sectionHeader}>
        <h2 id="promo-kit-heading" className={styles.sectionTitle}>
          {copy.promoKitTitle}
        </h2>
        <p className={styles.sectionSubtitle}>{copy.promoKitSubtitle}</p>
        <p className={styles.helperNote} style={{ marginTop: "0.25rem" }}>
          {copy.promoSyncedNote}
        </p>
      </div>

      <div className={styles.promoLayout}>
        <div>
          <div className={styles.actionGroup} role="tablist" aria-label={copy.promoLangAria}>
            {(["en", "pt", "es"] as const).map((code) => (
              <button
                key={code}
                type="button"
                role="tab"
                aria-selected={templateLang === code}
                onClick={() => setTemplateLang(code)}
                className={`${styles.filterBtn} ${
                  templateLang === code ? styles.filterBtnActive : ""
                }`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          {copyError && (
            <p className={styles.inlineError} role="alert">
              {copyError}
            </p>
          )}

          <div className={styles.templateList}>
            {copy.promoTemplates[templateLang].map((tpl) => {
              const resolvedText = tpl.text.replace("{url}", linkToInject);
              return (
                <div key={tpl.id} className={styles.templateCard}>
                  <div className={styles.templateTop}>
                    <strong>{tpl.channel}</strong>
                    <button
                      type="button"
                      onClick={() => handleCopyText(tpl.id, resolvedText)}
                      className={styles.ghostBtn}
                      aria-label={`${t.common.copy} ${tpl.channel}`}
                    >
                      {copiedId === tpl.id ? (
                        <Check size={14} aria-hidden="true" />
                      ) : (
                        <Copy size={14} aria-hidden="true" />
                      )}
                      <span>{copiedId === tpl.id ? t.common.copied : t.common.copy}</span>
                    </button>
                  </div>
                  <pre className={styles.templatePre}>{resolvedText}</pre>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "1.25rem" }}>
            <h3 className={styles.subHeading}>{copy.bannersTitle}</h3>
            <p className={styles.helperNote}>{copy.bannersSubtitle}</p>
            <div className={styles.bannerGrid}>
              {BANNER_SIZES.map((banner) => (
                <div key={banner.id} className={styles.bannerPreviewCard}>
                  {thumbs[banner.id] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbs[banner.id]}
                      alt={banner.label}
                      width={Math.round(banner.width / 2)}
                      height={Math.round(banner.height / 2)}
                      className={styles.bannerThumbImg}
                    />
                  )}
                  <span className={styles.helperNote}>{banner.label}</span>
                  <button
                    type="button"
                    onClick={() => handleDownloadBanner(banner.width, banner.height, banner.id)}
                    className={styles.ghostBtn}
                  >
                    <Download size={15} aria-hidden="true" />
                    <span>{copy.downloadBannerBtn}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className={styles.conductCard} aria-labelledby="conduct-heading">
          <h3 id="conduct-heading" className={styles.subHeading}>
            {copy.conductTitle}
          </h3>
          <ul className={styles.conductList}>
            {copy.conductRules.map((rule, idx) => (
              <li key={idx}>{rule}</li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
