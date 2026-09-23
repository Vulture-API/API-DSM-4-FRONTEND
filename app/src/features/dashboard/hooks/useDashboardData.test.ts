import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDashboardData } from "./useDashboardData";

describe("useDashboardData", () => {
  it("inicializa com filtros padrão e dados consolidados", () => {
    const { result } = renderHook(() => useDashboardData());

    expect(result.current.selectedProperty).toBe("all");
    expect(result.current.selectedPeriod).toBe("24h");
    expect(result.current.summary.totalStations).toBe(12);
    expect(result.current.stations).toHaveLength(12);
    expect(result.current.hourlyCommunication).toHaveLength(8);
  });

  it("filtra dados por propriedade específica", () => {
    const { result } = renderHook(() => useDashboardData());

    act(() => {
      // 1 corresponds to Fazenda Santa Rita (Estações 01, 02, 03, 12)
      result.current.setSelectedProperty("1");
    });

    expect(result.current.selectedProperty).toBe("1");
    expect(result.current.stations).toHaveLength(4);
    expect(
      result.current.stations.every((s) => s.property === "Fazenda Santa Rita")
    ).toBe(true);
  });

  it("atualiza período temporal", () => {
    const { result } = renderHook(() => useDashboardData());

    act(() => {
      result.current.setSelectedPeriod("7d");
    });

    expect(result.current.selectedPeriod).toBe("7d");
    expect(result.current.weather.accumulatedRainfall).toBe(27.3);
  });

  it("executa atualização manual ao chamar handleRefresh", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useDashboardData());

    act(() => {
      result.current.handleRefresh();
    });

    expect(result.current.isRefreshing).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.lastRefreshedAt).toMatch(/Hoje às \d{2}:\d{2}:\d{2}/);
    vi.useRealTimers();
  });
});
