import { describe, expect, it } from "vitest";

import { defaultRoutes, mockApi } from "@/test/utils";

import { readingsApi } from "./api";

describe("readingsApi", () => {
  it("busca leituras paginadas com parâmetros", async () => {
    const { calls } = mockApi(defaultRoutes());

    const result = await readingsApi.list({
      sensor_id: 10,
      start_unix_time: 1700000000,
      end_unix_time: 1700100000,
      page: 1,
      limit: 20,
    });

    expect(result.data).toBeDefined();
    expect(result.meta).toMatchObject({
      current_page: 1,
    });
    expect(
      calls.some((c) =>
        c.path.startsWith("/api/readings?") &&
        c.path.includes("sensor_id=10") &&
        c.path.includes("page=1") &&
        c.path.includes("limit=20"),
      ),
    ).toBe(true);
  });
});
