import { NextResponse } from "next/server";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getMinimumBalanceForRentExemptMint } from "@solana/spl-token";

// RF05: Gestão de Custos
// Este endpoint calcula e retorna os custos estimados para a criação de um token.
export async function GET() {
  try {
    // Conecta-se à Devnet para obter os custos atuais.
    const connection = new Connection(
      process.env.DEVNET_RPC_URL || "https://api.devnet.solana.com",
      "confirmed"
    );

    // 1. Custo de Rede (Aluguel - Rent)
    // Calcula o valor mínimo em lamports para que a conta do mint seja isenta de aluguel.
    const rentExemptionLamports = await getMinimumBalanceForRentExemptMint(connection);
    const rentCostInSol = rentExemptionLamports / LAMPORTS_PER_SOL;
    
    // 2. Custo de Rede (Taxa de Transação)
    // Uma transação de criação de token normalmente tem 2 assinaturas (payer e mint).
    // A taxa por assinatura é tipicamente 5000 lamports.
    const transactionFeeLamports = 5000 * 2; // Estimativa para 2 assinaturas
    const transactionFeeInSol = transactionFeeLamports / LAMPORTS_PER_SOL;

    const networkCost = rentCostInSol + transactionFeeInSol;

    // 3. Taxa de Serviço
    // Taxa fixa definida nos requisitos.
    const serviceFee = 0.092;

    // 4. Custo Total
    const totalCost = networkCost + serviceFee;

    const costs = {
      networkCost: networkCost.toFixed(6), // Custo estimado da rede (aluguel + taxas)
      serviceFee: serviceFee.toFixed(6), // Taxa de serviço da plataforma
      totalCost: totalCost.toFixed(6), // Custo total
    };

    return NextResponse.json(costs);
  } catch (error) {
    console.error("Erro ao calcular custos:", error);
    // Adiciona log detalhado do erro no servidor
    return NextResponse.json(
      { error: "Erro interno do servidor ao calcular custos." },
      { status: 500 }
    );
  }
}
