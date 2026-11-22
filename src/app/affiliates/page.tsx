"use client";

import { useState, useEffect, useCallback, useMemo, useRef, type FormEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCluster } from "@/context/WalletContext";
import { useLanguage } from "@/context/LanguageContext";
import { isValidPublicKey } from "@/lib/security";
import { isOnCurvePublicKey } from "@/lib/affiliateAttribution";
import type { AffiliateRange } from "@/lib/affiliateEarnings";
import {
  DEFAULT_CREATE_TOKEN_FEE_SOL,
  PRICING_SOL,
  computeRateSplitPercent,
  computeSplit,
  formatSolAmount,
} from "@/config/pricing";
import styles from "./Affiliates.module.css";

const AffiliateQrCode = dynamic(() => import("@/components/AffiliateQrCode"), {
  ssr: false,
  loading: () => <div className={styles.qrSkeleton} aria-hidden="true" />,
});

/**
 * Optional configurable Solscan transaction signature for a real affiliate split example.
 * When empty, the example transaction block is intentionally omitted from the UI.
 */
const EXAMPLE_AFFILIATE_TX_SIGNATURE = "";

const IconTrendingUp = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconUsers = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconAward = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const IconHash = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" x2="20" y1="9" y2="9" />
    <line x1="4" x2="20" y1="15" y2="15" />
    <line x1="10" x2="8" y1="3" y2="21" />
    <line x1="16" x2="14" y1="3" y2="21" />
  </svg>
);

const IconWallet = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const IconRefresh = ({ spinning }: { spinning?: boolean }) => (
  <svg aria-hidden="true" className={spinning ? styles.spinIcon : undefined} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

const IconCopy = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const IconCheck = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconShieldCheck = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const IconPercent = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

const IconAlertTriangle = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const IconQrCode = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="5" height="5" x="3" y="3" rx="1" />
    <rect width="5" height="5" x="16" y="3" rx="1" />
    <rect width="5" height="5" x="3" y="16" rx="1" />
    <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
    <path d="M21 21v.01" />
    <path d="M12 7v3a2 2 0 0 1-2 2H7" />
    <path d="M3 12h.01" />
    <path d="M12 3h.01" />
    <path d="M12 16v.01" />
    <path d="M16 12h1" />
    <path d="M21 12v.01" />
    <path d="M12 21v-1" />
  </svg>
);

const IconShare = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
    <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
  </svg>
);

const IconXBrand = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconTelegram = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

const IconWhatsApp = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

interface AffiliateTransaction {
  signature: string;
  blockTime: number;
  createdAtIso?: string | null;
  amount: number;
}

interface AffiliateEarningsResponse {
  totalEarningsSol: number;
  commissionsCount: number;
  referralCount: number;
  uniqueReferredWallets: number;
  maxCommissionSol: number;
  transactions: AffiliateTransaction[];
  nextCursor: string | null;
  hasMore: boolean;
  range: AffiliateRange;
  storageMode?: "firestore" | "in-memory-fallback";
}

type DestinationKey =
  | "home"
  | "reclaim"
  | "addLiquidity"
  | "burn"
  | "airdrop"
  | "vesting"
  | "volumeBot"
  | "costs";

type SimulatorServiceKey = "createToken" | "pool" | "volumeBot" | "vesting" | "airdrop";

const DESTINATION_OPTIONS: ReadonlyArray<{ key: DestinationKey; path: string }> = [
  { key: "home", path: "/" },
  { key: "reclaim", path: "/reclaim" },
  { key: "addLiquidity", path: "/add-liquidity" },
  { key: "burn", path: "/burn" },
  { key: "airdrop", path: "/airdrop" },
  { key: "vesting", path: "/vesting" },
  { key: "volumeBot", path: "/volume-bot" },
  { key: "costs", path: "/costs" },
];

const RANGE_OPTIONS: ReadonlyArray<AffiliateRange> = ["7d", "30d", "90d", "all"];
const SIMULATOR_MAX_REFERRALS = 500;
const SIMULATOR_PRESETS = [5, 15, 50, 100] as const;

const SIMULATOR_SERVICE_FEES: Record<SimulatorServiceKey, number> = {
  createToken: DEFAULT_CREATE_TOKEN_FEE_SOL,
  pool: PRICING_SOL.createLiquidityPool,
  volumeBot: PRICING_SOL.volumeBotTrending750,
  vesting: PRICING_SOL.tokenVestingLock,
  airdrop: PRICING_SOL.massAirdropPerBatch,
};

function shortenAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

async function copyTextWithFallback(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}

