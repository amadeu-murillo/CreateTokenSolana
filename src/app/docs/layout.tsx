import type { ReactNode } from "react";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata = buildRouteMetadata({
  title: "Solana Token & Liquidity Pool Documentation — Complete Creator Guide",
  description:
    "Step-by-step technical documentation on launching SPL & Token-2022 tokens, uploading Arweave metadata, creating Raydium/Meteora liquidity pools, and locking LP tokens.",
  path: "/docs",
  keywords: [
    "how to create a solana token",
    "how to add liquidity on raydium",
    "token 2022 transfer fee guide",
    "solana tokenomics documentation",
  ],
});

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
