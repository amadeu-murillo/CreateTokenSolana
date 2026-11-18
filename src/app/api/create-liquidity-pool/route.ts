import { NextRequest, NextResponse } from "next/server";
import { createLiquidityPoolTransaction } from "@/lib/services/liquidityPoolService";
import {
  checkRateLimit,
  createLiquidityPoolRequestSchema,
  getClientIp,
  sanitizeErrorMessage,
} from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`create-lp:${clientIp}`, 10, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please try again in ${rateLimit.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const rawBody = await request.json();
    const parsed = createLiquidityPoolRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || "Invalid parameters for liquidity pool creation." },
        { status: 400 }
      );
    }

    const result = await createLiquidityPoolTransaction(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in /api/create-liquidity-pool:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(
          error,
          "Internal server error while preparing the Raydium CPMM liquidity pool transaction."
        ),
      },
      { status: 500 }
    );
  }
}
