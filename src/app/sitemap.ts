import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const BASE_URL = SITE_URL || "https://www.createtokensol.store";
const LAST_MODIFIED = new Date("2026-11-21T00:00:00.000Z");

interface CanonicalRouteEntry {
  path: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

/**
 * Only 200 OK canonical indexable routes are included here (no /create, /affiliates, /docs
 * redirects and no ?lang= query-string alternates that conflict with self-referencing canonicals).
 */
const CANONICAL_ROUTES: ReadonlyArray<CanonicalRouteEntry> = [
  { path: "/", changeFrequency: "daily", priority: 1.0 },
  { path: "/reclaim", changeFrequency: "weekly", priority: 0.90 },
  { path: "/volume-bot", changeFrequency: "weekly", priority: 0.90 },
  { path: "/vesting", changeFrequency: "weekly", priority: 0.90 },
  { path: "/add-liquidity", changeFrequency: "weekly", priority: 0.95 },
  { path: "/burn", changeFrequency: "weekly", priority: 0.90 },
  { path: "/airdrop", changeFrequency: "weekly", priority: 0.90 },
  { path: "/dashboard", changeFrequency: "weekly", priority: 0.85 },
  { path: "/afiliates", changeFrequency: "monthly", priority: 0.85 },
  { path: "/costs", changeFrequency: "monthly", priority: 0.85 },
  { path: "/documentacao", changeFrequency: "monthly", priority: 0.80 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return CANONICAL_ROUTES.map((route) => {
    const routeUrl = route.path === "/" ? BASE_URL : `${BASE_URL}${route.path}`;

    return {
      url: routeUrl,
      lastModified: LAST_MODIFIED,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    };
  });
}