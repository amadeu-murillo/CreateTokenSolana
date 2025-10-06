import { NextResponse } from "next/server";
import { buildCreatePairTx, buildAddLiquidityTx } from "@/lib/services/meteoraService";

/**
 * API endpoint para criar par DLMM e/ou adicionar liquidez.
 *
 * Body esperado (JSON):
 * {
 *   action: "create" | "add",
 *   userWalletAddress: string,
 *   baseTokenMint: string,
 *   baseTokenDecimals: number,
 *   initialBaseTokenAmount?: number,
 *   initialSolAmount?: number,
 *   pairAddress?: string,
 *   addBaseAmount?: number,
 *   addSolAmount?: number
 * }
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
      return NextResponse.json({ error: "Endereço da carteira é obrigatório." }, { status: 400 });
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

      console.log("🚀 Criando novo par DLMM com baseTokenMint:", baseTokenMint);

      const result = await buildCreatePairTx({
        baseTokenMint,
        baseTokenDecimals,
        initialBaseTokenAmount,
        initialSolAmount,
        userWalletAddress,
      });

      console.log("✅ Transação de criação construída com sucesso:", {
        activeBinId: result.activeBinId,
        binStep: result.binStep,
      });

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

      console.log("✅ Transação de adição de liquidez construída com sucesso:", {
        positionPubKey: result.positionKeypair.publicKey,
      });

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
    console.error("Mensagem:", error.message);
    console.error("Stack Trace:", error.stack);
    console.error("Objeto de erro completo:", error);

    return NextResponse.json(
      { error: error.message || "Erro interno desconhecido." },
      { status: 500 }
    );
  }
}
