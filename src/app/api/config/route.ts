import { NextResponse } from "next/server";
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT } from "@/lib/constants";

export const dynamic = "force-dynamic";


/**
 * RF06: Configuração de Rede e Taxa de Serviço.
 * Mascara chaves privadas de API caso presentes na query string do RPC_ENDPOINT.
 */
function maskRpcApiKey(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has("api-key")) {
      parsed.searchParams.set("api-key", "***REDACTED***");
    }
    return parsed.toString();
  } catch {
    return "https://api.mainnet-beta.solana.com";
  }
}

export async function GET() {
  try {
    const config = {
      rpcUrl: maskRpcApiKey(RPC_ENDPOINT),
      serviceFeeWallet: DEV_WALLET_ADDRESS.toBase58(),
      network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || "mainnet-beta",
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching configuration:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching configuration." },
      { status: 500 }
    );
  }
}
