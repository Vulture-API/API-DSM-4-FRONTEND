import { TopStationsAlertsCard } from "./TopStationsAlertsCard";
import type { AlertFiltersState, AlertStatus, AlertType, StationAlertRank } from "../types/alert";
import styles from "./AlertsSidebar.module.css";

interface Props {
  filters: AlertFiltersState;
  onFilterChange: <K extends keyof AlertFiltersState>(key: K, value: AlertFiltersState[K]) => void;
  onClearFilters: () => void;
  topStations: StationAlertRank[];
}

const alertTypes: AlertType[] = [
  "Temperatura",
  "Umidade",
  "Chuva",
  "Vento",
  "Bateria",
  "Cultura",
  "Sensor",
];

const alertStatuses: AlertStatus[] = [
  "Aberto",
  "Em análise",
  "Resolvido",
  "Crítico",
];

export function AlertsSidebar({
  filters,
  onFilterChange,
  onClearFilters,
  topStations,
}: Props) {
  const hasActiveFilters =
    Boolean(filters.type) ||
    Boolean(filters.status) ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate);

  return (
    <aside className={styles.sidebarCol} aria-label="Painel lateral de filtros e estatísticas">
      {/* 1. Card: Filtros */}
      <section className={styles.card} aria-label="Filtros avançados">
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filtros
          </h3>
          {hasActiveFilters && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={onClearFilters}
              aria-label="Limpar todos os filtros"
            >
              Limpar
            </button>
          )}
        </header>

        {/* Tipo de Alerta */}
        <div className={styles.filterSection}>
          <span className={styles.sectionLabel}>Tipo de Alerta</span>
          <div className={styles.chipGroup}>
            {alertTypes.map((type) => {
              const isActive = filters.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
                  onClick={() => onFilterChange("type", isActive ? "" : type)}
                  aria-pressed={isActive}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div className={styles.filterSection}>
          <span className={styles.sectionLabel}>Status</span>
          <div className={styles.chipGroup}>
            {alertStatuses.map((status) => {
              const isActive = filters.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
                  onClick={() => onFilterChange("status", isActive ? "" : status)}
                  aria-pressed={isActive}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        {/* Período */}
        <div className={styles.filterSection}>
          <span className={styles.sectionLabel}>Período</span>
          <div className={styles.dateInputsRow}>
            <label className={styles.dateField}>
              <span>Data inicial</span>
              <input
                type="date"
                className={styles.dateInput}
                value={filters.startDate}
                onChange={(e) => onFilterChange("startDate", e.target.value)}
              />
            </label>
            <label className={styles.dateField}>
              <span>Data final</span>
              <input
                type="date"
                className={styles.dateInput}
                value={filters.endDate}
                onChange={(e) => onFilterChange("endDate", e.target.value)}
              />
            </label>
          </div>
        </div>
      </section>

      {/* 2. Card: Estações com mais alertas */}
      <TopStationsAlertsCard stations={topStations} />
    </aside>
  );
}
