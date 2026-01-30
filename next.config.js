/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true
  },
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  basePath: process.env.NODE_ENV === 'production' ? '/universal-persona-content-engine' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/universal-persona-content-engine/' : '',
}

module.exports = nextConfig