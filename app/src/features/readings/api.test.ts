import { describe, expect, it } from "vitest";

import { defaultRoutes, mockApi } from "@/test/utils";

import { readingsApi } from "./api";

describe("readingsApi - [QA] Endpoint de histórico e leituras", () => {
  it("Cenário 1: consulta de histórico com registros disponíveis", async () => {
    const { calls } = mockApi(defaultRoutes());

    const result = await readingsApi.list({
      page: 1,
      limit: 20,
    });

    expect(result.data).toBeDefined();
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.meta).toMatchObject({
      current_page: 1,
    });
    expect(
      calls.some((c) => c.path.startsWith("/api/readings?") && c.path.includes("page=1")),
    ).toBe(true);
  });

  it("Cenário 2: consulta sem registros disponíveis (retorno vazio)", async () => {
    mockApi({
      "/api/readings": {
        data: [],
        meta: {
          total_records: 0,
          total_pages: 0,
          current_page: 1,
        },
      },
    });

    const result = await readingsApi.list({ page: 1, limit: 10 });
    expect(result.data).toEqual([]);
    expect(result.meta.total_records).toBe(0);
  });

  it("Cenário 3: filtro por período (start_unix_time e end_unix_time)", async () => {
    const { calls } = mockApi(defaultRoutes());

    const start = 1791849600;
    const end = 1791936000;

    await readingsApi.list({
      start_unix_time: start,
      end_unix_time: end,
    });

    expect(
      calls.some(
        (c) =>
          c.path.startsWith("/api/readings?") &&
          c.path.includes(`start_unix_time=${start}`) &&
          c.path.includes(`end_unix_time=${end}`),
      ),
    ).toBe(true);
  });

  it("Cenário 4: filtro por sensor/estação (sensor_id)", async () => {
    const { calls } = mockApi(defaultRoutes());

    await readingsApi.list({
      sensor_id: 10,
    });

    expect(
      calls.some(
        (c) => c.path.startsWith("/api/readings?") && c.path.includes("sensor_id=10"),
      ),
    ).toBe(true);
  });

  it("Cenário 5: utilização simultânea dos filtros de período e sensor", async () => {
    const { calls } = mockApi(defaultRoutes());

    await readingsApi.list({
      sensor_id: 10,
      start_unix_time: 1791800000,
      end_unix_time: 1791900000,
      page: 1,
      limit: 50,
    });

    expect(
      calls.some(
        (c) =>
          c.path.startsWith("/api/readings?") &&
          c.path.includes("sensor_id=10") &&
          c.path.includes("start_unix_time=1791800000") &&
          c.path.includes("end_unix_time=1791900000") &&
          c.path.includes("limit=50"),
      ),
    ).toBe(true);
  });

  it("Cenário 8: falha de comunicação com a API (HTTP 500)", async () => {
    mockApi({
      "/api/readings": {
        status: 500,
        body: { message: "Falha de comunicação interna no servidor de telemetria" },
      },
    });

    await expect(readingsApi.list()).rejects.toThrow("Falha de comunicação interna no servidor de telemetria");
  });
});
