// src/lib/services/marketService.ts

import { openbookIntegration } from '@/lib/integrations/openbook';
import { CreateMarketParams, CreateMarketResponse } from '@/types/api';

class MarketService {
  async createOpenBookMarket(params: CreateMarketParams): Promise<CreateMarketResponse> {
    
    console.log(`[Service] Iniciando criação de mercado OpenBook para o token: ${params.baseTokenMint}`);
    
    const result = await openbookIntegration.buildCreateMarketTransaction(params);

    console.log(`[Service] Transação para o mercado ${result.marketId} construída com sucesso.`);

    return result;
  }
}

export const marketService = new MarketService();