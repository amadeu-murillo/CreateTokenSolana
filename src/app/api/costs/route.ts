import { NextResponse } from "next/server";
import {
  SERVICE_FEE_CREATE_TOKEN_SOL,
  SERVICE_FEE_BURN_TOKEN_SOL,
  SERVICE_FEE_AIRDROP_SOL,
  SERVICE_FEE_MANAGE_AUTHORITY_SOL,
  SERVICE_FEE_CREATE_LP_SOL,
  SERVICE_FEE_REMOVE_LP_SOL,
} from "@/lib/constants";

export async function GET() {
  try {
    const networkCostInSol = 0.01;

    const costs = {
      createToken: (networkCostInSol + SERVICE_FEE_CREATE_TOKEN_SOL).toFixed(4),
      burnToken: (networkCostInSol + SERVICE_FEE_BURN_TOKEN_SOL).toFixed(4),
      airdrop: (networkCostInSol + SERVICE_FEE_AIRDROP_SOL).toFixed(4),
      manageAuthority: (networkCostInSol + SERVICE_FEE_MANAGE_AUTHORITY_SOL).toFixed(4),
      createLiquidityPool: (networkCostInSol + SERVICE_FEE_CREATE_LP_SOL).toFixed(4),
      removeLiquidity: (networkCostInSol + SERVICE_FEE_REMOVE_LP_SOL).toFixed(4),
    };

    return NextResponse.json(costs);
  } catch (error) {
    console.error("Error calculating costs:", error);
    return NextResponse.json(
      { error: "Internal server error while calculating costs." },
      { status: 500 }
    );
  }
}
