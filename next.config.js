/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    unoptimized: true,
    domains: ['dashscope.aliyuncs.com'],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'axios'],
  },
  // 根据环境决定是否静态导出
  ...(process.env.EXPORT_MODE === 'static' && {
    output: 'export',
    trailingSlash: true,
    distDir: 'out',
    basePath: process.env.NODE_ENV === 'production' ? '/universal-persona-content-engine' : '',
    assetPrefix: process.env.NODE_ENV === 'production' ? '/universal-persona-content-engine/' : '',
  }),
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig