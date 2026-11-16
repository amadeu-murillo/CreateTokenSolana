import { MetadataRoute } from "next";
import { SITE_URL, getLanguageAlternates } from "@/lib/seo";

const BASE_URL = SITE_URL || "https://www.createtokensol.store";

interface CanonicalRouteEntry {
  path: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

/**
 * Only 200 OK canonical indexable routes are included here (no /create redirect or
 * /affiliates /docs alias paths) so Google Search Console never reports redirect/duplicate errors.
 */
const CANONICAL_ROUTES: ReadonlyArray<CanonicalRouteEntry> = [
  { path: "/", changeFrequency: "daily", priority: 1.0 },
  { path: "/add-liquidity", changeFrequency: "weekly", priority: 0.95 },
  { path: "/burn", changeFrequency: "weekly", priority: 0.9 },
  { path: "/airdrop", changeFrequency: "weekly", priority: 0.9 },
  { path: "/dashboard", changeFrequency: "weekly", priority: 0.85 },
  { path: "/afiliates", changeFrequency: "monthly", priority: 0.85 },
  { path: "/costs", changeFrequency: "monthly", priority: 0.85 },
  { path: "/documentacao", changeFrequency: "monthly", priority: 0.8 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return CANONICAL_ROUTES.map((route) => {
    const routeUrl = route.path === "/" ? BASE_URL : `${BASE_URL}${route.path}`;

    return {
      url: routeUrl,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: getLanguageAlternates(routeUrl),
      },
    };
  });
}