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
        {/* 1. Temperatura do Ar */}
        <article className={styles.weatherCard} aria-label="Temperatura média do ar">
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Temperatura do Ar</span>
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

        {/* 2. Umidade do Solo */}
        <article className={styles.weatherCard} aria-label="Umidade média do solo">
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

        {/* 3. Umidade Relativa do Ar */}
        <article className={styles.weatherCard} aria-label="Umidade relativa do ar">
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Umidade do Ar</span>
            <span className={styles.cardIcon}>
              <Icon name="drop" />
            </span>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{weather.avgAirHumidity}</span>
            <span className={styles.metricUnit}>%</span>
          </div>
          <div className={styles.cardFooter}>
            <span>Variação diária: 48% - 88%</span>
          </div>
        </article>

        {/* 4. Precipitação Acumulada */}
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

        {/* 5. Vento */}
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

        {/* 6. Radiação Solar */}
        <article className={styles.weatherCard} aria-label="Radiação solar">
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Radiação Solar</span>
            <span className={styles.cardIcon}>
              <Icon name="gauge" />
            </span>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{weather.solarRadiation}</span>
            <span className={styles.metricUnit}>W/m²</span>
          </div>
          <div className={styles.cardFooter}>
            <span>Índice UV: Moderado (6.2)</span>
          </div>
        </article>
      </div>
    </section>
  );
}
