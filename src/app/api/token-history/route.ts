import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { RPC_ENDPOINT } from '@/lib/constants';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getMint } from '@solana/spl-token';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { fetchDigitalAsset, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey as umiPublicKey } from '@metaplex-foundation/umi';

// Simple cache for metadata to avoid repeated lookups in the same request
const metadataCache = new Map<string, any>();

async function getTokenMetadata(umi: any, mint: string) {
    if (metadataCache.has(mint)) {
        return metadataCache.get(mint);
    }
    try {
        const asset = await fetchDigitalAsset(umi, umiPublicKey(mint));
        const metadata = {
            name: asset.metadata.name,
            symbol: asset.metadata.symbol,
            uri: asset.metadata.uri,
        };
        metadataCache.set(mint, metadata);
        return metadata;
    } catch (e) {
        console.warn(`Could not fetch metadata for mint ${mint}`);
        const unknownMetadata = {
            name: 'Unknown Token',
            symbol: 'UNKNOWN',
            uri: '',
        };
        metadataCache.set(mint, unknownMetadata);
        return unknownMetadata;
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
        return NextResponse.json({ error: 'Wallet address is required.' }, { status: 400 });
    }

    try {
        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const publicKey = new PublicKey(wallet);
        const umi = createUmi(RPC_ENDPOINT).use(mplTokenMetadata());
        
        metadataCache.clear();

        // Fetch all token accounts (SPL and Token-2022) owned by the user
        const [tokenAccounts, token2022Accounts] = await Promise.all([
            connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID }),
            connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_2022_PROGRAM_ID })
        ]);

        const allAccounts = [
            ...tokenAccounts.value,
            ...token2022Accounts.value
        ];

        // Filter tokens where the user is the mint authority
        // This is much more efficient than checking transaction history
        const mintAddresses = allAccounts
            .map(acc => acc.account.data.parsed.info.mint)
            .filter((mint, index, self) => self.indexOf(mint) === index); // Remove duplicates

        const managedTokens = [];

        for (const mintAddress of mintAddresses) {
            try {
                const mintPublicKey = new PublicKey(mintAddress);
                const mintInfo = await getMint(connection, mintPublicKey, 'confirmed', mintPublicKey.equals(TOKEN_2022_PROGRAM_ID) ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID);

                // Check if the user is still the mint or freeze authority
                const isMintAuthority = mintInfo.mintAuthority && mintInfo.mintAuthority.equals(publicKey);
                const isFreezeAuthority = mintInfo.freezeAuthority && mintInfo.freezeAuthority.equals(publicKey);
                
                if (isMintAuthority || isFreezeAuthority) {
                    const metadata = await getTokenMetadata(umi, mintAddress);
                    managedTokens.push({
                        mint: mintAddress,
                        ...metadata,
                        mintAuthority: isMintAuthority ? publicKey.toBase58() : null,
                        freezeAuthority: isFreezeAuthority ? publicKey.toBase58() : null
                    });
                }
            } catch (error) {
                 console.error(`Failed to process mint ${mintAddress}:`, error);
            }
        }
        
        return NextResponse.json({ tokens: managedTokens });

    } catch (error) {
        console.error('Error fetching manageable tokens:', error);
        let errorMessage = 'Internal server error while fetching history.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
