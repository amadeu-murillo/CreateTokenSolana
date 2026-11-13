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
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddress,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
  getMintLen,
  ExtensionType,
  createInitializeTransferFeeConfigInstruction,
  createInitializeMetadataPointerInstruction,
} from "@solana/spl-token";
import {
  SERVICE_FEE_CREATE_TOKEN_LAMPORTS,
  STANDARD_SERVICE_FEE_LAMPORTS,
  SolanaCluster,
} from "@/lib/constants";
import { toRawTokenAmount } from "@/lib/security";
import {
  buildMetaplexMetadataInstructions,
  buildServiceFeeInstructions,
  getSolanaConnection,
} from "./solanaHelpers";

export interface CreateToken2022Params {
  name: string;
  symbol: string;
  metadataUri: string;
  decimals: number;
  supply: number | string;
  wallet: string;
  mintAuthority: boolean;
  freezeAuthority: boolean;
  isMetadataMutable: boolean;
  useNativeMetadataExtension?: boolean;
  additionalMetadata?: Array<[string, string]>;
  transferFee?: {
    basisPoints: number;
    maxFee: number;
  };
  affiliate?: string | null;
  network?: SolanaCluster;
}

const INITIALIZE_TOKEN_METADATA_DISCRIMINATOR = Buffer.from([
  210, 225, 30, 162, 88, 184, 77, 141,
]);

const UPDATE_TOKEN_METADATA_FIELD_DISCRIMINATOR = Buffer.from([
  221, 233, 49, 45, 181, 202, 220, 200,
]);

function serializeBorshString(value: string): Buffer {
  const strBuf = Buffer.from(value, "utf-8");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(strBuf.length, 0);
  return Buffer.concat([lenBuf, strBuf]);
}

function createInitializeNativeTokenMetadataIx(params: {
  mint: PublicKey;
  updateAuthority: PublicKey;
  mintAuthority: PublicKey;
  name: string;
  symbol: string;
  uri: string;
}): TransactionInstruction {
  const data = Buffer.concat([
    INITIALIZE_TOKEN_METADATA_DISCRIMINATOR,
    serializeBorshString(params.name),
    serializeBorshString(params.symbol),
    serializeBorshString(params.uri),
  ]);

  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [
      { pubkey: params.mint, isSigner: false, isWritable: true },
      { pubkey: params.updateAuthority, isSigner: false, isWritable: false },
      { pubkey: params.mint, isSigner: false, isWritable: false },
      { pubkey: params.mintAuthority, isSigner: true, isWritable: false },
    ],
    data,
  });
}

function createUpdateNativeMetadataFieldIx(params: {
  mint: PublicKey;
  updateAuthority: PublicKey;
  fieldKey: string;
  fieldValue: string;
}): TransactionInstruction {
  const enumVariant = Buffer.from([3]);
  const data = Buffer.concat([
    UPDATE_TOKEN_METADATA_FIELD_DISCRIMINATOR,
    enumVariant,
    serializeBorshString(params.fieldKey),
    serializeBorshString(params.fieldValue),
  ]);

  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [
      { pubkey: params.mint, isSigner: false, isWritable: true },
      { pubkey: params.updateAuthority, isSigner: true, isWritable: false },
    ],
    data,
  });
}

function calculateNativeMetadataTlvByteLength(
  name: string,
  symbol: string,
  uri: string,
  additionalMetadata: Array<[string, string]> = []
): number {
  let size =
    4 +
    32 +
    32 +
    (4 + Buffer.byteLength(name, "utf-8")) +
    (4 + Buffer.byteLength(symbol, "utf-8")) +
    (4 + Buffer.byteLength(uri, "utf-8")) +
    4;

  for (const [k, v] of additionalMetadata) {
    size += 4 + Buffer.byteLength(k, "utf-8") + (4 + Buffer.byteLength(v, "utf-8"));
  }
  return size + 16;
}

