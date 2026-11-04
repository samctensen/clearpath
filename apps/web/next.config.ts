import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // Leave room for the API's 40-second AI timeout to return a structured error.
  experimental: { proxyTimeout: 60_000 },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${process.env.API_ORIGIN || "http://127.0.0.1:8000"}/api/:path*` }];
  },
};
export default nextConfig;
