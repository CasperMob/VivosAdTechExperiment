/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'serpapi.com',
      },
      {
        protocol: 'https',
        hostname: '**.gstatic.com',
      },
    ],
  },
}

module.exports = nextConfig

