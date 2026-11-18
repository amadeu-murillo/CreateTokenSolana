import { NextRequest, NextResponse } from "next/server";
import { discoverUserLiquidityPositions } from "@/lib/services/liquidityPoolService";
import {
  checkRateLimitAsync,
  getClientIp,
  isValidPublicKey,
  sanitizeErrorMessage,
} from "@/lib/security";
import { SolanaCluster } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = await checkRateLimitAsync(`lp-positions:${clientIp}`, 30, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Please wait ${rateLimit.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet")?.trim() || "";
    const networkParam = searchParams.get("network")?.trim();
    const extraMintsParam = searchParams.get("mints")?.trim() || "";

    if (!wallet || !isValidPublicKey(wallet)) {
      return NextResponse.json(
        { error: "A valid Solana wallet address is required." },
        { status: 400 }
      );
    }

    const network: SolanaCluster = networkParam === "devnet" ? "devnet" : "mainnet-beta";
    const extraMints = extraMintsParam
      ? extraMintsParam
          .split(",")
          .map((m) => m.trim())
          .filter(isValidPublicKey)
      : [];

    const positions = await discoverUserLiquidityPositions(wallet, network, extraMints);
    return NextResponse.json({ positions, network });
  } catch (error) {
    console.error("Error in GET /api/liquidity-positions:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(
          error,
          "Failed to discover on-chain liquidity positions."
        ),
        positions: [],
      },
      { status: 500 }
    );
  }
}
