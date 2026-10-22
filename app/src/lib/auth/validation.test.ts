// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session.server", () => ({
  sameOrigin: () => true,
  errorResponse: (status: number, message: string) => Response.json({ message }, { status }),
  apiDestination: vi.fn(), fetchIdentity: vi.fn(), isAuthUser: vi.fn(), setSession: vi.fn(),
}));

import { POST } from "@/app/api/auth/login/route";
import { isValidLoginEmail } from "./validation";

describe("validação de e-mail sem backtracking", () => {
  it.each(["admin@agritech.com", " gerente@example.com ", "nome.sobrenome+campo@sub.example.com"])("aceita endereço válido: %s", (email) => {
    expect(isValidLoginEmail(email)).toBe(true);
  });
  it.each(["", "admin", "@example.com", "a@@example.com", "a@b", "a@b.", "a@.b", "a b@example.com", "a@b. c", "a\n@example.com"])("recusa endereço inválido: %j", (email) => {
    expect(isValidLoginEmail(email)).toBe(false);
  });
  it("respeita o limite de 150 caracteres", () => {
    expect(isValidLoginEmail("a".repeat(144) + "@b.com")).toBe(true);
    expect(isValidLoginEmail("a".repeat(145) + "@b.com")).toBe(false);
  });
  it("recusa o padrão adversarial apontado pelo CodeQL", () => {
    expect(isValidLoginEmail("!@!." + "!.".repeat(100_000))).toBe(false);
  });
  it("rejeita entrada excessiva na rota antes de chamar a API", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const response = await POST(new Request("http://localhost:3010/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "!@!." + "!.".repeat(100_000), password: "senha123" }),
    }));
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
});
