// src/app/api/metadata/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    const symbol = searchParams.get('symbol');
    const imageUrl = searchParams.get('imageUrl');

    if (!name || !symbol || !imageUrl) {
      return NextResponse.json({ error: 'Missing metadata parameters.' }, { status: 400 });
    }

    // Returns the JSON in the standard Metaplex format using the URL data
    return NextResponse.json({
      name: name,
      symbol: symbol,
      image: imageUrl, // Now using the correct image URL
      description: `Token ${name} - Symbol ${symbol}`,
      attributes: [],
    });

  } catch (error) {
    console.error("Error generating metadata:", error);
    return NextResponse.json({ error: 'Failed to generate metadata.' }, { status: 500 });
  }
}
