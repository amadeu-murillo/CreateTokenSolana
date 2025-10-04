import { NextResponse } from 'next/server';

// Endpoint da Orca para a lista de pools na devnet
const ORCA_POOLS_API_URL = 'https://api.devnet.orca.so/v1/whirlpool/list';

export async function GET() {
  try {
    const response = await fetch(ORCA_POOLS_API_URL, {
      next: {
        revalidate: 3600, // Cache de 1 hora
      },
    });

    if (!response.ok) {
      throw new Error(`Falha ao buscar pools da Orca: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Mapeia os dados para um formato mais simples que o frontend possa usar
    const pools = data.whirlpools.map((pool: any) => ({
      address: pool.address,
      tokenMintA: pool.tokenA.mint,
      tokenMintB: pool.tokenB.mint,
      tickSpacing: pool.tickSpacing,
      name: `${pool.tokenA.symbol}/${pool.tokenB.symbol}`
    }));

    return NextResponse.json(pools);

  } catch (error) {
    console.error("Erro na API /api/pools:", error);
    return NextResponse.json({ error: 'Falha ao buscar a lista de pools.' }, { status: 500 });
  }
}

