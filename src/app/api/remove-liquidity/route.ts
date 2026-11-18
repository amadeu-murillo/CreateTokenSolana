import { NextRequest, NextResponse } from "next/server";
import { removeLiquidityTransaction } from "@/lib/services/liquidityPoolService";
import {
  checkRateLimit,
  getClientIp,
  removeLiquidityRequestSchema,
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

    const rawBody = await request.json();
    const parsed = removeLiquidityRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || "Invalid parameters for liquidity withdrawal." },
        { status: 400 }
      );
    }

    const result = await removeLiquidityTransaction(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error building remove-liquidity transaction:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(
          error,
          "Failed to prepare Raydium CPMM liquidity withdrawal transaction."
        ),
      },
      { status: 500 }
    );
  }
}
