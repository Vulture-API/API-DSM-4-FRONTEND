import { Icon } from "@/components/ui/Icon/Icon";
import type { WeatherOverview } from "../types/dashboard";
import styles from "./WeatherMetricsCards.module.css";

interface Props {
  weather: WeatherOverview;
}

export function WeatherMetricsCards({ weather }: Props) {
  return (
    <section className={styles.weatherSection} aria-label="Indicadores meteorológicos">
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <Icon name="leaf" />
          Condições Climáticas Atuais
        </h2>
        <span className={styles.sectionBadge}>Telemetria consolidada</span>
      </div>

      <div className={styles.cardsGrid}>
        {/* 1. Temperatura do Ar (Sensor TEMPAR-01) */}
        <article className={styles.weatherCard} aria-label="Temperatura do ar">
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Temp. do Ar</span>
            <span className={styles.cardIcon}>
              <Icon name="thermometer" />
            </span>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{weather.avgTemperature.toFixed(1)}</span>
            <span className={styles.metricUnit}>°C</span>
          </div>
          <div className={styles.cardFooter}>
            <span>Mín: {weather.minTemperature}°C</span>
            <span>Máx: {weather.maxTemperature}°C</span>
          </div>
        </article>

        {/* 2. Temperatura do Solo (Sensor TEMP-01) */}
        <article className={styles.weatherCard} aria-label="Temperatura do solo">
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Temp. do Solo</span>
            <span className={styles.cardIcon}>
              <Icon name="thermometer" />
            </span>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{weather.avgSoilTemperature.toFixed(1)}</span>
            <span className={styles.metricUnit}>°C</span>
          </div>
          <div className={styles.cardFooter}>
            <span>Sensor subterrâneo TEMP-01</span>
          </div>
        </article>

        {/* 3. Umidade do Solo (Sensor HUM-01) */}
        <article className={styles.weatherCard} aria-label="Umidade do solo">
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Umidade do Solo</span>
            <span className={styles.cardIcon}>
              <Icon name="drop" />
            </span>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{weather.avgSoilMoisture.toFixed(0)}</span>
            <span className={styles.metricUnit}>%</span>
          </div>
          <div className={styles.cardFooter}>
            <span className={styles.tagHighlight}>Nível Adequado</span>
            <span>Faixa ideal: 25-45%</span>
          </div>
        </article>

        {/* 4. Precipitação Acumulada (Sensor RAIN-01) */}
        <article className={styles.weatherCard} aria-label="Precipitação acumulada">
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Precipitação</span>
            <span className={styles.cardIcon}>
              <Icon name="rain" />
            </span>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{weather.accumulatedRainfall.toFixed(1)}</span>
            <span className={styles.metricUnit}>mm</span>
          </div>
          <div className={styles.cardFooter}>
            <span>Volume acumulado no período</span>
          </div>
        </article>

        {/* 5. Velocidade do Vento (Sensor WIND-01) */}
        <article className={styles.weatherCard} aria-label="Velocidade do vento">
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Vento Médio</span>
            <span className={styles.cardIcon}>
              <Icon name="wind" />
            </span>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{weather.avgWindSpeed.toFixed(1)}</span>
            <span className={styles.metricUnit}>km/h</span>
          </div>
          <div className={styles.cardFooter}>
            <span>Rajada máx: {weather.maxWindGust} km/h</span>
          </div>
        </article>
      </div>
    </section>
  );
}
