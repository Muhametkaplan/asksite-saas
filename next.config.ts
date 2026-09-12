import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['firebase-admin', 'nodemailer'],
  async redirects() {
    return [
      {
        source: '/c/:slug/arcade',
        destination: '/c/:slug/games',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
