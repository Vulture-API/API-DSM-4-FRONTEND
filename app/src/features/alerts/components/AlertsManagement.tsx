"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { SearchInput } from "@/components/ui/SearchInput/SearchInput";
import { AlertsTable } from "./AlertsTable";
import { AlertsSidebar } from "./AlertsSidebar";
import { initialAlerts, topStationsWithAlerts } from "../mocks/alertsData";
import type { AlertFiltersState, AlertItem, AlertType, AlertStatus } from "../types/alert";
import styles from "./AlertsManagement.module.css";
import tableStyles from "./AlertsTable.module.css";

const PAGE_SIZE = 8;

const typeClassMap: Record<AlertType, string> = {
  Temperatura: tableStyles.typeTemperatura,
  Umidade: tableStyles.typeUmidade,
  Chuva: tableStyles.typeChuva,
  Vento: tableStyles.typeVento,
  Bateria: tableStyles.typeBateria,
  Cultura: tableStyles.typeCultura,
  Sensor: tableStyles.typeSensor,
};

const statusClassMap: Record<AlertStatus, string> = {
  Aberto: tableStyles.statusAberto,
  "Em análise": tableStyles.statusEmAnalise,
  Resolvido: tableStyles.statusResolvido,
  Crítico: tableStyles.statusCritico,
};

