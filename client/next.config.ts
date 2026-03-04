import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: `https://sphere-vc.firebaseapp.com/__/auth/:path*`,
      },
      {
        source: '/__/firebase/:path*',
        destination: `https://sphere-vc.firebaseapp.com/__/firebase/:path*`,
      },
    ];
  },
};

export default nextConfig;
