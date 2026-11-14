import {
  Keypair,
  LAMPORTS_PER_SOL,
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
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddress,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
  MINT_SIZE,
} from "@solana/spl-token";
import {
  calculateModularTokenCreationFee,
  SolanaCluster,
} from "@/lib/constants";
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
  customCreatorInfo?: boolean;
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
    customCreatorInfo = false,
    affiliate,
    network = "mainnet-beta",
  } = params;

  const userPublicKey = new PublicKey(wallet);
  const mintKeypair = Keypair.generate();
  const connection = getSolanaConnection(network);

  const rawSupply = toRawTokenAmount(supply, decimals);
  const [rentLamports, userSolBalance] = await Promise.all([
    connection.getMinimumBalanceForRentExemption(MINT_SIZE),
    connection.getBalance(userPublicKey, "confirmed"),
  ]);

  // Phase 1: Calculate exact modular fee in lamports based on selected security & metadata flags
  const { totalLamports: modularFeeLamports, totalSol: modularFeeSol } =
    calculateModularTokenCreationFee({
      revokeFreeze: !freezeAuthority,
      revokeMint: !mintAuthority,
      immutableMetadata: !isMetadataMutable,
      customCreatorInfo: Boolean(customCreatorInfo),
      hasTransferFeeExtension: false,
    });

  const estimatedRentAndMetaplexLamports = rentLamports + Math.round(0.018 * LAMPORTS_PER_SOL);
  const totalRequiredLamports = modularFeeLamports + estimatedRentAndMetaplexLamports;

  if (userSolBalance < totalRequiredLamports) {
    const haveSol = (userSolBalance / LAMPORTS_PER_SOL).toFixed(4);
    const needSol = (totalRequiredLamports / LAMPORTS_PER_SOL).toFixed(4);
    throw new Error(
      `Insufficient SOL balance on ${network}: your wallet has ${haveSol} SOL, but creating this token requires ~${needSol} SOL (${modularFeeSol.toFixed(
        2
      )} SOL modular service fee + ~0.02 SOL Solana account rent).`
    );
  }

  const associatedTokenAccount = await getAssociatedTokenAddress(
    mintKeypair.publicKey,
    userPublicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  // Initialize Mint with userPublicKey as temporary freezeAuthority if we also want an explicit createSetAuthorityInstruction(FreezeAccount -> null) or initialize directly
  const instructions: TransactionInstruction[] = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 420_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25_000 }),
    ...buildServiceFeeInstructions(userPublicKey, modularFeeLamports, affiliate),
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
      userPublicKey,
      TOKEN_PROGRAM_ID
    ),
    createAssociatedTokenAccountIdempotentInstruction(
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
      splTokenProgram: TOKEN_PROGRAM_ID,
    }),
  ];

  // Execute explicit on-chain authority revocations paid by the user
  if (!freezeAuthority) {
    instructions.push(
      createSetAuthorityInstruction(
        mintKeypair.publicKey,
        userPublicKey,
        AuthorityType.FreezeAccount,
        null,
        [],
        TOKEN_PROGRAM_ID
      )
    );
  }

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
    serviceFeeSol: modularFeeSol,
    blockhash,
    lastValidBlockHeight,
    network,
  };
}
