import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import bs58 from "bs58";
import { SolanaCluster, WSOL_MINT } from "@/lib/constants";
import {
  buildRaydiumCpmmSwapBaseInputInstruction,
  deriveRaydiumCpmmPdas,
} from "@/lib/services/liquidityPoolService";

/**
 * Official Jito Mainnet Block Engine endpoint & 8 Tip Accounts.
 */
export const JITO_MAINNET_BLOCK_ENGINE_URL =
  "https://mainnet.block-engine.jito.wtf/api/v1/bundles";

export const JITO_TIP_ACCOUNTS: ReadonlyArray<string> = [
  "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
  "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
  "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
  "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
  "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
  "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwdcEt",
  "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
  "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
] as const;

export function pickRandomJitoTipAccount(): PublicKey {
  const index = Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length);
  return new PublicKey(JITO_TIP_ACCOUNTS[index] || JITO_TIP_ACCOUNTS[0]);
}

export function buildJitoTipInstruction(
  payer: PublicKey,
  tipSol = 0.002
): TransactionInstruction {
  const clampedTipSol = Math.min(Math.max(tipSol, 0.001), 0.05);
  const tipLamports = Math.round(clampedTipSol * LAMPORTS_PER_SOL);
  return SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: pickRandomJitoTipAccount(),
    lamports: tipLamports,
  });
}

export interface MultiWalletBuyConfig {
  secretKey: Uint8Array;
  buyAmountSol: number;
}

export interface GeneratedBuyerWallet {
  index: number;
  publicKey: string;
  secretKeyBase58: string;
  secretKeyArray: number[];
  buyAmountSol: number;
}

/**
 * Generates 4 to 8 ephemeral buyer wallets with slightly randomized Anti-Bubblemaps weights
 * so Block-Zero purchases appear distributed across independent holders.
 */
export function generateAntiBubblemapsBuyerWallets(
  walletCount: number,
  totalBuySol: number
): GeneratedBuyerWallet[] {
  const clampedCount = Math.min(Math.max(Math.round(walletCount) || 4, 1), 8);
  const safeTotalSol = Math.max(0.01, Number(totalBuySol) || 0.2);

  // Subtle organic distribution weights (e.g., 18%, 22%, 27%, 33%) instead of identical flat splits
  const rawWeights: number[] = [];
  for (let i = 0; i < clampedCount; i++) {
    rawWeights.push(0.8 + (i / Math.max(1, clampedCount - 1)) * 0.45);
  }
  const weightSum = rawWeights.reduce((acc, w) => acc + w, 0);

  return rawWeights.map((w, idx) => {
    const kp = Keypair.generate();
    const shareSol = Number(((safeTotalSol * w) / weightSum).toFixed(4));
    return {
      index: idx + 1,
      publicKey: kp.publicKey.toBase58(),
      secretKeyBase58: bs58.encode(kp.secretKey),
      secretKeyArray: Array.from(kp.secretKey),
      buyAmountSol: Math.max(0.005, shareSol),
    };
  });
}

export interface AtomicLaunchBundleParams {
  connection: Connection;
  cluster: SolanaCluster;
  payerPublicKey: PublicKey;
  signAllTransactions: (txs: VersionedTransaction[]) => Promise<VersionedTransaction[]>;
  unsignedTransactions: VersionedTransaction[];
  baseMintAddress?: string;
  baseTokenProgramId?: string;
  jitoTipSol?: number;
  firstBuySol?: number;
  poolVaultAddress?: string;
  ammConfigAddress?: string;
  isMultiWalletBundle?: boolean;
  multiWalletBuys?: Array<{ secretKey: Uint8Array; buyAmountSol: number }>;
  onStatusUpdate?: (message: string, stepIndex: number) => void;
}

export interface AtomicLaunchBundleResult {
  bundleId: string;
  signatures: string[];
  mode: "jito-mainnet-bundle" | "devnet-sequential-simulation";
}

/**
 * Builds a single-wallet or multi-wallet Raydium CPMM `swapBaseInput` transaction
 * for a chunk of buyer sub-wallets (up to 4 sub-wallets per transaction to stay within the 1232-byte limit).
 */
