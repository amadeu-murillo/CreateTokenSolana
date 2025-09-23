import { NextResponse } from "next/server";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getMinimumBalanceForRentExemptMint } from "@solana/spl-token";
import { RPC_ENDPOINT, SERVICE_FEE_SOL } from "@/lib/constants";

// RF05: Gestão de Custos
// Este endpoint calcula e retorna os custos estimados para a criação de um token na mainnet.
export async function GET() {
  try {
    // Conecta-se à Mainnet para obter os custos atuais.
    const connection = new Connection(RPC_ENDPOINT, "confirmed");

    // 1. Custo de Rede (Aluguel - Rent)
    // Calcula o valor mínimo em lamports para que a conta do mint seja isenta de aluguel.
    const rentExemptionLamports = await getMinimumBalanceForRentExemptMint(connection);
    
    // 2. Custo de Rede (Taxa de Transação)
    // A taxa por assinatura é 5000 lamports. A nossa transação terá 2 assinaturas (usuário e mint).
    const transactionFeeLamports = 5000 * 2;
    
    const networkCostLamports = rentExemptionLamports + transactionFeeLamports;
    const networkCostInSol = networkCostLamports / LAMPORTS_PER_SOL;

    // 3. Taxa de Serviço
    const serviceFee = SERVICE_FEE_SOL;

    // 4. Custo Total
    const totalCost = networkCostInSol + serviceFee;

    const costs = {
      networkCost: networkCostInSol.toFixed(6), // Custo estimado da rede (aluguel + taxas)
      serviceFee: serviceFee.toFixed(6), // Taxa de serviço da plataforma
      totalCost: totalCost.toFixed(6), // Custo total
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
