import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MockStationRepository } from "../repositories/MockStationRepository";
import type { StationFormValues } from "../types/station";
import { useStations } from "./useStations";

describe("useStations hook", () => {
  it("carrega estações e propriedades com sucesso", async () => {
    const repository = new MockStationRepository();
    const { result } = renderHook(() => useStations(repository));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stations.length).toBeGreaterThan(0);
    expect(result.current.properties.length).toBeGreaterThan(0);
    expect(result.current.selectedStation).toBeDefined();
  });

  it("filtra estações por termo de busca", async () => {
    const repository = new MockStationRepository();
    const { result } = renderHook(() => useStations(repository));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setSearch("Estação 01");
    });

    expect(result.current.filteredStations.length).toBe(1);
    expect(result.current.filteredStations[0].name).toBe("Estação 01");

    act(() => {
      result.current.setSearch("");
    });

    expect(result.current.filteredStations.length).toBe(result.current.stations.length);
  });

  it("cria, atualiza e exclui estação", async () => {
    const repository = new MockStationRepository();
    const { result } = renderHook(() => useStations(repository));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newForm: StationFormValues = {
      name: "Estação Teste Hook",
      propertyId: "1",
      macAddress: "FF:EE:DD:CC:BB:AA",
      latitude: "-23.18",
      longitude: "-45.88",
      status: "ativo",
    };

    let createdStationId = 0;
    await act(async () => {
      const created = await result.current.createStation(newForm);
      createdStationId = created.id;
    });

    expect(result.current.stations.some((s) => s.id === createdStationId)).toBe(true);

    // Atualização
    await act(async () => {
      await result.current.updateStation(createdStationId, {
        ...newForm,
        name: "Estação Teste Atualizada",
      });
    });

    const updated = result.current.stations.find((s) => s.id === createdStationId);
    expect(updated?.name).toBe("Estação Teste Atualizada");

    // Remoção
    await act(async () => {
      await result.current.deleteStation(createdStationId);
    });

    expect(result.current.stations.some((s) => s.id === createdStationId)).toBe(false);
  });
});
