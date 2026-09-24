"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon/Icon";
import type { AlertRule } from "../types/alertRule";
import { initialAlertRules } from "../mocks/alertRulesData";
import { AlertRulesTable } from "./AlertRulesTable";
import { AlertRuleDetailModal } from "./AlertRuleDetailModal";
import { NewAlertRuleModal } from "./NewAlertRuleModal";
import styles from "./AlertRulesManagement.module.css";

export function AlertRulesManagement() {
  const [rules, setRules] = useState<AlertRule[]>(initialAlertRules);
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleSelectRule = (rule: AlertRule) => {
    setSelectedRule(rule);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRule(null);
  };

  const handleUpdateRule = (updatedRule: AlertRule) => {
    setRules((prev) =>
      prev.map((rule) => (rule.id === updatedRule.id ? updatedRule : rule))
    );
    setSelectedRule(updatedRule);
  };

  const handleDeleteRule = (id: number) => {
    setRules((prev) => prev.filter((rule) => rule.id !== id));
    handleCloseDetailModal();
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateRule = (newRule: AlertRule) => {
    setRules((prev) => [newRule, ...prev]);
    handleCloseCreateModal();
  };

  return (
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

      <AlertRulesTable rules={rules} onSelectRule={handleSelectRule} />

      <AlertRuleDetailModal
        isOpen={isDetailModalOpen}
        rule={selectedRule}
        onClose={handleCloseDetailModal}
        onUpdateRule={handleUpdateRule}
        onDeleteRule={handleDeleteRule}
      />

      <NewAlertRuleModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onCreateRule={handleCreateRule}
      />
    </div>
  );
}
