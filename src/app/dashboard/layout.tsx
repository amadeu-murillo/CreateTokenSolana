import type { ReactNode } from "react";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata = buildRouteMetadata({
  title: 'Revoke Solana Mint & Freeze Authority — Token Security Dashboard',
  description: 'Inspect and permanently revoke Mint Authority and Freeze Authority on your Solana SPL and Token-2022 tokens for a flat 0.07 SOL fee to make your token DEX-ready.',
  path: '/dashboard',
  keywords: ['revoke mint authority solana', 'revoke freeze authority solana', 'renounce solana token ownership', 'make solana token immutable'],
});

export default function RouteLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
