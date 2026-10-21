// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ token: undefined as string | undefined }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => state.token ? { value: state.token } : undefined }) }));

import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as me } from "@/app/api/auth/me/route";
import { GET as forward, POST as create } from "@/app/api/backend/[...path]/route";

const user = { id: 7, role_id: 2, name: "Gerente", email: "gerente@example.com", active: true, created_at: "2026-01-01", permissions: ["monitoring.read", "stations.read"] };
const json = (body: unknown, status = 200) => Response.json(body, { status });
const request = (path: string, body?: unknown, origin = "http://localhost:3010") => new Request(`http://localhost:3010${path}`, {
  method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body),
});
const context = (path: string[]) => ({ params: Promise.resolve({ path }) });

beforeEach(() => { state.token = undefined; vi.stubEnv("USERS_API_URL", "http://backend.test"); vi.stubEnv("STATIONS_API_URL", "http://backend.test"); });
afterEach(() => { vi.unstubAllEnvs(); });

describe("sessão JWT no servidor do frontend", () => {
  it("valida identidade e grava JWT em cookies HttpOnly; o JSON só contém o usuário", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const fetch = vi.fn().mockResolvedValueOnce(json({ access_token: "signed.jwt.token", expires_in: 3600 })).mockResolvedValueOnce(json(user));
    vi.stubGlobal("fetch", fetch);
    const response = await login(request("/api/auth/login", { email: " GERENTE@example.com ", password: " senha " }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(user);
    expect(fetch.mock.calls[0]![1].body).toBe(JSON.stringify({ email: user.email, password: " senha " }));
    expect(fetch.mock.calls[1]![1].headers.Authorization).toBe("Bearer signed.jwt.token");
    expect(response.cookies.get("agritech_session")).toMatchObject({ value: "signed.jwt.token", httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 3600 });
    expect(response.cookies.get("agritech_ws_token")?.path).toBe("/api/stations/current/ws");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("recusa credenciais inválidas sem criar sessão", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ message: "detalhe privado" }, 401)));
    const response = await login(request("/api/auth/login", { email: user.email, password: "errada" }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "E-mail ou senha inválidos." });
    expect(response.cookies.getAll()).toHaveLength(0);
  });

  it("bloqueia outra origem e campos vazios antes de chamar o backend", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    expect((await login(request("/api/auth/login", { email: user.email, password: "senha" }, "https://outro.test"))).status).toBe(403);
    expect((await login(request("/api/auth/login", { email: "inválido", password: "" }))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("preserva limite de tentativas e trata indisponibilidade", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 429, headers: { "Retry-After": "60" } })));
    const response = await login(request("/api/auth/login", { email: user.email, password: "senha" }));
    expect(response.status).toBe(429); expect(response.headers.get("retry-after")).toBe("60");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect((await login(request("/api/auth/login", { email: user.email, password: "senha" }))).status).toBe(503);
  });

  it("consulta identidade e apaga cookies em token expirado", async () => {
    expect((await me()).status).toBe(401);
    state.token = "expired";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({}, 401)));
    const response = await me();
    expect(response.status).toBe(401);
    expect(response.cookies.get("agritech_session")?.maxAge).toBe(0);
    expect(response.cookies.get("agritech_ws_token")?.maxAge).toBe(0);
  });

  it("logout apaga ambos os cookies e rejeita CSRF", async () => {
    expect((await logout(request("/api/auth/logout", undefined, "https://outro.test"))).status).toBe(403);
    const response = await logout(request("/api/auth/logout"));
    expect(response.status).toBe(204);
    expect(response.cookies.getAll().every((cookie) => cookie.maxAge === 0)).toBe(true);
  });
});

describe("proxy autenticado de API", () => {
  it("exige sessão antes de consultar recursos", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    expect((await forward(new Request("http://localhost:3010/api/backend/stations"), context(["stations"]))).status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("usa o JWT do cookie, preserva filtros e nunca aceita token enviado pelo JavaScript", async () => {
    state.token = "real-session";
    const fetch = vi.fn().mockResolvedValueOnce(json(user)).mockResolvedValueOnce(json({ stations: [] })); vi.stubGlobal("fetch", fetch);
    const response = await forward(new Request("http://localhost:3010/api/backend/stations/current?station_id=2", { headers: { Authorization: "Bearer forged" } }), context(["stations", "current"]));
    expect(response.status).toBe(200);
    expect(fetch.mock.calls[1]![0]).toBe("http://backend.test/api/stations/current?station_id=2");
    expect(fetch.mock.calls[1]![1].headers.Authorization).toBe("Bearer real-session");
  });

  it("revalida permissões no backend e impede escrita ou administração de outro perfil", async () => {
    state.token = "session";
    const fetch = vi.fn().mockImplementation(async () => json(user)); vi.stubGlobal("fetch", fetch);
    expect((await forward(new Request("http://localhost:3010/api/backend/users"), context(["users"]))).status).toBe(403);
    expect((await create(request("/api/backend/stations", { name: "Nova" }), context(["stations"]))).status).toBe(403);
    expect(fetch).toHaveBeenCalledTimes(2); // Só /auth/me; nenhum recurso proibido é consultado.
  });

  it("não encaminha destinos arbitrários ou autenticação por catch-all", async () => {
    expect((await forward(new Request("http://localhost:3010/api/backend/auth"), context(["auth", "login"]))).status).toBe(404);
    expect((await forward(new Request("http://localhost:3010/api/backend/unknown"), context(["unknown"]))).status).toBe(404);
    expect((await forward(new Request("http://localhost:3010/api/backend/users"), context(["users", ".."]))).status).toBe(404);
  });

  it("trata falha de rede sem devolver dados simulados", async () => {
    state.token = "session"; vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect((await forward(new Request("http://localhost:3010/api/backend/stations"), context(["stations"]))).status).toBe(503);
  });
});
