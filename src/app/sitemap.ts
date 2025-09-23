import { MetadataRoute } from 'next';

// Esta função gera o sitemap.xml dinamicamente.
// O Next.js irá detectar este arquivo e criar a rota correspondente.
export default function sitemap(): MetadataRoute.Sitemap {
  // Use a variável de ambiente da Vercel para o domínio de produção,
  // ou localhost para desenvolvimento.
  const siteUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${siteUrl}/create`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/costs`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];
}
