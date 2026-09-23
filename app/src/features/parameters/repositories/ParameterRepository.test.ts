import { describe, expect, it, vi } from "vitest";
import { MockParameterRepository } from "./MockParameterRepository";
import { ApiParameterRepository } from "./ApiParameterRepository";
import { parameterFormSchema } from "../schemas/parameterSchema";

const values = {
  nome: "Radiação",
  unidade_medida: "W/m²",
  fator: null,
  ganho: null,
};

describe("Catálogo mock", () => {
  it("gera ids sem reutilizá-los após remoção e não compartilha referências", async () => {
    const repository = new MockParameterRepository([]);
    const first = await repository.create(values);
    first.nome = "Alterado";
    expect((await repository.list())[0].nome).toBe("Radiação");
    await repository.remove(first.id);
    const second = await repository.create(values);
    expect(second.id).toBeGreaterThan(first.id);
  });
  it("valida duplicidade também no repository, inclusive na edição", async () => {
    const repository = new MockParameterRepository();
    await expect(
      repository.create({ ...values, nome: "Temperatura" }),
    ).rejects.toThrow();
    await expect(
      repository.update(2, { ...values, nome: "Temperatura" }),
    ).rejects.toThrow();
    expect(await repository.list()).toHaveLength(6);
  });
  it("rejeita edição e remoção de registros inexistentes", async () => {
    const repository = new MockParameterRepository([]);
    await expect(repository.update(99, values)).rejects.toThrow(
      "não encontrado",
    );
  });
});

describe("Integração API (ApiParameterRepository)", () => {
  it("lista parâmetros mapeando DTO da API para o domínio", async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            { id: 1, name: "Temperatura", unit_of_measure: "°C", factor: 1, gain: null },
            { id: 2, name: "Umidade", unit_of_measure: "%" },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    };
    const repository = new ApiParameterRepository("http://api.local", client);
    const result = await repository.list();
    expect(result).toEqual([
      { id: 1, nome: "Temperatura", unidade_medida: "°C", fator: 1, ganho: null },
      { id: 2, nome: "Umidade", unidade_medida: "%", fator: null, ganho: null },
    ]);
  });

  it("cria parâmetro enviando DTO e retornando o domínio criado", async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 10,
            name: "Radiação",
            unit_of_measure: "W/m²",
            factor: null,
            gain: null,
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        ),
      ),
    };
    const repository = new ApiParameterRepository("http://api.local", client);
    const result = await repository.create(values);
    expect(result).toEqual({
      id: 10,
      nome: "Radiação",
      unidade_medida: "W/m²",
      fator: null,
      ganho: null,
    });
  });

  it("atualiza parâmetro enviando DTO e retornando o domínio atualizado", async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 1,
            name: "Radiação",
            unit_of_measure: "W/m²",
            factor: 2,
            gain: 1,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    };
    const repository = new ApiParameterRepository("http://api.local", client);
    const result = await repository.update(1, { ...values, fator: 2, ganho: 1 });
    expect(result).toEqual({
      id: 1,
      nome: "Radiação",
      unidade_medida: "W/m²",
      fator: 2,
      ganho: 1,
    });
  });

  it("remove parâmetro com sucesso quando API responde 204", async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 })),
    };
    const repository = new ApiParameterRepository("http://api.local", client);
    await expect(repository.remove(1)).resolves.toBeUndefined();
  });

  it("trata falha na remoção quando a API responde com erro", async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Falha ao excluir" }), { status: 500 }),
      ),
    };
    const repository = new ApiParameterRepository("http://api.local", client);
    await expect(repository.remove(1)).rejects.toThrow("Falha ao excluir");
  });

  it("trata erro 409 de conflito com mensagem amigável", async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Já cadastrado" }), { status: 409 }),
      ),
    };
    const repository = new ApiParameterRepository("http://api.local", client);
    await expect(repository.create(values)).rejects.toThrow("Conflito: Já cadastrado");
  });

  it("trata erro 404 de registro não encontrado", async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Tipo inexistente" }), { status: 404 }),
      ),
    };
    const repository = new ApiParameterRepository("http://api.local", client);
    await expect(repository.update(99, values)).rejects.toThrow("Registro não encontrado: Tipo inexistente");
  });

  it("trata erro 400 de validação", async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Dados inválidos" }), { status: 400 }),
      ),
    };
    const repository = new ApiParameterRepository("http://api.local", client);
    await expect(repository.create(values)).rejects.toThrow("Dados inválidos");
  });

  it("trata resposta de erro não JSON", async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(
        new Response("Erro interno", { status: 500 }),
      ),
    };
    const repository = new ApiParameterRepository("http://api.local", client);
    await expect(repository.list()).rejects.toThrow("Erro na requisição (500)");
  });

  it("suporta URL relativa e construtor com valores padrão", async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify([]), { status: 200 }),
      ),
    };
    const repoRelative = new ApiParameterRepository("/api/parameters", client);
    expect(await repoRelative.list()).toEqual([]);

    const defaultRepo = new ApiParameterRepository();
    expect(defaultRepo).toBeDefined();
  });
});

describe("Schema conforme Dicionário", () => {
  const schema = parameterFormSchema([]);
  const form = { nome: " Novo ", unidade_medida: " mm ", fator: "", ganho: "" };
  it("normaliza espaços e opcionais vazios", () => {
    expect(schema.parse(form)).toEqual({
      nome: "Novo",
      unidade_medida: "mm",
      fator: null,
      ganho: null,
    });
  });
  it.each(["abc", "1.234", "100000000", "-100000000", "Infinity", "1e5"])(
    "rejeita fator incompatível com DECIMAL(10,2): %s",
    (fator) => {
      expect(schema.safeParse({ ...form, fator }).success).toBe(false);
    },
  );
  it("aceita negativos, zero e duas casas com vírgula ou ponto", () => {
    expect(
      schema.parse({ ...form, fator: "-1,25", ganho: "0.00" }),
    ).toMatchObject({ fator: -1.25, ganho: 0 });
  });
  it("respeita os comprimentos de nome e unidade", () => {
    expect(schema.safeParse({ ...form, nome: "x".repeat(51) }).success).toBe(
      false,
    );
    expect(
      schema.safeParse({ ...form, unidade_medida: "x".repeat(21) }).success,
    ).toBe(false);
  });
});
