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
      reclaimSolPlatformFeeRate: PRICING_SOL.reclaimSolPlatformFeeRate,
      airdrop: PRICING_SOL.massAirdropPerBatch.toFixed(2),
      holdersSnapshot: PRICING_SOL.holdersSnapshotAddon.toFixed(2),
      manageAuthority: PRICING_SOL.revokeAuthorityStandalone.toFixed(2),
      claimWithheldTax: PRICING_SOL.claimWithheldTaxPerBatch.toFixed(2),
      createLiquidityPool: PRICING_SOL.createLiquidityPool.toFixed(2),
      removeLiquidity: PRICING_SOL.withdrawLiquiditySol.toFixed(2),
      jitoAtomicBundle: PRICING_SOL.jitoAtomicBundle.toFixed(2),
      jitoMultiWalletBundle: PRICING_SOL.jitoMultiWalletBundle.toFixed(2),
      vanityMint: PRICING_SOL.vanityCustom3To4Chars.toFixed(2),
      volumeBotStarter100: PRICING_SOL.volumeBotStarter100.toFixed(2),
      volumeBotGrowth300: PRICING_SOL.volumeBotGrowth300.toFixed(2),
      volumeBotTrending750: PRICING_SOL.volumeBotTrending750.toFixed(2),
      tokenVestingLock: PRICING_SOL.tokenVestingLock.toFixed(2),
      blinkSwapServiceFeeSol: PRICING_SOL.blinkSwapServiceFeeSol.toFixed(3),
      networkRent: networkCostInSol.toFixed(5),
      schedule: PRICING_SCHEDULE_TABLE,
    };

    return NextResponse.json(costs, { status: 200 });
  } catch (error) {
    console.error("Error computing costs:", error);
    return NextResponse.json({ error: "Failed to compute costs." }, { status: 500 });
  }
}
