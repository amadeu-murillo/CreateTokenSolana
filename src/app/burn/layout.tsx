import type { ReactNode } from "react";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata = buildRouteMetadata({
  title: 'Burn Solana Tokens & LP Tokens — Permanent Supply & Liquidity Lock',
  description: 'Permanently burn Solana SPL, Token-2022, or Raydium/Meteora LP tokens on-chain for a flat 0.07 SOL fee to lock liquidity and prove rug-pull immunity.',
  path: '/burn',
  keywords: ['burn solana tokens', 'burn lp tokens solana', 'lock raydium liquidity', 'solana token burner', 'token 2022 burn tool'],
});

export default function RouteLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
