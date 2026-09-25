import type { NextConfig } from "next";

// Destinos dos rewrites (proxy do Next para os microsserviços).
//
// São variáveis de SERVIDOR, sem NEXT_PUBLIC_: o navegador sempre chama
// caminhos relativos (/api/stations, /api/alerts...) e o Next repassa. Assim
// não depende de CORS nos serviços.
//
// ATENÇÃO: o Next grava os rewrites no build (.next/routes-manifest.json).
// Mudar estas variáveis exige rodar `next build` de novo — no Docker, elas
// entram como build args.
//
// API_SERVER_URL (nome antigo do destino de usuários) continua aceito.
const url = (value: string | undefined, fallback: string) =>
  (value || fallback).replace(/\/$/, "");

const usersApiUrl = url(
  process.env.USERS_API_URL ?? process.env.API_SERVER_URL,
  "http://localhost:3000",
);
const parametersApiUrl = url(
  process.env.PARAMETERS_API_URL,
  "http://localhost:3001",
);
const alertsApiUrl = url(process.env.ALERTS_API_URL, "http://localhost:3002");
const stationsApiUrl = url(
  process.env.STATIONS_API_URL,
  "http://localhost:3005",
);

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
  `connect-src 'self'${isDev ? " ws:" : ""}`,
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
      { source: "/api/users/:path*", destination: `${usersApiUrl}/api/users/:path*` },
      { source: "/api/users", destination: `${usersApiUrl}/api/users` },
      { source: "/api/roles", destination: `${usersApiUrl}/api/roles` },
      { source: "/api/sensor-types/:path*", destination: `${parametersApiUrl}/api/sensor-types/:path*` },
      { source: "/api/sensor-types", destination: `${parametersApiUrl}/api/sensor-types` },
      { source: "/api/sensors/:path*", destination: `${parametersApiUrl}/api/sensors/:path*` },
      { source: "/api/sensors", destination: `${parametersApiUrl}/api/sensors` },
      { source: "/api/stations/:path*", destination: `${stationsApiUrl}/api/stations/:path*` },
      { source: "/api/stations", destination: `${stationsApiUrl}/api/stations` },
      { source: "/api/alerts/:path*", destination: `${alertsApiUrl}/api/alerts/:path*` },
    ];
  },
};

export default nextConfig;
