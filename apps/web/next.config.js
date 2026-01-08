/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: 'api',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Removed rewrites - using custom API route handler instead
  // async rewrites() {
  //   return []
  // },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

module.exports = nextConfig;