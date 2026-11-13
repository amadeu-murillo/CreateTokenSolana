import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import AppShell from "@/components/AppShell";
import { JSON_LD_STRUCTURED_DATA, SITE_NAME, SITE_URL } from "@/lib/seo";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#09090B",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Create Token Solana — No-Code SPL & Token-2022 Launchpad + Liquidity Pool Builder",
    template: "%s | CreateTokenSolana",
  },
  description:
    "Create your Solana SPL or Token-2022 token in under 60 seconds for a flat 0.07 SOL fee. Upload permanent Arweave/Irys metadata, initialize Raydium & Meteora liquidity pools, burn LP tokens, run mass airdrops, and revoke authorities.",
  keywords: [
    "create solana token",
    "solana token creator",
    "spl token generator",
    "token 2022 creator",
    "solana meme coin creator",
    "create raydium liquidity pool",
    "meteora liquidity pool builder",
    "burn solana lp tokens",
    "solana mass airdrop tool",
    "revoke mint authority solana",
    "revoke freeze authority solana",
    "createtoken.sbs",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: "KgtGmUrAXO4vF6RITCjOmdyXvH3Bh4zzf01pDYs2pbc",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Create Token Solana — No-Code SPL & Token-2022 Launchpad + Liquidity Pool Builder",
    description:
      "Launch custom SPL & Token-2022 tokens, store permanent Arweave metadata, and initialize on-chain Liquidity Pools on Solana Mainnet-Beta and Devnet.",
    images: [
      {
        url: `${SITE_URL}/sol.png`,
        width: 512,
        height: 512,
        alt: "CreateTokenSolana Launchpad",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Token Solana — SPL & Token-2022 Launchpad + AMM Pool Builder",
    description:
      "Create SPL & Token-2022 tokens, initialize Raydium/Meteora liquidity pools, burn LP tokens, and distribute airdrops on Solana for a flat 0.07 SOL fee.",
    images: [`${SITE_URL}/sol.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_STRUCTURED_DATA) }}
        />
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-17652797085"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17652797085');
          `}
        </Script>
      </head>
      <body className="dark">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
