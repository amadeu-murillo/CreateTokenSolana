// src/app/api/create-token/route.ts

import { NextResponse } from 'next/server';
import { createSplTokenTransaction } from '@/lib/services/splTokenService';
import { createToken2022Transaction } from '@/lib/services/token2022Service';

export async function POST(request: Request) {
  try {
    const {
        name,
        symbol,
        imageUrl,
        decimals,
        supply,
        wallet,
        mintAuthority,
        freezeAuthority,
        isMetadataMutable,
        tokenStandard,
        transferFee,
        affiliate
    } = await request.json();

    if (!name || !symbol || !imageUrl || decimals === undefined || !supply || !wallet) {
      return NextResponse.json({ error: 'Incomplete data provided.' }, { status: 400 });
    }

    const numericSupply = typeof supply === 'string'
        ? Number(supply.replace(/[^0-9]/g, ''))
        : Number(supply);

    if (isNaN(numericSupply) || numericSupply <= 0) {
        return NextResponse.json({ error: 'Invalid supply.' }, { status: 400 });
    }

    let result;

    if (tokenStandard === 'token-2022') {
        result = await createToken2022Transaction({
            name,
            symbol,
            imageUrl,
            decimals,
            supply: numericSupply,
            wallet,
            mintAuthority,
            freezeAuthority,
            isMetadataMutable,
            transferFee,
            affiliate,
        });
    } else {
        result = await createSplTokenTransaction({
            name,
            symbol,
            imageUrl,
            decimals,
            supply: numericSupply,
            wallet,
            mintAuthority,
            freezeAuthority,
            isMetadataMutable,
            affiliate,
        });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Detailed error when creating transaction:', error);
    let errorMessage = 'Internal server error while creating the transaction.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
