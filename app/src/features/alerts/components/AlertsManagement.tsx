"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { SearchInput } from "@/components/ui/SearchInput/SearchInput";
import { FeedbackState } from "@/components/ui/FeedbackState/FeedbackState";
import { AlertsTable } from "./AlertsTable";
import { AlertsSidebar } from "./AlertsSidebar";
import {
  topStationsWithAlerts,
  stationsCatalog,
  sensorsCatalog,
} from "../mocks/alertsData";
import { useAlerts } from "../hooks/useAlerts";
import type {
  AlertFiltersState,
  AlertItem,
  AlertType,
  AlertStatus,
  ComparisonOperator,
} from "../types/alert";
import styles from "./AlertsManagement.module.css";
import tableStyles from "./AlertsTable.module.css";

const PAGE_SIZE = 8;

const comparisonOperatorsList: { value: ComparisonOperator; label: string; desc: string }[] = [
  { value: "<", label: "< (Menor que)", desc: "Leitura menor que o valor de referência" },
  { value: "<=", label: "<= (Menor ou igual)", desc: "Leitura menor ou igual ao valor" },
  { value: ">", label: "> (Maior que)", desc: "Leitura maior que o valor de referência" },
  { value: ">=", label: ">= (Maior ou igual)", desc: "Leitura maior ou igual ao valor" },
  { value: "=", label: "= (Igual a)", desc: "Leitura igual ao valor de referência" },
  { value: "!=", label: "!= (Diferente de)", desc: "Leitura diferente do valor de referência" },
];

const alertStatuses: AlertStatus[] = [
  "Aberto",
  "Em análise",
  "Crítico",
  "Resolvido",
];

const typeClassMap: Record<AlertType, string> = {
  Temperatura: tableStyles.typeTemperatura,
  Umidade: tableStyles.typeUmidade,
  Chuva: tableStyles.typeChuva,
  Vento: tableStyles.typeVento,
  Bateria: tableStyles.typeBateria,
  Sensor: tableStyles.typeSensor,
};

const statusClassMap: Record<AlertStatus, string> = {
  Aberto: tableStyles.statusAberto,
  "Em análise": tableStyles.statusEmAnalise,
  Resolvido: tableStyles.statusResolvido,
  Crítico: tableStyles.statusCritico,
};

