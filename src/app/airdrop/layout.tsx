import type { ReactNode } from "react";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata = buildRouteMetadata({
  title: 'Solana Mass Airdrop Tool — Batched SPL & Token-2022 Multisender',
  description: 'Distribute SPL and Token-2022 tokens to hundreds of Solana wallets in atomic batches with automatic Associated Token Account (ATA) creation for 0.07 SOL per batch.',
  path: '/airdrop',
  keywords: ['solana mass airdrop tool', 'solana multisender', 'batch send spl tokens', 'token 2022 airdrop', 'solana community token distribution'],
});

export default function RouteLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
