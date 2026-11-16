import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import AppShell from "@/components/AppShell";
import {
  SITE_NAME,
  SITE_URL,
  MULTILINGUAL_ROUTE_SEO,
  getLanguageAlternates,
  JSON_LD_STRUCTURED_DATA,
} from "@/lib/seo";

const PRIMARY_DOMAIN = SITE_URL;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#09090B",
};

const homeSeo = MULTILINGUAL_ROUTE_SEO["/"];
const allHomeKeywords = Array.from(
  new Set([
    ...homeSeo.en.keywords,
    ...homeSeo.es.keywords,
    ...homeSeo.ru.keywords,
    ...homeSeo.zh.keywords,
    ...homeSeo["pt-BR"].keywords,
    "www.createtokensol.store",
    "createtokensol.store",
    "createtoken.sbs",
    "createtokensol.vercel.app",
  ])
);

export const metadata: Metadata = {
  metadataBase: new URL(PRIMARY_DOMAIN),
  title: {
    default: homeSeo.en.title,
    template: `%s | ${SITE_NAME}`,
  },
  description: homeSeo.en.description,
  applicationName: SITE_NAME,
  category: "Web3 & Blockchain Development Tools",
  keywords: allHomeKeywords,
  authors: [{ name: SITE_NAME, url: PRIMARY_DOMAIN }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: PRIMARY_DOMAIN,
    languages: getLanguageAlternates(PRIMARY_DOMAIN),
  },
  verification: {
    google: [
      "Rn6YsjYWjAnnHv7Qn_TuE4tLy1cxjO_LvybiUCOixYY",
      "KgtGmUrAXO4vF6RITCjOmdyXvH3Bh4zzf01pDYs2pbc",
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["es_ES", "ru_RU", "zh_CN", "pt_BR"],
    url: PRIMARY_DOMAIN,
    siteName: SITE_NAME,
    title: homeSeo.en.title,
    description: homeSeo.en.description,
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
    title: homeSeo.en.title,
    description: homeSeo.en.description,
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
