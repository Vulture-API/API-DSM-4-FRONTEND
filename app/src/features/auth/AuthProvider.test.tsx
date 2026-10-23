import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { TopNav } from "@/components/layout/TopNav";
import { SESSION_EXPIRED } from "@/lib/auth/policy";
import { testUser } from "@/test/utils";

import { AuthGate } from "./AuthGate";
import { AuthProvider, useAuth } from "./AuthProvider";
import { LoginScreen } from "./LoginScreen";
import type { AuthUser } from "./types";

const navigation = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn(), path: "/dashboard" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.path, useRouter: () => navigation }));
vi.mock("@/components/ui/Toast", () => ({ useToast: () => ({ error: vi.fn() }) }));

function mount(children: ReactNode, initialUser?: AuthUser, validateSession = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const result = render(<QueryClientProvider client={client}><AuthProvider initialUser={initialUser} validateSession={validateSession}>{children}</AuthProvider></QueryClientProvider>);
  return { client, ...result };
}
function Status() {
  const auth = useAuth();
  return <><p>{auth.user?.name ?? "Sem sessão"}</p><button onClick={() => void auth.logout()}>Encerrar</button></>;
}

describe("autenticação da interface", () => {
  it("aguarda /me sem montar a página e redireciona a pessoa sem sessão", async () => {
    let resolve!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((done) => { resolve = done; })));
    navigation.path = "/estacoes/2"; navigation.replace.mockClear();
    mount(<AuthGate><p>Dados protegidos</p></AuthGate>);
    expect(screen.getByRole("status", { name: "Verificando sessão" })).toBeInTheDocument();
    expect(screen.queryByText("Dados protegidos")).not.toBeInTheDocument();
    await act(async () => resolve(new Response("", { status: 401 })));
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith("/login?next=%2Festacoes%2F2"));
  });

  it("exibe falha de autenticação com opção de tentar novamente", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message: "API indisponível" }, { status: 503 })));
    mount(<AuthGate><p>Dados protegidos</p></AuthGate>);
    expect(await screen.findByText("API indisponível")).toBeInTheDocument();
    expect(screen.queryByText("Dados protegidos")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tentar/ })).toBeInTheDocument();
  });

  it("bloqueia endereço digitado manualmente sem a permissão correspondente", () => {
    navigation.path = "/administracao/usuarios";
    mount(<AuthGate><p>Lista de usuários</p></AuthGate>, { ...testUser, permissions: ["monitoring.read"] }, false);
    expect(screen.getByRole("heading", { name: "Acesso não permitido" })).toBeInTheDocument();
    expect(screen.queryByText("Lista de usuários")).not.toBeInTheDocument();
  });

  it("faz login real pelo endpoint do Next e encaminha para uma página permitida", async () => {
    const user = userEvent.setup(); navigation.replace.mockClear();
    const fetch = vi.fn(async (input: RequestInfo | URL) => String(input).endsWith("/me")
      ? new Response("", { status: 401 }) : Response.json({ ...testUser, permissions: ["stations.read"] }));
    vi.stubGlobal("fetch", fetch);
    mount(<LoginScreen />);
    await user.type(screen.getByLabelText("E-mail"), testUser.email);
    await user.type(screen.getByLabelText("Senha"), "senha");
    await user.click(screen.getByRole("button", { name: "Entrar na plataforma" }));
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith("/estacoes"));
    expect(fetch).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({ method: "POST", credentials: "same-origin" }));
  });

  it("encerra sessão e remove dados privados do cache", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const { client } = mount(<Status />, testUser, false);
    client.setQueryData(["stations", "current"], { private: true });
    await user.click(screen.getByRole("button", { name: "Encerrar" }));
    await waitFor(() => expect(screen.getByText("Sem sessão")).toBeInTheDocument());
    expect(client.getQueryData(["stations", "current"])).toBeUndefined();
  });

  it("desmonta o conteúdo quando uma chamada de API sinaliza token expirado", async () => {
    navigation.path = "/dashboard";
    mount(<AuthGate><p>Dados protegidos</p></AuthGate>, testUser, false);
    expect(screen.getByText("Dados protegidos")).toBeInTheDocument();
    await act(async () => window.dispatchEvent(new Event(SESSION_EXPIRED)));
    await waitFor(() => expect(screen.queryByText("Dados protegidos")).not.toBeInTheDocument());
  });

  it("oculta usuários e configuração de alertas do menu de consulta", async () => {
    navigation.path = "/dashboard";
    mount(<TopNav />, { ...testUser, permissions: ["monitoring.read", "stations.read", "sensors.read", "sensor-types.read", "properties.read"] }, false);
    const user = userEvent.setup();
    expect(screen.queryByRole("button", { name: "Administração" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Alertas" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Monitoramento" }));
    expect(screen.getByRole("link", { name: /Dashboard/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Usuários/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sair da conta" })).toBeInTheDocument();
  });
});
