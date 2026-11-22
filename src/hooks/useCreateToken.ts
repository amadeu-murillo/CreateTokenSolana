import { getStoredAffiliateRef, recordCommissionWithRetry } from "@/lib/affiliateAttribution";
import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useRouter } from "next/navigation";
import { useCluster } from "@/context/WalletContext";
import { trackEvent } from "@/lib/analytics";
import {
  AFFILIATE_COMMISSION_RATE,
  ModularPricingOptions,
  calculateModularTokenCreationFee,
} from "@/lib/constants";
import { getMetadataCache, setMetadataCache } from "@/lib/cache";
import { verifyTransactionIntegrity } from "@/lib/security";
import { buildAndSendAtomicLaunchBundle } from "@/lib/solana/jitoBundler";
import { parseSolanaError } from "./useErrorHandler";
import { uploadMetadataJsonWithUserWallet } from "@/lib/solana/clientIrysUploader";

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
  vanityPublicKey?: string;
  vanitySecretKey?: number[];
  vanityCharLength?: number;
  jitoBundle?: {
    enabled: boolean;
    liquiditySol: number;
    poolSupplyPercent: number;
    firstBuySol: number;
    jitoTipSol: number;
    isMultiWalletBundle?: boolean;
    multiWalletBuys?: Array<{ secretKey: Uint8Array; buyAmountSol: number }>;
  };
  isMetadataMutable: boolean;
}

