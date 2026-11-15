import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import { useCluster } from "@/context/WalletContext";
import {
  AFFILIATE_COMMISSION_RATE,
  calculateModularTokenCreationFee,
} from "@/lib/constants";
import { getMetadataCache, setMetadataCache } from "@/lib/cache";
import { verifyTransactionIntegrity } from "@/lib/security";
import { buildAndSendAtomicLaunchBundle } from "@/lib/solana/jitoBundler";
import { parseSolanaError } from "./useErrorHandler";

export interface TokenData {
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  imageUrl: string;
  description?: string;
  website?: string;
  twitter?: string;
  instagram?: string;
  mintAuthority: boolean;
  freezeAuthority: boolean;
  tokenStandard: "spl" | "token-2022";
  useNativeMetadataExtension?: boolean;
  storageProvider?: "arweave" | "cloudinary";
  customCreator?: {
    enabled: boolean;
    name?: string;
    website?: string;
  };
  transferFee: {
    basisPoints: number;
    maxFee: number;
  };
  soulbound?: boolean;
  permanentDelegate?: boolean;
  vanitySecretKey?: number[];
  vanityCharLength?: number;
  jitoBundle?: {
    enabled: boolean;
    liquiditySol: number;
    poolSupplyPercent: number;
    firstBuySol: number;
    jitoTipSol: number;
  };
  isMetadataMutable: boolean;
}

