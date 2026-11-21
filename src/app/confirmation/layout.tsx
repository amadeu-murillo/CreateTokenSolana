import type { ReactNode } from "react";
import { buildRouteMetadata, MULTILINGUAL_ROUTE_SEO } from "@/lib/seo";

const seo = MULTILINGUAL_ROUTE_SEO["/"].en;

export const metadata = buildRouteMetadata({
  title: "Transaction Confirmation — CreateTokenSolana",
  description: seo.description,
  path: "/confirmation",
  noIndex: true,
  keywords: seo.keywords,
});

export default function RouteLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
