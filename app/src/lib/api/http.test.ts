import { describe, expect, it, vi } from "vitest";

import { mockApi } from "@/test/utils";

import { ApiError, query, request, requestAll } from "./http";

describe("request", () => {
  it("devolve o JSON e manda o corpo como JSON", async () => {
    const { calls } = mockApi({ "POST /api/x": { ok: true } });

    await expect(request("/api/x", { method: "POST", json: { a: 1 } })).resolves.toEqual({ ok: true });
    expect(calls[0]).toEqual({ method: "POST", path: "/api/x", body: { a: 1 } });
  });

  it("usa a mensagem do serviço no erro", async () => {
    mockApi({ "/api/x": { status: 409, body: { message: "MAC duplicado" } } });

    const error = await request("/api/x").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, message: "MAC duplicado" });
  });

  it("tem mensagem padrão quando o corpo não é JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { status: 502 })));
    await expect(request("/api/x")).rejects.toMatchObject({ message: "Erro 502 na requisição." });
  });

  it("devolve undefined em 204", async () => {
    mockApi({ "DELETE /api/x": { status: 204, body: null } });
    await expect(request("/api/x", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("traduz falha de rede em serviço indisponível", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    await expect(request("/api/x")).rejects.toMatchObject({ status: 0, message: expect.stringContaining("indisponível") });
  });
});

describe("requestAll", () => {
  it("junta todas as páginas", async () => {
    mockApi({
      "/api/items": ({ url }: { url: URL }) => {
        const pageNumber = Number(url.searchParams.get("page"));
        return { data: [pageNumber], meta: { total_records: 3, total_pages: 3, current_page: pageNumber } };
      },
    });
    await expect(requestAll<number>("/api/items?x=1")).resolves.toEqual([1, 2, 3]);
  });
});

describe("query", () => {
  it("ignora valores vazios", () => {
    expect(query({ a: 1, b: undefined, c: "", d: null, e: false })).toBe("?a=1&e=false");
    expect(query({})).toBe("");
  });
});
