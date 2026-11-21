import {
  ComputeBudgetProgram,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  Signer,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  AuthorityType,
  ExtensionType,
  MINT_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createSetAuthorityInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
  getExtensionTypes,
  getMint,
} from "@solana/spl-token";
import {
  ApiCpmmConfigInfo,
  ApiV3Token,
  CREATE_CPMM_POOL_FEE_ACC,
  CREATE_CPMM_POOL_PROGRAM,
  CpmmConfigInfoLayout,
  CpmmPoolInfoLayout,
  DEVNET_PROGRAM_ID,
  Percent,
  Raydium,
  TxVersion,
  getCpmmPdaAmmConfigId,
  getCpmmPdaPoolId,
  parseTokenAccountResp,
} from "@raydium-io/raydium-sdk-v2";
import BN from "bn.js";
import {
  SERVICE_FEE_REMOVE_LP_LAMPORTS,
  SERVICE_FEE_REMOVE_LP_SOL,
  SPL_MEMO_PROGRAM_ID,
  SolanaCluster,
  USDC_MINT_DEVNET,
  USDC_MINT_MAINNET,
  WSOL_MINT,
  getClusterDexConfig,
  getLpServiceFeeLamports,
} from "@/lib/constants";
import { isValidPublicKey, toRawTokenAmount } from "@/lib/security";
import {
  buildDynamicComputeBudgetInstructions,
  buildServiceFeeInstructions,
  getSolanaConnection,
} from "./solanaHelpers";

/**
 * Official Anchor discriminators for Raydium CPMM (CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C / Devnet DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb)
 */
export const RAYDIUM_CPMM_INITIALIZE_DISCRIMINATOR = Buffer.from([
  175, 175, 109, 31, 13, 152, 155, 237,
]);

export const RAYDIUM_CPMM_SWAP_BASE_INPUT_DISCRIMINATOR = Buffer.from([
  143, 190, 90, 218, 196, 30, 51, 222,
]);

export const RAYDIUM_CPMM_WITHDRAW_DISCRIMINATOR = Buffer.from([
  183, 18, 70, 156, 148, 109, 161, 34,
]);

export interface CreateLiquidityPoolInput {
  dex?: "raydium-cpmm";
  baseMint: string;
  quoteToken: "SOL" | "USDC";
  baseAmount: number | string;
  quoteAmount: number | string;
  feeTierBps: number;
  startTime?: number | null;
  revokeFreezeIfActive?: boolean;
  wallet: string;
  programId?: string;
  affiliate?: string | null;
  network?: SolanaCluster;
  isAtomicBundlePreMint?: boolean;
  baseDecimals?: number;
}

export interface CreateLiquidityPoolOutput {
  transaction: string;
  poolAddress: string;
  ammConfigAddress: string;
  lpMintAddress: string;
  baseVaultAddress: string;
  quoteVaultAddress: string;
  dex: "raydium-cpmm";
  initialPrice: number;
  lpTokensMinted: string;
  serviceFeeSol: number;
  freezeAuthorityRevokedInTx: boolean;
  blockhash: string;
  lastValidBlockHeight: number;
  network: SolanaCluster;
}

export interface RemoveLiquidityInput {
  baseMint: string;
  poolId?: string;
  lpMint?: string;
  withdrawPercentage: number; // 1 to 100
  wallet: string;
  programId?: string;
  affiliate?: string | null;
  network?: SolanaCluster;
}

export interface RemoveLiquidityOutput {
  transaction: string;
  poolId: string;
  lpMint: string;
  baseMint: string;
  quoteToken: "SOL" | "USDC";
  lpPairLabel: "LP-SOL" | "LP-USDC";
  quoteVaultAddress: string;
  withdrawnQuote: number;
  withdrawPercentage: number;
  estimatedQuoteReturned: string;
  estimatedBaseReturned: string;
  serviceFeeSol: number;
  blockhash: string;
  lastValidBlockHeight: number;
  network: SolanaCluster;
}

export function sortTokenMintsLexicographically(
  mintA: PublicKey,
  mintB: PublicKey
): { token0Mint: PublicKey; token1Mint: PublicKey; isBaseToken0: boolean } {
  const comparison = Buffer.compare(
    new Uint8Array(mintA.toBuffer()),
    new Uint8Array(mintB.toBuffer())
  );
  if (comparison < 0) {
    return { token0Mint: mintA, token1Mint: mintB, isBaseToken0: true };
  }
  return { token0Mint: mintB, token1Mint: mintA, isBaseToken0: false };
}

export interface RaydiumCpmmAccountsPda {
  raydiumProgramId: PublicKey;
  ammConfigPubkey: PublicKey;
  createPoolFeeReceiver: PublicKey;
  token0Mint: PublicKey;
  token1Mint: PublicKey;
  isBaseToken0: boolean;
  authPda: PublicKey;
  poolStatePda: PublicKey;
  lpMintPda: PublicKey;
  token0VaultPda: PublicKey;
  token1VaultPda: PublicKey;
  observationStatePda: PublicKey;
}

/**
 * Derives all canonical Raydium CPMM PDAs for a given pair of token mints.
 */
export function deriveRaydiumCpmmPdas(
  baseMint: PublicKey,
  quoteMint: PublicKey,
  network: SolanaCluster = "mainnet-beta",
  ammConfigOverride?: PublicKey
): RaydiumCpmmAccountsPda {
  const dexConfig = getClusterDexConfig(network);
  const raydiumProgramId = dexConfig.raydiumProgramId;
  const ammConfigPubkey = ammConfigOverride || dexConfig.raydiumAmmConfig;
  const createPoolFeeReceiver = dexConfig.raydiumFeeReceiver;

  const { token0Mint, token1Mint, isBaseToken0 } = sortTokenMintsLexicographically(
    baseMint,
    quoteMint
  );

  const [authPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_and_lp_mint_auth_seed")],
    raydiumProgramId
  );

  const [poolStatePda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("pool"),
      ammConfigPubkey.toBuffer(),
      token0Mint.toBuffer(),
      token1Mint.toBuffer(),
    ],
    raydiumProgramId
  );

  const [lpMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_lp_mint"), poolStatePda.toBuffer()],
    raydiumProgramId
  );

  const [token0VaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_vault"), poolStatePda.toBuffer(), token0Mint.toBuffer()],
    raydiumProgramId
  );

  const [token1VaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_vault"), poolStatePda.toBuffer(), token1Mint.toBuffer()],
    raydiumProgramId
  );

  const [observationStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("observation"), poolStatePda.toBuffer()],
    raydiumProgramId
  );

  return {
    raydiumProgramId,
    ammConfigPubkey,
    createPoolFeeReceiver,
    token0Mint,
    token1Mint,
    isBaseToken0,
    authPda,
    poolStatePda,
    lpMintPda,
    token0VaultPda,
    token1VaultPda,
    observationStatePda,
  };
}

export function encodeU64LE(value: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(value < BigInt(0) ? BigInt(0) : value, 0);
  return buf;
}

