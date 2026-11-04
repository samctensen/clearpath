import type { NextConfig } from "next";
import { apiOrigin } from "./src/lib/api-origin";
const nextConfig: NextConfig = {
  // Leave room for the API's 40-second AI timeout to return a structured error.
  experimental: { proxyTimeout: 60_000 },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
};
export default nextConfig;
