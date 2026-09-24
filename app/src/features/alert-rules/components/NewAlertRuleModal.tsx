"use client";

import { useState } from "react";
import type { AlertRule, ComparisonOperator } from "../types/alertRule";
import {
  sensorOptions,
  operatorOptions,
  availableStations,
} from "../mocks/alertRulesData";
import styles from "./NewAlertRuleModal.module.css";

interface NewAlertRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRule: (newRule: AlertRule) => void;
}

export function NewAlertRuleModal({
  isOpen,
  onClose,
  onCreateRule,
}: NewAlertRuleModalProps) {
  const [sensor, setSensor] = useState("");
  const [operator, setOperator] = useState<ComparisonOperator>(">");
  const [referenceValue, setReferenceValue] = useState("");
  const [message, setMessage] = useState("");
  const [selectedStations, setSelectedStations] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const operatorLabel =
    operatorOptions.find((opt) => opt.value === operator)?.label ?? "";

  const previewText = `Avisar se ${sensor || "..."} ${operatorLabel || "..."} ${
    referenceValue !== "" ? referenceValue : "..."
  }`;

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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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

    const newRule: AlertRule = {
      id: Date.now(),
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

    onCreateRule(newRule);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalCardContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.headingGroup}>
            <h2 className={styles.title}>Nova Regra de Alerta</h2>
            <p className={styles.subtitle}>
              Configure condições de aviso e vincule às estações desejadas.
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

        <form onSubmit={handleSubmit} className={styles.form}>
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
                <option value="" disabled>
                  Selecione...
                </option>
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
            <span className={styles.previewText}>{previewText}</span>
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
                Selecione uma estação para adicionar...
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
                O alerta será monitorado continuamente para as estações
                selecionadas.
              </span>
            </div>
          </div>

          {errorMessage && (
            <p className={styles.formErrorMsg}>{errorMessage}</p>
          )}

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary}>
              Salvar regra
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
