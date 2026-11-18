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
  TOKEN_2022_PROGRAM_ID,
  createInitializeMint2Instruction,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddress,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
  getMintLen,
  ExtensionType,
  createInitializeTransferFeeConfigInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeNonTransferableMintInstruction,
  createInitializePermanentDelegateInstruction,
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
  customCreatorInfo?: boolean;
  useNativeMetadataExtension?: boolean;
  additionalMetadata?: Array<[string, string]>;
  transferFee?: {
    basisPoints: number;
    maxFee: number;
  };
  soulbound?: boolean;
  permanentDelegate?: boolean;
  vanityPublicKey?: string;
  vanityCharLength?: number;
  hasJitoBundle?: boolean;
  isMultiWalletBundle?: boolean;
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

function calculateToken2022MetadataRentBytes(params: {
  name: string;
  symbol: string;
  uri: string;
  additionalMetadata?: Array<[string, string]>;
}): number {
  const baseBytes =
    112 +
    Buffer.byteLength(params.name, "utf-8") +
    Buffer.byteLength(params.symbol, "utf-8") +
    Buffer.byteLength(params.uri, "utf-8");

  const extraBytes = (params.additionalMetadata || []).reduce(
    (acc, [k, v]) =>
      acc + 16 + Buffer.byteLength(k, "utf-8") + Buffer.byteLength(v, "utf-8"),
    0
  );

  return baseBytes + extraBytes;
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
    customCreatorInfo = false,
    useNativeMetadataExtension = false,
    additionalMetadata = [],
    transferFee,
    soulbound = false,
    permanentDelegate = false,
    vanityPublicKey,
    vanityCharLength = 0,
    hasJitoBundle = false,
    isMultiWalletBundle = false,
    affiliate,
    network = "mainnet-beta",
  } = params;

  const userPublicKey = new PublicKey(wallet);
  const serverGeneratedMintKeypair = vanityPublicKey ? null : Keypair.generate();
  const mintPublicKey = vanityPublicKey
    ? new PublicKey(vanityPublicKey)
    : serverGeneratedMintKeypair!.publicKey;

  const connection = getSolanaConnection(network);

  const hasTransferFee = Boolean(transferFee && transferFee.basisPoints > 0);
  const extensions: ExtensionType[] = [];

  if (hasTransferFee) {
    extensions.push(ExtensionType.TransferFeeConfig);
  }
  if (soulbound) {
    extensions.push(ExtensionType.NonTransferable);
  }
  if (permanentDelegate) {
    extensions.push(ExtensionType.PermanentDelegate);
  }
  if (useNativeMetadataExtension) {
    extensions.push(ExtensionType.MetadataPointer);
  }

  const mintSpace = extensions.length > 0 ? getMintLen(extensions) : getMintLen([]);
  const extraMetadataSpace = useNativeMetadataExtension
    ? calculateToken2022MetadataRentBytes({
        name,
        symbol,
        uri: metadataUri,
        additionalMetadata,
      })
    : 0;

  const rawSupply = toRawTokenAmount(supply, decimals);
  const [rentLamports, userSolBalance] = await Promise.all([
    connection.getMinimumBalanceForRentExemption(mintSpace + extraMetadataSpace),
    connection.getBalance(userPublicKey, "confirmed"),
  ]);

  const { totalLamports: modularFeeLamports, totalSol: modularFeeSol } =
    calculateModularTokenCreationFee({
      revokeFreeze: !freezeAuthority,
      revokeMint: !mintAuthority,
      immutableMetadata: !isMetadataMutable,
      customCreatorInfo: Boolean(customCreatorInfo),
      hasTransferFeeExtension: hasTransferFee,
      hasSoulboundExtension: Boolean(soulbound),
      hasPermanentDelegateExtension: Boolean(permanentDelegate),
      vanityCharLength,
      hasJitoBundle,
      isMultiWalletBundle,
    });

  const estimatedExtraLamports =
    rentLamports + (useNativeMetadataExtension ? 5_000_000 : Math.round(0.018 * LAMPORTS_PER_SOL));
  const totalRequiredLamports = modularFeeLamports + estimatedExtraLamports;

  if (userSolBalance < totalRequiredLamports) {
    const haveSol = (userSolBalance / LAMPORTS_PER_SOL).toFixed(4);
    const needSol = (totalRequiredLamports / LAMPORTS_PER_SOL).toFixed(4);
    throw new Error(
      `Insufficient SOL balance on ${network}: your wallet has ${haveSol} SOL, but creating this Token-2022 asset requires ~${needSol} SOL (${modularFeeSol.toFixed(
        2
      )} SOL modular service fee + Solana account rent).`
    );
  }

  const associatedTokenAccount = await getAssociatedTokenAddress(
    mintPublicKey,
    userPublicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  const coreInstructions: TransactionInstruction[] = [
    ...buildServiceFeeInstructions(userPublicKey, modularFeeLamports, affiliate),
    SystemProgram.createAccount({
      fromPubkey: userPublicKey,
      newAccountPubkey: mintPublicKey,
      space: mintSpace,
      lamports: rentLamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
  ];

  // Extension initialization instructions MUST precede createInitializeMint2Instruction
  if (hasTransferFee && transferFee) {
    const rawMaxFee =
      transferFee.maxFee > 0 ? toRawTokenAmount(transferFee.maxFee, decimals) : rawSupply;

    coreInstructions.push(
      createInitializeTransferFeeConfigInstruction(
        mintPublicKey,
        userPublicKey,
        userPublicKey,
        transferFee.basisPoints,
        rawMaxFee,
        TOKEN_2022_PROGRAM_ID
      )
    );
  }

  if (soulbound) {
    coreInstructions.push(
      createInitializeNonTransferableMintInstruction(mintPublicKey, TOKEN_2022_PROGRAM_ID)
    );
  }

  if (permanentDelegate) {
    coreInstructions.push(
      createInitializePermanentDelegateInstruction(
        mintPublicKey,
        userPublicKey,
        TOKEN_2022_PROGRAM_ID
      )
    );
  }

  if (useNativeMetadataExtension) {
    coreInstructions.push(
      createInitializeMetadataPointerInstruction(
        mintPublicKey,
        userPublicKey,
        mintPublicKey,
        TOKEN_2022_PROGRAM_ID
      )
    );
  }

  coreInstructions.push(
    createInitializeMint2Instruction(
      mintPublicKey,
      decimals,
      userPublicKey,
      userPublicKey,
      TOKEN_2022_PROGRAM_ID
    )
  );

  if (useNativeMetadataExtension) {
    coreInstructions.push(
      createInitializeNativeTokenMetadataIx({
        mint: mintPublicKey,
        updateAuthority: userPublicKey,
        mintAuthority: userPublicKey,
        name,
        symbol,
        uri: metadataUri,
      })
    );

    for (const [fieldKey, fieldValue] of additionalMetadata) {
      if (fieldKey && fieldValue) {
        coreInstructions.push(
          createUpdateNativeMetadataFieldIx({
            mint: mintPublicKey,
            updateAuthority: userPublicKey,
            fieldKey,
            fieldValue,
          })
        );
      }
    }
  } else {
    coreInstructions.push(
      ...buildMetaplexMetadataInstructions({
        userPublicKey,
        mintPublicKey,
        name,
        symbol,
        metadataUri,
        isMetadataMutable,
        cluster: network,
        splTokenProgram: TOKEN_2022_PROGRAM_ID,
      })
    );
  }

  coreInstructions.push(
    createAssociatedTokenAccountIdempotentInstruction(
      userPublicKey,
      associatedTokenAccount,
      userPublicKey,
      mintPublicKey,
      TOKEN_2022_PROGRAM_ID
    ),
    createMintToInstruction(
      mintPublicKey,
      associatedTokenAccount,
      userPublicKey,
      rawSupply,
      [],
      TOKEN_2022_PROGRAM_ID
    )
  );

  if (!freezeAuthority) {
    coreInstructions.push(
      createSetAuthorityInstruction(
        mintPublicKey,
        userPublicKey,
        AuthorityType.FreezeAccount,
        null,
        [],
        TOKEN_2022_PROGRAM_ID
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
        TOKEN_2022_PROGRAM_ID
      )
    );
  }

  const computeBudgetIxs = await buildDynamicComputeBudgetInstructions({
    connection,
    payerKey: userPublicKey,
    instructions: coreInstructions,
    defaultUnits: 520_000,
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
