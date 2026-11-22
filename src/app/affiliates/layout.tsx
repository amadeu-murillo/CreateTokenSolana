import type { ReactNode } from "react";
import { buildRouteMetadata, MULTILINGUAL_ROUTE_SEO, SITE_URL } from "@/lib/seo";
import enDictionary from "@/i18n/locales/en";

const seo = MULTILINGUAL_ROUTE_SEO["/affiliates"].en;

export const metadata = buildRouteMetadata({
  title: seo.title,
  description: seo.description,
  path: "/affiliates",
  keywords: seo.keywords,
});

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: enDictionary.affiliatesPage.faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "CreateTokenSolana",
      item: SITE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Affiliates",
      item: `${SITE_URL}/affiliates`,
    },
  ],
};

export default function RouteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
