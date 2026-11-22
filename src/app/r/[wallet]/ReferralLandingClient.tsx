"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getOrCreateAffiliateSessionId,
  persistAffiliateRef,
} from "@/lib/affiliateAttribution";
import { trackEvent } from "@/lib/analytics";

interface ReferralLandingClientProps {
  wallet: string;
  targetPath: string;
  isValidWallet: boolean;
}

export default function ReferralLandingClient({
  wallet,
  targetPath,
  isValidWallet,
}: ReferralLandingClientProps) {
  const router = useRouter();

  useEffect(() => {
    if (isValidWallet) {
      persistAffiliateRef(wallet);
      trackEvent("affiliate_ref_captured", { has_ref: true, source: "rich_ref_link" });
      fetch("/api/affiliate-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateWallet: wallet,
          eventType: "click",
          sessionHash: getOrCreateAffiliateSessionId(),
          path: targetPath,
        }),
      }).catch(() => {});
    }

    const destination = isValidWallet
      ? `${targetPath}?ref=${encodeURIComponent(wallet)}`
      : targetPath;
    router.replace(destination);
  }, [wallet, targetPath, isValidWallet, router]);

  return (
    <div
      style={{
        minHeight: "55vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        textAlign: "center",
        padding: "2rem 1rem",
      }}
    >
      <p style={{ fontSize: "1.05rem", fontWeight: 600, color: "#f4f4f5" }}>
        Redirecting to CreateTokenSolana…
      </p>
      <p style={{ fontSize: "0.88rem", color: "#a1a1aa" }}>
        100% non-custodial Solana launchpad · Loading your selected tool.
      </p>
    </div>
  );
}