async function buildBuyerChunkSwapTransaction(params: {
  payerPublicKey: PublicKey;
  baseMintPubkey: PublicKey;
  baseTokenProgramPubkey: PublicKey;
  cluster: SolanaCluster;
  blockhash: string;
  buyers: Array<{ keypair: Keypair; buyAmountSol: number }>;
  ammConfigAddress?: string;
  appendJitoTipSol?: number;
}): Promise<{ tx: VersionedTransaction; extraSigners: Keypair[] }> {
  const {
    payerPublicKey,
    baseMintPubkey,
    baseTokenProgramPubkey,
    cluster,
    blockhash,
    buyers,
    ammConfigAddress,
    appendJitoTipSol = 0,
  } = params;

  const ammConfigOverride = ammConfigAddress ? new PublicKey(ammConfigAddress) : undefined;
  const pdas = deriveRaydiumCpmmPdas(baseMintPubkey, WSOL_MINT, cluster, ammConfigOverride);
  const inputVault = pdas.isBaseToken0 ? pdas.token1VaultPda : pdas.token0VaultPda;
  const outputVault = pdas.isBaseToken0 ? pdas.token0VaultPda : pdas.token1VaultPda;

  const instructions: TransactionInstruction[] = [
    ComputeBudgetProgram.setComputeUnitLimit({
      units: Math.min(1_200_000, 200_000 + buyers.length * 180_000),
    }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 30_000 }),
  ];

  const extraSigners: Keypair[] = [];

  for (const buyer of buyers) {
    const subPubkey = buyer.keypair.publicKey;
    const isMainPayer = subPubkey.equals(payerPublicKey);
    if (!isMainPayer) {
      extraSigners.push(buyer.keypair);
    }

    const buyLamports = Math.max(10_000, Math.round(buyer.buyAmountSol * LAMPORTS_PER_SOL));
    const ataRentBufferLamports = Math.round(0.003 * LAMPORTS_PER_SOL);

    // 1. Atomic funding of sub-wallet from payerPublicKey (buyAmountSol + 0.003 SOL for ATA rent & fees)
    if (!isMainPayer) {
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: payerPublicKey,
          toPubkey: subPubkey,
          lamports: buyLamports + ataRentBufferLamports,
        })
      );
    }

    // 2. Idempotent creation of WSOL ATA & Base Token ATA for the buyer wallet
    const buyerWsolAta = await getAssociatedTokenAddress(
      WSOL_MINT,
      subPubkey,
      false,
      TOKEN_PROGRAM_ID
    );
    const buyerBaseAta = await getAssociatedTokenAddress(
      baseMintPubkey,
      subPubkey,
      false,
      baseTokenProgramPubkey
    );

    instructions.push(
      createAssociatedTokenAccountIdempotentInstruction(
        payerPublicKey,
        buyerWsolAta,
        subPubkey,
        WSOL_MINT,
        TOKEN_PROGRAM_ID
      ),
      createAssociatedTokenAccountIdempotentInstruction(
        payerPublicKey,
        buyerBaseAta,
        subPubkey,
        baseMintPubkey,
        baseTokenProgramPubkey
      ),
      SystemProgram.transfer({
        fromPubkey: isMainPayer ? payerPublicKey : subPubkey,
        toPubkey: buyerWsolAta,
        lamports: buyLamports,
      }),
      createSyncNativeInstruction(buyerWsolAta, TOKEN_PROGRAM_ID)
    );

    // 3. Official Raydium CPMM swapBaseInput instruction (discriminator [143, 190, 90, 218, 196, 30, 51, 222])
    instructions.push(
      buildRaydiumCpmmSwapBaseInputInstruction({
        payer: subPubkey,
        authority: pdas.authPda,
        ammConfig: pdas.ammConfigPubkey,
        poolState: pdas.poolStatePda,
        inputTokenAccount: buyerWsolAta,
        outputTokenAccount: buyerBaseAta,
        inputVault,
        outputVault,
        inputTokenProgram: TOKEN_PROGRAM_ID,
        outputTokenProgram: baseTokenProgramPubkey,
        inputTokenMint: WSOL_MINT,
        outputTokenMint: baseMintPubkey,
        observationState: pdas.observationStatePda,
        raydiumProgramId: pdas.raydiumProgramId,
        amountIn: BigInt(buyLamports),
        minimumAmountOut: BigInt(1),
      })
    );
  }

  if (cluster === "mainnet-beta" && appendJitoTipSol > 0) {
    instructions.push(buildJitoTipInstruction(payerPublicKey, appendJitoTipSol));
  }

  const msgV0 = new TransactionMessage({
    payerKey: payerPublicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const tx = new VersionedTransaction(msgV0);
  if (extraSigners.length > 0) {
    tx.sign(extraSigners);
  }

  return { tx, extraSigners };
}

/**
 * Builds and dispatches an Atomic Launch Bundle (up to 5 VersionedTransactions per Jito Bundle:
 * Tx 1: Mint + Metadata + Revocations + Atomic 30%/70% Fee Split,
 * Tx 2: Initialize Raydium CPMM Liquidity Pool,
 * Tx 3 & Tx 4: Multi-Wallet Anti-Bubblemaps Swaps (1 to 8 wallets via Raydium CPMM swapBaseInput) + Jito Validator Tip).
 */
export async function buildAndSendAtomicLaunchBundle(
  params: AtomicLaunchBundleParams
): Promise<AtomicLaunchBundleResult> {
  const {
    connection,
    cluster,
    payerPublicKey,
    signAllTransactions,
    unsignedTransactions,
    baseMintAddress,
    baseTokenProgramId,
    jitoTipSol = 0.002,
    firstBuySol = 0,
    poolVaultAddress,
    ammConfigAddress,
    isMultiWalletBundle = false,
    multiWalletBuys,
    onStatusUpdate,
  } = params;

  const txsToSign: VersionedTransaction[] = [...unsignedTransactions];
  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  const baseTokenProgramPubkey =
    baseTokenProgramId && baseTokenProgramId === TOKEN_2022_PROGRAM_ID.toBase58()
      ? TOKEN_2022_PROGRAM_ID
      : TOKEN_PROGRAM_ID;

  // Case A: Multi-Wallet Anti-Bubblemaps Buy (1 to 8 sub-wallets in Tx 3 & Tx 4, up to 5 txs max in bundle)
  if (
    isMultiWalletBundle &&
    Array.isArray(multiWalletBuys) &&
    multiWalletBuys.length > 0 &&
    baseMintAddress
  ) {
    const baseMintPubkey = new PublicKey(baseMintAddress);
    const validBuyers = multiWalletBuys
      .slice(0, 8)
      .filter((b) => b.secretKey && b.secretKey.length === 64 && b.buyAmountSol > 0)
      .map((b) => ({
        keypair: Keypair.fromSecretKey(Uint8Array.from(b.secretKey)),
        buyAmountSol: b.buyAmountSol,
      }));

    // Split up to 8 buyer sub-wallets into chunks of 4 across Transaction 3 and Transaction 4
    const maxRemainingSlots = Math.max(1, 5 - txsToSign.length);
    const chunkSize = Math.ceil(validBuyers.length / Math.min(2, maxRemainingSlots));
    const chunks: Array<Array<{ keypair: Keypair; buyAmountSol: number }>> = [];

    for (let i = 0; i < validBuyers.length && chunks.length < maxRemainingSlots; i += chunkSize) {
      chunks.push(validBuyers.slice(i, i + chunkSize));
    }

    for (let idx = 0; idx < chunks.length; idx++) {
      const isLastChunk = idx === chunks.length - 1;
      const { tx } = await buildBuyerChunkSwapTransaction({
        payerPublicKey,
        baseMintPubkey,
        baseTokenProgramPubkey,
        cluster,
        blockhash,
        buyers: chunks[idx],
        ammConfigAddress,
        appendJitoTipSol: isLastChunk ? jitoTipSol : 0,
      });
      txsToSign.push(tx);
    }
  } else if (txsToSign.length < 5 && (firstBuySol > 0 || jitoTipSol > 0)) {
    // Case B: Single-wallet First Buy via real Raydium CPMM swapBaseInput (or fallback transfer + Jito tip)
    if (firstBuySol > 0 && baseMintAddress) {
      const baseMintPubkey = new PublicKey(baseMintAddress);
      const { tx } = await buildBuyerChunkSwapTransaction({
        payerPublicKey,
        baseMintPubkey,
        baseTokenProgramPubkey,
        cluster,
        blockhash,
        buyers: [
          {
            keypair: Keypair.generate(), // Unused signer when pubkey equals payerPublicKey; handled below
            buyAmountSol: firstBuySol,
          },
        ].map((item) => ({
          // Use a proxy Keypair object whose publicKey is payerPublicKey so no extra signer is needed
          keypair: {
            publicKey: payerPublicKey,
            secretKey: new Uint8Array(64),
          } as unknown as Keypair,
          buyAmountSol: item.buyAmountSol,
        })),
        ammConfigAddress,
        appendJitoTipSol: jitoTipSol,
      });
      txsToSign.push(tx);
    } else {
      const tx3Instructions: TransactionInstruction[] = [];

      if (firstBuySol > 0 && poolVaultAddress) {
        try {
          const vaultPubkey = new PublicKey(poolVaultAddress);
          tx3Instructions.push(
            SystemProgram.transfer({
              fromPubkey: payerPublicKey,
              toPubkey: vaultPubkey,
              lamports: Math.round(firstBuySol * LAMPORTS_PER_SOL),
            })
          );
        } catch {
          // Ignore invalid vault pubkey
        }
      }

      if (cluster === "mainnet-beta" && jitoTipSol > 0) {
        tx3Instructions.push(buildJitoTipInstruction(payerPublicKey, jitoTipSol));
      }

      if (tx3Instructions.length > 0) {
        const msgV0 = new TransactionMessage({
          payerKey: payerPublicKey,
          recentBlockhash: blockhash,
          instructions: tx3Instructions,
        }).compileToV0Message();
        txsToSign.push(new VersionedTransaction(msgV0));
      }
    }
  }

  // Enforce Jito Bundle maximum of 5 VersionedTransactions
  const boundedTxsToSign = txsToSign.slice(0, 5);

  onStatusUpdate?.(
    cluster === "devnet"
      ? "Modo Devnet: Assinando lote de transações em sequência (Jito Block Engine é exclusivo da Mainnet-Beta)..."
      : `Assinando Jito Atomic Bundle (${boundedTxsToSign.length} transações no Bloco Zero)...`,
    3
  );

  const signedTransactions = await signAllTransactions(boundedTxsToSign);
  const signatures: string[] = [];

  // Devnet mode: execute sequentially on Devnet RPC
  if (cluster === "devnet") {
    for (let i = 0; i < signedTransactions.length; i++) {
      onStatusUpdate?.(
        `Devnet Sequencial (${i + 1}/${signedTransactions.length}): Confirmando transação...`,
        4
      );
      if (i > 0) {
        onStatusUpdate?.("Aguardando abertura do relógio on-chain da pool (2.5s)...", 4);
        await new Promise((r) => setTimeout(r, 2500));
      }
      const rawTx = signedTransactions[i].serialize();
      const sig = await connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
        maxRetries: 3,
      });
      const latestBh = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction(
        {
          signature: sig,
          blockhash: latestBh.blockhash,
          lastValidBlockHeight: latestBh.lastValidBlockHeight,
        },
        "confirmed"
      );
      signatures.push(sig);
    }

    return {
      bundleId: `devnet-seq-${signatures[0]?.slice(0, 12) || Date.now()}`,
      signatures,
      mode: "devnet-sequential-simulation",
    };
  }

  // Mainnet-Beta mode: encode signed transactions in base58 and submit to Jito Block Engine
  const base58Txs = signedTransactions.map((tx) => {
    const serialized = tx.serialize();
    if (tx.signatures[0]) {
      signatures.push(bs58.encode(tx.signatures[0]));
    }
    return bs58.encode(serialized);
  });

  onStatusUpdate?.("Enviando Jito Atomic Bundle para Mainnet Block Engine...", 4);

  try {
    const jitoResponse = await fetch(JITO_MAINNET_BLOCK_ENGINE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "sendBundle",
        params: [base58Txs],
      }),
    });

    if (jitoResponse.ok) {
      const jitoJson = await jitoResponse.json();
      if (jitoJson.result) {
        return {
          bundleId: String(jitoJson.result),
          signatures,
          mode: "jito-mainnet-bundle",
        };
      }
    }
  } catch (err) {
    console.warn("Jito Block Engine direct submission fell back to sequential Mainnet RPC:", err);
  }

  // Fallback to sequential Mainnet RPC broadcast if Jito Block Engine is unreachable from client region
  const fallbackSigs: string[] = [];
  for (let i = 0; i < signedTransactions.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 2500));
    const signedTx = signedTransactions[i];
    const sig = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });
    const latestBh = await connection.getLatestBlockhash("confirmed");
    await connection.confirmTransaction(
      {
        signature: sig,
        blockhash: latestBh.blockhash,
        lastValidBlockHeight: latestBh.lastValidBlockHeight,
      },
      "confirmed"
    );
    fallbackSigs.push(sig);
  }

  return {
    bundleId: `jito-fallback-${fallbackSigs[0]?.slice(0, 12) || Date.now()}`,
    signatures: fallbackSigs,
    mode: "jito-mainnet-bundle",
  };
}
