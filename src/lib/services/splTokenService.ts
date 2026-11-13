import {
  Keypair,
  PublicKey,
  SystemProgram,
  ComputeBudgetProgram,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
  MINT_SIZE,
} from "@solana/spl-token";
import { SERVICE_FEE_CREATE_TOKEN_LAMPORTS, SolanaCluster } from "@/lib/constants";
import { toRawTokenAmount } from "@/lib/security";
import {
  buildMetaplexMetadataInstructions,
  buildServiceFeeInstructions,
  getSolanaConnection,
} from "./solanaHelpers";

export interface CreateSplTokenParams {
  name: string;
  symbol: string;
  metadataUri: string;
  decimals: number;
  supply: number | string;
  wallet: string;
  mintAuthority: boolean;
  freezeAuthority: boolean;
  isMetadataMutable: boolean;
  affiliate?: string | null;
  network?: SolanaCluster;
}

export async function createSplTokenTransaction(params: CreateSplTokenParams) {
  const {
    name,
    symbol,
    metadataUri,
    decimals,
    supply,
    wallet,
    mintAuthority,
    freezeAuthority,
    isMetadataMutable,
    affiliate,
    network = "mainnet-beta",
  } = params;

  const userPublicKey = new PublicKey(wallet);
  const mintKeypair = Keypair.generate();
  const connection = getSolanaConnection(network);

  const rawSupply = toRawTokenAmount(supply, decimals);
  const rentLamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

  const associatedTokenAccount = await getAssociatedTokenAddress(
    mintKeypair.publicKey,
    userPublicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  const instructions: TransactionInstruction[] = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 15_000 }),
    ...buildServiceFeeInstructions(userPublicKey, SERVICE_FEE_CREATE_TOKEN_LAMPORTS, affiliate),
    SystemProgram.createAccount({
      fromPubkey: userPublicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports: rentLamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      decimals,
      userPublicKey,
      freezeAuthority ? userPublicKey : null,
      TOKEN_PROGRAM_ID
    ),
    createAssociatedTokenAccountInstruction(
      userPublicKey,
      associatedTokenAccount,
      userPublicKey,
      mintKeypair.publicKey,
      TOKEN_PROGRAM_ID
    ),
    createMintToInstruction(
      mintKeypair.publicKey,
      associatedTokenAccount,
      userPublicKey,
      rawSupply,
      [],
      TOKEN_PROGRAM_ID
    ),
    ...buildMetaplexMetadataInstructions({
      userPublicKey,
      mintPublicKey: mintKeypair.publicKey,
      name,
      symbol,
      metadataUri,
      isMetadataMutable,
      cluster: network,
    }),
  ];

  if (!mintAuthority) {
    instructions.push(
      createSetAuthorityInstruction(
        mintKeypair.publicKey,
        userPublicKey,
        AuthorityType.MintTokens,
        null,
        [],
        TOKEN_PROGRAM_ID
      )
    );
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

  const messageV0 = new TransactionMessage({
    payerKey: userPublicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);
  transaction.sign([mintKeypair]);

  const serializedTransaction = transaction.serialize();
  const base64Transaction = Buffer.from(serializedTransaction).toString("base64");

  return {
    transaction: base64Transaction,
    mintAddress: mintKeypair.publicKey.toBase58(),
    blockhash,
    lastValidBlockHeight,
    network,
  };
}
