import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { NextResponse } from "next/server";
import { SolanaCluster } from "@/lib/constants";
import { checkRateLimit, getClientIp, validateImageBuffer } from "@/lib/security";
import { uploadImageToArweave } from "@/lib/services/arweaveService";

export const dynamic = "force-dynamic";


function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }
  return { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true };
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`upload-image:${clientIp}`, 20, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Upload limit exceeded. Please wait ${rateLimit.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const rawNetwork = formData.get("network");
    const preferredStorage = (formData.get("storage") as string) || "arweave";
    const cluster: SolanaCluster = rawNetwork === "devnet" ? "devnet" : "mainnet-beta";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No image file uploaded." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const validation = validateImageBuffer(buffer, file.type);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 1. Try Arweave/Irys ONLY when a funded server IRYS_UPLOADER_PRIVATE_KEY is configured
    if (preferredStorage === "arweave" && process.env.IRYS_UPLOADER_PRIVATE_KEY) {
      try {
        const arweaveResult = await uploadImageToArweave({
          buffer,
          fileName: file.name || "token-logo.png",
          contentType: file.type || "image/png",
          cluster,
        });

        return NextResponse.json({
          secure_url: arweaveResult.arweaveUri,
          gateway_url: arweaveResult.gatewayUrl,
          provider: "arweave-irys",
          network: cluster,
        });
      } catch (arweaveErr) {
        console.warn("Arweave server upload fell back to guaranteed HTTPS CDN:", arweaveErr);
      }
    }

    // 2. HTTPS Image Hosting (Cloudinary) — requires server-side env vars
    const cloudConfig = getCloudinaryConfig();
    if (!cloudConfig) {
      return NextResponse.json(
        {
          error:
            "Image storage is not configured on the server (set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET or IRYS_UPLOADER_PRIVATE_KEY).",
        },
        { status: 500 }
      );
    }
    cloudinary.config(cloudConfig);
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "token_images",
            resource_type: "image",
            allowed_formats: ["png", "jpg", "jpeg", "webp", "gif"],
            transformation: [{ width: 512, height: 512, crop: "limit" }],
          },
          (error, uploadResult) => {
            if (error || !uploadResult) {
              reject(error || new Error("Upload result empty"));
              return;
            }
            resolve(uploadResult);
          }
        )
        .end(buffer);
    });

    return NextResponse.json({
      secure_url: result.secure_url,
      provider: "cloudinary",
      network: cluster,
    });
  } catch (error) {
    console.error("Error in /api/upload-image endpoint:", error);
    const message = error instanceof Error ? error.message : "Failed to upload image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
