// src/app/api/metadata/route.ts

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Add this line

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    const symbol = searchParams.get('symbol');
    const imageUrl = searchParams.get('imageUrl');
    const description = searchParams.get('description');
    const website = searchParams.get('website');
    const twitter = searchParams.get('twitter');
    const instagram = searchParams.get('instagram');

    if (!name || !symbol || !imageUrl) {
      return NextResponse.json({ error: 'Parâmetros de metadados obrigatórios ausentes: name, symbol, imageUrl.' }, { status: 400 });
    }

    const attributes = [];
    if (website) {
      attributes.push({ trait_type: 'Website', value: website });
    }
    if (twitter) {
      const twitterUrl = twitter.startsWith('https://') ? twitter : `https://twitter.com/${twitter.replace('@', '')}`;
      attributes.push({ trait_type: 'Twitter', value: twitterUrl });
    }
    if (instagram) {
      const instagramUrl = instagram.startsWith('https://') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`;
      attributes.push({ trait_type: 'Instagram', value: instagramUrl });
    }

    // Estrutura de metadados seguindo o padrão da Metaplex para assets fungíveis.
    const metadata = {
      name: name,
      symbol: symbol,
      image: imageUrl,
      description: description || `Token ${name} - Símbolo ${symbol}`,
      // Adicionando links como atributos, que é um padrão comum
      attributes: attributes,
      properties: {
        files: [{ uri: imageUrl, type: "image/png" }], 
        category: 'image',
      },
      // Adicionando external_url se o website for fornecido
      ...(website && { external_url: website }),
    };

    // Retorna o JSON no formato padrão da Metaplex
    return NextResponse.json(metadata);

  } catch (error) {
    console.error("Erro ao gerar metadados:", error);
    return NextResponse.json({ error: 'Falha ao gerar metadados.' }, { status: 500 });
  }
}
