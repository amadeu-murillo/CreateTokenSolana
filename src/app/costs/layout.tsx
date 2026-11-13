import type { ReactNode } from "react";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata = buildRouteMetadata({
  title: 'Transparent Solana Fee Schedule — Standardized 0.07 SOL Service Fee',
  description: 'View our transparent, standardized 0.07 SOL service fee schedule across Token Creation, Liquidity Pool Initialization, Token Burning, Mass Airdrops, and Authority Revocation.',
  path: '/costs',
  keywords: ['cost to create solana token', 'solana liquidity pool cost', 'spl token creation fee', 'cheapest solana token creator'],
});

export default function RouteLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
