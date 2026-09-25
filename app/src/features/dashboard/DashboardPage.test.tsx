import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { overview } from "@/test/fixtures";
import { defaultRoutes, mockApi, renderWithProviders } from "@/test/utils";

import { currentConditions, DashboardPage } from "./DashboardPage";

describe("DashboardPage", () => {
  it("mostra o resumo, as condições atuais e as estações", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<DashboardPage />);

    const summary = await screen.findByRole("region", { name: "Resumo" });
    expect(await within(summary).findByText("2/3")).toBeInTheDocument();
    expect(within(summary).getByText("Alertas pendentes").closest("div")!.parentElement).toHaveTextContent("2");

    const conditions = screen.getByRole("region", { name: "Condições agora" });
    expect(within(conditions).getByText("27")).toBeInTheDocument(); // média de 24 e 30
    expect(within(conditions).getByText(/24 a 30 · 2 estações/)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /^Estação Brejo/ })).toHaveAttribute("href", "/estacoes/3");
    expect(await screen.findByText("Temperatura alta na sede")).toBeInTheDocument();
  });

  it("filtra estações por status e por propriedade", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi(defaultRoutes());
    renderWithProviders(<DashboardPage />);
    await screen.findByRole("link", { name: /^Estação Sede/ });

    await user.click(screen.getByRole("radio", { name: /Com alerta/ }));
    expect(screen.queryByRole("link", { name: /^Estação Sede/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Estação Pivô/ })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Filtrar por propriedade"), "2");
    await waitFor(() => expect(calls.some((c) => c.path === "/api/stations/overview?property_id=2")).toBe(true));
  });

  it("mostra erro quando o serviço de estações cai", async () => {
    mockApi({ ...defaultRoutes(), "/api/stations/overview": { status: 503, body: { message: "Serviço fora" } } });
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByText("Serviço fora")).toBeInTheDocument();
  });
});

describe("currentConditions", () => {
  it("ignora leituras velhas e mantém a ordem dos tipos", () => {
    const now = Date.now() / 1000;
    const stations = structuredClone(overview.stations);
    stations[0]!.latest_readings[1]!.unix_time = now - 3 * 3600;

    const result = currentConditions(stations, now);

    expect(result.map((c) => c.type)).toEqual(["Temperatura"]);
    expect(result[0]).toMatchObject({ avg: 27, min: 24, max: 30, stations: 2, unit: "°C" });
  });
});
