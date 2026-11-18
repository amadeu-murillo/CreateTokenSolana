import type { ReactNode } from "react";
import { buildRouteMetadata, MULTILINGUAL_ROUTE_SEO } from "@/lib/seo";

const seo = MULTILINGUAL_ROUTE_SEO["/reclaim"].en;

export const metadata = buildRouteMetadata({
  title: seo.title,
  description: seo.description,
  path: "/reclaim",
  keywords: seo.keywords,
});

export default function RouteLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
