/**
 * @type {import('next').NextConfig}
 */

const nextConfig = {
    trailingSlash: true, // Ensure URLs end with a slash
    output: 'export',
    images: {
        unoptimized: true,
    },
};

export default nextConfig;