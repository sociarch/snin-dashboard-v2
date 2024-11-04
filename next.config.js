/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    output: "standalone",
    // Add proper asset prefix if needed
    assetPrefix: process.env.NODE_ENV === "production" ? undefined : undefined,
    // Enable static file serving through next/static
    experimental: {
        appDir: true,
    },
    webpack: (config, { isServer }) => {
        // Add any necessary webpack configurations
        return config;
    },
    // Add these domains to the list of allowed domains for scripts
    scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://www.googletagmanager.com",
        "https://www.clarity.ms",
    ],
};

module.exports = nextConfig;
