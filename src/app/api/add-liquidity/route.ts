// src/app/api/add-liquidity/route.ts

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { customAmmService } from '@/lib/services/customAmmService';
import { Keypair, PublicKey } from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';

// Define um "schema" para validar os dados de entrada da requisição.
// Isso garante que os dados estão no formato correto antes de prosseguir.
const addLiquiditySchema = z.object({
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

    // 1. Valida o corpo da requisição usando o schema do Zod
    const validation = addLiquiditySchema.safeParse(body);
    if (!validation.success) {
      // Se a validação falhar, retorna um erro 400 com os detalhes
      return NextResponse.json({ error: 'Dados da requisição inválidos.', details: validation.error.flatten() }, { status: 400 });
    }

    // 2. Chama o serviço do AMM customizado para construir a transação
    const result = await customAmmService.createPoolAndAddLiquidity(validation.data);

    // 3. Retorna a transação serializada com sucesso
    return NextResponse.json(result);

  } catch (error) {
    console.error('[API Add-Liquidity] Erro detalhado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro interno no servidor.';
    // Retorna um erro 500 genérico para o cliente
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

