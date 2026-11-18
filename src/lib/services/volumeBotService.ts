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
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import bs58 from "bs58";
import { PRICING_SOL, computeSplit } from "@/config/pricing";
import { SolanaCluster, WSOL_MINT } from "@/lib/constants";
import { buildServiceFeeInstructions } from "./solanaHelpers";
import {
  buildRaydiumCpmmSwapBaseInputInstruction,
  deriveRaydiumCpmmPdas,
} from "./liquidityPoolService";

export type VolumeBotTierId = "starter100" | "growth300" | "trending750";

export interface VolumeBotPackageConfig {
  id: VolumeBotTierId;
  makersCount: number;
  subWalletCount: number;
  serviceFeeSol: number;
  recommendedWorkingCapitalSol: number;
  labelPt: string;
  labelEn: string;
  badge: string;
}

export const VOLUME_BOT_PACKAGES: Record<VolumeBotTierId, VolumeBotPackageConfig> = {
  starter100: {
    id: "starter100",
    makersCount: 100,
    subWalletCount: 5,
    serviceFeeSol: PRICING_SOL.volumeBotStarter100,
    recommendedWorkingCapitalSol: 0.25,
    labelPt: "Starter — 100 Makers Únicos",
    labelEn: "Starter — 100 Unique Makers",
    badge: "0.05 SOL Fee",
  },
  growth300: {
    id: "growth300",
    makersCount: 300,
    subWalletCount: 8,
    serviceFeeSol: PRICING_SOL.volumeBotGrowth300,
    recommendedWorkingCapitalSol: 0.5,
    labelPt: "Growth — 300 Makers Únicos",
    labelEn: "Growth — 300 Unique Makers",
    badge: "0.12 SOL Fee",
  },
  trending750: {
    id: "trending750",
    makersCount: 750,
    subWalletCount: 12,
    serviceFeeSol: PRICING_SOL.volumeBotTrending750,
    recommendedWorkingCapitalSol: 1.0,
    labelPt: "Trending — 750 Makers (DexScreener Boost)",
    labelEn: "Trending — 750 Makers (DexScreener Boost)",
    badge: "0.25 SOL Fee",
  },
};

export interface EphemeralVolumeWallet {
  index: number;
  publicKey: string;
  secretKeyBase58: string;
  secretKeyArray: number[];
}

/**
 * Generates N ephemeral Keypairs in the client browser and formats them for JSON backup.
 */
export function generateVolumeBotSubWallets(count: number): EphemeralVolumeWallet[] {
  const clamped = Math.min(Math.max(Math.round(count) || 5, 1), 20);
  const wallets: EphemeralVolumeWallet[] = [];

  for (let i = 0; i < clamped; i++) {
    const kp = Keypair.generate();
    wallets.push({
      index: i + 1,
      publicKey: kp.publicKey.toBase58(),
      secretKeyBase58: bs58.encode(kp.secretKey),
      secretKeyArray: Array.from(kp.secretKey),
    });
  }

  return wallets;
}

/**
 * Triggers a browser download of `createtokensol-volume-keys-[timestamp].json`
 * containing all ephemeral sub-wallet private keys in both base58 and numeric array format.
 */
