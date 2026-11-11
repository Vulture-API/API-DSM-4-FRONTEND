import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { defaultRoutes, mockApi, renderWithProviders } from "@/test/utils";

import { DashboardPage } from "./DashboardPage";

describe("DashboardPage", () => {
  it("mostra o resumo, as condições atuais e as estações", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<DashboardPage />);

    const summary = await screen.findByRole("region", { name: "Resumo" });
    expect(await within(summary).findByText("2/3")).toBeInTheDocument();
    expect(within(summary).getByText("Alertas pendentes").closest("div")!.parentElement).toHaveTextContent("2");

    const conditions = screen.getByRole("region", { name: "Condições agora" });
    expect(await within(conditions).findByText("27")).toBeInTheDocument(); // média de 24 e 30
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

  it("filtra as condições atuais por estação e limpa a seleção ao trocar propriedade", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi(defaultRoutes());
    renderWithProviders(<DashboardPage />);
    await screen.findByRole("link", { name: /^Estação Sede/ });
    await user.selectOptions(screen.getByLabelText("Filtrar por estação"), "1");
    await waitFor(() => expect(calls.some((c) => c.path === "/api/stations/1/current")).toBe(true));
    const conditions = screen.getByRole("region", { name: "Condições agora" });
    expect(await within(conditions).findByText("24")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Filtrar por propriedade"), "2");
    expect(screen.getByLabelText("Filtrar por estação")).toHaveValue("");
    await waitFor(() => expect(calls.some((c) => c.path === "/api/stations/current?property_id=2")).toBe(true));
    expect(await screen.findByText("Nenhuma leitura nos últimos 30 minutos")).toBeInTheDocument();
  });

  it("trata falha da API de medições independentemente do panorama", async () => {
    mockApi({ ...defaultRoutes(), "/api/stations/current": { status: 503, body: { message: "Medições indisponíveis" } } });
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByText("Medições indisponíveis")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Resumo" })).toBeInTheDocument();
  });

  it("mostra erro quando o serviço de estações cai", async () => {
    mockApi({ ...defaultRoutes(), "/api/stations/overview": { status: 503, body: { message: "Serviço fora" } } });
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByText("Serviço fora")).toBeInTheDocument();
  });
});
