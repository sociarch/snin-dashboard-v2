/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['www.clarity.ms'],
    },
    output: 'standalone',
    poweredByHeader: false,
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Client-side configuration
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: require.resolve('crypto-browserify'),
                stream: require.resolve('stream-browserify'),
                url: require.resolve('url'),
                zlib: require.resolve('browserify-zlib'),
                http: require.resolve('stream-http'),
                https: require.resolve('https-browserify'),
                assert: require.resolve('assert'),
                os: require.resolve('os-browserify'),
                path: require.resolve('path-browserify'),
                util: require.resolve('util/'),
                buffer: require.resolve('buffer/')
            };
        }

        // Add aliases for both server and client
        config.resolve.alias = {
            ...config.resolve.alias,
            stream: 'stream-browserify',
            crypto: 'crypto-browserify'
        };

        return config;
    },
    experimental: {
        // optimizeCss: true,
        scrollRestoration: true
    }
};

module.exports = nextConfig;
