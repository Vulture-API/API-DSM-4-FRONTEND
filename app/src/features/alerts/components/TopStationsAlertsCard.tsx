import { Icon } from "@/components/ui/Icon/Icon";
import type { StationAlertRank } from "../types/alert";
import styles from "./TopStationsAlertsCard.module.css";

interface Props {
  stations: StationAlertRank[];
}

export function TopStationsAlertsCard({ stations }: Props) {
  const maxAlerts = Math.max(...stations.map((s) => s.alertCount), 1);

  const getRankClass = (pos: number) => {
    if (pos === 1) return styles.rankTop1;
    if (pos === 2) return styles.rankTop2;
    if (pos === 3) return styles.rankTop3;
    return "";
  };

  return (
    <section className={styles.card} aria-label="Estações com mais alertas">
      <header className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>
          <Icon name="chart" />
          Estações com mais alertas
        </h3>
      </header>

      <div className={styles.stationsList}>
        {stations.map((station) => {
          const percentage = Math.round((station.alertCount / maxAlerts) * 100);
          return (
            <div key={station.position} className={styles.stationItem}>
              <div className={styles.stationItemRow}>
                <div className={styles.stationInfoGroup}>
                  <span
                    className={`${styles.rankPosition} ${getRankClass(station.position)}`}
                    aria-label={`Posição ${station.position}`}
                  >
                    {station.position}
                  </span>
                  <div className={styles.stationDetails}>
                    <span className={styles.stationName} title={station.stationName}>
                      {station.stationName}
                    </span>
                    <span className={styles.propertyName} title={station.propertyName}>
                      {station.propertyName}
                    </span>
                  </div>
                </div>
                <span className={styles.alertCountBadge}>
                  {station.alertCount} {station.alertCount === 1 ? "alerta" : "alertas"}
                </span>
              </div>

              <div
                className={styles.progressBarTrack}
                role="progressbar"
                aria-valuenow={station.alertCount}
                aria-valuemin={0}
                aria-valuemax={maxAlerts}
                aria-label={`Proporção de alertas de ${station.stationName}`}
              >
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
