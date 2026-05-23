import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Serve uploaded files from /uploads/ on the VPS disk
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/files/:path*',
      },
    ]
  },
}

export default nextConfig
