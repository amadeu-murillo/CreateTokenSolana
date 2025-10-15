import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = 'https://create-token-solana.vercel.app';

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly', // Mais realista que 'yearly'
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
      changeFrequency: 'monthly', // Alinhado com outras ferramentas
      priority: 0.8,
    },
    {
      url: `${siteUrl}/airdrop`,
      lastModified: new Date(),
      changeFrequency: 'monthly', // Alinhado com outras ferramentas
      priority: 0.8,
    },
    {
      url: `${siteUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'monthly', // Alinhado com outras ferramentas
      priority: 0.8,
    },
     {
      url: `${siteUrl}/costs`,
      lastModified: new Date(),
      changeFrequency: 'yearly', // Página raramente atualizada
      priority: 0.7,
    },
  ];
}