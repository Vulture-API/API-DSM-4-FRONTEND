import { afterEach, describe, expect, it, vi } from "vitest";

import { FetchHttpClient } from "./HttpClient";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FetchHttpClient", () => {
  it("encaminha a URL e as opções para o fetch", async () => {
    const response = new Response(
      JSON.stringify({ id: 1 }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const transport = vi.fn().mockResolvedValue(response);

    vi.stubGlobal("fetch", transport);

    const client = new FetchHttpClient();

    const url = new URL(
      "http://localhost/api/backend/users/1",
    );

    const options: RequestInit = {
      method: "GET",
    };

    const result = await client.request(url, options);

    expect(transport).toHaveBeenCalledWith(
      url,
      options,
    );

    expect(result).toBe(response);
  });

  it("retorna o Response sem transformar o conteúdo", async () => {
    const response = new Response(
      JSON.stringify({
        id: 1,
        name: "Maria",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response),
    );

    const client = new FetchHttpClient();

    const result = await client.request(
      new URL("http://localhost/api/backend/users/1"),
    );

    expect(result).toBe(response);
    expect(result.status).toBe(200);

    await expect(result.json()).resolves.toEqual({
      id: 1,
      name: "Maria",
    });
  });

  it("retorna resposta 204 sem tentar ler o body", async () => {
    const response = new Response(null, {
      status: 204,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response),
    );

    const client = new FetchHttpClient();

    const result = await client.request(
      new URL("http://localhost/api/backend/users/1"),
      {
        method: "DELETE",
      },
    );

    expect(result).toBe(response);
    expect(result.status).toBe(204);
    expect(result.ok).toBe(true);
  });

  it.each([400, 404, 409, 500])(
    "retorna Response mesmo quando o HTTP é %i",
    async (status) => {
      const response = new Response(
        JSON.stringify({
          code: status,
          message: `Falha ${status}`,
          details: ["detalhe"],
        }),
        {
          status,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(response),
      );

      const client = new FetchHttpClient();

      const result = await client.request(
        new URL("http://localhost/api/backend/users"),
      );

      expect(result).toBe(response);

      expect(result.status).toBe(status);
      expect(result.ok).toBe(false);

      await expect(result.json()).resolves.toEqual({
        code: status,
        message: `Falha ${status}`,
        details: ["detalhe"],
      });
    },
  );

  it("propaga erro de rede do fetch", async () => {
    const networkError = new Error("Falha de rede");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(networkError),
    );

    const client = new FetchHttpClient();

    await expect(
      client.request(
        new URL(
          "http://localhost/api/backend/users",
        ),
      ),
    ).rejects.toBe(networkError);
  });

  it("funciona sem options", async () => {
    const response = new Response(null, {
      status: 200,
    });

    const transport = vi.fn().mockResolvedValue(response);

    vi.stubGlobal("fetch", transport);

    const client = new FetchHttpClient();

    const url = new URL(
      "http://localhost/api/backend/users",
    );

    await client.request(url);

    expect(transport).toHaveBeenCalledWith(
      url,
      undefined,
    );
  });
});