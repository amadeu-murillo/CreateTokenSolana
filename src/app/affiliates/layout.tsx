import type { ReactNode } from "react";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata = buildRouteMetadata({
  title: "Solana Launchpad Affiliate Program — Earn 30% Instant SOL Commissions",
  description:
    "Share your personal Solana wallet referral link and earn 30% commission in SOL atomically on every token creation, liquidity pool, burn, and airdrop transaction.",
  path: "/affiliates",
  keywords: [
    "solana affiliate program",
    "crypto launchpad referral",
    "earn sol commissions",
    "web3 referral program",
  ],
});

export default function AffiliatesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
