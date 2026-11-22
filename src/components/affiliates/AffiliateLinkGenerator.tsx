"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  Check,
  Copy,
  Download,
  ImageOff,
  MessageSquareText,
  QrCode,
  Wallet,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getAffiliateCopy } from "@/i18n/affiliates";
import {
  REFERRAL_CAMPAIGNS,
  REFERRAL_TOOL_ORDER,
  normalizeReferralLang,
  type ReferralToolId,
} from "@/lib/referralCampaigns";
import { trackEvent } from "@/lib/analytics";
import styles from "@/app/affiliates/Affiliates.module.css";

const AffiliateQrCode = dynamic(() => import("./AffiliateQrCode"), {
  ssr: false,
  loading: () => <div className={styles.qrSkeleton} aria-hidden="true" />,
});

const LogoX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LogoTelegram = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M21.944 4.667a1.5 1.5 0 0 0-1.577-.217L2.88 11.97a1.5 1.5 0 0 0 .105 2.79l4.185 1.395 1.56 4.892a1.2 1.2 0 0 0 2.012.463l2.244-2.31 4.24 3.12a1.5 1.5 0 0 0 2.356-.892l2.89-15.11a1.5 1.5 0 0 0-.528-1.651zm-4.18 3.204-7.92 7.185-.31 3.12-.978-3.065 9.208-7.24z" />
  </svg>
);

const LogoWhatsApp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5L2 22l5.156-1.344a9.92 9.92 0 0 0 4.875 1.281c5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.828 14.125c-.25.703-1.453 1.344-2.016 1.422-.516.078-1.188.109-1.922-.125-.453-.141-1.031-.344-1.766-.656-3.109-1.344-5.141-4.484-5.297-4.688-.156-.203-1.266-1.688-1.266-3.219 0-1.531.797-2.281 1.078-2.594.281-.313.625-.391.828-.391.203 0 .422.016.609.016.203 0 .469-.078.734.563.266.641.922 2.25 1 2.406.078.156.125.344.016.547-.109.203-.156.344-.313.531-.156.188-.328.406-.469.547-.156.156-.328.328-.141.641.188.313.844 1.391 1.813 2.25 1.25 1.109 2.297 1.453 2.609 1.609.313.156.5.125.688-.078.188-.203.781-.906.984-1.219.203-.313.422-.266.703-.156.281.109 1.813.859 2.125 1.016.313.156.516.234.594.359.078.125.078.75-.172 1.453z" />
  </svg>
);

export interface AffiliateLinkGeneratorProps {
  selectedTool: ReferralToolId;
  onSelectTool: (tool: ReferralToolId) => void;
  linkMode: "rich" | "direct";
  onChangeLinkMode: (mode: "rich" | "direct") => void;
  affiliateUrl: string;
}

