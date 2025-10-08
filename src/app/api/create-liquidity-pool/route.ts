// app/api/create-liquidity-pool/route.ts
import { NextResponse } from "next/server";
import { buildCreatePairTx, buildAddLiquidityTx } from "@/lib/services/meteoraService";

type CreateBody = {
  action: "create" | "add";
  userWalletAddress: string;
  // create
  baseTokenMint?: string;
  baseTokenDecimals?: number | string;
  initialBaseTokenAmount?: number | string;
  initialSolAmount?: number | string;
  feeBps?: number | string;
  // add
  pairAddress?: string;
  addBaseAmount?: number | string;
  addSolAmount?: number | string;
};

function parseNumber(value: number | string | undefined, fieldName: string) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return value;
  const n = Number(value);
  if (Number.isNaN(n)) throw new Error(`Campo inválido '${fieldName}': valor não é um número.`);
  return n;
}

export async function POST(request: Request) {
  console.log("🟦 [API] /api/create-liquidity-pool chamada");

  try {
    const body = (await request.json()) as CreateBody;
    console.log("📥 Corpo recebido:", body);

    const {
      action,
      userWalletAddress,
      baseTokenMint,
      baseTokenDecimals,
      initialBaseTokenAmount,
      initialSolAmount,
      feeBps,
      pairAddress,
      addBaseAmount,
      addSolAmount,
    } = body;

    if (!userWalletAddress) {
      return NextResponse.json({ error: "Endereço da carteira é obrigatório." }, { status: 400 });
    }

    if (action === "create") {
      // converter e validar entradas
      if (!baseTokenMint) {
        return NextResponse.json({ error: "baseTokenMint é obrigatório para criação." }, { status: 400 });
      }

      const decimals = parseNumber(baseTokenDecimals, "baseTokenDecimals");
      const baseAmt = parseNumber(initialBaseTokenAmount, "initialBaseTokenAmount");
      const solAmt = parseNumber(initialSolAmount, "initialSolAmount");
      const fee = parseNumber(feeBps, "feeBps") ?? 25; // default 25 bps se não informado

      if (decimals === undefined) {
        return NextResponse.json({ error: "baseTokenDecimals é obrigatório para criação." }, { status: 400 });
      }
      if (baseAmt === undefined || baseAmt <= 0) {
        return NextResponse.json({ error: "initialBaseTokenAmount obrigatório e > 0." }, { status: 400 });
      }
      if (solAmt === undefined || solAmt <= 0) {
        return NextResponse.json({ error: "initialSolAmount obrigatório e > 0." }, { status: 400 });
      }

      console.log("🔎 Construindo transação de criação de pool...");
      const result = await buildCreatePairTx({
        baseTokenMint,
        baseTokenDecimals: decimals,
        initialBaseTokenAmount: baseAmt,
        initialSolAmount: solAmt,
        userWalletAddress,
        feeBps: fee,
      });

      console.log("✅ Transação de criação construída com sucesso.");
      return NextResponse.json({
        message: "Transação de criação de pool gerada com sucesso.",
        data: result,
      });
    }

    if (action === "add") {
      if (!pairAddress) {
        return NextResponse.json({ error: "pairAddress é obrigatório para adicionar liquidez." }, { status: 400 });
      }

      const decimals = parseNumber(baseTokenDecimals, "baseTokenDecimals");
      const baseAmt = parseNumber(addBaseAmount, "addBaseAmount");
      const solAmt = parseNumber(addSolAmount, "addSolAmount");

      if (decimals === undefined) {
        return NextResponse.json({ error: "baseTokenDecimals é obrigatório para adicionar liquidez." }, { status: 400 });
      }
      if (baseAmt === undefined || baseAmt <= 0) {
        return NextResponse.json({ error: "addBaseAmount obrigatório e > 0." }, { status: 400 });
      }
      if (solAmt === undefined || solAmt <= 0) {
        return NextResponse.json({ error: "addSolAmount obrigatório e > 0." }, { status: 400 });
      }

      console.log("🔎 Construindo transação de adição de liquidez...");
      const result = await buildAddLiquidityTx({
        pairAddress,
        baseTokenDecimals: decimals,
        addBaseAmount: baseAmt,
        addSolAmount: solAmt,
        userWalletAddress,
      });

      console.log("✅ Transação de adição de liquidez construída com sucesso.");
      return NextResponse.json({
        message: "Transação de adição de liquidez gerada com sucesso.",
        data: result,
      });
    }

    // ação inválida
    return NextResponse.json({ error: "Ação inválida. Use 'create' ou 'add'." }, { status: 400 });
  } catch (err: any) {
    console.error("❌ ERRO DETALHADO NA API create-liquidity-pool:", err);
    // Se o erro for uma mensagem conhecida, retornamos 400
    if (err?.message?.includes("inválido") || err?.message?.includes("Obrigatório") || err?.message?.includes("invalid")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: err?.message ?? "Erro interno desconhecido." }, { status: 500 });
  }
}
