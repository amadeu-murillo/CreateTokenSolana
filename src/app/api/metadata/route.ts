// src/app/api/metadata/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { RPC_ENDPOINT } from '@/lib/constants';
import { getMint } from '@solana/spl-token';
import { Metadata, PROGRAM_ID as METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mintAddress = searchParams.get('mint');

  if (!mintAddress) {
    return NextResponse.json({ error: 'Endereço de mint não fornecido.' }, { status: 400 });
  }

  try {
    const mintPublicKey = new PublicKey(mintAddress);
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');

    // Encontrar a conta de metadados associada ao mint
    const metadataPDA = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        mintPublicKey.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    )[0];

    const metadataAccount = await connection.getAccountInfo(metadataPDA);
    if (!metadataAccount) {
        return NextResponse.json({ error: "Metadados não encontrados." }, { status: 404 });
    }

    const [metadata] = Metadata.deserialize(metadataAccount.data);

    // ✅ Retorna o JSON no formato padrão
    return NextResponse.json({
      name: metadata.data.name.replace(/\0/g, ''),
      symbol: metadata.data.symbol.replace(/\0/g, ''),
      image: metadata.data.uri.replace(/\0/g, ''), // Supondo que a URI é a imagem
      description: `Token ${metadata.data.name.replace(/\0/g, '')}`,
      attributes: [],
    });

  } catch (error) {
    console.error("Erro ao buscar metadados:", error);
    return NextResponse.json({ error: 'Falha ao buscar metadados.' }, { status: 500 });
  }
}