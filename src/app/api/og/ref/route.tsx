import { ImageResponse } from "next/og";
import {
  REFERRAL_CAMPAIGNS,
  normalizeReferralLang,
  normalizeReferralTool,
} from "@/lib/referralCampaigns";

const BASE58_WALLET_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const toolId = normalizeReferralTool(searchParams.get("tool"));
  const lang = normalizeReferralLang(searchParams.get("lang"));
  const rawWallet = searchParams.get("wallet")?.trim() || "";
  const shortWallet = BASE58_WALLET_RE.test(rawWallet)
    ? `${rawWallet.slice(0, 4)}…${rawWallet.slice(-4)}`
    : null;

  const campaign = REFERRAL_CAMPAIGNS[toolId];
  const copy = campaign[lang];
  const isPt = lang === "pt-BR";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          backgroundColor: "#09090B",
          backgroundImage:
            "radial-gradient(circle at 12% 15%, rgba(153, 69, 255, 0.28) 0%, transparent 45%), radial-gradient(circle at 88% 85%, rgba(20, 241, 149, 0.22) 0%, transparent 48%)",
          color: "#FAFAFA",
          fontFamily: "Inter, system-ui, sans-serif",
          border: "2px solid #27272A",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #9945FF 0%, #00D1FF 50%, #14F195 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#09090B",
                fontWeight: 900,
                fontSize: "24px",
              }}
            >
              S
            </div>
            <span style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em" }}>
              CreateTokenSolana
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 20px",
              borderRadius: "999px",
              backgroundColor: "rgba(20, 241, 149, 0.14)",
              border: `1px solid ${campaign.accentColor}`,
              color: campaign.accentColor,
              fontSize: "20px",
              fontWeight: 700,
            }}
          >
            {copy.badge}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1020px" }}>
          <div
            style={{
              fontSize: "58px",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "#FFFFFF",
            }}
          >
            {copy.ogTitle}
          </div>
          <div
            style={{
              fontSize: "26px",
              lineHeight: 1.4,
              color: "#D4D4D8",
              fontWeight: 400,
            }}
          >
            {copy.ogSubtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            paddingTop: "24px",
            borderTop: "1px solid #27272A",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 24px",
                borderRadius: "12px",
                backgroundColor: campaign.accentColor,
                color: "#09090B",
                fontSize: "22px",
                fontWeight: 800,
              }}
            >
              {copy.ogHighlight}
            </div>
            <span style={{ fontSize: "20px", color: "#A1A1AA", fontWeight: 600 }}>
              {isPt ? "100% Não-Custodial · Solana Mainnet" : "100% Non-Custodial · Solana Mainnet"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "19px",
              color: "#E4E4E7",
              fontFamily: "monospace",
            }}
          >
            {shortWallet ? (
              <span>{isPt ? `Convite: ${shortWallet}` : `Invited by ${shortWallet}`}</span>
            ) : (
              <span>www.createtokensol.store</span>
            )}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
