// src/app/api/metadata/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    const symbol = searchParams.get('symbol');
    const imageUrl = searchParams.get('imageUrl');

    if (!name || !symbol || !imageUrl) {
      return NextResponse.json({ error: 'Parâmetros de metadados ausentes.' }, { status: 400 });
    }

    // Retorna o JSON no formato padrão da Metaplex, usando os dados da URL
    return NextResponse.json({
      name: name,
      symbol: symbol,
      image: imageUrl, // Agora usamos a URL da imagem correta
      description: `Token ${name} - Símbolo ${symbol}`,
      attributes: [],
    });

  } catch (error) {
    console.error("Erro ao gerar metadados:", error);
    return NextResponse.json({ error: 'Falha ao gerar metadados.' }, { status: 500 });
  }
}