export function AlertsManagement() {
  const {
    alerts,
    stations: hookStations,
    sensors: hookSensors,
    loading,
    error: apiError,
    createAlert,
    updateAlert,
    deleteAlert,
    acknowledgeAlert,
    getSensorsForStation: hookGetSensorsForStation,
  } = useAlerts();

  const stations = hookStations.length > 0 ? hookStations : stationsCatalog;
  const sensors = hookSensors.length > 0 ? hookSensors : sensorsCatalog;

  const [currentPage, setCurrentPage] = useState(1);

  // Unified Details / Edit / Delete Modal state
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Edit form state (Database fields: alert_configs)
  const [editMessage, setEditMessage] = useState("");
  const [editStationId, setEditStationId] = useState<number>(1);
  const [editSensorId, setEditSensorId] = useState<number>(1);
  const [editOperator, setEditOperator] = useState<ComparisonOperator>("<");
  const [editReferenceValue, setEditReferenceValue] = useState("20.00");
  const [editActive, setEditActive] = useState<boolean>(true);
  const [editStatus, setEditStatus] = useState<AlertStatus>("Aberto");
  const [editError, setEditError] = useState("");

  // New alert modal state (Database fields: alert_configs)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [newStationId, setNewStationId] = useState<number>(1);
  const [newSensorId, setNewSensorId] = useState<number>(1);
  const [newOperator, setNewOperator] = useState<ComparisonOperator>("<");
  const [newReferenceValue, setNewReferenceValue] = useState("20.00");
  const [newActive, setNewActive] = useState<boolean>(true);
  const [newStatus, setNewStatus] = useState<AlertStatus>("Aberto");
  const [newError, setNewError] = useState("");
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const [filters, setFilters] = useState<AlertFiltersState>({
    search: "",
    type: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  // Helpers to get sensors for a station
  const getSensorsForStation = (stationId: number) => {
    const list = hookGetSensorsForStation(stationId);
    if (list.length > 0) return list;
    const fallbackList = sensors.filter((s) => s.stationId === stationId);
    return fallbackList.length > 0 ? fallbackList : sensors.slice(0, 6);
  };

  const currentNewSensors = getSensorsForStation(newStationId);
  const currentNewSensor = currentNewSensors.find((s) => s.id === newSensorId) || currentNewSensors[0];

  const currentEditSensors = getSensorsForStation(editStationId);
  const currentEditSensor = currentEditSensors.find((s) => s.id === editSensorId) || currentEditSensors[0];

  // Open detail view
  const handleOpenDetail = (alert: AlertItem) => {
    setSelectedAlert(alert);
    setIsEditing(false);
    setIsConfirmingDelete(false);
  };

  const handleCloseDetailModal = () => {
    setSelectedAlert(null);
    setIsEditing(false);
    setIsConfirmingDelete(false);
    setEditError("");
  };

  // Start edit mode
  const handleStartEdit = (alertToEdit?: AlertItem) => {
    const alert = alertToEdit || selectedAlert;
    if (!alert) return;

    setSelectedAlert(alert);
    setEditMessage(alert.message || alert.description);
    setEditStationId(alert.stationId || 1);
    setEditSensorId(alert.sensorId || 1);
    setEditOperator(alert.comparisonOperator || "<");
    setEditReferenceValue(String(alert.referenceValue));
    setEditActive(alert.active ?? true);
    setEditStatus(alert.status);
    setEditError("");
    setIsEditing(true);
    setIsConfirmingDelete(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;

    if (!editMessage.trim()) {
      setEditError("Informe a mensagem do alerta (campo message).");
      return;
    }
    const numRef = parseFloat(editReferenceValue);
    if (isNaN(numRef)) {
      setEditError("Informe um valor de referência numérico válido.");
      return;
    }

    try {
      const updated = await updateAlert(selectedAlert.alertConfigId, {
        sensorId: editSensorId,
        referenceValue: numRef,
        comparisonOperator: editOperator,
        message: editMessage.trim(),
        active: editActive,
      });

      setSelectedAlert(updated);
      setIsEditing(false);
      setEditError("");
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Erro ao atualizar alerta.",
      );
    }
  };

  // Deletion handling
  const handleStartDelete = (alertToDelete?: AlertItem) => {
    const alert = alertToDelete || selectedAlert;
    if (!alert) return;

    setSelectedAlert(alert);
    setIsConfirmingDelete(true);
    setIsEditing(false);
  };

  const handleCancelDelete = () => {
    setIsConfirmingDelete(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAlert) return;

    try {
      await deleteAlert(selectedAlert.alertConfigId);
      setSelectedAlert(null);
      setIsConfirmingDelete(false);
      setIsEditing(false);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Erro ao excluir alerta.",
      );
    }
  };

  const handleAcknowledge = async () => {
    if (!selectedAlert) return;
    try {
      const targetId =
        selectedAlert.triggeredAlertId || selectedAlert.alertConfigId;
      await acknowledgeAlert(targetId);
      setSelectedAlert((prev) =>
        prev
          ? {
              ...prev,
              status: "Em análise",
              acknowledgedBy: "Carlos Mendes",
              acknowledgedAt: new Date().toISOString(),
            }
          : null,
      );
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Erro ao reconhecer alerta.",
      );
    }
  };

  // New Alert handlers
  const handleOpenNewModal = () => {
    const defaultStation = stations[0] || stationsCatalog[0];
    const sensorsList = getSensorsForStation(defaultStation.id);
    const defaultSensor = sensorsList[0] || sensors[0] || sensorsCatalog[0];

    setNewMessage("");
    setNewStationId(defaultStation.id);
    setNewSensorId(defaultSensor.id);
    setNewOperator(defaultSensor.defaultOperator);
    setNewReferenceValue(String(defaultSensor.defaultReference));
    setNewActive(true);
    setNewStatus("Aberto");
    setNewError("");
    setIsNewModalOpen(true);
  };

  const handleCloseNewModal = () => {
    setIsNewModalOpen(false);
    setNewError("");
  };

  const handleNewStationChange = (stationId: number) => {
    setNewStationId(stationId);
    const sensors = getSensorsForStation(stationId);
    if (sensors.length > 0) {
      setNewSensorId(sensors[0].id);
      setNewOperator(sensors[0].defaultOperator);
      setNewReferenceValue(String(sensors[0].defaultReference));
    }
  };

  const handleNewSensorChange = (sensorId: number) => {
    setNewSensorId(sensorId);
    const sensor =
      sensors.find((s) => s.id === sensorId) ||
      sensorsCatalog.find((s) => s.id === sensorId);
    if (sensor) {
      setNewOperator(sensor.defaultOperator);
      setNewReferenceValue(String(sensor.defaultReference));
    }
  };

  const handleEditStationChange = (stationId: number) => {
    setEditStationId(stationId);
    const sensorList = getSensorsForStation(stationId);
    if (sensorList.length > 0) {
      setEditSensorId(sensorList[0].id);
      setEditOperator(sensorList[0].defaultOperator);
      setEditReferenceValue(String(sensorList[0].defaultReference));
    }
  };

  const handleEditSensorChange = (sensorId: number) => {
    setEditSensorId(sensorId);
    const sensor =
      sensors.find((s) => s.id === sensorId) ||
      sensorsCatalog.find((s) => s.id === sensorId);
    if (sensor) {
      setEditOperator(sensor.defaultOperator);
      setEditReferenceValue(String(sensor.defaultReference));
    }
  };

  const handleToggleNewActive = () => {
    setNewActive((prev) => !prev);
  };

  const handleToggleEditActive = () => {
    setEditActive((prev) => !prev);
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      setNewError("Informe a mensagem do alerta (campo message).");
      return;
    }
    const numRef = parseFloat(newReferenceValue);
    if (isNaN(numRef)) {
      setNewError("Informe um valor de referência numérico válido.");
      return;
    }

    try {
      const created = await createAlert({
        sensorId: newSensorId,
        referenceValue: numRef,
        comparisonOperator: newOperator,
        message: newMessage.trim(),
        active: newActive,
        managerUserId: 1,
      });

      setIsNewModalOpen(false);
      setSelectedAlert(created);
      setIsEditing(false);
      setIsConfirmingDelete(false);
    } catch (err) {
      setNewError(
        err instanceof Error ? err.message : "Erro ao criar alerta.",
      );
    }
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

  return (
    <div className={styles.container}>
      {/* Global Toolbar with Search, Toggle Sidebar and New Alert Button */}
      <div className={styles.toolbar}>
        <div className={styles.searchActions}>
          <SearchInput
            label="Buscar por estação, sensor ou descrição"
            placeholder="Buscar por estação, sensor ou descrição..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            onClear={() => handleFilterChange("search", "")}
          />

          <button
            type="button"
            className={styles.toggleSidebarBtn}
            onClick={() => setIsSidebarVisible((prev) => !prev)}
            title={
              isSidebarVisible
                ? "Ocultar filtros e expandir largura total da tabela"
                : "Mostrar filtros e ranking lateral"
            }
          >
            {isSidebarVisible ? (
              <>
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
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="15" y1="3" x2="15" y2="21" />
                  <polyline points="10 9 7 12 10 15" />
                </svg>
                <span>Expandir tabela</span>
              </>
            ) : (
              <>
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
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="15" y1="3" x2="15" y2="21" />
                  <polyline points="18 9 21 12 18 15" />
                </svg>
                <span>Mostrar filtros</span>
              </>
            )}
          </button>
        </div>

        <Button
          className={styles.newAlertButton}
          onClick={handleOpenNewModal}
        >
          <Icon name="plus" />
          Novo alerta
        </Button>
      </div>

      {/* Main Grid: Table Content + Optional Sidebar Column */}
      <div className={`${styles.layoutGrid} ${!isSidebarVisible ? styles.layoutGridFull : ""}`}>
        <div className={styles.mainContent}>
          {loading && alerts.length === 0 ? (
            <FeedbackState
              kind="loading"
              title="Carregando alertas..."
              description="Consultando o microsserviço de alertas em tempo real."
            />
          ) : apiError && alerts.length === 0 ? (
            <FeedbackState
              kind="error"
              title="Falha ao carregar alertas"
              description={apiError}
            />
          ) : (
            <AlertsTable
              alerts={filteredAlerts}
              totalAlerts={filteredAlerts.length}
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              onViewDetails={handleOpenDetail}
              selectedAlertId={selectedAlert?.id}
            />
          )}
        </div>

        {/* Right Sidebar Column: 1. Filtros, 2. Estações com mais alertas */}
        {isSidebarVisible && (
          <AlertsSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            topStations={topStationsWithAlerts}
          />
        )}
      </div>

      {/* ========================================================================= */}
      {/* UNIFIED MODAL: DETAILS, EDITING & DELETION (STATIONS PAGE DESIGN PATTERN) */}
      {/* ========================================================================= */}
      {selectedAlert && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-unified-title"
          onClick={handleCloseDetailModal}
        >
          <div
            className={styles.modalCardContainer}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Navigation Bar */}
            <div className={styles.modalTopNav}>
              <Button
                variant="secondary"
                onClick={handleCloseDetailModal}
              >
                ← Voltar para a lista
              </Button>

              <div className={styles.modalHeaderActions}>
                {!isEditing && !isConfirmingDelete && (
                  <>
                    {selectedAlert.status !== "Resolvido" && (
                      <button
                        type="button"
                        className={styles.btnEditModal}
                        onClick={handleAcknowledge}
                        title="Reconhecer alerta operacional"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Reconhecer
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.btnEditModal}
                      onClick={() => handleStartEdit()}
                      title="Editar alerta"
                    >
                      <svg
                        width="14"
                        height="14"
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
                    </button>
                    <button
                      type="button"
                      className={styles.btnDeleteModal}
                      onClick={() => handleStartDelete()}
                      title="Excluir alerta"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                      Excluir
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className={styles.modalCloseIconBtn}
                  onClick={handleCloseDetailModal}
                  title="Fechar"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* In-Modal Inline Deletion Confirmation Box */}
            {isConfirmingDelete && (
              <div className={styles.confirmDeleteBox}>
                <h4 className={styles.confirmDeleteTitle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Confirmar Exclusão do Alerta
                </h4>
                <p className={styles.confirmDeleteDesc}>
                  Tem certeza que deseja excluir o alerta <strong>{selectedAlert.id}</strong> (<em>{selectedAlert.description}</em>) vinculado à <strong>{selectedAlert.station}</strong>? Esta ação removerá o alerta do histórico operacional e não poderá ser desfeita.
                </p>
                <div className={styles.confirmDeleteActions}>
                  <Button
                    variant="secondary"
                    onClick={handleCancelDelete}
                  >
                    Cancelar
                  </Button>
                  <button
                    type="button"
                    className={styles.btnConfirmDelete}
                    onClick={handleConfirmDelete}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Confirmar Exclusão
                  </button>
                </div>
              </div>
            )}

            {/* In-Modal Edit Mode */}
            {isEditing ? (
              <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div className={styles.modalHeadingGroup}>
                  <h2 id="modal-unified-title" className={styles.modalMainTitle}>
                    Editar Alerta {selectedAlert.id}
                  </h2>
                  <p className={styles.modalSubtitle}>
                    Atualize a regra de monitoramento (alert_configs) e os parâmetros do sensor.
                  </p>
                </div>

                <div className={styles.formCardsGrid}>
                  {/* Card 1: Configuração da Regra (alert_configs) */}
                  <div className={styles.formBoxCard}>
                    <div className={styles.boxHeader}>
                      <div className={styles.boxIconWrapper}>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={styles.boxTitle}>Configuração da Regra</h3>
                        <p className={styles.boxDesc}>Mensagem, operador de disparo e valor de referência.</p>
                      </div>
                    </div>

                    <div className={styles.boxFields}>
                      <div className={styles.formGroupItem}>
                        <label className={styles.fieldLabel}>
                          Mensagem de notificação (message) <span className={styles.requiredStar}>*</span>
                        </label>
                        <div className={styles.inputWithIcon}>
                          <svg
                            className={`${styles.fieldIcon} ${styles.textareaIcon}`}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          <textarea
                            rows={2}
                            value={editMessage}
                            onChange={(e) => setEditMessage(e.target.value)}
                            placeholder="Ex: Umidade do solo crítica abaixo de 20%"
                            maxLength={200}
                            required
                          />
                        </div>
                      </div>

                      <div className={styles.formGroupItem}>
                        <label className={styles.fieldLabel}>
                          Operador de comparação (comparison_operator) <span className={styles.requiredStar}>*</span>
                        </label>
                        <div className={styles.inputWithIcon}>
                          <svg
                            className={styles.fieldIcon}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="16 18 22 12 16 6" />
                            <polyline points="8 6 2 12 8 18" />
                          </svg>
                          <select
                            value={editOperator}
                            onChange={(e) => setEditOperator(e.target.value as ComparisonOperator)}
                          >
                            {comparisonOperatorsList.map((op) => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className={styles.formGroupItem}>
                        <label className={styles.fieldLabel}>
                          Valor de referência (reference_value) <span className={styles.requiredStar}>*</span>
                        </label>
                        <div className={styles.inputWithIcon}>
                          <svg
                            className={styles.fieldIcon}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                          <input
                            type="number"
                            step="any"
                            value={editReferenceValue}
                            onChange={(e) => setEditReferenceValue(e.target.value)}
                            placeholder="Ex: 20.00"
                            required
                          />
                        </div>
                      </div>

                      {/* Active toggle switch */}
                      <div className={styles.toggleRow} onClick={handleToggleEditActive}>
                        <div
                          className={`${styles.toggleSwitch} ${
                            editActive ? styles.toggleOn : styles.toggleOff
                          }`}
                        >
                          <div className={styles.toggleThumb} />
                        </div>
                        <div className={styles.toggleTextGroup}>
                          <span className={styles.toggleLabel}>Regra de Alerta Ativa</span>
                          <span className={styles.toggleDesc}>
                            {editActive
                              ? "Monitoramento contínuo habilitado no pipeline"
                              : "Regra pausada temporariamente"}
                          </span>
                        </div>
                      </div>

                      <div className={styles.formGroupItem}>
                        <label className={styles.fieldLabel}>
                          Status operacional <span className={styles.requiredStar}>*</span>
                        </label>
                        <div className={styles.inputWithIcon}>
                          <svg
                            className={styles.fieldIcon}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as AlertStatus)}
                          >
                            {alertStatuses.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Hardware e Sensor Vinculado */}
                  <div className={styles.formBoxCard}>
                    <div className={styles.boxHeader}>
                      <div className={styles.boxIconWrapper}>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4.93 4.93a10 10 0 0 1 14.14 0" />
                          <path d="M7.76 7.76a6 6 0 0 1 8.48 0" />
                          <circle cx="12" cy="12" r="2" />
                          <path d="M12 14v8" />
                          <path d="M9 22h6" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={styles.boxTitle}>Hardware e Sensor Vinculado</h3>
                        <p className={styles.boxDesc}>Estação meteorológica e sensor correspondente.</p>
                      </div>
                    </div>

                    <div className={styles.boxFields}>
                      <div className={styles.formGroupItem}>
                        <label className={styles.fieldLabel}>
                          Estação vinculada <span className={styles.requiredStar}>*</span>
                        </label>
                        <div className={styles.inputWithIcon}>
                          <svg
                            className={styles.fieldIcon}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                          <select
                            value={editStationId}
                            onChange={(e) => handleEditStationChange(Number(e.target.value))}
                          >
                            {stations.map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.name} — {st.property}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className={styles.formGroupItem}>
                        <label className={styles.fieldLabel}>
                          Sensor monitorado <span className={styles.requiredStar}>*</span>
                        </label>
                        <div className={styles.inputWithIcon}>
                          <svg
                            className={styles.fieldIcon}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="4" />
                            <line x1="12" y1="2" x2="12" y2="4" />
                            <line x1="12" y1="20" x2="12" y2="22" />
                          </svg>
                          <select
                            value={editSensorId}
                            onChange={(e) => handleEditSensorChange(Number(e.target.value))}
                          >
                            {currentEditSensors.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.localIdentifier} — {s.sensorName} ({s.unitOfMeasure})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className={styles.rulePreviewBox}>
                        <div>
                          <div className={styles.rulePreviewTitle}>Condição Avaliada</div>
                          <div style={{ fontSize: 11, color: "#617364", marginTop: 2 }}>
                            Gera evento em <code>triggered_alerts</code>
                          </div>
                        </div>
                        <span className={styles.rulePreviewCode}>
                          {currentEditSensor?.localIdentifier || "SENSOR"} {editOperator}{" "}
                          {editReferenceValue || "0"} {currentEditSensor?.unitOfMeasure}
                        </span>
                      </div>

                      <div className={styles.requirementsList}>
                        <div className={styles.reqItem}>
                          <span className={styles.reqCheck}>✓</span>
                          <span>Atualização imediata dos registros em <code>alert_configs</code>.</span>
                        </div>
                        <div className={styles.reqItem}>
                          <span className={styles.reqCheck}>✓</span>
                          <span>Preserva o histórico de telemetria e leituras disparadas.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {editError && <p className={styles.formErrorMsg}>{editError}</p>}

                <div className={styles.modalBottomActions}>
                  <Button
                    variant="secondary"
                    onClick={handleCancelEdit}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                  >
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            ) : (
              /* In-Modal Details View Mode */
              <>
                <div className={styles.detailHeaderBlock}>
                  <div className={styles.detailTitleWithBadge}>
                    <div className={styles.alertBadgeIconLarge}>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </div>
                    <div>
                      <div className={styles.detailNameRow}>
                        <h2 id="modal-unified-title" className={styles.detailAlertTitle}>
                          {selectedAlert.message || selectedAlert.description}
                        </h2>
                        <span className={`${tableStyles.statusBadge} ${statusClassMap[selectedAlert.status]}`}>
                          <span className={tableStyles.statusDot} />
                          {selectedAlert.status}
                        </span>
                      </div>
                      <p className={styles.detailSubtext}>
                        Alerta <code>{selectedAlert.id}</code> • Regra <code>#{selectedAlert.alertConfigId || 1}</code> • Estação <strong>{selectedAlert.station}</strong> • Registrado em <strong>{selectedAlert.timestamp}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 1: Regra de Monitoramento (alert_configs) */}
                <div className={styles.detailSectionCard}>
                  <h3 className={styles.detailSectionTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Regra de Monitoramento (alert_configs)
                  </h3>

                  <div className={styles.infoTilesGrid}>
                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>ID da Regra</span>
                      <span className={styles.infoTileValue}>
                        <code>#{selectedAlert.alertConfigId || 1}</code>
                      </span>
                    </div>

                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>Condição de Disparo</span>
                      <span className={styles.infoTileValue}>
                        <span className={styles.rulePreviewCode}>
                          {selectedAlert.sensor} {selectedAlert.comparisonOperator} {selectedAlert.referenceValue} {selectedAlert.unitOfMeasure}
                        </span>
                      </span>
                    </div>

                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>Operador</span>
                      <span className={styles.infoTileValue}>
                        <code>{selectedAlert.comparisonOperator}</code>
                      </span>
                    </div>

                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>Valor de Referência</span>
                      <span className={styles.infoTileValue}>
                        <strong>{selectedAlert.referenceValue} {selectedAlert.unitOfMeasure}</strong>
                      </span>
                    </div>

                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>Sensor Monitorado</span>
                      <span className={styles.infoTileValue} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <code>{selectedAlert.sensor}</code> {selectedAlert.sensorName ? `(${selectedAlert.sensorName})` : ""}
                        <span className={`${tableStyles.typeBadge} ${typeClassMap[selectedAlert.type] || tableStyles.typeSensor}`}>
                          {selectedAlert.type}
                        </span>
                      </span>
                    </div>

                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>Status da Regra</span>
                      <span className={styles.infoTileValue}>
                        <span style={{ color: selectedAlert.active !== false ? "#284430" : "#718173", fontWeight: 700 }}>
                          ● {selectedAlert.active !== false ? "Ativo" : "Inativo"}
                        </span>
                      </span>
                    </div>

                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>Gestor Responsável</span>
                      <span className={styles.infoTileValue}>
                        {selectedAlert.managerName || "Carlos Mendes"}
                      </span>
                    </div>

                    <div className={styles.infoTileItem} style={{ gridColumn: "span 2" }}>
                      <span className={styles.infoTileLabel}>Estação e Propriedade</span>
                      <span className={styles.infoTileValue}>
                        {selectedAlert.station} — {selectedAlert.property || "Fazenda Santa Maria"}
                      </span>
                    </div>

                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>MAC da Estação</span>
                      <span className={styles.infoTileValue}>
                        <code>{selectedAlert.macAddress || "00:1B:44:11:3A:B7"}</code>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Histórico do Disparo (triggered_alerts) */}
                <div className={styles.detailSectionCard}>
                  <h3 className={styles.detailSectionTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    Histórico do Disparo (triggered_alerts)
                  </h3>

                  <div className={styles.infoTilesGrid}>
                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>ID do Evento</span>
                      <span className={styles.infoTileValue}>
                        <code>{selectedAlert.id}</code>
                      </span>
                    </div>

                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>Leitura Registrada</span>
                      <span className={styles.infoTileValue}>
                        <strong>{selectedAlert.readingValue ?? selectedAlert.referenceValue} {selectedAlert.unitOfMeasure}</strong>
                      </span>
                    </div>

                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>Data e Hora do Disparo</span>
                      <span className={styles.infoTileValue}>{selectedAlert.timestamp}</span>
                    </div>

                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>Reconhecimento</span>
                      <span className={styles.infoTileValue}>
                        {selectedAlert.acknowledgedBy
                          ? `${selectedAlert.acknowledgedBy} (${selectedAlert.acknowledgedAt})`
                          : "Pendente de reconhecimento"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Mensagem de Notificação */}
                <div className={styles.detailSectionCard}>
                  <h3 className={styles.detailSectionTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Mensagem de Notificação
                  </h3>
                  <div className={styles.detailDescBox}>
                    {selectedAlert.message || selectedAlert.description}
                  </div>
                </div>

                {/* Section 4: Orientações Operacionais */}
                <div className={styles.detailSectionCard}>
                  <h3 className={styles.detailSectionTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    Procedimentos Recomendados
                  </h3>
                  <div className={styles.actionsChecklist}>
                    <div className={styles.actionCheckItem}>
                      <div className={styles.actionStepDot}>1</div>
                      <span>Verificar a telemetria física do sensor <strong>{selectedAlert.sensor}</strong> na estação <strong>{selectedAlert.station}</strong>.</span>
                    </div>
                    <div className={styles.actionCheckItem}>
                      <div className={styles.actionStepDot}>2</div>
                      <span>Inspecionar as condições de microclima e solo no talhão correspondente na propriedade <strong>{selectedAlert.property}</strong>.</span>
                    </div>
                    <div className={styles.actionCheckItem}>
                      <div className={styles.actionStepDot}>3</div>
                      <span>Registrar acknowledgement ou atualizar o status operacional para &quot;Resolvido&quot; após a intervenção técnica.</span>
                    </div>
                  </div>
                </div>

                <div className={styles.modalBottomActions}>
                  <Button
                    variant="secondary"
                    onClick={handleCloseDetailModal}
                  >
                    Fechar
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE ALERT MODAL (MATCHING 2-COLUMN STATIONS PAGE DESIGN PATTERN)      */}
      {/* ========================================================================= */}
      {isNewModalOpen && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-create-alert-title"
          onClick={handleCloseNewModal}
        >
          <div
            className={styles.modalCardContainer}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Navigation */}
            <div className={styles.modalTopNav}>
              <Button
                variant="secondary"
                onClick={handleCloseNewModal}
              >
                ← Voltar para a lista
              </Button>

              <button
                type="button"
                className={styles.modalCloseIconBtn}
                onClick={handleCloseNewModal}
                title="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Heading Group */}
            <div className={styles.modalHeadingGroup}>
              <h2 id="modal-create-alert-title" className={styles.modalMainTitle}>
                Criar Alerta
              </h2>
              <p className={styles.modalSubtitle}>
                Cadastre uma nova regra de monitoramento (alert_configs) para detecção automática de incidentes.
              </p>
            </div>

            {/* Form in 2-Card Grid */}
            <form onSubmit={handleCreateAlert} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className={styles.formCardsGrid}>
                {/* Card 1: Configuração da Regra (alert_configs) */}
                <div className={styles.formBoxCard}>
                  <div className={styles.boxHeader}>
                    <div className={styles.boxIconWrapper}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={styles.boxTitle}>Configuração da Regra</h3>
                      <p className={styles.boxDesc}>Mensagem, operador de disparo e valor de referência.</p>
                    </div>
                  </div>

                  <div className={styles.boxFields}>
                    <div className={styles.formGroupItem}>
                      <label className={styles.fieldLabel}>
                        Mensagem de notificação (message) <span className={styles.requiredStar}>*</span>
                      </label>
                      <div className={styles.inputWithIcon}>
                        <svg
                          className={`${styles.fieldIcon} ${styles.textareaIcon}`}
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <textarea
                          rows={2}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Ex: Umidade do solo crítica abaixo de 20%"
                          maxLength={200}
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.formGroupItem}>
                      <label className={styles.fieldLabel}>
                        Operador de comparação (comparison_operator) <span className={styles.requiredStar}>*</span>
                      </label>
                      <div className={styles.inputWithIcon}>
                        <svg
                          className={styles.fieldIcon}
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                        <select
                          value={newOperator}
                          onChange={(e) => setNewOperator(e.target.value as ComparisonOperator)}
                        >
                          {comparisonOperatorsList.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGroupItem}>
                      <label className={styles.fieldLabel}>
                        Valor de referência (reference_value) <span className={styles.requiredStar}>*</span>
                      </label>
                      <div className={styles.inputWithIcon}>
                        <svg
                          className={styles.fieldIcon}
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        <input
                          type="number"
                          step="any"
                          value={newReferenceValue}
                          onChange={(e) => setNewReferenceValue(e.target.value)}
                          placeholder="Ex: 20.00"
                          required
                        />
                      </div>
                    </div>

                    {/* Active toggle switch */}
                    <div className={styles.toggleRow} onClick={handleToggleNewActive}>
                      <div
                        className={`${styles.toggleSwitch} ${
                          newActive ? styles.toggleOn : styles.toggleOff
                        }`}
                      >
                        <div className={styles.toggleThumb} />
                      </div>
                      <div className={styles.toggleTextGroup}>
                        <span className={styles.toggleLabel}>Regra de Alerta Ativa</span>
                        <span className={styles.toggleDesc}>
                          {newActive
                            ? "Monitoramento contínuo habilitado no pipeline"
                            : "Regra pausada temporariamente"}
                        </span>
                      </div>
                    </div>

                    <div className={styles.formGroupItem}>
                      <label className={styles.fieldLabel}>
                        Status inicial <span className={styles.requiredStar}>*</span>
                      </label>
                      <div className={styles.inputWithIcon}>
                        <svg
                          className={styles.fieldIcon}
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as AlertStatus)}
                        >
                          {alertStatuses.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Hardware e Sensor Vinculado */}
                <div className={styles.formBoxCard}>
                  <div className={styles.boxHeader}>
                    <div className={styles.boxIconWrapper}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4.93 4.93a10 10 0 0 1 14.14 0" />
                        <path d="M7.76 7.76a6 6 0 0 1 8.48 0" />
                        <circle cx="12" cy="12" r="2" />
                        <path d="M12 14v8" />
                        <path d="M9 22h6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={styles.boxTitle}>Hardware e Sensor Vinculado</h3>
                      <p className={styles.boxDesc}>Estação meteorológica e sensor correspondente.</p>
                    </div>
                  </div>

                  <div className={styles.boxFields}>
                    <div className={styles.formGroupItem}>
                      <label className={styles.fieldLabel}>
                        Estação vinculada <span className={styles.requiredStar}>*</span>
                      </label>
                      <div className={styles.inputWithIcon}>
                        <svg
                          className={styles.fieldIcon}
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <select
                          value={newStationId}
                          onChange={(e) => handleNewStationChange(Number(e.target.value))}
                        >
                          {stations.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name} — {st.property}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGroupItem}>
                      <label className={styles.fieldLabel}>
                        Sensor monitorado <span className={styles.requiredStar}>*</span>
                      </label>
                      <div className={styles.inputWithIcon}>
                        <svg
                          className={styles.fieldIcon}
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <circle cx="12" cy="12" r="4" />
                          <line x1="12" y1="2" x2="12" y2="4" />
                          <line x1="12" y1="20" x2="12" y2="22" />
                        </svg>
                        <select
                          value={newSensorId}
                          onChange={(e) => handleNewSensorChange(Number(e.target.value))}
                        >
                          {currentNewSensors.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.localIdentifier} — {s.sensorName} ({s.unitOfMeasure})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.rulePreviewBox}>
                      <div>
                        <div className={styles.rulePreviewTitle}>Condição Avaliada</div>
                        <div style={{ fontSize: 11, color: "#617364", marginTop: 2 }}>
                          Gera evento em <code>triggered_alerts</code>
                        </div>
                      </div>
                      <span className={styles.rulePreviewCode}>
                        {currentNewSensor?.localIdentifier || "SENSOR"} {newOperator}{" "}
                        {newReferenceValue || "0"} {currentNewSensor?.unitOfMeasure}
                      </span>
                    </div>

                    <div className={styles.requirementsList}>
                      <div className={styles.reqItem}>
                        <span className={styles.reqCheck}>✓</span>
                        <span>Registro imediato na tabela <code>alert_configs</code>.</span>
                      </div>
                      <div className={styles.reqItem}>
                        <span className={styles.reqCheck}>✓</span>
                        <span>Avaliação contínua das leituras de telemetria recebidas via IoT.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {newError && <p className={styles.formErrorMsg}>{newError}</p>}

              <div className={styles.modalBottomActions}>
                <Button
                  variant="secondary"
                  onClick={handleCloseNewModal}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                >
                  Criar Alerta
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
