import { NextResponse } from "next/server";
import { PRICING_SCHEDULE_TABLE, PRICING_SOL } from "@/config/pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const networkCostInSol = 0.00204;

    const costs = {
      createToken: PRICING_SOL.baseMint.toFixed(2),
      burnToken: PRICING_SOL.burnStandard.toFixed(2),
      burnAndEarn: PRICING_SOL.burnAndEarnLockLp.toFixed(2),
      airdrop: PRICING_SOL.massAirdropPerBatch.toFixed(2),
      holdersSnapshot: PRICING_SOL.holdersSnapshotAddon.toFixed(2),
      manageAuthority: PRICING_SOL.revokeAuthorityStandalone.toFixed(2),
      claimWithheldTax: PRICING_SOL.claimWithheldTaxPerBatch.toFixed(2),
      createLiquidityPool: PRICING_SOL.createLiquidityPool.toFixed(2),
      removeLiquidity: PRICING_SOL.withdrawLiquiditySol.toFixed(2),
      jitoAtomicBundle: PRICING_SOL.jitoAtomicBundle.toFixed(2),
      vanityMint: PRICING_SOL.vanityCustom3To4Chars.toFixed(2),
      networkRent: networkCostInSol.toFixed(5),
      schedule: PRICING_SCHEDULE_TABLE,
    };

    return NextResponse.json(costs, { status: 200 });
  } catch (error) {
    console.error("Error computing costs:", error);
    return NextResponse.json({ error: "Failed to compute costs." }, { status: 500 });
  }
}
