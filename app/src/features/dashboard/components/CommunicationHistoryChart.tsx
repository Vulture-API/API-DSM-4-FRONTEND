"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon/Icon";
import type { HourlyCommunicationPoint } from "../types/dashboard";
import styles from "./CommunicationHistoryChart.module.css";

interface Props {
  data: HourlyCommunicationPoint[];
  slaTarget?: number;
}

export function CommunicationHistoryChart({ data, slaTarget = 95 }: Props) {
  const [activePoint, setActivePoint] = useState<HourlyCommunicationPoint | null>(null);

  if (data.length === 0) return null;

  const width = 600;
  const height = 230;
  const padLeft = 45;
  const padRight = 25;
  const padTop = 25;
  const padBottom = 35;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const minY = 70;
  const maxY = 100;

  const getY = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    const ratio = (clamped - minY) / (maxY - minY);
    return padTop + (1 - ratio) * innerH;
  };

  const getX = (index: number) => {
    if (data.length <= 1) return padLeft + innerW / 2;
    return padLeft + (index / (data.length - 1)) * innerW;
  };

  const points = data.map((d, i) => ({
    x: getX(i),
    y: getY(d.uptimePct),
    raw: d,
  }));

  const pathD = points.reduce((acc, curr, i) => {
    return i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padTop + innerH} L ${points[0].x} ${padTop + innerH} Z`;

  const slaY = getY(slaTarget);

  const gridSteps = [70, 80, 90, 100];

  return (
    <div className={styles.chartContainer} aria-label="Histórico de Disponibilidade da Rede">
      <header className={styles.chartHeader}>
        <div className={styles.chartTitle}>
          <Icon name="activity" />
          Disponibilidade da Rede de Estações (24h)
        </div>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ backgroundColor: "var(--portal-success)" }}
            />
            <span>Disponibilidade Real (%)</span>
          </div>
          <div className={styles.legendItem}>
            <span
              className={styles.legendLine}
              style={{ borderTop: "2px dashed #f59e0b" }}
            />
            <span>Meta SLA ({slaTarget}%)</span>
          </div>
        </div>
      </header>

      <div className={styles.svgWrapper}>
        <svg
          className={styles.chartSvg}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Gráfico de disponibilidade das estações por horário"
        >
          <defs>
            <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--portal-success)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--portal-success)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y labels */}
          {gridSteps.map((step) => {
            const y = getY(step);
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
                  {step}%
                </text>
              </g>
            );
          })}

          {/* SLA target benchmark line */}
          <line
            x1={padLeft}
            y1={slaY}
            x2={width - padRight}
            y2={slaY}
            className={styles.slaLine}
          />
          <text
            x={width - padRight - 4}
            y={slaY - 6}
            textAnchor="end"
            className={styles.slaLabel}
          >
            SLA {slaTarget}%
          </text>

          {/* Area fill */}
          <path d={areaD} className={styles.uptimeArea} />

          {/* Trend line */}
          <path d={pathD} className={styles.uptimePath} />

          {/* Data Points */}
          {points.map((pt) => (
            <g key={pt.raw.hour}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4.5"
                className={styles.pointCircle}
                onMouseEnter={() => setActivePoint(pt.raw)}
                onMouseLeave={() => setActivePoint(null)}
                tabIndex={0}
                aria-label={`${pt.raw.hour}: ${pt.raw.uptimePct}% uptime, ${pt.raw.onlineCount} conectadas, ${pt.raw.offlineCount} offline`}
              />
              <text
                x={pt.x}
                y={height - 10}
                textAnchor="middle"
                className={styles.axisText}
              >
                {pt.raw.hour}
              </text>
            </g>
          ))}
        </svg>

        {activePoint && (
          <div
            className={styles.tooltipBox}
            style={{
              left: `${(getX(data.indexOf(activePoint)) / width) * 100}%`,
              top: `${(getY(activePoint.uptimePct) / height) * 100}%`,
            }}
          >
            {activePoint.hour}: {activePoint.uptimePct}% disponível ({activePoint.onlineCount} online, {activePoint.unstableCount} instáveis, {activePoint.offlineCount} off)
          </div>
        )}
      </div>

      <footer className={styles.chartFooter}>
        <span>Janela de telemetria: 24 horas contínuas</span>
        <span>Amostragem: a cada 2 horas por estação</span>
      </footer>
    </div>
  );
}
