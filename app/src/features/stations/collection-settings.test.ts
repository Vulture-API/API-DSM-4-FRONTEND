import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/http";
import { collectionErrorMessage, collectionIntervalError, formatCollectionInterval } from "./collection-settings";

// SCRUM-590 — RF21 / US18 / CA7.
describe("validação do intervalo de coleta", () => {
  it.each(["", " "])("exige preenchimento: %j", (value) => {
    expect(collectionIntervalError(value, 10, 300)).toBe("Informe o intervalo de coleta.");
  });
  it.each(["abc", "60.5", "60,5", "NaN", "Infinity", "1e2", "0x40", "-10", "9007199254740993"])("rejeita um inteiro inválido: %s", (value) => {
    expect(collectionIntervalError(value, 10, 300)).toBe("Informe um número inteiro de segundos.");
  });
  it.each(["0", "9", "301"])("respeita os limites do servidor: %s", (value) => {
    expect(collectionIntervalError(value, 10, 300)).toBe("Use um intervalo entre 10 e 300 segundos.");
  });
  it.each(["10", "60", "300", " 120 "])("aceita inteiro dentro dos limites: %s", (value) => {
    expect(collectionIntervalError(value, 10, 300)).toBeUndefined();
  });
  it("não fixa o máximo no frontend", () => {
    expect(collectionIntervalError("600", 10, 900)).toBeUndefined();
    expect(collectionIntervalError("60", 10, 30)).toBeDefined();
  });
});

describe("formatação do intervalo de coleta", () => {
  it.each([[10, "10 segundos"], [60, "60 segundos (1 minuto)"], [120, "120 segundos (2 minutos)"]])("formata %s", (seconds, text) => {
    expect(formatCollectionInterval(Number(seconds))).toBe(text);
  });
});

describe("mensagens da coleta", () => {
  it.each([0, 500, 503])("trata indisponibilidade %s", (status) => {
    expect(collectionErrorMessage(new ApiError(status, "raw"))).toContain("indisponível");
  });
  it("distingue estação ausente e acesso negado", () => {
    expect(collectionErrorMessage(new ApiError(404, "raw"))).toContain("Estação não encontrada");
    expect(collectionErrorMessage(new ApiError(403, "raw"))).toContain("Você não tem permissão");
  });
  it("preserva mensagem de validação retornada pelo servidor", () => {
    expect(collectionErrorMessage(new ApiError(400, "Intervalo inválido"))).toBe("Intervalo inválido");
    expect(collectionErrorMessage(new Error("Falha inesperada"))).toBe("Falha inesperada");
  });
});