export function downloadVolumeKeysBackupJson(params: {
  tierId: VolumeBotTierId;
  tokenMint: string;
  network: SolanaCluster;
  wallets: EphemeralVolumeWallet[];
}): string {
  const timestamp = Date.now();
  const filename = `createtokensol-volume-keys-${timestamp}.json`;
  const pkg = VOLUME_BOT_PACKAGES[params.tierId];
  const split = computeSplit(pkg.serviceFeeSol);

  const backupPayload = {
    platform: "CreateTokenSolana (https://www.createtokensol.store)",
    module: "Non-Custodial Volume & Maker Booster Bot",
    packageId: params.tierId,
    targetMakers: pkg.makersCount,
    serviceFeeSol: pkg.serviceFeeSol,
    affiliateSplitSol: split.affiliateSol,
    devWalletSplitSol: split.devWalletSol,
    tokenMint: params.tokenMint,
    network: params.network,
    createdAt: new Date(timestamp).toISOString(),
    recoveryInstructions:
      "Import any secretKeyBase58 into Phantom/Solflare or use the 'Recover & Sweep All SOL to Main Wallet' button on https://www.createtokensol.store/volume-bot to sweep all remaining SOL back to your main wallet.",
    wallets: params.wallets,
  };

  if (typeof window !== "undefined") {
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return filename;
}

/**
 * Builds the initial activation transaction that:
 * 1. Charges the package fee (0.05, 0.12, or 0.25 SOL) atomically with 70% Dev / 30% Affiliate split via buildServiceFeeInstructions.
 * 2. Distributes the user's SOL working capital across all ephemeral sub-wallets in the same atomic transaction.
 */
export async function buildVolumeBotActivationTransaction(params: {
  connection: Connection;
  userPublicKey: PublicKey;
  tierId: VolumeBotTierId;
  workingCapitalSol: number;
  subWalletPubkeys: PublicKey[];
  affiliate?: string | null;
}): Promise<{
  transaction: VersionedTransaction;
  blockhash: string;
  lastValidBlockHeight: number;
  serviceFeeSol: number;
  perWalletSol: number;
}> {
  const {
    connection,
    userPublicKey,
    tierId,
    workingCapitalSol,
    subWalletPubkeys,
    affiliate,
  } = params;

  const pkg = VOLUME_BOT_PACKAGES[tierId] || VOLUME_BOT_PACKAGES.starter100;
  const feeLamports = Math.round(pkg.serviceFeeSol * LAMPORTS_PER_SOL);
  const totalCapitalLamports = Math.max(
    subWalletPubkeys.length * 5_000_000,
    Math.round(workingCapitalSol * LAMPORTS_PER_SOL)
  );
  const perWalletLamports = Math.floor(
    totalCapitalLamports / Math.max(1, subWalletPubkeys.length)
  );

  const instructions: TransactionInstruction[] = [
    ComputeBudgetProgram.setComputeUnitLimit({
      units: Math.min(400_000, 100_000 + subWalletPubkeys.length * 15_000),
    }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 20_000 }),
    // Step 1: Atomic 70% Dev / 30% Affiliate split on the package fee
    ...buildServiceFeeInstructions(userPublicKey, feeLamports, affiliate),
  ];

  // Step 2: Distribute working capital across ephemeral sub-wallets
  for (const subPubkey of subWalletPubkeys) {
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: subPubkey,
        lamports: perWalletLamports,
      })
    );
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const msgV0 = new TransactionMessage({
    payerKey: userPublicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(msgV0);

  return {
    transaction,
    blockhash,
    lastValidBlockHeight,
    serviceFeeSol: pkg.serviceFeeSol,
    perWalletSol: Number((perWalletLamports / LAMPORTS_PER_SOL).toFixed(5)),
  };
}

/**
 * Executes a single Maker cycle (micro-buy followed by micro-sell/unwrap) from an ephemeral sub-wallet
 * via Jupiter API v6 on Mainnet-Beta or direct Raydium CPMM swapBaseInput on Devnet/Mainnet.
 */
export async function executeSubWalletMakerCycle(params: {
  connection: Connection;
  cluster: SolanaCluster;
  subWalletKeypair: Keypair;
  tokenMint: PublicKey;
  tokenProgramId: PublicKey;
  tradeAmountLamports: number;
}): Promise<{ signature: string; routeUsed: "jupiter-v6" | "raydium-cpmm" }> {
  const {
    connection,
    cluster,
    subWalletKeypair,
    tokenMint,
    tokenProgramId,
    tradeAmountLamports,
  } = params;

  const safeLamports = Math.max(100_000, Math.round(tradeAmountLamports));

  // 1. Try Jupiter v6 swap on Mainnet-Beta first
  if (cluster === "mainnet-beta") {
    try {
      const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${WSOL_MINT.toBase58()}&outputMint=${tokenMint.toBase58()}&amount=${safeLamports}&slippageBps=200`;
      const quoteRes = await fetch(quoteUrl);
      if (quoteRes.ok) {
        const quoteResponse = await quoteRes.json();
        const swapRes = await fetch("https://quote-api.jup.ag/v6/swap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quoteResponse,
            userPublicKey: subWalletKeypair.publicKey.toBase58(),
            wrapAndUnwrapSol: true,
            dynamicComputeUnitLimit: true,
          }),
        });
        if (swapRes.ok) {
          const swapJson = await swapRes.json();
          if (swapJson?.swapTransaction) {
            const txBuf = Buffer.from(swapJson.swapTransaction, "base64");
            const vTx = VersionedTransaction.deserialize(new Uint8Array(txBuf));
            vTx.sign([subWalletKeypair]);
            const sig = await connection.sendRawTransaction(vTx.serialize(), {
              skipPreflight: false,
              maxRetries: 2,
            });
            const bh = await connection.getLatestBlockhash("confirmed");
            await connection.confirmTransaction(
              {
                signature: sig,
                blockhash: bh.blockhash,
                lastValidBlockHeight: bh.lastValidBlockHeight,
              },
              "confirmed"
            );
            return { signature: sig, routeUsed: "jupiter-v6" };
          }
        }
      }
    } catch {
      // Fall through to direct Raydium CPMM swapBaseInput
    }
  }

  // 2. Direct Raydium CPMM micro-buy + micro-sell in a single atomic transaction
  const pdas = deriveRaydiumCpmmPdas(tokenMint, WSOL_MINT, cluster);
  const subPubkey = subWalletKeypair.publicKey;
  const subWsolAta = await getAssociatedTokenAddress(
    WSOL_MINT,
    subPubkey,
    false,
    TOKEN_PROGRAM_ID
  );
  const subTokenAta = await getAssociatedTokenAddress(
    tokenMint,
    subPubkey,
    false,
    tokenProgramId
  );

  const wsolVault = pdas.isBaseToken0 ? pdas.token1VaultPda : pdas.token0VaultPda;
  const baseVault = pdas.isBaseToken0 ? pdas.token0VaultPda : pdas.token1VaultPda;

  const instructions: TransactionInstruction[] = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 380_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 20_000 }),
    createAssociatedTokenAccountIdempotentInstruction(
      subPubkey,
      subWsolAta,
      subPubkey,
      WSOL_MINT,
      TOKEN_PROGRAM_ID
    ),
    createAssociatedTokenAccountIdempotentInstruction(
      subPubkey,
      subTokenAta,
      subPubkey,
      tokenMint,
      tokenProgramId
    ),
    SystemProgram.transfer({
      fromPubkey: subPubkey,
      toPubkey: subWsolAta,
      lamports: safeLamports,
    }),
    createSyncNativeInstruction(subWsolAta, TOKEN_PROGRAM_ID),
    buildRaydiumCpmmSwapBaseInputInstruction({
      payer: subPubkey,
      authority: pdas.authPda,
      ammConfig: pdas.ammConfigPubkey,
      poolState: pdas.poolStatePda,
      inputTokenAccount: subWsolAta,
      outputTokenAccount: subTokenAta,
      inputVault: wsolVault,
      outputVault: baseVault,
      inputTokenProgram: TOKEN_PROGRAM_ID,
      outputTokenProgram: tokenProgramId,
      inputTokenMint: WSOL_MINT,
      outputTokenMint: tokenMint,
      observationState: pdas.observationStatePda,
      raydiumProgramId: pdas.raydiumProgramId,
      amountIn: BigInt(safeLamports),
      minimumAmountOut: BigInt(1),
    }),
  ];

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const msgV0 = new TransactionMessage({
    payerKey: subPubkey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const vTx = new VersionedTransaction(msgV0);
  vTx.sign([subWalletKeypair]);

  const signature = await connection.sendRawTransaction(vTx.serialize(), {
    skipPreflight: false,
    maxRetries: 2,
  });

  await connection.confirmTransaction(
    {
      signature,
      blockhash,
      lastValidBlockHeight,
    },
    "confirmed"
  );

  return { signature, routeUsed: "raydium-cpmm" };
}

/**
 * Sweeps all SOL and closes temporary ATAs (recovering ~0.00204 SOL rent per ATA)
 * from all ephemeral sub-wallets back into the user's main wallet.
 */
export async function sweepAllSubWalletsToMainWallet(params: {
  connection: Connection;
  mainWalletPubkey: PublicKey;
  subWallets: EphemeralVolumeWallet[];
  onProgress?: (msg: string) => void;
}): Promise<{
  sweptCount: number;
  totalRecoveredSol: number;
  signatures: string[];
}> {
  const { connection, mainWalletPubkey, subWallets, onProgress } = params;
  const signatures: string[] = [];
  let sweptCount = 0;
  let totalRecoveredLamports = 0;

  for (let i = 0; i < subWallets.length; i++) {
    const sw = subWallets[i];
    const kp = Keypair.fromSecretKey(Uint8Array.from(sw.secretKeyArray));
    const subPubkey = kp.publicKey;

    onProgress?.(
      `Varrendo sub-carteira #${sw.index} (${subPubkey.toBase58().slice(0, 6)}...)...`
    );

    try {
      const [solBalance, splAccs, t22Accs] = await Promise.all([
        connection.getBalance(subPubkey, "confirmed"),
        connection.getParsedTokenAccountsByOwner(
          subPubkey,
          { programId: TOKEN_PROGRAM_ID },
          "confirmed"
        ),
        connection.getParsedTokenAccountsByOwner(
          subPubkey,
          { programId: TOKEN_2022_PROGRAM_ID },
          "confirmed"
        ),
      ]);

      const instructions: TransactionInstruction[] = [];

      // Close any zero-balance or WSOL ATAs owned by the sub-wallet, sending rent directly to mainWalletPubkey
      for (const acc of splAccs.value) {
        const info = acc.account.data.parsed?.info;
        const amountStr = info?.tokenAmount?.amount ?? "0";
        const mintStr = info?.mint ?? "";
        if (amountStr === "0" || mintStr === WSOL_MINT.toBase58()) {
          totalRecoveredLamports += acc.account.lamports;
          instructions.push(
            createCloseAccountInstruction(
              acc.pubkey,
              mainWalletPubkey,
              subPubkey,
              [],
              TOKEN_PROGRAM_ID
            )
          );
        }
      }

      for (const acc of t22Accs.value) {
        const info = acc.account.data.parsed?.info;
        const amountStr = info?.tokenAmount?.amount ?? "0";
        if (amountStr === "0") {
          totalRecoveredLamports += acc.account.lamports;
          instructions.push(
            createCloseAccountInstruction(
              acc.pubkey,
              mainWalletPubkey,
              subPubkey,
              [],
              TOKEN_2022_PROGRAM_ID
            )
          );
        }
      }

      // Leave 5,000 lamports for base signature fee and transfer remaining native SOL to mainWalletPubkey
      const transferableSolLamports = Math.max(0, solBalance - 5_000);
      if (transferableSolLamports > 0) {
        totalRecoveredLamports += transferableSolLamports;
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: subPubkey,
            toPubkey: mainWalletPubkey,
            lamports: transferableSolLamports,
          })
        );
      }

      if (instructions.length === 0) continue;

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      const msgV0 = new TransactionMessage({
        payerKey: subPubkey,
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message();

      const tx = new VersionedTransaction(msgV0);
      tx.sign([kp]);

      const sig = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
        maxRetries: 2,
      });

      await connection.confirmTransaction(
        {
          signature: sig,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed"
      );

      signatures.push(sig);
      sweptCount++;
    } catch {
      // Continue sweeping remaining sub-wallets even if one has 0 balance
    }
  }

  return {
    sweptCount,
    totalRecoveredSol: Number((totalRecoveredLamports / LAMPORTS_PER_SOL).toFixed(6)),
    signatures,
  };
}
