import { describe, expect, it } from "vitest";
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
    await expect(repository.remove(99)).rejects.toThrow("não encontrado");
  });
  it("mantém toda operação de API explicitamente pendente", async () => {
    const repository = new ApiParameterRepository();
    for (const operation of [
      repository.list(),
      repository.create(values),
      repository.update(1, values),
      repository.remove(1),
    ]) {
      await expect(operation).rejects.toThrow("OpenAPI oficial");
    }
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