export const useCreateToken = () => {
  const router = useRouter();
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const [isLoading, setIsLoading] = useState(false);
  const [statusStep, setStatusStep] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const createToken = useCallback(
    async (tokenData: TokenData) => {
      if (!publicKey || !sendTransaction) {
        const errorMessage = "Carteira não conectada. Conecte sua carteira Solana para continuar.";
        setError(errorMessage);
        return null;
      }

      if (!connection) {
        const errorMessage = "Conexão com a rede Solana não estabelecida.";
        setError(errorMessage);
        return null;
      }

      setIsLoading(true);
      setError(null);
      setProgressStep(1);
      setStatusStep("1. Upload para Irys — Verificando URI descentralizada da imagem...");

      try {
        let affiliateRef: string | null = null;
        try {
          affiliateRef = localStorage.getItem("affiliateRef");
        } catch {
          affiliateRef = null;
        }

        const isJitoEnabled = Boolean(tokenData.jitoBundle?.enabled);

        const { totalSol: expectedModularFeeSol } = calculateModularTokenCreationFee({
          revokeFreeze: !tokenData.freezeAuthority,
          revokeMint: !tokenData.mintAuthority,
          immutableMetadata: !tokenData.isMetadataMutable,
          customCreatorInfo: Boolean(tokenData.customCreator?.enabled),
          hasTransferFeeExtension:
            tokenData.tokenStandard === "token-2022" &&
            Boolean(tokenData.transferFee && tokenData.transferFee.basisPoints > 0),
          hasSoulboundExtension:
            tokenData.tokenStandard === "token-2022" && Boolean(tokenData.soulbound),
          hasPermanentDelegateExtension:
            tokenData.tokenStandard === "token-2022" && Boolean(tokenData.permanentDelegate),
          vanityCharLength: tokenData.vanityCharLength ?? 0,
          hasJitoBundle: isJitoEnabled,
        });

        setProgressStep(2);
        setStatusStep("2. Upload de Metadados — Publicando JSON Metaplex e montando transação...");

        const apiPayload = {
          ...tokenData,
          wallet: publicKey.toBase58(),
          affiliate: affiliateRef,
          network: cluster,
        };

        const response = await fetch("/api/create-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiPayload),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Falha ao preparar a transação no servidor.");
        }

        const transactionBuffer = Buffer.from(result.transaction, "base64");
        const transaction = VersionedTransaction.deserialize(new Uint8Array(transactionBuffer));

        const integrity = verifyTransactionIntegrity(transaction, publicKey.toBase58());
        if (!integrity.valid) {
          throw new Error(
            integrity.reason || "A transação falhou na verificação de segurança client-side."
          );
        }

        let signature = "";

        // Phase 3: Jito Atomic Bundle (Mint + Liquidity Pool + First Dev Buy + Jito Tip)
        if (isJitoEnabled && signAllTransactions && tokenData.jitoBundle) {
          const unsignedTxs: VersionedTransaction[] = [transaction];
          let poolVaultAddress: string | undefined;

          const poolTokenAmount = Math.max(
            1,
            Math.floor((tokenData.supply * (tokenData.jitoBundle.poolSupplyPercent || 80)) / 100)
          );
          const poolLiquiditySol = tokenData.jitoBundle.liquiditySol || 0.5;

          try {
            const lpResponse = await fetch("/api/create-liquidity-pool", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                dex: "raydium-cpmm",
                baseMint: result.mintAddress,
                quoteToken: "SOL",
                baseAmount: poolTokenAmount,
                quoteAmount: poolLiquiditySol,
                feeTierBps: 25,
                revokeFreezeIfActive: true,
                wallet: publicKey.toBase58(),
                affiliate: affiliateRef,
                network: cluster,
              }),
            });
            if (lpResponse.ok) {
              const lpData = await lpResponse.json();
              if (lpData.transaction) {
                const lpTxBuf = Buffer.from(lpData.transaction, "base64");
                unsignedTxs.push(VersionedTransaction.deserialize(new Uint8Array(lpTxBuf)));
                poolVaultAddress = lpData.quoteVaultAddress;
              }
            }
          } catch (lpErr) {
            console.warn("Could not pre-build LP transaction in Jito bundle:", lpErr);
          }

          const bundleResult = await buildAndSendAtomicLaunchBundle({
            connection,
            cluster,
            payerPublicKey: publicKey,
            signAllTransactions,
            unsignedTransactions: unsignedTxs,
            jitoTipSol: tokenData.jitoBundle.jitoTipSol || 0.002,
            firstBuySol: tokenData.jitoBundle.firstBuySol || 0,
            poolVaultAddress,
            onStatusUpdate: (msg, stepIdx) => {
              setProgressStep(stepIdx);
              setStatusStep(msg);
            },
          });

          signature = bundleResult.signatures[0] || bundleResult.bundleId;
        } else {
          const simulationResult = await connection.simulateTransaction(transaction, {
            sigVerify: false,
            replaceRecentBlockhash: true,
            commitment: "confirmed",
          });

          if (simulationResult.value.err) {
            console.error(
              "Token creation simulation failed:",
              simulationResult.value.err,
              simulationResult.value.logs
            );
            throw new Error(
              `Simulação falhou: ${JSON.stringify(simulationResult.value.err)}`
            );
          }

          setProgressStep(3);
          setStatusStep("3. Aguardando Assinatura — Confirme a transação na sua carteira...");

          signature = await sendTransaction(transaction, connection, {
            skipPreflight: false,
            maxRetries: 3,
          });

          setProgressStep(4);
          setStatusStep("4. Confirmando na Rede — Aguardando finalidade do bloco na Solana...");

          const blockhashInfo =
            result.blockhash && result.lastValidBlockHeight
              ? {
                  blockhash: result.blockhash,
                  lastValidBlockHeight: result.lastValidBlockHeight,
                }
              : await connection.getLatestBlockhash("confirmed");

          await connection.confirmTransaction(
            {
              signature,
              blockhash: blockhashInfo.blockhash,
              lastValidBlockHeight: blockhashInfo.lastValidBlockHeight,
            },
            "confirmed"
          );
        }

        const effectiveFeeSol = result.serviceFeeSol ?? expectedModularFeeSol;

        if (result.mintAddress) {
          const cache = getMetadataCache();
          cache[result.mintAddress] = {
            data: {
              name: tokenData.name,
              symbol: tokenData.symbol,
              logoURI: result.imageUrl || tokenData.imageUrl,
            },
            timestamp: Date.now(),
          };
          setMetadataCache(cache);

          try {
            localStorage.setItem(
              "lastCreatedTokenDossier",
              JSON.stringify({
                mintAddress: result.mintAddress,
                signature,
                name: tokenData.name,
                symbol: tokenData.symbol,
                decimals: tokenData.decimals,
                supply: tokenData.supply,
                imageUrl: result.imageUrl || tokenData.imageUrl,
                metadataUri: result.metadataUri || "",
                tokenStandard: tokenData.tokenStandard,
                mintAuthority: tokenData.mintAuthority,
                freezeAuthority: tokenData.freezeAuthority,
                isMetadataMutable: tokenData.isMetadataMutable,
                serviceFeeSol: effectiveFeeSol,
                network: cluster,
                createdAt: Date.now(),
              })
            );
          } catch {
            // Ignore localStorage quota errors
          }
        }

        if (affiliateRef && affiliateRef.trim() !== publicKey.toBase58()) {
          fetch("/api/record-commission", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              affiliateWallet: affiliateRef.trim(),
              commissionAmountSOL: Number((effectiveFeeSol * AFFILIATE_COMMISSION_RATE).toFixed(4)),
              transactionSignature: signature,
              tokenCreatorWallet: publicKey.toBase58(),
              mintAddress: result.mintAddress,
              network: cluster,
            }),
          }).catch((firebaseErr) =>
            console.warn("Warning recording affiliate commission:", firebaseErr)
          );
        }

        router.push(
          `/confirmation?status=success&tokenAddress=${result.mintAddress}&txId=${signature}&network=${cluster}`
        );
        return { signature, mintAddress: result.mintAddress };
      } catch (err) {
        const friendlyMessage = parseSolanaError(err, "criar o token");
        setError(friendlyMessage);
        return null;
      } finally {
        setIsLoading(false);
        setStatusStep(null);
        setProgressStep(0);
      }
    },
    [publicKey, sendTransaction, signAllTransactions, connection, cluster, router]
  );

  const clearError = useCallback(() => setError(null), []);

  return { createToken, isLoading, statusStep, progressStep, error, clearError };
};
