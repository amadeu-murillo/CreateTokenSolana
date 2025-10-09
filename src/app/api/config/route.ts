import { NextResponse } from "next/server";
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT } from "@/lib/constants";

// RF06: Network Configuration and Service Fee
// This endpoint returns the RPC URL and the wallet address for the service fee.
export async function GET() {
  try {
    const config = {
      rpcUrl: RPC_ENDPOINT,
      serviceFeeWallet: DEV_WALLET_ADDRESS.toBase58(),
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