export default function AffiliateLinkGenerator({
  selectedTool,
  onSelectTool,
  linkMode,
  onChangeLinkMode,
  affiliateUrl,
}: AffiliateLinkGeneratorProps) {
  const { connected, connecting, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { t, locale } = useLanguage();
  const copy = getAffiliateCopy(locale);
  const langKey = normalizeReferralLang(locale);
  const langParam = langKey === "pt-BR" ? "pt" : langKey;

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copiedMode, setCopiedMode] = useState<"link" | "pitch" | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [previewNetwork, setPreviewNetwork] = useState<"x" | "telegram">("x");
  const [imgStatus, setImgStatus] = useState<"loading" | "loaded" | "error">("loading");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const campaign = REFERRAL_CAMPAIGNS[selectedTool];
  const campaignCopy = campaign[langKey];
  const walletBase58 = connected && publicKey ? publicKey.toBase58() : "";

  const ogPreviewSrc = useMemo(() => {
    const params = new URLSearchParams({
      tool: selectedTool,
      lang: langParam,
    });
    if (walletBase58) {
      params.set("wallet", walletBase58);
    }
    return `/api/og/ref?${params.toString()}`;
  }, [selectedTool, langParam, walletBase58]);

  useEffect(() => {
    setImgStatus("loading");
  }, [ogPreviewSrc]);

  const formattedPitch = useMemo(() => {
    const targetUrl = affiliateUrl || copy.disconnectedPlaceholderUrl;
    return campaignCopy.sharePitch.replace("{url}", targetUrl);
  }, [campaignCopy.sharePitch, affiliateUrl, copy.disconnectedPlaceholderUrl]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  const handleCopy = async (mode: "link" | "pitch") => {
    const value = mode === "link" ? affiliateUrl : formattedPitch;
    if (!value) return;
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(value);
      setCopiedMode(mode);
      showToast(mode === "link" ? copy.linkCopied : copy.pitchCopied);
      trackEvent("share_clicked", {
        channel: mode === "link" ? "copy_affiliate_link" : "copy_affiliate_pitch",
        tool: selectedTool,
      });
      setTimeout(() => setCopiedMode(null), 2500);
    } catch {
      const input = document.getElementById("affiliate-link-input") as HTMLInputElement | null;
      input?.select();
      setCopyError(copy.clipboardError);
    }
  };

  const handleTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const total = REFERRAL_TOOL_ORDER.length;
    let nextIndex = index;
    if (e.key === "ArrowRight") nextIndex = (index + 1) % total;
    else if (e.key === "ArrowLeft") nextIndex = (index - 1 + total) % total;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = total - 1;
    else return;

    e.preventDefault();
    const nextTool = REFERRAL_TOOL_ORDER[nextIndex];
    onSelectTool(nextTool);
    tabRefs.current[nextIndex]?.focus();
  };

  const shareText = encodeURIComponent(formattedPitch);
  const encodedUrl = encodeURIComponent(affiliateUrl);
  const activeTabId = `tool-tab-${selectedTool}`;
  const activePanelId = `tool-panel-${selectedTool}`;

  return (
    <section
      id="link-generator"
      aria-labelledby="link-generator-heading"
      className={styles.featuredCard}
    >
      <div className={styles.sectionHeaderRow}>
        <h2 id="link-generator-heading" className={styles.cardHeading}>
          {copy.generatorTitle}
        </h2>
        <span className={styles.nonCustodialTag}>{copy.nonCustodialBadge}</span>
      </div>

      {/* ARIA Tablist with Arrow/Home/End keyboard navigation & mobile snap scroll */}
      <div
        className={styles.campaignTabs}
        role="tablist"
        aria-label={copy.campaignTabsAria}
      >
        {REFERRAL_TOOL_ORDER.map((toolId, idx) => {
          const item = REFERRAL_CAMPAIGNS[toolId];
          const active = selectedTool === toolId;
          return (
            <button
              key={toolId}
              id={`tool-tab-${toolId}`}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`tool-panel-${toolId}`}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelectTool(toolId)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              className={`${styles.campaignTabBtn} ${
                active ? styles.campaignTabBtnActive : ""
              }`}
            >
              {item[langKey].tabLabel}
            </button>
          );
        })}
      </div>

      <div id={activePanelId} role="tabpanel" aria-labelledby={activeTabId}>
        {connected && publicKey ? (
          <div>
            {/* Human-friendly Link Style Toggle */}
            <div className={styles.linkModeBox}>
              <div className={styles.linkModeRow}>
                <span className={styles.helperNote}>{copy.linkModeLabel}</span>
                <div className={styles.linkModeButtons} role="group" aria-label={copy.linkModeLabel}>
                  <button
                    type="button"
                    onClick={() => onChangeLinkMode("rich")}
                    aria-pressed={linkMode === "rich"}
                    className={`${styles.miniToggle} ${
                      linkMode === "rich" ? styles.miniToggleActive : ""
                    }`}
                  >
                    <span>{copy.linkModeRich}</span>
                    <span className={styles.recommendedPill}>{copy.linkModeRecommendedBadge}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeLinkMode("direct")}
                    aria-pressed={linkMode === "direct"}
                    className={`${styles.miniToggle} ${
                      linkMode === "direct" ? styles.miniToggleActive : ""
                    }`}
                  >
                    {copy.linkModeDirect}
                  </button>
                </div>
              </div>
              <p className={styles.helperNote}>
                {linkMode === "rich" ? copy.linkModeRichHelp : copy.linkModeDirectHelp}
              </p>
            </div>

            {/* Primary Action: Input + Copy Link */}
            <label htmlFor="affiliate-link-input" className={styles.srOnly}>
              {copy.generatorInputLabel}
            </label>
            <div className={styles.copyRow}>
              <input
                id="affiliate-link-input"
                type="text"
                readOnly
                value={affiliateUrl}
                className={styles.linkInput}
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                onClick={() => handleCopy("link")}
                className={styles.primaryBtn}
                aria-label={copiedMode === "link" ? copy.linkCopied : copy.copyLinkBtn}
              >
                {copiedMode === "link" ? (
                  <Check size={16} aria-hidden="true" />
                ) : (
                  <Copy size={16} aria-hidden="true" />
                )}
                <span>{copiedMode === "link" ? copy.linkCopied : copy.copyLinkBtn}</span>
              </button>
            </div>

            {/* Clear Action Hierarchy: Secondary (Copy Pitch) + Grouped Share + More */}
            <div className={styles.actionHierarchyBar}>
              <button
                type="button"
                onClick={() => handleCopy("pitch")}
                className={styles.secondaryBtn}
              >
                {copiedMode === "pitch" ? (
                  <Check size={16} aria-hidden="true" />
                ) : (
                  <MessageSquareText size={16} aria-hidden="true" />
                )}
                <span>{copiedMode === "pitch" ? copy.pitchCopied : copy.copyPitchBtn}</span>
              </button>

              <div className={styles.actionGroup}>
                <span className={styles.groupLabel}>{copy.shareGroupLabel}</span>
                <a
                  href={`https://x.com/intent/tweet?text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackEvent("share_clicked", { channel: "x_affiliate", tool: selectedTool })
                  }
                  className={styles.shareIconBtn}
                  aria-label={copy.shareXAria}
                >
                  <LogoX />
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodedUrl}&text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackEvent("share_clicked", { channel: "telegram_affiliate", tool: selectedTool })
                  }
                  className={styles.shareIconBtn}
                  aria-label={copy.shareTelegramAria}
                >
                  <LogoTelegram />
                </a>
                <a
                  href={`https://wa.me/?text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackEvent("share_clicked", { channel: "whatsapp_affiliate", tool: selectedTool })
                  }
                  className={styles.shareIconBtn}
                  aria-label={copy.shareWhatsappAria}
                >
                  <LogoWhatsApp />
                </a>
              </div>

              <div className={styles.actionGroup}>
                <span className={styles.groupLabel}>{copy.moreGroupLabel}</span>
                <button
                  type="button"
                  onClick={() => setShowQr((prev) => !prev)}
                  className={styles.ghostBtn}
                  aria-expanded={showQr}
                  aria-label={copy.toggleQrAria}
                >
                  <QrCode size={15} aria-hidden="true" />
                  <span>{showQr ? copy.hideQrBtn : copy.showQrBtn}</span>
                </button>
                <a
                  href={ogPreviewSrc}
                  download={`createtokensolana-${selectedTool}-card.png`}
                  className={styles.ghostBtn}
                >
                  <Download size={15} aria-hidden="true" />
                  <span>{copy.downloadImageBtn}</span>
                </a>
              </div>
            </div>

            {toastMsg && (
              <div className={styles.toastBanner} role="status" aria-live="polite">
                <Check size={15} aria-hidden="true" />
                <span>{toastMsg}</span>
              </div>
            )}

            {copyError && (
              <p className={styles.inlineError} role="alert">
                {copyError}
              </p>
            )}

            {showQr && (
              <div className={styles.qrPanel}>
                <AffiliateQrCode value={affiliateUrl} label={copy.qrCodeAlt} />
                <p className={styles.helperNote}>{copy.qrCaption}</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Disconnected state: blurred example link + unlock CTA */}
            <div className={styles.copyRow}>
              <input
                type="text"
                readOnly
                aria-label={copy.generatorInputLabel}
                value={copy.disconnectedPlaceholderUrl}
                className={`${styles.linkInput} ${styles.blurredInput}`}
                tabIndex={-1}
              />
              <button
                type="button"
                onClick={() => setVisible(true)}
                disabled={connecting}
                className={styles.primaryBtn}
              >
                <Wallet size={16} aria-hidden="true" />
                <span>{connecting ? t.wallet.connecting : copy.disconnectedCta}</span>
              </button>
            </div>
            <p className={styles.helperNote} style={{ marginTop: "0.55rem" }}>
              {copy.disconnectedHint}
            </p>
          </div>
        )}

        {/* Live Social Preview Mockup (X & Telegram tabs + loader + onError fallback) */}
        <div className={styles.previewWrapper}>
          <div className={styles.previewHeader}>
            <span className={styles.fieldLabel}>{copy.previewHeading}</span>
            <div className={styles.linkModeButtons} role="group" aria-label={copy.previewHeading}>
              <button
                type="button"
                onClick={() => setPreviewNetwork("x")}
                aria-pressed={previewNetwork === "x"}
                className={`${styles.miniToggle} ${
                  previewNetwork === "x" ? styles.miniToggleActive : ""
                }`}
              >
                {copy.previewTabX}
              </button>
              <button
                type="button"
                onClick={() => setPreviewNetwork("telegram")}
                aria-pressed={previewNetwork === "telegram"}
                className={`${styles.miniToggle} ${
                  previewNetwork === "telegram" ? styles.miniToggleActive : ""
                }`}
              >
                {copy.previewTabTelegram}
              </button>
            </div>
          </div>

          <div
            className={`${styles.socialPreviewCard} ${
              previewNetwork === "telegram" ? styles.socialPreviewTelegram : ""
            }`}
          >
            <div className={styles.socialPreviewImageWrap}>
              {imgStatus === "loading" && (
                <div className={styles.previewImgLoader} aria-hidden="true">
                  <span>{copy.previewLoading}</span>
                </div>
              )}
              {imgStatus === "error" ? (
                <div className={styles.previewImgFallback}>
                  <ImageOff size={22} aria-hidden="true" />
                  <strong>{copy.previewFallbackTitle}</strong>
                  <span>{copy.previewFallbackSubtitle}</span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ogPreviewSrc}
                  alt={campaignCopy.ogTitle}
                  width={600}
                  height={315}
                  loading="lazy"
                  onLoad={() => setImgStatus("loaded")}
                  onError={() => setImgStatus("error")}
                  className={styles.socialPreviewImg}
                />
              )}
            </div>
            <div className={styles.socialPreviewMeta}>
              <span className={styles.socialPreviewDomain}>
                {previewNetwork === "telegram" ? "Telegram · createtokensol.store" : "createtokensol.store"}
              </span>
              <strong className={styles.socialPreviewTitle}>{campaignCopy.ogTitle}</strong>
              <p className={styles.socialPreviewDesc}>{campaignCopy.metaDescription}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
