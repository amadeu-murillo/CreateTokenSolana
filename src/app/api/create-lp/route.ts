"use client";

import { useCallback } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Liquidity, LIQUIDITY_VERSION } from "@raydium-io/raydium-sdk";
import BN from "bn.js";

// IDs dos programas (ajuste se necessário)
const PROGRAM_ID_LIQUIDITY_V4 = new PublicKey(
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8" // Raydium AMM v4
);

const OPENBOOK_PROGRAM_ID = new PublicKey(
  "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin" // OpenBook DEX
);

// Hook para criar Pool
export function useCreatePool() {
  const createPool = useCallback(
    async ({
      connection,
      userPublicKey,
      marketId,
      baseMint,
      baseDecimals,
      quoteMint,
      quoteDecimals,
      baseAmount,
      quoteAmount,
    }: {
      connection: Connection;
      userPublicKey: PublicKey;
      marketId: PublicKey;
      baseMint: PublicKey;
      baseDecimals: number;
      quoteMint: PublicKey;
      quoteDecimals: number;
      baseAmount: number | string;
      quoteAmount: number | string;
    }) => {
      try {
        // Gera instruções simplificadas
        const { innerTransactions } =
          await Liquidity.makeCreatePoolV4InstructionV2Simple({
            connection,
            programId: PROGRAM_ID_LIQUIDITY_V4,
            marketInfo: {
              marketId,
              programId: OPENBOOK_PROGRAM_ID,
            },
            baseMintInfo: { mint: baseMint, decimals: baseDecimals },
            quoteMintInfo: { mint: quoteMint, decimals: quoteDecimals },
            baseAmount: baseAmount.toString(), // aceita string/number
            quoteAmount: quoteAmount.toString(),
            startTime: new BN(0),
            ownerInfo: {
              feePayer: userPublicKey,
              wallet: userPublicKey,
              tokenAccounts: [],
              useSOLBalance: true,
            },
            associatedOnly: true, // requerido pelo SDK
            checkCreateATAOwner: true,
          });

        console.log("Instruções para criar pool:", innerTransactions);

        return innerTransactions;
      } catch (err) {
        console.error("Erro ao criar pool:", err);
        throw err;
      }
    },
    []
  );

  return { createPool };
}
