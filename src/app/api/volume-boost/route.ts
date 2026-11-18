import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { SolanaCluster } from "@/lib/constants";
import {
  checkRateLimit,
  getClientIp,
  isValidPublicKey,
  sanitizeErrorMessage,
} from "@/lib/security";
import { getSolanaConnection } from "@/lib/services/solanaHelpers";
import {
  VOLUME_BOT_PACKAGES,
  VolumeBotTierId,
  buildVolumeBotActivationTransaction,
} from "@/lib/services/volumeBotService";
import { computeSplit } from "@/config/pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      packages: Object.values(VOLUME_BOT_PACKAGES).map((pkg) => ({
        ...pkg,
        ...computeSplit(pkg.serviceFeeSol),
      })),
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`volume-boost:${clientIp}`, 15, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rateLimit.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      wallet,
      tierId = "starter100",
      workingCapitalSol = 0.25,
      subWallets = [],
      affiliate,
      network = "mainnet-beta",
    }: {
      wallet?: string;
      tierId?: VolumeBotTierId;
      workingCapitalSol?: number;
      subWallets?: string[];
      affiliate?: string | null;
      network?: SolanaCluster;
    } = body || {};

    if (!wallet || !isValidPublicKey(wallet)) {
      return NextResponse.json(
        { error: "A valid connected Solana wallet address is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(subWallets) || subWallets.length === 0) {
      return NextResponse.json(
        { error: "At least one generated sub-wallet public key is required." },
        { status: 400 }
      );
    }

    const validSubPubkeys = subWallets
      .slice(0, 20)
      .filter((addr) => isValidPublicKey(addr))
      .map((addr) => new PublicKey(addr));

    if (validSubPubkeys.length === 0) {
      return NextResponse.json(
        { error: "Invalid sub-wallet public keys provided." },
        { status: 400 }
      );
    }

    const targetCluster: SolanaCluster = network === "devnet" ? "devnet" : "mainnet-beta";
    const connection = getSolanaConnection(targetCluster);
    const userPublicKey = new PublicKey(wallet);

    const built = await buildVolumeBotActivationTransaction({
      connection,
      userPublicKey,
      tierId,
      workingCapitalSol: Math.max(0.02, Number(workingCapitalSol) || 0.25),
      subWalletPubkeys: validSubPubkeys,
      affiliate,
    });

    const base64Transaction = Buffer.from(built.transaction.serialize()).toString("base64");
    const split = computeSplit(built.serviceFeeSol);

    return NextResponse.json({
      transaction: base64Transaction,
      blockhash: built.blockhash,
      lastValidBlockHeight: built.lastValidBlockHeight,
      serviceFeeSol: built.serviceFeeSol,
      affiliateSol: split.affiliateSol,
      devWalletSol: split.devWalletSol,
      perWalletSol: built.perWalletSol,
      subWalletCount: validSubPubkeys.length,
      network: targetCluster,
    });
  } catch (error) {
    console.error("Error in /api/volume-boost:", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error, "Failed to build Volume Booster activation transaction.") },
      { status: 500 }
    );
  }
}
