import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_PARAMETERS_API_URL || "http://localhost:3001";
    return [
      {
        source: "/api/parameters/:path*",
        destination: `${backendUrl}/sensor-types/:path*`,
      },
    ];
  },
};

export default nextConfig;
