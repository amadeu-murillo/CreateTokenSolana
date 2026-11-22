import { NextResponse } from "next/server";

export const revalidate = 60;

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      {
        signal: controller.signal,
        next: { revalidate: 60 },
      }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ usd: null, source: "unavailable" }, { status: 200 });
    }

    const data = (await res.json()) as { solana?: { usd?: number } };
    const usd = typeof data?.solana?.usd === "number" && data.solana.usd > 0 ? data.solana.usd : null;

    return NextResponse.json(
      { usd, source: usd ? "coingecko" : "unavailable", updatedAt: Date.now() },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
      }
    );
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({ usd: null, source: "unavailable" }, { status: 200 });
  }
}
