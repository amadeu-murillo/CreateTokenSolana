const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  trailingSlash: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: [
      "@metaplex-foundation/umi-uploader-bundlr",
      "@irys/sdk",
      "arbundles",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    // Clean path-based localized URLs for multilingual SEO (/pt-br, /es, /ru, /zh)
    // while keeping a single App Router codebase and preserving the localized URL in the browser.
    const localePrefixes = ["pt-br", "pt", "es", "ru", "zh"];
    return localePrefixes.flatMap((prefix) => [
      {
        source: `/${prefix}`,
        destination: "/",
      },
      {
        source: `/${prefix}/:path*`,
        destination: "/:path*",
      },
    ]);
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "createtokensol.store",
          },
        ],
        destination: "https://www.createtokensol.store/:path*",
        permanent: true,
      },
      {
        source: "/afiliates",
        destination: "/affiliates",
        statusCode: 301,
      },
      {
        source: "/afiliados",
        destination: "/affiliates",
        statusCode: 301,
      },
      {
        source: "/:locale(pt-br|pt|es|ru|zh)/afiliates",
        destination: "/:locale/affiliates",
        statusCode: 301,
      },
      {
        source: "/:locale(pt-br|pt|es|ru|zh)/afiliados",
        destination: "/:locale/affiliates",
        statusCode: 301,
      },
      {
        source: "/docs",
        destination: "/documentacao",
        permanent: true,
      },
      {
        source: "/create",
        destination: "/",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
      {
        source: "/confirmation",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, follow",
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@/components/ui/Button": path.resolve(__dirname, "src/components/ui/button.tsx"),
      "@/components/ui/Input": path.resolve(__dirname, "src/components/ui/input.tsx"),
      "@/components/ui/Card": path.resolve(__dirname, "src/components/ui/card.tsx"),
      "@/components/ui/Label": path.resolve(__dirname, "src/components/ui/label.tsx"),
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    if (isServer) {
      config.externals.push("@meteora-ag/dlmm", "bn.js", "@coral-xyz/anchor");
    }
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

module.exports = nextConfig;
