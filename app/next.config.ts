import type { NextConfig } from "next";

// REST é encaminhado por /api/backend com sessão HttpOnly e Bearer no servidor.
// O upgrade WebSocket usa o cookie agritech_ws_token aceito pelo backend.
const stationsApiUrl = (process.env.STATIONS_API_URL || process.env.API_SERVER_URL || "http://localhost:3000").replace(/\/$/, "");

// Política de conteúdo: tudo do próprio portal, exceto os tiles do mapa
// (OpenStreetMap). O Next injeta scripts inline de hidratação, por isso
// 'unsafe-inline' em script-src; em dev ele também precisa de 'unsafe-eval'.
const isDev = process.env.NODE_ENV !== "production";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://tile.openstreetmap.org",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws:" : " wss:"}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return [
      { source: "/api/stations/current/ws", destination: `${stationsApiUrl}/api/stations/current/ws` },
    ];
  },
};

export default nextConfig;
