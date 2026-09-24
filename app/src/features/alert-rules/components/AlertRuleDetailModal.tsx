"use client";

import { useState } from "react";
import type {
  AlertRule,
  ComparisonOperator,
  DetailModalMode,
} from "../types/alertRule";
import {
  sensorOptions,
  operatorOptions,
  availableStations,
  formatCondition,
} from "../mocks/alertRulesData";
import styles from "./AlertRuleDetailModal.module.css";

interface AlertRuleDetailModalProps {
  rule: AlertRule | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateRule: (updatedRule: AlertRule) => void;
  onDeleteRule: (id: number) => void;
}

interface AlertRuleDetailModalContentProps {
  rule: AlertRule;
  onClose: () => void;
  onUpdateRule: (updatedRule: AlertRule) => void;
  onDeleteRule: (id: number) => void;
}

function AlertRuleDetailModalContent({
  rule,
  onClose,
  onUpdateRule,
  onDeleteRule,
}: AlertRuleDetailModalContentProps) {
  const [mode, setMode] = useState<DetailModalMode>("view");

  const [sensor, setSensor] = useState(
    rule.sensorType || rule.sensor_id || "Temperatura"
  );
  const [operator, setOperator] = useState<ComparisonOperator>(
    rule.operator || rule.comparison_operator || ">"
  );
  const [referenceValue, setReferenceValue] = useState(
    rule.value !== undefined
      ? String(rule.value)
      : rule.reference_value !== undefined
      ? String(rule.reference_value)
      : ""
  );
  const [message, setMessage] = useState(rule.message || "");
  const [selectedStations, setSelectedStations] = useState<string[]>(
    rule.stations || []
  );
  const [isActive, setIsActive] = useState(rule.active ?? true);
  const [errorMessage, setErrorMessage] = useState("");

  const currentSensor = rule.sensorType || rule.sensor_id || "";
  const currentOperator = rule.operator || rule.comparison_operator || ">";
  const currentValue = rule.value ?? rule.reference_value ?? 0;
  const currentConditionText = formatCondition(
    currentSensor,
    currentOperator,
    currentValue
  );

  const editOperatorLabel =
    operatorOptions.find((opt) => opt.value === operator)?.label ?? "";

  const editPreviewText = `Avisar se ${sensor || "..."} ${
    editOperatorLabel || "..."
  } ${referenceValue !== "" ? referenceValue : "..."}`;

  const handleStartEdit = () => {
    setSensor(rule.sensorType || rule.sensor_id || "Temperatura");
    setOperator(rule.operator || rule.comparison_operator || ">");
    setReferenceValue(
      rule.value !== undefined
        ? String(rule.value)
        : rule.reference_value !== undefined
        ? String(rule.reference_value)
        : ""
    );
    setMessage(rule.message || "");
    setSelectedStations(rule.stations || []);
    setIsActive(rule.active ?? true);
    setErrorMessage("");
    setMode("edit");
  };

  const handleCancelEdit = () => {
    setSensor(rule.sensorType || rule.sensor_id || "Temperatura");
    setOperator(rule.operator || rule.comparison_operator || ">");
    setReferenceValue(
      rule.value !== undefined
        ? String(rule.value)
        : rule.reference_value !== undefined
        ? String(rule.reference_value)
        : ""
    );
    setMessage(rule.message || "");
    setSelectedStations(rule.stations || []);
    setIsActive(rule.active ?? true);
    setErrorMessage("");
    setMode("view");
  };

  const handleAddStation = (stationName: string) => {
    if (!stationName) return;
    if (!selectedStations.includes(stationName)) {
      setSelectedStations((prev) => [...prev, stationName]);
      setErrorMessage("");
    }
  };

  const handleRemoveStation = (stationName: string) => {
    setSelectedStations((prev) => prev.filter((item) => item !== stationName));
  };

  const handleSaveEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!sensor) {
      setErrorMessage("Selecione o tipo de sensor.");
      return;
    }

    if (!operator) {
      setErrorMessage("Selecione o operador de comparação.");
      return;
    }

    if (referenceValue === "" || isNaN(Number(referenceValue))) {
      setErrorMessage("Informe um valor numérico válido.");
      return;
    }

    if (selectedStations.length === 0) {
      setErrorMessage("Vincule ao menos uma estação à regra.");
      return;
    }

    if (!message.trim()) {
      setErrorMessage("A mensagem do alerta é obrigatória.");
      return;
    }

    const updated: AlertRule = {
      ...rule,
      sensorType: sensor,
      operator,
      value: Number(referenceValue),
      message: message.trim(),
      stations: selectedStations,
      active: isActive,
      sensor_id: sensor,
      reference_value: Number(referenceValue),
      comparison_operator: operator,
    };

    onUpdateRule(updated);
    setMode("view");
  };

  const handleConfirmDelete = () => {
    onDeleteRule(rule.id);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalCardContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.headingGroup}>
            <h2 className={styles.title}>
              {mode === "edit"
                ? "Editar Regra de Alerta"
                : mode === "confirm_delete"
                ? "Excluir Regra de Alerta"
                : "Detalhes da regra"}
            </h2>
            <p className={styles.subtitle}>
              {mode === "edit"
                ? "Altere os parâmetros e salve as modificações."
                : mode === "confirm_delete"
                ? "Confirme se deseja remover permanentemente esta regra."
                : "Visualize e gerencie as configurações desta regra de alerta."}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            title="Fechar"
          >
            ✕
          </button>
        </div>

        {mode === "view" && (
          <>
            <div className={styles.detailsList}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Condição</span>
                <span className={styles.conditionValue}>
                  {currentConditionText}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Mensagem do alerta</span>
                <span className={styles.detailValue}>{rule.message}</span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Estações associadas</span>
                <div className={styles.chipsContainer}>
                  {rule.stations.map((st) => (
                    <span key={st} className={styles.chip}>
                      {st}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Status</span>
                <span
                  className={`${styles.statusBadge} ${
                    rule.active ? styles.badgeActive : styles.badgeInactive
                  }`}
                >
                  {rule.active ? "Ativa" : "Inativa"}
                </span>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnDangerOutline}
                onClick={() => setMode("confirm_delete")}
              >
                Excluir
              </button>

              <div className={styles.footerRightGroup}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={onClose}
                >
                  Fechar
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleStartEdit}
                >
                  Editar
                </button>
              </div>
            </div>
          </>
        )}

        {mode === "confirm_delete" && (
          <>
            <div className={styles.confirmBox}>
              <div className={styles.confirmHeader}>
                <svg
                  className={styles.confirmIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <h3 className={styles.confirmTitle}>
                  Tem certeza que deseja excluir esta regra?
                </h3>
              </div>
              <p className={styles.confirmText}>
                A regra <strong>{currentConditionText}</strong> será removida e o
                monitoramento automático das estações associadas será desativado.
              </p>
            </div>

            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setMode("view")}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnDangerSolid}
                onClick={handleConfirmDelete}
              >
                Confirmar exclusão
              </button>
            </div>
          </>
        )}

        {mode === "edit" && (
          <form onSubmit={handleSaveEdit} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Tipo de sensor <span className={styles.requiredStar}>*</span>
                </label>
                <select
                  value={sensor}
                  onChange={(e) => {
                    setSensor(e.target.value);
                    setErrorMessage("");
                  }}
                  className={styles.select}
                >
                  {sensorOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Operador <span className={styles.requiredStar}>*</span>
                </label>
                <select
                  value={operator}
                  onChange={(e) => {
                    setOperator(e.target.value as ComparisonOperator);
                    setErrorMessage("");
                  }}
                  className={styles.select}
                >
                  {operatorOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.value})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Valor <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={referenceValue}
                  onChange={(e) => {
                    setReferenceValue(e.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="Ex: 35"
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.previewBox}>
              <span className={styles.previewLabel}>Prévia da condição</span>
              <span className={styles.previewText}>{editPreviewText}</span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Mensagem do alerta <span className={styles.requiredStar}>*</span>
              </label>
              <textarea
                rows={3}
                maxLength={200}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="Ex: Risco de estresse térmico na plantação"
                className={styles.textarea}
              />
              <span className={styles.charCount}>
                {message.length}/200 caracteres
              </span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Estações associadas <span className={styles.requiredStar}>*</span>
              </label>
              <select
                value=""
                onChange={(e) => handleAddStation(e.target.value)}
                className={styles.select}
              >
                <option value="" disabled>
                  Adicionar estação...
                </option>
                {availableStations
                  .filter((st) => !selectedStations.includes(st))
                  .map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
              </select>

              <div className={styles.chipsContainer}>
                {selectedStations.map((st) => (
                  <span key={st} className={styles.chip}>
                    {st}
                    <button
                      type="button"
                      className={styles.chipRemoveBtn}
                      onClick={() => handleRemoveStation(st)}
                      aria-label={`Remover ${st}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div
              className={styles.toggleRow}
              onClick={() => setIsActive((prev) => !prev)}
            >
              <div
                className={`${styles.toggleSwitch} ${
                  isActive ? styles.toggleOn : styles.toggleOff
                }`}
              >
                <div className={styles.toggleThumb} />
              </div>
              <div className={styles.toggleTextGroup}>
                <span className={styles.toggleLabel}>Regra ativa</span>
                <span className={styles.toggleDesc}>
                  Monitorar medições e alertar responsáveis continuamente.
                </span>
              </div>
            </div>

            {errorMessage && (
              <p className={styles.formErrorMsg}>{errorMessage}</p>
            )}

            <div className={styles.modalFooter}>
              <div className={styles.footerRightGroup}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={handleCancelEdit}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Salvar alterações
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function AlertRuleDetailModal({
  rule,
  isOpen,
  onClose,
  onUpdateRule,
  onDeleteRule,
}: AlertRuleDetailModalProps) {
  if (!isOpen || !rule) return null;

  return (
    <AlertRuleDetailModalContent
      key={rule.id}
      rule={rule}
      onClose={onClose}
      onUpdateRule={onUpdateRule}
      onDeleteRule={onDeleteRule}
    />
  );
}
