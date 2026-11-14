import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useCluster } from "@/context/WalletContext";
import { AFFILIATE_COMMISSION_RATE, SERVICE_FEE_CREATE_LP_SOL } from "@/lib/constants";
import { verifyTransactionIntegrity } from "@/lib/security";
import { CreateLiquidityPoolParams, CreateLiquidityPoolResponse } from "@/types/api";
import { parseSolanaError } from "./useErrorHandler";

export interface LiquidityPoolResult {
  signature: string;
  poolAddress: string;
  lpMintAddress: string;
  baseVaultAddress: string;
  quoteVaultAddress: string;
  dex: "raydium-cpmm" | "meteora-damm";
  initialPrice: number;
  lpTokensMinted?: string;
  serviceFeeSol?: number;
  freezeAuthorityRevokedInTx: boolean;
}

export const useCreateLiquidityPool = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { cluster } = useCluster();

  const [isLoading, setIsLoading] = useState(false);
  const [statusStep, setStatusStep] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [poolResult, setPoolResult] = useState<LiquidityPoolResult | null>(null);

  const createLiquidityPool = useCallback(
    async (params: CreateLiquidityPoolParams): Promise<LiquidityPoolResult | null> => {
      if (!publicKey || !sendTransaction) {
        setError("Please connect your Solana wallet before creating a Liquidity Pool.");
        return null;
      }
      if (!connection) {
        setError("Connection to the Solana network was not established.");
        return null;
      }

      setIsLoading(true);
      setError(null);
      setPoolResult(null);
      setProgressStep(1);
      setStatusStep(`Stage 1/5: Preparing On-Chain Pool Vaults & LP Mint on ${cluster}...`);

      try {
        let affiliateRef: string | null = null;
        try {
          affiliateRef = localStorage.getItem("affiliateRef");
        } catch {
          affiliateRef = null;
        }

        const response = await fetch("/api/create-liquidity-pool", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...params,
            wallet: publicKey.toBase58(),
            affiliate: affiliateRef,
            network: cluster,
          }),
        });

        const data: CreateLiquidityPoolResponse & {
          error?: string;
          lpTokensMinted?: string;
          serviceFeeSol?: number;
        } = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to build liquidity pool transaction.");
        }

        setProgressStep(2);
        setStatusStep(
          "Stage 2/5: Auditing program whitelist & simulating Liquidity Pool on Solana..."
        );

        const txBuffer = Buffer.from(data.transaction, "base64");
        const transaction = VersionedTransaction.deserialize(txBuffer);

        const integrity = verifyTransactionIntegrity(transaction, publicKey.toBase58());
        if (!integrity.valid) {
          throw new Error(
            integrity.reason || "Transaction failed client-side security verification."
          );
        }

        // Simulate unsigned VersionedTransaction with sigVerify: false & replaceRecentBlockhash: true
        const simulation = await connection.simulateTransaction(transaction, {
          sigVerify: false,
          replaceRecentBlockhash: true,
          commitment: "confirmed",
        });

        if (simulation.value.err) {
          console.error("LP simulation error:", simulation.value.err, simulation.value.logs);
          throw new Error(
            `Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`
          );
        }

        setProgressStep(3);
        setStatusStep("Stage 3/5: Waiting for signature approval in your Solana wallet...");

        const signature = await sendTransaction(transaction, connection, {
          skipPreflight: false,
          maxRetries: 3,
        });

        setProgressStep(4);
        setStatusStep("Stage 4/5: Confirming Pool Vaults & LP Token Mint on-chain...");

        await connection.confirmTransaction(
          {
            signature,
            blockhash: data.blockhash,
            lastValidBlockHeight: data.lastValidBlockHeight,
          },
          "confirmed"
        );

        setProgressStep(5);
        setStatusStep("Stage 5/5: Liquidity Pool & LP Tokens confirmed! Loading complete dossier...");

        // Cache LP Mint -> Base Mint mapping in localStorage so Withdraw Liquidity & Burn recognize LP tokens automatically from the wallet
        try {
          const rawMap = localStorage.getItem("createdLpPoolsMap");
          const parsedMap = rawMap ? JSON.parse(rawMap) : {};
          parsedMap[data.lpMintAddress] = {
            lpMintAddress: data.lpMintAddress,
            baseMint: params.baseMint,
            quoteToken: params.quoteToken,
            poolAddress: data.poolAddress,
            quoteAmount: params.quoteAmount,
            lpTokensMinted: data.lpTokensMinted || "100",
            network: cluster,
            createdAt: Date.now(),
          };
          parsedMap[params.baseMint] = parsedMap[data.lpMintAddress];
          localStorage.setItem("createdLpPoolsMap", JSON.stringify(parsedMap));
        } catch {
          // Ignore storage errors
        }

        if (affiliateRef && affiliateRef !== publicKey.toBase58()) {
          fetch("/api/record-commission", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              affiliateWallet: affiliateRef,
              commissionAmountSOL: SERVICE_FEE_CREATE_LP_SOL * AFFILIATE_COMMISSION_RATE,
              transactionSignature: signature,
              tokenCreatorWallet: publicKey.toBase58(),
              mintAddress: data.lpMintAddress,
              network: cluster,
            }),
          }).catch((err) => console.warn("Warning recording LP affiliate commission:", err));
        }

        const finalResult: LiquidityPoolResult = {
          signature,
          poolAddress: data.poolAddress,
          lpMintAddress: data.lpMintAddress,
          baseVaultAddress: data.baseVaultAddress,
          quoteVaultAddress: data.quoteVaultAddress,
          dex: data.dex,
          initialPrice: data.initialPrice,
          lpTokensMinted: data.lpTokensMinted,
          serviceFeeSol: data.serviceFeeSol,
          freezeAuthorityRevokedInTx: data.freezeAuthorityRevokedInTx,
        };

        setPoolResult(finalResult);
        return finalResult;
      } catch (err) {
        const friendly = parseSolanaError(err, "create the liquidity pool");
        setError(friendly);
        return null;
      } finally {
        setIsLoading(false);
        setStatusStep(null);
        setProgressStep(0);
      }
    },
    [publicKey, sendTransaction, connection, cluster]
  );

  const reset = useCallback(() => {
    setError(null);
    setPoolResult(null);
    setStatusStep(null);
    setProgressStep(0);
  }, []);

  return {
    createLiquidityPool,
    isLoading,
    statusStep,
    progressStep,
    error,
    poolResult,
    reset,
  };
};