function AffiliatesContent() {
  const { connected, publicKey } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const { getExplorerUrl } = useCluster();
  const { t, locale } = useLanguage();
  const ap = t.affiliatesPage;

  const linkGeneratorRef = useRef<HTMLElement | null>(null);

  const [origin, setOrigin] = useState("https://www.createtokensol.store");
  const [selectedDest, setSelectedDest] = useState<DestinationKey>("home");
  const [manualInput, setManualInput] = useState("");
  const [pendingManualWallet, setPendingManualWallet] = useState<{
    address: string;
    isOffCurve: boolean;
  } | null>(null);
  const [manualWallet, setManualWallet] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "copiedBundle" | "error">("idle");
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const [copiedTxSig, setCopiedTxSig] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState<"x" | "telegram" | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  const [selectedRange, setSelectedRange] = useState<AffiliateRange>("all");
  const [earnings, setEarnings] = useState<AffiliateEarningsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [minutesAgo, setMinutesAgo] = useState(0);

  const [simService, setSimService] = useState<SimulatorServiceKey>("createToken");
  const [referralsPerMonth, setReferralsPerMonth] = useState(15);
  const [solPriceUsd, setSolPriceUsd] = useState<number | null>(null);

  const connectedWallet = connected && publicKey ? publicKey.toBase58() : null;
  const activeWallet = connectedWallet ?? manualWallet;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
      setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    }
  }, []);

  useEffect(() => {
    if (connectedWallet) {
      setManualError(null);
      setPendingManualWallet(null);
    }
  }, [connectedWallet]);

  // Silent optional SOL/USD price fetch for the simulator (gracefully skipped on failure)
  useEffect(() => {
    let active = true;
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const price = Number(data?.solana?.usd);
        if (active && Number.isFinite(price) && price > 0) {
          setSolPriceUsd(price);
        }
      })
      .catch(() => {
        // Silent fallback: USD estimate is simply hidden
      });
    return () => {
      active = false;
    };
  }, []);

  // Tick "Updated X min ago"
  useEffect(() => {
    if (!lastUpdatedAt) return;
    const updateElapsed = () => {
      setMinutesAgo(Math.max(0, Math.floor((Date.now() - lastUpdatedAt) / 60_000)));
    };
    updateElapsed();
    const id = window.setInterval(updateElapsed, 30_000);
    return () => window.clearInterval(id);
  }, [lastUpdatedAt]);

  const affiliateLink = useMemo(() => {
    if (!activeWallet) return "";
    const dest =
      DESTINATION_OPTIONS.find((item) => item.key === selectedDest) ?? DESTINATION_OPTIONS[0];
    return `${origin}${dest.path}?ref=${activeWallet}`;
  }, [activeWallet, origin, selectedDest]);

  const fetchEarnings = useCallback(
    async (
      walletAddress: string,
      range: AffiliateRange,
      options?: { cursor?: string | null; append?: boolean; signal?: AbortSignal }
    ) => {
      const append = Boolean(options?.append);
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        const params = new URLSearchParams({
          wallet: walletAddress,
          range,
          limit: "10",
        });
        if (options?.cursor) {
          params.set("cursor", options.cursor);
        }

        const response = await fetch(`/api/affiliate-earnings?${params.toString()}`, {
          signal: options?.signal,
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to fetch earnings.");
        }
        const data: AffiliateEarningsResponse = await response.json();
        if (!options?.signal?.aborted) {
          setEarnings((prev) =>
            append && prev
              ? {
                  ...data,
                  transactions: [...prev.transactions, ...data.transactions],
                }
              : data
          );
          setLastUpdatedAt(Date.now());
          setMinutesAgo(0);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        if (!options?.signal?.aborted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!options?.signal?.aborted) {
          if (append) setIsLoadingMore(false);
          else setIsLoading(false);
        }
      }
    },
    []
  );

  // Automatically reset and load earnings whenever active wallet or period filter changes
  useEffect(() => {
    setEarnings(null);
    setError(null);

    if (!activeWallet) {
      setIsLoading(false);
      setLastUpdatedAt(null);
      return;
    }

    const controller = new AbortController();
    fetchEarnings(activeWallet, selectedRange, { signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [activeWallet, selectedRange, fetchEarnings]);

  const handleManualWalletSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleaned = manualInput.trim();
    if (!isValidPublicKey(cleaned)) {
      setManualError(ap.manualWalletInvalid);
      setPendingManualWallet(null);
      return;
    }
    setManualError(null);
    setPendingManualWallet({
      address: cleaned,
      isOffCurve: !isOnCurvePublicKey(cleaned),
    });
  };

  const handleConfirmManualWallet = () => {
    if (!pendingManualWallet) return;
    setManualWallet(pendingManualWallet.address);
    setPendingManualWallet(null);
  };

  const handleCancelPendingWallet = () => {
    setPendingManualWallet(null);
  };

  const handleClearManualWallet = () => {
    setManualWallet(null);
    setPendingManualWallet(null);
    setManualInput("");
    setManualError(null);
    setShowQr(false);
  };

  const handleCopyLink = async () => {
    if (!affiliateLink) return;
    const ok = await copyTextWithFallback(affiliateLink);
    if (ok) {
      setCopyStatus("copied");
      setLiveAnnouncement(t.common.copied);
      setTimeout(() => setCopyStatus("idle"), 2500);
    } else {
      setCopyStatus("error");
      setLiveAnnouncement(ap.copyErrorText);
      setTimeout(() => setCopyStatus("idle"), 3500);
    }
  };

  const handleCopyTextAndLink = async () => {
    if (!affiliateLink) return;
    const bundle = `${ap.shareMessageTemplate} ${affiliateLink}`;
    const ok = await copyTextWithFallback(bundle);
    if (ok) {
      setCopyStatus("copiedBundle");
      setLiveAnnouncement(t.common.copied);
      setTimeout(() => setCopyStatus("idle"), 2500);
    } else {
      setCopyStatus("error");
      setLiveAnnouncement(ap.copyErrorText);
      setTimeout(() => setCopyStatus("idle"), 3500);
    }
  };

  const handleNativeShare = async () => {
    if (!affiliateLink || !canNativeShare) return;
    try {
      await navigator.share({
        title: ap.pageTitle,
        text: ap.shareMessageTemplate,
        url: affiliateLink,
      });
    } catch {
      // User dismissed native share sheet
    }
  };

  const handleCopyTxSig = async (sig: string) => {
    const ok = await copyTextWithFallback(sig);
    if (ok) {
      setCopiedTxSig(sig);
      setLiveAnnouncement(t.common.copied);
      setTimeout(() => setCopiedTxSig(null), 2000);
    }
  };

  const handleCopyTemplate = async (kind: "x" | "telegram", text: string) => {
    const ok = await copyTextWithFallback(text);
    if (ok) {
      setCopiedTemplate(kind);
      setLiveAnnouncement(t.common.copied);
      setTimeout(() => setCopiedTemplate(null), 2200);
    } else {
      setLiveAnnouncement(ap.copyErrorText);
    }
  };

  const scrollToGenerator = () => {
    linkGeneratorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    (tx: AffiliateTransaction) => {
      if (tx.blockTime && tx.blockTime > 0) {
        return dateFormatter.format(new Date(tx.blockTime * 1000));
      }
      if (tx.createdAtIso) {
        const parsed = Date.parse(tx.createdAtIso);
        if (!Number.isNaN(parsed)) {
          return dateFormatter.format(new Date(parsed));
        }
      }
      return "—";
    },
    [dateFormatter]
  );

  // Real commission examples from src/config/pricing.ts
  const commissionExamples = useMemo(() => {
    const standardTokenSplit = computeSplit(DEFAULT_CREATE_TOKEN_FEE_SOL);
    const burnVestingSplit = computeSplit(PRICING_SOL.burnAndEarnLockLp);
    const poolAirdropSplit = computeSplit(PRICING_SOL.createLiquidityPool);
    const reclaimSplit = computeRateSplitPercent(PRICING_SOL.reclaimSolPlatformFeeRate);

    return [
      {
        id: "standardToken",
        operation: ap.exampleRows.standardToken,
        fee: `${formatSolAmount(DEFAULT_CREATE_TOKEN_FEE_SOL)} SOL`,
        share: `${formatSolAmount(standardTokenSplit.affiliateSol, 3, 4)} SOL`,
      },
      {
        id: "burnOrVesting",
        operation: ap.exampleRows.burnOrVesting,
        fee: `${formatSolAmount(PRICING_SOL.burnAndEarnLockLp)} SOL`,
        share: `${formatSolAmount(burnVestingSplit.affiliateSol, 3, 4)} SOL`,
      },
      {
        id: "poolOrAirdrop",
        operation: ap.exampleRows.poolOrAirdrop,
        fee: `${formatSolAmount(PRICING_SOL.createLiquidityPool)} SOL`,
        share: `${formatSolAmount(poolAirdropSplit.affiliateSol, 3, 4)} SOL`,
      },
      {
        id: "reclaimSol",
        operation: ap.exampleRows.reclaimSol,
        fee: ap.exampleRows.reclaimFeeDisplay.replace("{rate}", String(reclaimSplit.totalRatePercent)),
        share: ap.exampleRows.reclaimShareDisplay.replace(
          "{rate}",
          String(reclaimSplit.affiliateRatePercent)
        ),
      },
    ];
  }, [ap.exampleRows]);

  // Multi-service simulator values
  const simulatorCalc = useMemo(() => {
    const serviceFeeSol = SIMULATOR_SERVICE_FEES[simService];
    const perReferralSol = computeSplit(serviceFeeSol).affiliateSol;
    const monthlySol = referralsPerMonth * perReferralSol;
    const monthlyUsd = solPriceUsd ? monthlySol * solPriceUsd : null;
    return { serviceFeeSol, perReferralSol, monthlySol, monthlyUsd };
  }, [simService, referralsPerMonth, solPriceUsd]);

  const shareText = ap.shareMessageTemplate;
  const xShareUrl = affiliateLink
    ? `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(affiliateLink)}`
    : "#";
  const telegramShareUrl = affiliateLink
    ? `https://t.me/share/url?url=${encodeURIComponent(affiliateLink)}&text=${encodeURIComponent(shareText)}`
    : "#";
  const whatsappShareUrl = affiliateLink
    ? `https://wa.me/?text=${encodeURIComponent(`${shareText} ${affiliateLink}`)}`
    : "#";

  const previewLinkForKit = affiliateLink || `${origin}/?ref=YOUR_SOLANA_WALLET`;
  const kitXText = ap.kitXTemplate.replace("{link}", previewLinkForKit);
  const kitTelegramText = ap.kitTelegramTemplate.replace("{link}", previewLinkForKit);

  const updatedLabel =
    lastUpdatedAt !== null
      ? minutesAgo === 0
        ? ap.updatedJustNow
        : ap.updatedMinutesAgo.replace("{min}", String(minutesAgo))
      : null;

  return (
    <div className={styles.pageContainer}>
      {/* Live region for screen readers (copy status & errors) */}
      <div className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* 1. Compact Hero */}
      <header className={styles.pageHeader}>
        <div className={styles.heroBadges} aria-label="Program highlights">
          {ap.heroBadges.map((badge, idx) => (
            <span key={idx} className={styles.heroBadge}>
              {badge}
            </span>
          ))}
        </div>
        <h1 className={styles.pageTitle}>{ap.pageTitle}</h1>
        <p className={styles.pageDescription}>{ap.pageDesc}</p>
      </header>

      {/* 2. Primary Link Generator Card */}
      <section
        id="link-generator"
        ref={linkGeneratorRef}
        className={styles.primarySection}
        aria-labelledby="affiliate-link-heading"
      >
        <Card className={styles.primaryCard}>
          <CardHeader>
            <div className={styles.cardHeaderRow}>
              <div>
                <CardTitle id="affiliate-link-heading">{ap.linkCardTitle}</CardTitle>
                <CardDescription className={styles.cardSubtitle}>
                  {ap.linkExplanation}
                </CardDescription>
              </div>
              {!connectedWallet && manualWallet && (
                <div className={styles.activeManualPill}>
                  <span className={styles.monoText}>
                    {ap.manualWalletActiveLabel}: {shortenAddress(manualWallet)}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearManualWallet}
                    className={styles.changeWalletLink}
                  >
                    {ap.changeWalletBtn}
                  </button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className={styles.cardBodyStack}>
            {/* Permanent Wallet Control & Self-Referral Safety Notices */}
            <div className={styles.noticeStack}>
              <div className={styles.warningNotice} role="note">
                <IconAlertTriangle />
                <span>{ap.exchangeWarning}</span>
              </div>
              <p className={styles.selfReferralNotice}>{ap.selfReferralNotice}</p>
            </div>

            {activeWallet ? (
              <div className={styles.linkContainer}>
                {/* Deep Link Destination Selector (horizontal snap scroll on mobile) */}
                <div className={styles.destinationBlock}>
                  <span className={styles.fieldLabel}>{ap.destinationLabel}</span>
                  <div
                    className={styles.destinationPills}
                    role="group"
                    aria-label={ap.destinationLabel}
                  >
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
                        {ap.destinations[dest.key]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Action Row: Link Input + Copy */}
                <div className={styles.linkFlexRow}>
                  <Input
                    id="affiliate-link"
                    type="text"
                    value={affiliateLink}
                    readOnly
                    aria-label={ap.linkCardTitle}
                    className={styles.linkInput}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <Button type="button" onClick={handleCopyLink} className={styles.copyButton}>
                    {copyStatus === "copied" ? <IconCheck /> : <IconCopy />}
                    <span>{copyStatus === "copied" ? t.common.copied : t.common.copy}</span>
                  </Button>
                </div>

                {copyStatus === "error" && (
                  <p className={styles.inlineError} role="alert">
                    {ap.copyErrorText}
                  </p>
                )}

                {/* Secondary Sharing Group + Tertiary QR Action */}
                <div className={styles.actionsToolbar}>
                  <div className={styles.shareGroup} role="group" aria-label={ap.shareGroupLabel}>
                    <button
                      type="button"
                      onClick={handleCopyTextAndLink}
                      className={styles.shareButton}
                    >
                      {copyStatus === "copiedBundle" ? <IconCheck /> : <IconCopy />}
                      <span>
                        {copyStatus === "copiedBundle" ? t.common.copied : ap.copyTextAndLink}
                      </span>
                    </button>
                    <a
                      href={xShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.shareButton}
                    >
                      <IconXBrand />
                      <span>{ap.shareOnX}</span>
                    </a>
                    <a
                      href={telegramShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.shareButton}
                    >
                      <IconTelegram />
                      <span>{ap.shareOnTelegram}</span>
                    </a>
                    <a
                      href={whatsappShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.shareButton}
                    >
                      <IconWhatsApp />
                      <span>{ap.shareOnWhatsApp}</span>
                    </a>
                    {canNativeShare && (
                      <button
                        type="button"
                        onClick={handleNativeShare}
                        className={styles.shareButton}
                      >
                        <IconShare />
                        <span>{ap.shareNative}</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowQr((prev) => !prev)}
                    className={styles.qrToggleBtn}
                    aria-expanded={showQr}
                  >
                    <IconQrCode />
                    <span>{showQr ? ap.hideQrBtn : ap.showQrBtn}</span>
                  </button>
                </div>

                {showQr && (
                  <div className={styles.qrPanel}>
                    <AffiliateQrCode
                      value={affiliateLink}
                      size={168}
                      label={ap.qrCodeAlt}
                      className={styles.qrSvg}
                    />
                    <p className={styles.qrCaption}>{ap.qrCaption}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.connectWalletPrompt}>
                <p className={styles.connectPromptText}>{ap.connectPrompt}</p>
                <div className={styles.connectActions}>
                  <Button
                    type="button"
                    onClick={() => setWalletModalVisible(true)}
                    className={styles.connectCta}
                  >
                    <IconWallet />
                    <span>{ap.connectWalletBtn}</span>
                  </Button>
                </div>

                <div className={styles.dividerRow} aria-hidden="true">
                  <span className={styles.dividerLine} />
                  <span className={styles.dividerText}>{ap.orPasteWallet}</span>
                  <span className={styles.dividerLine} />
                </div>

                <form
                  onSubmit={handleManualWalletSubmit}
                  className={styles.manualWalletForm}
                  noValidate
                >
                  <Input
                    id="manual-affiliate-wallet"
                    type="text"
                    value={manualInput}
                    onChange={(e) => {
                      setManualInput(e.target.value);
                      if (manualError) setManualError(null);
                      if (pendingManualWallet) setPendingManualWallet(null);
                    }}
                    placeholder={ap.manualWalletPlaceholder}
                    aria-label={ap.manualWalletPlaceholder}
                    className={styles.manualWalletInput}
                  />
                  <Button type="submit" className={styles.manualWalletBtn}>
                    {ap.manualWalletSubmit}
                  </Button>
                </form>

                {manualError && (
                  <p className={styles.inlineError} role="alert">
                    {manualError}
                  </p>
                )}

                {pendingManualWallet && (
                  <div className={styles.confirmBox} role="region" aria-live="polite">
                    <p className={styles.confirmTitle}>
                      {ap.manualWalletConfirmPrompt}{" "}
                      <strong className={styles.monoText}>
                        {shortenAddress(pendingManualWallet.address)}
                      </strong>
                    </p>
                    {pendingManualWallet.isOffCurve && (
                      <p className={styles.offCurveWarning} role="alert">
                        <IconAlertTriangle />
                        <span>{ap.manualWalletOffCurveWarning}</span>
                      </p>
                    )}
                    <div className={styles.confirmActions}>
                      <Button
                        type="button"
                        onClick={handleConfirmManualWallet}
                        className={styles.confirmBtn}
                      >
                        {ap.manualWalletConfirmBtn}
                      </Button>
                      <button
                        type="button"
                        onClick={handleCancelPendingWallet}
                        className={styles.cancelConfirmBtn}
                      >
                        {ap.manualWalletCancelBtn}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 3. On-Chain Earnings Dashboard */}
      {activeWallet && (
        <section className={styles.dashboardSection} aria-labelledby="earnings-dashboard-heading">
          <Card>
            <CardHeader>
              <div className={styles.dashboardHeaderRow}>
                <div>
                  <CardTitle id="earnings-dashboard-heading">{ap.dashboardTitle}</CardTitle>
                  <CardDescription>{ap.dashboardDesc}</CardDescription>
                </div>
                <div className={styles.dashboardControls}>
                  {updatedLabel && <span className={styles.updatedLabel}>{updatedLabel}</span>}
                  <Button
                    type="button"
                    onClick={() => fetchEarnings(activeWallet, selectedRange)}
                    disabled={isLoading}
                    className={styles.refreshButton}
                  >
                    <IconRefresh spinning={isLoading} />
                    <span>{isLoading ? ap.refreshingBtn : ap.refreshBtn}</span>
                  </Button>
                </div>
              </div>

              {/* Period Range Filter */}
              <div className={styles.rangeFilterRow} role="group" aria-label={ap.rangeFilterLabel}>
                {RANGE_OPTIONS.map((rng) => (
                  <button
                    key={rng}
                    type="button"
                    onClick={() => setSelectedRange(rng)}
                    className={`${styles.rangePill} ${
                      selectedRange === rng ? styles.rangePillActive : ""
                    }`}
                    aria-pressed={selectedRange === rng}
                  >
                    {ap.ranges[rng]}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className={styles.dashboardBody}>
              {earnings?.storageMode === "in-memory-fallback" && (
                <div className={styles.fallbackBanner} role="status">
                  <IconAlertTriangle />
                  <span>{ap.fallbackWarning}</span>
                </div>
              )}

              {isLoading && !earnings ? (
                <div className={styles.dashboardSkeleton} aria-busy="true" aria-label={t.common.loading}>
                  <div className={styles.kpiGrid}>
                    <div className={`${styles.skeletonCard} ${styles.kpiPrimary}`} />
                    <div className={styles.skeletonCard} />
                    <div className={styles.skeletonCard} />
                    <div className={styles.skeletonCard} />
                  </div>
                  <div className={styles.skeletonTable}>
                    <div className={styles.skeletonRow} />
                    <div className={styles.skeletonRow} />
                    <div className={styles.skeletonRow} />
                  </div>
                </div>
              ) : error ? (
                <p className={styles.errorText} role="alert">
                  {error}
                </p>
              ) : earnings ? (
                <div className={styles.earningsDashboard}>
                  {/* 4 KPIs with Primary Total Highlight & Tooltips */}
                  <div className={styles.kpiGrid}>
                    <div
                      className={`${styles.earningStat} ${styles.kpiPrimary}`}
                      title={ap.kpiTooltips.totalEarnings}
                    >
                      <div className={styles.statHeader}>
                        <IconTrendingUp />
                        <span>{ap.totalEarningsLabel}</span>
                      </div>
                      <p className={styles.statValuePrimary}>
                        {earnings.totalEarningsSol.toFixed(4)} SOL
                      </p>
                      <span className={styles.kpiHint}>{ap.kpiTooltips.totalEarnings}</span>
                    </div>

                    <div className={styles.earningStat} title={ap.kpiTooltips.commissionsCount}>
                      <div className={styles.statHeader}>
                        <IconHash />
                        <span>{ap.commissionsCountLabel}</span>
                      </div>
                      <p className={styles.statValue}>{earnings.commissionsCount}</p>
                      <span className={styles.kpiHint}>{ap.kpiTooltips.commissionsCount}</span>
                    </div>

                    <div className={styles.earningStat} title={ap.kpiTooltips.uniqueWallets}>
                      <div className={styles.statHeader}>
                        <IconUsers />
                        <span>{ap.uniqueWalletsLabel}</span>
                      </div>
                      <p className={styles.statValue}>{earnings.uniqueReferredWallets}</p>
                      <span className={styles.kpiHint}>{ap.kpiTooltips.uniqueWallets}</span>
                    </div>

                    <div className={styles.earningStat} title={ap.kpiTooltips.maxCommission}>
                      <div className={styles.statHeader}>
                        <IconAward />
                        <span>{ap.maxCommissionLabel}</span>
                      </div>
                      <p className={styles.statValue}>
                        {earnings.maxCommissionSol.toFixed(4)} SOL
                      </p>
                      <span className={styles.kpiHint}>{ap.kpiTooltips.maxCommission}</span>
                    </div>
                  </div>

                  <h3 className={styles.historyTitle}>{ap.historyTitle}</h3>
                  {earnings.transactions.length > 0 ? (
                    <>
                      <div className={styles.historyTable} role="table">
                        <div className={styles.historyTableHeader} role="row">
                          <div role="columnheader">{ap.dateCol}</div>
                          <div role="columnheader" className={styles.amountHeader}>
                            {ap.amountCol}
                          </div>
                          <div role="columnheader" className={styles.txHeader}>
                            {ap.txCol}
                          </div>
                        </div>
                        {earnings.transactions.map((tx) => (
                          <div key={tx.signature} className={styles.historyRow} role="row">
                            <div className={styles.historyCell} role="cell">
                              <span className={styles.mobileColLabel}>{ap.dateCol}</span>
                              <span className={styles.historyDate}>{formatTxDate(tx)}</span>
                            </div>
                            <div className={`${styles.historyCell} ${styles.amountCell}`} role="cell">
                              <span className={styles.mobileColLabel}>{ap.amountCol}</span>
                              <span className={styles.historyAmount}>
                                +{tx.amount.toFixed(4)} SOL
                              </span>
                            </div>
                            <div className={`${styles.historyCell} ${styles.txCell}`} role="cell">
                              <span className={styles.mobileColLabel}>{ap.txCol}</span>
                              <div className={styles.txActions}>
                                <span className={styles.txSigShort}>
                                  {shortenAddress(tx.signature)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyTxSig(tx.signature)}
                                  className={styles.txCopyBtn}
                                  aria-label={ap.copySignatureAria}
                                  title={ap.copySignatureAria}
                                >
                                  {copiedTxSig === tx.signature ? <IconCheck /> : <IconCopy />}
                                </button>
                                <a
                                  href={getExplorerUrl("tx", tx.signature)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.historyLink}
                                >
                                  Solscan ↗
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {earnings.hasMore && earnings.nextCursor && (
                        <div className={styles.loadMoreRow}>
                          <button
                            type="button"
                            onClick={() =>
                              fetchEarnings(activeWallet, selectedRange, {
                                cursor: earnings.nextCursor,
                                append: true,
                              })
                            }
                            disabled={isLoadingMore}
                            className={styles.loadMoreBtn}
                          >
                            {isLoadingMore ? ap.loadingMoreBtn : ap.loadMoreBtn}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.emptyStateBox}>
                      <p className={styles.noHistoryText}>{ap.noHistoryText}</p>
                      <button
                        type="button"
                        onClick={scrollToGenerator}
                        className={styles.emptyStateCta}
                      >
                        {ap.emptyStateCta}
                      </button>
                    </div>
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
          {ap.howItWorksTitle}
        </h2>
        <ol className={styles.stepsGrid}>
          {ap.steps.map((step, idx) => (
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

      {/* 5. Real SOL Commission Examples + Multi-Service Interactive Simulator */}
      <section className={styles.sectionBlock} aria-labelledby="earnings-examples-heading">
        <div className={styles.examplesLayout}>
          <Card className={styles.examplesCard}>
            <CardHeader>
              <CardTitle id="earnings-examples-heading" className={styles.iconCardTitle}>
                <IconPercent />
                <span>{ap.earningsExamplesTitle}</span>
              </CardTitle>
              <CardDescription>{ap.earningsExamplesDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.commissionTable} role="table">
                <div className={styles.commissionTableHeader} role="row">
                  <div role="columnheader">{ap.operationCol}</div>
                  <div role="columnheader" className={styles.rightCol}>
                    {ap.serviceFeeCol}
                  </div>
                  <div role="columnheader" className={styles.rightCol}>
                    {ap.yourShareCol}
                  </div>
                </div>
                {commissionExamples.map((row) => (
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
              <CardTitle>{ap.simulatorTitle}</CardTitle>
              <CardDescription>{ap.simulatorBasisNote}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.simulatorBody}>
                {/* Service selector chips */}
                <div className={styles.simServiceRow} role="group" aria-label={ap.simulatorServiceLabel}>
                  {(Object.keys(SIMULATOR_SERVICE_FEES) as SimulatorServiceKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSimService(key)}
                      className={`${styles.simChip} ${
                        simService === key ? styles.simChipActive : ""
                      }`}
                      aria-pressed={simService === key}
                    >
                      {ap.simulatorServices[key]}
                    </button>
                  ))}
                </div>

                {/* Consistent Slider + Numeric Input (both 1..500) */}
                <div className={styles.simulatorControlHeader}>
                  <label htmlFor="referrals-slider" className={styles.fieldLabel}>
                    {ap.simulatorReferralsLabel}
                  </label>
                  <input
                    id="referrals-number"
                    type="number"
                    min={1}
                    max={SIMULATOR_MAX_REFERRALS}
                    value={referralsPerMonth}
                    aria-label={ap.simulatorReferralsLabel}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (Number.isFinite(val)) {
                        setReferralsPerMonth(Math.min(SIMULATOR_MAX_REFERRALS, Math.max(1, Math.round(val))));
                      }
                    }}
                    className={styles.simulatorNumberInput}
                  />
                </div>

                <input
                  id="referrals-slider"
                  type="range"
                  min={1}
                  max={SIMULATOR_MAX_REFERRALS}
                  step={1}
                  value={referralsPerMonth}
                  aria-valuetext={ap.simulatorAriaValueText
                    .replace("{count}", String(referralsPerMonth))
                    .replace("{sol}", formatSolAmount(simulatorCalc.monthlySol, 3, 3))}
                  onChange={(e) => setReferralsPerMonth(Number(e.target.value))}
                  className={styles.simulatorSlider}
                />

                {/* Quick Presets */}
                <div className={styles.presetRow}>
                  {SIMULATOR_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReferralsPerMonth(preset)}
                      className={`${styles.presetBtn} ${
                        referralsPerMonth === preset ? styles.presetBtnActive : ""
                      }`}
                    >
                      {preset}/m
                    </button>
                  ))}
                </div>

                <div className={styles.simulatorResultBox}>
                  <span className={styles.simulatorResultLabel}>
                    {ap.simulatorMonthlyEstimate}
                  </span>
                  <div className={styles.simulatorValueRow}>
                    <strong className={styles.simulatorResultValue}>
                      {formatSolAmount(simulatorCalc.monthlySol, 3, 3)} SOL
                    </strong>
                    {simulatorCalc.monthlyUsd !== null && (
                      <span className={styles.simulatorUsdValue}>
                        ≈ ${simulatorCalc.monthlyUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })} USD
                      </span>
                    )}
                  </div>
                  <span className={styles.simulatorPerReferral}>
                    {ap.simulatorPerReferralLabel.replace(
                      "{sol}",
                      formatSolAmount(simulatorCalc.perReferralSol, 3, 4)
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 6. Promo Kit & Conduct Rules */}
      <section className={styles.sectionBlock} aria-labelledby="promo-kit-heading">
        <div className={styles.promoGrid}>
          <Card className={styles.promoCard}>
            <CardHeader>
              <CardTitle id="promo-kit-heading">{ap.promoKitTitle}</CardTitle>
              <CardDescription>{ap.promoKitDesc}</CardDescription>
            </CardHeader>
            <CardContent className={styles.promoTemplatesStack}>
              <div className={styles.templateBox}>
                <div className={styles.templateHeader}>
                  <span className={styles.templateTag}>X / Twitter</span>
                  <button
                    type="button"
                    onClick={() => handleCopyTemplate("x", kitXText)}
                    className={styles.templateCopyBtn}
                  >
                    {copiedTemplate === "x" ? <IconCheck /> : <IconCopy />}
                    <span>{copiedTemplate === "x" ? t.common.copied : t.common.copy}</span>
                  </button>
                </div>
                <p className={styles.templateText}>{kitXText}</p>
              </div>

              <div className={styles.templateBox}>
                <div className={styles.templateHeader}>
                  <span className={styles.templateTag}>Telegram</span>
                  <button
                    type="button"
                    onClick={() => handleCopyTemplate("telegram", kitTelegramText)}
                    className={styles.templateCopyBtn}
                  >
                    {copiedTemplate === "telegram" ? <IconCheck /> : <IconCopy />}
                    <span>{copiedTemplate === "telegram" ? t.common.copied : t.common.copy}</span>
                  </button>
                </div>
                <p className={styles.templateText}>{kitTelegramText}</p>
              </div>
            </CardContent>
          </Card>

          <Card className={styles.conductCard}>
            <CardHeader>
              <CardTitle>{ap.conductTitle}</CardTitle>
            </CardHeader>
            <CardContent className={styles.conductBody}>
              <ul className={styles.conductList}>
                {ap.conductRules.map((rule, idx) => (
                  <li key={idx} className={styles.conductItem}>
                    {rule}
                  </li>
                ))}
              </ul>
              <div className={styles.resourceLinks}>
                <Link href="/costs" className={styles.resourceLink}>
                  {ap.viewPricingLink} →
                </Link>
                <Link href="/documentacao" className={styles.resourceLink}>
                  {ap.viewDocsLink} →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 7. Transparency + Practical FAQ (all closed by default) */}
      <section className={styles.sectionBlock} aria-labelledby="affiliate-faq-heading">
        <div className={styles.bottomGrid}>
          <Card className={styles.infoCard}>
            <CardHeader>
              <CardTitle className={styles.iconCardTitle}>
                <IconShieldCheck />
                <span>{ap.transparentCardTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className={styles.infoCardStack}>
              <p className={styles.infoText}>{ap.commissionCardText}</p>
              <p className={styles.technicalNote}>{ap.transparentCardText}</p>
              {EXAMPLE_AFFILIATE_TX_SIGNATURE ? (
                <a
                  href={getExplorerUrl("tx", EXAMPLE_AFFILIATE_TX_SIGNATURE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.exampleTxLink}
                >
                  {ap.exampleTxLabel} ↗
                </a>
              ) : null}
            </CardContent>
          </Card>

          <Card className={styles.faqCard}>
            <CardHeader>
              <CardTitle id="affiliate-faq-heading">{ap.faqTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.faqList}>
                {ap.faqItems.map((item, idx) => (
                  <details key={idx} className={styles.faqItem}>
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

export default function AffiliatesPage() {
  return <AffiliatesContent />;
}
