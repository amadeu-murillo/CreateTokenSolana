import { NextRequest, NextResponse } from "next/server";
import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
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
import { SystemProgram } from "@solana/web3.js";
import {
  ACTIONS_CORS_HEADERS,
  ActionGetResponse,
  ActionPostResponse,
} from "@/lib/solana/actionsCors";
import {
  SERVICE_FEE_BLINK_SWAP_LAMPORTS,
  SERVICE_FEE_BLINK_SWAP_SOL,
  SolanaCluster,
  WSOL_MINT,
} from "@/lib/constants";
import { PRICING_SOL } from "@/config/pricing";
import { SITE_URL } from "@/lib/seo";
import { isValidPublicKey, sanitizeErrorMessage } from "@/lib/security";
import {
  buildServiceFeeInstructions,
  getSolanaConnection,
} from "@/lib/services/solanaHelpers";
import { fetchOnChainTokenMetadata } from "@/lib/services/tokenMetadataReader";
import {
  buildRaydiumCpmmSwapBaseInputInstruction,
  deriveRaydiumCpmmPdas,
} from "@/lib/services/liquidityPoolService";

export const dynamic = "force-dynamic";

interface JupiterInstructionAccount {
  pubkey: string;
  isSigner: boolean;
  isWritable: boolean;
}

interface JupiterSerializedInstruction {
  programId: string;
  accounts: JupiterInstructionAccount[];
  data: string;
}

function deserializeJupiterInstruction(
  ix?: JupiterSerializedInstruction | null
): TransactionInstruction | null {
  if (!ix || !ix.programId) return null;
  return new TransactionInstruction({
    programId: new PublicKey(ix.programId),
    keys: (ix.accounts || []).map((acc) => ({
      pubkey: new PublicKey(acc.pubkey),
      isSigner: Boolean(acc.isSigner),
      isWritable: Boolean(acc.isWritable),
    })),
    data: Buffer.from(ix.data || "", "base64"),
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ACTIONS_CORS_HEADERS });
}

