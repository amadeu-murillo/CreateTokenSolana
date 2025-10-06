import { NextResponse } from "next/server";
import { buildCreatePairTx, buildAddLiquidityTx } from "@/lib/services/meteoraService";

/**
 * API endpoint para criar par DLMM e/ou adicionar liquidez.
 */
export async function POST(request: Request) {
  console.log("🟦 [API] /api/create-liquidity-pool chamada");

  try {
    const body = await request.json();
    console.log("📥 Corpo recebido:", body);

    const {
      action,
      userWalletAddress,
      baseTokenMint,
      baseTokenDecimals,
      initialBaseTokenAmount,
      initialSolAmount,
      pairAddress,
      addBaseAmount,
      addSolAmount,
    } = body;

    if (!userWalletAddress) {
      return NextResponse.json(
        { error: "Endereço da carteira é obrigatório." },
        { status: 400 }
      );
    }

    // --- CRIAÇÃO DE POOL ---
    if (action === "create") {
      if (
        !baseTokenMint ||
        baseTokenDecimals === undefined ||
        !initialBaseTokenAmount ||
        !initialSolAmount
      ) {
        return NextResponse.json(
          { error: "Parâmetros insuficientes para criar pool." },
          { status: 400 }
        );
      }
      
      console.log("🔎 Construindo transação de criação de pool...");

      // --- CORREÇÃO ---
      // Removemos o loop que tentava múltiplos binSteps.
      // Fazemos uma chamada única e direta para o serviço, permitindo que ele
      // use o binStep padrão (100), que é mais robusto para faixas de preço amplas
      // e evita o erro de "Índice extremo".
      const result = await buildCreatePairTx({
        baseTokenMint,
        baseTokenDecimals,
        initialBaseTokenAmount,
        initialSolAmount,
        userWalletAddress,
      });

      console.log("✅ Transação de criação construída com sucesso.");

      return NextResponse.json({
        message: "Transação de criação de pool gerada com sucesso.",
        data: result,
      });
    }

    // --- ADIÇÃO DE LIQUIDEZ ---
    if (action === "add") {
      if (!pairAddress || !addBaseAmount || !addSolAmount) {
        return NextResponse.json(
          { error: "Parâmetros insuficientes para adicionar liquidez." },
          { status: 400 }
        );
      }

      console.log("💧 Adicionando liquidez à pool:", pairAddress);

      const result = await buildAddLiquidityTx({
        pairAddress,
        baseTokenDecimals,
        addBaseAmount,
        addSolAmount,
        userWalletAddress,
      });

      console.log("✅ Transação de adição de liquidez construída com sucesso.");

      return NextResponse.json({
        message: "Transação de adição de liquidez gerada com sucesso.",
        data: result,
      });
    }

    // --- AÇÃO INVÁLIDA ---
    return NextResponse.json(
      { error: "Ação inválida. Use 'create' ou 'add'." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("❌ ERRO DETALHADO NA API create-liquidity-pool:");
    console.error(error); // Loga o objeto de erro completo para mais detalhes

    return NextResponse.json(
      { error: error.message || "Erro interno desconhecido." },
      { status: 500 }
    );
  }
}

