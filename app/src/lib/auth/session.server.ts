import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { AuthUser } from "@/features/auth/types";

export const SESSION_COOKIE = "agritech_session";
export const WS_COOKIE = "agritech_ws_token";

export function apiDestination(resource: string): string | null {
  const configured: Record<string, string | undefined> = {
    users: process.env.USERS_API_URL ?? process.env.API_SERVER_URL ?? "http://localhost:3000",
    roles: process.env.USERS_API_URL ?? process.env.API_SERVER_URL ?? "http://localhost:3000",
    permissions: process.env.USERS_API_URL ?? process.env.API_SERVER_URL ?? "http://localhost:3000",
    auth: process.env.USERS_API_URL ?? process.env.API_SERVER_URL ?? "http://localhost:3000",
    stations: process.env.STATIONS_API_URL ?? "http://localhost:3005",
    properties:
      process.env.PROPERTIES_API_URL ??
      process.env.USERS_API_URL ??
      process.env.API_SERVER_URL ??
      "http://localhost:3000",
    readings: process.env.STATIONS_API_URL ?? "http://localhost:3005",
    occurrences: process.env.STATIONS_API_URL ?? "http://localhost:3005",
    alerts: process.env.ALERTS_API_URL ?? "http://localhost:3002",
    sensors: process.env.PARAMETERS_API_URL ?? "http://localhost:3001",
    "sensor-types": process.env.PARAMETERS_API_URL ?? "http://localhost:3001",
  };
  return configured[resource]?.replace(/\/$/, "") ?? null;
}

export function errorResponse(status: number, message: string): NextResponse {
  return NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin === new URL(request.url).origin && request.headers.get("sec-fetch-site") !== "cross-site";
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
