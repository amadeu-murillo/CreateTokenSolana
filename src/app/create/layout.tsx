import type { ReactNode } from "react";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata = buildRouteMetadata({
  title: "Create Solana SPL & Token-2022 Tokens — No-Code Token Creator",
  description:
    "Deploy custom SPL and Token-2022 tokens on Solana Mainnet-Beta or Devnet with Arweave/Irys metadata, transfer fee extensions, and instant authority revocation.",
  path: "/create",
  keywords: [
    "create solana token",
    "spl token creator",
    "token 2022 generator",
    "mint solana token no code",
  ],
});

export default function CreateTokenLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
