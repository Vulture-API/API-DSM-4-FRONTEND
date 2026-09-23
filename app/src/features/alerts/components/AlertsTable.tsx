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
  onEditAlert?: (alert: AlertItem) => void;
  onDeleteAlert?: (alert: AlertItem) => void;
}

const typeClassMap: Record<AlertType, string> = {
  Temperatura: styles.typeTemperatura,
  Umidade: styles.typeUmidade,
  Chuva: styles.typeChuva,
  Vento: styles.typeVento,
  Bateria: styles.typeBateria,
  Cultura: styles.typeCultura,
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
  onEditAlert,
  onDeleteAlert,
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
              <th scope="col">Descrição</th>
              <th scope="col">Estação / Sensor</th>
              <th scope="col">Data e Hora</th>
              <th scope="col">Status</th>
              <th scope="col" style={{ textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((alert) => (
              <tr key={alert.id}>
                <td className={styles.idCell}>
                  <code>{alert.id}</code>
                </td>
                <td>
                  <span className={`${styles.typeBadge} ${typeClassMap[alert.type] || styles.typeSensor}`}>
                    {alert.type}
                  </span>
                </td>
                <td className={styles.descCell}>
                  <span className={styles.descText} title={alert.description}>
                    {alert.description}
                  </span>
                </td>
                <td className={styles.stationCell}>
                  <span className={styles.stationName}>{alert.station}</span>
                  <span className={styles.sensorName}>{alert.sensor}</span>
                </td>
                <td className={styles.dateCell}>{alert.timestamp}</td>
                <td>
                  <span className={`${styles.statusBadge} ${statusClassMap[alert.status]}`}>
                    <span className={styles.statusDot} aria-hidden="true" />
                    {alert.status}
                  </span>
                </td>
                <td className={styles.actionsCell}>
                  <div className={styles.actionButtonGroup}>
                    <button
                      type="button"
                      className={styles.actionButton}
                      title="Visualizar detalhes"
                      aria-label={`Visualizar detalhes do alerta ${alert.id}`}
                      onClick={() => onViewDetails(alert)}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    {onEditAlert && (
                      <button
                        type="button"
                        className={styles.actionButton}
                        title="Editar alerta"
                        aria-label={`Editar alerta ${alert.id}`}
                        onClick={() => onEditAlert(alert)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
                    {onDeleteAlert && (
                      <button
                        type="button"
                        className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                        title="Excluir alerta"
                        aria-label={`Excluir alerta ${alert.id}`}
                        onClick={() => onDeleteAlert(alert)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    )}
                  </div>
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
