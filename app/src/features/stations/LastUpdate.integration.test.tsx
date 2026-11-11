import { act, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { current } from "@/test/fixtures";
import { defaultRoutes, mockApi, renderWithProviders } from "@/test/utils";

import { StationDetailPage } from "./StationDetailPage";

class Socket {
  static instances: Socket[] = [];
  static CLOSED = 3;
  readyState = 1;
  onmessage: ((event: { data: string }) => void) | null = null;
  close() { this.readyState = 3; }
  constructor() { Socket.instances.push(this); }
  message(value: unknown) { this.onmessage?.({ data: JSON.stringify(value) }); }
}

function snapshot() {
  const result = structuredClone(current);
  result.stations.forEach((s, index) => {
    s.last_update = `2026-11-10T${index === 0 ? "12:01" : "09:02"}:00Z`;
    s.readings.forEach((r) => { r.unix_time = Date.parse("2026-11-10T08:00:00Z") / 1000; });
  });
  return result;
}

describe("última atualização nas telas meteorológicas", () => {
  it("associa a data por id da estação mesmo quando a resposta vem em outra ordem", async () => {
    const data = snapshot();
    data.stations.reverse();
    data.stations[0]!.last_update = null;
    mockApi({ ...defaultRoutes(), "/api/stations/current": data });
    renderWithProviders(<DashboardPage />);
    await waitFor(() => expect(screen.getByLabelText("Última atualização de Estação Sede")).toHaveTextContent("10/11 09:01"));
    expect(screen.getByLabelText("Última atualização de Estação Pivô")).toHaveTextContent("10/11 06:02");
    expect(screen.getByLabelText("Última atualização de Estação Brejo")).toHaveTextContent("Última atualização indisponível");
  });

  it("mostra a medição do detalhe, atualiza por WebSocket e preserva a data após REST atrasado", async () => {
    Socket.instances = [];
    vi.stubGlobal("WebSocket", Socket);
    const data = snapshot();
    const { calls } = mockApi({ ...defaultRoutes(), "/api/stations/1/current": { ...data, stations: [data.stations[0]] } });
    renderWithProviders(<StationDetailPage id={1} />);
    await waitFor(() => expect(screen.getByLabelText("Última atualização de Estação Sede")).toHaveTextContent("10/11 09:01"));
    const event = { type: "reading", reading_id: 101, station_id: 1, sensor_id: 10,
      local_identifier: "temp", sensor_type_id: 1, sensor_type: "Temperatura",
      unit_of_measure: "°C", value: 25, unix_time: Date.parse("2026-11-10T12:05:00Z") / 1000 };
    act(() => Socket.instances[0]!.message(event));
    expect(screen.getByLabelText("Última atualização de Estação Sede")).toHaveTextContent("10/11 09:05");
    act(() => Socket.instances[0]!.message({ ...event, unix_time: event.unix_time - 60 }));
    expect(screen.getByLabelText("Última atualização de Estação Sede")).toHaveTextContent("10/11 09:05");
    const before = calls.filter((c) => c.path === "/api/stations/1/current").length;
    act(() => window.dispatchEvent(new Event("online")));
    await waitFor(() => expect(calls.filter((c) => c.path === "/api/stations/1/current").length).toBeGreaterThan(before));
    expect(screen.getByLabelText("Última atualização de Estação Sede")).toHaveTextContent("10/11 09:05");
  });

  it("mostra fallback para data inválida sem usar o horário da consulta ou da comunicação", async () => {
    const data = snapshot();
    data.stations[0]!.last_update = "inválido";
    mockApi({ ...defaultRoutes(), "/api/stations/1/current": { ...data, stations: [data.stations[0]] } });
    renderWithProviders(<StationDetailPage id={1} />);
    await screen.findByRole("heading", { name: "Estação Sede" });
    expect(screen.getByLabelText("Última atualização de Estação Sede")).toHaveTextContent("Última atualização indisponível");
  });
});
