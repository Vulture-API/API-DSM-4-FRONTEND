import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";

import { AuthProvider } from "@/features/auth/AuthProvider";
import type { AuthUser } from "@/features/auth/types";

import { ToastProvider } from "@/components/ui/Toast";

import * as fx from "./fixtures";

export const testUser: AuthUser = {
  id: 1, role_id: 1, name: "Administrador", email: "admin@example.com", active: true, created_at: "2026-01-01T00:00:00Z",
  permissions: [
    ...["users", "roles", "properties", "stations", "sensors", "sensor-types", "alert-configs"].flatMap((resource) => ["create", "read", "update", "delete"].map((action) => `${resource}.${action}`)),
    "monitoring.read", "permissions.read", "roles.permissions.update", "triggered-alerts.read", "triggered-alerts.acknowledge", "occurrences.read", "occurrences.resolve", "occurrences.run", "rules-engine.run",
  ],
};

export function renderWithProviders(ui: ReactElement, user: AuthUser = testUser) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider initialUser={user} validateSession={false}><ToastProvider>{ui}</ToastProvider></AuthProvider>
    </QueryClientProvider>,
  );
}

type Handler = unknown | ((request: { url: URL; method: string; body: unknown }) => unknown);
type Routes = Record<string, Handler>;

export type FetchCall = { method: string; path: string; body: unknown };

/**
 * Substitui o fetch por um mapa "MÉTODO /caminho" -> resposta. A chave sem
 * método vale para GET. Handler pode devolver { status, body } para erros.
 * Rota não mapeada responde 404, para o teste falhar de forma visível.
 */
export function mockApi(routes: Routes) {
  const calls: FetchCall[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://localhost");
    url.pathname = url.pathname.replace(/^\/api\/backend\//, "/api/");
    const method = (init?.method ?? "GET").toUpperCase();
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path: url.pathname + url.search, body });
    const handler =
      routes[`${method} ${url.pathname}${url.search}`] ??
      routes[`${method} ${url.pathname}`] ??
      (method === "GET" ? (routes[`${url.pathname}${url.search}`] ?? routes[url.pathname]) : undefined);
    if (handler === undefined) {
      return new Response(JSON.stringify({ message: `sem mock para ${method} ${url.pathname}` }), { status: 404 });
    }
    const result = typeof handler === "function" ? await handler({ url, method, body }) : handler;
    if (result && typeof result === "object" && "status" in result && "body" in result) {
      const { status, body: responseBody } = result as { status: number; body: unknown };
      return new Response(status === 204 ? null : JSON.stringify(responseBody), { status });
    }
    return new Response(result === undefined ? null : JSON.stringify(result), {
      status: result === undefined ? 204 : 200,
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock };
}

export const page = <T,>(data: T[]) => ({
  data,
  meta: { total_records: data.length, total_pages: 1, current_page: 1 },
});


/** Todas as leituras (GET) que as telas fazem, respondidas pelos fixtures. */
export function defaultRoutes(): Routes {
  return {
    "/api/stations/current": ({ url }: { url: URL }) => ({
      ...fx.current,
      stations: fx.current.stations.filter((s) => !url.searchParams.get("property_id") ||
        s.property_id === Number(url.searchParams.get("property_id"))),
    }),
    ...Object.fromEntries(fx.current.stations.map((s) => [
      `/api/stations/${s.station_id}/current`, { ...fx.current, stations: [s] },
    ])),
    "/api/occurrences": page([]),
    "/api/stations/overview": fx.overview,
    "/api/stations/properties": fx.properties,
    "/api/stations": page(fx.stations),
    "/api/stations/readings/series": fx.series,
    "/api/stations/1/readings/series": fx.series,
    "/api/sensors": ({ url }: { url: URL }) => {
      const stationId = url.searchParams.get("station_id");
      return page(fx.sensors.filter((s) => !stationId || s.station_id === Number(stationId)));
    },
    "/api/sensor-types": fx.sensorTypes,
    "/api/users": page(fx.users),
    "/api/roles": fx.roles,
    "/api/readings": fx.readingsPaginated,
    "/api/stations/statistics": fx.statistics,
    ...Object.fromEntries(fx.overview.stations.map((s) => [
      `/api/stations/${s.id}/statistics`, { ...fx.statistics, station_id: s.id },
    ])),
    ...Object.fromEntries(fx.overview.stations.map((s) => [
      `/api/stations/${s.id}/readings/series`, fx.series,
    ])),
    "/api/stations/1/forecast": fx.forecast,
    "/api/stations/1/status": fx.stationStatus,
    "/api/alerts/config": page(fx.rules),
    "/api/alerts/triggered": ({ url }: { url: URL }) => {
      const acknowledged = url.searchParams.get("acknowledged") === "true";
      const data = acknowledged ? fx.acknowledgedAlerts : fx.triggered;
      const limit = Number(url.searchParams.get("limit") ?? 15);
      return {
        data: data.slice(0, limit),
        meta: { total_records: data.length, total_pages: Math.ceil(data.length / limit), current_page: 1 },
      };
    },
  };
}
