"use client";

import React, { useEffect, useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout/PortalLayout";
import { Icon } from "@/components/ui/Icon/Icon";
import { alertRepository } from "@/features/alerts/repositories";
import type { SensorCatalogItem, StationCatalogItem } from "@/features/alerts/mocks/alertsData";
import styles from "./App.module.css";

export type ComparisonOperator = ">" | "<" | ">=" | "<=" | "=" | "!=";

export interface AlertRule {
  id: number;
  sensorType: string;
  operator: ComparisonOperator;
  value: number;
  message: string;
  stations: string[];
  active: boolean;
  sensorId?: number;
}

const initialAlertRules: AlertRule[] = [
  {
    id: 1,
    sensorType: "Temperatura",
    operator: ">",
    value: 35,
    message: "Risco de estresse térmico na plantação",
    stations: ["Estação 01", "Estação 02"],
    active: true,
  },
  {
    id: 2,
    sensorType: "Umidade",
    operator: "<",
    value: 30,
    message: "Solo com baixa umidade, avaliar irrigação",
    stations: ["Todas as estações"],
    active: true,
  },
  {
    id: 3,
    sensorType: "Velocidade do Vento",
    operator: ">=",
    value: 60,
    message: "Condição de vento perigosa para pulverização",
    stations: ["Estação A - Parreirais"],
    active: false,
  },
];

const sensorOptions: string[] = [
  "Temperatura",
  "Umidade",
  "Velocidade do Vento",
  "Chuva",
];

const sensorUnits: Record<string, string> = {
  Temperatura: "°C",
  Umidade: "%",
  "Velocidade do Vento": "km/h",
  Chuva: "mm",
};

const operatorOptions: { label: string; value: ComparisonOperator }[] = [
  { label: "maior que", value: ">" },
  { label: "menor que", value: "<" },
  { label: "maior ou igual", value: ">=" },
  { label: "menor ou igual", value: "<=" },
  { label: "igual a", value: "=" },
  { label: "diferente de", value: "!=" },
];

const availableStations: string[] = [
  "Estação 01",
  "Estação 02",
  "Estação 03",
  "Estação A - Parreirais",
  "Fazenda Santa Rita",
  "Fazenda Boa Vista",
  "Todas as estações",
];

function formatCondition(
  sensor: string,
  operator: string,
  value: number
): string {
  const unit = sensorUnits[sensor] || "";
  const unitSuffix = unit
    ? unit.startsWith("°") || unit === "%"
      ? unit
      : ` ${unit}`
    : "";
  return `${sensor} ${operator} ${value}${unitSuffix}`;
}

function resolveSensorId(
  sensorType: string,
  catalogSensors: SensorCatalogItem[]
): number {
  if (catalogSensors && catalogSensors.length > 0) {
    const found = catalogSensors.find(
      (s) =>
        s.sensorName.toLowerCase().includes(sensorType.toLowerCase()) ||
        s.type.toLowerCase().includes(sensorType.toLowerCase())
    );
    if (found) return found.id;
  }
  const lower = sensorType.toLowerCase();
  if (lower.includes("umid")) return 1;
  if (lower.includes("temp")) return 2;
  if (lower.includes("vent")) return 4;
  if (lower.includes("chuv")) return 5;
  if (lower.includes("bat")) return 6;
  return 1;
}

export default function RegrasPage() {
  const [rules, setRules] = useState<AlertRule[]>(initialAlertRules);
  const [sensorsCatalog, setSensorsCatalog] = useState<SensorCatalogItem[]>([]);
  const [stationsCatalog, setStationsCatalog] = useState<StationCatalogItem[]>([]);
  const stationNames = stationsCatalog.length > 0 ? stationsCatalog.map((s) => s.name) : availableStations;
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [alertData, stations, sensors] = await Promise.all([
          alertRepository.listAlerts({ limit: 100 }),
          alertRepository.listStations(),
          alertRepository.listSensors(),
        ]);

        if (active) {
          setStationsCatalog(stations);
          setSensorsCatalog(sensors);

          if (alertData.items.length > 0) {
            const mapped: AlertRule[] = alertData.items.map((item) => ({
              id: item.alertConfigId,
              sensorType: item.type || "Temperatura",
              operator: item.comparisonOperator,
              value: item.referenceValue,
              message: item.message,
              stations: [item.station || "Estação 01"],
              active: item.active,
              sensorId: item.sensorId,
            }));
            setRules(mapped);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar regras de alerta:", err);
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, []);

  const [editSensor, setEditSensor] = useState("Temperatura");
  const [editOperator, setEditOperator] = useState<ComparisonOperator>(">");
  const [editValue, setEditValue] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editStations, setEditStations] = useState<string[]>([]);
  const [editActive, setEditActive] = useState(true);
  const [editError, setEditError] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSensor, setNewSensor] = useState("Temperatura");
  const [newOperator, setNewOperator] = useState<ComparisonOperator>(">");
  const [newValue, setNewValue] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newStations, setNewStations] = useState<string[]>([]);
  const [newActive, setNewActive] = useState(true);
  const [newError, setNewError] = useState("");

  const handleRowClick = (rule: AlertRule) => {
    setSelectedRule(rule);
    setIsEditing(false);
    setIsConfirmingDelete(false);
    setEditSensor(rule.sensorType);
    setEditOperator(rule.operator);
    setEditValue(String(rule.value));
    setEditMessage(rule.message);
    setEditStations([...rule.stations]);
    setEditActive(rule.active);
    setEditError("");
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRule(null);
    setIsEditing(false);
    setIsConfirmingDelete(false);
    setEditError("");
  };

  const handleStartEdit = () => {
    if (!selectedRule) return;
    setEditSensor(selectedRule.sensorType);
    setEditOperator(selectedRule.operator);
    setEditValue(String(selectedRule.value));
    setEditMessage(selectedRule.message);
    setEditStations([...selectedRule.stations]);
    setEditActive(selectedRule.active);
    setEditError("");
    setIsConfirmingDelete(false);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!selectedRule) return;
    setEditSensor(selectedRule.sensorType);
    setEditOperator(selectedRule.operator);
    setEditValue(String(selectedRule.value));
    setEditMessage(selectedRule.message);
    setEditStations([...selectedRule.stations]);
    setEditActive(selectedRule.active);
    setEditError("");
    setIsEditing(false);
  };

  const handleAddEditStation = (stationName: string) => {
    if (!stationName) return;
    if (!editStations.includes(stationName)) {
      setEditStations((prev) => [...prev, stationName]);
      setEditError("");
    }
  };

  const handleRemoveEditStation = (stationName: string) => {
    setEditStations((prev) => prev.filter((item) => item !== stationName));
  };

  const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRule) return;

    if (!editSensor) {
      setEditError("Selecione o tipo de sensor.");
      return;
    }

    if (!editOperator) {
      setEditError("Selecione o operador de comparação.");
      return;
    }

    if (editValue === "" || isNaN(Number(editValue))) {
      setEditError("Informe um valor numérico válido.");
      return;
    }

    if (editStations.length === 0) {
      setEditError("Vincule ao menos uma estação à regra.");
      return;
    }

    if (!editMessage.trim()) {
      setEditError("A mensagem do alerta é obrigatória.");
      return;
    }

    const sensorId = selectedRule.sensorId || resolveSensorId(editSensor, sensorsCatalog);

    try {
      await alertRepository.updateAlertConfig(selectedRule.id, {
        sensorId,
        referenceValue: Number(editValue),
        comparisonOperator: editOperator,
        message: editMessage.trim(),
        active: editActive,
      });

      const updated: AlertRule = {
        ...selectedRule,
        sensorType: editSensor,
        operator: editOperator,
        value: Number(editValue),
        message: editMessage.trim(),
        stations: editStations,
        active: editActive,
        sensorId,
      };

      setRules((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setSelectedRule(updated);
      setIsEditing(false);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Erro ao salvar alterações no backend."
      );
    }
  };

  const handleDeleteRule = async () => {
    if (!selectedRule) return;
    try {
      await alertRepository.deleteAlertConfig(selectedRule.id);
      setRules((prev) => prev.filter((item) => item.id !== selectedRule.id));
      handleCloseDetailModal();
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Erro ao excluir regra no backend."
      );
    }
  };

  const handleOpenCreateModal = () => {
    setNewSensor("Temperatura");
    setNewOperator(">");
    setNewValue("");
    setNewMessage("");
    setNewStations([]);
    setNewActive(true);
    setNewError("");
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setNewError("");
  };

  const handleAddNewStation = (stationName: string) => {
    if (!stationName) return;
    if (!newStations.includes(stationName)) {
      setNewStations((prev) => [...prev, stationName]);
      setNewError("");
    }
  };

  const handleRemoveNewStation = (stationName: string) => {
    setNewStations((prev) => prev.filter((item) => item !== stationName));
  };

  const handleCreateRule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newSensor) {
      setNewError("Selecione o tipo de sensor.");
      return;
    }

    if (!newOperator) {
      setNewError("Selecione o operador de comparação.");
      return;
    }

    if (newValue === "" || isNaN(Number(newValue))) {
      setNewError("Informe um valor numérico válido.");
      return;
    }

    if (newStations.length === 0) {
      setNewError("Vincule ao menos uma estação à regra.");
      return;
    }

    if (!newMessage.trim()) {
      setNewError("A mensagem do alerta é obrigatória.");
      return;
    }

    const sensorId = resolveSensorId(newSensor, sensorsCatalog);

    try {
      const createdItem = await alertRepository.createAlertConfig({
        sensorId,
        referenceValue: Number(newValue),
        comparisonOperator: newOperator,
        message: newMessage.trim(),
        active: newActive,
        managerUserId: 1,
      });

      const created: AlertRule = {
        id: createdItem.alertConfigId,
        sensorType: newSensor,
        operator: newOperator,
        value: Number(newValue),
        message: newMessage.trim(),
        stations: newStations,
        active: newActive,
        sensorId,
      };

      setRules((prev) => [created, ...prev]);
      handleCloseCreateModal();
    } catch (err) {
      setNewError(
        err instanceof Error ? err.message : "Erro ao criar regra no backend."
      );
    }
  };


  return (
    <PortalLayout title="Regras de Alerta">
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headingGroup}>
            <h1 className={styles.title}>Regras de Alerta</h1>
            <p className={styles.subtitle}>
              Configure condições de aviso e vincule às estações desejadas
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className={styles.newRuleButton}
          >
            <Icon name="plus" />
            Nova regra
          </button>
        </header>

        <div className={styles.tableCard}>
          <div className={styles.scrollContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Condição</th>
                  <th>Mensagem</th>
                  <th>Estações associadas</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.emptyState}>
                      Nenhuma regra de alerta cadastrada.
                    </td>
                  </tr>
                ) : (
                  rules.map((rule) => {
                    const conditionText = formatCondition(
                      rule.sensorType,
                      rule.operator,
                      rule.value
                    );
                    const stationsText = rule.stations.join(", ");

                    return (
                      <tr
                        key={rule.id}
                        className={styles.tableRow}
                        onClick={() => handleRowClick(rule)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleRowClick(rule);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Ver detalhes da regra ${conditionText}`}
                      >
                        <td className={styles.conditionCell}>{conditionText}</td>
                        <td className={styles.messageCell}>{rule.message}</td>
                        <td className={styles.stationsCell}>{stationsText}</td>
                        <td className={styles.statusCell}>
                          <span
                            className={`${styles.statusBadge} ${
                              rule.active
                                ? styles.badgeActive
                                : styles.badgeInactive
                            }`}
                          >
                            <span className={styles.statusDot} />
                            {rule.active ? "Ativa" : "Inativa"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isDetailModalOpen && selectedRule && (
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
              <div className={styles.modalTopNav}>
                <button
                  type="button"
                  className={styles.btnVoltarLista}
                  onClick={isEditing ? handleCancelEdit : handleCloseDetailModal}
                >
                  {isEditing ? "← Cancelar edição" : "← Voltar para a lista"}
                </button>

                <div className={styles.modalHeaderActions}>
                  {!isEditing && !isConfirmingDelete && (
                    <>
                      <button
                        type="button"
                        className={styles.btnEditModal}
                        onClick={handleStartEdit}
                        title="Editar regra"
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
                        onClick={() => setIsConfirmingDelete(true)}
                        title="Excluir regra"
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

              {isConfirmingDelete && (
                <div className={styles.confirmDeleteBox}>
                  <h4 className={styles.confirmDeleteTitle}>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Confirmar Exclusão da Regra
                  </h4>
                  <p className={styles.confirmDeleteDesc}>
                    Tem certeza que deseja excluir a regra de alerta{" "}
                    <strong>#{selectedRule.id}</strong> (<em>{selectedRule.message}</em>)?
                    Esta ação removerá a condição de monitoramento automático e não poderá
                    ser desfeita.
                  </p>
                  <div className={styles.confirmDeleteActions}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => setIsConfirmingDelete(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className={styles.btnConfirmDelete}
                      onClick={handleDeleteRule}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Confirmar Exclusão
                    </button>
                  </div>
                </div>
              )}

              {isEditing ? (
                <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div className={styles.modalHeadingGroup}>
                    <h2 id="modal-unified-title" className={styles.modalMainTitle}>
                      Editar Regra #{selectedRule.id}
                    </h2>
                    <p className={styles.modalSubtitle}>
                      Atualize a condição de disparo, mensagem e estações vinculadas.
                    </p>
                  </div>

                  <div className={styles.formCardsGrid}>
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
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className={styles.boxTitle}>Configuração da Regra</h3>
                          <p className={styles.boxDesc}>Sensor, operador e valor de referência.</p>
                        </div>
                      </div>

                      <div className={styles.boxFields}>
                        <div className={styles.formGroupItem}>
                          <label className={styles.fieldLabel}>
                            Tipo de sensor <span className={styles.requiredStar}>*</span>
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
                              value={editSensor}
                              onChange={(e) => {
                                setEditSensor(e.target.value);
                                setEditError("");
                              }}
                            >
                              {sensorOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt} ({sensorUnits[opt] || ""})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className={styles.formGroupItem}>
                          <label className={styles.fieldLabel}>
                            Operador de comparação <span className={styles.requiredStar}>*</span>
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
                              onChange={(e) => {
                                setEditOperator(e.target.value as ComparisonOperator);
                                setEditError("");
                              }}
                            >
                              {operatorOptions.map((op) => (
                                <option key={op.value} value={op.value}>
                                  {op.label} ({op.value})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className={styles.formGroupItem}>
                          <label className={styles.fieldLabel}>
                            Valor de referência <span className={styles.requiredStar}>*</span>
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
                              value={editValue}
                              onChange={(e) => {
                                setEditValue(e.target.value);
                                setEditError("");
                              }}
                              placeholder="Ex: 35"
                              required
                            />
                          </div>
                        </div>

                        <div className={styles.rulePreviewBox}>
                          <div className={styles.rulePreviewTitle}>Condição Avaliada</div>
                          <span className={styles.rulePreviewCode}>
                            {editSensor} {editOperator} {editValue || "0"}{" "}
                            {sensorUnits[editSensor] || ""}
                          </span>
                        </div>

                        <div
                          className={styles.toggleRow}
                          onClick={() => setEditActive((prev) => !prev)}
                        >
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
                      </div>
                    </div>

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
                          <h3 className={styles.boxTitle}>Hardware e Estações Vinculadas</h3>
                          <p className={styles.boxDesc}>Associação de estações e mensagem aos gestores.</p>
                        </div>
                      </div>

                      <div className={styles.boxFields}>
                        <div className={styles.formGroupItem}>
                          <label className={styles.fieldLabel}>
                            Mensagem de notificação <span className={styles.requiredStar}>*</span>
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
                              maxLength={200}
                              value={editMessage}
                              onChange={(e) => {
                                setEditMessage(e.target.value);
                                setEditError("");
                              }}
                              placeholder="Ex: Risco de estresse térmico na plantação"
                              required
                            />
                          </div>
                          <span className={styles.charCount}>
                            {editMessage.length}/200 caracteres
                          </span>
                        </div>

                        <div className={styles.formGroupItem}>
                          <label className={styles.fieldLabel}>
                            Vincular estações <span className={styles.requiredStar}>*</span>
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
                              value=""
                              onChange={(e) => handleAddEditStation(e.target.value)}
                            >
                              <option value="" disabled>
                                Selecione uma estação para adicionar...
                              </option>
                              {stationNames
                                .filter((st) => !editStations.includes(st))
                                .map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div className={styles.chipsContainer}>
                            {editStations.map((st) => (
                              <span key={st} className={styles.chip}>
                                {st}
                                <button
                                  type="button"
                                  className={styles.chipRemoveBtn}
                                  onClick={() => handleRemoveEditStation(st)}
                                  aria-label={`Remover ${st}`}
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {editError && <p className={styles.formErrorMsg}>{editError}</p>}

                  <div className={styles.modalBottomActions}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={handleCancelEdit}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className={styles.btnPrimary}
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              ) : (
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
                            {selectedRule.message}
                          </h2>
                          <span
                            className={`${styles.statusBadge} ${
                              selectedRule.active
                                ? styles.badgeActive
                                : styles.badgeInactive
                            }`}
                          >
                            <span className={styles.statusDot} />
                            {selectedRule.active ? "Ativa" : "Inativa"}
                          </span>
                        </div>
                        <p className={styles.detailSubtext}>
                          Regra <code>#{selectedRule.id}</code> • Sensor <strong>{selectedRule.sensorType}</strong> • <strong>{selectedRule.stations.length}</strong> estação(ões) vinculada(s)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.detailSectionCard}>
                    <h3 className={styles.detailSectionTitle}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      Parâmetros da Regra
                    </h3>

                    <div className={styles.infoTilesGrid}>
                      <div className={styles.infoTileItem}>
                        <span className={styles.infoTileLabel}>ID da Regra</span>
                        <span className={styles.infoTileValue}>
                          <code>#{selectedRule.id}</code>
                        </span>
                      </div>

                      <div className={styles.infoTileItem}>
                        <span className={styles.infoTileLabel}>Condição de Disparo</span>
                        <span className={styles.infoTileValue}>
                          <span className={styles.rulePreviewCode}>
                            {formatCondition(
                              selectedRule.sensorType,
                              selectedRule.operator,
                              selectedRule.value
                            )}
                          </span>
                        </span>
                      </div>

                      <div className={styles.infoTileItem}>
                        <span className={styles.infoTileLabel}>Operador</span>
                        <span className={styles.infoTileValue}>
                          <code>{selectedRule.operator}</code> ({operatorOptions.find((o) => o.value === selectedRule.operator)?.label})
                        </span>
                      </div>

                      <div className={styles.infoTileItem}>
                        <span className={styles.infoTileLabel}>Valor de Referência</span>
                        <span className={styles.infoTileValue}>
                          <strong>
                            {selectedRule.value} {sensorUnits[selectedRule.sensorType] || ""}
                          </strong>
                        </span>
                      </div>

                      <div className={styles.infoTileItem}>
                        <span className={styles.infoTileLabel}>Sensor Monitorado</span>
                        <span className={styles.infoTileValue}>
                          <code>{selectedRule.sensorType}</code>
                        </span>
                      </div>

                      <div className={styles.infoTileItem}>
                        <span className={styles.infoTileLabel}>Status da Regra</span>
                        <span className={styles.infoTileValue}>
                          <span style={{ color: selectedRule.active ? "#284430" : "#718173", fontWeight: 700 }}>
                            ● {selectedRule.active ? "Ativa" : "Inativa"}
                          </span>
                        </span>
                      </div>

                      <div className={styles.infoTileItem}>
                        <span className={styles.infoTileLabel}>Estações Vinculadas</span>
                        <span className={styles.infoTileValue}>
                          <strong>{selectedRule.stations.length} estação(ões)</strong>
                        </span>
                      </div>

                      <div className={styles.infoTileItem}>
                        <span className={styles.infoTileLabel}>Modo de Execução</span>
                        <span className={styles.infoTileValue}>
                          <strong>Tempo Real (Pipeline)</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.detailSectionCard}>
                    <h3 className={styles.detailSectionTitle}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Vinculação e Mensagem de Alerta
                    </h3>

                    <div>
                      <span className={styles.infoTileLabel} style={{ display: "block", marginBottom: 8 }}>
                        Mensagem Cadastrada
                      </span>
                      <div className={styles.detailDescBox}>
                        {selectedRule.message}
                      </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <span className={styles.infoTileLabel} style={{ display: "block", marginBottom: 8 }}>
                        Estações Monitoradas
                      </span>
                      <div className={styles.chipsContainer}>
                        {selectedRule.stations.map((st) => (
                          <span key={st} className={styles.chip}>
                            {st}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={styles.detailSectionCard}>
                    <h3 className={styles.detailSectionTitle}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 11 12 14 22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                      Procedimentos Operacionais e Pipeline
                    </h3>
                    <div className={styles.actionsChecklist}>
                      <div className={styles.actionCheckItem}>
                        <div className={styles.actionStepDot}>1</div>
                        <span>
                          A telemetria física das estações vinculadas (<strong>{selectedRule.stations.join(", ")}</strong>) é ingerida em tempo real.
                        </span>
                      </div>
                      <div className={styles.actionCheckItem}>
                        <div className={styles.actionStepDot}>2</div>
                        <span>
                          Se uma medição do sensor <strong>{selectedRule.sensorType}</strong> atingir a condição (<strong>{selectedRule.operator} {selectedRule.value} {sensorUnits[selectedRule.sensorType] || ""}</strong>), um evento de alerta é registrado no sistema.
                        </span>
                      </div>
                      <div className={styles.actionCheckItem}>
                        <div className={styles.actionStepDot}>3</div>
                        <span>
                          Notificações operacionais imediatas serão encaminhadas aos operadores agrícolas com a mensagem &quot;{selectedRule.message}&quot;.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.modalBottomActions}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={handleCloseDetailModal}
                    >
                      Fechar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {isCreateModalOpen && (
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-create-title"
            onClick={handleCloseCreateModal}
          >
            <div
              className={styles.modalCardContainer}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalTopNav}>
                <button
                  type="button"
                  className={styles.btnVoltarLista}
                  onClick={handleCloseCreateModal}
                >
                  ← Voltar para a lista
                </button>

                <button
                  type="button"
                  className={styles.modalCloseIconBtn}
                  onClick={handleCloseCreateModal}
                  title="Fechar"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateRule} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div className={styles.modalHeadingGroup}>
                  <h2 id="modal-create-title" className={styles.modalMainTitle}>
                    Nova Regra de Alerta
                  </h2>
                  <p className={styles.modalSubtitle}>
                    Configure condições de disparo e vincule às estações de monitoramento.
                  </p>
                </div>

                <div className={styles.formCardsGrid}>
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
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={styles.boxTitle}>Configuração da Regra</h3>
                        <p className={styles.boxDesc}>Sensor, operador e valor de referência.</p>
                      </div>
                    </div>

                    <div className={styles.boxFields}>
                      <div className={styles.formGroupItem}>
                        <label className={styles.fieldLabel}>
                          Tipo de sensor <span className={styles.requiredStar}>*</span>
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
                            value={newSensor}
                            onChange={(e) => {
                              setNewSensor(e.target.value);
                              setNewError("");
                            }}
                          >
                            {sensorOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt} ({sensorUnits[opt] || ""})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className={styles.formGroupItem}>
                        <label className={styles.fieldLabel}>
                          Operador de comparação <span className={styles.requiredStar}>*</span>
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
                            onChange={(e) => {
                              setNewOperator(e.target.value as ComparisonOperator);
                              setNewError("");
                            }}
                          >
                            {operatorOptions.map((op) => (
                              <option key={op.value} value={op.value}>
                                {op.label} ({op.value})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className={styles.formGroupItem}>
                        <label className={styles.fieldLabel}>
                          Valor de referência <span className={styles.requiredStar}>*</span>
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
                            value={newValue}
                            onChange={(e) => {
                              setNewValue(e.target.value);
                              setNewError("");
                            }}
                            placeholder="Ex: 35"
                            required
                          />
                        </div>
                      </div>

                      <div className={styles.rulePreviewBox}>
                        <div className={styles.rulePreviewTitle}>Condição Avaliada</div>
                        <span className={styles.rulePreviewCode}>
                          {newSensor} {newOperator} {newValue || "0"}{" "}
                          {sensorUnits[newSensor] || ""}
                        </span>
                      </div>

                      <div
                        className={styles.toggleRow}
                        onClick={() => setNewActive((prev) => !prev)}
                      >
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
                    </div>
                  </div>

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
                        <h3 className={styles.boxTitle}>Hardware e Estações Vinculadas</h3>
                        <p className={styles.boxDesc}>Associação de estações e mensagem aos gestores.</p>
                      </div>
                    </div>

                    <div className={styles.boxFields}>
                      <div className={styles.formGroupItem}>
                        <label className={styles.fieldLabel}>
                          Mensagem de notificação <span className={styles.requiredStar}>*</span>
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
                            maxLength={200}
                            value={newMessage}
                            onChange={(e) => {
                              setNewMessage(e.target.value);
                              setNewError("");
                            }}
                            placeholder="Ex: Risco de estresse térmico na plantação"
                            required
                          />
                        </div>
                        <span className={styles.charCount}>
                          {newMessage.length}/200 caracteres
                        </span>
                      </div>

                      <div className={styles.formGroupItem}>
                        <label className={styles.fieldLabel}>
                          Vincular estações <span className={styles.requiredStar}>*</span>
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
                            value=""
                            onChange={(e) => handleAddNewStation(e.target.value)}
                          >
                            <option value="" disabled>
                              Selecione uma estação para adicionar...
                            </option>
                            {stationNames
                              .filter((st) => !newStations.includes(st))
                              .map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className={styles.chipsContainer}>
                          {newStations.map((st) => (
                            <span key={st} className={styles.chip}>
                              {st}
                              <button
                                type="button"
                                className={styles.chipRemoveBtn}
                                onClick={() => handleRemoveNewStation(st)}
                                aria-label={`Remover ${st}`}
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {newError && <p className={styles.formErrorMsg}>{newError}</p>}

                <div className={styles.modalBottomActions}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleCloseCreateModal}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={styles.btnPrimary}
                  >
                    Salvar Regra
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
