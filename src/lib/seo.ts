import type { Metadata } from "next";

export const SITE_URL = "https://www.createtoken.sbs";
export const SITE_NAME = "CreateTokenSolana";

export interface RouteSeoConfig {
  title: string;
  description: string;
  path: string;
  keywords: string[];
}

export function buildRouteMetadata(config: RouteSeoConfig): Metadata {
  const canonicalUrl = `${SITE_URL}${config.path === "/" ? "" : config.path}`;

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: config.title,
      description: config.description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: `${SITE_URL}/sol.png`,
          width: 512,
          height: 512,
          alt: `${SITE_NAME} — Solana Token & Liquidity Pool Launchpad`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
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
}

export const JSON_LD_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "CreateTokenSolana — Solana SPL & Token-2022 Launchpad",
      url: SITE_URL,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0.07",
        priceCurrency: "SOL",
        description:
          "Standardized 0.07 SOL service fee for creating SPL & Token-2022 tokens, initializing liquidity pools, burning tokens, airdrops, and authority management on Solana.",
      },
      featureList: [
        "No-code Solana SPL & Token-2022 Token Creator",
        "Decentralized Arweave / Irys & CDN Token Logo Storage",
        "On-Chain Raydium CPMM & Meteora Dynamic AMM Liquidity Pool Builder",
        "Permanent Token & LP Token Burner",
        "Batched Mass Airdrop Distribution Tool",
        "Mint & Freeze Authority Revocation Dashboard",
        "10% Atomic On-Chain SOL Affiliate Program",
      ],
    },
    {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/sol.png`,
      contactPoint: {
        "@type": "ContactPoint",
        email: "createtokensol@gmail.com",
        contactType: "customer support",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How much does it cost to create a Solana token on CreateTokenSolana?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "CreateTokenSolana charges a standardized 0.07 SOL platform service fee across all services (Token Creation, Liquidity Pool Creation, Token Burn, Mass Airdrop, and Authority Revocation), plus approximately 0.01 SOL in standard Solana network rent.",
          },
        },
        {
          "@type": "Question",
          name: "Does CreateTokenSolana work on both Solana Mainnet-Beta and Devnet?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Solana Mainnet-Beta is selected by default for live launches, and you can toggle to Solana Devnet at any time to test token minting, logo uploads, and liquidity pools before deploying on Mainnet.",
          },
        },
        {
          "@type": "Question",
          name: "Do I retain 100% ownership and LP tokens when creating a token or liquidity pool?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. CreateTokenSolana is 100% non-custodial. Every transaction is verified against our client-side Solana program whitelist and signed directly inside your own Phantom or Solflare wallet.",
          },
        },
      ],
    },
  ],
};
