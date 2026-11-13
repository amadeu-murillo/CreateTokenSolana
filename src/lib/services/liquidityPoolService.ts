import {
  ComputeBudgetProgram,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  AuthorityType,
  MINT_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  createSyncNativeInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getMint,
} from "@solana/spl-token";
import {
  SolanaCluster,
  getClusterDexConfig,
  getLpServiceFeeLamports,
} from "@/lib/constants";
import { toRawTokenAmount } from "@/lib/security";
import { buildServiceFeeInstructions, getSolanaConnection } from "./solanaHelpers";

export interface CreateLiquidityPoolInput {
  dex: "raydium-cpmm" | "meteora-damm";
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
}

export interface CreateLiquidityPoolOutput {
  transaction: string;
  poolAddress: string;
  lpMintAddress: string;
  baseVaultAddress: string;
  quoteVaultAddress: string;
  dex: "raydium-cpmm" | "meteora-damm";
  initialPrice: number;
  lpTokensMinted: string;
  serviceFeeSol: number;
  freezeAuthorityRevokedInTx: boolean;
  blockhash: string;
  lastValidBlockHeight: number;
  network: SolanaCluster;
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
  const comparison = Buffer.compare(mintA.toBuffer(), mintB.toBuffer());
  if (comparison < 0) {
    return { token0: mintA, token1: mintB, isBaseToken0: true };
  }
  return { token0: mintB, token1: mintA, isBaseToken0: false };
}

