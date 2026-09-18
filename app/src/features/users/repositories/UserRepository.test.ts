import { describe, expect, it } from "vitest";
import { MockUserRepository } from "./MockUserRepository";
import { ApiUserRepository } from "./ApiUserRepository";

describe("Repositories de usuários", () => {
  it("retorna projeções coerentes sem dados secretos e sem compartilhar objetos mutáveis", async () => {
    const repository = new MockUserRepository();
    const users = await repository.list();
    expect(users).toHaveLength(6);
    expect(new Set(users.map(({ id }) => id)).size).toBe(users.length);
    for (const user of users) {
      expect(user.cargo_id).toBe(user.cargo.id);
      expect(typeof user.ativo).toBe("boolean");
      expect(user.nome.length).toBeLessThanOrEqual(150);
      expect(user.email?.length).toBeLessThanOrEqual(150);
      expect(user).not.toHaveProperty("senha_hash");
      expect(user).not.toHaveProperty("grupo");
      expect(Number.isNaN(Date.parse(user.criado_em))).toBe(false);
    }
    users[0].nome = "Alterado";
    users[0].cargo.nome = "Alterado";
    const fresh = await repository.list();
    expect(fresh[0].nome).toBe("João pé de feijão");
    expect(fresh[0].cargo.nome).toBe("ADMIN");
  });

  it("explicita que a API aguarda contrato oficial", async () => {
    await expect(new ApiUserRepository().list()).rejects.toThrow(
      "contrato OpenAPI oficial",
    );
  });
});
