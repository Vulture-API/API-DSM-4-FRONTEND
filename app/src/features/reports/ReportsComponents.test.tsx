import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Property, Station } from "@/features/stations/api";
import { ReportFiltersForm } from "./ReportFiltersForm";
import { ReportTypeSelector } from "./ReportTypeSelector";
import { ReportViewer } from "./ReportViewer";
import type { AlertsReport, ForecastReport, HistoryReport } from "./reportRules";

const fictionalProperties: Property[] = [
  { id: 1, name: "Fazenda Vale Verde", location: "São José dos Campos" },
  { id: 2, name: "Sítio Serra Azul", location: "Taubaté" },
];

const fictionalStations: Station[] = [
  {
    id: 10,
    property_id: 1,
    mac_address: "AA:BB:CC:DD:EE:01",
    name: "Estação Pomar Norte",
    latitude: -23.1896,
    longitude: -45.8841,
    last_communication_at: "2026-10-14T10:00:00.000Z",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 20,
    property_id: 2,
    mac_address: "AA:BB:CC:DD:EE:02",
    name: "Estação Talhão Sul",
    latitude: -23.0123,
    longitude: -45.5555,
    last_communication_at: "2026-10-14T09:30:00.000Z",
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

const fictionalHistoryReport: HistoryReport = {
  report_type: "history",
  generated_at: "2026-10-14T12:00:00.000Z",
  period: { from: "2026-10-07T00:00:00.000Z", to: "2026-10-14T23:59:59.999Z" },
  station: { id: 10, name: "Estação Pomar Norte" },
  property: { id: 1, name: "Fazenda Vale Verde" },
  total_readings: 2,
  summary: [
    {
      sensor_type_id: 1,
      sensor_type: "Temperatura",
      unit_of_measure: "°C",
      count: 2,
      avg: 24.5,
      min: 20.0,
      max: 29.0,
      stddev: 4.5,
      accumulated: null,
    },
  ],
  readings: [
    {
      id: 1,
      sensor_id: 100,
      sensor_type_id: 1,
      sensor_type: "Temperatura",
      unit_of_measure: "°C",
      value: 29.0,
      unix_time: 1791892800,
      date_time: "2026-10-13T12:00:00.000Z",
      data_consistent: true,
    },
    {
      id: 2,
      sensor_id: 100,
      sensor_type_id: 1,
      sensor_type: "Temperatura",
      unit_of_measure: "°C",
      value: 20.0,
      unix_time: 1791806400,
      date_time: "2026-10-12T12:00:00.000Z",
      data_consistent: false,
    },
  ],
};

const fictionalForecastReport: ForecastReport = {
  report_type: "forecast",
  generated_at: "2026-10-14T12:00:00.000Z",
  period: { from: "2026-10-14", to: "2026-10-15" },
  station: {
    id: 10,
    name: "Estação Pomar Norte",
    latitude: -23.1896,
    longitude: -45.8841,
  },
  property: { id: 1, name: "Fazenda Vale Verde" },
  source: "open-meteo",
  total_days: 2,
  days: [
    {
      date: "2026-10-14",
      temperature_max: 30.2,
      temperature_min: 18.4,
      precipitation_mm: 0,
      precipitation_probability: 10,
      wind_speed_max_kmh: 15,
      weather_code: 0,
      weather_description: "Céu limpo",
    },
    {
      date: "2026-10-15",
      temperature_max: 25.0,
      temperature_min: 17.0,
      precipitation_mm: 18.5,
      precipitation_probability: 80,
      wind_speed_max_kmh: 26,
      weather_code: 63,
      weather_description: "Chuva moderada",
    },
  ],
};

const fictionalAlertsReport: AlertsReport = {
  report_type: "alerts",
  generated_at: "2026-10-14T12:00:00.000Z",
  period: { from: "2026-10-07T00:00:00.000Z", to: "2026-10-14T23:59:59.999Z" },
  station: { id: 10, name: "Estação Pomar Norte" },
  property: { id: 1, name: "Fazenda Vale Verde" },
  total_alerts: 2,
  alerts: [
    {
      id: 901,
      station_id: 10,
      station_name: "Estação Pomar Norte",
      sensor_id: 100,
      sensor_type: "Temperatura",
      rule_name: "Temperatura crítica acima de 35 °C",
      condition: "> 35",
      threshold_value: 35,
      reading_value: 37.2,
      unit_of_measure: "°C",
      triggered_at: "2026-10-13T15:30:00.000Z",
      status: "pending",
    },
    {
      id: 902,
      station_id: 10,
      station_name: "Estação Pomar Norte",
      sensor_id: 101,
      sensor_type: "Umidade",
      rule_name: "Ar extremamente seco",
      condition: "< 30",
      threshold_value: 30,
      reading_value: 24.0,
      unit_of_measure: "%",
      triggered_at: "2026-10-12T14:00:00.000Z",
      status: "acknowledged",
    },
  ],
};

describe("ReportTypeSelector", () => {
  it("exibe os três tipos de relatório e aciona callback ao alternar seleção", () => {
    const onSelectType = vi.fn();
    render(
      <ReportTypeSelector selectedType="history" onSelectType={onSelectType} />,
    );

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    expect(radios[1]).toHaveAttribute("aria-checked", "false");
    expect(radios[2]).toHaveAttribute("aria-checked", "false");

    fireEvent.click(screen.getByText("Relatório de Previsão Meteorológica"));
    expect(onSelectType).toHaveBeenCalledWith("forecast");

    fireEvent.click(screen.getByText("Relatório de Alertas e Ocorrências"));
    expect(onSelectType).toHaveBeenCalledWith("alerts");
  });
});

describe("ReportFiltersForm", () => {
  it("apresenta filtros por propriedade, estação e período e exibe erros de validação quando inválidos", () => {
    const onPropertyChange = vi.fn();
    const onStationChange = vi.fn();
    const onDateRangeChange = vi.fn();
    const onDaysChange = vi.fn();
    const onReset = vi.fn();
    const onExportCsv = vi.fn();

    render(
      <ReportFiltersForm
        reportType="history"
        properties={fictionalProperties}
        stations={fictionalStations}
        propertyId="all"
        stationId="all"
        startDate="15/10/2026"
        endDate="10/10/2026"
        days="7"
        validationErrors={["A data inicial não pode ser posterior à data final."]}
        canExport={false}
        onPropertyChange={onPropertyChange}
        onStationChange={onStationChange}
        onDateRangeChange={onDateRangeChange}
        onDaysChange={onDaysChange}
        onReset={onReset}
        onExportCsv={onExportCsv}
      />,
    );

    expect(
      screen.getByRole("alert", { name: "Erros nos filtros do relatório" }),
    ).toHaveTextContent("A data inicial não pode ser posterior à data final.");

    const exportBtn = screen.getByRole("button", { name: /Exportar CSV/i });
    expect(exportBtn).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Propriedade Rural"), {
      target: { value: "1" },
    });
    expect(onPropertyChange).toHaveBeenCalledWith("1");

    fireEvent.change(screen.getByLabelText("Estação Meteorológica"), {
      target: { value: "10" },
    });
    expect(onStationChange).toHaveBeenCalledWith("10");

    fireEvent.click(screen.getByRole("button", { name: /Restaurar padrão/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("exibe seletor de horizonte de dias quando o tipo é previsão e habilita exportação quando válido", () => {
    const onDaysChange = vi.fn();
    const onExportCsv = vi.fn();

    render(
      <ReportFiltersForm
        reportType="forecast"
        properties={fictionalProperties}
        stations={fictionalStations}
        propertyId="1"
        stationId="10"
        startDate="07/10/2026"
        endDate="14/10/2026"
        days="7"
        validationErrors={[]}
        canExport={true}
        onPropertyChange={vi.fn()}
        onStationChange={vi.fn()}
        onDateRangeChange={vi.fn()}
        onDaysChange={onDaysChange}
        onReset={vi.fn()}
        onExportCsv={onExportCsv}
      />,
    );

    fireEvent.change(screen.getByLabelText("Horizonte de Previsão"), {
      target: { value: "14" },
    });
    expect(onDaysChange).toHaveBeenCalledWith("14");

    const exportBtn = screen.getByRole("button", { name: /Exportar CSV/i });
    expect(exportBtn).toBeEnabled();
    fireEvent.click(exportBtn);
    expect(onExportCsv).toHaveBeenCalledTimes(1);
  });
});

describe("ReportViewer", () => {
  it("apresenta os dados recebidos por props para o relatório de histórico", () => {
    render(
      <ReportViewer
        reportType="history"
        report={fictionalHistoryReport}
        isLoading={false}
      />,
    );

    expect(screen.getByText("Resumo Estatístico por Tipo de Sensor")).toBeInTheDocument();
    expect(screen.getByText("Amostra de Leituras do Período")).toBeInTheDocument();
    expect(screen.getByText("Consistente")).toBeInTheDocument();
    expect(screen.getByText("Suspeito")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("apresenta os dados recebidos por props para o relatório de previsão meteorológica", () => {
    render(
      <ReportViewer
        reportType="forecast"
        report={fictionalForecastReport}
        isLoading={false}
      />,
    );

    expect(
      screen.getByText("Previsão Diária — Estação Pomar Norte"),
    ).toBeInTheDocument();
    expect(screen.getByText("Céu limpo")).toBeInTheDocument();
    expect(screen.getByText("Chuva moderada")).toBeInTheDocument();
    expect(screen.getByText("18.5 mm")).toBeInTheDocument();
  });

  it("apresenta os dados recebidos por props para o relatório de alertas", () => {
    render(
      <ReportViewer
        reportType="alerts"
        report={fictionalAlertsReport}
        isLoading={false}
      />,
    );

    expect(screen.getByText("Ocorrências e Alertas Disparados")).toBeInTheDocument();
    expect(
      screen.getByText("Temperatura crítica acima de 35 °C"),
    ).toBeInTheDocument();
    expect(screen.getByText("Ar extremamente seco")).toBeInTheDocument();
    expect(screen.getByText("Pendente")).toBeInTheDocument();
    expect(screen.getByText("Reconhecido")).toBeInTheDocument();
  });

  it("apresenta comportamento adequado para estado de carregamento, erro e ausência de dados", () => {
    const onRetry = vi.fn();

    const { rerender } = render(
      <ReportViewer reportType="history" report={null} isLoading={true} />,
    );
    expect(screen.getByLabelText("Carregando relatório")).toBeInTheDocument();

    rerender(
      <ReportViewer
        reportType="history"
        report={null}
        isLoading={false}
        errorMessage="Falha temporária na comunicação"
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText("Falha temporária na comunicação")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Tentar de novo/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(
      <ReportViewer reportType="alerts" report={null} isLoading={false} />,
    );
    expect(
      screen.getByText("Nenhum registro encontrado para Alertas"),
    ).toBeInTheDocument();
  });
});
