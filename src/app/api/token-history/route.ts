import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { SolanaCluster, getRpcEndpoint } from "@/lib/constants";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getMint } from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fetchDigitalAsset, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey as umiPublicKey, Umi } from "@metaplex-foundation/umi";
import { isValidPublicKey } from "@/lib/security";
import { getSolanaConnection } from "@/lib/services/solanaHelpers";

export const dynamic = "force-dynamic";


const metadataCache = new Map<string, { name: string; symbol: string; uri: string }>();

async function getTokenMetadata(umi: Umi, mint: string) {
  if (metadataCache.has(mint)) {
    return metadataCache.get(mint)!;
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
  } catch {
    const unknownMetadata = {
      name: "Unknown Token",
      symbol: mint.slice(0, 6).toUpperCase(),
      uri: "",
    };
    metadataCache.set(mint, unknownMetadata);
    return unknownMetadata;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");
  const rawNetwork = searchParams.get("network");
  const network: SolanaCluster = rawNetwork === "devnet" ? "devnet" : "mainnet-beta";

  if (!wallet || !isValidPublicKey(wallet)) {
    return NextResponse.json(
      { error: "A valid Solana wallet address is required." },
      { status: 400 }
    );
  }

  try {
    const connection = getSolanaConnection(network);
    const publicKey = new PublicKey(wallet);
    const umi = createUmi(getRpcEndpoint(network)).use(mplTokenMetadata());

    const [tokenAccounts, token2022Accounts] = await Promise.all([
      connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID }),
      connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_2022_PROGRAM_ID }),
    ]);

    const uniqueMints = new Map<string, PublicKey>();

    for (const acc of tokenAccounts.value) {
      const mint = acc.account.data.parsed.info.mint as string;
      if (!uniqueMints.has(mint)) {
        uniqueMints.set(mint, TOKEN_PROGRAM_ID);
      }
    }
    for (const acc of token2022Accounts.value) {
      const mint = acc.account.data.parsed.info.mint as string;
      if (!uniqueMints.has(mint)) {
        uniqueMints.set(mint, TOKEN_2022_PROGRAM_ID);
      }
    }

    const entries = Array.from(uniqueMints.entries());

    const results = await Promise.all(
      entries.map(async ([mintAddress, programId]) => {
        try {
          const mintPublicKey = new PublicKey(mintAddress);
          const mintInfo = await getMint(connection, mintPublicKey, "confirmed", programId);

          const isMintAuthority = Boolean(
            mintInfo.mintAuthority && mintInfo.mintAuthority.equals(publicKey)
          );
          const isFreezeAuthority = Boolean(
            mintInfo.freezeAuthority && mintInfo.freezeAuthority.equals(publicKey)
          );

          if (!isMintAuthority && !isFreezeAuthority) {
            return null;
          }

          const metadata = await getTokenMetadata(umi, mintAddress);
          return {
            mint: mintAddress,
            programId: programId.toBase58(),
            ...metadata,
            mintAuthority: isMintAuthority ? publicKey.toBase58() : null,
            freezeAuthority: isFreezeAuthority ? publicKey.toBase58() : null,
          };
        } catch (err) {
          console.error(`Failed to process mint ${mintAddress}:`, err);
          return null;
        }
      })
    );

    const managedTokens = results.filter((item): item is NonNullable<typeof item> => item !== null);
    return NextResponse.json({ tokens: managedTokens, network });
  } catch (error) {
    console.error("Error fetching manageable tokens:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error while fetching token history.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
