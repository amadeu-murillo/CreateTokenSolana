import { NextResponse } from "next/server";
import { SERVICE_FEE_CREATE_TOKEN_SOL } from "@/lib/constants";

// RF05: Cost Management
// This endpoint calculates and returns the estimated costs for creating a token.
export async function GET() {
  try {
    // Values adjusted to reflect the new cost structure requested.
    const networkCostInSol = 0.01;
    const serviceFee = SERVICE_FEE_CREATE_TOKEN_SOL;
    const totalCost = networkCostInSol + serviceFee;

    const costs = {
      networkCost: networkCostInSol.toFixed(4), // Estimated network cost
      serviceFee: serviceFee.toFixed(4),        // Platform service fee
      totalCost: totalCost.toFixed(4),          // Total cost
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
