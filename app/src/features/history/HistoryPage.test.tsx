import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { defaultRoutes, mockApi, renderWithProviders } from "@/test/utils";

import { HistoryPage } from "./HistoryPage";

describe("HistoryPage", () => {
  beforeEach(() => {
    window.URL.createObjectURL = vi.fn(() => "blob:mock-csv-url");
    window.URL.revokeObjectURL = vi.fn();
  });

  it("renderiza cabeçalho, filtros, evolução e tabela de telemetria", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<HistoryPage />);

    expect(
      await screen.findByRole("heading", { name: "Histórico de dados meteorológicos" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Filtros de consulta")).toBeInTheDocument();
    expect(await screen.findByText(/Evolução da medição no período/)).toBeInTheDocument();
    expect(await screen.findByText("DATA / HORA (REGISTRO)")).toBeInTheDocument();
  });

  it("permite alterar período, estação, sensor e aplicar/limpar filtros", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());
    renderWithProviders(<HistoryPage />);

    await screen.findByText("DATA / HORA (REGISTRO)");

    // Alternar período para 24 h
    await user.click(screen.getByRole("radio", { name: "24 h" }));

    // Alternar período para 30 dias
    await user.click(screen.getByRole("radio", { name: "30 dias" }));

    // Selecionar estação
    const stationSelect = screen.getByLabelText(/Estação Meteorológica/);
    await user.selectOptions(stationSelect, "1");
    expect(await screen.findByText(/Estação ativa:/)).toBeInTheDocument();

    // Selecionar tipo de sensor
    const sensorSelect = screen.getByLabelText(/Tipo Sensor/);
    await user.selectOptions(sensorSelect, "Umidade");
    await user.selectOptions(sensorSelect, "Temperatura");

    // Alterar datas manuais
    const startDateInput = screen.getByLabelText("Data inicial");
    await user.clear(startDateInput);
    await user.type(startDateInput, "01/01/2026");

    const endDateInput = screen.getByLabelText("Data final");
    await user.clear(endDateInput);
    await user.type(endDateInput, "07/01/2026");

    // Alternar período para Personalizado
    await user.click(screen.getByRole("radio", { name: "Personalizado" }));

    // Selecionar agrupamento e direcionamento
    const groupingSelect = screen.getByLabelText("Agrupamento temporal");
    await user.selectOptions(groupingSelect, "10m");
    await user.selectOptions(groupingSelect, "30m");
    await user.selectOptions(groupingSelect, "1d");

    const aggregationSelect = screen.getByLabelText("Direcionamento de Leitura");
    await user.selectOptions(aggregationSelect, "min");
    await user.selectOptions(aggregationSelect, "max");
    await user.selectOptions(aggregationSelect, "all");

    // Alternar checkbox de apenas alertas
    const alertsCheckbox = screen.getByLabelText(/Exibir apenas leituras com alerta/);
    await user.click(alertsCheckbox);
    expect(alertsCheckbox).toBeChecked();

    // Clicar em filtrar leituras
    await user.click(screen.getByRole("button", { name: "Filtrar leituras" }));
    expect(await screen.findByText("Filtros aplicados ao histórico de telemetria.")).toBeInTheDocument();

    // Clicar em limpar filtros
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(await screen.findByText("Filtros redefinidos para os últimos 7 dias.")).toBeInTheDocument();
    expect(alertsCheckbox).not.toBeChecked();
  });

  it("navega pela paginação de registros", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());
    renderWithProviders(<HistoryPage />);

    const nextBtn = await screen.findByRole("button", { name: "Próxima" });
    if (!nextBtn.hasAttribute("disabled")) {
      await user.click(nextBtn);
      expect(screen.getByText(/2 \//)).toBeInTheDocument();

      const prevBtn = screen.getByRole("button", { name: "Anterior" });
      await user.click(prevBtn);
      expect(screen.getByText(/1 \//)).toBeInTheDocument();
    }
  });

  it("exporta dados para CSV", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());
    renderWithProviders(<HistoryPage />);

    await screen.findByText("DATA / HORA (REGISTRO)");

    const exportButtons = screen.getAllByRole("button", { name: "Exportar CSV" });
    await user.click(exportButtons[0]!);

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(await screen.findByText(/Exportação CSV concluída/)).toBeInTheDocument();
  });

  it("exibe estado de erro e permite tentar de novo", async () => {
    const user = userEvent.setup();
    mockApi({
      ...defaultRoutes(),
      "/api/stations/overview": { status: 500, body: { message: "Erro ao buscar estações" } },
    });
    renderWithProviders(<HistoryPage />);

    expect(await screen.findByText("Erro ao buscar estações")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: "Tentar de novo" });
    await user.click(retryBtn);
  });

  it("exibe estado vazio e permite resetar filtros", async () => {
    const user = userEvent.setup();
    mockApi({
      ...defaultRoutes(),
      "/api/stations/overview": {
        generated_at: new Date().toISOString(),
        offline_threshold_minutes: 10,
        summary: { total: 0, online: 0, with_alert: 0, offline: 0 },
        stations: [],
      },
    });
    renderWithProviders(<HistoryPage />);

    expect(await screen.findByText("Nenhum registro encontrado no período")).toBeInTheDocument();

    const exportBtn = screen.getAllByRole("button", { name: "Exportar CSV" })[0]!;
    await user.click(exportBtn);
    expect(await screen.findByText("Nenhum dado disponível para exportar.")).toBeInTheDocument();

    const resetBtn = screen.getByRole("button", { name: "Ver últimos 7 dias" });
    await user.click(resetBtn);
    expect(await screen.findByText("Filtros redefinidos para os últimos 7 dias.")).toBeInTheDocument();
  });
});
