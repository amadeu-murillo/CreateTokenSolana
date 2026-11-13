import type { ReactNode } from "react";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata = buildRouteMetadata({
  title: 'Solana Launchpad Affiliate Program — Earn 10% Instant SOL Commissions',
  description: 'Share your personal Solana wallet referral link and earn 10% commission in SOL atomically on every token creation, liquidity pool, burn, and airdrop transaction.',
  path: '/afiliates',
  keywords: ['solana affiliate program', 'crypto launchpad referral', 'earn sol commissions', 'web3 referral program'],
});

export default function RouteLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
