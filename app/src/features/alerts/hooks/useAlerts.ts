"use client";

import { useCallback, useEffect, useState } from "react";
import type { SensorCatalogItem, StationCatalogItem } from "../mocks/alertsData";
import {
  alertRepository,
  type AlertPagination,
  type AlertRepository,
  type CreateAlertConfigInput,
  type UpdateAlertConfigInput,
} from "../repositories";
import type { AlertItem } from "../types/alert";

export function useAlerts(repository: AlertRepository = alertRepository) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [stations, setStations] = useState<StationCatalogItem[]>([]);
  const [sensors, setSensors] = useState<SensorCatalogItem[]>([]);
  const [pagination, setPagination] = useState<AlertPagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Load static catalogs (stations & sensors) once
  useEffect(() => {
    let active = true;

    async function loadCatalogs() {
      try {
        const [loadedStations, loadedSensors] = await Promise.all([
          repository.listStations(),
          repository.listSensors(),
        ]);
        if (active) {
          setStations(loadedStations);
          setSensors(loadedSensors);
        }
      } catch (err) {
        console.error("[useAlerts] Erro ao carregar catálogos:", err);
      }
    }

    void loadCatalogs();
    return () => {
      active = false;
    };
  }, [repository]);

  // Load paginated alerts
  useEffect(() => {
    let active = true;

    async function fetchAlerts() {
      setLoading(true);
      setError(null);

      try {
        const result = await repository.listAlerts({ page, limit: 50 });
        if (active) {
          setAlerts(result.items);
          setPagination(result.pagination);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Erro ao carregar alertas.",
          );
          setLoading(false);
        }
      }
    }

    void fetchAlerts();
    return () => {
      active = false;
    };
  }, [page, reloadKey, repository]);

  const refresh = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  const createAlert = useCallback(
    async (input: CreateAlertConfigInput): Promise<AlertItem> => {
      setError(null);
      try {
        const created = await repository.createAlertConfig(input);
        setAlerts((prev) => [created, ...prev]);
        return created;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Erro ao criar alerta.";
        setError(msg);
        throw err;
      }
    },
    [repository],
  );

  const updateAlert = useCallback(
    async (id: number, input: UpdateAlertConfigInput): Promise<AlertItem> => {
      setError(null);
      try {
        const updated = await repository.updateAlertConfig(id, input);
        setAlerts((prev) =>
          prev.map((a) => (a.alertConfigId === id ? updated : a)),
        );
        return updated;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Erro ao atualizar alerta.";
        setError(msg);
        throw err;
      }
    },
    [repository],
  );

  const deleteAlert = useCallback(
    async (id: number): Promise<void> => {
      setError(null);
      try {
        await repository.deleteAlertConfig(id);
        setAlerts((prev) => prev.filter((a) => a.alertConfigId !== id));
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Erro ao excluir alerta.";
        setError(msg);
        throw err;
      }
    },
    [repository],
  );

  const acknowledgeAlert = useCallback(
    async (id: number): Promise<void> => {
      setError(null);
      try {
        await repository.acknowledgeAlert(id);
        setAlerts((prev) =>
          prev.map((a) =>
            a.alertConfigId === id || a.triggeredAlertId === id
              ? {
                  ...a,
                  status: "Em análise",
                  acknowledgedBy: "Carlos Mendes",
                  acknowledgedAt: new Date().toISOString(),
                }
              : a,
          ),
        );
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Erro ao reconhecer alerta.";
        setError(msg);
        throw err;
      }
    },
    [repository],
  );

  const getSensorsForStation = useCallback(
    (stationId: number): SensorCatalogItem[] => {
      const list = sensors.filter((s) => s.stationId === stationId);
      return list.length > 0 ? list : sensors.slice(0, 6);
    },
    [sensors],
  );

  return {
    alerts,
    stations,
    sensors,
    pagination,
    page,
    loading,
    error,
    setPage,
    refresh,
    createAlert,
    updateAlert,
    deleteAlert,
    acknowledgeAlert,
    getSensorsForStation,
  };
}
