import { NextResponse } from "next/server";
import { SERVICE_FEE_CREATE_TOKEN_SOL } from "@/lib/constants";

// RF05: Gestão de Custos
// Este endpoint calcula e retorna os custos estimados para a criação de um token.
export async function GET() {
  try {
    // Valores ajustados para refletir a nova estrutura de custos solicitada.
    const networkCostInSol = 0.01;
    const serviceFee = SERVICE_FEE_CREATE_TOKEN_SOL;
    const totalCost = networkCostInSol + serviceFee;

    const costs = {
      networkCost: networkCostInSol.toFixed(4), // Custo estimado da rede
      serviceFee: serviceFee.toFixed(4),       // Taxa de serviço da plataforma
      totalCost: totalCost.toFixed(4),         // Custo total
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
