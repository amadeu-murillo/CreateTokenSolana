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
    console.log("LOG [API]: Corpo da requisição recebido:", body);

    // 1. Valida o corpo da requisição usando o schema do Zod
    const validation = addLiquiditySchema.safeParse(body);
    if (!validation.success) {
      console.error("LOG [API]: Erro de validação dos dados de entrada:", validation.error.flatten());
      // Se a validação falhar, retorna um erro 400 com os detalhes
      return NextResponse.json({ error: 'Dados da requisição inválidos.', details: validation.error.flatten() }, { status: 400 });
    }

    console.log("LOG [API]: Dados validados. Chamando o serviço para criar a transação...");
    // 2. Chama o serviço do AMM customizado para construir a transação
    const result = await customAmmService.createPoolAndAddLiquidity(validation.data);

    // Adiciona um log para mostrar o que está sendo enviado de volta para o cliente
    console.log(`LOG [API]: Transação construída com sucesso. Enviando AMM ID: ${result.ammId} e transação serializada (tamanho base64: ${result.transaction.length})`);

    // 3. Retorna a transação serializada com sucesso
    return NextResponse.json(result);

  } catch (error) {
    // Log aprimorado do erro no backend
    console.error("--- ERRO DETALHADO NA API /api/add-liquidity ---");
    if (error instanceof Error) {
        console.error("Nome do Erro:", error.name);
        console.error("Mensagem do Erro:", error.message);
        console.error("Stack do Erro:", error.stack);
    } else {
        console.error("Objeto completo do erro:", error);
    }
    console.error("--- FIM DO ERRO DETALHADO ---");
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro interno no servidor.';
    // Retorna um erro 500 genérico para o cliente
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
