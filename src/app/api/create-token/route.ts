// src/app/api/create-token/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { createSplTokenTransaction } from '@/lib/services/splTokenService';
import { createToken2022Transaction } from '@/lib/services/token2022Service';

// Configures Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dgurmzcht',
  api_key: process.env.CLOUDINARY_API_KEY || '376481879818689',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'YfZk9mhp8eVA6xaZOZzHbF2H_qM',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
        affiliate,
        description,
        website,
        twitter,
        instagram
    } = body;

    if (!name || !symbol || !imageUrl || decimals === undefined || !supply || !wallet) {
      return NextResponse.json({ error: 'Incomplete data provided.' }, { status: 400 });
    }

    // 1. Builds the metadata object in Metaplex standard
    const attributes = [];
    if (website) attributes.push({ trait_type: 'Website', value: website });
    if (twitter) {
        const twitterUrl = twitter.startsWith('https://') ? twitter : `https://twitter.com/${twitter.replace('@', '')}`;
        attributes.push({ trait_type: 'Twitter', value: twitterUrl });
    }
    if (instagram) {
        const instagramUrl = instagram.startsWith('https://') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`;
        attributes.push({ trait_type: 'Instagram', value: instagramUrl });
    }

    const metadataJson = {
      name: name,
      symbol: symbol,
      image: imageUrl,
      description: description || `Token ${name} - Symbol ${symbol}`,
      attributes: attributes,
      properties: {
        files: [{ uri: imageUrl, type: "image/png" }],
        category: 'image',
      },
      ...(website && { external_url: website }),
    };

    // 2. Uploads the metadata JSON to Cloudinary as a raw file
    const metadataString = JSON.stringify(metadataJson);
    const metadataBuffer = Buffer.from(metadataString);

    const uploadResponse = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'raw', folder: 'token_metadata' },
            (error, result) => {
                if (error) return reject(new Error('Failed to upload metadata.'));
                if (!result) return reject(new Error('No result from metadata upload.'));
                resolve(result);
            }
        );
        uploadStream.end(metadataBuffer);
    });

    const metadataUri = uploadResponse.secure_url;
    console.log(`Metadata uploaded to: ${metadataUri}`);

    // 3. Calls the transaction creation function with the metadata URI
    const numericSupply = Number(String(supply).replace(/[^0-9]/g, ''));
    if (isNaN(numericSupply) || numericSupply <= 0) {
        return NextResponse.json({ error: 'Invalid supply.' }, { status: 400 });
    }
    
    let result;
    if (tokenStandard === 'token-2022') {
        result = await createToken2022Transaction({
            name, symbol, metadataUri, decimals, supply: numericSupply, wallet,
            mintAuthority, freezeAuthority, isMetadataMutable, transferFee, affiliate,
        });
    } else {
        result = await createSplTokenTransaction({
            name, symbol, metadataUri, decimals, supply: numericSupply, wallet,
            mintAuthority, freezeAuthority, isMetadataMutable, affiliate,
        });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Detailed error while creating transaction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error while creating the transaction.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
