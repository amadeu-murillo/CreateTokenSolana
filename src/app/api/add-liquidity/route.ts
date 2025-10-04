import { NextResponse } from 'next/server';
import { orcaWhirlpoolService } from '@/lib/services/orcaWhirlpoolService';
import Decimal from 'decimal.js';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validação básica dos dados recebidos
        const { poolAddress, tokenAmount, tokenDecimals, lowerPrice, upperPrice } = body;
        if (!poolAddress || !tokenAmount || tokenDecimals === undefined || !lowerPrice || !upperPrice) {
            return NextResponse.json({ error: 'Dados incompletos fornecidos.' }, { status: 400 });
        }

        // Convertendo a quantidade para a menor unidade do token (usando BigInt)
        const amountInSmallestUnit = new Decimal(tokenAmount).mul(new Decimal(10).pow(tokenDecimals));
        const tokenAmountBigInt = BigInt(amountInSmallestUnit.toFixed());

        const result = await orcaWhirlpoolService.createPosition({
            poolAddress,
            tokenAmount: tokenAmountBigInt,
            lowerPrice,
            upperPrice,
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Erro na API de adicionar liquidez:', error);
        return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
    }
}
