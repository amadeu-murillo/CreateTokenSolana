import type { ReactNode } from "react";
import { buildRouteMetadata, MULTILINGUAL_ROUTE_SEO } from "@/lib/seo";

const seo = MULTILINGUAL_ROUTE_SEO["/volume-bot"].en;

export const metadata = buildRouteMetadata({
  title: seo.title,
  description: seo.description,
  path: "/volume-bot",
  keywords: seo.keywords,
});

export default function RouteLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
