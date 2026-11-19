import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthUser } from "@/features/auth/types";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { overview, sensors } from "@/test/fixtures";
import { defaultRoutes, mockApi, page, renderWithProviders } from "@/test/utils";

import type { CurrentData, LiveReading, Overview } from "./api";
import { StationDetailPage } from "./StationDetailPage";

// SCRUM-598 / INT-US16-02 and INT-US16-03. Only the HTTP and WebSocket
// transports are simulated; pages, API client, hooks and presentation are real.
const client: AuthUser = {
  id: 10, role_id: 2, name: "Cliente QA", email: "cliente@example.com",
  active: true, created_at: "2026-01-01T00:00:00Z",
  permissions: ["monitoring.read", "stations.read", "properties.read", "sensors.read", "sensor-types.read"],
};

const initial: CurrentData = {
  generated_at: "2026-11-17T14:00:00Z",
  offline_threshold_minutes: 10,
  stations: [{
    station_id: 10, name: "Estação Norte", property_id: 1, property_name: "Fazenda A",
    status: "Online", last_update: "2026-11-17T14:00:00Z",
    readings: [
      { sensor_id: 100, local_identifier: "TEMP-01", sensor_type_id: 1, sensor_type: "Temperatura", unit_of_measure: "°C", value: 25.5, unix_time: 1794924000 },
      { sensor_id: 101, local_identifier: "UMID-01", sensor_type_id: 2, sensor_type: "Umidade", unit_of_measure: "%", value: 60, unix_time: 1794923880 },
    ],
  }],
};

const nextReading: LiveReading = {
  type: "reading", reading_id: 10002, station_id: 10, sensor_id: 100,
  local_identifier: "TEMP-01", sensor_type_id: 1, sensor_type: "Temperatura",
  unit_of_measure: "°C", value: 26.8, unix_time: 1794924300,
};

class Socket {
  static instances: Socket[] = [];
  static CLOSED = 3;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  constructor(readonly url: URL) { Socket.instances.push(this); }
  open() { this.readyState = 1; this.onopen?.(); }
  message(value: unknown) { this.onmessage?.({ data: JSON.stringify(value) }); }
  close() { this.readyState = Socket.CLOSED; }
}

function routes() {
  const station = {
    ...overview.stations[0]!, id: 10, name: "Estação Norte", property_id: 1,
    property_name: "Fazenda A", status: "Online" as const,
    last_communication_at: "2026-11-17T14:09:00Z", active_alerts: 0,
    latest_readings: [],
  };
  const network: Overview = {
    ...overview, stations: [station],
    summary: { total: 1, online: 1, with_alert: 0, offline: 0 },
  };
  const emptySeries = { from: initial.generated_at, to: initial.generated_at, bucket_minutes: 30, series: [] };
  return {
    ...defaultRoutes(),
    "/api/stations/overview": network,
    "/api/properties": [{ id: 1, name: "Fazenda A", location: "SJC" }],
    "/api/stations/current": structuredClone(initial),
    "/api/stations/10/current": structuredClone(initial),
    "/api/stations/readings/series": emptySeries,
    "/api/stations/10/readings/series": emptySeries,
    "/api/sensors": page(initial.stations[0]!.readings.map((r, index) => ({
      ...sensors[index]!, id: r.sensor_id, station_id: 10, local_identifier: r.local_identifier,
    }))),
  };
}

beforeEach(() => {
  // Keep the card's fixed measurements within the dashboard's 30 minute window.
  // Other timers remain real so React Query and Testing Library can settle.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-17T14:10:00Z"));
  Socket.instances = [];
  vi.stubGlobal("WebSocket", Socket);
});

afterEach(() => {
  vi.useRealTimers();
});

describe.each([
  { name: "DashboardPage", detail: false, region: "Condições agora" },
  { name: "StationDetailPage", detail: true, region: "Leituras atuais" },
])("US16: $name como Cliente", ({ detail, region }) => {
  async function load() {
    const transport = mockApi(routes());
    const rendered = renderWithProviders(detail ? <StationDetailPage id={10} /> : <DashboardPage />, client);
    if (!detail) {
      const user = userEvent.setup();
      await screen.findByRole("option", { name: "Estação Norte" });
      await user.selectOptions(await screen.findByLabelText("Filtrar por estação"), "10");
    }
    const conditions = await screen.findByRole("region", { name: region });
    await within(conditions).findByText("25,5");
    const socket = Socket.instances.findLast((s) => s.url.searchParams.get("station_id") === "10")!;
    expect(socket).toBeDefined();
    act(() => socket.open());
    return { ...transport, ...rendered, conditions, socket };
  }

  function expectMeasurements(conditions: HTMLElement, temperature: string) {
    const area = within(conditions);
    expect(area.getByText("Temperatura")).toBeInTheDocument();
    expect(area.getByText(temperature)).toHaveTextContent(`${temperature}°C`);
    expect(area.getByText("Umidade")).toBeInTheDocument();
    expect(area.getByText("60")).toHaveTextContent("60%");
  }

  function expectUpdatedAt(visible: string, iso: string) {
    const update = screen.getByLabelText("Última atualização de Estação Norte");
    expect(update).toHaveTextContent(visible);
    expect(update.querySelector("time")).toHaveAttribute("datetime", iso);
  }

  it("apresenta estação, parâmetros, unidades e data da medição recebidos por HTTP", async () => {
    const { calls, conditions } = await load();
    if (detail) {
      expect(screen.getByRole("heading", { name: "Estação Norte" })).toBeInTheDocument();
    } else {
      expect(screen.getByRole("link", { name: /^Estação Norte/ })).toHaveAttribute("href", "/estacoes/10");
    }
    expect(calls.some((c) => c.path === "/api/stations/10/current")).toBe(true);
    expectMeasurements(conditions, "25,5");
    // The more recent last_communication_at must not replace last_update.
    expectUpdatedAt("17/11 11:00", "2026-11-17T14:00:00.000Z");
  });

  it("atualiza valor e horário por WebSocket preservando a umidade e a estação", async () => {
    const { conditions, socket } = await load();
    expectMeasurements(conditions, "25,5");
    act(() => socket.message(nextReading));
    await waitFor(() => expectMeasurements(conditions, "26,8"));
    expect(within(conditions).queryByText("25,5")).not.toBeInTheDocument();
    expectUpdatedAt("17/11 11:05", "2026-11-17T14:05:00.000Z");

    act(() => {
      socket.message({ ...nextReading, reading_id: 10003, station_id: 20, sensor_id: 200, value: 88, unix_time: 1794924360 });
      socket.message({ ...nextReading, reading_id: 10004, value: 22, unix_time: 1794923940 });
    });
    await waitFor(() => expectMeasurements(conditions, "26,8"));
    expectUpdatedAt("17/11 11:05", "2026-11-17T14:05:00.000Z");
    expect(Socket.instances.at(-1)).toBe(socket);
  });
});
