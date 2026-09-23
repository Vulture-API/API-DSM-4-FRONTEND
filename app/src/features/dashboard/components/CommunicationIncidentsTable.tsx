import { Icon } from "@/components/ui/Icon/Icon";
import type { CommunicationIncident } from "../types/dashboard";
import styles from "./CommunicationIncidentsTable.module.css";

interface Props {
  incidents: CommunicationIncident[];
  onDiagnose?: (incidentId: string) => void;
}

export function CommunicationIncidentsTable({ incidents, onDiagnose }: Props) {
  const getSeverityClass = (sev: CommunicationIncident["severity"]) => {
    switch (sev) {
      case "critical":
        return styles.severityCritical;
      case "warning":
        return styles.severityWarning;
      case "info":
        return styles.severityInfo;
    }
  };

  const getSeverityLabel = (sev: CommunicationIncident["severity"]) => {
    switch (sev) {
      case "critical":
        return "Crítico";
      case "warning":
        return "Atenção";
      case "info":
        return "Info";
    }
  };

  return (
    <section className={styles.container} aria-label="Incidentes de comunicação recentes">
      <header className={styles.header}>
        <h2 className={styles.title}>
          <Icon name="alert" />
          Ocorrências Recentes de Conectividade
        </h2>
        <span className={styles.badge}>
          {incidents.length} {incidents.length === 1 ? "registro ativo" : "registros ativos"}
        </span>
      </header>

      {incidents.length === 0 ? (
        <p style={{ color: "var(--portal-secondary)", fontSize: "var(--text-sm)" }}>
          Nenhum incidente de comunicação registrado no momento. Todas as estações operando normalmente.
        </p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Severidade</th>
                <th>Estação / Propriedade</th>
                <th>Diagnóstico</th>
                <th>Ocorrido em</th>
                <th>Duração</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.id}>
                  <td>
                    <span className={`${styles.severityPill} ${getSeverityClass(inc.severity)}`}>
                      {getSeverityLabel(inc.severity)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.stationCell}>
                      <span className={styles.stationName}>{inc.stationName}</span>
                      <span className={styles.propertyName}>{inc.propertyName}</span>
                    </div>
                  </td>
                  <td>{inc.description}</td>
                  <td className={styles.timeCell}>{inc.occurredAt}</td>
                  <td className={styles.timeCell}>{inc.duration}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.diagnoseBtn}
                      onClick={() => onDiagnose?.(inc.id)}
                    >
                      Diagnosticar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
