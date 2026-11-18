import { NextResponse } from "next/server";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createBurnCheckedInstruction,
  createCloseAccountInstruction,
  getMint,
} from "@solana/spl-token";
import {
  SERVICE_FEE_BURN_AND_EARN_LAMPORTS,
  SERVICE_FEE_BURN_TOKEN_LAMPORTS,
  WSOL_MINT,
} from "@/lib/constants";
import {
  burnTokenRequestSchema,
  checkRateLimitAsync,
  getClientIp,
  sanitizeErrorMessage,
  toRawTokenAmount,
} from "@/lib/security";
import {
  buildDynamicComputeBudgetInstructions,
  buildServiceFeeInstructions,
  getSolanaConnection,
} from "@/lib/services/solanaHelpers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = await checkRateLimitAsync(`burn-token:${clientIp}`, 20, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${rateLimit.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const rawBody = await request.json();
    const parsed = burnTokenRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid burn token parameters." },
        { status: 400 }
      );
    }

    const {
      mint,
      amount,
      wallet,
      programId,
      affiliate,
      network = "mainnet-beta",
    } = parsed.data;

    const burnMode = rawBody?.burnMode === "burn-and-earn" ? "burn-and-earn" : "burn";
    const serviceFeeLamports =
      burnMode === "burn-and-earn"
        ? SERVICE_FEE_BURN_AND_EARN_LAMPORTS
        : SERVICE_FEE_BURN_TOKEN_LAMPORTS;

    const connection = getSolanaConnection(network);
    const userPublicKey = new PublicKey(wallet);
    const mintPublicKey = new PublicKey(mint);

    // 1. Check user's SOL balance on the target network and inspect Mint account in parallel
    const [userSolBalance, mintAccountInfo, userTokenAccountsResp] = await Promise.all([
      connection.getBalance(userPublicKey, "confirmed"),
      connection.getAccountInfo(mintPublicKey, "confirmed"),
      connection.getParsedTokenAccountsByOwner(
        userPublicKey,
        { mint: mintPublicKey },
        "confirmed"
      ),
    ]);

    const requiredSolLamports = serviceFeeLamports + 10_000;
    if (userSolBalance < requiredSolLamports) {
      const haveSol = (userSolBalance / LAMPORTS_PER_SOL).toFixed(4);
      const needSol = (requiredSolLamports / LAMPORTS_PER_SOL).toFixed(4);
      return NextResponse.json(
        {
          error: `Saldo de SOL insuficiente na rede ${network}: sua carteira possui ${haveSol} SOL na ${network}, mas a operação requer ~${needSol} SOL. Verifique se sua carteira está conectada na mesma rede (${network}).`,
        },
        { status: 400 }
      );
    }

    if (!mintAccountInfo) {
      return NextResponse.json(
        {
          error: `O contrato do token (${mint.slice(0, 8)}...) não foi encontrado na rede ${network}. Verifique se o seletor de rede (Mainnet / Devnet) corresponde à rede do token.`,
        },
        { status: 400 }
      );
    }

    // Resolve actual owner program on-chain (prevents stale client programId mismatches on LP tokens)
    const tokenProgramId = mintAccountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)
      ? TOKEN_2022_PROGRAM_ID
      : programId === TOKEN_2022_PROGRAM_ID.toBase58()
      ? TOKEN_2022_PROGRAM_ID
      : TOKEN_PROGRAM_ID;

    const mintInfo = await getMint(connection, mintPublicKey, "confirmed", tokenProgramId);

    // 2. Discover all token accounts owned by the user for this mint (including non-ATA / Raydium seed accounts)
    const positiveTokenAccounts = userTokenAccountsResp.value
      .map((acc) => {
        const parsedInfo = acc.account.data.parsed?.info;
        const rawAmtStr = String(parsedInfo?.tokenAmount?.amount ?? "0");
        const uiAmtStr = String(parsedInfo?.tokenAmount?.uiAmountString ?? "0");
        return {
          pubkey: acc.pubkey,
          rawBalance: BigInt(rawAmtStr),
          uiAmountString: uiAmtStr,
        };
      })
      .filter((item) => item.rawBalance > BigInt(0))
      .sort((a, b) => (b.rawBalance > a.rawBalance ? 1 : b.rawBalance < a.rawBalance ? -1 : 0));

    if (positiveTokenAccounts.length === 0) {
      return NextResponse.json(
        {
          error: `Sua carteira não possui saldo disponível do token (${mint.slice(0, 6)}...) na rede ${network}. Atualize os saldos da carteira e tente novamente.`,
        },
        { status: 400 }
      );
    }

    const totalRawBalance = positiveTokenAccounts.reduce(
      (sum, item) => sum + item.rawBalance,
      BigInt(0)
    );

    // Parse requested burn amount (clamping fractional precision to mintInfo.decimals so float inputs never fail)
    const normalizedAmountStr = String(amount).replace(/,/g, "").trim();
    const [intPart, fracPart = ""] = normalizedAmountStr.split(".");
    const safeAmountStr =
      mintInfo.decimals > 0 && fracPart.length > mintInfo.decimals
        ? `${intPart}.${fracPart.slice(0, mintInfo.decimals)}`
        : mintInfo.decimals === 0
        ? intPart
        : normalizedAmountStr;

    let rawBurnAmount = toRawTokenAmount(safeAmountStr, mintInfo.decimals);

    // If user clicked MAX (or float rounding caused rawBurnAmount to slightly exceed totalRawBalance within 1%),
    // clamp rawBurnAmount to totalRawBalance so SPL Token never throws Custom: 1 (InsufficientFunds)
    if (rawBurnAmount > totalRawBalance) {
      const diff = rawBurnAmount - totalRawBalance;
      if (diff * BigInt(100) <= totalRawBalance || diff <= BigInt(10_000)) {
        rawBurnAmount = totalRawBalance;
      } else {
        const totalUi = Number(totalRawBalance) / Math.pow(10, mintInfo.decimals);
        return NextResponse.json(
          {
            error: `Quantidade de tokens insuficiente: você informou ${amount}, mas seu saldo on-chain é de ${totalUi} tokens.`,
          },
          { status: 400 }
        );
      }
    }

    const coreInstructions: TransactionInstruction[] = [
      ...buildServiceFeeInstructions(userPublicKey, serviceFeeLamports, affiliate),
    ];

    // Special case: Wrapped SOL (WSOL) cannot be burned via createBurnInstruction (NativeNotSupported);
    // closing the WSOL account unwraps it back to native SOL cleanly.
    if (mintPublicKey.equals(WSOL_MINT)) {
      for (const acc of positiveTokenAccounts) {
        coreInstructions.push(
          createCloseAccountInstruction(
            acc.pubkey,
            userPublicKey,
            userPublicKey,
            [],
            TOKEN_PROGRAM_ID
          )
        );
      }
    } else {
      let remainingToBurn = rawBurnAmount;
      for (const acc of positiveTokenAccounts) {
        if (remainingToBurn <= BigInt(0)) break;
        const burnFromThisAccount =
          remainingToBurn >= acc.rawBalance ? acc.rawBalance : remainingToBurn;

        coreInstructions.push(
          createBurnCheckedInstruction(
            acc.pubkey,
            mintPublicKey,
            userPublicKey,
            burnFromThisAccount,
            mintInfo.decimals,
            [],
            tokenProgramId
          )
        );

        // If 100% of this token account's balance was burned under classic SPL Token,
        // close the now-empty ATA to refund ~0.00204 SOL rent to the user!
        if (
          burnFromThisAccount === acc.rawBalance &&
          tokenProgramId.equals(TOKEN_PROGRAM_ID)
        ) {
          coreInstructions.push(
            createCloseAccountInstruction(
              acc.pubkey,
              userPublicKey,
              userPublicKey,
              [],
              TOKEN_PROGRAM_ID
            )
          );
        }

        remainingToBurn -= burnFromThisAccount;
      }
    }

    const computeBudgetIxs = await buildDynamicComputeBudgetInstructions({
      connection,
      payerKey: userPublicKey,
      instructions: coreInstructions,
      defaultUnits: 250_000,
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
    const serializedTransaction = transaction.serialize();
    const base64Transaction = Buffer.from(serializedTransaction).toString("base64");

    return NextResponse.json({
      transaction: base64Transaction,
      serviceFeeSol: serviceFeeLamports / LAMPORTS_PER_SOL,
      blockhash,
      lastValidBlockHeight,
      network,
    });
  } catch (error) {
    console.error("Detailed error while creating burn transaction:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(
          error,
          "Internal server error while creating the burn transaction."
        ),
      },
      { status: 500 }
    );
  }
}
