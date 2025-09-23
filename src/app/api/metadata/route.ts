import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server'

/**
 * Endpoint para servir o JSON de metadados do token, seguindo o padrão da Metaplex.
 * As carteiras e exploradores de blocos usarão a URI deste endpoint para buscar
 * as informações (nome, símbolo, imagem) do token.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const name = searchParams.get('name');
    const symbol = searchParams.get('symbol');
    const imageUrl = searchParams.get('imageUrl');

    if (!name || !symbol || !imageUrl) {
      return NextResponse.json({ error: 'Parâmetros ausentes: name, symbol e imageUrl são obrigatórios.' }, { status: 400 });
    }

    // Construção do objeto de metadados
    const metadata = {
      name: decodeURIComponent(name),
      symbol: decodeURIComponent(symbol),
      description: `Token ${decodeURIComponent(name)} criado na plataforma.`,
      image: decodeURIComponent(imageUrl),
    };

    return NextResponse.json(metadata);

  } catch (error) {
    console.error("Erro ao gerar metadados:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao gerar metadados." },
      { status: 500 }
    );
  }
}
