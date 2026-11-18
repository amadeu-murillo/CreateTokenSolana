import { Connection, PublicKey } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getMint,
  getTokenMetadata as getSplToken2022Metadata,
} from "@solana/spl-token";

export const METAPLEX_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export interface OnChainTokenMetadataResult {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  image?: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  decimals: number;
  supplyRaw: string;
  supplyUi: number;
  standard: "SPL" | "Token-2022";
  programId: string;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
  isMutable: boolean;
  rugCheckScore: number;
  metadataSource: "token-2022-tlv" | "metaplex-pda" | "fallback";
}

/**
 * Decodes Token-2022 TokenMetadata TLV extension directly from mintAccountInfo.data buffer.
 * Token-2022 TLV entries begin at offset 166 (base mint 82 bytes + padding 83 bytes + AccountType=1 byte).
 * ExtensionType.TokenMetadata = 19 (u16 LE).
 */
export function decodeToken2022TlvMetadataBuffer(
  data: Buffer | Uint8Array
): {
  name: string;
  symbol: string;
  uri: string;
  updateAuthority: string | null;
  additionalMetadata: Record<string, string>;
} | null {
  try {
    const buf = Buffer.from(data);
    if (buf.length <= 170) return null;

    let offset = 166;
    while (offset + 4 <= buf.length) {
      const extType = buf.readUInt16LE(offset);
      const extLen = buf.readUInt16LE(offset + 2);
      offset += 4;

      if (extType === 0 && extLen === 0) break;
      if (offset + extLen > buf.length) break;

      // ExtensionType.TokenMetadata === 19
      if (extType === 19 && extLen >= 76) {
        const slice = buf.subarray(offset, offset + extLen);
        let p = 0;

        const updateAuthBytes = slice.subarray(p, p + 32);
        const isAllZero = updateAuthBytes.every((b) => b === 0);
        const updateAuthority = isAllZero ? null : new PublicKey(updateAuthBytes).toBase58();
        p += 32;

        // skip mint (32 bytes)
        p += 32;

        if (p + 4 > slice.length) break;
        const nameLen = slice.readUInt32LE(p);
        p += 4;
        if (nameLen > 256 || p + nameLen > slice.length) break;
        const name = slice
          .subarray(p, p + nameLen)
          .toString("utf8")
          .replace(/\0/g, "")
          .trim();
        p += nameLen;

        if (p + 4 > slice.length) break;
        const symbolLen = slice.readUInt32LE(p);
        p += 4;
        if (symbolLen > 128 || p + symbolLen > slice.length) break;
        const symbol = slice
          .subarray(p, p + symbolLen)
          .toString("utf8")
          .replace(/\0/g, "")
          .trim();
        p += symbolLen;

        if (p + 4 > slice.length) break;
        const uriLen = slice.readUInt32LE(p);
        p += 4;
        if (uriLen > 1024 || p + uriLen > slice.length) break;
        const uri = slice
          .subarray(p, p + uriLen)
          .toString("utf8")
          .replace(/\0/g, "")
          .trim();
        p += uriLen;

        const additionalMetadata: Record<string, string> = {};
        if (p + 4 <= slice.length) {
          const mapCount = slice.readUInt32LE(p);
          p += 4;
          for (let i = 0; i < Math.min(mapCount, 32); i++) {
            if (p + 4 > slice.length) break;
            const kLen = slice.readUInt32LE(p);
            p += 4;
            if (kLen > 256 || p + kLen > slice.length) break;
            const k = slice.subarray(p, p + kLen).toString("utf8").replace(/\0/g, "").trim();
            p += kLen;

            if (p + 4 > slice.length) break;
            const vLen = slice.readUInt32LE(p);
            p += 4;
            if (vLen > 1024 || p + vLen > slice.length) break;
            const v = slice.subarray(p, p + vLen).toString("utf8").replace(/\0/g, "").trim();
            p += vLen;

            if (k) additionalMetadata[k.toLowerCase()] = v;
          }
        }

        if (name || symbol) {
          return { name, symbol, uri, updateAuthority, additionalMetadata };
        }
      }

      offset += extLen;
    }
  } catch {
    // Ignore decode errors and fall back
  }
  return null;
}

/**
 * Decodes Metaplex Token Metadata v1 PDA account data buffer.
 */
