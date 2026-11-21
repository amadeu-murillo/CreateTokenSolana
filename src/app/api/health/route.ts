import { NextResponse } from "next/server";
import {
  DEV_WALLET_ADDRESS_STRING,
  STANDARD_SERVICE_FEE_SOL,
  getRpcEndpoint,
} from "@/lib/constants";
import { getSolanaConnection } from "@/lib/services/solanaHelpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  try {
    const connection = getSolanaConnection("mainnet-beta");
    const slot = await connection.getSlot("confirmed");
    const latencyMs = Date.now() - start;

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      network: {
        defaultCluster: "mainnet-beta",
        mainnetRpcConfigured: Boolean(process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL),
        currentSlot: slot,
        rpcLatencyMs: latencyMs,
      },
      fees: {
        standardizedFeeSol: STANDARD_SERVICE_FEE_SOL,
        devWalletRecipient: DEV_WALLET_ADDRESS_STRING,
      },
      storage: {
        irysServerKeyConfigured: Boolean(process.env.IRYS_UPLOADER_PRIVATE_KEY),
        cloudinaryFallbackReady: Boolean(
          process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET
        ),
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "RPC health check failed.",
        rpcEndpoint: getRpcEndpoint("mainnet-beta").replace(/api[-_]?key=[^&]+/gi, "api-key=***"),
      },
      { status: 503 }
    );
  }
}