export function buildRaydiumCpmmInitializeInstruction(params: {
  creator: PublicKey;
  ammConfig: PublicKey;
  authority: PublicKey;
  poolState: PublicKey;
  token0Mint: PublicKey;
  token1Mint: PublicKey;
  lpMint: PublicKey;
  creatorToken0: PublicKey;
  creatorToken1: PublicKey;
  creatorLpToken: PublicKey;
  token0Vault: PublicKey;
  token1Vault: PublicKey;
  createPoolFee: PublicKey;
  observationState: PublicKey;
  token0Program: PublicKey;
  token1Program: PublicKey;
  raydiumProgramId: PublicKey;
  initAmount0: bigint;
  initAmount1: bigint;
  openTime: bigint;
}): TransactionInstruction {
  const data = Buffer.concat([
    RAYDIUM_CPMM_INITIALIZE_DISCRIMINATOR,
    encodeU64LE(params.initAmount0),
    encodeU64LE(params.initAmount1),
    encodeU64LE(params.openTime),
  ]);

  return new TransactionInstruction({
    programId: params.raydiumProgramId,
    keys: [
      { pubkey: params.creator, isSigner: true, isWritable: true },
      { pubkey: params.ammConfig, isSigner: false, isWritable: false },
      { pubkey: params.authority, isSigner: false, isWritable: false },
      { pubkey: params.poolState, isSigner: false, isWritable: true },
      { pubkey: params.token0Mint, isSigner: false, isWritable: false },
      { pubkey: params.token1Mint, isSigner: false, isWritable: false },
      { pubkey: params.lpMint, isSigner: false, isWritable: true },
      { pubkey: params.creatorToken0, isSigner: false, isWritable: true },
      { pubkey: params.creatorToken1, isSigner: false, isWritable: true },
      { pubkey: params.creatorLpToken, isSigner: false, isWritable: true },
      { pubkey: params.token0Vault, isSigner: false, isWritable: true },
      { pubkey: params.token1Vault, isSigner: false, isWritable: true },
      { pubkey: params.createPoolFee, isSigner: false, isWritable: true },
      { pubkey: params.observationState, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: params.token0Program, isSigner: false, isWritable: false },
      { pubkey: params.token1Program, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export function buildRaydiumCpmmSwapBaseInputInstruction(params: {
  payer: PublicKey;
  authority: PublicKey;
  ammConfig: PublicKey;
  poolState: PublicKey;
  inputTokenAccount: PublicKey;
  outputTokenAccount: PublicKey;
  inputVault: PublicKey;
  outputVault: PublicKey;
  inputTokenProgram: PublicKey;
  outputTokenProgram: PublicKey;
  inputTokenMint: PublicKey;
  outputTokenMint: PublicKey;
  observationState: PublicKey;
  raydiumProgramId: PublicKey;
  amountIn: bigint;
  minimumAmountOut: bigint;
}): TransactionInstruction {
  const data = Buffer.concat([
    RAYDIUM_CPMM_SWAP_BASE_INPUT_DISCRIMINATOR,
    encodeU64LE(params.amountIn),
    encodeU64LE(params.minimumAmountOut),
  ]);

  return new TransactionInstruction({
    programId: params.raydiumProgramId,
    keys: [
      { pubkey: params.payer, isSigner: true, isWritable: false },
      { pubkey: params.authority, isSigner: false, isWritable: false },
      { pubkey: params.ammConfig, isSigner: false, isWritable: false },
      { pubkey: params.poolState, isSigner: false, isWritable: true },
      { pubkey: params.inputTokenAccount, isSigner: false, isWritable: true },
      { pubkey: params.outputTokenAccount, isSigner: false, isWritable: true },
      { pubkey: params.inputVault, isSigner: false, isWritable: true },
      { pubkey: params.outputVault, isSigner: false, isWritable: true },
      { pubkey: params.inputTokenProgram, isSigner: false, isWritable: false },
      { pubkey: params.outputTokenProgram, isSigner: false, isWritable: false },
      { pubkey: params.inputTokenMint, isSigner: false, isWritable: false },
      { pubkey: params.outputTokenMint, isSigner: false, isWritable: false },
      { pubkey: params.observationState, isSigner: false, isWritable: true },
    ],
    data,
  });
}

export function buildRaydiumCpmmWithdrawInstruction(params: {
  owner: PublicKey;
  authority: PublicKey;
  poolState: PublicKey;
  ownerLpToken: PublicKey;
  token0Account: PublicKey;
  token1Account: PublicKey;
  token0Vault: PublicKey;
  token1Vault: PublicKey;
  token0Mint: PublicKey;
  token1Mint: PublicKey;
  lpMint: PublicKey;
  token0Program: PublicKey;
  token1Program: PublicKey;
  raydiumProgramId: PublicKey;
  lpTokenAmount: bigint;
  minimumToken0Amount: bigint;
  minimumToken1Amount: bigint;
}): TransactionInstruction {
  const data = Buffer.concat([
    RAYDIUM_CPMM_WITHDRAW_DISCRIMINATOR,
    encodeU64LE(params.lpTokenAmount),
    encodeU64LE(params.minimumToken0Amount),
    encodeU64LE(params.minimumToken1Amount),
  ]);

  return new TransactionInstruction({
    programId: params.raydiumProgramId,
    keys: [
      { pubkey: params.owner, isSigner: true, isWritable: false },
      { pubkey: params.authority, isSigner: false, isWritable: false },
      { pubkey: params.poolState, isSigner: false, isWritable: true },
      { pubkey: params.ownerLpToken, isSigner: false, isWritable: true },
      { pubkey: params.token0Account, isSigner: false, isWritable: true },
      { pubkey: params.token1Account, isSigner: false, isWritable: true },
      { pubkey: params.token0Vault, isSigner: false, isWritable: true },
      { pubkey: params.token1Vault, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: params.token0Program, isSigner: false, isWritable: false },
      { pubkey: params.token1Program, isSigner: false, isWritable: false },
      { pubkey: params.token0Mint, isSigner: false, isWritable: false },
      { pubkey: params.token1Mint, isSigner: false, isWritable: false },
      { pubkey: params.lpMint, isSigner: false, isWritable: true },
      { pubkey: SPL_MEMO_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  });
}

interface ParsedSplAccountData {
  parsed?: {
    info?: {
      mint?: string;
      owner?: string;
      tokenAmount?: {
        amount?: string;
        decimals?: number;
        uiAmountString?: string;
      };
    };
  };
}

function extractParsedTokenInfo(data: unknown) {
  if (data && typeof data === "object" && "parsed" in data) {
    return (data as ParsedSplAccountData).parsed?.info;
  }
  return undefined;
}

function bigIntSqrt(value: bigint): bigint {
  if (value <= BigInt(0)) return BigInt(0);
  if (value < BigInt(4)) return BigInt(1);
  let x0 = value / BigInt(2);
  let x1 = (x0 + value / x0) / BigInt(2);
  while (x1 < x0) {
    x0 = x1;
    x1 = (x0 + value / x0) / BigInt(2);
  }
  return x0;
}

function sortTokenMints(
  mintA: PublicKey,
  mintB: PublicKey
): { token0: PublicKey; token1: PublicKey; isBaseToken0: boolean } {
  const comparison = Buffer.compare(
    new Uint8Array(mintA.toBuffer()),
    new Uint8Array(mintB.toBuffer())
  );
  if (comparison < 0) {
    return { token0: mintA, token1: mintB, isBaseToken0: true };
  }
  return { token0: mintB, token1: mintA, isBaseToken0: false };
}

const RAYDIUM_CPMM_SUPPORTED_TOKEN_2022_EXTENSIONS = new Set<ExtensionType>([
  ExtensionType.TransferFeeConfig,
  ExtensionType.TransferFeeAmount,
  ExtensionType.MetadataPointer,
  ExtensionType.TokenMetadata,
  ExtensionType.InterestBearingConfig,
  ExtensionType.MintCloseAuthority,
  ExtensionType.DefaultAccountState,
  ExtensionType.MemoTransfer,
  ExtensionType.ImmutableOwner,
  ExtensionType.CpiGuard,
]);

function assertRaydiumToken2022Compatibility(mintAccountData: Buffer): void {
  if (mintAccountData.length <= MINT_SIZE) return;
  try {
    const extTypes = getExtensionTypes(mintAccountData);
    for (const ext of extTypes) {
      if (ext === ExtensionType.NonTransferable) {
        throw new Error(
          "Soulbound (NonTransferable) tokens cannot be deposited into a Raydium CPMM liquidity pool because pool vaults require transferable tokens."
        );
      }
      if (ext === ExtensionType.PermanentDelegate) {
        throw new Error(
          "Raydium CPMM rejects Token-2022 mints with the PermanentDelegate extension (Error: NotSupportMint). Disable Permanent Delegate when creating a token intended for Raydium liquidity pools."
        );
      }
      if (ext === ExtensionType.TransferHook) {
        throw new Error(
          "Raydium CPMM does not support Token-2022 mints with an active TransferHook extension."
        );
      }
      if (!RAYDIUM_CPMM_SUPPORTED_TOKEN_2022_EXTENSIONS.has(ext)) {
        throw new Error(
          `Raydium CPMM does not support Token-2022 extension type ${ExtensionType[ext] ?? ext}.`
        );
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("Raydium CPMM")) {
      throw err;
    }
  }
}

export function getFallbackCpmmConfigs(programId: PublicKey): ApiCpmmConfigInfo[] {
  const tiers = [
    { index: 0, tradeFeeRate: 2500, protocolFeeRate: 120000, fundFeeRate: 40000 }, // 0.25% (25 bps)
    { index: 1, tradeFeeRate: 10000, protocolFeeRate: 120000, fundFeeRate: 40000 }, // 1.00% (100 bps)
    { index: 2, tradeFeeRate: 20000, protocolFeeRate: 120000, fundFeeRate: 40000 }, // 2.00% (200 bps)
    { index: 3, tradeFeeRate: 40000, protocolFeeRate: 120000, fundFeeRate: 40000 }, // 4.00% (400 bps)
  ];

  return tiers.map((tier) => ({
    id: getCpmmPdaAmmConfigId(programId, tier.index).publicKey.toBase58(),
    index: tier.index,
    protocolFeeRate: tier.protocolFeeRate,
    tradeFeeRate: tier.tradeFeeRate,
    fundFeeRate: tier.fundFeeRate,
    createPoolFee: "150000000", // 0.15 SOL protocol pool creation fee
    creatorFeeRate: 0,
  }));
}

async function initRaydiumSdkServerSide(params: {
  userPublicKey: PublicKey;
  connection: Connection;
  network: SolanaCluster;
}): Promise<{ raydium: Raydium; userSolLamports: number }> {
  const { userPublicKey, connection, network } = params;
  const isDevnet = network === "devnet";

  const [raydium, solAccountResp, splTokenResp, token2022Resp] = await Promise.all([
    Raydium.load({
      owner: userPublicKey,
      connection,
      cluster: isDevnet ? "devnet" : "mainnet",
      disableFeatureCheck: true,
      disableLoadToken: true,
    }),
    connection.getAccountInfo(userPublicKey, "confirmed"),
    connection.getTokenAccountsByOwner(
      userPublicKey,
      { programId: TOKEN_PROGRAM_ID },
      "confirmed"
    ),
    connection.getTokenAccountsByOwner(
      userPublicKey,
      { programId: TOKEN_2022_PROGRAM_ID },
      "confirmed"
    ),
  ]);

  const tokenAccountData = parseTokenAccountResp({
    owner: userPublicKey,
    solAccountResp,
    tokenAccountResp: {
      context: splTokenResp.context,
      value: [...splTokenResp.value, ...token2022Resp.value],
    },
  });

  raydium.account.updateTokenAccount(tokenAccountData);

  return {
    raydium,
    userSolLamports: solAccountResp?.lamports ?? 0,
  };
}

/**
 * Phase 2.8: Fetches Raydium CPMM fee configs and strictly selects the config matching `feeTierBps`.
 * Throws an explicit error if the requested `feeTierBps` does not exist instead of silently picking the closest config.
 */
export async function resolveCpmmFeeConfig(params: {
  raydium?: Raydium;
  connection?: Connection;
  cpmmProgramId: PublicKey;
  feeTierBps: number;
  network: SolanaCluster;
  overrideConfigs?: ApiCpmmConfigInfo[];
}): Promise<{ selectedConfig: ApiCpmmConfigInfo; allConfigs: ApiCpmmConfigInfo[] }> {
  const { raydium, connection, cpmmProgramId, feeTierBps, network, overrideConfigs } = params;
  const isDevnet = network === "devnet";

  let feeConfigs: ApiCpmmConfigInfo[] = Array.isArray(overrideConfigs)
    ? [...overrideConfigs]
    : [];

  if (feeConfigs.length === 0 && raydium) {
    try {
      const cpmmWithOptionalConfigFetcher = raydium.cpmm as unknown as {
        getCpmmConfigs?: () => Promise<ApiCpmmConfigInfo[]>;
      };
      if (typeof cpmmWithOptionalConfigFetcher.getCpmmConfigs === "function") {
        feeConfigs = await cpmmWithOptionalConfigFetcher.getCpmmConfigs();
      } else if (raydium.api && typeof raydium.api.getCpmmConfigs === "function") {
        feeConfigs = await raydium.api.getCpmmConfigs();
      }
    } catch {
      feeConfigs = [];
    }
  }

  if (!Array.isArray(feeConfigs) || feeConfigs.length === 0) {
    feeConfigs = getFallbackCpmmConfigs(cpmmProgramId);
  } else if (isDevnet && !overrideConfigs) {
    feeConfigs = feeConfigs.map((cfg) => ({
      ...cfg,
      id: getCpmmPdaAmmConfigId(cpmmProgramId, cfg.index).publicKey.toBase58(),
    }));
  }

  if (isDevnet && connection && !overrideConfigs && feeConfigs.length > 0) {
    try {
      const configPubkeys = feeConfigs.map((c) => new PublicKey(c.id));
      const accInfos = await connection.getMultipleAccountsInfo(configPubkeys, "confirmed");
      const activeDevnetConfigs: ApiCpmmConfigInfo[] = [];

      accInfos.forEach((acc, idx) => {
        if (acc && acc.owner.equals(cpmmProgramId)) {
          const baseCfg = feeConfigs[idx];
          try {
            const decoded = CpmmConfigInfoLayout.decode(acc.data);
            activeDevnetConfigs.push({
              ...baseCfg,
              index: decoded.index,
              tradeFeeRate: decoded.tradeFeeRate.toNumber(),
              protocolFeeRate: decoded.protocolFeeRate.toNumber(),
              fundFeeRate: decoded.fundFeeRate.toNumber(),
              createPoolFee: decoded.createPoolFee.toString(),
              creatorFeeRate: decoded.creatorFeeRate
                ? decoded.creatorFeeRate.toNumber()
                : baseCfg.creatorFeeRate,
            });
          } catch {
            activeDevnetConfigs.push(baseCfg);
          }
        }
      });

      if (activeDevnetConfigs.length > 0) {
        feeConfigs = activeDevnetConfigs;
      }
    } catch {
      // Keep derived feeConfigs if RPC check fails
    }
  }

  const targetTradeFeeRate = feeTierBps <= 1000 ? feeTierBps * 100 : feeTierBps;

  const selectedConfig = feeConfigs.find(
    (c) => c.tradeFeeRate === targetTradeFeeRate || c.tradeFeeRate === feeTierBps
  );

  if (!selectedConfig) {
    const availableBps = Array.from(
      new Set(feeConfigs.map((c) => Math.round(c.tradeFeeRate / 100)))
    ).join(", ");
    throw new Error(
      `Unsupported Raydium CPMM fee tier: ${feeTierBps} bps on ${network}. Available fee tiers (bps): ${availableBps}.`
    );
  }

  return { selectedConfig, allConfigs: feeConfigs };
}

async function resolveRaydiumTokenInfo(params: {
  raydium: Raydium;
  mint: PublicKey;
  programId: PublicKey;
  decimals: number;
  symbol?: string;
  name?: string;
}): Promise<ApiV3Token> {
  const { raydium, mint, programId, decimals, symbol = "", name = "" } = params;
  try {
    const info = await raydium.token.getTokenInfo(mint);
    if (info && info.address) {
      return {
        ...info,
        address: mint.toBase58(),
        programId: programId.toBase58(),
        decimals: typeof info.decimals === "number" ? info.decimals : decimals,
      };
    }
  } catch {
    // Fallback to explicit on-chain token descriptor below
  }

  return {
    chainId: 101,
    address: mint.toBase58(),
    programId: programId.toBase58(),
    logoURI: "",
    symbol,
    name,
    decimals,
    tags: [],
    extensions: {},
  };
}

function extractExtraSigners(
  userPublicKey: PublicKey,
  sdkSigners?: Signer[],
  builderSigners?: Signer[]
): Signer[] {
  const combined = [...(sdkSigners || []), ...(builderSigners || [])];
  const uniqueByPubkey = new Map<string, Signer>();

  for (const signer of combined) {
    if (
      signer &&
      signer.publicKey &&
      signer.secretKey &&
      signer.secretKey.length > 0 &&
      !signer.publicKey.equals(userPublicKey)
    ) {
      uniqueByPubkey.set(signer.publicKey.toBase58(), signer);
    }
  }

  return Array.from(uniqueByPubkey.values());
}

function mapFriendlyRaydiumError(error: unknown, network: SolanaCluster): Error {
  const rawMessage = error instanceof Error ? error.message : String(error ?? "");
  const lower = rawMessage.toLowerCase();

  if (
    lower.includes("not support mint") ||
    lower.includes("notsupportmint") ||
    lower.includes("6007")
  ) {
    return new Error(
      "This Token-2022 mint uses an extension that Raydium CPMM does not support (NotSupportMint)."
    );
  }
  if (lower.includes("initlpamounttooless") || lower.includes("lp amount too less")) {
    return new Error(
      "Initial liquidity is below Raydium CPMM's minimum threshold (sqrt(baseAmount * quoteAmount) must exceed 100 raw units)."
    );
  }
  if (lower.includes("already in use") || lower.includes("pool already exists")) {
    return new Error(
      `A Raydium CPMM pool for this token pair and fee tier already exists on ${network}.`
    );
  }
  if (
    lower.includes("you don't has some token account") ||
    lower.includes("token account")
  ) {
    return new Error(
      `Required token account was not found in your wallet on ${network}. Verify your token and quote balances.`
    );
  }

  return error instanceof Error
    ? error
    : new Error(rawMessage || "Raydium CPMM operation failed.");
}

export async function createLiquidityPoolTransaction(
  input: CreateLiquidityPoolInput
): Promise<CreateLiquidityPoolOutput> {
  const {
    baseMint,
    quoteToken,
    baseAmount,
    quoteAmount,
    feeTierBps = 25,
    startTime,
    revokeFreezeIfActive = true,
    wallet,
    programId,
    affiliate,
    network = "mainnet-beta",
    isAtomicBundlePreMint = false,
    baseDecimals: providedBaseDecimals,
  } = input;

  const isDevnet = network === "devnet";
  const connection = getSolanaConnection(network);
  const dexConfig = getClusterDexConfig(network);
  const userPublicKey = new PublicKey(wallet);
  const baseMintPublicKey = new PublicKey(baseMint);
  const quoteMintPublicKey =
    quoteToken === "SOL" ? dexConfig.wsolMint : dexConfig.usdcMint;
  const quoteDecimals = quoteToken === "SOL" ? 9 : 6;

  if (baseMintPublicKey.equals(quoteMintPublicKey)) {
    throw new Error("Base token and quote token cannot be the same asset.");
  }

  const cpmmProgramId = isDevnet
    ? DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM
    : CREATE_CPMM_POOL_PROGRAM;
  const cpmmPoolFeeAccount = isDevnet
    ? DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC
    : CREATE_CPMM_POOL_FEE_ACC;

  // 1. Inspect Base Token Mint on-chain (supports both SPL Token and Token-2022, plus Block-Zero pre-mint atomic bundles)
  const baseMintAccountInfo = await connection.getAccountInfo(baseMintPublicKey, "confirmed");
  const isPreMintBundleMode = !baseMintAccountInfo && Boolean(isAtomicBundlePreMint);

  if (!baseMintAccountInfo && !isPreMintBundleMode) {
    throw new Error(
      `Token Mint (${baseMint.slice(0, 8)}...) was not found on Solana ${network}. Make sure your wallet and network selector are set to the same cluster where the token was minted.`
    );
  }

  const baseTokenProgramId = baseMintAccountInfo
    ? baseMintAccountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)
      ? TOKEN_2022_PROGRAM_ID
      : programId && programId === TOKEN_2022_PROGRAM_ID.toBase58()
      ? TOKEN_2022_PROGRAM_ID
      : TOKEN_PROGRAM_ID
    : programId && programId === TOKEN_2022_PROGRAM_ID.toBase58()
    ? TOKEN_2022_PROGRAM_ID
    : TOKEN_PROGRAM_ID;

  if (baseMintAccountInfo && baseTokenProgramId.equals(TOKEN_2022_PROGRAM_ID)) {
    assertRaydiumToken2022Compatibility(Buffer.from(baseMintAccountInfo.data));
  }

  const baseMintInfo = baseMintAccountInfo
    ? await getMint(connection, baseMintPublicKey, "confirmed", baseTokenProgramId)
    : null;

  const resolvedBaseDecimals =
    baseMintInfo?.decimals ??
    (typeof providedBaseDecimals === "number" ? providedBaseDecimals : 9);

  // 2. Convert amounts to raw BigInt & BN respecting real token decimals
  let rawBaseAmount = toRawTokenAmount(baseAmount, resolvedBaseDecimals);
  const rawQuoteAmount = toRawTokenAmount(quoteAmount, quoteDecimals);

  const initialLpSupplyRaw = bigIntSqrt(rawBaseAmount * rawQuoteAmount);
  if (initialLpSupplyRaw <= BigInt(100)) {
    throw new Error(
      "Initial liquidity is too small for Raydium CPMM: sqrt(baseAmount * quoteAmount) in raw units must be greater than 100."
    );
  }

  // 3. Verify User Base Token ATA & Balance (skipped only in Block-Zero pre-mint mode where Tx 1 creates & funds the ATA)
  const userBaseAta = await getAssociatedTokenAddress(
    baseMintPublicKey,
    userPublicKey,
    false,
    baseTokenProgramId
  );

  if (!isPreMintBundleMode) {
    const userBaseAccountParsed = await connection.getParsedAccountInfo(userBaseAta, "confirmed");
    const parsedBaseInfo = extractParsedTokenInfo(userBaseAccountParsed.value?.data);
    if (!parsedBaseInfo?.tokenAmount?.amount) {
      throw new Error(
        `Your wallet does not hold an active token account for ${baseMint.slice(0, 8)}... on Solana ${network}.`
      );
    }

    const userRawBaseBalance = BigInt(parsedBaseInfo.tokenAmount.amount);
    if (userRawBaseBalance <= BigInt(0)) {
      throw new Error("Your token balance is zero. Please select a token with a positive balance.");
    }

    if (rawBaseAmount > userRawBaseBalance) {
      const diff = rawBaseAmount - userRawBaseBalance;
      if (diff * BigInt(1000) <= userRawBaseBalance) {
        rawBaseAmount = userRawBaseBalance;
      } else {
        throw new Error(
          `Insufficient token balance: you entered ${baseAmount}, but your wallet holds ${parsedBaseInfo.tokenAmount.uiAmountString}.`
        );
      }
    }
  }

  if (quoteToken === "USDC") {
    const userUsdcAta = await getAssociatedTokenAddress(
      quoteMintPublicKey,
      userPublicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    const userUsdcParsed = await connection.getParsedAccountInfo(userUsdcAta, "confirmed");
    const parsedUsdcInfo = extractParsedTokenInfo(userUsdcParsed.value?.data);
    const userRawUsdcBalance = BigInt(parsedUsdcInfo?.tokenAmount?.amount || "0");
    if (userRawUsdcBalance < rawQuoteAmount) {
      const uiUsdc = parsedUsdcInfo?.tokenAmount?.uiAmountString || "0";
      throw new Error(
        `Insufficient USDC balance on ${network}: you entered ${quoteAmount} USDC, but your wallet holds ${uiUsdc} USDC.`
      );
    }
  }

  // 4. Initialize Raydium SDK v2 (Server-Side, owner = userPublicKey) & resolve CPMM feeConfig strictly
  const { raydium, userSolLamports } = await initRaydiumSdkServerSide({
    userPublicKey,
    connection,
    network,
  });

  const { selectedConfig: feeConfig } = await resolveCpmmFeeConfig({
    raydium,
    connection,
    cpmmProgramId,
    feeTierBps,
    network,
  });

  // 5. Check if the Raydium CPMM pool already exists for this token pair and fee tier
  const { token0, token1 } = sortTokenMints(baseMintPublicKey, quoteMintPublicKey);
  const expectedPoolPda = getCpmmPdaPoolId(
    cpmmProgramId,
    new PublicKey(feeConfig.id),
    token0,
    token1
  ).publicKey;

  const existingPoolAccount = await connection.getAccountInfo(expectedPoolPda, "confirmed");
  if (existingPoolAccount && existingPoolAccount.data.length > 0) {
    throw new Error(
      `A Raydium CPMM pool (${expectedPoolPda.toBase58()}) already exists for this token pair and fee tier (${(
        feeConfig.tradeFeeRate / 10000
      ).toFixed(2)}%) on ${network}.`
    );
  }

  // 6. Verify sufficient SOL balance (liquidity + service fee + Raydium protocol createPoolFee ~0.15 SOL + account rent)
  const lpFeeLamports = getLpServiceFeeLamports(network);
  const raydiumProtocolFeeLamports = Number(feeConfig.createPoolFee || "150000000");
  const estimatedRentLamports = Math.round(0.025 * LAMPORTS_PER_SOL);
  const quoteSolLamports = quoteToken === "SOL" ? Number(rawQuoteAmount) : 0;

  const requiredSolLamports =
    lpFeeLamports + quoteSolLamports + raydiumProtocolFeeLamports + estimatedRentLamports;

  if (userSolLamports < requiredSolLamports) {
    const neededSol = (requiredSolLamports / LAMPORTS_PER_SOL).toFixed(4);
    const currentSol = (userSolLamports / LAMPORTS_PER_SOL).toFixed(4);
    const raydiumFeeSol = (raydiumProtocolFeeLamports / LAMPORTS_PER_SOL).toFixed(2);
    throw new Error(
      `Insufficient SOL balance on ${network}: you have ${currentSol} SOL, but creating this Raydium CPMM pool requires ~${neededSol} SOL (${
        quoteToken === "SOL" ? `${quoteAmount} SOL liquidity + ` : ""
      }${(lpFeeLamports / LAMPORTS_PER_SOL).toFixed(2)} SOL service fee + ${raydiumFeeSol} SOL Raydium protocol fee + rent).`
    );
  }

  // 7. Build core instructions: Platform Service Fee (with affiliate split) + Freeze Authority Revocation + Raydium CPMM Pool
  const coreInstructions: TransactionInstruction[] = [
    ...buildServiceFeeInstructions(userPublicKey, lpFeeLamports, affiliate),
  ];

  let freezeAuthorityRevokedInTx = false;
  if (baseMintInfo?.freezeAuthority) {
    if (baseMintInfo.freezeAuthority.equals(userPublicKey) && revokeFreezeIfActive) {
      coreInstructions.push(
        createSetAuthorityInstruction(
          baseMintPublicKey,
          userPublicKey,
          AuthorityType.FreezeAccount,
          null,
          [],
          baseTokenProgramId
        )
      );
      freezeAuthorityRevokedInTx = true;
    } else if (!baseMintInfo.freezeAuthority.equals(userPublicKey)) {
      throw new Error(
        "This token has an active Freeze Authority controlled by another wallet. Raydium CPMM pools require Freeze Authority to be revoked."
      );
    } else {
      throw new Error(
        "Token Freeze Authority is active. Enable Auto-Revoke Freeze Authority or revoke it in the Manage tab before creating a Raydium pool."
      );
    }
  }

  const startTimeBn =
    typeof startTime === "number" && Number.isFinite(startTime) && startTime > 0
      ? new BN(Math.floor(startTime))
      : new BN(0);

  let poolAddress = expectedPoolPda.toBase58();
  let lpMintAddress = "";
  let baseVaultAddress = "";
  let quoteVaultAddress = "";
  let extraSigners: Signer[] = [];

  if (isPreMintBundleMode) {
    // 8A. Direct Raydium CPMM Initialize instruction for Block-Zero Atomic Bundles
    // (where Tx 1 creates the mint & ATA in the same block, so SDK on-chain ATA lookup would fail).
    const pdas = deriveRaydiumCpmmPdas(
      baseMintPublicKey,
      quoteMintPublicKey,
      network,
      new PublicKey(feeConfig.id)
    );

    const creatorQuoteAta = await getAssociatedTokenAddress(
      quoteMintPublicKey,
      userPublicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    const creatorLpToken = await getAssociatedTokenAddress(
      pdas.lpMintPda,
      userPublicKey,
      false,
      TOKEN_PROGRAM_ID
    );

    if (quoteToken === "SOL") {
      coreInstructions.push(
        createAssociatedTokenAccountIdempotentInstruction(
          userPublicKey,
          creatorQuoteAta,
          userPublicKey,
          quoteMintPublicKey,
          TOKEN_PROGRAM_ID
        ),
        SystemProgram.transfer({
          fromPubkey: userPublicKey,
          toPubkey: creatorQuoteAta,
          lamports: Number(rawQuoteAmount),
        }),
        createSyncNativeInstruction(creatorQuoteAta, TOKEN_PROGRAM_ID)
      );
    }

    const creatorToken0 = pdas.isBaseToken0 ? userBaseAta : creatorQuoteAta;
    const creatorToken1 = pdas.isBaseToken0 ? creatorQuoteAta : userBaseAta;
    const token0Program = pdas.isBaseToken0 ? baseTokenProgramId : TOKEN_PROGRAM_ID;
    const token1Program = pdas.isBaseToken0 ? TOKEN_PROGRAM_ID : baseTokenProgramId;
    const initAmount0 = pdas.isBaseToken0 ? rawBaseAmount : rawQuoteAmount;
    const initAmount1 = pdas.isBaseToken0 ? rawQuoteAmount : rawBaseAmount;

    coreInstructions.push(
      buildRaydiumCpmmInitializeInstruction({
        creator: userPublicKey,
        ammConfig: pdas.ammConfigPubkey,
        authority: pdas.authPda,
        poolState: pdas.poolStatePda,
        token0Mint: pdas.token0Mint,
        token1Mint: pdas.token1Mint,
        lpMint: pdas.lpMintPda,
        creatorToken0,
        creatorToken1,
        creatorLpToken,
        token0Vault: pdas.token0VaultPda,
        token1Vault: pdas.token1VaultPda,
        createPoolFee: cpmmPoolFeeAccount,
        observationState: pdas.observationStatePda,
        token0Program,
        token1Program,
        raydiumProgramId: cpmmProgramId,
        initAmount0,
        initAmount1,
        openTime: BigInt(startTimeBn.toString()),
      })
    );

    if (quoteToken === "SOL") {
      coreInstructions.push(
        createCloseAccountInstruction(
          creatorQuoteAta,
          userPublicKey,
          userPublicKey,
          [],
          TOKEN_PROGRAM_ID
        )
      );
    }

    poolAddress = pdas.poolStatePda.toBase58();
    lpMintAddress = pdas.lpMintPda.toBase58();
    baseVaultAddress = (
      pdas.isBaseToken0 ? pdas.token0VaultPda : pdas.token1VaultPda
    ).toBase58();
    quoteVaultAddress = (
      pdas.isBaseToken0 ? pdas.token1VaultPda : pdas.token0VaultPda
    ).toBase58();
  } else {
    // 8B. Standard flow: Resolve token descriptors and invoke `raydium.cpmm.createPool`
    const [mintAInfo, mintBInfo] = await Promise.all([
      resolveRaydiumTokenInfo({
        raydium,
        mint: baseMintPublicKey,
        programId: baseTokenProgramId,
        decimals: resolvedBaseDecimals,
        symbol: "BASE",
        name: "Base Token",
      }),
      resolveRaydiumTokenInfo({
        raydium,
        mint: quoteMintPublicKey,
        programId: TOKEN_PROGRAM_ID,
        decimals: quoteDecimals,
        symbol: quoteToken === "SOL" ? "WSOL" : "USDC",
        name: quoteToken === "SOL" ? "Wrapped SOL" : "USD Coin",
      }),
    ]);

    const baseAmountBn = new BN(rawBaseAmount.toString());
    const quoteAmountBn = new BN(rawQuoteAmount.toString());

    let createPoolBuilderResult: Awaited<ReturnType<typeof raydium.cpmm.createPool>>;
    try {
      createPoolBuilderResult = await raydium.cpmm.createPool({
        programId: cpmmProgramId,
        poolFeeAccount: cpmmPoolFeeAccount,
        mintA: mintAInfo,
        mintB: mintBInfo,
        mintAAmount: baseAmountBn,
        mintBAmount: quoteAmountBn,
        startTime: startTimeBn,
        feeConfig,
        associatedOnly: false,
        ownerInfo: {
          useSOLBalance: quoteToken === "SOL",
        },
        txVersion: TxVersion.V0,
      });
    } catch (sdkErr) {
      throw mapFriendlyRaydiumError(sdkErr, network);
    }

    const { builder, extInfo, signers } = createPoolBuilderResult;

    const sdkInstructions = (builder.allInstructions || []).filter(
      (ix) => !ix.programId.equals(ComputeBudgetProgram.programId)
    );
    if (sdkInstructions.length === 0) {
      throw new Error("Raydium SDK returned no instructions for CPMM pool creation.");
    }

    coreInstructions.push(...sdkInstructions);
    extraSigners = extractExtraSigners(
      userPublicKey,
      signers,
      builder.AllTxData?.signers
    );

    const addressInfo = extInfo.address as Record<string, unknown>;
    poolAddress = String(addressInfo.poolId ?? expectedPoolPda.toBase58());
    lpMintAddress = String(addressInfo.lpMint ?? "");
    const vaultAStr = String(addressInfo.vaultA ?? "");
    const vaultBStr = String(addressInfo.vaultB ?? "");

    const rawMintA = addressInfo.mintA;
    const extMintAAddress =
      typeof rawMintA === "object" && rawMintA !== null && "address" in rawMintA
        ? String((rawMintA as { address: string }).address)
        : rawMintA
        ? String(rawMintA)
        : token0.toBase58();

    const isMintABase = extMintAAddress === baseMintPublicKey.toBase58();
    baseVaultAddress = isMintABase ? vaultAStr : vaultBStr;
    quoteVaultAddress = isMintABase ? vaultBStr : vaultAStr;
  }

  // 9. Phase 2.10: Dynamic Compute Budget (simulate + priority fee)
  const computeBudgetIxs = await buildDynamicComputeBudgetInstructions({
    connection,
    payerKey: userPublicKey,
    instructions: coreInstructions,
    defaultUnits: 600_000,
    defaultMicroLamports: 50_000,
  });

  const instructions: TransactionInstruction[] = [...computeBudgetIxs, ...coreInstructions];

  // 10. Compile VersionedTransaction V0 and partially sign with any ephemeral SDK signers
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

  const messageV0 = new TransactionMessage({
    payerKey: userPublicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);
  if (extraSigners.length > 0) {
    transaction.sign(extraSigners);
  }

  const base64Transaction = Buffer.from(transaction.serialize()).toString("base64");

  const adjustedBaseUi = Number(rawBaseAmount) / Math.pow(10, resolvedBaseDecimals);
  const adjustedQuoteUi = Number(rawQuoteAmount) / Math.pow(10, quoteDecimals);
  const initialPrice = adjustedBaseUi > 0 ? adjustedQuoteUi / adjustedBaseUi : 0;

  const lpDecimals = 9;
  const netCreatorLpRaw =
    initialLpSupplyRaw > BigInt(100) ? initialLpSupplyRaw - BigInt(100) : initialLpSupplyRaw;
  const formattedLpMinted = (Number(netCreatorLpRaw) / Math.pow(10, lpDecimals)).toFixed(4);

  return {
    transaction: base64Transaction,
    poolAddress,
    ammConfigAddress: feeConfig.id,
    lpMintAddress,
    baseVaultAddress,
    quoteVaultAddress,
    dex: "raydium-cpmm",
    initialPrice,
    lpTokensMinted: formattedLpMinted,
    serviceFeeSol: lpFeeLamports / LAMPORTS_PER_SOL,
    freezeAuthorityRevokedInTx,
    blockhash,
    lastValidBlockHeight,
    network,
  };
}

async function resolveRaydiumCpmmPoolId(params: {
  connection: Connection;
  cpmmProgramId: PublicKey;
  feeConfigs: ApiCpmmConfigInfo[];
  userPublicKey: PublicKey;
  baseMint: string;
  poolId?: string;
  lpMint?: string;
  network: SolanaCluster;
}): Promise<string> {
  const {
    connection,
    cpmmProgramId,
    feeConfigs,
    userPublicKey,
    baseMint,
    poolId,
    lpMint,
    network,
  } = params;

  if (poolId && isValidPublicKey(poolId)) {
    const directPoolAcc = await connection.getAccountInfo(new PublicKey(poolId), "confirmed");
    if (directPoolAcc && directPoolAcc.owner.equals(cpmmProgramId)) {
      return poolId;
    }
  }

  const baseMintPubkey = new PublicKey(baseMint);
  const baseMintAcc = await connection.getAccountInfo(baseMintPubkey, "confirmed");
  if (baseMintAcc && baseMintAcc.owner.equals(cpmmProgramId)) {
    return baseMintPubkey.toBase58();
  }

  const dexConfig = getClusterDexConfig(network);
  const quoteCandidates = [dexConfig.wsolMint, dexConfig.usdcMint];
  const candidatePoolPubkeys: PublicKey[] = [];

  for (const quoteMint of quoteCandidates) {
    if (baseMintPubkey.equals(quoteMint)) continue;
    const { token0, token1 } = sortTokenMints(baseMintPubkey, quoteMint);
    for (const cfg of feeConfigs) {
      try {
        const pda = getCpmmPdaPoolId(
          cpmmProgramId,
          new PublicKey(cfg.id),
          token0,
          token1
        ).publicKey;
        if (!candidatePoolPubkeys.some((pk) => pk.equals(pda))) {
          candidatePoolPubkeys.push(pda);
        }
      } catch {
        // Ignore malformed config ID
      }
    }
  }

  if (candidatePoolPubkeys.length > 0) {
    const accounts = await connection.getMultipleAccountsInfo(candidatePoolPubkeys, "confirmed");
    const validPools: Array<{ poolId: string; lpMint: string }> = [];

    accounts.forEach((acc, idx) => {
      if (acc && acc.owner.equals(cpmmProgramId) && acc.data.length >= CpmmPoolInfoLayout.span) {
        try {
          const decoded = CpmmPoolInfoLayout.decode(acc.data);
          validPools.push({
            poolId: candidatePoolPubkeys[idx].toBase58(),
            lpMint: decoded.lpMint.toBase58(),
          });
        } catch {
          // Ignore decode failure
        }
      }
    });

    if (validPools.length > 0) {
      if (lpMint && isValidPublicKey(lpMint)) {
        const matchedByLp = validPools.find((p) => p.lpMint === lpMint);
        if (matchedByLp) return matchedByLp.poolId;
      }

      for (const candidate of validPools) {
        try {
          const userLpAta = await getAssociatedTokenAddress(
            new PublicKey(candidate.lpMint),
            userPublicKey,
            false,
            TOKEN_PROGRAM_ID
          );
          const lpBal = await connection.getTokenAccountBalance(userLpAta, "confirmed");
          if (BigInt(lpBal.value.amount || "0") > BigInt(0)) {
            return candidate.poolId;
          }
        } catch {
          // Check next pool
        }
      }

      return validPools[0].poolId;
    }
  }

  const lpMintTargets = [lpMint, baseMint].filter(
    (m): m is string => Boolean(m && isValidPublicKey(m))
  );
  const lpMintOffset =
    typeof CpmmPoolInfoLayout.offsetOf === "function"
      ? (CpmmPoolInfoLayout.offsetOf("mintLp") ?? 136)
      : 136;

  for (const targetLpMint of lpMintTargets) {
    try {
      const matchedAccounts = await connection.getProgramAccounts(cpmmProgramId, {
        commitment: "confirmed",
        filters: [
          {
            memcmp: {
              offset: lpMintOffset,
              bytes: targetLpMint,
            },
          },
        ],
      });
      if (matchedAccounts.length > 0) {
        return matchedAccounts[0].pubkey.toBase58();
      }
    } catch {
      // Continue
    }
  }

  throw new Error(
    `No active Raydium CPMM pool was found on ${network} for token ${baseMint.slice(
      0,
      8
    )}... Please provide a valid Pool ID or select a token with an active Raydium CPMM pool.`
  );
}

/**
 * Phase 2.9: Withdraws liquidity from a Raydium CPMM pool, properly distinguishing SOL (WSOL)
 * vs USDC quote pools and returning `quoteToken`, `lpPairLabel` ("LP-SOL" | "LP-USDC"),
 * `quoteVaultAddress`, `withdrawnQuote`, and `estimatedQuoteReturned`.
 */
export async function removeLiquidityTransaction(
  input: RemoveLiquidityInput
): Promise<RemoveLiquidityOutput> {
  const {
    baseMint,
    poolId,
    lpMint,
    withdrawPercentage = 100,
    wallet,
    affiliate,
    network = "mainnet-beta",
  } = input;

  const isDevnet = network === "devnet";
  const connection = getSolanaConnection(network);
  const userPublicKey = new PublicKey(wallet);
  const pct = Math.min(Math.max(Math.round(Number(withdrawPercentage) || 100), 1), 100);

  const cpmmProgramId = isDevnet
    ? DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM
    : CREATE_CPMM_POOL_PROGRAM;

  // 1. Initialize Raydium SDK v2 and verify user SOL balance for service fee + network fee
  const { raydium, userSolLamports } = await initRaydiumSdkServerSide({
    userPublicKey,
    connection,
    network,
  });

  if (userSolLamports < SERVICE_FEE_REMOVE_LP_LAMPORTS + 15_000) {
    throw new Error(
      `Insufficient SOL to pay the ${SERVICE_FEE_REMOVE_LP_SOL.toFixed(
        2
      )} SOL withdrawal service fee (current balance: ${(
        userSolLamports / LAMPORTS_PER_SOL
      ).toFixed(4)} SOL).`
    );
  }

  // 2. Resolve `poolId`
  const { allConfigs } = await resolveCpmmFeeConfig({
    raydium,
    connection,
    cpmmProgramId,
    feeTierBps: 25,
    network,
  });

  const resolvedPoolId = await resolveRaydiumCpmmPoolId({
    connection,
    cpmmProgramId,
    feeConfigs: allConfigs,
    userPublicKey,
    baseMint,
    poolId,
    lpMint,
    network,
  });

  // 3. Fetch live Pool Info, Keys, and Reserves directly from RPC
  let poolRpcData: Awaited<ReturnType<typeof raydium.cpmm.getPoolInfoFromRpc>>;
  try {
    poolRpcData = await raydium.cpmm.getPoolInfoFromRpc(resolvedPoolId);
  } catch (rpcErr) {
    throw mapFriendlyRaydiumError(rpcErr, network);
  }

  const { poolInfo, poolKeys, rpcData } = poolRpcData;
  const poolLpMintPubkey = new PublicKey(poolInfo.lpMint.address);

  // 4. Inspect user's LP Token balance on-chain and calculate `lpAmount` to withdraw
  const userLpAta = await getAssociatedTokenAddress(
    poolLpMintPubkey,
    userPublicKey,
    false,
    TOKEN_PROGRAM_ID
  );
  const userLpParsed = await connection.getParsedAccountInfo(userLpAta, "confirmed");
  const parsedLpInfo = extractParsedTokenInfo(userLpParsed.value?.data);
  const rawLpBalanceStr = parsedLpInfo?.tokenAmount?.amount || "0";
  const userLpBalanceBn = new BN(rawLpBalanceStr);

  if (userLpBalanceBn.lte(new BN(0))) {
    throw new Error(
      `Your wallet holds 0 LP tokens (${poolInfo.lpMint.address.slice(
        0,
        8
      )}...) for Raydium CPMM pool ${resolvedPoolId.slice(0, 8)}... on ${network}.`
    );
  }

  const lpAmountBn =
    pct === 100
      ? userLpBalanceBn
      : userLpBalanceBn.mul(new BN(pct)).div(new BN(100));

  if (lpAmountBn.lte(new BN(0))) {
    throw new Error("Calculated LP token withdrawal amount is zero. Increase withdrawal percentage.");
  }

  // 5. Compute expected token outputs pro-rata from live RPC reserves and identify SOL vs USDC quote
  const totalLpSupply = rpcData.lpAmount.gt(new BN(0)) ? rpcData.lpAmount : new BN(1);
  const rawOutA = lpAmountBn.mul(rpcData.baseReserve).div(totalLpSupply);
  const rawOutB = lpAmountBn.mul(rpcData.quoteReserve).div(totalLpSupply);

  const mintAAddr = poolInfo.mintA.address;
  const mintBAddr = poolInfo.mintB.address;
  const wsolAddr = WSOL_MINT.toBase58();
  const usdcAddresses = new Set<string>([
    USDC_MINT_MAINNET.toBase58(),
    USDC_MINT_DEVNET.toBase58(),
  ]);

  const hasWsol = mintAAddr === wsolAddr || mintBAddr === wsolAddr;
  const hasUsdc = usdcAddresses.has(mintAAddr) || usdcAddresses.has(mintBAddr);

  const isMintAQuote =
    mintAAddr === wsolAddr ||
    (!hasWsol && usdcAddresses.has(mintAAddr)) ||
    (!hasWsol && !hasUsdc && mintAAddr !== baseMint);

  const quoteMintAddr = isMintAQuote ? mintAAddr : mintBAddr;
  const quoteToken: "SOL" | "USDC" =
    quoteMintAddr === wsolAddr ? "SOL" : "USDC";
  const lpPairLabel: "LP-SOL" | "LP-USDC" = `LP-${quoteToken}`;

  const rawQuoteOut = isMintAQuote ? rawOutA : rawOutB;
  const rawBaseOut = isMintAQuote ? rawOutB : rawOutA;
  const quoteDecimals = isMintAQuote ? poolInfo.mintA.decimals : poolInfo.mintB.decimals;
  const baseDecimals = isMintAQuote ? poolInfo.mintB.decimals : poolInfo.mintA.decimals;
  const resolvedBaseMint = isMintAQuote ? mintBAddr : mintAAddr;
  const quoteVaultAddress = isMintAQuote ? poolKeys.vault.A : poolKeys.vault.B;

  const estimatedQuoteUi = Number(rawQuoteOut.toString()) / Math.pow(10, quoteDecimals);
  const estimatedBaseUi = Number(rawBaseOut.toString()) / Math.pow(10, baseDecimals);

  // 6. Build withdrawal instructions via `raydium.cpmm.withdrawLiquidity`
  let withdrawBuilderResult: Awaited<ReturnType<typeof raydium.cpmm.withdrawLiquidity>>;
  try {
    withdrawBuilderResult = await raydium.cpmm.withdrawLiquidity({
      poolInfo,
      poolKeys,
      lpAmount: lpAmountBn,
      txVersion: TxVersion.V0,
      slippage: new Percent(1, 100), // 1% slippage tolerance
      closeWsol: quoteToken === "SOL" && hasWsol,
    });
  } catch (sdkErr) {
    throw mapFriendlyRaydiumError(sdkErr, network);
  }

  const { builder, signers } = withdrawBuilderResult;
  const sdkInstructions = (builder.allInstructions || []).filter(
    (ix) => !ix.programId.equals(ComputeBudgetProgram.programId)
  );
  if (sdkInstructions.length === 0) {
    throw new Error("Raydium SDK returned no instructions for CPMM liquidity withdrawal.");
  }

  const coreInstructions: TransactionInstruction[] = [
    ...buildServiceFeeInstructions(userPublicKey, SERVICE_FEE_REMOVE_LP_LAMPORTS, affiliate),
    ...sdkInstructions,
  ];

  // 7. Phase 2.10: Dynamic Compute Budget (simulate + priority fee)
  const computeBudgetIxs = await buildDynamicComputeBudgetInstructions({
    connection,
    payerKey: userPublicKey,
    instructions: coreInstructions,
    defaultUnits: 450_000,
    defaultMicroLamports: 50_000,
  });

  const instructions: TransactionInstruction[] = [...computeBudgetIxs, ...coreInstructions];

  // 8. Compile VersionedTransaction V0 and partially sign with any ephemeral SDK signers
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

  const messageV0 = new TransactionMessage({
    payerKey: userPublicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);
  const extraSigners = extractExtraSigners(
    userPublicKey,
    signers,
    builder.AllTxData?.signers
  );
  if (extraSigners.length > 0) {
    transaction.sign(extraSigners);
  }

  const base64Transaction = Buffer.from(transaction.serialize()).toString("base64");
  const quoteDecimalsDisplay = quoteToken === "USDC" ? 2 : 6;

  return {
    transaction: base64Transaction,
    poolId: resolvedPoolId,
    lpMint: poolInfo.lpMint.address,
    baseMint: resolvedBaseMint,
    quoteToken,
    lpPairLabel,
    quoteVaultAddress,
    withdrawnQuote: Number(estimatedQuoteUi.toFixed(6)),
    withdrawPercentage: pct,
    estimatedQuoteReturned: estimatedQuoteUi.toFixed(quoteDecimalsDisplay),
    estimatedBaseReturned: estimatedBaseUi.toFixed(4),
    serviceFeeSol: SERVICE_FEE_REMOVE_LP_SOL,
    blockhash,
    lastValidBlockHeight,
    network,
  };
}


export interface DiscoveredLiquidityPosition {
  id: string;
  poolId: string;
  baseMint: string;
  quoteToken: "SOL" | "USDC";
  lpPairLabel: "LP-SOL" | "LP-USDC";
  lpMintAddress: string;
  quoteVaultAddress: string;
  wsolVaultAddress: string;
  baseVaultAddress: string;
  lpTokenBalanceUi: number;
  lpTokenAmountRaw: string;
  programId: string;
  network: SolanaCluster;
}

/**
 * Discovers active Raydium CPMM liquidity pool positions held by `walletAddress` on `network`.
 */
export async function discoverUserLiquidityPositions(
  walletAddress: string,
  network: SolanaCluster = "mainnet-beta",
  hintMints: string[] = []
): Promise<DiscoveredLiquidityPosition[]> {
  if (!walletAddress || !isValidPublicKey(walletAddress)) {
    return [];
  }

  const isDevnet = network === "devnet";
  const connection = getSolanaConnection(network);
  const userPublicKey = new PublicKey(walletAddress);
  const dexConfig = getClusterDexConfig(network);
  const cpmmProgramId = isDevnet
    ? DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM
    : CREATE_CPMM_POOL_PROGRAM;

  const [splAccounts, token2022Accounts] = await Promise.all([
    connection.getParsedTokenAccountsByOwner(
      userPublicKey,
      { programId: TOKEN_PROGRAM_ID },
      "confirmed"
    ),
    connection.getParsedTokenAccountsByOwner(
      userPublicKey,
      { programId: TOKEN_2022_PROGRAM_ID },
      "confirmed"
    ),
  ]);

  const userTokenBalances = new Map<string, { raw: string; ui: number; programId: string }>();
  const candidateMints = new Set<string>();

  for (const acc of [...splAccounts.value, ...token2022Accounts.value]) {
    const info = extractParsedTokenInfo(acc.account.data);
    const mintStr = info?.mint;
    const rawStr = String(info?.tokenAmount?.amount || "0");
    if (!mintStr || BigInt(rawStr) <= BigInt(0)) continue;
    const uiVal = Number(info?.tokenAmount?.uiAmountString || "0");
    userTokenBalances.set(mintStr, {
      raw: rawStr,
      ui: uiVal,
      programId: acc.account.owner.toBase58(),
    });
    if (
      mintStr !== WSOL_MINT.toBase58() &&
      mintStr !== dexConfig.usdcMint.toBase58()
    ) {
      candidateMints.add(mintStr);
    }
  }

  for (const h of hintMints) {
    if (h && isValidPublicKey(h) && h !== WSOL_MINT.toBase58()) {
      candidateMints.add(h);
    }
  }

  if (candidateMints.size === 0) return [];

  const configs = getFallbackCpmmConfigs(cpmmProgramId);
  const quoteMints: Array<{ mint: PublicKey; quoteToken: "SOL" | "USDC" }> = [
    { mint: dexConfig.wsolMint, quoteToken: "SOL" },
    { mint: dexConfig.usdcMint, quoteToken: "USDC" },
  ];

  const poolCandidates: Array<{
    poolPda: PublicKey;
    baseMint: string;
    quoteToken: "SOL" | "USDC";
  }> = [];

  for (const baseMintStr of Array.from(candidateMints).slice(0, 15)) {
    const basePk = new PublicKey(baseMintStr);
    for (const q of quoteMints) {
      if (basePk.equals(q.mint)) continue;
      const { token0, token1 } = sortTokenMints(basePk, q.mint);
      for (const cfg of configs) {
        const poolPda = getCpmmPdaPoolId(
          cpmmProgramId,
          new PublicKey(cfg.id),
          token0,
          token1
        ).publicKey;
        poolCandidates.push({
          poolPda,
          baseMint: baseMintStr,
          quoteToken: q.quoteToken,
        });
      }
    }
  }

  const positions: DiscoveredLiquidityPosition[] = [];
  const seenPools = new Set<string>();

  for (let i = 0; i < poolCandidates.length; i += 50) {
    const batch = poolCandidates.slice(i, i + 50);
    const infos = await connection.getMultipleAccountsInfo(
      batch.map((b) => b.poolPda),
      "confirmed"
    );

    infos.forEach((acc, idx) => {
      const item = batch[idx];
      const poolIdStr = item.poolPda.toBase58();
      if (
        !acc ||
        seenPools.has(poolIdStr) ||
        !acc.owner.equals(cpmmProgramId) ||
        acc.data.length < CpmmPoolInfoLayout.span
      ) {
        return;
      }

      try {
        const decoded = CpmmPoolInfoLayout.decode(acc.data);
        const lpMintStr = decoded.lpMint.toBase58();
        const lpBalance = userTokenBalances.get(lpMintStr);
        if (!lpBalance || BigInt(lpBalance.raw) <= BigInt(0)) return;

        seenPools.add(poolIdStr);
        const isToken0Base = decoded.mintA.toBase58() === item.baseMint;
        const baseVaultStr = (isToken0Base ? decoded.vaultA : decoded.vaultB).toBase58();
        const quoteVaultStr = (isToken0Base ? decoded.vaultB : decoded.vaultA).toBase58();

        positions.push({
          id: poolIdStr,
          poolId: poolIdStr,
          baseMint: item.baseMint,
          quoteToken: item.quoteToken,
          lpPairLabel: `LP-${item.quoteToken}`,
          lpMintAddress: lpMintStr,
          quoteVaultAddress: quoteVaultStr,
          wsolVaultAddress: quoteVaultStr,
          baseVaultAddress: baseVaultStr,
          lpTokenBalanceUi: lpBalance.ui,
          lpTokenAmountRaw: lpBalance.raw,
          programId: TOKEN_PROGRAM_ID.toBase58(),
          network,
        });
      } catch {
        // Ignore malformed pool state
      }
    });
  }

  return positions;
}