export function decodeMetaplexPdaAccount(
  data: Buffer | Uint8Array
): {
  name: string;
  symbol: string;
  uri: string;
  isMutable: boolean;
} | null {
  try {
    const buf = Buffer.from(data);
    // key (1) + updateAuthority (32) + mint (32) = 65
    if (buf.length < 77) return null;
    let offset = 65;

    const nameLen = buf.readUInt32LE(offset);
    offset += 4;
    if (nameLen > 256 || offset + nameLen > buf.length) return null;
    const name = buf
      .subarray(offset, offset + nameLen)
      .toString("utf8")
      .replace(/\0/g, "")
      .trim();
    offset += nameLen;

    const symbolLen = buf.readUInt32LE(offset);
    offset += 4;
    if (symbolLen > 128 || offset + symbolLen > buf.length) return null;
    const symbol = buf
      .subarray(offset, offset + symbolLen)
      .toString("utf8")
      .replace(/\0/g, "")
      .trim();
    offset += symbolLen;

    const uriLen = buf.readUInt32LE(offset);
    offset += 4;
    if (uriLen > 1024 || offset + uriLen > buf.length) return null;
    const uri = buf
      .subarray(offset, offset + uriLen)
      .toString("utf8")
      .replace(/\0/g, "")
      .trim();
    offset += uriLen;

    // sellerFeeBasisPoints (2) + creators Option<Vec<Creator>> + primarySaleHappened (1) + isMutable (1)
    let isMutable = false;
    try {
      offset += 2; // sellerFeeBasisPoints
      const hasCreators = buf[offset] === 1;
      offset += 1;
      if (hasCreators) {
        const creatorsLen = buf.readUInt32LE(offset);
        offset += 4 + creatorsLen * 34; // address(32) + verified(1) + share(1)
      }
      offset += 1; // primarySaleHappened
      if (offset < buf.length) {
        isMutable = buf[offset] === 1;
      }
    } catch {
      isMutable = false;
    }

    if (!name && !symbol) return null;
    return { name, symbol, uri, isMutable };
  } catch {
    return null;
  }
}

