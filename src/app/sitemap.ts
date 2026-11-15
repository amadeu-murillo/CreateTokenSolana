import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const BASE_URL = SITE_URL || "https://www.createtoken.sbs";

interface SitemapRouteConfig {
  path: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

const INDEXED_ROUTES: ReadonlyArray<SitemapRouteConfig> = [
  { path: "/", changeFrequency: "daily", priority: 1.0 },
  { path: "/create", changeFrequency: "daily", priority: 0.95 },
  { path: "/add-liquidity", changeFrequency: "weekly", priority: 0.9 },
  { path: "/dashboard", changeFrequency: "weekly", priority: 0.85 },
  { path: "/airdrop", changeFrequency: "weekly", priority: 0.85 },
  { path: "/burn", changeFrequency: "weekly", priority: 0.85 },
  { path: "/afiliates", changeFrequency: "monthly", priority: 0.8 },
  { path: "/documentacao", changeFrequency: "monthly", priority: 0.8 },
  { path: "/costs", changeFrequency: "monthly", priority: 0.75 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return INDEXED_ROUTES.map((route) => {
    const routeUrl = route.path === "/" ? BASE_URL : `${BASE_URL}${route.path}`;

    return {
      url: routeUrl,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: {
          en: `${routeUrl}?lang=en`,
          es: `${routeUrl}?lang=es`,
          ru: `${routeUrl}?lang=ru`,
          zh: `${routeUrl}?lang=zh`,
          "pt-BR": `${routeUrl}?lang=pt-BR`,
        },
      },
    };
  });
}