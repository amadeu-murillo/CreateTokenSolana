import { NextRequest, NextResponse } from "next/server";
import { removeLiquidityTransaction } from "@/lib/services/liquidityPoolService";
import {
  checkRateLimit,
  getClientIp,
   isValidPublicKey,
  sanitizeErrorMessage,
} from "@/lib/security";

export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`remove-liquidity:${clientIp}`, 15, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Please wait ${rateLimit.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      baseMint,
      lpMint,
      withdrawPercentage = 100,
      wallet,
      programId,
      affiliate,
      network = "mainnet-beta",
    } = body || {};

    if (!baseMint || !isValidPublicKey(baseMint)) {
      return NextResponse.json(
        { error: "A valid Token or Pool Mint address is required." },
        { status: 400 }
      );
    }

    if (!wallet || !isValidPublicKey(wallet)) {
      return NextResponse.json(
        { error: "A valid connected Solana wallet address is required." },
        { status: 400 }
      );
    }

    const result = await removeLiquidityTransaction({
      baseMint,
      lpMint: lpMint && isValidPublicKey(lpMint) ? lpMint : undefined,
      withdrawPercentage: Number(withdrawPercentage) || 100,
      wallet,
      programId,
      affiliate,
      network: network === "devnet" ? "devnet" : "mainnet-beta",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error building remove-liquidity transaction:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(
          error,
          "Failed to prepare liquidity withdrawal transaction."
        ),
      },
      { status: 500 }
    );
  }
}
