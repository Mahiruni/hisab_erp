import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-DNS-Prefetch-Control", value: "off" }, { key: "X-Permitted-Cross-Domain-Policies", value: "none" }] }];
  },
};

export default nextConfig;
