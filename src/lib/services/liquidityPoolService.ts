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
  ACCOUNT_SIZE,
  AuthorityType,
  MINT_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createBurnCheckedInstruction,
  createCloseAccountInstruction,
  createInitializeAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  createSyncNativeInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getMint,
} from "@solana/spl-token";
import {
  SERVICE_FEE_REMOVE_LP_LAMPORTS,
  SERVICE_FEE_REMOVE_LP_SOL,
  SolanaCluster,
  WSOL_MINT,
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

export interface RemoveLiquidityInput {
  baseMint: string;
  lpMint?: string;
  withdrawPercentage: number; // 1 to 100
  wallet: string;
  programId?: string;
  affiliate?: string | null;
  network?: SolanaCluster;
}

export interface RemoveLiquidityOutput {
  transaction: string;
  baseMint: string;
  wsolVaultAddress: string;
  withdrawnSol: number;
  withdrawPercentage: number;
  estimatedSolReturned: string;
  estimatedBaseReturned: string;
  serviceFeeSol: number;
  blockhash: string;
  lastValidBlockHeight: number;
  network: SolanaCluster;
}

interface ParsedSplAccountData {
  parsed?: {
    info?: {
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
  const comparison = Buffer.compare(new Uint8Array(mintA.toBuffer()), new Uint8Array(mintB.toBuffer()));
  if (comparison < 0) {
    return { token0: mintA, token1: mintB, isBaseToken0: true };
  }
  return { token0: mintB, token1: mintA, isBaseToken0: false };
}

/**
 * Deterministic vault seeds derived from the Base Token Mint so the pool creator can
 * withdraw SOL & Base Token liquidity on-chain (until LP tokens are permanently burned).
 */
export async function deriveCreatorPoolVaults(
  userPublicKey: PublicKey,
  baseMintPublicKey: PublicKey
): Promise<{
  wsolVaultAddress: PublicKey;
  wsolVaultSeed: string;
}> {
  const wsolVaultSeed = `lp_wsol_${baseMintPublicKey.toBase58().slice(0, 16)}`;
  const wsolVaultAddress = await PublicKey.createWithSeed(
    userPublicKey,
    wsolVaultSeed,
    TOKEN_PROGRAM_ID
  );
  return { wsolVaultAddress, wsolVaultSeed };
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

  const parsedTokenInfo = extractParsedTokenInfo(userBaseAccountParsed.value?.data);
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
    Math.round(0.012 * LAMPORTS_PER_SOL);

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
      new Uint8Array(Buffer.from(dex === "raydium-cpmm" ? "raydium_cpmm_pool" : "meteora_damm_pool")),
      new Uint8Array(token0.toBuffer()),
      new Uint8Array(token1.toBuffer()),
    ],
    targetDexProgramId
  );

  const lpMintKeypair = Keypair.generate();
  const lpDecimals = 9;
  const [mintRentLamports, tokenAccountRentLamports] = await Promise.all([
    connection.getMinimumBalanceForRentExemption(MINT_SIZE),
    connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZE),
  ]);

  // Pool Base Vault ATA
  const poolBaseVaultAta = await getAssociatedTokenAddress(
    baseMintPublicKey,
    poolAuthorityPda,
    true,
    baseTokenProgramId
  );

  // Deterministic Creator-Withdrawable WSOL Quote Vault (so user can withdraw SOL liquidity at any time)
  const { wsolVaultAddress, wsolVaultSeed } = await deriveCreatorPoolVaults(
    userPublicKey,
    baseMintPublicKey
  );
  const existingWsolVault = await connection.getAccountInfo(wsolVaultAddress, "confirmed");

  const poolQuoteVaultAddress =
    quoteToken === "SOL"
      ? wsolVaultAddress
      : await getAssociatedTokenAddress(
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

  // 7. Create Pool Base Vault ATA and User LP Token ATA idempotently
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

  // 9. Deposit Quote Liquidity (SOL wrapped into WSOL inside deterministic wsolVaultAddress, or USDC transfer)
  if (quoteToken === "SOL") {
    if (!existingWsolVault) {
      instructions.push(
        SystemProgram.createAccountWithSeed({
          fromPubkey: userPublicKey,
          newAccountPubkey: wsolVaultAddress,
          basePubkey: userPublicKey,
          seed: wsolVaultSeed,
          lamports: tokenAccountRentLamports + Number(rawQuoteAmount),
          space: ACCOUNT_SIZE,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeAccountInstruction(
          wsolVaultAddress,
          WSOL_MINT,
          userPublicKey,
          TOKEN_PROGRAM_ID
        )
      );
    } else {
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: userPublicKey,
          toPubkey: wsolVaultAddress,
          lamports: rawQuoteAmount,
        }),
        createSyncNativeInstruction(wsolVaultAddress, TOKEN_PROGRAM_ID)
      );
    }
  } else {
    instructions.push(
      createAssociatedTokenAccountIdempotentInstruction(
        userPublicKey,
        poolQuoteVaultAddress,
        poolAuthorityPda,
        quoteMintPublicKey,
        TOKEN_PROGRAM_ID
      )
    );
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
        poolQuoteVaultAddress,
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
    quoteVaultAddress: poolQuoteVaultAddress.toBase58(),
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

/**
 * Withdraws SOL Liquidity on-chain and charges the mandatory 0.05 SOL fee to DEV_WALLET_ADDRESS:
 * 1. Charges 0.05 SOL (50,000,000 lamports) atomically to DEV_WALLET_ADDRESS (with 10% affiliate split if present).
 * 2. Inspects the deterministic WSOL Pool Quote Vault (`wsolVaultAddress`) and/or user's WSOL ATA (`userWsolAta`).
 * 3. Unwraps WSOL back into native SOL directly into the user's wallet (100% full close or partial withdrawal).
 * 4. Burns proportional LP tokens if `lpMint` is provided and held by the user.
 */
export async function removeLiquidityTransaction(
  input: RemoveLiquidityInput
): Promise<RemoveLiquidityOutput> {
  const {
    baseMint,
    lpMint,
    withdrawPercentage = 100,
    wallet,
    affiliate,
    network = "mainnet-beta",
  } = input;

  const connection = getSolanaConnection(network);
  const userPublicKey = new PublicKey(wallet);
  const baseMintPublicKey = new PublicKey(baseMint);
  const pct = Math.min(Math.max(Number(withdrawPercentage) || 100, 1), 100);

  const userSolBalance = await connection.getBalance(userPublicKey, "confirmed");
  if (userSolBalance < SERVICE_FEE_REMOVE_LP_LAMPORTS + 10_000) {
    throw new Error(
      `Insufficient SOL to pay the ${SERVICE_FEE_REMOVE_LP_SOL.toFixed(
        2
      )} SOL withdrawal service fee (current balance: ${(
        userSolBalance / LAMPORTS_PER_SOL
      ).toFixed(4)} SOL).`
    );
  }

  const instructions: TransactionInstruction[] = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 350_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25_000 }),
    // Mandatory 0.05 SOL Withdrawal Fee routed to DEV_WALLET_ADDRESS
    ...buildServiceFeeInstructions(userPublicKey, SERVICE_FEE_REMOVE_LP_LAMPORTS, affiliate),
  ];

  const { wsolVaultAddress } = await deriveCreatorPoolVaults(userPublicKey, baseMintPublicKey);
  const userWsolAta = await getAssociatedTokenAddress(
    WSOL_MINT,
    userPublicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  const [vaultInfo, userWsolInfo] = await Promise.all([
    connection.getParsedAccountInfo(wsolVaultAddress, "confirmed"),
    connection.getParsedAccountInfo(userWsolAta, "confirmed"),
  ]);

  let estimatedSolReturnedLamports = 0;

  // Case A: Active Creator WSOL Pool Vault exists on-chain
  const vaultParsed = extractParsedTokenInfo(vaultInfo.value?.data);
  if (vaultInfo.value && vaultParsed?.owner === userPublicKey.toBase58()) {
    const rawWsolAmount = BigInt(vaultParsed?.tokenAmount?.amount || "0");
    if (pct === 100 || rawWsolAmount <= BigInt(0)) {
      estimatedSolReturnedLamports += vaultInfo.value.lamports;
      instructions.push(
        createCloseAccountInstruction(
          wsolVaultAddress,
          userPublicKey,
          userPublicKey,
          [],
          TOKEN_PROGRAM_ID
        )
      );
    } else {
      const withdrawLamports = (rawWsolAmount * BigInt(pct)) / BigInt(100);
      estimatedSolReturnedLamports += Number(withdrawLamports);
      instructions.push(
        createAssociatedTokenAccountIdempotentInstruction(
          userPublicKey,
          userWsolAta,
          userPublicKey,
          WSOL_MINT,
          TOKEN_PROGRAM_ID
        ),
        createTransferCheckedInstruction(
          wsolVaultAddress,
          WSOL_MINT,
          userWsolAta,
          userPublicKey,
          withdrawLamports,
          9,
          [],
          TOKEN_PROGRAM_ID
        ),
        createCloseAccountInstruction(
          userWsolAta,
          userPublicKey,
          userPublicKey,
          [],
          TOKEN_PROGRAM_ID
        )
      );
    }
  } else if (userWsolInfo.value) {
    // Case B: User holds wrapped SOL (WSOL ATA) in their wallet — unwrap it back to native SOL
    estimatedSolReturnedLamports += userWsolInfo.value.lamports;
    instructions.push(
      createCloseAccountInstruction(
        userWsolAta,
        userPublicKey,
        userPublicKey,
        [],
        TOKEN_PROGRAM_ID
      )
    );
  }

  // Optional: If lpMint (or baseMint if user selected an LP token directly) is held by user, burn proportional LP tokens
  const candidateLpMint = lpMint ? new PublicKey(lpMint) : null;
  if (candidateLpMint) {
    try {
      const userLpAta = await getAssociatedTokenAddress(
        candidateLpMint,
        userPublicKey,
        false,
        TOKEN_PROGRAM_ID
      );
      const lpAcc = await connection.getParsedAccountInfo(userLpAta, "confirmed");
      const lpParsed = extractParsedTokenInfo(lpAcc.value?.data);
      if (lpParsed?.tokenAmount?.amount) {
        const rawLpBal = BigInt(lpParsed.tokenAmount.amount);
        const burnLpRaw = (rawLpBal * BigInt(pct)) / BigInt(100);
        if (burnLpRaw > BigInt(0)) {
          instructions.push(
            createBurnCheckedInstruction(
              userLpAta,
              candidateLpMint,
              userPublicKey,
              burnLpRaw,
              Number(lpParsed.tokenAmount.decimals ?? 9),
              [],
              TOKEN_PROGRAM_ID
            )
          );
        }
      }
    } catch {
      // Ignore if LP token account is already closed/burned
    }
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

  const messageV0 = new TransactionMessage({
    payerKey: userPublicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);
  const serializedTransaction = transaction.serialize();
  const base64Transaction = Buffer.from(serializedTransaction).toString("base64");

  return {
    transaction: base64Transaction,
    baseMint,
    wsolVaultAddress: wsolVaultAddress.toBase58(),
    withdrawnSol: Number((estimatedSolReturnedLamports / LAMPORTS_PER_SOL).toFixed(6)),
    withdrawPercentage: pct,
    estimatedSolReturned: (estimatedSolReturnedLamports / LAMPORTS_PER_SOL).toFixed(4),
    estimatedBaseReturned: `${pct}% of Pool Position`,
    serviceFeeSol: SERVICE_FEE_REMOVE_LP_SOL,
    blockhash,
    lastValidBlockHeight,
    network,
  };
}
