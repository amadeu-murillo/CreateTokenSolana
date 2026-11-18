import {
  ComputeBudgetProgram,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  ACCOUNT_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createInitializeAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getMint,
} from "@solana/spl-token";
import {
  SERVICE_FEE_TOKEN_VESTING_LOCK_LAMPORTS,
  SERVICE_FEE_TOKEN_VESTING_LOCK_SOL,
  SPL_MEMO_PROGRAM_ID,
  SolanaCluster,
} from "@/lib/constants";
import { toRawTokenAmount } from "@/lib/security";
import { buildServiceFeeInstructions, getSolanaConnection } from "./solanaHelpers";

export interface VestingMemoPayload {
  type: "CTS_LOCK";
  mint: string;
  amount: string;
  unlockUnix: number;
  beneficiary: string;
}

export interface CreateVestingLockInput {
  mint: string;
  amount: number | string;
  unlockTimestamp: number;
  beneficiary?: string;
  wallet: string;
  programId?: string;
  affiliate?: string | null;
  network?: SolanaCluster;
}

export interface CreateVestingLockOutput {
  transaction: string;
  escrowAddress: string;
  escrowSeed: string;
  mint: string;
  amountUi: string;
  unlockUnix: number;
  beneficiary: string;
  serviceFeeSol: number;
  blockhash: string;
  lastValidBlockHeight: number;
  network: SolanaCluster;
}

export interface ClaimVestingLockInput {
  mint: string;
  unlockTimestamp: number;
  wallet: string;
  beneficiary?: string;
  programId?: string;
  network?: SolanaCluster;
}

export interface OnChainVestingLockRecord {
  escrowAddress: string;
  escrowSeed: string;
  mint: string;
  amountUi: string;
  unlockUnix: number;
  beneficiary: string;
  signature: string;
  isUnlocked: boolean;
}

/**
 * Derives the canonical deterministic Escrow Token Account with seed:
 * `vest_${mint.slice(0,8)}_${unlockTimestamp}` (max 32 bytes required by PublicKey.createWithSeed).
 */
export async function deriveVestingEscrowAccount(params: {
  ownerPublicKey: PublicKey;
  mint: string;
  unlockTimestamp: number;
  tokenProgramId?: PublicKey;
}): Promise<{ escrowAddress: PublicKey; escrowSeed: string }> {
  const {
    ownerPublicKey,
    mint,
    unlockTimestamp,
    tokenProgramId = TOKEN_PROGRAM_ID,
  } = params;
  const escrowSeed = `vest_${mint.slice(0, 8)}_${Math.floor(unlockTimestamp)}`.slice(0, 32);
  const escrowAddress = await PublicKey.createWithSeed(
    ownerPublicKey,
    escrowSeed,
    tokenProgramId
  );
  return { escrowAddress, escrowSeed };
}

/**
 * Builds an on-chain Memo Program instruction containing the canonical JSON:
 * `{ type: "CTS_LOCK", mint, amount, unlockUnix, beneficiary }`
 * and adds `mintPubkey` as a read-only account key so anyone can query all locks for a Mint
 * directly via `connection.getSignaturesForAddress(mintPubkey)`.
 */
