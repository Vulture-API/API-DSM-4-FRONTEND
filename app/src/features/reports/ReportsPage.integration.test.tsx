import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultRoutes, mockApi, renderWithProviders } from "@/test/utils";
import { reportsApi } from "./api";
import { ReportsPage } from "./ReportsPage";
import type { HistoryReport } from "./reportRules";

describe("ReportsPage", () => {
  it("carrega e alterna entre os relatórios de histórico, previsão e alertas", async () => {
    mockApi(defaultRoutes());

    renderWithProviders(<ReportsPage />);

    expect(
      screen.getByRole("heading", { name: "Relatórios Meteorológicos" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("Resumo Estatístico por Tipo de Sensor"),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Data final"), {
      target: { value: "31/12/2026" },
    });

    fireEvent.click(screen.getByText("Relatório de Previsão Meteorológica"));

    await waitFor(() => {
      expect(
        screen.getByText(/Previsão Diária — Estação Sede/i),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Relatório de Alertas e Ocorrências"));

    await waitFor(() => {
      expect(
        screen.getByText("Ocorrências e Alertas Disparados"),
      ).toBeInTheDocument();
    });
  });

  it("permite filtrar por propriedade, restaurar filtros padrão e exportar CSV", async () => {
    mockApi(defaultRoutes());
    const createObjectUrlSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:relatorio-teste");
    const revokeObjectUrlSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});

    renderWithProviders(<ReportsPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Resumo Estatístico por Tipo de Sensor"),
      ).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole("button", { name: /Exportar CSV/i });
    expect(exportBtn).toBeEnabled();
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrlSpy).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText("Propriedade Rural"), {
      target: { value: "1" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Restaurar padrão/i }));

    expect(screen.getByLabelText("Propriedade Rural")).toHaveValue("all");

    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
  });

  it("utiliza o endpoint direto /api/reports quando disponível e exibe erro se falhar com 500", async () => {
    const routes = {
      ...defaultRoutes(),
      "/api/reports": () => ({
        status: 500,
        body: { message: "Erro interno no motor de relatórios" },
      }),
    };
    mockApi(routes);

    renderWithProviders(<ReportsPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Erro interno no motor de relatórios"),
      ).toBeInTheDocument();
    });
  });

  it("envia o período selecionado pelo DateRangePicker ao reportsApi e exibe as leituras retornadas no ReportViewer", async () => {
    const emptyHistoryReport: HistoryReport = {
      report_type: "history",
      generated_at: "2026-10-14T12:00:00.000Z",
      period: {
        from: "2026-10-07T00:00:00.000Z",
        to: "2026-10-14T23:59:59.999Z",
      },
      station: null,
      property: null,
      total_readings: 0,
      summary: [],
      readings: [],
    };

    const filteredHistoryReport: HistoryReport = {
      report_type: "history",
      generated_at: "2026-10-14T12:00:00.000Z",
      period: {
        from: "2026-10-01T00:00:00.000Z",
        to: "2026-10-10T23:59:59.999Z",
      },
      station: null,
      property: null,
      total_readings: 2,
      summary: [
        {
          sensor_type_id: 1,
          sensor_type: "Temperatura",
          unit_of_measure: "°C",
          count: 2,
          avg: 26,
          min: 25,
          max: 27,
          stddev: 1,
          accumulated: null,
        },
      ],
      readings: [
        {
          id: 2,
          sensor_id: 1,
          sensor_type_id: 1,
          sensor_type: "Temperatura",
          unit_of_measure: "°C",
          value: 25,
          unix_time: Math.floor(
            new Date("2026-10-03T12:00:00.000Z").getTime() / 1000,
          ),
          date_time: "2026-10-03T12:00:00.000Z",
          data_consistent: true,
        },
        {
          id: 3,
          sensor_id: 1,
          sensor_type_id: 1,
          sensor_type: "Temperatura",
          unit_of_measure: "°C",
          value: 27,
          unix_time: Math.floor(
            new Date("2026-10-08T12:00:00.000Z").getTime() / 1000,
          ),
          date_time: "2026-10-08T12:00:00.000Z",
          data_consistent: true,
        },
      ],
    };

    const { calls } = mockApi({
      ...defaultRoutes(),
      "/api/reports": ({ url }: { url: URL }) => {
        const type = url.searchParams.get("type");
        const from = url.searchParams.get("from") ?? "";
        const to = url.searchParams.get("to") ?? "";
        if (
          type === "history" &&
          from.startsWith("2026-10-01") &&
          to.startsWith("2026-10-10")
        ) {
          return filteredHistoryReport;
        }
        return emptyHistoryReport;
      },
    });
    const generateSpy = vi.spyOn(reportsApi, "generate");

    renderWithProviders(<ReportsPage />);

    const historyRadio = screen.getByRole("radio", {
      name: /Relatório de Histórico de Leituras/i,
    });
    fireEvent.click(historyRadio);
    expect(historyRadio).toHaveAttribute("aria-checked", "true");

    fireEvent.change(screen.getByLabelText("Data inicial"), {
      target: { value: "01/10/2026" },
    });
    fireEvent.change(screen.getByLabelText("Data final"), {
      target: { value: "10/10/2026" },
    });

    await waitFor(() => {
      expect(generateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          valid: true,
          reportType: "history",
          fromIso: "2026-10-01T00:00:00.000Z",
          toIso: "2026-10-10T23:59:59.999Z",
        }),
      );
    });

    expect(calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          method: "GET",
          path: "/api/reports?type=history&from=2026-10-01T00%3A00%3A00.000Z&to=2026-10-10T23%3A59%3A59.999Z",
        }),
      ]),
    );

    const readingsTable = await screen.findByRole("table", {
      name: "Leituras detalhadas do relatório histórico",
    });
    expect(within(readingsTable).getByText(/03\/10/)).toBeInTheDocument();
    expect(within(readingsTable).getByText("25 °C")).toBeInTheDocument();
    expect(within(readingsTable).getByText(/08\/10/)).toBeInTheDocument();
    expect(within(readingsTable).getByText("27 °C")).toBeInTheDocument();

    generateSpy.mockRestore();
  });

  it("exporta relatório gerado em CSV e JSON pelo endpoint do backend e trata falhas na exportação", async () => {
    const createObjectUrlSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:relatorio-exportado");
    const revokeObjectUrlSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const downloadedFilenames: Array<string | null> = [];
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloadedFilenames.push(this.getAttribute("download"));
      });

    const sampleHistoryReport: HistoryReport = {
      report_type: "history",
      generated_at: "2026-10-14T12:00:00.000Z",
      period: {
        from: "2026-10-07T00:00:00.000Z",
        to: "2026-10-14T23:59:59.999Z",
      },
      station: { id: 1, name: "Estação Sede" },
      property: { id: 1, name: "Fazenda Vale Verde" },
      total_readings: 1,
      summary: [
        {
          sensor_type_id: 1,
          sensor_type: "Temperatura",
          unit_of_measure: "°C",
          count: 1,
          avg: 25,
          min: 25,
          max: 25,
          stddev: null,
          accumulated: null,
        },
      ],
      readings: [
        {
          id: 10,
          sensor_id: 1,
          sensor_type_id: 1,
          sensor_type: "Temperatura",
          unit_of_measure: "°C",
          value: 25,
          unix_time: 1791892800,
          date_time: "2026-10-13T12:00:00.000Z",
          data_consistent: true,
        },
      ],
    };

    const { fetchMock } = mockApi({
      ...defaultRoutes(),
      "/api/reports": sampleHistoryReport,
    });

    const baseFetch = fetchMock.getMockImplementation()!;
    let exportCalls = 0;
    const exportRequests: Array<{ url: string; body: unknown }> = [];
    fetchMock.mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const urlText = String(input);
        if (urlText.includes("/api/backend/reports/export")) {
          exportCalls += 1;
          const parsedBody = init?.body ? JSON.parse(String(init.body)) : null;
          exportRequests.push({ url: urlText, body: parsedBody });
          if (exportCalls === 1) {
            return new Response('\uFEFF"ID Leitura";"Valor"\r\n"10";"25"', {
              status: 200,
              headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition":
                  'attachment; filename="relatorio-historico-estacao-1-2026-10-07_a_2026-10-14.csv"',
              },
            });
          }
          if (exportCalls === 2) {
            return new Response(
              JSON.stringify({ report_type: "history", total_records: 1 }),
              {
                status: 200,
                headers: {
                  "Content-Type": "application/json; charset=utf-8",
                  "Content-Disposition":
                    'attachment; filename="relatorio-historico-estacao-1-2026-10-07_a_2026-10-14.json"',
                },
              },
            );
          }
          return new Response(
            JSON.stringify({
              message: "Falha ao gerar arquivo para exportação.",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
        return baseFetch(input, init);
      },
    );

    renderWithProviders(<ReportsPage />);

    const exportCsvBtn = screen.getByRole("button", { name: /Exportar CSV/i });
    const exportJsonBtn = screen.getByRole("button", {
      name: /Exportar JSON/i,
    });
    await waitFor(() => expect(exportCsvBtn).toBeEnabled());

    fireEvent.click(exportCsvBtn);
    await waitFor(() => {
      expect(
        screen.getByText("Relatório exportado em formato CSV"),
      ).toBeInTheDocument();
    });
    expect(exportRequests[0]).toMatchObject({
      url: "/api/backend/reports/export",
      body: { format: "csv", report: sampleHistoryReport },
    });

    fireEvent.click(exportJsonBtn);
    await waitFor(() => {
      expect(
        screen.getByText("Relatório exportado em formato JSON"),
      ).toBeInTheDocument();
    });
    expect(exportRequests[1]).toMatchObject({
      url: "/api/backend/reports/export",
      body: { format: "json", report: sampleHistoryReport },
    });

    fireEvent.click(exportCsvBtn);
    await waitFor(() => {
      expect(
        screen.getByText("Falha ao gerar arquivo para exportação."),
      ).toBeInTheDocument();
    });
    expect(createObjectUrlSpy).toHaveBeenCalledTimes(2);
    expect(revokeObjectUrlSpy).toHaveBeenCalledTimes(2);
    expect(downloadedFilenames).toEqual([
      "relatorio-historico-estacao-1-2026-10-07_a_2026-10-14.csv",
      "relatorio-historico-estacao-1-2026-10-07_a_2026-10-14.json",
    ]);

    anchorClickSpy.mockRestore();
    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
  });

  it("reenvia com filtros enxutos quando a exportação inline excede o limite (413) ou o relatório é grande", async () => {
    const createObjectUrlSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:relatorio-grande");
    const revokeObjectUrlSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    const sampleHistoryReport: HistoryReport = {
      report_type: "history",
      generated_at: "2026-10-14T12:00:00.000Z",
      period: {
        from: "2026-10-07T00:00:00.000Z",
        to: "2026-10-14T23:59:59.999Z",
      },
      station: { id: 1, name: "Estação Sede" },
      property: { id: 1, name: "Fazenda Vale Verde" },
      total_readings: 1,
      summary: [
        {
          sensor_type_id: 1,
          sensor_type: "Temperatura",
          unit_of_measure: "°C",
          count: 1,
          avg: 25,
          min: 25,
          max: 25,
          stddev: null,
          accumulated: null,
        },
      ],
      readings: [
        {
          id: 10,
          sensor_id: 1,
          sensor_type_id: 1,
          sensor_type: "Temperatura",
          unit_of_measure: "°C",
          value: 25,
          unix_time: 1791892800,
          date_time: "2026-10-13T12:00:00.000Z",
          data_consistent: true,
        },
      ],
    };

    const { fetchMock } = mockApi({
      ...defaultRoutes(),
      "/api/reports": sampleHistoryReport,
    });

    const baseFetch = fetchMock.getMockImplementation()!;
    const sentBodies: unknown[] = [];
    fetchMock.mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const urlText = String(input);
        if (urlText.includes("/api/backend/reports/export")) {
          const parsedBody = init?.body ? JSON.parse(String(init.body)) : null;
          sentBodies.push(parsedBody);
          if (parsedBody && "report" in parsedBody) {
            return new Response(
              JSON.stringify({ message: "Requisição muito grande." }),
              {
                status: 413,
                headers: { "Content-Type": "application/json" },
              },
            );
          }
          return new Response('\uFEFF"ID Leitura";"Valor"\r\n"10";"25"', {
            status: 200,
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Content-Disposition":
                'attachment; filename="relatorio-historico-geral-2026-10-07_a_2026-10-14.csv"',
            },
          });
        }
        return baseFetch(input, init);
      },
    );

    renderWithProviders(<ReportsPage />);

    const exportCsvBtn = screen.getByRole("button", { name: /Exportar CSV/i });
    await waitFor(() => expect(exportCsvBtn).toBeEnabled());

    fireEvent.click(exportCsvBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Relatório exportado em formato CSV"),
      ).toBeInTheDocument();
    });
    expect(sentBodies).toHaveLength(2);
    expect(sentBodies[0]).toHaveProperty("report");
    expect(sentBodies[1]).toEqual({
      type: "history",
      station_id: 1,
      from: "2026-10-07T00:00:00.000Z",
      to: "2026-10-14T23:59:59.999Z",
      format: "csv",
    });

    anchorClickSpy.mockRestore();
    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
  });
});
