/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'i.imgur.com',
            },
            {
                protocol: 'https',
                hostname: 'raw.githubusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'fontezen.com.br',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
            {
                protocol: 'https',
                hostname: 't3.ftcdn.net', // Domínio adicionado
            },
            {
                protocol: 'http',
                hostname: 'localhost',
            },
        ],
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback.fs = false;
        }
        // Adiciona pacotes externos para evitar problemas de compilação no lado do servidor.
        if (isServer) {
            // CORREÇÃO: Usando o nome correto do pacote e adicionando '@coral-xyz/anchor'.
            config.externals.push('@meteora-ag/dlmm', 'bn.js', '@coral-xyz/anchor');
        }
        config.externals.push('pino-pretty', 'lokijs', 'encoding');
        return config;
    },
};

module.exports = nextConfig;

