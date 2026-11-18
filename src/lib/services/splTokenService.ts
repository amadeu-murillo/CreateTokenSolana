import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createInitializeMint2Instruction,
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
  buildDynamicComputeBudgetInstructions,
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
  vanityPublicKey?: string;
  vanityCharLength?: number;
  hasJitoBundle?: boolean;
  isMultiWalletBundle?: boolean;
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
    vanityPublicKey,
    vanityCharLength = 0,
    hasJitoBundle = false,
    isMultiWalletBundle = false,
    affiliate,
    network = "mainnet-beta",
  } = params;

  const userPublicKey = new PublicKey(wallet);
  // Phase 1.6: If the client generated a vanity mint, only its PublicKey is sent to the server;
  // the client signs partially with the vanity Keypair locally in the browser.
  const serverGeneratedMintKeypair = vanityPublicKey ? null : Keypair.generate();
  const mintPublicKey = vanityPublicKey
    ? new PublicKey(vanityPublicKey)
    : serverGeneratedMintKeypair!.publicKey;

  const connection = getSolanaConnection(network);

  const rawSupply = toRawTokenAmount(supply, decimals);
  const [rentLamports, userSolBalance] = await Promise.all([
    connection.getMinimumBalanceForRentExemption(MINT_SIZE),
    connection.getBalance(userPublicKey, "confirmed"),
  ]);

  const { totalLamports: modularFeeLamports, totalSol: modularFeeSol } =
    calculateModularTokenCreationFee({
      revokeFreeze: !freezeAuthority,
      revokeMint: !mintAuthority,
      immutableMetadata: !isMetadataMutable,
      customCreatorInfo: Boolean(customCreatorInfo),
      hasTransferFeeExtension: false,
      vanityCharLength,
      hasJitoBundle,
      isMultiWalletBundle,
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
    mintPublicKey,
    userPublicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  const coreInstructions: TransactionInstruction[] = [
    ...buildServiceFeeInstructions(userPublicKey, modularFeeLamports, affiliate),
    SystemProgram.createAccount({
      fromPubkey: userPublicKey,
      newAccountPubkey: mintPublicKey,
      space: MINT_SIZE,
      lamports: rentLamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMint2Instruction(
      mintPublicKey,
      decimals,
      userPublicKey,
      userPublicKey,
      TOKEN_PROGRAM_ID
    ),
    createAssociatedTokenAccountIdempotentInstruction(
      userPublicKey,
      associatedTokenAccount,
      userPublicKey,
      mintPublicKey,
      TOKEN_PROGRAM_ID
    ),
    createMintToInstruction(
      mintPublicKey,
      associatedTokenAccount,
      userPublicKey,
      rawSupply,
      [],
      TOKEN_PROGRAM_ID
    ),
    ...buildMetaplexMetadataInstructions({
      userPublicKey,
      mintPublicKey,
      name,
      symbol,
      metadataUri,
      isMetadataMutable,
      cluster: network,
      splTokenProgram: TOKEN_PROGRAM_ID,
    }),
  ];

  if (!freezeAuthority) {
    coreInstructions.push(
      createSetAuthorityInstruction(
        mintPublicKey,
        userPublicKey,
        AuthorityType.FreezeAccount,
        null,
        [],
        TOKEN_PROGRAM_ID
      )
    );
  }

  if (!mintAuthority) {
    coreInstructions.push(
      createSetAuthorityInstruction(
        mintPublicKey,
        userPublicKey,
        AuthorityType.MintTokens,
        null,
        [],
        TOKEN_PROGRAM_ID
      )
    );
  }

  const computeBudgetIxs = await buildDynamicComputeBudgetInstructions({
    connection,
    payerKey: userPublicKey,
    instructions: coreInstructions,
    defaultUnits: 420_000,
    defaultMicroLamports: 25_000,
  });

  const instructions: TransactionInstruction[] = [...computeBudgetIxs, ...coreInstructions];

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

  const messageV0 = new TransactionMessage({
    payerKey: userPublicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);
  if (serverGeneratedMintKeypair) {
    transaction.sign([serverGeneratedMintKeypair]);
  }

  const serializedTransaction = transaction.serialize();
  const base64Transaction = Buffer.from(serializedTransaction).toString("base64");

  return {
    transaction: base64Transaction,
    mintAddress: mintPublicKey.toBase58(),
    requiresClientMintSignature: Boolean(vanityPublicKey),
    serviceFeeSol: modularFeeSol,
    blockhash,
    lastValidBlockHeight,
    network,
  };
}
