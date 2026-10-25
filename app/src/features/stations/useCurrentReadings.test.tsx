import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SESSION_EXPIRED } from "@/lib/auth/policy";

import { current } from "@/test/fixtures";
import { AuthProvider } from "@/features/auth/AuthProvider";

import { testUser, defaultRoutes, mockApi } from "@/test/utils";

import type { LiveReading } from "./api";
import { mergeReading, parseLiveReading } from "./current";
import { useCurrentReadings } from "./useCurrentReadings";

class Socket {
  static instances: Socket[] = [];
  static CLOSED = 3;
  readyState = 0;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  close = vi.fn(() => { this.readyState = 3; this.onclose?.(); });
  constructor(readonly url: URL) { Socket.instances.push(this); }
  open() { this.readyState = 1; this.onopen?.(); }
  message(data: unknown) { this.onmessage?.({ data: JSON.stringify(data) }); }
}

const event = (value = 32, stationId = 1): LiveReading => ({
  type: "reading", reading_id: 101, station_id: stationId, sensor_id: 10,
  local_identifier: "temp", sensor_type_id: 1, sensor_type: "Temperatura",
  unit_of_measure: "°C", value, unix_time: Math.floor(Date.now() / 1000),
});

function setup(propertyId?: number, stationId?: number) {
  Socket.instances = [];
  vi.stubGlobal("WebSocket", Socket);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    <QueryClientProvider client={client}><AuthProvider initialUser={testUser} validateSession={false}>{children}</AuthProvider></QueryClientProvider>;
  return renderHook(({ property, station }) => useCurrentReadings(property, station), {
    wrapper, initialProps: { property: propertyId, station: stationId },
  });
}

afterEach(() => vi.useRealTimers());

describe("leituras atuais", () => {
  it("fecha WebSocket e suspende dados ao expirar a sessão", async () => {
    mockApi(defaultRoutes());
    const hook = setup();
    await waitFor(() => expect(hook.result.current.data).toBeDefined());
    const socket = Socket.instances[0]!;
    await act(async () => window.dispatchEvent(new Event(SESSION_EXPIRED)));
    await waitFor(() => expect(socket.close).toHaveBeenCalled());
    expect(socket.onmessage).toBeNull();
    hook.unmount();
  });

  it("relógio acompanha os dados do REST ao trocar o filtro", async () => {
    mockApi(defaultRoutes());
    const hook = setup();
    await waitFor(() => expect(hook.result.current.data).toBeDefined());
    await new Promise((resolve) => setTimeout(resolve, 20));
    hook.rerender({ property: 5, station: undefined });
    await waitFor(() => expect(hook.result.current.isFetching).toBe(false));
    expect(hook.result.current.now).toBeGreaterThanOrEqual(hook.result.current.dataUpdatedAt);
    hook.unmount();
  });

  it("valida mensagens e ignora eventos antigos ou repetidos", () => {
    expect(parseLiveReading("invalid")).toBeNull();
    expect(parseLiveReading(JSON.stringify({ ...event(), value: null }))).toBeNull();
    expect(parseLiveReading(JSON.stringify(event()))).toEqual(event());
    const updated = mergeReading(current, event());
    const old = { ...event(5), unix_time: event().unix_time - 100 };
    expect(mergeReading(updated, old).stations[0]!.readings[0]!.value).toBe(32);
    expect(mergeReading(updated, event(5)).stations[0]!.readings[0]!.value).toBe(32);
  });

  it("aplica eventos imediatamente, preserva outras estações e fecha ao desmontar", async () => {
    mockApi(defaultRoutes());
    const hook = setup();
    await waitFor(() => expect(hook.result.current.data).toBeDefined());
    const socket = Socket.instances[0]!;
    act(() => socket.open());
    await waitFor(() => expect(hook.result.current.isFetching).toBe(false));
    act(() => socket.message(event()));
    expect(hook.result.current.data!.stations[0]!.readings[0]!.value).toBe(32);
    expect(hook.result.current.data!.stations[1]!.readings[0]!.value).toBe(30);
    await act(async () => { await hook.result.current.refetch(); });
    expect(hook.result.current.data!.stations[0]!.readings[0]!.value).toBe(32);
    hook.unmount();
    expect(socket.close).toHaveBeenCalled();
    expect(socket.onmessage).toBeNull();
  });

  it("usa filtro individual e ignora leituras de outra estação", async () => {
    const { calls } = mockApi(defaultRoutes());
    const hook = setup(undefined, 1);
    await waitFor(() => expect(hook.result.current.data).toBeDefined());
    expect(calls.some((c) => c.path === "/api/stations/1/current")).toBe(true);
    const socket = Socket.instances[0]!;
    expect(socket.url.searchParams.get("station_id")).toBe("1");
    act(() => socket.message(event(99, 2)));
    expect(hook.result.current.data!.stations[0]!.readings[0]!.value).toBe(24);
  });

  it("reconecta, sincroniza pelo REST e mantém dados após falha", async () => {
    let failing = false;
    mockApi({ ...defaultRoutes(), "/api/stations/current": () => failing
      ? { status: 503, body: { message: "Indisponível" } } : current });
    const hook = setup();
    await waitFor(() => expect(hook.result.current.data).toBeDefined());
    failing = true;
    await act(async () => { await hook.result.current.refetch(); });
    await waitFor(() => expect(hook.result.current.error?.message).toBe("Indisponível"));
    expect(hook.result.current.data!.stations[0]!.readings[0]!.value).toBe(24);
    vi.useFakeTimers();
    act(() => Socket.instances[0]!.close());
    expect(hook.result.current.connection).toBe("reconnecting");
    act(() => vi.advanceTimersByTime(1000));
    expect(Socket.instances).toHaveLength(2);
    failing = false;
    await act(async () => {
      Socket.instances[1]!.open();
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(hook.result.current.connection).toBe("connected");
    expect(hook.result.current.error).toBeNull();
  });

  it("troca de propriedade sem misturar cache ou conexões", async () => {
    mockApi(defaultRoutes());
    const hook = setup(1);
    await waitFor(() => expect(hook.result.current.data).toBeDefined());
    const old = Socket.instances[0]!;
    act(() => old.message(event()));
    hook.rerender({ property: 2, station: undefined });
    await waitFor(() => expect(hook.result.current.data?.stations[0]?.station_id).toBe(3));
    expect(old.close).toHaveBeenCalled();
    expect(hook.result.current.data!.stations).toHaveLength(1);
  });
});
