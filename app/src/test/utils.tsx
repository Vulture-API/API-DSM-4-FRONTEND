import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";

import { ToastProvider } from "@/components/ui/Toast";

import * as fx from "./fixtures";

export function renderWithProviders(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>{ui}</ToastProvider>
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
