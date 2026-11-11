"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useProperties, useStations } from "@/features/stations/hooks";
import { useReport } from "./hooks";
import { ReportFiltersForm } from "./ReportFiltersForm";
import { ReportTypeSelector } from "./ReportTypeSelector";
import { ReportViewer } from "./ReportViewer";
import {
  type CanonicalReportType,
  buildReportCsv,
  isReportEmpty,
  validateReportFilters,
} from "./reportRules";

const DEFAULT_START_DATE = "07/10/2026";
const DEFAULT_END_DATE = "14/10/2026";
const DEFAULT_DAYS = "7";

export function ReportsPage() {
  const { success } = useToast();
  const [reportType, setReportType] = useState<CanonicalReportType>("history");
  const [propertyId, setPropertyId] = useState<string>("all");
  const [stationId, setStationId] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>(DEFAULT_START_DATE);
  const [endDate, setEndDate] = useState<string>(DEFAULT_END_DATE);
  const [days, setDays] = useState<string>(DEFAULT_DAYS);

  const propertiesQuery = useProperties();
  const stationsQuery = useStations();

  const properties = useMemo(() => propertiesQuery.data ?? [], [propertiesQuery.data]);
  const stations = useMemo(() => stationsQuery.data ?? [], [stationsQuery.data]);

  const effectiveStationId = useMemo(() => {
    if (reportType === "forecast" && (stationId === "all" || !stationId)) {
      const firstStation = stations[0];
      return firstStation ? String(firstStation.id) : "1";
    }
    return stationId;
  }, [reportType, stationId, stations]);

  const validatedFilters = useMemo(
    () =>
      validateReportFilters({
        reportType,
        propertyId,
        stationId: effectiveStationId,
        startDate,
        endDate,
        days,
      }),
    [reportType, propertyId, effectiveStationId, startDate, endDate, days],
  );

  const reportQuery = useReport(validatedFilters);

  function handleSelectType(nextType: CanonicalReportType) {
    setReportType(nextType);
    if (nextType === "forecast" && stationId === "all") {
      const firstStation = stations[0];
      setStationId(firstStation ? String(firstStation.id) : "1");
    }
  }

  function handlePropertyChange(nextPropertyId: string) {
    setPropertyId(nextPropertyId);
    if (nextPropertyId !== "all" && stationId !== "all") {
      const currentStation = stations.find((s) => String(s.id) === stationId);
      if (currentStation && String(currentStation.property_id) !== nextPropertyId) {
        const firstForProp = stations.find((s) => String(s.property_id) === nextPropertyId);
        setStationId(
          reportType === "forecast"
            ? String(firstForProp?.id ?? "1")
            : "all",
        );
      }
    }
  }

  function handleReset() {
    setPropertyId("all");
    setStationId(reportType === "forecast" ? String(stations[0]?.id ?? "1") : "all");
    setStartDate(DEFAULT_START_DATE);
    setEndDate(DEFAULT_END_DATE);
    setDays(DEFAULT_DAYS);
  }

  function handleExportCsv() {
    const csvContent = buildReportCsv(reportQuery.data);
    if (!csvContent) return;

    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `relatorio-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    success("Relatório exportado em formato CSV");
  }

  const errorMessage = reportQuery.error
    ? (reportQuery.error as Error).message || "Falha ao carregar os dados do relatório."
    : null;

  const canExport =
    validatedFilters.valid &&
    !reportQuery.isLoading &&
    !reportQuery.isError &&
    !isReportEmpty(reportQuery.data);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitoramento e Inteligência"
        title="Relatórios Meteorológicos"
        description="Selecione a modalidade de relatório, defina os filtros de escopo e consulte indicadores consolidados de telemetria, previsão e alertas."
      />

      <ReportTypeSelector
        selectedType={reportType}
        onSelectType={handleSelectType}
      />

      <ReportFiltersForm
        reportType={reportType}
        properties={properties}
        stations={stations}
        propertyId={propertyId}
        stationId={effectiveStationId}
        startDate={startDate}
        endDate={endDate}
        days={days}
        validationErrors={validatedFilters.errors}
        canExport={canExport}
        onPropertyChange={handlePropertyChange}
        onStationChange={setStationId}
        onDateRangeChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
        onDaysChange={setDays}
        onReset={handleReset}
        onExportCsv={handleExportCsv}
      />

      <ReportViewer
        reportType={reportType}
        report={validatedFilters.valid ? reportQuery.data : null}
        isLoading={validatedFilters.valid && reportQuery.isLoading}
        errorMessage={validatedFilters.valid ? errorMessage : null}
        onRetry={() => {
          void reportQuery.refetch();
        }}
      />
    </div>
  );
}
