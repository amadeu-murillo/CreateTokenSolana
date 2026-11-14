const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    eslint: {
        // Prevents ESLint config differences from aborting production builds on Vercel
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: false,
    },
    experimental: {
        // In Next.js 14.2.x, outputFileTracingRoot lives under experimental
        outputFileTracingRoot: path.join(__dirname),
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'arweave.net',
            },
            {
                protocol: 'https',
                hostname: '**.irys.xyz',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
            {
                protocol: 'https',
                hostname: 'raw.githubusercontent.com',
            },
            {
                protocol: 'https',
                hostname: '**.ipfs.nftstorage.link',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
        ],
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin-allow-popups',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
                    },
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on',
                    },
                ],
            },
        ];
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }
        if (isServer) {
            config.externals.push('@meteora-ag/dlmm', 'bn.js', '@coral-xyz/anchor');
        }
        config.externals.push('pino-pretty', 'lokijs', 'encoding');
        return config;
    },
};

module.exports = nextConfig;