function normalizeMetadataUri(rawUri?: string | null): string {
  if (!rawUri) return "";
  const cleaned = rawUri.replace(/\0/g, "").trim();
  if (cleaned.startsWith("ar://")) {
    return `https://arweave.net/${cleaned.slice(5)}`;
  }
  if (cleaned.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${cleaned.slice(7)}`;
  }
  return cleaned;
}

async function fetchOffChainJsonMetadata(
  uri: string,
  timeoutMs = 5000
): Promise<{
  image?: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
}> {
  const normalized = normalizeMetadataUri(uri);
  if (!normalized || (!normalized.startsWith("https://") && !normalized.startsWith("http://"))) {
    return {};
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(normalized, { signal: controller.signal });
    if (!res.ok) return {};
    const json = await res.json();

    const rawImage = typeof json?.image === "string" ? normalizeMetadataUri(json.image) : undefined;
    const description = typeof json?.description === "string" ? json.description : undefined;
    let website =
      typeof json?.external_url === "string"
        ? json.external_url
        : typeof json?.website === "string"
        ? json.website
        : typeof json?.extensions?.website === "string"
        ? json.extensions.website
        : undefined;
    let twitter =
      typeof json?.twitter === "string"
        ? json.twitter
        : typeof json?.extensions?.twitter === "string"
        ? json.extensions.twitter
        : undefined;
    let telegram =
      typeof json?.telegram === "string"
        ? json.telegram
        : typeof json?.extensions?.telegram === "string"
        ? json.extensions.telegram
        : undefined;

    if (Array.isArray(json?.attributes)) {
      for (const attr of json.attributes) {
        const key = String(attr?.trait_type || "").toLowerCase();
        const val = String(attr?.value || "").trim();
        if (!val) continue;
        if (key === "website" && !website) website = val;
        if ((key === "twitter" || key === "x") && !twitter) twitter = val;
        if (key === "telegram" && !telegram) telegram = val;
      }
    }

    return {
      image: rawImage,
      description,
      website,
      twitter,
      telegram,
    };
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches real on-chain token metadata for any SPL or Token-2022 mint:
 * 1. Inspects mint account info and determines SPL vs Token-2022.
 * 2. If Token-2022, first decodes TLV TokenMetadata directly from mintAccountInfo.data (and falls back to getSplToken2022Metadata).
 * 3. Otherwise (or if using Metaplex PDA), derives Metaplex Metadata PDA and decodes name, symbol, and uri (stripping \0 bytes).
 * 4. Fetches off-chain JSON metadata from Arweave/Irys/IPFS/Cloudinary with a 5-second timeout to extract image, description, website, twitter, and telegram.
 */
export async function fetchOnChainTokenMetadata(
  connection: Connection,
  mintPubkey: PublicKey
): Promise<OnChainTokenMetadataResult> {
  const mintAccountInfo = await connection.getAccountInfo(mintPubkey, "confirmed");
  if (!mintAccountInfo) {
    throw new Error(`Token Mint (${mintPubkey.toBase58()}) not found on-chain.`);
  }

  const isToken2022 = mintAccountInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
  const programId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  const mintData = await getMint(connection, mintPubkey, "confirmed", programId);

  const mintAuthorityRevoked = !mintData.mintAuthority;
  const freezeAuthorityRevoked = !mintData.freezeAuthority;
  const supplyUi = Number(mintData.supply) / Math.pow(10, mintData.decimals);

  let name = "";
  let symbol = "";
  let uri = "";
  let isMutable = false;
  let metadataSource: "token-2022-tlv" | "metaplex-pda" | "fallback" = "fallback";
  let extraFields: Record<string, string> = {};

  // Step A: If Token-2022, decode TLV TokenMetadata extension directly from mintAccountInfo.data buffer
  if (isToken2022) {
    const tlvDecoded = decodeToken2022TlvMetadataBuffer(mintAccountInfo.data);
    if (tlvDecoded && (tlvDecoded.name || tlvDecoded.symbol)) {
      name = tlvDecoded.name;
      symbol = tlvDecoded.symbol;
      uri = tlvDecoded.uri;
      isMutable = Boolean(tlvDecoded.updateAuthority);
      metadataSource = "token-2022-tlv";
      extraFields = tlvDecoded.additionalMetadata;
    } else {
      try {
        const spl2022Meta = await getSplToken2022Metadata(
          connection,
          mintPubkey,
          "confirmed",
          TOKEN_2022_PROGRAM_ID
        );
        if (spl2022Meta && (spl2022Meta.name || spl2022Meta.symbol)) {
          name = spl2022Meta.name.replace(/\0/g, "").trim();
          symbol = spl2022Meta.symbol.replace(/\0/g, "").trim();
          uri = (spl2022Meta.uri || "").replace(/\0/g, "").trim();
          isMutable = Boolean(spl2022Meta.updateAuthority);
          metadataSource = "token-2022-tlv";
          if (Array.isArray(spl2022Meta.additionalMetadata)) {
            for (const [k, v] of spl2022Meta.additionalMetadata) {
              if (k && v) extraFields[k.toLowerCase()] = v;
            }
          }
        }
      } catch {
        // Fallback to Metaplex PDA below
      }
    }
  }

  // Step B: Derive and read Metaplex Metadata PDA if not found in Token-2022 TLV
  if (!name && !symbol) {
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METAPLEX_PROGRAM_ID.toBuffer(),
        mintPubkey.toBuffer(),
      ],
      METAPLEX_PROGRAM_ID
    );

    const pdaInfo = await connection.getAccountInfo(metadataPda, "confirmed");
    if (pdaInfo?.data) {
      const parsedPda = decodeMetaplexPdaAccount(pdaInfo.data);
      if (parsedPda) {
        name = parsedPda.name;
        symbol = parsedPda.symbol;
        uri = parsedPda.uri;
        isMutable = parsedPda.isMutable;
        metadataSource = "metaplex-pda";
      }
    }
  }

  // Step C: Fetch off-chain JSON metadata (5 second timeout)
  const offChain = uri ? await fetchOffChainJsonMetadata(uri, 5000) : {};

  const finalName =
    name || `Solana Asset (${mintPubkey.toBase58().slice(0, 4)}...${mintPubkey.toBase58().slice(-4)})`;
  const finalSymbol = symbol || mintPubkey.toBase58().slice(0, 4).toUpperCase();
  const rugCheckScore =
    (freezeAuthorityRevoked ? 50 : 0) +
    (mintAuthorityRevoked ? 35 : 0) +
    (!isMutable ? 15 : 0);

  return {
    mint: mintPubkey.toBase58(),
    name: finalName,
    symbol: finalSymbol,
    uri: normalizeMetadataUri(uri),
    image: offChain.image,
    description: offChain.description || extraFields.description,
    website: offChain.website || extraFields.website,
    twitter: offChain.twitter || extraFields.twitter,
    telegram: offChain.telegram || extraFields.telegram,
    decimals: mintData.decimals,
    supplyRaw: mintData.supply.toString(),
    supplyUi,
    standard: isToken2022 ? "Token-2022" : "SPL",
    programId: programId.toBase58(),
    mintAuthority: mintData.mintAuthority ? mintData.mintAuthority.toBase58() : null,
    freezeAuthority: mintData.freezeAuthority ? mintData.freezeAuthority.toBase58() : null,
    mintAuthorityRevoked,
    freezeAuthorityRevoked,
    isMutable,
    rugCheckScore,
    metadataSource,
  };
}