export function AlertsManagement() {
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Edit alert form state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertItem | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editStation, setEditStation] = useState("Estação S-001");
  const [editType, setEditType] = useState<AlertItem["type"]>("Temperatura");
  const [editStatus, setEditStatus] = useState<AlertItem["status"]>("Aberto");

  // Delete confirm state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<AlertItem | null>(null);

  // New alert form state
  const [newDesc, setNewDesc] = useState("");
  const [newStation, setNewStation] = useState("Estação S-001");
  const [newType, setNewType] = useState<AlertItem["type"]>("Temperatura");
  const [newStatus, setNewStatus] = useState<AlertItem["status"]>("Aberto");

  const [filters, setFilters] = useState<AlertFiltersState>({
    search: "",
    type: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  const handleOpenEdit = (alert: AlertItem) => {
    setEditingAlert(alert);
    setEditDesc(alert.description);
    setEditStation(alert.station);
    setEditType(alert.type);
    setEditStatus(alert.status);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlert || !editDesc.trim()) return;

    const updated: AlertItem = {
      ...editingAlert,
      description: editDesc.trim(),
      station: editStation,
      type: editType,
      sensor: `${editType.substring(0, 4).toUpperCase()}-01`,
      status: editStatus,
    };

    setAlerts((prev) => prev.map((a) => (a.id === editingAlert.id ? updated : a)));
    if (selectedAlert?.id === editingAlert.id) {
      setSelectedAlert(updated);
    }
    setIsEditModalOpen(false);
    setEditingAlert(null);
  };

  const handleOpenDelete = (alert: AlertItem) => {
    setAlertToDelete(alert);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!alertToDelete) return;

    setAlerts((prev) => prev.filter((a) => a.id !== alertToDelete.id));
    if (selectedAlert?.id === alertToDelete.id) {
      setSelectedAlert(null);
    }
    setIsDeleteConfirmOpen(false);
    setAlertToDelete(null);
  };

  const handleFilterChange = <K extends keyof AlertFiltersState>(
    key: K,
    value: AlertFiltersState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      type: "",
      status: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
  };

  // Filter logic
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Search term
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const matchesQuery =
          alert.id.toLowerCase().includes(query) ||
          alert.description.toLowerCase().includes(query) ||
          alert.station.toLowerCase().includes(query) ||
          alert.sensor.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // Type
      if (filters.type && alert.type !== filters.type) {
        return false;
      }

      // Status
      if (filters.status && alert.status !== filters.status) {
        return false;
      }

      // Start Date
      if (filters.startDate && alert.isoDate < filters.startDate) {
        return false;
      }

      // End Date
      if (filters.endDate && alert.isoDate > filters.endDate) {
        return false;
      }

      return true;
    });
  }, [alerts, filters]);

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    const nextNumber = alerts.length + 1;
    const formattedId = `A-${String(nextNumber).padStart(3, "0")}`;
    const today = new Date().toISOString().split("T")[0];
    const nowHours = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const created: AlertItem = {
      id: formattedId,
      type: newType,
      description: newDesc.trim(),
      station: newStation,
      sensor: `${newType.substring(0, 4).toUpperCase()}-01`,
      timestamp: `${today.split("-").reverse().join("/")} - ${nowHours}`,
      isoDate: today,
      status: newStatus,
    };

    setAlerts((prev) => [created, ...prev]);

    setNewDesc("");
    setIsNewModalOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Toolbar global no topo com botão na direita */}
      <div className={styles.toolbar}>
        <div className={styles.searchActions}>
          <SearchInput
            label="Buscar por estação, sensor ou descrição"
            placeholder="Buscar por estação, sensor ou descrição..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            onClear={() => handleFilterChange("search", "")}
          />
        </div>

        <Button
          className={styles.newAlertButton}
          onClick={() => setIsNewModalOpen(true)}
        >
          <Icon name="plus" />
          Novo alerta
        </Button>
      </div>

      {/* Main Grid: Table Content + Sidebar Column */}
      <div className={styles.layoutGrid}>
        <div className={styles.mainContent}>
          {/* Table with Pagination */}
          <AlertsTable
            alerts={filteredAlerts}
            totalAlerts={filteredAlerts.length}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            onViewDetails={(alert) => setSelectedAlert(alert)}
            onEditAlert={handleOpenEdit}
            onDeleteAlert={handleOpenDelete}
          />
        </div>

        {/* Right Sidebar Column: 1. Filtros, 2. Estações com mais alertas */}
        <AlertsSidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          topStations={topStationsWithAlerts}
        />
      </div>

      {/* Details Modal */}
      {selectedAlert && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-alert-title"
          onClick={() => setSelectedAlert(null)}
        >
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <header className={styles.modalHeader}>
              <div className={styles.modalHeaderTitleGroup}>
                <div className={styles.modalIconBadge}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </div>
                <div>
                  <h2 id="modal-alert-title">Detalhes do Alerta {selectedAlert.id}</h2>
                  <span style={{ fontSize: "12px", color: "var(--portal-secondary)" }}>
                    Registrado em {selectedAlert.timestamp}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setSelectedAlert(null)}
                aria-label="Fechar modal"
              >
                <Icon name="close" />
              </button>
            </header>

            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailCardItem}>
                  <span className={styles.detailCardLabel}>Identificador</span>
                  <span className={styles.detailCardValue}>
                    <code>{selectedAlert.id}</code>
                  </span>
                </div>

                <div className={styles.detailCardItem}>
                  <span className={styles.detailCardLabel}>Status do Alerta</span>
                  <span className={styles.detailCardValue}>
                    <span className={`${tableStyles.statusBadge} ${statusClassMap[selectedAlert.status]}`}>
                      <span className={tableStyles.statusDot} />
                      {selectedAlert.status}
                    </span>
                  </span>
                </div>

                <div className={styles.detailCardItem}>
                  <span className={styles.detailCardLabel}>Tipo de Alerta</span>
                  <span className={styles.detailCardValue}>
                    <span className={`${tableStyles.typeBadge} ${typeClassMap[selectedAlert.type] || tableStyles.typeSensor}`}>
                      {selectedAlert.type}
                    </span>
                  </span>
                </div>

                <div className={styles.detailCardItem}>
                  <span className={styles.detailCardLabel}>Sensor Relacionado</span>
                  <span className={styles.detailCardValue}>
                    <code>{selectedAlert.sensor}</code>
                  </span>
                </div>

                <div className={styles.detailCardItem} style={{ gridColumn: "span 2" }}>
                  <span className={styles.detailCardLabel}>Estação e Propriedade</span>
                  <span className={styles.detailCardValue}>
                    {selectedAlert.station}
                  </span>
                </div>
              </div>

              <div className={styles.detailDescBox}>
                <span className={styles.detailCardLabel}>Descrição do Evento</span>
                <p style={{ margin: 0, fontSize: "13.5px", color: "var(--portal-text)", lineHeight: 1.5 }}>
                  {selectedAlert.description}
                </p>
              </div>
            </div>

            <footer className={styles.modalFooterBetween}>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() => handleOpenDelete(selectedAlert)}
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
                Excluir
              </button>

              <div className={styles.modalFooterRightActions}>
                <Button
                  variant="secondary"
                  onClick={() => setSelectedAlert(null)}
                >
                  Fechar
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleOpenEdit(selectedAlert)}
                >
                  <svg
                    width="15"
                    height="15"
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
                  Editar
                </Button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* New Alert Modal */}
      {isNewModalOpen && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-new-alert-title"
        >
          <div className={styles.modalCard}>
            <form onSubmit={handleCreateAlert}>
              <header className={styles.modalHeader}>
                <h2 id="modal-new-alert-title">Novo Alerta</h2>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setIsNewModalOpen(false)}
                  aria-label="Fechar"
                >
                  <Icon name="close" />
                </button>
              </header>
              <div className={styles.modalBody}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label htmlFor="alert-desc" className={styles.detailLabel}>
                    Descrição do Alerta:
                  </label>
                  <input
                    id="alert-desc"
                    type="text"
                    required
                    placeholder="Ex: Rajadas de vento acima do limite"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    style={{
                      height: 38,
                      padding: "0 10px",
                      borderRadius: 8,
                      border: "1px solid var(--portal-border)",
                      fontSize: 14,
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label htmlFor="alert-type" className={styles.detailLabel}>
                    Tipo de Alerta:
                  </label>
                  <select
                    id="alert-type"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as AlertItem["type"])}
                    className={styles.formSelect}
                  >
                    <option value="Temperatura">Temperatura</option>
                    <option value="Umidade">Umidade</option>
                    <option value="Chuva">Chuva</option>
                    <option value="Vento">Vento</option>
                    <option value="Bateria">Bateria</option>
                    <option value="Cultura">Cultura</option>
                    <option value="Sensor">Sensor</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label htmlFor="alert-station" className={styles.detailLabel}>
                    Estação:
                  </label>
                  <select
                    id="alert-station"
                    value={newStation}
                    onChange={(e) => setNewStation(e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="Estação S-001">Estação S-001 (Fazenda Santa Rita)</option>
                    <option value="Estação S-002">Estação S-002 (Fazenda Santa Rita)</option>
                    <option value="Estação S-003">Estação S-003 (Fazenda Santa Rita)</option>
                    <option value="Estação S-004">Estação S-004 (Fazenda Boa Vista)</option>
                    <option value="Estação S-005">Estação S-005 (Fazenda Boa Vista)</option>
                    <option value="Estação S-006">Estação S-006 (Fazenda Esperança)</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label htmlFor="alert-status" className={styles.detailLabel}>
                    Status Inicial:
                  </label>
                  <select
                    id="alert-status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as AlertItem["status"])}
                    className={styles.formSelect}
                  >
                    <option value="Aberto">Aberto</option>
                    <option value="Em análise">Em análise</option>
                    <option value="Crítico">Crítico</option>
                    <option value="Resolvido">Resolvido</option>
                  </select>
                </div>
              </div>
              <footer className={styles.modalFooter}>
                <Button
                  variant="secondary"
                  onClick={() => setIsNewModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  Cadastrar
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Edit Alert Modal */}
      {isEditModalOpen && editingAlert && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-edit-alert-title"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveEdit}>
              <header className={styles.modalHeader}>
                <div className={styles.modalHeaderTitleGroup}>
                  <div className={styles.modalIconBadge}>
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
                  </div>
                  <div>
                    <h2 id="modal-edit-alert-title">Editar Alerta {editingAlert.id}</h2>
                    <span style={{ fontSize: "12px", color: "var(--portal-secondary)" }}>
                      Altere os parâmetros do alerta
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setIsEditModalOpen(false)}
                  aria-label="Fechar"
                >
                  <Icon name="close" />
                </button>
              </header>
              <div className={styles.modalBody}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label htmlFor="edit-alert-desc" className={styles.detailLabel}>
                    Descrição do Alerta:
                  </label>
                  <input
                    id="edit-alert-desc"
                    type="text"
                    required
                    placeholder="Ex: Rajadas de vento acima do limite"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    style={{
                      height: 38,
                      padding: "0 10px",
                      borderRadius: 8,
                      border: "1px solid var(--portal-border)",
                      fontSize: 14,
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label htmlFor="edit-alert-type" className={styles.detailLabel}>
                    Tipo de Alerta:
                  </label>
                  <select
                    id="edit-alert-type"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as AlertItem["type"])}
                    className={styles.formSelect}
                  >
                    <option value="Temperatura">Temperatura</option>
                    <option value="Umidade">Umidade</option>
                    <option value="Chuva">Chuva</option>
                    <option value="Vento">Vento</option>
                    <option value="Bateria">Bateria</option>
                    <option value="Cultura">Cultura</option>
                    <option value="Sensor">Sensor</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label htmlFor="edit-alert-station" className={styles.detailLabel}>
                    Estação:
                  </label>
                  <select
                    id="edit-alert-station"
                    value={editStation}
                    onChange={(e) => setEditStation(e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="Estação S-001">Estação S-001 (Fazenda Santa Rita)</option>
                    <option value="Estação S-002">Estação S-002 (Fazenda Santa Rita)</option>
                    <option value="Estação S-003">Estação S-003 (Fazenda Santa Rita)</option>
                    <option value="Estação S-004">Estação S-004 (Fazenda Boa Vista)</option>
                    <option value="Estação S-005">Estação S-005 (Fazenda Boa Vista)</option>
                    <option value="Estação S-006">Estação S-006 (Fazenda Esperança)</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label htmlFor="edit-alert-status" className={styles.detailLabel}>
                    Status:
                  </label>
                  <select
                    id="edit-alert-status"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as AlertItem["status"])}
                    className={styles.formSelect}
                  >
                    <option value="Aberto">Aberto</option>
                    <option value="Em análise">Em análise</option>
                    <option value="Crítico">Crítico</option>
                    <option value="Resolvido">Resolvido</option>
                  </select>
                </div>
              </div>
              <footer className={styles.modalFooter}>
                <Button
                  variant="secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  Salvar Alterações
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && alertToDelete && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-delete-alert-title"
          onClick={() => setIsDeleteConfirmOpen(false)}
        >
          <div
            className={styles.confirmDeleteCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.confirmDeleteHeader}>
              <div className={styles.confirmDeleteIcon}>
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
              </div>
              <div>
                <h3 id="modal-delete-alert-title" className={styles.confirmDeleteTitle}>
                  Excluir Alerta {alertToDelete.id}
                </h3>
                <span style={{ fontSize: "12px", color: "var(--portal-secondary)" }}>
                  Ação irreversível
                </span>
              </div>
            </div>

            <p className={styles.confirmDeleteDesc}>
              Tem certeza que deseja excluir o alerta <strong>{alertToDelete.id}</strong> ({alertToDelete.description}) da <strong>{alertToDelete.station}</strong>? Esta ação removerá o alerta do histórico.
            </p>

            <div className={styles.confirmDeleteActions}>
              <Button
                variant="secondary"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Cancelar
              </Button>
              <button
                type="button"
                className={styles.btnDangerSolid}
                onClick={handleConfirmDelete}
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
                </svg>
                Sim, excluir alerta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
