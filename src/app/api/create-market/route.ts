// src/app/api/create-market/route.ts

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { marketService } from '@/lib/services/marketService';
import { PublicKey } from '@solana/web3.js';
import { NATIVE_MINT } from '@solana/spl-token';

// Schema de validação para a criação do mercado
const createMarketSchema = z.object({
  baseTokenMint: z.string().refine((val) => {
    try { new PublicKey(val); return true; } catch { return false; }
  }, { message: 'Endereço de mint do token base inválido.' }),
  baseTokenDecimals: z.number().int().min(0),
  userWalletAddress: z.string().refine((val) => {
    try { new PublicKey(val); return true; } catch { return false; }
  }, { message: 'Endereço de carteira inválido.' }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = createMarketSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Dados da requisição inválidos.', details: validation.error.flatten() }, { status: 400 });
    }

    // O token de cotação para um pool com SOL é sempre o WSOL
    const params = {
      ...validation.data,
      quoteTokenMint: NATIVE_MINT.toBase58(), // Endereço do Wrapped SOL
      quoteTokenDecimals: 9,
    };

    const result = await marketService.createOpenBookMarket(params);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[API Create-Market] Erro detalhado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro interno no servidor.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}