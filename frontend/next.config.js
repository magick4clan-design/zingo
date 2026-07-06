/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://zingo-production-9a5a.up.railway.app/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