export function buildVestingMemoInstruction(params: {
  signerPubkey: PublicKey;
  mintPubkey: PublicKey;
  escrowPubkey: PublicKey;
  payload: VestingMemoPayload;
}): TransactionInstruction {
  const jsonString = JSON.stringify(params.payload);
  return new TransactionInstruction({
    programId: SPL_MEMO_PROGRAM_ID,
    keys: [
      { pubkey: params.signerPubkey, isSigner: true, isWritable: false },
      { pubkey: params.mintPubkey, isSigner: false, isWritable: false },
      { pubkey: params.escrowPubkey, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(jsonString, "utf-8"),
  });
}

/**
 * Builds the non-custodial Token Vesting / LP Lock transaction:
 * 1. Charges 0.10 SOL (`PRICING_SOL.tokenVestingLock`) atomically with 30% affiliate / 70% Dev Wallet split.
 * 2. Creates the deterministic Escrow token account with seed (`vest_${mint.slice(0,8)}_${unlockTimestamp}`).
 * 3. Transfers the locked SPL or Token-2022 tokens (or Raydium/Meteora LP tokens) into the Escrow account.
 * 4. Records the verifiable lock metadata on-chain via the SPL Memo Program (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`).
 */
export async function createVestingLockTransaction(
  input: CreateVestingLockInput
): Promise<CreateVestingLockOutput> {
  const {
    mint,
    amount,
    unlockTimestamp,
    beneficiary,
    wallet,
    programId,
    affiliate,
    network = "mainnet-beta",
  } = input;

  const connection = getSolanaConnection(network);
  const userPublicKey = new PublicKey(wallet);
  const mintPublicKey = new PublicKey(mint);
  const beneficiaryPublicKey = beneficiary ? new PublicKey(beneficiary) : userPublicKey;
  const unlockUnix = Math.floor(Number(unlockTimestamp));

  const mintAccountInfo = await connection.getAccountInfo(mintPublicKey, "confirmed");
  const tokenProgramId =
    mintAccountInfo && mintAccountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)
      ? TOKEN_2022_PROGRAM_ID
      : programId === TOKEN_2022_PROGRAM_ID.toBase58()
      ? TOKEN_2022_PROGRAM_ID
      : TOKEN_PROGRAM_ID;

  const mintInfo = await getMint(connection, mintPublicKey, "confirmed", tokenProgramId);
  const rawAmount = toRawTokenAmount(amount, mintInfo.decimals);

  const { escrowAddress, escrowSeed } = await deriveVestingEscrowAccount({
    ownerPublicKey: userPublicKey,
    mint,
    unlockTimestamp: unlockUnix,
    tokenProgramId,
  });

  const [rentLamports, existingEscrow, userSolBalance] = await Promise.all([
    connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZE),
    connection.getAccountInfo(escrowAddress, "confirmed"),
    connection.getBalance(userPublicKey, "confirmed"),
  ]);

  const requiredLamports =
    SERVICE_FEE_TOKEN_VESTING_LOCK_LAMPORTS + (existingEscrow ? 0 : rentLamports) + 15_000;
  if (userSolBalance < requiredLamports) {
    throw new Error(
      `Insufficient SOL balance on ${network}: you need ~${(
        requiredLamports / LAMPORTS_PER_SOL
      ).toFixed(4)} SOL (${SERVICE_FEE_TOKEN_VESTING_LOCK_SOL.toFixed(
        2
      )} SOL service fee + escrow account rent).`
    );
  }

  const userSourceAta = await getAssociatedTokenAddress(
    mintPublicKey,
    userPublicKey,
    false,
    tokenProgramId
  );

  const instructions: TransactionInstruction[] = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 350_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 20_000 }),
    // 1. Atomic 0.10 SOL fee with 30% affiliate / 70% Dev Wallet split
    ...buildServiceFeeInstructions(
      userPublicKey,
      SERVICE_FEE_TOKEN_VESTING_LOCK_LAMPORTS,
      affiliate
    ),
  ];

  // 2. Create and initialize deterministic Escrow token account with seed if not already created
  if (!existingEscrow) {
    instructions.push(
      SystemProgram.createAccountWithSeed({
        fromPubkey: userPublicKey,
        newAccountPubkey: escrowAddress,
        basePubkey: userPublicKey,
        seed: escrowSeed,
        lamports: rentLamports,
        space: ACCOUNT_SIZE,
        programId: tokenProgramId,
      }),
      createInitializeAccountInstruction(
        escrowAddress,
        mintPublicKey,
        beneficiaryPublicKey,
        tokenProgramId
      )
    );
  }

  // 3. Transfer tokens from creator's ATA into the Escrow account
  instructions.push(
    createTransferCheckedInstruction(
      userSourceAta,
      mintPublicKey,
      escrowAddress,
      userPublicKey,
      rawAmount,
      mintInfo.decimals,
      [],
      tokenProgramId
    )
  );

  // 4. Record verifiable lock metadata on-chain via Memo Program
  const memoPayload: VestingMemoPayload = {
    type: "CTS_LOCK",
    mint: mintPublicKey.toBase58(),
    amount: String(amount),
    unlockUnix,
    beneficiary: beneficiaryPublicKey.toBase58(),
  };

  instructions.push(
    buildVestingMemoInstruction({
      signerPubkey: userPublicKey,
      mintPubkey: mintPublicKey,
      escrowPubkey: escrowAddress,
      payload: memoPayload,
    })
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const msgV0 = new TransactionMessage({
    payerKey: userPublicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(msgV0);
  const base64Transaction = Buffer.from(transaction.serialize()).toString("base64");

  return {
    transaction: base64Transaction,
    escrowAddress: escrowAddress.toBase58(),
    escrowSeed,
    mint: mintPublicKey.toBase58(),
    amountUi: String(amount),
    unlockUnix,
    beneficiary: beneficiaryPublicKey.toBase58(),
    serviceFeeSol: SERVICE_FEE_TOKEN_VESTING_LOCK_SOL,
    blockhash,
    lastValidBlockHeight,
    network,
  };
}

/**
 * Builds the Claim / Unlock transaction after `unlockTimestamp` has matured:
 * Transfers all tokens from the deterministic Escrow account to the beneficiary's ATA and closes the Escrow account to recover rent.
 */
export async function claimVestingLockTransaction(input: ClaimVestingLockInput): Promise<{
  transaction: string;
  escrowAddress: string;
  claimedAmountUi: string;
  blockhash: string;
  lastValidBlockHeight: number;
}> {
  const {
    mint,
    unlockTimestamp,
    wallet,
    beneficiary,
    programId,
    network = "mainnet-beta",
  } = input;

  const nowUnix = Math.floor(Date.now() / 1000);
  const unlockUnix = Math.floor(Number(unlockTimestamp));
  if (nowUnix < unlockUnix) {
    throw new Error(
      `This lock is still active until ${new Date(unlockUnix * 1000).toUTCString()}.`
    );
  }

  const connection = getSolanaConnection(network);
  const userPublicKey = new PublicKey(wallet);
  const mintPublicKey = new PublicKey(mint);
  const beneficiaryPublicKey = beneficiary ? new PublicKey(beneficiary) : userPublicKey;

  const mintAccountInfo = await connection.getAccountInfo(mintPublicKey, "confirmed");
  const tokenProgramId =
    mintAccountInfo && mintAccountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)
      ? TOKEN_2022_PROGRAM_ID
      : programId === TOKEN_2022_PROGRAM_ID.toBase58()
      ? TOKEN_2022_PROGRAM_ID
      : TOKEN_PROGRAM_ID;

  const { escrowAddress } = await deriveVestingEscrowAccount({
    ownerPublicKey: userPublicKey,
    mint,
    unlockTimestamp: unlockUnix,
    tokenProgramId,
  });

  const [mintInfo, escrowParsed] = await Promise.all([
    getMint(connection, mintPublicKey, "confirmed", tokenProgramId),
    connection.getParsedAccountInfo(escrowAddress, "confirmed"),
  ]);

  const parsedData = escrowParsed.value?.data;
  let rawEscrowBalance = BigInt(0);
  let uiAmountStr = "0";

  if (parsedData && typeof parsedData === "object" && "parsed" in parsedData) {
    const tokenAmt = (parsedData as {
      parsed?: { info?: { tokenAmount?: { amount?: string; uiAmountString?: string } } };
    }).parsed?.info?.tokenAmount;
    if (tokenAmt?.amount) {
      rawEscrowBalance = BigInt(tokenAmt.amount);
      uiAmountStr = tokenAmt.uiAmountString || "0";
    }
  }

  if (rawEscrowBalance <= BigInt(0)) {
    throw new Error("Escrow account holds 0 tokens or has already been claimed.");
  }

  const beneficiaryAta = await getAssociatedTokenAddress(
    mintPublicKey,
    beneficiaryPublicKey,
    false,
    tokenProgramId
  );

  const instructions: TransactionInstruction[] = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 250_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 20_000 }),
    createAssociatedTokenAccountIdempotentInstruction(
      userPublicKey,
      beneficiaryAta,
      beneficiaryPublicKey,
      mintPublicKey,
      tokenProgramId
    ),
    createTransferCheckedInstruction(
      escrowAddress,
      mintPublicKey,
      beneficiaryAta,
      userPublicKey,
      rawEscrowBalance,
      mintInfo.decimals,
      [],
      tokenProgramId
    ),
    createCloseAccountInstruction(
      escrowAddress,
      userPublicKey,
      userPublicKey,
      [],
      tokenProgramId
    ),
  ];

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const msgV0 = new TransactionMessage({
    payerKey: userPublicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const tx = new VersionedTransaction(msgV0);
  return {
    transaction: Buffer.from(tx.serialize()).toString("base64"),
    escrowAddress: escrowAddress.toBase58(),
    claimedAmountUi: uiAmountStr,
    blockhash,
    lastValidBlockHeight,
  };
}

/**
 * Inspects recent on-chain signatures for a given Mint address and extracts any `CTS_LOCK`
 * Memo Program records so `/token/[mint]` and `/vesting` can verify locks on-chain.
 */
export async function fetchOnChainVestingLocksForMint(
  connection: Connection,
  mintPubkey: PublicKey,
  limit = 25
): Promise<OnChainVestingLockRecord[]> {
  try {
    const sigs = await connection.getSignaturesForAddress(mintPubkey, { limit }, "confirmed");
    const records: OnChainVestingLockRecord[] = [];
    const nowUnix = Math.floor(Date.now() / 1000);

    for (const item of sigs) {
      if (!item.memo || !item.memo.includes("CTS_LOCK")) continue;
      try {
        const jsonStart = item.memo.indexOf("{");
        const jsonEnd = item.memo.lastIndexOf("}");
        if (jsonStart === -1 || jsonEnd === -1) continue;
        const parsed = JSON.parse(item.memo.slice(jsonStart, jsonEnd + 1)) as VestingMemoPayload;
        if (parsed.type === "CTS_LOCK" && parsed.mint === mintPubkey.toBase58()) {
          const escrowSeed = `vest_${parsed.mint.slice(0, 8)}_${Math.floor(
            parsed.unlockUnix
          )}`.slice(0, 32);
          const beneficiaryPk = new PublicKey(parsed.beneficiary);
          const escrowAddress = await PublicKey.createWithSeed(
            beneficiaryPk,
            escrowSeed,
            TOKEN_PROGRAM_ID
          );
          records.push({
            escrowAddress: escrowAddress.toBase58(),
            escrowSeed,
            mint: parsed.mint,
            amountUi: String(parsed.amount),
            unlockUnix: Number(parsed.unlockUnix),
            beneficiary: parsed.beneficiary,
            signature: item.signature,
            isUnlocked: nowUnix >= Number(parsed.unlockUnix),
          });
        }
      } catch {
        // Ignore non-JSON memos
      }
    }

    return records;
  } catch {
    return [];
  }
}
