import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useCluster } from "@/context/WalletContext";
import { AFFILIATE_COMMISSION_RATE, SERVICE_FEE_CREATE_LP_SOL } from "@/lib/constants";
import { verifyTransactionIntegrity } from "@/lib/security";
import { buildAndSendAtomicLaunchBundle } from "@/lib/solana/jitoBundler";
import { CreateLiquidityPoolParams, CreateLiquidityPoolResponse } from "@/types/api";
import { parseSolanaError } from "./useErrorHandler";

export interface LiquidityPoolResult {
  signature: string;
  poolAddress: string;
  lpMintAddress: string;
  baseVaultAddress: string;
  quoteVaultAddress: string;
  dex: "raydium-cpmm";
  initialPrice: number;
  lpTokensMinted: string;
  serviceFeeSol: number;
  freezeAuthorityRevokedInTx: boolean;
}

export const useCreateLiquidityPool = () => {
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const { cluster } = useCluster();

  const [isLoading, setIsLoading] = useState(false);
  const [statusStep, setStatusStep] = useState<string>("");
  const [progressStep, setProgressStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [poolResult, setPoolResult] = useState<LiquidityPoolResult | null>(null);

  const createLiquidityPool = useCallback(
    async (params: CreateLiquidityPoolParams): Promise<LiquidityPoolResult | null> => {
      if (!publicKey || !sendTransaction) {
        setError("Please connect your Solana wallet before creating a liquidity pool.");
        return null;
      }

      if (Number(params.baseAmount) <= 0 || Number(params.quoteAmount) <= 0) {
        setError("Base token amount and Quote amount must both be greater than zero.");
        return null;
      }

      const targetNetwork = params.network || cluster;

      setIsLoading(true);
      setError(null);
      setPoolResult(null);
      setProgressStep(1);
      setStatusStep(
        `Stage 1/5: Preparing Raydium CPMM Pool & LP Mint on ${targetNetwork}...`
      );

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
            dex: "raydium-cpmm",
            wallet: publicKey.toBase58(),
            affiliate: affiliateRef,
            network: targetNetwork,
          }),
        });

        const data: CreateLiquidityPoolResponse & {
          error?: string;
        } = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to build Raydium CPMM pool transaction.");
        }

        setProgressStep(2);
        setStatusStep(
          "Stage 2/5: Auditing program whitelist & simulating Raydium CPMM Pool on Solana..."
        );

        const txBuffer = Buffer.from(data.transaction, "base64");
        const transaction = VersionedTransaction.deserialize(txBuffer);

        const integrity = verifyTransactionIntegrity(transaction, publicKey.toBase58(), {
          operation: "createLiquidityPool",
          expectedServiceFeeSol: SERVICE_FEE_CREATE_LP_SOL,
          affiliateWallet: affiliateRef,
          allowedTransferDestinations: [data.quoteVaultAddress, data.baseVaultAddress].filter(
            Boolean
          ),
        });
        if (!integrity.valid) {
          throw new Error(
            integrity.reason || "Transaction failed client-side security verification."
          );
        }

        const simulation = await connection.simulateTransaction(transaction, {
          sigVerify: false,
          replaceRecentBlockhash: true,
        });

        if (simulation.value.err) {
          console.error("LP Simulation error:", simulation.value.err, simulation.value.logs);
          throw new Error(
            `Pool simulation failed: ${JSON.stringify(simulation.value.err)}`
          );
        }

        setProgressStep(3);
        setStatusStep("Stage 3/5: Waiting for signature approval in your Solana wallet...");

        let signature = "";
        if (params.jitoBundle?.enabled && signAllTransactions) {
          const bundleRes = await buildAndSendAtomicLaunchBundle({
            connection,
            cluster: targetNetwork,
            payerPublicKey: publicKey,
            signAllTransactions,
            unsignedTransactions: [transaction],
            baseMintAddress: params.baseMint,
            baseTokenProgramId: params.programId,
            jitoTipSol: params.jitoBundle.jitoTipSol || 0.002,
            firstBuySol: params.jitoBundle.firstBuySol || 0,
            poolVaultAddress: data.quoteVaultAddress,
            ammConfigAddress: data.ammConfigAddress,
            isMultiWalletBundle: Boolean(params.jitoBundle.isMultiWalletBundle),
            multiWalletBuys: params.jitoBundle.multiWalletBuys,
            onStatusUpdate: (msg, stepIdx) => {
              setProgressStep(stepIdx);
              setStatusStep(msg);
            },
          });
          signature = bundleRes.signatures[0] || bundleRes.bundleId;
        } else {
          signature = await sendTransaction(transaction, connection, {
            skipPreflight: false,
            maxRetries: 3,
          });

          setProgressStep(4);
          setStatusStep("Stage 4/5: Confirming Raydium CPMM Pool & LP Token Mint on-chain...");

          await connection.confirmTransaction(
            {
              signature,
              blockhash: data.blockhash,
              lastValidBlockHeight: data.lastValidBlockHeight,
            },
            "confirmed"
          );
        }

        setProgressStep(5);
        setStatusStep("Stage 5/5: Raydium CPMM Pool confirmed! Loading complete dossier...");

        try {
          const rawMap = localStorage.getItem("createdLpPoolsMap");
          const parsedMap = rawMap ? JSON.parse(rawMap) : {};
          const entry = {
            poolId: data.poolAddress,
            poolAddress: data.poolAddress,
            lpMintAddress: data.lpMintAddress,
            baseVaultAddress: data.baseVaultAddress,
            quoteVaultAddress: data.quoteVaultAddress,
            baseMint: params.baseMint,
            quoteToken: params.quoteToken,
            quoteAmount: params.quoteAmount,
            feeTierBps: params.feeTierBps,
            lpTokensMinted: data.lpTokensMinted || "100",
            network: targetNetwork,
            createdAt: Date.now(),
          };
          parsedMap[data.lpMintAddress] = entry;
          parsedMap[params.baseMint] = entry;
          parsedMap[data.poolAddress] = entry;
          localStorage.setItem("createdLpPoolsMap", JSON.stringify(parsedMap));
        } catch {
          // Ignore storage errors
        }

        if (affiliateRef && affiliateRef !== publicKey.toBase58()) {
          const commissionAmountSOL =
            (data.serviceFeeSol ?? SERVICE_FEE_CREATE_LP_SOL) * AFFILIATE_COMMISSION_RATE;
          fetch("/api/record-commission", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              affiliateWallet: affiliateRef,
              commissionAmountSOL,
              transactionSignature: signature,
              tokenCreatorWallet: publicKey.toBase58(),
              mintAddress: data.lpMintAddress,
              network: targetNetwork,
            }),
          }).catch((err) => console.warn("Warning recording LP affiliate commission:", err));
        }

        const finalResult: LiquidityPoolResult = {
          signature,
          poolAddress: data.poolAddress,
          lpMintAddress: data.lpMintAddress,
          baseVaultAddress: data.baseVaultAddress,
          quoteVaultAddress: data.quoteVaultAddress,
          dex: "raydium-cpmm",
          initialPrice: data.initialPrice,
          lpTokensMinted: data.lpTokensMinted || "100.0000",
          serviceFeeSol: data.serviceFeeSol ?? SERVICE_FEE_CREATE_LP_SOL,
          freezeAuthorityRevokedInTx: data.freezeAuthorityRevokedInTx,
        };

        setPoolResult(finalResult);
        return finalResult;
      } catch (err) {
        const friendly = parseSolanaError(err, "create the Raydium CPMM liquidity pool");
        setError(friendly);
        return null;
      } finally {
        setIsLoading(false);
        setStatusStep("");
        setProgressStep(0);
      }
    },
    [publicKey, sendTransaction, signAllTransactions, connection, cluster]
  );

  const reset = useCallback(() => {
    setError(null);
    setPoolResult(null);
    setStatusStep("");
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
