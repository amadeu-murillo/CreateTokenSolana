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
 *   initialBaseTokenAmount?: number, // ATOMS, não normalizado
 *   initialSolAmount?: number,       // LAMPORTS, não normalizado
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

      console.log("🔎 Debug criação pool:");
      console.log(" - BaseTokenDecimals:", baseTokenDecimals);
      console.log(" - initialBaseTokenAmount (atoms):", initialBaseTokenAmount);
      console.log(" - initialSolAmount (lamports):", initialSolAmount);

      // Tentar múltiplos binSteps até achar válido
      const candidateBinSteps = [1, 5, 10, 25];
      let result: any = null;
      let usedBinStep: number | undefined;

      for (const step of candidateBinSteps) {
        try {
          console.log(`➡️ Tentando criar pool com binStep = ${step}...`);

          result = await buildCreatePairTx({
            baseTokenMint,
            baseTokenDecimals,
            initialBaseTokenAmount, // já em atoms
            initialSolAmount,       // já em lamports
            userWalletAddress,
            binStep: step,
          });

          usedBinStep = step;

          console.log("✅ Sucesso com binStep:", step);
          break;
        } catch (err: any) {
          console.error(`❌ Erro com binStep=${step}:`, err.message);
        }
      }

      if (!result || !usedBinStep) {
        return NextResponse.json(
          { error: "Não foi possível encontrar um binStep válido para criação do pool." },
          { status: 500 }
        );
      }

      // --- Cálculo do preço teórico (pode falhar se binId for extremo)
      let theoreticalPrice: number | undefined = undefined;
      try {
        const step = result.binStep / 10_000;
        theoreticalPrice = Math.pow(1 + step, Number(result.activeBinId));
      } catch (e) {
        console.warn("⚠️ Erro ao calcular preço teórico:", e);
      }

      console.log("✅ Transação de criação construída com sucesso:", {
        activeBinId: result.activeBinId,
        binStep: result.binStep,
        amountA: result.amountA,
        amountB: result.amountB,
        theoreticalPrice,
      });

      return NextResponse.json({
        message: "Transação de criação de pool gerada com sucesso.",
        data: {
          ...result,
          theoreticalPrice,
          binStep: usedBinStep,
        },
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
