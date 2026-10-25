import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { AuthUser } from "@/features/auth/types";

export const SESSION_COOKIE = "agritech_session";
export const WS_COOKIE = "agritech_ws_token";

export function apiDestination(resource: string): string | null {
  // Backend monolítico: tudo em API_SERVER_URL (porta 3000). As variáveis por
  // recurso continuam aceitas para apontar um módulo para outro endereço.
  const base = process.env.API_SERVER_URL ?? "http://localhost:3000";
  const users = process.env.USERS_API_URL ?? base;
  const stations = process.env.STATIONS_API_URL ?? base;
  const parameters = process.env.PARAMETERS_API_URL ?? base;
  const configured: Record<string, string | undefined> = {
    users,
    roles: users,
    permissions: users,
    auth: users,
    stations,
    properties: process.env.PROPERTIES_API_URL ?? users,
    readings: stations,
    occurrences: stations,
    alerts: process.env.ALERTS_API_URL ?? base,
    sensors: parameters,
    "sensor-types": parameters,
  };
  return configured[resource]?.replace(/\/$/, "") ?? null;
}

export function errorResponse(status: number, message: string): NextResponse {
  return NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

function firstHeaderValue(value: string | null): string | undefined {
  return value?.split(",")[0]?.trim() || undefined;
}

// Atrás de proxy (nginx, Cloudflare), request.url traz o endereço interno do Next
// (ex.: localhost:3010). A origem pública vem de X-Forwarded-Host/Proto ou do Host.
export function requestOrigins(request: Request): Set<string> {
  const url = new URL(request.url);
  const origins = new Set([url.origin]);
  const host = firstHeaderValue(request.headers.get("x-forwarded-host")) ?? firstHeaderValue(request.headers.get("host"));
  const proto = firstHeaderValue(request.headers.get("x-forwarded-proto")) ?? url.protocol.slice(0, -1);
  if (host && /^[a-zA-Z0-9.\-[\]:]+$/.test(host) && (proto === "http" || proto === "https")) {
    origins.add(`${proto}://${host}`);
  }
  return origins;
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !!origin && requestOrigins(request).has(origin) && request.headers.get("sec-fetch-site") !== "cross-site";
}

export async function sessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export function setSession(response: NextResponse, token: string, seconds: number) {
  const options = {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const, maxAge: Math.min(seconds, 3600),
  };
  response.cookies.set(SESSION_COOKIE, token, { ...options, path: "/" });
  response.cookies.set(WS_COOKIE, token, { ...options, path: "/api/stations/current/ws" });
}

export function clearSession(response: NextResponse) {
  const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: 0 };
  response.cookies.set(SESSION_COOKIE, "", { ...options, path: "/" });
  response.cookies.set(WS_COOKIE, "", { ...options, path: "/api/stations/current/ws" });
}

export function isAuthUser(data: unknown): data is AuthUser {
  if (!data || typeof data !== "object") return false;
  const user = data as Partial<AuthUser>;
  return Number.isSafeInteger(user.id) && typeof user.name === "string" &&
    typeof user.email === "string" && Number.isSafeInteger(user.role_id) &&
    user.active === true && Array.isArray(user.permissions) &&
    user.permissions.every((code) => typeof code === "string");
}

export async function fetchIdentity(token: string): Promise<Response> {
  return fetch(`${apiDestination("auth")}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
}
