// src/lib/services/liquidityService.ts

import { raydiumIntegration } from '@/lib/integrations/raydium';
import { CreatePoolWithSolParams, CreatePoolWithSolResponse } from '@/types/api';

class LiquidityService {
  async createRaydiumPoolWithSol(params: CreatePoolWithSolParams): Promise<CreatePoolWithSolResponse> {
    
    console.log(`[Service] Iniciando criação de pool na Raydium para o token: ${params.baseTokenMint}`);

    const result = await raydiumIntegration.buildCreatePoolWithSolTransaction(params);

    console.log(`[Service] Transação para o pool ${result.ammId} construída com sucesso.`);

    return result;
  }
}

export const liquidityService = new LiquidityService();