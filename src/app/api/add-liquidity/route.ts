// src/app/api/add-liquidity/route.ts

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { liquidityService } from '@/lib/services/liquidityService';
import { PublicKey } from '@solana/web3.js';

const addLiquiditySchema = z.object({
  marketId: z.string().refine((val) => { // <-- Validação do Market ID adicionada
    try {
      new PublicKey(val);
      return true;
    } catch {
      return false;
    }
  }, { message: 'Market ID inválido.' }),
  baseTokenMint: z.string().refine((val) => {
    try {
      new PublicKey(val);
      return true;
    } catch {
      return false;
    }
  }, { message: 'Endereço de mint do token inválido.' }),
  baseTokenDecimals: z.number().int().min(0).max(18),
  initialBaseTokenAmount: z.number().positive('A quantidade de tokens deve ser positiva.'),
  initialSolAmount: z.number().positive('A quantidade de SOL deve ser positiva.'),
  userWalletAddress: z.string().refine((val) => {
    try {
      new PublicKey(val);
      return true;
    } catch {
      return false;
    }
  }, { message: 'Endereço de carteira inválido.' }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = addLiquiditySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Dados da requisição inválidos.', details: validation.error.flatten() }, { status: 400 });
    }

    const result = await liquidityService.createRaydiumPoolWithSol(validation.data);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[API Add-Liquidity] Erro detalhado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro interno no servidor.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}