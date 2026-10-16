import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { defaultRoutes, mockApi, renderWithProviders } from "@/test/utils";

import { HistoryPage } from "./HistoryPage";

describe("HistoryPage - [QA] Consulta e Filtros do Histórico", () => {
  beforeEach(() => {
    window.URL.createObjectURL = vi.fn(() => "blob:mock-csv-url");
    window.URL.revokeObjectURL = vi.fn();
  });

  it("Cenário 1: consulta de histórico com registros disponíveis", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<HistoryPage />);

    // Valida título da página e seção de filtros
    expect(
      await screen.findByRole("heading", { name: "Histórico de dados meteorológicos" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Filtros de consulta")).toBeInTheDocument();

    // Valida presença do calendário de previsão meteorológica
    expect(await screen.findByText(/Evolução da medição no período/)).toBeInTheDocument();

    // Valida cabeçalho e dados da tabela de telemetria consolidada
    expect(await screen.findByText("DATA / HORA (REGISTRO)")).toBeInTheDocument();
    expect(screen.getByText("TEMPERATURA")).toBeInTheDocument();
    expect(screen.getByText("UMIDADE DO AR")).toBeInTheDocument();
    expect(screen.getByText("VENTO (DIR)")).toBeInTheDocument();
    expect(screen.getByText("PLUVIOMETRIA")).toBeInTheDocument();
    expect(screen.getByText("LEITURAS DE SOLO (TEMP / UMID)")).toBeInTheDocument();
    expect(screen.getByText("STATUS PREVISTO / ALERTA")).toBeInTheDocument();

    // Valida contador de leituras obtidas
    expect(await screen.findByText(/leituras obtidas no período selecionado/)).toBeInTheDocument();
  });

  it("Cenário 2: consulta sem registros disponíveis", async () => {
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

    // Valida empty state
    expect(await screen.findByText("Nenhum registro encontrado no período")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Não há leituras meteorológicas para os filtros informados. Tente alterar o período ou limpar os filtros de busca.",
      ),
    ).toBeInTheDocument();

    // Valida que exportar CSV sem registros acusa aviso
    const exportBtn = screen.getAllByRole("button", { name: "Exportar CSV" })[0]!;
    await user.click(exportBtn);
    expect(await screen.findByText("Nenhum dado disponível para exportar.")).toBeInTheDocument();

    // Valida ação de redefinir filtros
    const resetBtn = screen.getByRole("button", { name: "Ver últimos 7 dias" });
    await user.click(resetBtn);
    expect(await screen.findByText("Filtros redefinidos para os últimos 7 dias.")).toBeInTheDocument();
  });

  it("Cenário 3: filtro por período (rápido e personalizado)", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());
    renderWithProviders(<HistoryPage />);

    await screen.findByText("DATA / HORA (REGISTRO)");

    // Alternar para 24 h
    await user.click(screen.getByRole("radio", { name: "24 h" }));

    // Alternar para 30 dias
    await user.click(screen.getByRole("radio", { name: "30 dias" }));

    // Alternar para período personalizado e digitar datas válidas
    await user.click(screen.getByRole("radio", { name: "Personalizado" }));
    const startDateInput = screen.getByLabelText("Data inicial");
    await user.clear(startDateInput);
    await user.type(startDateInput, "01/01/2026");

    const endDateInput = screen.getByLabelText("Data final");
    await user.clear(endDateInput);
    await user.type(endDateInput, "07/01/2026");

    await user.click(screen.getByRole("button", { name: "Filtrar leituras" }));
    expect(await screen.findByText("Filtros aplicados ao histórico de telemetria.")).toBeInTheDocument();
  });

  it("Cenário 4: filtro por estação", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());
    renderWithProviders(<HistoryPage />);

    await screen.findByText("DATA / HORA (REGISTRO)");

    // Selecionar Estação 1
    const stationSelect = screen.getByLabelText(/Estação Meteorológica/);
    await user.selectOptions(stationSelect, "1");
    expect(await screen.findByText(/Estação ativa:/)).toBeInTheDocument();

    // Voltar para "Todas as estações"
    await user.selectOptions(stationSelect, "");
    expect(await screen.findByText(/Estações ativas:/)).toBeInTheDocument();
  });

  it("Cenário 5: utilização simultânea dos filtros de período e estação", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi(defaultRoutes());
    renderWithProviders(<HistoryPage />);

    await screen.findByText("DATA / HORA (REGISTRO)");

    // Define período 24 h
    await user.click(screen.getByRole("radio", { name: "24 h" }));

    // Define estação 1
    const stationSelect = screen.getByLabelText(/Estação Meteorológica/);
    await user.selectOptions(stationSelect, "1");

    // Define tipo de sensor
    const sensorSelect = screen.getByLabelText(/Tipo Sensor/);
    await user.selectOptions(sensorSelect, "Temperatura");

    // Define agrupamento temporal e direcionamento
    const groupingSelect = screen.getByLabelText("Agrupamento temporal");
    await user.selectOptions(groupingSelect, "1h");

    const aggregationSelect = screen.getByLabelText("Direcionamento de Leitura");
    await user.selectOptions(aggregationSelect, "avg");

    // Aplica os filtros combinados
    await user.click(screen.getByRole("button", { name: "Filtrar leituras" }));
    expect(await screen.findByText("Filtros aplicados ao histórico de telemetria.")).toBeInTheDocument();
    expect(screen.getByText(/Estação ativa:/)).toBeInTheDocument();

    // Valida que os filtros foram enviados para o endpoint /api/readings
    const readingCalls = calls.filter((c) => c.path.startsWith("/api/readings"));
    expect(readingCalls.some((c) =>
      c.path.includes("station_id=1") &&
      c.path.includes("sensor_id=10") &&
      c.path.includes("start_unix_time=") &&
      c.path.includes("end_unix_time=")
    )).toBe(true);
  });

  it("Cenário 6: período inválido (data inicial maior que data final)", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());
    renderWithProviders(<HistoryPage />);

    await screen.findByText("DATA / HORA (REGISTRO)");

    // Alternar para Personalizado
    await user.click(screen.getByRole("radio", { name: "Personalizado" }));

    // Informar data inicial POSTERIOR à data final
    const startDateInput = screen.getByLabelText("Data inicial");
    await user.clear(startDateInput);
    await user.type(startDateInput, "20/01/2026");

    const endDateInput = screen.getByLabelText("Data final");
    await user.clear(endDateInput);
    await user.type(endDateInput, "10/01/2026");

    // Tentar aplicar filtros
    await user.click(screen.getByRole("button", { name: "Filtrar leituras" }));

    // Valida mensagem de erro de validação
    expect(
      await screen.findByText(
        "Intervalo de datas inválido. A data inicial deve ser anterior ou igual à data final.",
      ),
    ).toBeInTheDocument();
  });

  it("Cenário 7: estação inexistente (lida graciosamente com ID não cadastrado)", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());
    renderWithProviders(<HistoryPage />);

    await screen.findByText("DATA / HORA (REGISTRO)");

    const stationSelect = screen.getByLabelText(/Estação Meteorológica/);

    // Adiciona uma opção temporária de ID inexistente para simular seleção inválida
    const option = document.createElement("option");
    option.value = "9999";
    option.text = "Estação Inexistente #9999";
    stationSelect.appendChild(option);

    await user.selectOptions(stationSelect, "9999");
    await user.click(screen.getByRole("button", { name: "Filtrar leituras" }));

    // Deve exibir estado vazio sem erros em tela
    expect(await screen.findByText("Nenhum registro encontrado no período")).toBeInTheDocument();
  });

  it("Cenário 8: falha de comunicação com a API", async () => {
    const user = userEvent.setup();
    mockApi({
      ...defaultRoutes(),
      "/api/stations/overview": {
        status: 500,
        body: { message: "Falha de comunicação com a API meteorológica" },
      },
    });
    renderWithProviders(<HistoryPage />);

    // Valida mensagem de erro em tela
    expect(
      await screen.findByText("Falha de comunicação com a API meteorológica"),
    ).toBeInTheDocument();

    // Valida botão de nova tentativa
    const retryBtn = screen.getByRole("button", { name: "Tentar de novo" });
    await user.click(retryBtn);
  });

  it("filtro de criticidade: exibe apenas leituras com alerta ou discrepância", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());
    renderWithProviders(<HistoryPage />);

    await screen.findByText("DATA / HORA (REGISTRO)");

    const alertsCheckbox = screen.getByLabelText(/Exibir apenas leituras com alerta/);
    await user.click(alertsCheckbox);
    expect(alertsCheckbox).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Filtrar leituras" }));
    expect(await screen.findByText("Filtros aplicados ao histórico de telemetria.")).toBeInTheDocument();

    // Resetar filtros
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

  it("exporta dados filtrados para arquivo CSV", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());
    renderWithProviders(<HistoryPage />);

    await screen.findByText("DATA / HORA (REGISTRO)");

    const exportButtons = screen.getAllByRole("button", { name: "Exportar CSV" });
    await user.click(exportButtons[0]!);

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(await screen.findByText(/Exportação CSV concluída/)).toBeInTheDocument();
  });
});
