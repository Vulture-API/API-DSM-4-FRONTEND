import type { NextConfig } from "next";

const apiServerUrl = (
  process.env.API_SERVER_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_PARAMETERS_API_URL || "http://localhost:3001";
    const stationsUrl = (
      process.env.NEXT_PUBLIC_STATIONS_API_URL || "http://localhost:3005"
    ).replace(/\/$/, "");

    return [
      {
        source: "/api/stations/:path*",
        destination: `${stationsUrl}/api/stations/:path*`,
      },
      {
        source: "/api/stations",
        destination: `${stationsUrl}/api/stations`,
      },
      {
        source: "/api/parameters/:path*",
        destination: `${backendUrl}/sensor-types/:path*`,
      },
      {
        // TEMPORÁRIO: remover quando o gateway ou CORS definitivo estiver pronto.
        // O repository continuará usando NEXT_PUBLIC_API_BASE_URL.
        source: "/api/backend/:path*",
        destination: `${apiServerUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;