export async function GET(
  request: NextRequest,
  context: { params: { mint: string } }
) {
  try {
    const mintParam = (context.params?.mint || "").trim();
    if (!isValidPublicKey(mintParam)) {
      return NextResponse.json(
        { message: "Invalid Solana token mint address." },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const ref = searchParams.get("ref") || "";
    const clusterParam =
      searchParams.get("network") === "devnet" ? "devnet" : "mainnet-beta";
    const refQuery = ref && isValidPublicKey(ref) ? `&ref=${encodeURIComponent(ref)}` : "";
    const netQuery = clusterParam === "devnet" ? `&network=devnet` : "";

    const connection = getSolanaConnection(clusterParam);
    const mintPubkey = new PublicKey(mintParam);

    let symbol = mintParam.slice(0, 5).toUpperCase();
    let name = `Solana Token (${symbol})`;
    let icon = `${SITE_URL}/sol.png`;
    let rugCheckScore = 100;
    let description = `Swap SOL for $${symbol} directly from your X/Twitter feed via CreateTokenSolana Blink (${PRICING_SOL.blinkSwapServiceFeeSol} SOL flat fee · 30% Affiliate / 70% Dev split).`;

    try {
      const meta = await fetchOnChainTokenMetadata(connection, mintPubkey);
      symbol = meta.symbol || symbol;
      name = meta.name || name;
      rugCheckScore = meta.rugCheckScore;
      if (meta.image && meta.image.startsWith("https://")) {
        icon = meta.image;
      }
      if (meta.description) {
        description = `${meta.description} · Verified on-chain by CreateTokenSolana (RugCheck ${rugCheckScore}/100).`;
      }
    } catch {
      // Fallback to default display metadata if mint is on another cluster or RPC is slow
    }

    const basePath = `/api/actions/token/${mintParam}`;
    const payload: ActionGetResponse = {
      type: "action",
      icon,
      title: `Buy $${symbol} on Solana (RugCheck Score: ${rugCheckScore}/100)`,
      description,
      label: `Buy $${symbol}`,
      links: {
        actions: [
          {
            type: "transaction",
            label: "Buy 0.1 SOL",
            href: `${basePath}?amount=0.1${refQuery}${netQuery}`,
          },
          {
            type: "transaction",
            label: "Buy 0.5 SOL",
            href: `${basePath}?amount=0.5${refQuery}${netQuery}`,
          },
          {
            type: "transaction",
            label: "Buy 1.0 SOL",
            href: `${basePath}?amount=1.0${refQuery}${netQuery}`,
          },
          {
            type: "transaction",
            label: "Buy Custom SOL",
            href: `${basePath}?amount={amount}${refQuery}${netQuery}`,
            parameters: [
              {
                name: "amount",
                label: "Enter SOL amount (e.g. 0.25)",
                required: true,
              },
            ],
          },
        ],
      },
    };

    return NextResponse.json(payload, { status: 200, headers: ACTIONS_CORS_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { message: sanitizeErrorMessage(error, "Failed to load Solana Blink metadata.") },
      { status: 500, headers: ACTIONS_CORS_HEADERS }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { mint: string } }
) {
  try {
    const mintParam = (context.params?.mint || "").trim();
    if (!isValidPublicKey(mintParam)) {
      return NextResponse.json(
        { message: "Invalid Solana token mint address." },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    const body = await request.json().catch(() => ({}));
    const accountStr = typeof body?.account === "string" ? body.account.trim() : "";
    if (!accountStr || !isValidPublicKey(accountStr)) {
      return NextResponse.json(
        { message: "A valid signer wallet public key ('account') is required." },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const rawAmount = parseFloat(searchParams.get("amount") || "0.1");
    const amountSol = Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : 0.1;
    const lamports = Math.max(100_000, Math.round(amountSol * LAMPORTS_PER_SOL));
    const ref = searchParams.get("ref");
    const cluster: SolanaCluster =
      searchParams.get("network") === "devnet" ? "devnet" : "mainnet-beta";

    const connection = getSolanaConnection(cluster);
    const userPubkey = new PublicKey(accountStr);
    const mintPubkey = new PublicKey(mintParam);

    // Atomic 0.005 SOL Blink Swap Service Fee (70% Dev / 30% Affiliate)
    const feeInstructions = buildServiceFeeInstructions(
      userPubkey,
      Math.round(PRICING_SOL.blinkSwapServiceFeeSol * LAMPORTS_PER_SOL) ||
        SERVICE_FEE_BLINK_SWAP_LAMPORTS,
      ref
    );

    // 1. Try Jupiter Quote API v6 + swap-instructions first
    let builtVersionedTx: VersionedTransaction | null = null;
    if (cluster === "mainnet-beta") {
      try {
        const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${WSOL_MINT.toBase58()}&outputMint=${mintParam}&amount=${lamports}&slippageBps=150`;
        const quoteRes = await fetch(quoteUrl);
        if (quoteRes.ok) {
          const quoteResponse = await quoteRes.json();
          const swapIxRes = await fetch("https://quote-api.jup.ag/v6/swap-instructions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quoteResponse,
              userPublicKey: userPubkey.toBase58(),
              wrapAndUnwrapSol: true,
              dynamicComputeUnitLimit: true,
            }),
          });

          if (swapIxRes.ok) {
            const swapData = await swapIxRes.json();
            const instructions: TransactionInstruction[] = [];

            if (Array.isArray(swapData.computeBudgetInstructions)) {
              for (const rawIx of swapData.computeBudgetInstructions) {
                const parsed = deserializeJupiterInstruction(rawIx);
                if (parsed) instructions.push(parsed);
              }
            }

            // Prepend atomic 0.005 SOL Blink fee split (70% Dev / 30% Affiliate)
            instructions.push(...feeInstructions);

            if (Array.isArray(swapData.setupInstructions)) {
              for (const rawIx of swapData.setupInstructions) {
                const parsed = deserializeJupiterInstruction(rawIx);
                if (parsed) instructions.push(parsed);
              }
            }

            const mainSwapIx = deserializeJupiterInstruction(swapData.swapInstruction);
            if (mainSwapIx) {
              instructions.push(mainSwapIx);
            }

            const cleanupIx = deserializeJupiterInstruction(swapData.cleanupInstruction);
            if (cleanupIx) {
              instructions.push(cleanupIx);
            }

            const lookupTableAddresses: string[] = Array.isArray(
              swapData.addressLookupTableAddresses
            )
              ? swapData.addressLookupTableAddresses
              : [];

            const lookupTableAccounts: AddressLookupTableAccount[] = [];
            if (lookupTableAddresses.length > 0) {
              const altResults = await Promise.all(
                lookupTableAddresses.map((addr) =>
                  connection.getAddressLookupTable(new PublicKey(addr))
                )
              );
              for (const item of altResults) {
                if (item.value) lookupTableAccounts.push(item.value);
              }
            }

            const { blockhash } = await connection.getLatestBlockhash("confirmed");
            const msgV0 = new TransactionMessage({
              payerKey: userPubkey,
              recentBlockhash: blockhash,
              instructions,
            }).compileToV0Message(lookupTableAccounts);

            builtVersionedTx = new VersionedTransaction(msgV0);
          }
        }
      } catch {
        // Fallback to direct Raydium CPMM swapBaseInput below if Jupiter API is unreachable or token is newly launched
      }
    }

    // 2. Fallback to direct Raydium CPMM swapBaseInput instruction if Jupiter quote did not resolve
    if (!builtVersionedTx) {
      const mintAcc = await connection.getAccountInfo(mintPubkey, "confirmed");
      const outputTokenProgram =
        mintAcc && mintAcc.owner.equals(TOKEN_2022_PROGRAM_ID)
          ? TOKEN_2022_PROGRAM_ID
          : TOKEN_PROGRAM_ID;

      const pdas = deriveRaydiumCpmmPdas(mintPubkey, WSOL_MINT, cluster);
      const userWsolAta = await getAssociatedTokenAddress(
        WSOL_MINT,
        userPubkey,
        false,
        TOKEN_PROGRAM_ID
      );
      const userOutputAta = await getAssociatedTokenAddress(
        mintPubkey,
        userPubkey,
        false,
        outputTokenProgram
      );

      const inputVault = pdas.isBaseToken0 ? pdas.token1VaultPda : pdas.token0VaultPda;
      const outputVault = pdas.isBaseToken0 ? pdas.token0VaultPda : pdas.token1VaultPda;

      const instructions: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25_000 }),
        ...feeInstructions,
        createAssociatedTokenAccountIdempotentInstruction(
          userPubkey,
          userWsolAta,
          userPubkey,
          WSOL_MINT,
          TOKEN_PROGRAM_ID
        ),
        createAssociatedTokenAccountIdempotentInstruction(
          userPubkey,
          userOutputAta,
          userPubkey,
          mintPubkey,
          outputTokenProgram
        ),
        SystemProgram.transfer({
          fromPubkey: userPubkey,
          toPubkey: userWsolAta,
          lamports,
        }),
        createSyncNativeInstruction(userWsolAta, TOKEN_PROGRAM_ID),
        buildRaydiumCpmmSwapBaseInputInstruction({
          payer: userPubkey,
          authority: pdas.authPda,
          ammConfig: pdas.ammConfigPubkey,
          poolState: pdas.poolStatePda,
          inputTokenAccount: userWsolAta,
          outputTokenAccount: userOutputAta,
          inputVault,
          outputVault,
          inputTokenProgram: TOKEN_PROGRAM_ID,
          outputTokenProgram,
          inputTokenMint: WSOL_MINT,
          outputTokenMint: mintPubkey,
          observationState: pdas.observationStatePda,
          raydiumProgramId: pdas.raydiumProgramId,
          amountIn: BigInt(lamports),
          minimumAmountOut: BigInt(1),
        }),
      ];

      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      const msgV0 = new TransactionMessage({
        payerKey: userPubkey,
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message();

      builtVersionedTx = new VersionedTransaction(msgV0);
    }

    const base64Transaction = Buffer.from(builtVersionedTx.serialize()).toString("base64");
    const responsePayload: ActionPostResponse = {
      type: "transaction",
      transaction: base64Transaction,
      message: `Swapping ${amountSol} SOL for token (${mintParam.slice(0, 6)}...) via CreateTokenSolana Blink (${SERVICE_FEE_BLINK_SWAP_SOL} SOL service fee).`,
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (error) {
    return NextResponse.json(
      { message: sanitizeErrorMessage(error, "Failed to build Solana Blink swap transaction.") },
      { status: 500, headers: ACTIONS_CORS_HEADERS }
    );
  }
}
