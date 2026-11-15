import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import AppShell from "@/components/AppShell";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const PRIMARY_DOMAIN = SITE_URL || "https://www.createtoken.sbs";
const VERCEL_DOMAIN = "https://createtokensol.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#09090B",
};

export const metadata: Metadata = {
  metadataBase: new URL(PRIMARY_DOMAIN),
  title: {
    default:
      "Solana Token Creator — Create SPL Token & Launch Solana Memecoin | No Code Token Builder",
    template: "%s | Solana Token Creator — CreateTokenSolana",
  },
  description:
    "The #1 No Code Token Builder on Solana. Create SPL Token or Token-2022 assets, launch your Solana Memecoin in under 60 seconds with 100/100 RugCheck security, permanent Arweave metadata, Raydium/Meteora Liquidity Pools, LP Burn, and Mass Airdrops.",
  applicationName: SITE_NAME,
  category: "Web3 & Blockchain Development Tools",
  keywords: [
    "Solana Token Creator",
    "Create SPL Token",
    "Launch Solana Memecoin",
    "No Code Token Builder",
    "Solana Token-2022 Generator",
    "SPL Token Minter",
    "Create Raydium Liquidity Pool",
    "Meteora Liquidity Pool Builder",
    "Solana Meme Coin Launchpad",
    "Revoke Mint Freeze Authority Solana",
    "Burn Solana LP Tokens",
    "Solana Mass Airdrop Tool",
    "createtoken.sbs",
    "createtokensol.vercel.app",
  ],
  authors: [{ name: SITE_NAME, url: PRIMARY_DOMAIN }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: PRIMARY_DOMAIN,
    languages: {
      en: `${PRIMARY_DOMAIN}/?lang=en`,
      es: `${PRIMARY_DOMAIN}/?lang=es`,
      ru: `${PRIMARY_DOMAIN}/?lang=ru`,
      zh: `${PRIMARY_DOMAIN}/?lang=zh`,
      "pt-BR": `${PRIMARY_DOMAIN}/?lang=pt-BR`,
      "x-default": PRIMARY_DOMAIN,
    },
  },
  verification: {
    google: "KgtGmUrAXO4vF6RITCjOmdyXvH3Bh4zzf01pDYs2pbc",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["es_ES", "ru_RU", "zh_CN", "pt_BR"],
    url: PRIMARY_DOMAIN,
    siteName: SITE_NAME,
    title:
      "Solana Token Creator — Create SPL Token & Launch Solana Memecoin (No Code Token Builder)",
    description:
      "Create SPL Token or Token-2022 on Solana with zero coding. Launch Solana Memecoins with 100/100 RugCheck security, Arweave metadata, and instant Raydium/Meteora Liquidity Pools.",
    images: [
      {
        url: `${PRIMARY_DOMAIN}/sol.png`,
        secureUrl: `${PRIMARY_DOMAIN}/sol.png`,
        width: 1200,
        height: 630,
        alt: "CreateTokenSolana — Solana Token Creator & No Code SPL Token Builder",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solana Token Creator — Create SPL Token & Launch Solana Memecoin",
    description:
      "No Code Token Builder for Solana Mainnet-Beta & Devnet. Mint SPL & Token-2022 tokens, lock Arweave metadata, create AMM liquidity pools, burn LP, and run mass airdrops.",
    images: [
      {
        url: `${PRIMARY_DOMAIN}/sol.png`,
        alt: "CreateTokenSolana — No Code Solana Token Creator",
      },
    ],
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

const WEB3_SOFTWARE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${PRIMARY_DOMAIN}/#software`,
      name: "CreateTokenSolana — Solana Token Creator & No Code SPL Token Builder",
      alternateName: ["CreateTokenSolana", "Solana Token Creator", "No Code Token Builder"],
      url: PRIMARY_DOMAIN,
      sameAs: [VERCEL_DOMAIN],
      applicationCategory: "FinanceApplication",
      applicationSubCategory: "Web3 Token Creator & DeFi Launchpad",
      operatingSystem: "Web, Solana Blockchain (Mainnet-Beta & Devnet)",
      inLanguage: ["en", "es", "ru", "zh", "pt-BR"],
      isAccessibleForFree: true,
      description:
        "No-code Web3 dApp to create Solana SPL and Token-2022 tokens, launch Solana memecoins with 100/100 RugCheck security, upload permanent Arweave metadata, initialize Raydium/Meteora liquidity pools, burn LP tokens, and execute mass airdrops.",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "0.10",
        highPrice: "0.55",
        priceCurrency: "SOL",
        offerCount: 6,
        description:
          "Modular on-chain token creation starting at 0.10 SOL base mint fee, with optional Freeze/Mint authority revocation, immutable Arweave metadata, and 30% instant affiliate split.",
      },
      featureList: [
        "Solana Token Creator (Standard SPL & Token-2022 Tax Token Extensions)",
        "No Code Token Builder with 100/100 RugCheck Security Score",
        "Permanent Decentralized Arweave / Irys Metadata & Logo Hosting",
        "Raydium CPMM & Meteora Dynamic AMM Liquidity Pool Initialization",
        "On-Chain LP & SPL Token Burn with Verified PNG Certificate",
        "Solana Account Rent Recovery (Reclaim SOL from Empty ATAs)",
        "Batched Mass Airdrop Tool with Automatic ATA Creation",
        "30% Atomic On-Chain Affiliate Commission Program",
      ],
      screenshot: `${PRIMARY_DOMAIN}/sol.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${PRIMARY_DOMAIN}/#website`,
      url: PRIMARY_DOMAIN,
      name: SITE_NAME,
      inLanguage: ["en", "es", "ru", "zh", "pt-BR"],
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: PRIMARY_DOMAIN,
        logo: {
          "@type": "ImageObject",
          url: `${PRIMARY_DOMAIN}/sol.png`,
        },
      },
    },
  ],
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEB3_SOFTWARE_JSON_LD) }}
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
