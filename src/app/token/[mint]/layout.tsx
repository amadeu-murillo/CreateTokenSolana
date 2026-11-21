import type { ReactNode } from "react";
import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: { mint: string };
}): Promise<Metadata> {
  const mint = typeof params?.mint === "string" ? params.mint.trim() : "";
  const shortMint = mint.length > 12 ? `${mint.slice(0, 6)}...${mint.slice(-4)}` : mint;
  const title = shortMint
    ? `Solana Token ${shortMint} — On-Chain Verification | ${SITE_NAME}`
    : `Solana Token Verification | ${SITE_NAME}`;
  const description =
    "Inspect live on-chain Solana SPL and Token-2022 metadata, Mint & Freeze Authority security status, and verified vesting locks.";
  const pageUrl = mint ? `${SITE_URL}/token/${encodeURIComponent(mint)}` : SITE_URL;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: SITE_NAME,
      type: "website",
    },
    robots: {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
      },
    },
  };
}

export default function TokenMintLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