export async function createToken2022Transaction(params: CreateToken2022Params) {
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
    useNativeMetadataExtension = false,
    additionalMetadata = [],
    transferFee,
    affiliate,
    network = "mainnet-beta",
  } = params;

  const userPublicKey = new PublicKey(wallet);
  const mintKeypair = Keypair.generate();
  const connection = getSolanaConnection(network);

  const rawSupply = toRawTokenAmount(supply, decimals);
  const hasTransferFee = Boolean(transferFee && transferFee.basisPoints > 0);

  const extensions: ExtensionType[] = [];
  if (hasTransferFee) {
    extensions.push(ExtensionType.TransferFeeConfig);
  }
  if (useNativeMetadataExtension) {
    extensions.push(ExtensionType.MetadataPointer);
  }

  const baseMintLen = getMintLen(extensions);
  const extraTlvBytes = useNativeMetadataExtension
    ? calculateNativeMetadataTlvByteLength(name, symbol, metadataUri, additionalMetadata)
    : 0;

  const [totalRentLamports, userSolBalance] = await Promise.all([
    connection.getMinimumBalanceForRentExemption(baseMintLen + extraTlvBytes),
    connection.getBalance(userPublicKey, "confirmed"),
  ]);

  const estimatedExtraLamports =
    totalRentLamports + Math.round((useNativeMetadataExtension ? 0.005 : 0.018) * LAMPORTS_PER_SOL);
  const effectiveServiceFeeLamports =
    network === "devnet" &&
    userSolBalance < SERVICE_FEE_CREATE_TOKEN_LAMPORTS + estimatedExtraLamports
      ? STANDARD_SERVICE_FEE_LAMPORTS
      : SERVICE_FEE_CREATE_TOKEN_LAMPORTS;

  const totalRequiredLamports = effectiveServiceFeeLamports + estimatedExtraLamports;
  if (userSolBalance < totalRequiredLamports) {
    const haveSol = (userSolBalance / LAMPORTS_PER_SOL).toFixed(4);
    const needSol = (totalRequiredLamports / LAMPORTS_PER_SOL).toFixed(4);
    throw new Error(
      `Insufficient SOL balance on ${network}: your wallet has ${haveSol} SOL, but creating this Token-2022 asset requires ~${needSol} SOL (${(
        effectiveServiceFeeLamports / LAMPORTS_PER_SOL
      ).toFixed(2)} SOL service fee + account rent).`
    );
  }

  const associatedTokenAccount = await getAssociatedTokenAddress(
    mintKeypair.publicKey,
    userPublicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  const instructions: TransactionInstruction[] = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25_000 }),
    ...buildServiceFeeInstructions(userPublicKey, effectiveServiceFeeLamports, affiliate),
    SystemProgram.createAccount({
      fromPubkey: userPublicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: baseMintLen,
      lamports: totalRentLamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
  ];

  if (hasTransferFee && transferFee) {
    const rawMaxFee =
      transferFee.maxFee > 0 ? toRawTokenAmount(transferFee.maxFee, decimals) : BigInt(0);

    instructions.push(
      createInitializeTransferFeeConfigInstruction(
        mintKeypair.publicKey,
        userPublicKey,
        userPublicKey,
        transferFee.basisPoints,
        rawMaxFee,
        TOKEN_2022_PROGRAM_ID
      )
    );
  }

  if (useNativeMetadataExtension) {
    instructions.push(
      createInitializeMetadataPointerInstruction(
        mintKeypair.publicKey,
        isMetadataMutable ? userPublicKey : null,
        mintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID
      )
    );
  }

  instructions.push(
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      decimals,
      userPublicKey,
      freezeAuthority ? userPublicKey : null,
      TOKEN_2022_PROGRAM_ID
    )
  );

  if (useNativeMetadataExtension) {
    instructions.push(
      createInitializeNativeTokenMetadataIx({
        mint: mintKeypair.publicKey,
        updateAuthority: userPublicKey,
        mintAuthority: userPublicKey,
        name,
        symbol,
        uri: metadataUri,
      })
    );

    for (const [fieldKey, fieldValue] of additionalMetadata) {
      if (fieldKey && fieldValue) {
        instructions.push(
          createUpdateNativeMetadataFieldIx({
            mint: mintKeypair.publicKey,
            updateAuthority: userPublicKey,
            fieldKey,
            fieldValue,
          })
        );
      }
    }
  } else {
    instructions.push(
      ...buildMetaplexMetadataInstructions({
        userPublicKey,
        mintPublicKey: mintKeypair.publicKey,
        name,
        symbol,
        metadataUri,
        isMetadataMutable,
        cluster: network,
        splTokenProgram: TOKEN_2022_PROGRAM_ID,
      })
    );
  }

  instructions.push(
    createAssociatedTokenAccountIdempotentInstruction(
      userPublicKey,
      associatedTokenAccount,
      userPublicKey,
      mintKeypair.publicKey,
      TOKEN_2022_PROGRAM_ID
    ),
    createMintToInstruction(
      mintKeypair.publicKey,
      associatedTokenAccount,
      userPublicKey,
      rawSupply,
      [],
      TOKEN_2022_PROGRAM_ID
    )
  );

  if (!mintAuthority) {
    instructions.push(
      createSetAuthorityInstruction(
        mintKeypair.publicKey,
        userPublicKey,
        AuthorityType.MintTokens,
        null,
        [],
        TOKEN_2022_PROGRAM_ID
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
    metadataMode: useNativeMetadataExtension ? "token-2022-native-extension" : "metaplex-pda",
    metadataUri,
    serviceFeeSol: effectiveServiceFeeLamports / LAMPORTS_PER_SOL,
    blockhash,
    lastValidBlockHeight,
    network,
  };
}
