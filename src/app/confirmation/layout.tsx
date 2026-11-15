import type { ReactNode } from "react";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata = buildRouteMetadata({
  title: "Token Deployment Confirmation & Next Steps — CreateTokenSolana",
  description:
    "View your verified on-chain Solana token mint address, transaction signature, and proceed to liquidity pool initialization, LP burning, and community airdrops.",
  path: "/confirmation",
  keywords: [
    "solana token confirmation",
    "solscan token verification",
    "post launch liquidity steps",
  ],
});

export default function ConfirmationLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
