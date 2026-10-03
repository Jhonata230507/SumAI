import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root so a lockfile further up the tree is not mistaken for it.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
}

export default nextConfig
