import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
  Umi,
} from "@metaplex-foundation/umi";
import { bundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr";
import { SolanaCluster, getRpcEndpoint } from "@/lib/constants";

export const IRYS_NODE_MAINNET = "https://uploader.irys.xyz";
export const IRYS_NODE_DEVNET = "https://devnet.irys.xyz";

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const umiCache = new Map<string, Umi>();

function decodeBase58(input: string): Uint8Array {
  if (!input) return new Uint8Array(0);
  const bytes: number[] = [0];
  for (let i = 0; i < input.length; i++) {
    const charIndex = BASE58_ALPHABET.indexOf(input[i]);
    if (charIndex === -1) {
      throw new Error(`Invalid base58 character: ${input[i]}`);
    }
    let carry = charIndex;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let k = 0; k < input.length && input[k] === "1"; k++) {
    bytes.push(0);
  }
  return new Uint8Array(bytes.reverse());
}

export function getIrysNodeAddress(cluster: SolanaCluster = "mainnet-beta"): string {
  return cluster === "devnet" ? IRYS_NODE_DEVNET : IRYS_NODE_MAINNET;
}

/**
 * Normalizes an Irys/Bundlr gateway URI to a canonical permanent Arweave URI.
 */
export function normalizeArweaveUri(
  uri: string,
  cluster: SolanaCluster = "mainnet-beta"
): string {
  if (!uri) return uri;
  const match = uri.match(/\/([a-zA-Z0-9_-]{43,44})(?:\?.*)?$/);
  if (match && match[1]) {
    // Devnet uploads live on devnet.irys.xyz and do NOT propagate to arweave.net.
    // Mainnet uploads are immediately available on gateway.irys.xyz (0s propagation delay).
    return cluster === "devnet"
      ? `https://devnet.irys.xyz/${match[1]}`
      : `https://gateway.irys.xyz/${match[1]}`;
  }
  return uri;
}

/**
 * Creates (or reuses cached) server-side Umi instance configured with the Irys/Bundlr uploader.
 * Declared in next.config.js -> experimental.serverComponentsExternalPackages so Vercel
 * traces @metaplex-foundation/umi-uploader-bundlr into the serverless function bundle.
 */
export function getServerArweaveUmi(cluster: SolanaCluster = "mainnet-beta"): Umi {
  const rpcEndpoint = getRpcEndpoint(cluster);
  const irysAddress = getIrysNodeAddress(cluster);
  const secretKeyBase58 = process.env.IRYS_UPLOADER_PRIVATE_KEY?.trim() || "";
  const cacheKey = `${cluster}:${rpcEndpoint}:${secretKeyBase58.slice(0, 8)}`;

  const cached = umiCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const umi = createUmi(rpcEndpoint);

  umi.use(
    bundlrUploader({
      address: irysAddress,
      providerUrl: rpcEndpoint,
      timeout: 30_000,
    })
  );

  if (secretKeyBase58) {
    const secretKeyBytes = decodeBase58(secretKeyBase58);
    const umiKeypair = umi.eddsa.createKeypairFromSecretKey(secretKeyBytes);
    const signer = createSignerFromKeypair(umi, umiKeypair);
    umi.use(signerIdentity(signer));
  } else {
    const generatedKeypair = umi.eddsa.generateKeypair();
    const signer = createSignerFromKeypair(umi, generatedKeypair);
    umi.use(signerIdentity(signer));
  }

  umiCache.set(cacheKey, umi);
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

  const canonicalUri = normalizeArweaveUri(uploadedUri, cluster);
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

  const canonicalUri = normalizeArweaveUri(uploadedUri, cluster);
  return {
    metadataUri: canonicalUri,
    gatewayUrl: uploadedUri,
    provider: "arweave-irys",
  };
}
