import type { ReactNode } from "react";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata = buildRouteMetadata({
  title: 'Create Solana Liquidity Pool — Raydium CPMM & Meteora Dynamic AMM',
  description: 'Initialize an on-chain Solana Liquidity Pool on Raydium CPMM or Meteora Dynamic AMM for a flat 0.07 SOL fee. Automatic WSOL wrapping, Freeze Authority revocation, and LP token minting.',
  path: '/add-liquidity',
  keywords: ['create solana liquidity pool', 'raydium cpmm pool creator', 'meteora dynamic amm pool', 'add liquidity solana token', 'mint solana lp tokens'],
});

export default function RouteLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
