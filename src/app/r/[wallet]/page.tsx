import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { isValidSolanaWalletAddress } from "@/lib/affiliateAttribution";
import {
  REFERRAL_CAMPAIGNS,
  normalizeReferralLang,
  normalizeReferralTool,
} from "@/lib/referralCampaigns";
import ReferralLandingClient from "./ReferralLandingClient";

interface ReferralRouteProps {
  params: { wallet: string };
  searchParams: { tool?: string; lang?: string };
}

export async function generateMetadata({
  params,
  searchParams,
}: ReferralRouteProps): Promise<Metadata> {
  const wallet = decodeURIComponent(params.wallet || "").trim();
  const isValid = isValidSolanaWalletAddress(wallet);
  const toolId = normalizeReferralTool(searchParams?.tool);
  const lang = normalizeReferralLang(searchParams?.lang);

  const campaign = REFERRAL_CAMPAIGNS[toolId];
  const copy = campaign[lang];

  const ogParams = new URLSearchParams({
    tool: toolId,
    lang: lang === "pt-BR" ? "pt" : "en",
  });
  if (isValid) {
    ogParams.set("wallet", wallet);
  }

  const ogImageUrl = `${SITE_URL}/api/og/ref?${ogParams.toString()}`;
  const shareUrl = `${SITE_URL}/r/${encodeURIComponent(wallet)}?tool=${toolId}&lang=${
    lang === "pt-BR" ? "pt" : "en"
  }`;

  return {
    title: { absolute: copy.metaTitle },
    description: copy.metaDescription,
    robots: { index: false, follow: true },
    openGraph: {
      type: "website",
      url: shareUrl,
      siteName: SITE_NAME,
      locale: lang === "pt-BR" ? "pt_BR" : "en_US",
      title: copy.ogTitle,
      description: copy.metaDescription,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: copy.ogTitle,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@CreateTokenSols",
      creator: "@CreateTokenSols",
      title: copy.ogTitle,
      description: copy.metaDescription,
      images: [ogImageUrl],
    },
  };
}

export default function ReferralLandingPage({ params, searchParams }: ReferralRouteProps) {
  const wallet = decodeURIComponent(params.wallet || "").trim();
  const isValidWallet = isValidSolanaWalletAddress(wallet);
  const toolId = normalizeReferralTool(searchParams?.tool);
  const campaign = REFERRAL_CAMPAIGNS[toolId];

  return (
    <ReferralLandingClient
      wallet={wallet}
      targetPath={campaign.targetPath}
      isValidWallet={isValidWallet}
    />
  );
}
