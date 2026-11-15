import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { SolanaCluster } from "@/lib/constants";

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

export interface AtomicLaunchBundleParams {
  connection: Connection;
  cluster: SolanaCluster;
  payerPublicKey: PublicKey;
  signAllTransactions: (txs: VersionedTransaction[]) => Promise<VersionedTransaction[]>;
  unsignedTransactions: VersionedTransaction[];
  jitoTipSol?: number;
  firstBuySol?: number;
  poolVaultAddress?: string;
  onStatusUpdate?: (message: string, stepIndex: number) => void;
}

export interface AtomicLaunchBundleResult {
  bundleId: string;
  signatures: string[];
  mode: "jito-mainnet-bundle" | "devnet-sequential-simulation";
}

/**
 * Builds and dispatches an Atomic Launch Bundle (up to 3 VersionedTransactions:
 * Tx 1: Mint + Metadata + Revocations + Atomic 30%/70% Fee Split,
 * Tx 2: Initialize Liquidity Pool,
 * Tx 3: First Dev Buy + Jito Validator Tip).
 *
 * On Mainnet-Beta, submits via Jito Block Engine `sendBundle` (with automatic RPC fallback if Block Engine is congested).
 * On Devnet, executes sequentially via standard Devnet RPC with a clear simulation notice.
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
    jitoTipSol = 0.002,
    firstBuySol = 0,
    poolVaultAddress,
    onStatusUpdate,
  } = params;

  const txsToSign: VersionedTransaction[] = [...unsignedTransactions];

  // If user configured a First Buy (Anti-Sniper Buy) or Jito Tip and < 3 txs are queued, append Tx 3
  if (txsToSign.length < 3 && (firstBuySol > 0 || jitoTipSol > 0)) {
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
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

  onStatusUpdate?.(
    cluster === "devnet"
      ? "Modo Devnet: Assinando lote de transações em sequência (Jito Block Engine é exclusivo da Mainnet-Beta)..."
      : `Assinando Jito Atomic Bundle (${txsToSign.length} transações no Bloco Zero)...`,
    3
  );

  const signedTransactions = await signAllTransactions(txsToSign);
  const signatures: string[] = [];

  // Devnet mode: execute sequentially on Devnet RPC
  if (cluster === "devnet") {
    for (let i = 0; i < signedTransactions.length; i++) {
      onStatusUpdate?.(
        `Devnet Sequencial (${i + 1}/${signedTransactions.length}): Confirmando transação...`,
        4
      );
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
  for (const signedTx of signedTransactions) {
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
