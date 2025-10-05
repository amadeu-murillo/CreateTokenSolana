// src/app/api/create-liquidity-pool/route.ts
import { NextResponse } from 'next/server';
import { createAndInitializeLiquidityPool } from '@/lib/services/raydiumService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
      return NextResponse.json(
        { error: 'Dados incompletos fornecidos.' },
        { status: 400 }
      );
    }

    const result = await createAndInitializeLiquidityPool({
      baseTokenMint,
      baseTokenDecimals,
      initialBaseTokenAmount,
      initialSolAmount,
      userWalletAddress,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro na API de criação de pool de liquidez:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
