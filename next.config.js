/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['www.clarity.ms'],
    },
    output: 'standalone',
    poweredByHeader: false,
    reactStrictMode: true,
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
    webpack: (config, { isServer }) => {
        return config;
    },
}

module.exports = nextConfig
