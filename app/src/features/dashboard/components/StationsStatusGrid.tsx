"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon/Icon";
import type {
  StationCommunicationDetail,
  StationCommunicationStatus,
} from "../types/dashboard";
import styles from "./StationsStatusGrid.module.css";

interface Props {
  stations: StationCommunicationDetail[];
}

const getCommunicationDelayText = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `Sem comunicação há ${hours} h${
    remainingMinutes > 0 ? ` e ${remainingMinutes} min` : ""
  }`;
};

export function StationsStatusGrid({ stations }: Props) {
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered =
    filterStatus === "all"
      ? stations
      : stations.filter((s) => s.status === filterStatus);

  const getStatusLabel = (status: StationCommunicationStatus) => {
    switch (status) {
      case "online":
        return "Online";
      case "unstable":
        return "Instável";
      case "offline":
        return "Offline";
    }
  };

  const getStatusClass = (status: StationCommunicationStatus) => {
    switch (status) {
      case "online":
        return styles.statusOnline;
      case "unstable":
        return styles.statusUnstable;
      case "offline":
        return styles.statusOffline;
    }
  };

  return (
    <section className={styles.container} aria-label="Monitor de status das estações">
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>
            <Icon name="chart" />
            Status Operacional das Estações
          </h2>
          <span className={styles.stationCount}>
            {filtered.length} de {stations.length} estações
          </span>
        </div>

        <div className={styles.filterTabs} role="group" aria-label="Filtro de status de conexão">
          <button
            type="button"
            className={`${styles.filterBtn} ${filterStatus === "all" ? styles.filterBtnActive : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            Todas ({stations.length})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${filterStatus === "online" ? styles.filterBtnActive : ""}`}
            onClick={() => setFilterStatus("online")}
          >
            Online ({stations.filter((s) => s.status === "online").length})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${filterStatus === "unstable" ? styles.filterBtnActive : ""}`}
            onClick={() => setFilterStatus("unstable")}
          >
            Instáveis ({stations.filter((s) => s.status === "unstable").length})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${filterStatus === "offline" ? styles.filterBtnActive : ""}`}
            onClick={() => setFilterStatus("offline")}
          >
            Offline ({stations.filter((s) => s.status === "offline").length})
          </button>
        </div>
      </header>

      <div className={styles.stationsGrid}>
        {filtered.map((station) => (
          <article
            key={station.id}
            className={styles.stationCard}
            aria-label={`${station.name} - ${getStatusLabel(station.status)}`}
          >
            <div className={styles.stationCardHeader}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className={styles.stationCodeBadge}>{station.codigo}</span>
                  <h3 className={styles.stationName}>{station.name}</h3>
                </div>
                <span className={styles.stationProperty}>{station.property}</span>
              </div>
              <span
                className={`${styles.statusPill} ${getStatusClass(station.status)}`}
              >
                <span className={styles.statusDot} />
                {station.lastCommunicationMinutesAgo > 60 && (
                  <span
                    className={styles.communicationAlertIcon}
                    aria-label={`Alerta de comunicação da ${station.name}: ${getCommunicationDelayText(
                      station.lastCommunicationMinutesAgo,
                    ).toLowerCase()}`}
                    title={getCommunicationDelayText(
                      station.lastCommunicationMinutesAgo,
                    )}
                    data-tooltip={getCommunicationDelayText(
                      station.lastCommunicationMinutesAgo,
                    )}
                    tabIndex={0}
                  >
                    <Icon name="alert" />
                  </span>
                )}
                {getStatusLabel(station.status)}
              </span>
            </div>

            <div className={styles.telemetryRow}>
              <div className={styles.telemetryItem}>
                <span className={styles.telemetryLabel}>Sensores Ativos</span>
                <span className={styles.telemetryValue}>
                  {station.activeSensorsCount} / {station.totalSensorsCount}
                </span>
              </div>

              <div className={styles.telemetryItem}>
                <span className={styles.telemetryLabel}>Consistência</span>
                <span
                  className={styles.telemetryValue}
                  style={{
                    color: station.dataConsistent
                      ? "var(--portal-success)"
                      : "var(--portal-danger)",
                  }}
                >
                  {station.dataConsistent ? "Válida" : "Inconsistente"}
                </span>
              </div>

              <div className={styles.telemetryItem}>
                <span className={styles.telemetryLabel}>Última Leitura</span>
                <span className={styles.telemetryValue}>
                  {station.lastCommunicationMinutesAgo <= 5
                    ? "há instantes"
                    : `há ${station.lastCommunicationMinutesAgo} min`}
                </span>
              </div>

              <div className={styles.telemetryItem}>
                <span className={styles.telemetryLabel}>Coordenadas</span>
                <span className={styles.telemetryValue} style={{ fontSize: "11px" }}>
                  {station.latitude.toFixed(2)}, {station.longitude.toFixed(2)}
                </span>
              </div>
            </div>

            <footer className={styles.stationFooter}>
              <span className={styles.macCode}>{station.macAddress}</span>
              <span>{station.lastCommunication}</span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
