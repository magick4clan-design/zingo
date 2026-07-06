/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    const normalizedBackendUrl = backendUrl.replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${normalizedBackendUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
