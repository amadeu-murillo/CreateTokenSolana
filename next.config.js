const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
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
    return [
      {
        source: "/affiliates",
        destination: "/afiliates",
      },
      {
        source: "/docs",
        destination: "/documentacao",
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
