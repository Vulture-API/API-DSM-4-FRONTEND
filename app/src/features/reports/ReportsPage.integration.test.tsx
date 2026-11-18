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

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlSpy).toHaveBeenCalledTimes(1);

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
      "/api/reports": () => ({ status: 500, body: { message: "Erro interno no motor de relatórios" } }),
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
          unix_time: Math.floor(new Date("2026-10-03T12:00:00.000Z").getTime() / 1000),
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
          unix_time: Math.floor(new Date("2026-10-08T12:00:00.000Z").getTime() / 1000),
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
});
