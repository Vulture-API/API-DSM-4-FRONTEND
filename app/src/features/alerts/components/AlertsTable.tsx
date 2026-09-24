import { FeedbackState } from "@/components/ui/FeedbackState/FeedbackState";
import type { AlertItem, AlertType, AlertStatus } from "../types/alert";
import styles from "./AlertsTable.module.css";

interface Props {
  alerts: AlertItem[];
  totalAlerts: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onViewDetails: (alert: AlertItem) => void;
  selectedAlertId?: string;
}

const typeClassMap: Record<AlertType, string> = {
  Temperatura: styles.typeTemperatura,
  Umidade: styles.typeUmidade,
  Chuva: styles.typeChuva,
  Vento: styles.typeVento,
  Bateria: styles.typeBateria,
  Sensor: styles.typeSensor,
};

const statusClassMap: Record<AlertStatus, string> = {
  Aberto: styles.statusAberto,
  "Em análise": styles.statusEmAnalise,
  Resolvido: styles.statusResolvido,
  Crítico: styles.statusCritico,
};

export function AlertsTable({
  alerts,
  totalAlerts,
  currentPage,
  pageSize,
  onPageChange,
  onViewDetails,
  selectedAlertId,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalAlerts / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = alerts.slice(startIndex, startIndex + pageSize);

  if (alerts.length === 0) {
    return (
      <div className={styles.panel}>
        <FeedbackState
          kind="empty"
          title="Nenhum alerta encontrado"
          description="Tente ajustar os filtros ou termo de busca para encontrar alertas."
        />
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div
        className={styles.scroll}
        role="region"
        aria-label="Tabela de alertas cadastrados"
        tabIndex={0}
      >
        <table className={styles.table}>
          <caption className={styles.caption}>Listagem de alertas</caption>
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Tipo</th>
              <th scope="col" className={styles.thDesc}>Descrição</th>
              <th scope="col" className={styles.thStation}>Estação</th>
              <th scope="col" className={styles.thSensor}>Sensor</th>
              <th scope="col">Data e Hora</th>
              <th scope="col">Status</th>
              <th scope="col" className={styles.thAction} aria-label="Ver detalhes"></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((alert) => (
              <tr
                key={alert.id}
                className={
                  selectedAlertId === alert.id
                    ? styles.selectedRow
                    : styles.tableRow
                }
                onClick={() => onViewDetails(alert)}
                title="Clique para ver os detalhes do alerta"
              >
                <td className={styles.idCell}>
                  <code>{alert.id}</code>
                </td>
                <td>
                  <span className={`${styles.typeBadge} ${typeClassMap[alert.type] || styles.typeSensor}`}>
                    {alert.type}
                  </span>
                </td>
                <td className={styles.descCell}>
                  <span className={styles.descText} title={alert.message || alert.description}>
                    {alert.message || alert.description}
                  </span>
                  <span className={styles.conditionCode}>
                    {alert.sensor} {alert.comparisonOperator} {alert.referenceValue} {alert.unitOfMeasure}
                  </span>
                </td>
                <td className={styles.stationCell}>
                  <span className={styles.stationName}>{alert.station}</span>
                  {alert.property && (
                    <span className={styles.propertyName}>{alert.property}</span>
                  )}
                </td>
                <td className={styles.sensorCell}>
                  <span className={styles.sensorBadge}>{alert.sensor}</span>
                  {alert.sensorName && (
                    <span className={styles.sensorSubName}>{alert.sensorName}</span>
                  )}
                </td>
                <td className={styles.dateCell}>{alert.timestamp}</td>
                <td>
                  <span className={`${styles.statusBadge} ${statusClassMap[alert.status]}`}>
                    <span className={styles.statusDot} aria-hidden="true" />
                    {alert.status}
                  </span>
                </td>
                <td className={styles.cellChevron}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className={styles.tableFooter}>
        <span className={styles.countInfo}>
          Mostrando {pageItems.length} de {alerts.length} alertas encontrados
        </span>

        {totalPages > 1 && (
          <nav className={styles.pagination} aria-label="Paginação da tabela de alertas">
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label="Página anterior"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={`${styles.pageBtn} ${currentPage === p ? styles.pageBtnActive : ""}`}
                onClick={() => onPageChange(p)}
                aria-current={currentPage === p ? "page" : undefined}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Próxima página"
            >
              &gt;
            </button>
          </nav>
        )}
      </footer>
    </div>
  );
}
