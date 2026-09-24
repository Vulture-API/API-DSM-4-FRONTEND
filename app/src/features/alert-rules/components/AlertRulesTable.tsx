"use client";

import type { AlertRule } from "../types/alertRule";
import { formatCondition } from "../mocks/alertRulesData";
import styles from "./AlertRulesTable.module.css";

interface AlertRulesTableProps {
  rules: AlertRule[];
  onSelectRule: (rule: AlertRule) => void;
}

export function AlertRulesTable({ rules, onSelectRule }: AlertRulesTableProps) {
  return (
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
                const sensorName = rule.sensorType || rule.sensor_id || "";
                const operatorSymbol = rule.operator || rule.comparison_operator || ">";
                const referenceVal = rule.value ?? rule.reference_value ?? 0;
                const conditionText = formatCondition(
                  sensorName,
                  operatorSymbol,
                  referenceVal
                );
                const stationsText = rule.stations.join(", ");

                return (
                  <tr
                    key={rule.id}
                    className={styles.tableRow}
                    onClick={() => onSelectRule(rule)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectRule(rule);
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
                          rule.active ? styles.badgeActive : styles.badgeInactive
                        }`}
                      >
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
  );
}
