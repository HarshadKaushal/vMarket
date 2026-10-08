import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Do not reuse a page that was prefetched before login or logout.
    staleTimes: {
      dynamic: 0,
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL ?? "http://localhost:3000"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
