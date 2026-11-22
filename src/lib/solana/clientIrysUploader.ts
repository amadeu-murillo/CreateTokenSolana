"use client";

import type { WalletContextState } from "@solana/wallet-adapter-react";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createGenericFile, type Umi } from "@metaplex-foundation/umi";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { bundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr";
import type { SolanaCluster } from "@/lib/constants";

/**
 * Mainnet node2.irys.xyz supports free uploads (< 100 KiB) and automatic user-wallet funding (>= 100 KiB).
 */
export const CLIENT_IRYS_NODE_MAINNET = "https://uploader.irys.xyz";
export const CLIENT_IRYS_NODE_DEVNET = "https://devnet.irys.xyz";

export function getClientIrysNodeAddress(cluster: SolanaCluster = "mainnet-beta"): string {
  return cluster === "devnet" ? CLIENT_IRYS_NODE_DEVNET : CLIENT_IRYS_NODE_MAINNET;
}

export function getBrowserRpcEndpoint(cluster: SolanaCluster = "mainnet-beta"): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api/rpc?cluster=${cluster}`;
  }
  return cluster === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com";
}

export function normalizeClientArweaveUri(
  uri: string,
  cluster: SolanaCluster = "mainnet-beta"
): string {
  if (!uri) return uri;
  const match = uri.match(/\/([a-zA-Z0-9_-]{43,44})(?:\?.*)?$/);
  if (match && match[1]) {
    return cluster === "devnet"
      ? `https://devnet.irys.xyz/${match[1]}`
      : `https://gateway.irys.xyz/${match[1]}`;
  }
  return uri;
}

/**
 * Builds a client-side Umi instance authenticated directly by the user's connected Solana wallet.
 * No server-side private key or external funding wallet is required.
 */
export function createUserWalletIrysUmi(
  wallet: WalletContextState,
  cluster: SolanaCluster = "mainnet-beta"
): Umi {
  if (!wallet.connected || !wallet.publicKey) {
    throw new Error("Conecte sua carteira Solana para enviar arquivos diretamente para o Irys.");
  }

  const rpcEndpoint = getBrowserRpcEndpoint(cluster);
  const irysAddress = getClientIrysNodeAddress(cluster);

  return createUmi(rpcEndpoint)
    .use(walletAdapterIdentity(wallet))
    .use(
      bundlrUploader({
        address: irysAddress,
        providerUrl: rpcEndpoint,
        timeout: 60_000,
      })
    );
}

/**
 * Uploads a token logo File directly to Arweave/Irys using the user's connected wallet.
 * Files < 100 KiB use the Irys free tier; larger files are funded directly from the user's wallet.
 */
export async function uploadImageWithUserWallet(params: {
  file: File;
  wallet: WalletContextState;
  cluster?: SolanaCluster;
}): Promise<{ arweaveUri: string; gatewayUrl: string; provider: "arweave-irys" }> {
  const { file, wallet, cluster = "mainnet-beta" } = params;
  const umi = createUserWalletIrysUmi(wallet, cluster);
  const arrayBuffer = await file.arrayBuffer();
  const contentType = file.type || "image/png";

  const genericFile = createGenericFile(new Uint8Array(arrayBuffer), file.name || "token-logo.png", {
    contentType,
    tags: [
      { name: "Content-Type", value: contentType },
      { name: "App-Name", value: "CreateTokenSolana" },
      { name: "Network", value: cluster },
    ],
  });

  const [uploadedUri] = await umi.uploader.upload([genericFile]);
  if (!uploadedUri) {
    throw new Error("Falha ao receber a URI da imagem do nó Irys.");
  }

  return {
    arweaveUri: normalizeClientArweaveUri(uploadedUri, cluster),
    gatewayUrl: uploadedUri,
    provider: "arweave-irys",
  };
}

/**
 * Uploads Metaplex-standard Token Metadata JSON directly to Arweave/Irys using the user's connected wallet.
 */
export async function uploadMetadataJsonWithUserWallet(params: {
  metadata: Record<string, unknown>;
  wallet: WalletContextState;
  cluster?: SolanaCluster;
}): Promise<{ metadataUri: string; gatewayUrl: string; provider: "arweave-irys" }> {
  const { metadata, wallet, cluster = "mainnet-beta" } = params;
  const umi = createUserWalletIrysUmi(wallet, cluster);
  const jsonBytes = new TextEncoder().encode(JSON.stringify(metadata));

  const genericJsonFile = createGenericFile(jsonBytes, "metadata.json", {
    contentType: "application/json",
    tags: [
      { name: "Content-Type", value: "application/json" },
      { name: "App-Name", value: "CreateTokenSolana" },
      { name: "Network", value: cluster },
    ],
  });

  const [uploadedUri] = await umi.uploader.upload([genericJsonFile]);
  if (!uploadedUri) {
    throw new Error("Falha ao receber a URI dos metadados JSON do nó Irys.");
  }

  return {
    metadataUri: normalizeClientArweaveUri(uploadedUri, cluster),
    gatewayUrl: uploadedUri,
    provider: "arweave-irys",
  };
}
