import { afterEach, expect, it, vi } from "vitest";
import { FetchHttpClient } from "./HttpClient";

afterEach(() => vi.unstubAllGlobals());

it("encaminha a requisição ao transporte sem impor contrato de domínio", async () => {
  const response = new Response(null, { status: 204 });
  const transport = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", transport);
  const url = new URL("https://example.com");
  const options = { method: "GET" };
  expect(await new FetchHttpClient().request(url, options)).toBe(response);
  expect(transport).toHaveBeenCalledWith(url, options);
});

it("propaga falha de transporte para a camada responsável", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Falha de rede")));
  await expect(
    new FetchHttpClient().request(new URL("https://example.com")),
  ).rejects.toThrow("Falha de rede");
});
