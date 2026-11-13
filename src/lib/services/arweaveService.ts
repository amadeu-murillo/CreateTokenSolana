import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { bundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr";
import bs58 from "bs58";
import { SolanaCluster, getRpcEndpoint } from "@/lib/constants";

export const IRYS_NODE_MAINNET = "https://node1.irys.xyz";
export const IRYS_NODE_DEVNET = "https://devnet.irys.xyz";

export function getIrysNodeAddress(cluster: SolanaCluster = "mainnet-beta"): string {
  return cluster === "devnet" ? IRYS_NODE_DEVNET : IRYS_NODE_MAINNET;
}

/**
 * Normalizes an Irys/Bundlr gateway URI to a canonical permanent Arweave URI.
 */
export function normalizeArweaveUri(uri: string): string {
  if (!uri) return uri;
  // Convert https://arweave.net/<txId> or https://node1.irys.xyz/<txId> or https://devnet.irys.xyz/<txId>
  const match = uri.match(/\/([a-zA-Z0-9_-]{43,44})(?:\?.*)?$/);
  if (match && match[1]) {
    return `https://arweave.net/${match[1]}`;
  }
  return uri;
}

/**
 * Creates a server-side Umi instance configured with the Irys/Bundlr Arweave uploader
 * for either Mainnet-Beta or Devnet.
 */
export function getServerArweaveUmi(cluster: SolanaCluster = "mainnet-beta") {
  const rpcEndpoint = getRpcEndpoint(cluster);
  const irysAddress = getIrysNodeAddress(cluster);

  const umi = createUmi(rpcEndpoint).use(
    bundlrUploader({
      address: irysAddress,
      providerUrl: rpcEndpoint,
      timeout: 60_000,
    })
  );

  const secretKeyBase58 = process.env.IRYS_UPLOADER_PRIVATE_KEY;
  if (secretKeyBase58) {
    const secretKeyBytes = bs58.decode(secretKeyBase58.trim());
    const umiKeypair = umi.eddsa.createKeypairFromSecretKey(secretKeyBytes);
    const signer = createSignerFromKeypair(umi, umiKeypair);
    umi.use(signerIdentity(signer));
  } else {
    const generatedKeypair = umi.eddsa.generateKeypair();
    const signer = createSignerFromKeypair(umi, generatedKeypair);
    umi.use(signerIdentity(signer));
  }

  return umi;
}

/**
 * Uploads an image buffer directly to the Arweave blockchain via Irys/Bundlr.
 */
export async function uploadImageToArweave(params: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  cluster?: SolanaCluster;
}): Promise<{ arweaveUri: string; gatewayUrl: string; provider: "arweave-irys" }> {
  const { buffer, fileName, contentType, cluster = "mainnet-beta" } = params;
  const umi = getServerArweaveUmi(cluster);

  const genericFile = createGenericFile(new Uint8Array(buffer), fileName, {
    contentType,
    tags: [
      { name: "Content-Type", value: contentType },
      { name: "App-Name", value: "CreateTokenSolana" },
      { name: "Network", value: cluster },
    ],
  });

  const [uploadedUri] = await umi.uploader.upload([genericFile]);
  if (!uploadedUri) {
    throw new Error("Failed to receive transaction URI from Irys/Arweave node.");
  }

  const canonicalUri = normalizeArweaveUri(uploadedUri);
  return {
    arweaveUri: canonicalUri,
    gatewayUrl: uploadedUri,
    provider: "arweave-irys",
  };
}

/**
 * Uploads a Metaplex-standard Token Metadata JSON object directly to the Arweave blockchain via Irys/Bundlr.
 */
export async function uploadMetadataJsonToArweave(params: {
  metadata: Record<string, unknown>;
  cluster?: SolanaCluster;
}): Promise<{ metadataUri: string; gatewayUrl: string; provider: "arweave-irys" }> {
  const { metadata, cluster = "mainnet-beta" } = params;
  const umi = getServerArweaveUmi(cluster);

  const jsonBytes = Buffer.from(JSON.stringify(metadata), "utf-8");
  const genericJsonFile = createGenericFile(new Uint8Array(jsonBytes), "metadata.json", {
    contentType: "application/json",
    tags: [
      { name: "Content-Type", value: "application/json" },
      { name: "App-Name", value: "CreateTokenSolana" },
      { name: "Network", value: cluster },
    ],
  });

  const [uploadedUri] = await umi.uploader.upload([genericJsonFile]);
  if (!uploadedUri) {
    throw new Error("Failed to upload metadata JSON to Arweave via Irys.");
  }

  const canonicalUri = normalizeArweaveUri(uploadedUri);
  return {
    metadataUri: canonicalUri,
    gatewayUrl: uploadedUri,
    provider: "arweave-irys",
  };
}
