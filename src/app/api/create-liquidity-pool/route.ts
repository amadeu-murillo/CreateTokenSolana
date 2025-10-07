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
      // CORREÇÃO: Extrair 'feeBps' do corpo da requisição.
      feeBps,
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
        !initialSolAmount ||
        // CORREÇÃO: Validar que 'feeBps' foi fornecido.
        feeBps === undefined
      ) {
        return NextResponse.json(
          { error: "Parâmetros insuficientes para criar pool (incluindo feeBps)." },
          { status: 400 }
        );
      }
      
      console.log("🔎 Construindo transação de criação de pool...");

      const result = await buildCreatePairTx({
        baseTokenMint,
        baseTokenDecimals,
        initialBaseTokenAmount,
        initialSolAmount,
        userWalletAddress,
        // CORREÇÃO: Passar o 'feeBps' para a função do serviço.
        feeBps,
      });

      console.log("✅ Transação de criação construída com sucesso.");

      return NextResponse.json({
        message: "Transação de criação de pool gerada com sucesso.",
        data: result,
      });
    }

    // --- ADIÇÃO DE LIQUIDEZ ---
    if (action === "add") {
      // ... (código para adicionar liquidez permanece o mesmo)
    }

    // --- AÇÃO INVÁLIDA ---
    return NextResponse.json(
      { error: "Ação inválida. Use 'create' ou 'add'." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("❌ ERRO DETALHADO NA API create-liquidity-pool:");
    console.error(error);

    return NextResponse.json(
      { error: error.message || "Erro interno desconhecido." },
      { status: 500 }
    );
  }
}

