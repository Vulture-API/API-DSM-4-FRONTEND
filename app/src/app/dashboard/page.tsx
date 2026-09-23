"use client";

import { PortalLayout } from "@/components/layout/PortalLayout/PortalLayout";
import { Icon } from "@/components/ui/Icon/Icon";
import { CommunicationHistoryChart } from "@/features/dashboard/components/CommunicationHistoryChart";
import { CommunicationIncidentsTable } from "@/features/dashboard/components/CommunicationIncidentsTable";
import { CommunicationSummaryCards } from "@/features/dashboard/components/CommunicationSummaryCards";
import { RainfallChart } from "@/features/dashboard/components/RainfallChart";
import { StationsStatusGrid } from "@/features/dashboard/components/StationsStatusGrid";
import { WeatherMetricsCards } from "@/features/dashboard/components/WeatherMetricsCards";
import { WeatherTrendsChart } from "@/features/dashboard/components/WeatherTrendsChart";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import type { DashboardPeriod } from "@/features/dashboard/types/dashboard";
import styles from "./Dashboard.module.css";

export default function DashboardPage() {
  const {
    selectedProperty,
    setSelectedProperty,
    selectedPeriod,
    setSelectedPeriod,
    lastRefreshedAt,
    isRefreshing,
    handleRefresh,
    properties,
    summary,
    weather,
    stations,
    hourlyCommunication,
    weatherTrends,
    rainfall,
    incidents,
  } = useDashboardData();

  const periods: { key: DashboardPeriod; label: string }[] = [
    { key: "today", label: "Hoje" },
    { key: "24h", label: "24 horas" },
    { key: "7d", label: "7 dias" },
    { key: "30d", label: "30 dias" },
  ];

  return (
    <PortalLayout title="Dashboard Climático & Monitoramento">
      <div className={styles.pageContainer}>
        {/* Top Control Bar */}
        <div className={styles.topBar}>
          <div className={styles.filterControls}>
            <div className={styles.selectGroup}>
              <label htmlFor="property-filter" className={styles.selectLabel}>
                Propriedade:
              </label>
              <select
                id="property-filter"
                className={styles.selectControl}
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                aria-label="Filtrar por propriedade"
              >
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              className={styles.periodButtonGroup}
              role="group"
              aria-label="Filtro de período temporal"
            >
              {periods.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.periodBtn} ${
                    selectedPeriod === key ? styles.periodBtnActive : ""
                  }`}
                  onClick={() => setSelectedPeriod(key)}
                  aria-pressed={selectedPeriod === key}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.actionControls}>
            <span className={styles.lastUpdatedText}>
              Atualizado: {lastRefreshedAt}
            </span>
            <button
              type="button"
              className={styles.refreshButton}
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Atualizar dados do dashboard"
            >
              <span className={isRefreshing ? styles.spinning : ""}>
                <Icon name="refresh" />
              </span>
              <span>{isRefreshing ? "Atualizando..." : "Atualizar"}</span>
            </button>
          </div>
        </div>

        {/* 1. Status de Comunicação em Tempo Real (SCRUM-371) */}
        <CommunicationSummaryCards summary={summary} />

        {/* 2. Indicadores Climáticos Consolidados (Página 2 Clima) */}
        <WeatherMetricsCards weather={weather} />

        {/* 3. Gráficos Principais: Disponibilidade de Rede e Curvas Climáticas */}
        <div className={styles.chartsGrid}>
          <CommunicationHistoryChart
            data={hourlyCommunication}
            slaTarget={summary.slaTarget}
          />
          <WeatherTrendsChart data={weatherTrends} />
        </div>

        {/* 4. Gráfico Pluviométrico */}
        <div className={styles.chartsGrid}>
          <RainfallChart data={rainfall} />
        </div>

        {/* 5. Monitor Individual de Conexão das Estações */}
        <StationsStatusGrid stations={stations} />

        {/* 6. Tabela de Ocorrências e Incidentes de Comunicação */}
        <CommunicationIncidentsTable incidents={incidents} />
      </div>
    </PortalLayout>
  );
}