export async function createLiquidityPoolTransaction(
  input: CreateLiquidityPoolInput
): Promise<CreateLiquidityPoolOutput> {
  const {
    dex,
    baseMint,
    quoteToken,
    baseAmount,
    quoteAmount,
    revokeFreezeIfActive = true,
    wallet,
    programId,
    affiliate,
    network = "mainnet-beta",
  } = input;

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

  // 1. Detect Base Token Program ID on-chain
  const baseMintAccountInfo = await connection.getAccountInfo(baseMintPublicKey, "confirmed");
  if (!baseMintAccountInfo) {
    throw new Error(
      `Token Mint (${baseMint.slice(0, 8)}...) was not found on Solana ${network}. Make sure your wallet and top bar are set to the same network where the token was created.`
    );
  }

  const baseTokenProgramId = baseMintAccountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)
    ? TOKEN_2022_PROGRAM_ID
    : programId && programId === TOKEN_2022_PROGRAM_ID.toBase58()
    ? TOKEN_2022_PROGRAM_ID
    : TOKEN_PROGRAM_ID;

  const baseMintInfo = await getMint(
    connection,
    baseMintPublicKey,
    "confirmed",
    baseTokenProgramId
  );

  let rawBaseAmount = toRawTokenAmount(baseAmount, baseMintInfo.decimals);
  const rawQuoteAmount = toRawTokenAmount(quoteAmount, quoteDecimals);
  const lpFeeLamports = getLpServiceFeeLamports(network);

  // 2. Verify User Base Token ATA & Balance (and clamp float-rounded MAX amounts safely)
  const userBaseAta = await getAssociatedTokenAddress(
    baseMintPublicKey,
    userPublicKey,
    false,
    baseTokenProgramId
  );

  const [userSolBalance, userBaseAccountParsed] = await Promise.all([
    connection.getBalance(userPublicKey, "confirmed"),
    connection.getParsedAccountInfo(userBaseAta, "confirmed"),
  ]);

  const parsedTokenInfo = (userBaseAccountParsed.value?.data as any)?.parsed?.info;
  if (!parsedTokenInfo?.tokenAmount?.amount) {
    throw new Error(
      `Your wallet does not hold an active token account for ${baseMint.slice(0, 8)}... on Solana ${network}.`
    );
  }

  const userRawTokenBalance = BigInt(parsedTokenInfo.tokenAmount.amount);
  if (userRawTokenBalance <= BigInt(0)) {
    throw new Error("Your token balance is zero. Please select a token with a positive balance.");
  }

  if (rawBaseAmount > userRawTokenBalance) {
    // If within 0.1% of balance (caused by UI float formatting when clicking MAX), clamp to exact raw balance
    const diff = rawBaseAmount - userRawTokenBalance;
    if (diff * BigInt(1000) <= userRawTokenBalance) {
      rawBaseAmount = userRawTokenBalance;
    } else {
      throw new Error(
        `Insufficient token balance: you entered ${baseAmount}, but your wallet holds ${parsedTokenInfo.tokenAmount.uiAmountString}.`
      );
    }
  }

  // 3. Verify user has enough SOL on-chain before building transaction
  const requiredSolLamports =
    lpFeeLamports +
    (quoteToken === "SOL" ? Number(rawQuoteAmount) : 0) +
    Math.round(0.011 * LAMPORTS_PER_SOL); // Rent for LP Mint + 3 ATAs

  if (userSolBalance < requiredSolLamports) {
    const neededSol = (requiredSolLamports / LAMPORTS_PER_SOL).toFixed(4);
    const currentSol = (userSolBalance / LAMPORTS_PER_SOL).toFixed(4);
    throw new Error(
      `Insufficient SOL balance on ${network}: you have ${currentSol} SOL, but initializing this pool requires ~${neededSol} SOL (including ${
        quoteToken === "SOL" ? `${quoteAmount} SOL liquidity + ` : ""
      }${(lpFeeLamports / LAMPORTS_PER_SOL).toFixed(2)} SOL service fee + account rent).`
    );
  }

  // 4. Derive canonical Pool State / Authority PDA and generate LP Mint Keypair
  const { token0, token1 } = sortTokenMints(baseMintPublicKey, quoteMintPublicKey);
  const targetDexProgramId =
    dex === "raydium-cpmm" ? dexConfig.raydiumProgramId : dexConfig.meteoraDammProgramId;

  const [poolAuthorityPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(dex === "raydium-cpmm" ? "raydium_cpmm_pool" : "meteora_damm_pool"),
      token0.toBuffer(),
      token1.toBuffer(),
    ],
    targetDexProgramId
  );

  const lpMintKeypair = Keypair.generate();
  const lpDecimals = 9;
  const mintRentLamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

  // Pool Vault ATAs (owned by poolAuthorityPda with allowOwnerOffCurve = true)
  const poolBaseVaultAta = await getAssociatedTokenAddress(
    baseMintPublicKey,
    poolAuthorityPda,
    true,
    baseTokenProgramId
  );

  const poolQuoteVaultAta = await getAssociatedTokenAddress(
    quoteMintPublicKey,
    poolAuthorityPda,
    true,
    TOKEN_PROGRAM_ID
  );

  // User LP Token destination ATA
  const creatorLpTokenAta = await getAssociatedTokenAddress(
    lpMintKeypair.publicKey,
    userPublicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  const instructions: TransactionInstruction[] = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 450_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25_000 }),
    ...buildServiceFeeInstructions(userPublicKey, lpFeeLamports, affiliate),
  ];

  // 5. Auto-revoke Freeze Authority if active
  let freezeAuthorityRevokedInTx = false;
  if (baseMintInfo.freezeAuthority) {
    if (baseMintInfo.freezeAuthority.equals(userPublicKey) && revokeFreezeIfActive) {
      instructions.push(
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
        "This token has an active Freeze Authority controlled by another wallet. Liquidity pools require Freeze Authority to be revoked."
      );
    } else {
      throw new Error(
        "Token Freeze Authority is active. Enable Auto-Revoke Freeze Authority or revoke it in the Manage tab first."
      );
    }
  }

  // 6. Create & Initialize the LP Token Mint
  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: userPublicKey,
      newAccountPubkey: lpMintKeypair.publicKey,
      space: MINT_SIZE,
      lamports: mintRentLamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      lpMintKeypair.publicKey,
      lpDecimals,
      userPublicKey,
      null,
      TOKEN_PROGRAM_ID
    )
  );

  // 7. Create Pool Base Vault ATA, Pool Quote Vault ATA, and User LP Token ATA idempotently
  instructions.push(
    createAssociatedTokenAccountIdempotentInstruction(
      userPublicKey,
      poolBaseVaultAta,
      poolAuthorityPda,
      baseMintPublicKey,
      baseTokenProgramId
    ),
    createAssociatedTokenAccountIdempotentInstruction(
      userPublicKey,
      poolQuoteVaultAta,
      poolAuthorityPda,
      quoteMintPublicKey,
      TOKEN_PROGRAM_ID
    ),
    createAssociatedTokenAccountIdempotentInstruction(
      userPublicKey,
      creatorLpTokenAta,
      userPublicKey,
      lpMintKeypair.publicKey,
      TOKEN_PROGRAM_ID
    )
  );

  // 8. Transfer Base Tokens from User to Pool Base Vault
  instructions.push(
    createTransferCheckedInstruction(
      userBaseAta,
      baseMintPublicKey,
      poolBaseVaultAta,
      userPublicKey,
      rawBaseAmount,
      baseMintInfo.decimals,
      [],
      baseTokenProgramId
    )
  );

  // 9. Deposit Quote Liquidity (SOL wrapped into WSOL inside Pool Quote Vault, or USDC transfer)
  if (quoteToken === "SOL") {
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: poolQuoteVaultAta,
        lamports: rawQuoteAmount,
      }),
      createSyncNativeInstruction(poolQuoteVaultAta, TOKEN_PROGRAM_ID)
    );
  } else {
    const userUsdcAta = await getAssociatedTokenAddress(
      quoteMintPublicKey,
      userPublicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    instructions.push(
      createTransferCheckedInstruction(
        userUsdcAta,
        quoteMintPublicKey,
        poolQuoteVaultAta,
        userPublicKey,
        rawQuoteAmount,
        quoteDecimals,
        [],
        TOKEN_PROGRAM_ID
      )
    );
  }

  // 10. Mint Initial LP Tokens (sqrt(rawBase * rawQuote)) to Creator and lock LP Mint Authority to Pool PDA
  const initialLpSupplyRaw = bigIntSqrt(rawBaseAmount * rawQuoteAmount);
  const safeLpSupplyRaw =
    initialLpSupplyRaw > BigInt(1000) ? initialLpSupplyRaw : BigInt(1_000_000_000);

  instructions.push(
    createMintToInstruction(
      lpMintKeypair.publicKey,
      creatorLpTokenAta,
      userPublicKey,
      safeLpSupplyRaw,
      [],
      TOKEN_PROGRAM_ID
    ),
    createSetAuthorityInstruction(
      lpMintKeypair.publicKey,
      userPublicKey,
      AuthorityType.MintTokens,
      poolAuthorityPda,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

  const messageV0 = new TransactionMessage({
    payerKey: userPublicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);
  transaction.sign([lpMintKeypair]);

  const serializedTransaction = transaction.serialize();
  const base64Transaction = Buffer.from(serializedTransaction).toString("base64");

  const numericBase = Number(String(baseAmount).replace(/,/g, ""));
  const numericQuote = Number(String(quoteAmount).replace(/,/g, ""));
  const initialPrice = numericBase > 0 ? numericQuote / numericBase : 0;
  const formattedLpMinted = (Number(safeLpSupplyRaw) / Math.pow(10, lpDecimals)).toFixed(4);

  return {
    transaction: base64Transaction,
    poolAddress: poolAuthorityPda.toBase58(),
    lpMintAddress: lpMintKeypair.publicKey.toBase58(),
    baseVaultAddress: poolBaseVaultAta.toBase58(),
    quoteVaultAddress: poolQuoteVaultAta.toBase58(),
    dex,
    initialPrice,
    lpTokensMinted: formattedLpMinted,
    serviceFeeSol: lpFeeLamports / LAMPORTS_PER_SOL,
    freezeAuthorityRevokedInTx,
    blockhash,
    lastValidBlockHeight,
    network,
  };
}
