import { Icon } from "@/components/ui/Icon/Icon";
import type { CommunicationSummary } from "../types/dashboard";
import styles from "./CommunicationSummaryCards.module.css";

interface Props {
  summary: CommunicationSummary;
}

export function CommunicationSummaryCards({ summary }: Props) {
  return (
    <section className={styles.cardsGrid} aria-label="Resumo do status de comunicação das estações">
      {/* 1. Total Monitoradas */}
      <article className={styles.card} aria-label="Total de estações">
        <div className={styles.cardTop}>
          <span className={styles.cardLabel}>Estações Totais</span>
          <span className={`${styles.iconBadge} ${styles.totalIcon}`}>
            <Icon name="signal" />
          </span>
        </div>
        <div className={styles.cardValueRow}>
          <span className={styles.cardValue}>{summary.totalStations}</span>
          <span className={styles.cardSubtext}>unidades</span>
        </div>
        <div className={styles.cardFooter}>
          <span>Monitoramento em tempo real</span>
        </div>
      </article>

      {/* 2. Estações Online */}
      <article className={styles.card} aria-label="Estações online">
        <div className={styles.cardTop}>
          <span className={styles.cardLabel}>Conectadas</span>
          <span className={`${styles.iconBadge} ${styles.onlineIcon}`}>
            <Icon name="wifi" />
          </span>
        </div>
        <div className={styles.cardValueRow}>
          <span className={styles.cardValue}>{summary.onlineCount}</span>
          <span className={styles.badgeSuccess}>{summary.onlinePercentage}%</span>
        </div>
        <div className={styles.cardFooter}>
          <span className={`${styles.indicatorDot} ${styles.dotSuccess}`} />
          <span>Comunicação ativa &lt; 10 min</span>
        </div>
      </article>

      {/* 3. Estações Instáveis */}
      <article className={styles.card} aria-label="Estações com instabilidade">
        <div className={styles.cardTop}>
          <span className={styles.cardLabel}>Instáveis</span>
          <span className={`${styles.iconBadge} ${styles.unstableIcon}`}>
            <Icon name="activity" />
          </span>
        </div>
        <div className={styles.cardValueRow}>
          <span className={styles.cardValue}>{summary.unstableCount}</span>
          <span className={styles.badgeWarning}>Atenção</span>
        </div>
        <div className={styles.cardFooter}>
          <span className={`${styles.indicatorDot} ${styles.dotWarning}`} />
          <span>Atraso na telemetria</span>
        </div>
      </article>

      {/* 4. Estações Offline */}
      <article className={styles.card} aria-label="Estações offline">
        <div className={styles.cardTop}>
          <span className={styles.cardLabel}>Sem Conexão</span>
          <span className={`${styles.iconBadge} ${styles.offlineIcon}`}>
            <Icon name="alert" />
          </span>
        </div>
        <div className={styles.cardValueRow}>
          <span className={styles.cardValue}>{summary.offlineCount}</span>
          <span className={styles.badgeDanger}>Crítico</span>
        </div>
        <div className={styles.cardFooter}>
          <span className={`${styles.indicatorDot} ${styles.dotDanger}`} />
          <span>Sem sinal &gt; 30 min</span>
        </div>
      </article>

      {/* 5. SLA / Disponibilidade */}
      <article className={styles.card} aria-label="Disponibilidade global SLA">
        <div className={styles.cardTop}>
          <span className={styles.cardLabel}>SLA Disponibilidade</span>
          <span className={`${styles.iconBadge} ${styles.slaIcon}`}>
            <Icon name="chart" />
          </span>
        </div>
        <div className={styles.cardValueRow}>
          <span className={styles.cardValue}>{summary.globalAvailabilitySla}%</span>
          <span className={styles.badgeSuccess}>Meta &ge; {summary.slaTarget}%</span>
        </div>
        <div className={styles.cardFooter}>
          <span>Latência média: {summary.avgLatencyMs} ms</span>
        </div>
      </article>
    </section>
  );
}
