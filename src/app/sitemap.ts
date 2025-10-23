import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = 'https://www.createtoken.sbs';

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly', 
      priority: 1,
    },
    {
      url: `${siteUrl}/create`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/burn`,
      lastModified: new Date(),
      changeFrequency: 'monthly', 
      priority: 0.8,
    },
    {
      url: `${siteUrl}/airdrop`,
      lastModified: new Date(),
      changeFrequency: 'monthly', 
      priority: 0.8,
    },
    {
      url: `${siteUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'monthly', 
      priority: 0.8,
    },
     {
      url: `${siteUrl}/costs`,
      lastModified: new Date(),
      changeFrequency: 'yearly', 
      priority: 0.7,
    },
    // --- Páginas Adicionadas ---
    {
      url: `${siteUrl}/add-liquidity`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/afiliates`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/documentacao`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // --- Fim das Páginas Adicionadas ---
  ];
}