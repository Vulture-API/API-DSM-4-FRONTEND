import { Icon } from "@/components/ui/Icon/Icon";
import type { AlertSummaryStats } from "../types/alert";
import styles from "./AlertsSummaryCards.module.css";

interface Props {
  stats: AlertSummaryStats;
}

export function AlertsSummaryCards({ stats }: Props) {
  return (
    <section className={styles.cardsGrid} aria-label="Resumo dos alertas">
      {/* 1. Total de alertas */}
      <article className={styles.card}>
        <div className={styles.cardTop}>
          <span className={styles.cardLabel}>Total de Alertas</span>
          <span className={`${styles.iconBadge} ${styles.totalIcon}`}>
            <Icon name="bell" />
          </span>
        </div>
        <div className={styles.cardValueRow}>
          <span className={styles.cardValue}>{stats.total}</span>
        </div>
        <span className={styles.cardChange}>
          <span className={styles.trendUp}>↑</span> {stats.totalChange}
        </span>
      </article>

      {/* 2. Avisos */}
      <article className={styles.card}>
        <div className={styles.cardTop}>
          <span className={styles.cardLabel}>Avisos</span>
          <span className={`${styles.iconBadge} ${styles.warningIcon}`}>
            <Icon name="alert" />
          </span>
        </div>
        <div className={styles.cardValueRow}>
          <span className={styles.cardValue}>{stats.warnings}</span>
        </div>
        <span className={styles.cardChange}>Requer atenção preventiva</span>
      </article>

      {/* 3. Críticos */}
      <article className={styles.card}>
        <div className={styles.cardTop}>
          <span className={styles.cardLabel}>Críticos</span>
          <span className={`${styles.iconBadge} ${styles.criticalIcon}`}>
            <Icon name="alert" />
          </span>
        </div>
        <div className={styles.cardValueRow}>
          <span className={styles.cardValue}>{stats.critical}</span>
        </div>
        <span className={styles.cardChange}>Ação imediata necessária</span>
      </article>

      {/* 4. Resolvidos */}
      <article className={styles.card}>
        <div className={styles.cardTop}>
          <span className={styles.cardLabel}>Resolvidos</span>
          <span className={`${styles.iconBadge} ${styles.resolvedIcon}`}>
            <Icon name="leaf" />
          </span>
        </div>
        <div className={styles.cardValueRow}>
          <span className={styles.cardValue}>{stats.resolved}</span>
        </div>
        <span className={styles.cardChange}>Normalizados com sucesso</span>
      </article>
    </section>
  );
}
