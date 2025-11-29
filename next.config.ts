/**
 * @type {import('next').NextConfig}
 */

const isProd = process.env.NODE_ENV === 'production';
const isCustomDomain = process.env.CUSTOM_DOMAIN === 'true';
const nextConfig = {
    trailingSlash: true,
    output: 'export',
    // distDir: 'out/privatasearch', // Directorio de salida personalizado para exportación estática local
    images: {
        unoptimized: true,
    },
    basePath: isProd && !isCustomDomain ? '/privatasearch' : '',
};

export default nextConfig;