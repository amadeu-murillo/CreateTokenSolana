import { NextResponse } from "next/server";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { z } from "zod";
import { db, inMemoryAffiliateEventsStore, isFirebaseConfigured } from "@/lib/firebase";
import { checkRateLimit, getClientIp, sanitizeErrorMessage } from "@/lib/security";
import { isEligibleAffiliateRef } from "@/lib/affiliateAttribution";

export const dynamic = "force-dynamic";

const affiliateEventSchema = z.object({
  affiliateWallet: z.string().min(32).max(44),
  eventType: z.enum(["click", "wallet_connect"]),
  sessionHash: z.string().min(8).max(80),
  path: z.string().max(120).optional().default("/"),
});

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`affiliate-events:${clientIp}`, 40, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Retry in ${rateLimit.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = affiliateEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid event payload." }, { status: 400 });
    }

    const { affiliateWallet, eventType, sessionHash, path } = parsed.data;
    if (!isEligibleAffiliateRef(affiliateWallet)) {
      return NextResponse.json({ error: "Invalid affiliate wallet." }, { status: 400 });
    }

    const safeSession = sessionHash.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
    const eventId = `${affiliateWallet}_${eventType}_${safeSession}`;
    const safePath = path.startsWith("/") ? path.slice(0, 120) : "/";
    const nowMs = Date.now();

    inMemoryAffiliateEventsStore.set(eventId, {
      id: eventId,
      affiliateWallet,
      eventType,
      sessionHash: safeSession,
      path: safePath,
      createdAtMs: nowMs,
    });

    if (isFirebaseConfigured && db) {
      const eventRef = doc(db, "affiliate_events", eventId);
      await setDoc(
        eventRef,
        {
          affiliateWallet,
          eventType,
          sessionHash: safeSession,
          path: safePath,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error, "Failed to record affiliate event.") },
      { status: 500 }
    );
  }
}
