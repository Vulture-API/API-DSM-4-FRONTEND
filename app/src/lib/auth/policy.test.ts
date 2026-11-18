import { describe, expect, it } from "vitest";
import { canPerform, apiPermission, landingPage, pagePermission, safeDestination } from "./policy";

describe("políticas de acesso", () => {
  it("distingue gerenciamento de usuários, monitoramento e regras", () => {
    expect(pagePermission("/administracao/usuarios")).toBe("users.read");
    expect(pagePermission("/alertas/regras")).toBe("alert-configs.read");
    expect(pagePermission("/dashboard/stats")).toBe("monitoring.read");
    expect(pagePermission("/relatorios")).toBe("monitoring.read");
    expect(landingPage([])).toBe("/acesso-negado");
  });
  it("recusa redirecionamentos externos e páginas sem permissão", () => {
    for (const next of ["https://outro.test", "//outro.test", "/\\outro.test", "/administracao/usuarios", "/login", "/dashboard\n"]) {
      expect(safeDestination(next, ["monitoring.read"])).toBe("/dashboard");
    }
    expect(safeDestination("/estacoes/2?tab=dados", ["stations.read"])).toBe("/estacoes/2?tab=dados");
  });
  it("mapeia operações e consultas auxiliares com os códigos do backend", () => {
    expect(apiPermission(["stations", "properties"], "GET")).toBe("properties.read");
    expect(apiPermission(["stations", "2", "current"], "GET")).toBe("monitoring.read");
    expect(apiPermission(["stations"], "POST")).toBe("stations.create");
    expect(apiPermission(["occurrences", "1", "resolve"], "PATCH")).toBe("occurrences.resolve");
    expect(apiPermission(["roles", "2", "permissions"], "PUT")).toBe("roles.permissions.update");
    expect(apiPermission(["alerts", "triggered", "1", "acknowledge"], "PUT")).toBe("triggered-alerts.acknowledge");
    expect(apiPermission(["reports"], "GET")).toBe("monitoring.read");
    expect(apiPermission(["reports"], "POST")).toBe("monitoring.read");
    expect(apiPermission(["readings"], "POST")).toBeNull();
    expect(apiPermission(["unknown"], "GET")).toBeNull();
  });
});


describe("SCRUM-615: Cliente sempre em modo leitura", () => {
  it("nega escrita mesmo com concessão e preserva consultas", () => {
    const client = { role_name: "Cliente", permissions: ["properties.create", "monitoring.read"] };
    expect(canPerform(client, "properties.create")).toBe(false);
    expect(canPerform(client, "monitoring.read")).toBe(true);
    expect(canPerform({ ...client, role_name: "Gerente Agrícola" }, "properties.create")).toBe(true);
    expect(canPerform(null, "monitoring.read")).toBe(false);
  });
});
