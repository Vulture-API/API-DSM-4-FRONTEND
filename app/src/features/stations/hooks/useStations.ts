"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  mapCreateStationInput,
  mapUpdateStationInput,
} from "../mappers/stationApiMapper";
import { stationRepository } from "../repositories";
import type { StationRepository } from "../repositories/StationRepository";
import type {
  Property,
  Station,
  StationFormValues,
} from "../types/station";

export function useStations(
  repository: StationRepository = stationRepository,
) {
  const [stations, setStations] = useState<Station[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [paginated, props] = await Promise.all([
          repository.list({ page, limit }),
          repository.listProperties(),
        ]);

        if (active) {
          setStations(paginated.items);
          setPagination(paginated.pagination);
          setProperties(props);

          setSelectedStationId((current) => {
            if (current && paginated.items.some((s) => s.id === current)) {
              return current;
            }
            return paginated.items[0]?.id ?? null;
          });
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Erro ao carregar dados.",
          );
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [repository, page, limit, reloadKey]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setReloadKey((prev) => prev + 1);
  }, []);

  const handleSetPage = useCallback((newPage: number) => {
    setLoading(true);
    setPage(newPage);
  }, []);

  const selectedStation = useMemo(() => {
    if (!stations.length) return null;
    return stations.find((s) => s.id === selectedStationId) || stations[0];
  }, [stations, selectedStationId]);

  const filteredStations = useMemo(() => {
    if (!search.trim()) return stations;
    const term = search.toLowerCase().trim();
    return stations.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.propriedade.toLowerCase().includes(term) ||
        s.macAddress.toLowerCase().includes(term) ||
        (s.status === "ativo" ? "ativo" : "inativo").includes(term),
    );
  }, [stations, search]);

  const createStation = async (form: StationFormValues): Promise<Station> => {
    setError(null);
    const input = mapCreateStationInput(form);
    const created = await repository.create(input);
    await refresh();
    setSelectedStationId(created.id);
    return created;
  };

  const updateStation = async (
    id: number,
    form: StationFormValues,
  ): Promise<Station> => {
    setError(null);
    const input = mapUpdateStationInput(form);
    const updated = await repository.update(id, input);
    await refresh();
    setSelectedStationId(updated.id);
    return updated;
  };

  const deleteStation = async (id: number): Promise<void> => {
    setError(null);
    await repository.delete(id);
    await refresh();
  };

  return {
    stations,
    properties,
    pagination,
    page,
    setPage: handleSetPage,
    loading,
    error,
    search,
    setSearch,
    selectedStation,
    selectedStationId,
    setSelectedStationId,
    filteredStations,
    createStation,
    updateStation,
    deleteStation,
    refresh,
  };
}
