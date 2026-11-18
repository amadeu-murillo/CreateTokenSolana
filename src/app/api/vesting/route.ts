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
  claimVestingLockTransaction,
  createVestingLockTransaction,
  fetchOnChainVestingLocksForMint,
} from "@/lib/services/vestingService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mint = (searchParams.get("mint") || "").trim();
    const network: SolanaCluster =
      searchParams.get("network") === "devnet" ? "devnet" : "mainnet-beta";

    if (!mint || !isValidPublicKey(mint)) {
      return NextResponse.json({ locks: [] }, { status: 200 });
    }

    const connection = getSolanaConnection(network);
    const locks = await fetchOnChainVestingLocksForMint(connection, new PublicKey(mint));
    return NextResponse.json({ mint, network, locks }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error, "Failed to query on-chain vesting locks."), locks: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`vesting:${clientIp}`, 15, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rateLimit.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const action = body?.action === "claim" ? "claim" : "lock";
    const {
      mint,
      amount,
      unlockTimestamp,
      beneficiary,
      wallet,
      programId,
      affiliate,
      network = "mainnet-beta",
    } = body || {};

    if (!wallet || !isValidPublicKey(wallet)) {
      return NextResponse.json(
        { error: "A valid connected Solana wallet address is required." },
        { status: 400 }
      );
    }

    if (!mint || !isValidPublicKey(mint)) {
      return NextResponse.json(
        { error: "A valid token or LP Mint address is required." },
        { status: 400 }
      );
    }

    if (!unlockTimestamp || Number(unlockTimestamp) <= 0) {
      return NextResponse.json(
        { error: "A valid unlock timestamp is required." },
        { status: 400 }
      );
    }

    const targetCluster: SolanaCluster = network === "devnet" ? "devnet" : "mainnet-beta";

    if (action === "claim") {
      const claimRes = await claimVestingLockTransaction({
        mint,
        unlockTimestamp: Number(unlockTimestamp),
        wallet,
        beneficiary,
        programId,
        network: targetCluster,
      });
      return NextResponse.json(claimRes, { status: 200 });
    }

    const lockRes = await createVestingLockTransaction({
      mint,
      amount,
      unlockTimestamp: Number(unlockTimestamp),
      beneficiary,
      wallet,
      programId,
      affiliate,
      network: targetCluster,
    });

    return NextResponse.json(lockRes, { status: 200 });
  } catch (error) {
    console.error("Error in /api/vesting:", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error, "Failed to build Token Vesting / Lock transaction.") },
      { status: 500 }
    );
  }
}
