"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon/Icon";
import type { RainfallPoint } from "../types/dashboard";
import styles from "./RainfallChart.module.css";

interface Props {
  data: RainfallPoint[];
}

export function RainfallChart({ data }: Props) {
  const [activeBar, setActiveBar] = useState<RainfallPoint | null>(null);

  if (data.length === 0) return null;

  const totalVolume = data.reduce((acc, curr) => acc + curr.amountMm, 0);

  const width = 600;
  const height = 230;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 25;
  const padBottom = 35;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const maxVal = Math.max(...data.map((d) => d.amountMm), 15);
  const roundedMax = Math.ceil(maxVal / 5) * 5;

  const barWidth = Math.min(36, (innerW / data.length) * 0.6);
  const stepX = innerW / data.length;

  const getY = (val: number) => {
    const ratio = val / roundedMax;
    return padTop + (1 - ratio) * innerH;
  };

  const steps = [0, roundedMax / 2, roundedMax];

  return (
    <div className={styles.chartContainer} aria-label="Precipitação Pluviométrica">
      <header className={styles.chartHeader}>
        <div className={styles.chartTitle}>
          <Icon name="rain" />
          Precipitação Pluviométrica Acumulada
        </div>
        <span className={styles.totalVolume}>
          Total acumulado: {totalVolume.toFixed(1)} mm
        </span>
      </header>

      <div className={styles.svgWrapper}>
        <svg
          className={styles.chartSvg}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Gráfico de barras de chuva acumulada"
        >
          {/* Grid lines and Y labels */}
          {steps.map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
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
                  {val.toFixed(0)} mm
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((d, i) => {
            const x = padLeft + i * stepX + (stepX - barWidth) / 2;
            const y = getY(d.amountMm);
            const barH = padTop + innerH - y;

            return (
              <g key={d.label}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(2, barH)}
                  className={styles.bar}
                  onMouseEnter={() => setActiveBar(d)}
                  onMouseLeave={() => setActiveBar(null)}
                  tabIndex={0}
                  aria-label={`${d.label}: ${d.amountMm.toFixed(1)} mm`}
                />
                <text
                  x={x + barWidth / 2}
                  y={height - 10}
                  textAnchor="middle"
                  className={styles.axisText}
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>

        {activeBar && (
          <div
            className={styles.tooltipBox}
            style={{
              left: `${
                ((padLeft +
                  data.indexOf(activeBar) * stepX +
                  stepX / 2) /
                  width) *
                100
              }%`,
              top: `${(getY(activeBar.amountMm) / height) * 100}%`,
            }}
          >
            {activeBar.label}: {activeBar.amountMm.toFixed(1)} mm
          </div>
        )}
      </div>

      <footer className={styles.chartFooter}>
        <span>Fonte: Pluviômetros digitais de alta precisão</span>
        <span>Unidade de medição: milímetros (mm)</span>
      </footer>
    </div>
  );
}
