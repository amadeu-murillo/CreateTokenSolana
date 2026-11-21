import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Single source of truth for /robots.txt (public/robots.txt removed to avoid conflicts).
 * IMPORTANT: Never disallow /_next/ so Googlebot can fetch JS/CSS chunks required to render pages.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/confirmation"],
      },
    ],
    host: SITE_URL,
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
