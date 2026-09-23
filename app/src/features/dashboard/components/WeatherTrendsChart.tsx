"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon/Icon";
import type { WeatherTrendPoint } from "../types/dashboard";
import styles from "./WeatherTrendsChart.module.css";

interface Props {
  data: WeatherTrendPoint[];
}

export function WeatherTrendsChart({ data }: Props) {
  const [activePoint, setActivePoint] = useState<WeatherTrendPoint | null>(null);

  if (data.length === 0) return null;

  const width = 600;
  const height = 230;
  const padLeft = 45;
  const padRight = 45;
  const padTop = 25;
  const padBottom = 35;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  // Temperature scale: 10°C to 35°C
  const minTemp = 10;
  const maxTemp = 35;
  const getTempY = (temp: number) => {
    const ratio = (temp - minTemp) / (maxTemp - minTemp);
    return padTop + (1 - ratio) * innerH;
  };

  // Soil moisture scale: 10% to 50%
  const minMoisture = 10;
  const maxMoisture = 50;
  const getMoistureY = (moisture: number) => {
    const ratio = (moisture - minMoisture) / (maxMoisture - minMoisture);
    return padTop + (1 - ratio) * innerH;
  };

  const getX = (index: number) => {
    if (data.length <= 1) return padLeft + innerW / 2;
    return padLeft + (index / (data.length - 1)) * innerW;
  };

  const tempPoints = data.map((d, i) => ({
    x: getX(i),
    y: getTempY(d.temperature),
  }));

  const moisturePoints = data.map((d, i) => ({
    x: getX(i),
    y: getMoistureY(d.soilMoisture),
  }));

  const tempPathD = tempPoints.reduce(
    (acc, curr, i) => (i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`),
    ""
  );

  const moisturePathD = moisturePoints.reduce(
    (acc, curr, i) => (i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`),
    ""
  );

  const tempSteps = [15, 20, 25, 30, 35];
  const moistureSteps = [10, 20, 30, 40, 50];

  return (
    <div className={styles.chartContainer} aria-label="Evolução Climática (24h)">
      <header className={styles.chartHeader}>
        <div className={styles.chartTitle}>
          <Icon name="thermometer" />
          Temperatura do Ar e Umidade do Solo (24h)
        </div>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: "#e65100" }} />
            <span>Temp. do Ar (°C)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: "#0288d1" }} />
            <span>Umidade do Solo (%)</span>
          </div>
        </div>
      </header>

      <div className={styles.svgWrapper}>
        <svg
          className={styles.chartSvg}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Gráfico de linhas de temperatura e umidade do solo"
        >
          {/* Grid lines and left Y labels (temperature) */}
          {tempSteps.map((step) => {
            const y = getTempY(step);
            return (
              <g key={step}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  className={styles.gridLine}
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className={styles.axisText}
                >
                  {step}°C
                </text>
              </g>
            );
          })}

          {/* Right Y labels (soil moisture) */}
          {moistureSteps.map((step) => {
            const y = getMoistureY(step);
            return (
              <text
                key={step}
                x={width - padRight + 8}
                y={y + 4}
                textAnchor="start"
                className={styles.axisText}
                fill="#0288d1"
              >
                {step}%
              </text>
            );
          })}

          {/* Paths */}
          <path d={tempPathD} className={styles.tempPath} />
          <path d={moisturePathD} className={styles.humidityPath} />

          {/* Data Points */}
          {data.map((d, i) => {
            const tx = getX(i);
            const ty = getTempY(d.temperature);
            const my = getMoistureY(d.soilMoisture);

            return (
              <g key={d.time}>
                <circle
                  cx={tx}
                  cy={ty}
                  r="4"
                  className={styles.tempPoint}
                  onMouseEnter={() => setActivePoint(d)}
                  onMouseLeave={() => setActivePoint(null)}
                  tabIndex={0}
                  aria-label={`${d.time}: Temperatura ${d.temperature}°C`}
                />
                <circle
                  cx={tx}
                  cy={my}
                  r="4"
                  className={styles.humidityPoint}
                  onMouseEnter={() => setActivePoint(d)}
                  onMouseLeave={() => setActivePoint(null)}
                  tabIndex={0}
                  aria-label={`${d.time}: Umidade ${d.soilMoisture}%`}
                />
                <text
                  x={tx}
                  y={height - 10}
                  textAnchor="middle"
                  className={styles.axisText}
                >
                  {d.time}
                </text>
              </g>
            );
          })}
        </svg>

        {activePoint && (
          <div
            className={styles.tooltipBox}
            style={{
              left: `${(getX(data.indexOf(activePoint)) / width) * 100}%`,
              top: `${(getTempY(activePoint.temperature) / height) * 100}%`,
            }}
          >
            <strong>{activePoint.time}</strong>: {activePoint.temperature}°C ar | {activePoint.soilMoisture}% umidade solo | {activePoint.soilTemperature}°C solo
          </div>
        )}
      </div>

      <footer className={styles.chartFooter}>
        <span>Eixo Esquerdo: Temperatura do Ar (°C)</span>
        <span>Eixo Direito: Umidade do Solo (%)</span>
      </footer>
    </div>
  );
}
