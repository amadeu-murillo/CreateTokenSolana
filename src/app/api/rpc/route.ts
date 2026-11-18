import { NextRequest, NextResponse } from "next/server";
import { SolanaCluster } from "@/lib/constants";
import { executeResilientSolanaRpc } from "@/lib/services/solanaHelpers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const clusterParam = request.nextUrl.searchParams.get("cluster");
    const cluster: SolanaCluster = clusterParam === "devnet" ? "devnet" : "mainnet-beta";

    const rawBody = await request.text();
    if (!rawBody) {
      return NextResponse.json(
        { jsonrpc: "2.0", error: { code: -32600, message: "Empty JSON-RPC body" }, id: "1" },
        { status: 200 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: "1" },
        { status: 200 }
      );
    }

    const responsePayload = await executeResilientSolanaRpc(parsed, cluster);

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Internal RPC proxy error",
        },
        id: "1",
      },
      { status: 200 }
    );
  }
}
