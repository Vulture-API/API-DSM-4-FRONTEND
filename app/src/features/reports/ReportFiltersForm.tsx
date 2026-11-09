"use client";

import { AlertCircle, Calendar, Download, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { ReactSelect } from "@/components/ui/ReactSelect";
import type { Property, Station } from "@/features/stations/api";
import type { CanonicalReportType } from "./reportRules";

export type ReportFiltersFormProps = {
  reportType: CanonicalReportType;
  properties: Property[];
  stations: Station[];
  propertyId: string;
  stationId: string;
  startDate: string;
  endDate: string;
  days: string;
  validationErrors: string[];
  canExport: boolean;
  onPropertyChange: (propertyId: string) => void;
  onStationChange: (stationId: string) => void;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onDaysChange: (days: string) => void;
  onReset: () => void;
  onExportCsv: () => void;
};

const FORECAST_DAYS_OPTIONS = [
  { value: "3", label: "Próximos 3 dias" },
  { value: "5", label: "Próximos 5 dias" },
  { value: "7", label: "Próximos 7 dias" },
  { value: "10", label: "Próximos 10 dias" },
  { value: "14", label: "Próximos 14 dias" },
];

export function ReportFiltersForm({
  reportType,
  properties,
  stations,
  propertyId,
  stationId,
  startDate,
  endDate,
  days,
  validationErrors,
  canExport,
  onPropertyChange,
  onStationChange,
  onDateRangeChange,
  onDaysChange,
  onReset,
  onExportCsv,
}: ReportFiltersFormProps) {
  const filteredStations =
    propertyId === "all"
      ? stations
      : stations.filter((s) => s.property_id === Number(propertyId));

  const propertyOptions = [
    { value: "all", label: "Todas as propriedades" },
    ...properties.map((p) => ({
      value: String(p.id),
      label: p.name,
      sublabel: p.location ?? undefined,
    })),
  ];

  const stationOptions = [
    ...(reportType === "forecast"
      ? []
      : [{ value: "all", label: "Todas as estações" }]),
    ...filteredStations.map((s) => ({
      value: String(s.id),
      label: s.name,
      sublabel: s.mac_address,
    })),
  ];

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label
              htmlFor="report-filter-property"
              className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted"
            >
              <Filter className="size-3.5 text-faint" />
              Propriedade Rural
            </label>
            <ReactSelect
              id="report-filter-property"
              label="Propriedade Rural"
              value={propertyId}
              onChange={(val) => onPropertyChange(String(val))}
              options={propertyOptions}
            />
          </div>

          <div>
            <label
              htmlFor="report-filter-station"
              className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted"
            >
              <Filter className="size-3.5 text-faint" />
              Estação Meteorológica
            </label>
            <ReactSelect
              id="report-filter-station"
              label="Estação Meteorológica"
              value={stationId}
              onChange={(val) => onStationChange(String(val))}
              options={stationOptions}
              placeholder="Selecione uma estação..."
            />
          </div>

          {reportType === "forecast" ? (
            <div>
              <label
                htmlFor="report-filter-days"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted"
              >
                <Calendar className="size-3.5 text-faint" />
                Horizonte de Previsão
              </label>
              <ReactSelect
                id="report-filter-days"
                label="Horizonte de Previsão"
                value={days}
                onChange={(val) => onDaysChange(String(val))}
                options={FORECAST_DAYS_OPTIONS}
              />
            </div>
          ) : (
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted">
                <Calendar className="size-3.5 text-faint" />
                Período de Consulta
              </label>
              <DateRangePicker
                id="report-date-range"
                label="Período de Consulta"
                startDate={startDate}
                endDate={endDate}
                onChange={onDateRangeChange}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3 lg:border-t-0 lg:pt-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<RotateCcw className="size-3.5" />}
            onClick={onReset}
          >
            Restaurar padrão
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={!canExport}
            icon={<Download className="size-3.5" />}
            onClick={onExportCsv}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div
          role="alert"
          aria-label="Erros nos filtros do relatório"
          className="mt-4 flex items-start gap-2.5 rounded-lg border border-danger/25 bg-danger-soft/60 px-3.5 py-2.5 text-xs text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <ul className="space-y-1 font-medium">
            {validationErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
