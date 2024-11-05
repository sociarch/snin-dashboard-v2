/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['localhost'],
    },
    experimental: {
        // Remove appDir since it's now default in Next.js 13+
    },
    // Remove swcMinify as it's now default
    // Remove scriptSrc if not needed
}

module.exports = nextConfig
