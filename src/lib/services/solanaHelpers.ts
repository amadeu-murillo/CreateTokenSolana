import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Umi, createNoopSigner, signerIdentity, percentAmount } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createV1, TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import {
  AFFILIATE_COMMISSION_RATE,
  DEV_WALLET_ADDRESS,
  SERVICE_FEE_CREATE_TOKEN_LAMPORTS,
  SolanaCluster,
  getRpcEndpoint,
} from "@/lib/constants";
import { isValidPublicKey } from "@/lib/security";

export function getSolanaConnection(cluster: SolanaCluster = "mainnet-beta"): Connection {
  return new Connection(getRpcEndpoint(cluster), {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60_000,
  });
}

export function getUmiInstance(
  userPublicKey: PublicKey,
  cluster: SolanaCluster = "mainnet-beta"
): Umi {
  const umi = createUmi(getRpcEndpoint(cluster));
  const userUmiSigner = createNoopSigner(fromWeb3JsPublicKey(userPublicKey));
  umi.use(signerIdentity(userUmiSigner));
  return umi;
}

/**
 * Phase 2: Instant On-Chain Affiliate Commission Split inside the same principal transaction:
 * - If NO valid affiliate (or self-referral): sends 100% of totalFeeLamports to DEV_WALLET_ADDRESS.
 * - If a valid affiliate exists: splits into two SystemProgram.transfer instructions in the same transaction:
 *   70% of lamports to DEV_WALLET_ADDRESS and 30% directly to the affiliate wallet.
 */
export function buildServiceFeeInstructions(
  userPublicKey: PublicKey,
  totalFeeLamports: number = SERVICE_FEE_CREATE_TOKEN_LAMPORTS,
  affiliateAddress?: string | null
): TransactionInstruction[] {
  const instructions: TransactionInstruction[] = [];
  let affiliatePublicKey: PublicKey | null = null;

  if (
    affiliateAddress &&
    isValidPublicKey(affiliateAddress) &&
    affiliateAddress.trim() !== userPublicKey.toBase58() &&
    affiliateAddress.trim() !== DEV_WALLET_ADDRESS.toBase58()
  ) {
    affiliatePublicKey = new PublicKey(affiliateAddress.trim());
  }

  if (affiliatePublicKey) {
    const affiliateCommission = Math.round(totalFeeLamports * AFFILIATE_COMMISSION_RATE); // 30%
    const developerCut = totalFeeLamports - affiliateCommission; // 70%

    instructions.push(
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: DEV_WALLET_ADDRESS,
        lamports: developerCut,
      }),
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: affiliatePublicKey,
        lamports: affiliateCommission,
      })
    );
  } else {
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: DEV_WALLET_ADDRESS,
        lamports: totalFeeLamports,
      })
    );
  }

  return instructions;
}

/**
 * Generates Metaplex Token Metadata v1 instructions converted to web3.js TransactionInstructions.
 * Supports both classic SPL Token (TOKEN_PROGRAM_ID) and Token-2022 (TOKEN_2022_PROGRAM_ID) mints.
 */
export function buildMetaplexMetadataInstructions(params: {
  userPublicKey: PublicKey;
  mintPublicKey: PublicKey;
  name: string;
  symbol: string;
  metadataUri: string;
  isMetadataMutable: boolean;
  cluster?: SolanaCluster;
  splTokenProgram?: PublicKey;
}): TransactionInstruction[] {
  const {
    userPublicKey,
    mintPublicKey,
    name,
    symbol,
    metadataUri,
    isMetadataMutable,
    cluster = "mainnet-beta",
    splTokenProgram = TOKEN_PROGRAM_ID,
  } = params;
  const umi = getUmiInstance(userPublicKey, cluster);
  const userUmiSigner = umi.identity;

  const createMetadataIx = createV1(umi, {
    mint: fromWeb3JsPublicKey(mintPublicKey),
    authority: userUmiSigner,
    name,
    symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(0, 2),
    tokenStandard: TokenStandard.Fungible,
    isMutable: isMetadataMutable,
    payer: userUmiSigner,
    updateAuthority: userUmiSigner,
    splTokenProgram: fromWeb3JsPublicKey(splTokenProgram),
  }).getInstructions();

  return createMetadataIx.map((ix) => ({
    keys: ix.keys.map((key) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    programId: new PublicKey(ix.programId),
    data: Buffer.from(ix.data),
  }));
}
