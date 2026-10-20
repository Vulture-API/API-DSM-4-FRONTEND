import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { defaultRoutes, mockApi, renderWithProviders } from "@/test/utils";

import { isThresholdViolated } from "./AlertThresholdChart";
import { DashboardStats } from "./DashboardStats";

describe("DashboardStats - [INTEGRAÇÃO SCRUM-445] Integrar dashboard de estatísticas com API", () => {
  beforeEach(() => {
    window.URL.createObjectURL = vi.fn(() => "blob:mock-stats-csv-url");
    window.URL.revokeObjectURL = vi.fn();
  });

  it("Cenário 1: cálculo das estatísticas e exibição dos 7 indicadores no resumo por sensor", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<DashboardStats />);

    // Cabeçalho e resumo por sensor
    expect(
      await screen.findByRole("heading", { name: "Estatísticas meteorológicas" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Resumo por sensor")).toBeInTheDocument();

    // Valida exibição dos 7 sensores no resumo consolidado
    expect((await screen.findAllByText("Temperatura")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Umidade do Ar").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Vento").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Chuva").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pressão").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Temp. Solo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Umid. Solo").length).toBeGreaterThan(0);

    // Valida indicadores estatísticos nos 2 gráficos (Mínimo, Média, Máximo, Limite de alerta e Acima do limite)
    expect(screen.getAllByText("Mínimo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Média").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Máximo").length).toBeGreaterThan(0);
    expect(screen.getByText("Limite de alerta")).toBeInTheDocument();
    expect(screen.getByText("Acima do limite")).toBeInTheDocument();
  });

  it("Cenário 2: cálculo de violação de limite de alerta (AlertThresholdChart)", () => {
    expect(
      isThresholdViolated(31.2, { id: 1, operator: ">", referenceValue: 30 }),
    ).toBe(true);
    expect(
      isThresholdViolated(28.5, { id: 1, operator: ">", referenceValue: 30 }),
    ).toBe(false);
    expect(
      isThresholdViolated(30, { id: 2, operator: ">=", referenceValue: 30 }),
    ).toBe(true);
    expect(
      isThresholdViolated(25, { id: 3, operator: "<", referenceValue: 30 }),
    ).toBe(true);
    expect(
      isThresholdViolated(30, { id: 4, operator: "<=", referenceValue: 30 }),
    ).toBe(true);
    expect(
      isThresholdViolated(30, { id: 5, operator: "=", referenceValue: 30 }),
    ).toBe(true);
    expect(isThresholdViolated(35, null)).toBe(false);
  });

  it("Cenário 3: filtros de período com dados disponíveis (6 h, 24 h, 7 dias e 30 dias)", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi(defaultRoutes());
    renderWithProviders(<DashboardStats />);

    await screen.findByText("Comparativo por estação");

    // Alternar período do Gráfico 1 (Barras) para 24 h e 30 dias
    const buttons6h = screen.getAllByRole("radio", { name: "6 h" });
    await user.click(buttons6h[0]!);
    expect(buttons6h[0]).toHaveAttribute("aria-checked", "true");

    const buttons30d = screen.getAllByRole("radio", { name: "30 dias" });
    await user.click(buttons30d[0]!);
    expect(buttons30d[0]).toHaveAttribute("aria-checked", "true");

    // Alternar período do Gráfico 2 (Linha) para 7 dias
    const buttons7d = screen.getAllByRole("radio", { name: "7 dias" });
    await user.click(buttons7d[1]!);
    expect(buttons7d[1]).toHaveAttribute("aria-checked", "true");

    expect(
      calls.some((c) => c.path.startsWith("/api/stations/statistics?from=")),
    ).toBe(true);
  });

  it("Cenário 4: atualização dos gráficos pelos filtros de medição, estação e propriedade", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi(defaultRoutes());
    renderWithProviders(<DashboardStats />);

    expect(await screen.findByText("Comparativo por estação")).toBeInTheDocument();
    expect(screen.getByText("Monitoramento de limite de alerta")).toBeInTheDocument();

    // Filtra gráfico de barras por Velocidade do Vento
    const barSelect = await screen.findByLabelText("Medição exibida no gráfico de barras");
    await user.selectOptions(barSelect, "Velocidade do Vento");
    expect(barSelect).toHaveValue("Velocidade do Vento");

    // Filtra gráfico de linha por Pressão (sem regra ativa -> exibe "Sem limite")
    const lineSelect = screen.getByLabelText("Medição exibida no gráfico de linha");
    await user.selectOptions(lineSelect, "Pressão");
    expect(lineSelect).toHaveValue("Pressão");
    expect(await screen.findByText("Sem limite")).toBeInTheDocument();

    // Filtra gráfico de linha por estação específica
    const stationSelect = screen.getByLabelText("Estação exibida no gráfico de linha");
    await user.selectOptions(stationSelect, "1");
    expect(stationSelect).toHaveValue("1");

    // Filtra por propriedade agrícola no topo
    const propSelect = screen.getByLabelText("Propriedade agrícola");
    await user.selectOptions(propSelect, "1");
    expect(propSelect).toHaveValue("1");

    expect(
      calls.some((c) => c.path.includes("property_id=1")),
    ).toBe(true);
  });

  it("Cenário 5: período sem dados disponíveis nos 2 gráficos e no resumo", async () => {
    mockApi({
      ...defaultRoutes(),
      "/api/stations/statistics": {
        from: "2026-10-01T00:00:00Z",
        to: "2026-10-07T00:00:00Z",
        station_id: null,
        property_id: null,
        readings_total: 0,
        sensor_types: [],
      },
      "/api/stations/overview": {
        generated_at: new Date().toISOString(),
        offline_threshold_minutes: 10,
        summary: { total: 0, online: 0, with_alert: 0, offline: 0 },
        stations: [],
      },
      "/api/stations/readings/series": {
        from: "2026-10-01T00:00:00Z",
        to: "2026-10-02T00:00:00Z",
        bucket_minutes: 60,
        series: [],
      },
    });
    renderWithProviders(<DashboardStats />);

    // Valida estados vazios nos 7 cards e nos 2 gráficos da tela nova
    expect(await screen.findByText("Sem dados no período")).toBeInTheDocument();
    expect(await screen.findByText("Sem dados de telemetria")).toBeInTheDocument();
    expect(screen.getAllByText("Sem leituras no período").length).toBe(7);
  });

  it("Cenário 6: falha de comunicação com a API nos cards e gráficos", async () => {
    const user = userEvent.setup();
    mockApi({
      ...defaultRoutes(),
      "/api/stations/statistics": {
        status: 500,
        body: { message: "Falha de comunicação com a API de estatísticas" },
      },
      "/api/stations/readings/series": {
        status: 500,
        body: { message: "Falha ao carregar série temporal" },
      },
    });
    renderWithProviders(<DashboardStats />);

    expect(
      await screen.findByText("Falha de comunicação com a API de estatísticas"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Falha ao carregar série temporal"),
    ).toBeInTheDocument();

    const retryButtons = screen.getAllByRole("button", { name: "Tentar de novo" });
    expect(retryButtons.length).toBeGreaterThanOrEqual(2);
    await user.click(retryButtons[0]!);
  });

  it("Cenário 7: exportação dos indicadores estatísticos em CSV", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());
    renderWithProviders(<DashboardStats />);

    await screen.findByText("Comparativo por estação");

    const exportBtn = screen.getByRole("button", { name: /Exportar CSV/i });
    await user.click(exportBtn);

    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });

  it("Cenário 8: integração com o serviço de previsão meteorológica de 7 dias", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<DashboardStats />);

    expect(await screen.findByText("Previsão Meteorológica")).toBeInTheDocument();
    expect(screen.getByTestId("forecast-day-0")).toBeInTheDocument();
    expect(screen.getByTestId("forecast-day-6")).toBeInTheDocument();
    expect(screen.getByText("Janela de Pulverização (24h)")).toBeInTheDocument();
  });

  it("Cenário 9: indisponibilidade do serviço de previsão meteorológica (HTTP 503)", async () => {
    const user = userEvent.setup();
    mockApi({
      ...defaultRoutes(),
      "/api/stations/1/forecast": {
        status: 503,
        body: { message: "Serviço de previsão meteorológica indisponível" },
      },
    });
    renderWithProviders(<DashboardStats />);

    expect(await screen.findByText("Comparativo por estação")).toBeInTheDocument();
    expect(
      await screen.findByText("Serviço de previsão meteorológica indisponível"),
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: "Tentar de novo" });
    await user.click(retryBtn);
  });
});
