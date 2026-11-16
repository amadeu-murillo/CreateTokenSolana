import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { createSplTokenTransaction } from "@/lib/services/splTokenService";
import { createToken2022Transaction } from "@/lib/services/token2022Service";
import { uploadMetadataJsonToArweave } from "@/lib/services/arweaveService";
import {
  checkRateLimit,
  createTokenRequestSchema,
  getClientIp,
  sanitizeHttpsUrl,
} from "@/lib/security";

export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dgurmzcht",
  api_key: process.env.CLOUDINARY_API_KEY || "376481879818689",
  api_secret: process.env.CLOUDINARY_API_SECRET || "YfZk9mhp8eVA6xaZOZzHbF2H_qM",
  secure: true,
});

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`create-token:${clientIp}`, 12, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Please wait ${rateLimit.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const rawBody = await request.json();
    const parsed = createTokenRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || "Incomplete or invalid token data provided." },
        { status: 400 }
      );
    }

    const {
      name,
      symbol,
      imageUrl,
      decimals,
      supply,
      wallet,
      mintAuthority,
      freezeAuthority,
      isMetadataMutable,
      tokenStandard,
      useNativeMetadataExtension = false,
      storageProvider = "arweave",
      metadataUri: preUploadedMetadataUri,
      customCreator,
      transferFee,
      soulbound = false,
      permanentDelegate = false,
      vanitySecretKey,
      vanityCharLength = 0,
      jitoBundle,
      affiliate,
      description,
      website,
      twitter,
      instagram,
      network = "mainnet-beta",
    } = parsed.data;

    const safeImageUrl = sanitizeHttpsUrl(imageUrl);
    if (!safeImageUrl) {
      return NextResponse.json(
        { error: "Image URL must use the secure HTTPS or Arweave protocol." },
        { status: 400 }
      );
    }

    const attributes: Array<{ trait_type: string; value: string }> = [];
    const additionalMetadata: Array<[string, string]> = [];
    const safeWebsite = sanitizeHttpsUrl(website);

    if (description) {
      additionalMetadata.push(["description", description]);
    }
    if (safeWebsite) {
      attributes.push({ trait_type: "Website", value: safeWebsite });
      additionalMetadata.push(["website", safeWebsite]);
    }
    if (twitter) {
      const cleanHandle = twitter.replace(/^@/, "").replace(/[^a-zA-Z0-9_:/.-]/g, "");
      const twitterUrl = sanitizeHttpsUrl(twitter) || `https://x.com/${cleanHandle}`;
      attributes.push({ trait_type: "Twitter", value: twitterUrl });
      additionalMetadata.push(["twitter", twitterUrl]);
    }
    if (instagram) {
      const cleanHandle = instagram.replace(/^@/, "").replace(/[^a-zA-Z0-9_:/.-]/g, "");
      const instagramUrl =
        sanitizeHttpsUrl(instagram) || `https://instagram.com/${cleanHandle}`;
      attributes.push({ trait_type: "Instagram", value: instagramUrl });
      additionalMetadata.push(["instagram", instagramUrl]);
    }

    const isCustomCreatorEnabled = Boolean(customCreator?.enabled);
    const customCreatorName = customCreator?.name?.trim() || "CreateTokenSolana";
    const customCreatorSite =
      sanitizeHttpsUrl(customCreator?.website) || "https://www.createtokensol.store";

    if (isCustomCreatorEnabled) {
      attributes.push({ trait_type: "Creator", value: customCreatorName });
      additionalMetadata.push(["creator_name", customCreatorName]);
      additionalMetadata.push(["creator_site", customCreatorSite]);
    }

    const metadataJson = {
      name,
      symbol,
      image: safeImageUrl,
      description: description || `Token ${name} (${symbol}) on Solana`,
      attributes,
      creator: {
        name: isCustomCreatorEnabled ? customCreatorName : "CreateTokenSolana",
        site: isCustomCreatorEnabled ? customCreatorSite : "https://www.createtokensol.store",
      },
      properties: {
        files: [{ uri: safeImageUrl, type: "image/png" }],
        category: "image",
      },
      ...(safeWebsite && { external_url: safeWebsite }),
    };

    let finalMetadataUri = sanitizeHttpsUrl(preUploadedMetadataUri);

    if (!finalMetadataUri && storageProvider === "arweave" && process.env.IRYS_UPLOADER_PRIVATE_KEY) {
      try {
        const arweaveUpload = await uploadMetadataJsonToArweave({
          metadata: metadataJson,
          cluster: network,
        });
        finalMetadataUri = arweaveUpload.metadataUri;
      } catch (arweaveErr) {
        console.warn("Arweave metadata JSON upload fell back to HTTPS JSON storage:", arweaveErr);
      }
    }

    if (!finalMetadataUri) {
      const metadataBuffer = Buffer.from(JSON.stringify(metadataJson), "utf-8");
      const uploadResponse = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            folder: "token_metadata",
            public_id: `${symbol.toLowerCase()}_${Date.now()}.json`,
          },
          (error, result) => {
            if (error) return reject(new Error("Failed to upload metadata JSON to storage."));
            if (!result)
              return reject(new Error("Empty response from metadata storage service."));
            resolve(result);
          }
        );
        uploadStream.end(metadataBuffer);
      });
      finalMetadataUri = uploadResponse.secure_url;
    }

    const cleanSupplyStr = String(supply).replace(/,/g, "").trim();
    const hasJitoBundle = Boolean(jitoBundle?.enabled);

    const result =
      tokenStandard === "token-2022"
        ? await createToken2022Transaction({
            name,
            symbol,
            metadataUri: finalMetadataUri,
            decimals,
            supply: cleanSupplyStr,
            wallet,
            mintAuthority,
            freezeAuthority,
            isMetadataMutable,
            customCreatorInfo: isCustomCreatorEnabled,
            useNativeMetadataExtension,
            additionalMetadata,
            transferFee,
            soulbound,
            permanentDelegate,
            vanitySecretKey,
            vanityCharLength,
            hasJitoBundle,
            affiliate,
            network,
          })
        : await createSplTokenTransaction({
            name,
            symbol,
            metadataUri: finalMetadataUri,
            decimals,
            supply: cleanSupplyStr,
            wallet,
            mintAuthority,
            freezeAuthority,
            isMetadataMutable,
            customCreatorInfo: isCustomCreatorEnabled,
            vanitySecretKey,
            vanityCharLength,
            hasJitoBundle,
            affiliate,
            network,
          });

    return NextResponse.json({
      ...result,
      imageUrl: safeImageUrl,
      metadataUri: finalMetadataUri,
    });
  } catch (error) {
    console.error("Detailed error while creating token transaction:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Internal server error while creating the token transaction.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
