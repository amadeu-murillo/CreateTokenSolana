// src/app/api/create-liquidity-pool/route.ts
import { NextResponse } from 'next/server';
import { createMeteoraPoolAndAddLiquidity } from '@/lib/services/meteoraService';

export async function POST(request: Request) {
  console.log("API /api/create-liquidity-pool chamada.");
  try {
    const body = await request.json();
    console.log("Corpo da requisição recebido:", body);
    const {
      baseTokenMint,
      baseTokenDecimals,
      initialBaseTokenAmount,
      initialSolAmount,
      userWalletAddress,
    } = body;

    if (
      !baseTokenMint ||
      baseTokenDecimals === undefined ||
      !initialBaseTokenAmount ||
      !initialSolAmount ||
      !userWalletAddress
    ) {
      console.error("Erro de validação: Dados incompletos fornecidos.");
      return NextResponse.json(
        { error: 'Dados incompletos fornecidos.' },
        { status: 400 }
      );
    }

    console.log("Dados validados. A chamar createMeteoraPoolAndAddLiquidity...");
    const result = await createMeteoraPoolAndAddLiquidity({
      baseTokenMint,
      baseTokenDecimals,
      initialBaseTokenAmount,
      initialSolAmount,
      userWalletAddress,
    });
    console.log("createMeteoraPoolAndAddLiquidity retornou com sucesso:", result);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('--- ERRO DETALHADO NA API create-liquidity-pool ---');
    console.error('Mensagem:', error.message);
    console.error('Stack Trace:', error.stack);
    console.error('Objeto de erro completo:', error);
    console.error('--- FIM DO ERRO DETALHADO ---');
    
    return NextResponse.json(
      { error: error.message || 'Erro interno desconhecido.' },
      { status: 500 }
    );
  }
}