export const useCreateToken = () => {
  const router = useRouter();
  const wallet = useWallet();
  const { publicKey, sendTransaction, signAllTransactions } = wallet;
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
          affiliateRef = getStoredAffiliateRef();
        } catch {
          affiliateRef = null;
        }

        const isJitoEnabled = Boolean(tokenData.jitoBundle?.enabled);
        const isMultiWalletBundle = Boolean(tokenData.jitoBundle?.isMultiWalletBundle);

        // Phase 1.6: Reconstruct vanity Keypair strictly on the client; NEVER send vanitySecretKey to the server
        let clientVanityKeypair: Keypair | null = null;
        if (
          Array.isArray(tokenData.vanitySecretKey) &&
          tokenData.vanitySecretKey.length === 64
        ) {
          clientVanityKeypair = Keypair.fromSecretKey(
            Uint8Array.from(tokenData.vanitySecretKey)
          );
        }

        const vanityPublicKey =
          clientVanityKeypair?.publicKey.toBase58() || tokenData.vanityPublicKey;

        const modularOptions: ModularPricingOptions = {
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
          isMultiWalletBundle,
        };

        const { totalSol: expectedModularFeeSol } =
          calculateModularTokenCreationFee(modularOptions);

        setProgressStep(2);
        setStatusStep("2. Upload de Metadados — Publicando JSON Metaplex no Irys pela sua carteira...");

        // Upload Metaplex JSON metadata directly to Irys using the user's connected wallet
        // (no server-side IRYS_UPLOADER_PRIVATE_KEY required)
        let preUploadedMetadataUri: string | undefined;
        if (tokenData.storageProvider !== "cloudinary" && wallet.connected) {
          try {
            const attributes: Array<{ trait_type: string; value: string }> = [];
            const safeWebsite = tokenData.website?.trim();
            if (safeWebsite) attributes.push({ trait_type: "Website", value: safeWebsite });
            if (tokenData.twitter?.trim()) {
              const handle = tokenData.twitter.trim().replace(/^@/, "");
              const twUrl = handle.startsWith("http") ? handle : `https://x.com/${handle}`;
              attributes.push({ trait_type: "Twitter", value: twUrl });
            }
            if (tokenData.instagram?.trim()) {
              const handle = tokenData.instagram.trim().replace(/^@/, "");
              const igUrl = handle.startsWith("http") ? handle : `https://instagram.com/${handle}`;
              attributes.push({ trait_type: "Instagram", value: igUrl });
            }
            const isCustomCreator = Boolean(tokenData.customCreator?.enabled);
            const metadataJson: Record<string, unknown> = {
              name: tokenData.name,
              symbol: tokenData.symbol,
              description: tokenData.description || `${tokenData.name} (${tokenData.symbol}) token on Solana.`,
              image: tokenData.imageUrl,
              ...(attributes.length > 0 ? { attributes } : {}),
              creator: {
                name: isCustomCreator ? tokenData.customCreator?.name || tokenData.name : "CreateTokenSolana",
                site: isCustomCreator ? tokenData.customCreator?.website || "https://www.createtokensol.store" : "https://www.createtokensol.store",
              },
              properties: {
                files: [{ uri: tokenData.imageUrl, type: "image/png" }],
                category: "image",
              },
              ...(safeWebsite ? { external_url: safeWebsite } : {}),
            };
            const uploadedMeta = await uploadMetadataJsonWithUserWallet({
              metadata: metadataJson,
              wallet,
              cluster,
            });
            preUploadedMetadataUri = uploadedMeta.metadataUri;
          } catch (userMetaErr) {
            console.warn("User-wallet Irys metadata upload failed, falling back to server storage:", userMetaErr);
          }
        }

        // Strip secret keys (both buyer sub-wallets and vanitySecretKey) from server payload
        const sanitizedJitoBundle = tokenData.jitoBundle
          ? {
              enabled: tokenData.jitoBundle.enabled,
              liquiditySol: tokenData.jitoBundle.liquiditySol,
              poolSupplyPercent: tokenData.jitoBundle.poolSupplyPercent,
              firstBuySol: tokenData.jitoBundle.firstBuySol,
              jitoTipSol: tokenData.jitoBundle.jitoTipSol,
              isMultiWalletBundle,
            }
          : undefined;

        const { vanitySecretKey: _strippedVanitySecret, ...safeTokenData } = tokenData;
        void _strippedVanitySecret;

        const apiPayload = {
          ...safeTokenData,
          ...(preUploadedMetadataUri ? { metadataUri: preUploadedMetadataUri } : {}),
          vanityPublicKey,
          jitoBundle: sanitizedJitoBundle,
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

        // Phase 1.2: Deep instruction-level integrity check (program whitelist, SystemProgram.transfer fee/split, SetAuthority)
        const integrity = verifyTransactionIntegrity(transaction, publicKey.toBase58(), {
          operation: "createToken",
          modularOptions,
          affiliateWallet: affiliateRef,
        });
        if (!integrity.valid) {
          throw new Error(
            integrity.reason || "A transação falhou na verificação de segurança client-side."
          );
        }

        // Phase 1.6: Partially sign on the client with the vanity mint Keypair (never sent to server)
        if (clientVanityKeypair) {
          if (result.mintAddress !== clientVanityKeypair.publicKey.toBase58()) {
            throw new Error(
              "Alerta de segurança: O endereço Mint retornado pelo servidor não corresponde ao Vanity Keypair gerado localmente."
            );
          }
          transaction.sign([clientVanityKeypair]);
        }

        let signature = "";

        // Jito Atomic Bundle (Mint + Raydium CPMM Liquidity Pool + Single or Multi-Wallet Anti-Bubblemaps Buy + Jito Tip)
        if (isJitoEnabled && signAllTransactions && tokenData.jitoBundle) {
          const unsignedTxs: VersionedTransaction[] = [transaction];
          let poolVaultAddress: string | undefined;
          let ammConfigAddress: string | undefined;

          const poolTokenAmount = Math.max(
            1,
            Math.floor((tokenData.supply * (tokenData.jitoBundle.poolSupplyPercent || 80)) / 100)
          );
          const poolLiquiditySol = tokenData.jitoBundle.liquiditySol || 0.5;
          const baseProgramIdStr =
            tokenData.tokenStandard === "token-2022"
              ? TOKEN_2022_PROGRAM_ID.toBase58()
              : TOKEN_PROGRAM_ID.toBase58();

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
              programId: baseProgramIdStr,
              affiliate: affiliateRef,
              network: cluster,
              isAtomicBundlePreMint: true,
              baseDecimals: tokenData.decimals,
            }),
          });

          const lpData = await lpResponse.json();
          if (!lpResponse.ok || !lpData.transaction) {
            throw new Error(
              lpData.error ||
                "Falha ao preparar a transação da Pool de Liquidez Raydium para o Jito Atomic Bundle."
            );
          }

          const lpTxBuf = Buffer.from(lpData.transaction, "base64");
          const lpTx = VersionedTransaction.deserialize(new Uint8Array(lpTxBuf));
          const lpIntegrity = verifyTransactionIntegrity(lpTx, publicKey.toBase58(), {
            operation: "createLiquidityPool",
            affiliateWallet: affiliateRef,
            allowedTransferDestinations: [
              lpData.quoteVaultAddress,
              lpData.baseVaultAddress,
            ].filter(Boolean),
          });
          if (!lpIntegrity.valid) {
            throw new Error(
              lpIntegrity.reason ||
                "A transação de liquidez do Jito Bundle falhou na verificação de segurança."
            );
          }

          unsignedTxs.push(lpTx);
          poolVaultAddress = lpData.quoteVaultAddress;
          ammConfigAddress = lpData.ammConfigAddress;

          const bundleResult = await buildAndSendAtomicLaunchBundle({
            connection,
            cluster,
            payerPublicKey: publicKey,
            signAllTransactions,
            unsignedTransactions: unsignedTxs,
            baseMintAddress: result.mintAddress,
            baseTokenProgramId: baseProgramIdStr,
            jitoTipSol: tokenData.jitoBundle.jitoTipSol || 0.002,
            firstBuySol: tokenData.jitoBundle.firstBuySol || 0,
            poolVaultAddress,
            ammConfigAddress,
            isMultiWalletBundle,
            multiWalletBuys: tokenData.jitoBundle.multiWalletBuys,
            onStatusUpdate: (msg, stepIdx) => {
              setProgressStep(stepIdx);
              setStatusStep(msg);
            },
          });

          signature = bundleResult.signatures[0] || bundleResult.bundleId;
        } else {
          try {
            const simulationResult = await connection.simulateTransaction(transaction, {
              sigVerify: false,
              replaceRecentBlockhash: true,
              commitment: "confirmed",
            });

            if (simulationResult?.value?.err) {
              console.error(
                "Token creation simulation failed:",
                simulationResult.value.err,
                simulationResult.value.logs
              );
              throw new Error(
                `Simulação falhou: ${JSON.stringify(simulationResult.value.err)}`
              );
            }
          } catch (simErr) {
            if (simErr instanceof Error && simErr.message.startsWith("Simulação falhou:")) {
              throw simErr;
            }
            console.warn("Non-fatal pre-simulation warning (proceeding to wallet signature):", simErr);
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
          recordCommissionWithRetry({
            affiliateWallet: affiliateRef.trim(),
            commissionAmountSOL: Number((effectiveFeeSol * AFFILIATE_COMMISSION_RATE).toFixed(4)),
            transactionSignature: signature,
            tokenCreatorWallet: publicKey.toBase58(),
            mintAddress: result.mintAddress,
            network: cluster,
          }).catch((firebaseErr) =>
            console.warn("Warning recording affiliate commission:", firebaseErr)
          );
        }

        trackEvent("token_creation_confirmed", {
          cluster,
          has_jito_bundle: Boolean(isJitoEnabled),
        });
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
    [wallet, publicKey, sendTransaction, signAllTransactions, connection, cluster, router]
  );

  const clearError = useCallback(() => setError(null), []);

  return { createToken, isLoading, statusStep, progressStep, error, clearError };
};
