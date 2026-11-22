import { NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

const ALLOWED_UPSTREAMS: Record<string, string> = {
  mainnet: "https://uploader.irys.xyz",
  devnet: "https://devnet.irys.xyz",
};

const FORWARDED_REQUEST_HEADERS = [
  "content-type",
  "accept",
  "x-chunking-version",
  "x-currency",
];

async function proxyToIrys(
  request: Request,
  context: { params: { cluster: string; path: string[] } }
) {
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimitAsync(`irys-proxy:${clientIp}`, 60, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Please wait ${rateLimit.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const upstreamBase = ALLOWED_UPSTREAMS[context.params.cluster];
  if (!upstreamBase) {
    return NextResponse.json({ error: "Unsupported Irys cluster." }, { status: 400 });
  }

  const subPath = (context.params.path || []).join("/");
  // Block path traversal attempts
  if (!subPath || subPath.includes("..")) {
    return NextResponse.json({ error: "Invalid Irys path." }, { status: 400 });
  }

  const incomingUrl = new URL(request.url);
  const targetUrl = `${upstreamBase}/${subPath}${incomingUrl.search}`;

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const init: RequestInit = {
      method: request.method,
      headers,
      cache: "no-store",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      const bodyBuffer = await request.arrayBuffer();
      if (bodyBuffer.byteLength > 6 * 1024 * 1024) {
        return NextResponse.json({ error: "Payload too large (max 6 MB)." }, { status: 413 });
      }
      init.body = bodyBuffer;
    }

    const upstreamRes = await fetch(targetUrl, init);
    const resBuffer = await upstreamRes.arrayBuffer();
    const resHeaders = new Headers();
    const contentType = upstreamRes.headers.get("content-type");
    if (contentType) resHeaders.set("content-type", contentType);

    return new NextResponse(resBuffer, {
      status: upstreamRes.status,
      headers: resHeaders,
    });
  } catch (error) {
    console.error("Irys proxy request failed:", error);
    return NextResponse.json(
      { error: "Failed to reach Irys upstream node." },
      { status: 502 }
    );
  }
}

export async function GET(
  request: Request,
  context: { params: { cluster: string; path: string[] } }
) {
  return proxyToIrys(request, context);
}

export async function POST(
  request: Request,
  context: { params: { cluster: string; path: string[] } }
) {
  return proxyToIrys(request, context);
}
