import { NextRequest, NextResponse } from "next/server";
import { sanitizeHttpsUrl } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get("name")?.trim().slice(0, 32);
    const symbol = searchParams.get("symbol")?.trim().slice(0, 10);
    const imageUrl = sanitizeHttpsUrl(searchParams.get("imageUrl"));
    const description = searchParams.get("description")?.trim().slice(0, 500);
    const website = sanitizeHttpsUrl(searchParams.get("website"));
    const twitter = searchParams.get("twitter")?.trim().slice(0, 100);
    const instagram = searchParams.get("instagram")?.trim().slice(0, 100);

    if (!name || !symbol || !imageUrl) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid required metadata parameters: name, symbol, and imageUrl (HTTPS).",
        },
        { status: 400 }
      );
    }

    const attributes: Array<{ trait_type: string; value: string }> = [];
    if (website) {
      attributes.push({ trait_type: "Website", value: website });
    }
    if (twitter) {
      const cleanHandle = twitter.replace(/^@/, "").replace(/[^a-zA-Z0-9_:/.-]/g, "");
      const twitterUrl = sanitizeHttpsUrl(twitter) || `https://x.com/${cleanHandle}`;
      attributes.push({ trait_type: "Twitter", value: twitterUrl });
    }
    if (instagram) {
      const cleanHandle = instagram.replace(/^@/, "").replace(/[^a-zA-Z0-9_:/.-]/g, "");
      const instagramUrl =
        sanitizeHttpsUrl(instagram) || `https://instagram.com/${cleanHandle}`;
      attributes.push({ trait_type: "Instagram", value: instagramUrl });
    }

    const metadata = {
      name,
      symbol,
      image: imageUrl,
      description: description || `Token ${name} - Symbol ${symbol}`,
      attributes,
      properties: {
        files: [{ uri: imageUrl, type: "image/png" }],
        category: "image",
      },
      ...(website && { external_url: website }),
    };

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Error generating metadata:", error);
    return NextResponse.json({ error: "Failed to generate metadata." }, { status: 500 });
  }
}
