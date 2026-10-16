import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { defaultRoutes, mockApi } from "@/test/utils";

import { stationsApi } from "./api";
import {
  useCurrentData,
  useForecast,
  useStationStatistics,
  useStationStatus,
  useStatistics,
} from "./hooks";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("stationsApi - OpenAPI 1.5.0", () => {
  it("chama os endpoints de estatísticas, previsão e status", async () => {
    mockApi(defaultRoutes());

    const stats = await stationsApi.statistics({ property_id: 1 });
    expect(stats.sensor_types).toBeDefined();

    const stationStats = await stationsApi.stationStatistics(1);
    expect(stationStats.sensor_types).toBeDefined();

    const forecast = await stationsApi.forecast(1, 5);
    expect(forecast.days).toBeDefined();

    const current = await stationsApi.current({ station_id: 1 });
    expect(current.stations).toBeDefined();

    const stationCurrent = await stationsApi.stationCurrent(1);
    expect(stationCurrent.stations).toBeDefined();

    const status = await stationsApi.status(1);
    expect(status.status).toBe("Online");
  });

  it("executa os hooks React Query correspondentes", async () => {
    mockApi(defaultRoutes());

    const { result: rStats } = renderHook(() => useStatistics(), { wrapper });
    await waitFor(() => expect(rStats.current.isSuccess).toBe(true));

    const { result: rStationStats } = renderHook(() => useStationStatistics(1), { wrapper });
    await waitFor(() => expect(rStationStats.current.isSuccess).toBe(true));

    const { result: rForecast } = renderHook(() => useForecast(1, 7), { wrapper });
    await waitFor(() => expect(rForecast.current.isSuccess).toBe(true));

    const { result: rCurrent } = renderHook(() => useCurrentData(), { wrapper });
    await waitFor(() => expect(rCurrent.current.isSuccess).toBe(true));

    const { result: rStatus } = renderHook(() => useStationStatus(1), { wrapper });
    await waitFor(() => expect(rStatus.current.isSuccess).toBe(true));
  });
});
