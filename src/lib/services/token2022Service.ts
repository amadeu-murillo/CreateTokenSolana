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
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
  getMintLen,
  ExtensionType,
  createInitializeTransferFeeConfigInstruction,
  createInitializeMetadataPointerInstruction,
} from "@solana/spl-token";
import { SERVICE_FEE_CREATE_TOKEN_LAMPORTS, SolanaCluster } from "@/lib/constants";
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

// SPL Token-2022 Metadata Interface discriminators
// SHA256("spl_token_metadata_interface:initialize_account")[0..8]
const INITIALIZE_TOKEN_METADATA_DISCRIMINATOR = Buffer.from([
  210, 225, 30, 162, 88, 184, 77, 141,
]);

// SHA256("spl_token_metadata_interface:updating_field")[0..8]
const UPDATE_TOKEN_METADATA_FIELD_DISCRIMINATOR = Buffer.from([
  221, 233, 49, 45, 181, 202, 220, 200,
]);

function serializeBorshString(value: string): Buffer {
  const strBuf = Buffer.from(value, "utf-8");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(strBuf.length, 0);
  return Buffer.concat([lenBuf, strBuf]);
}

/**
 * Builds the native Token-2022 InitializeTokenMetadata instruction
 * which writes `name`, `symbol`, and `uri` directly inside the Token-2022 Mint account on-chain.
 */
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

/**
 * Builds the native Token-2022 UpdateField instruction to store custom key-value pairs
 * (such as description, website, twitter, storageProvider) directly inside the Mint account on-chain.
 */
function createUpdateNativeMetadataFieldIx(params: {
  mint: PublicKey;
  updateAuthority: PublicKey;
  fieldKey: string;
  fieldValue: string;
}): TransactionInstruction {
  // Field::Key(String) enum variant index = 3 in spl-token-metadata interface
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

/**
 * Calculates the exact byte size of the variable-length TokenMetadata TLV extension
 * so the Mint account is pre-funded with sufficient rent-exempt lamports before reallocation.
 */
function calculateNativeMetadataTlvByteLength(
  name: string,
  symbol: string,
  uri: string,
  additionalMetadata: Array<[string, string]> = []
): number {
  // TLV header (4 bytes) + updateAuthority (32 bytes) + mint (32 bytes) + 3 Borsh strings + vec length (4 bytes)
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
  return size + 16; // safety padding
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
    useNativeMetadataExtension = true,
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

  // Base space allocated in SystemProgram.createAccount must match fixed-size extensions ONLY
  const baseMintLen = getMintLen(extensions);
  const extraTlvBytes = useNativeMetadataExtension
    ? calculateNativeMetadataTlvByteLength(name, symbol, metadataUri, additionalMetadata)
    : 0;

  const totalRentLamports = await connection.getMinimumBalanceForRentExemption(
    baseMintLen + extraTlvBytes
  );

  const associatedTokenAccount = await getAssociatedTokenAddress(
    mintKeypair.publicKey,
    userPublicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  const instructions: TransactionInstruction[] = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 15_000 }),
    ...buildServiceFeeInstructions(userPublicKey, SERVICE_FEE_CREATE_TOKEN_LAMPORTS, affiliate),
    SystemProgram.createAccount({
      fromPubkey: userPublicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: baseMintLen,
      lamports: totalRentLamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
  ];

  // 1. Initialize TransferFeeConfig extension (if enabled) BEFORE InitializeMint
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

  // 2. Initialize MetadataPointer extension (pointing directly to the Mint account itself) BEFORE InitializeMint
  if (useNativeMetadataExtension) {
    instructions.push(
      createInitializeMetadataPointerInstruction(
        mintKeypair.publicKey,
        isMetadataMutable ? userPublicKey : null,
        mintKeypair.publicKey, // Self-referential on-chain metadata storage!
        TOKEN_2022_PROGRAM_ID
      )
    );
  }

  // 3. Initialize the Token-2022 Mint
  instructions.push(
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      decimals,
      userPublicKey,
      freezeAuthority ? userPublicKey : null,
      TOKEN_2022_PROGRAM_ID
    )
  );

  // 4. Initialize On-Chain Metadata (Either Native Token-2022 Extension or Metaplex PDA)
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
      })
    );
  }

  // 5. Create Associated Token Account and Mint initial supply
  instructions.push(
    createAssociatedTokenAccountInstruction(
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

  // 6. Revoke Mint Authority if requested
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
    blockhash,
    lastValidBlockHeight,
    network,
  };
}
