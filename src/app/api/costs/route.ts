import { NextResponse } from "next/server";
import {
  SERVICE_FEE_CREATE_TOKEN_SOL,
  SERVICE_FEE_BURN_TOKEN_SOL,
  SERVICE_FEE_AIRDROP_SOL,
  SERVICE_FEE_MANAGE_AUTHORITY_SOL,
  SERVICE_FEE_CREATE_LP_SOL,
} from "@/lib/constants";

// RF05: Gerenciamento de Custos
// Este endpoint calcula e retorna os custos estimados para várias operações.
export async function GET() {
  try {
    const networkCostInSol = 0.01; // Custo de rede genérico estimado

    const costs = {
      createToken: (networkCostInSol + SERVICE_FEE_CREATE_TOKEN_SOL).toFixed(4),
      burnToken: (networkCostInSol + SERVICE_FEE_BURN_TOKEN_SOL).toFixed(4),
      airdrop: (networkCostInSol + SERVICE_FEE_AIRDROP_SOL).toFixed(4), // Custo base por lote
      manageAuthority: (networkCostInSol + SERVICE_FEE_MANAGE_AUTHORITY_SOL).toFixed(4),
      createLiquidityPool: (networkCostInSol + SERVICE_FEE_CREATE_LP_SOL).toFixed(4),
    };

    return NextResponse.json(costs);
  } catch (error) {
    console.error("Erro ao calcular custos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao calcular custos." },
      { status: 500 }
    );
  }
}
