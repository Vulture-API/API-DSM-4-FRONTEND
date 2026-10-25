import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { defaultRoutes, mockApi, renderWithProviders, testUser } from "@/test/utils";

import { groupPermissions, RolesPage } from "./RolesPage";

const roles = [
  { id: 1, name: "Administrador", description: "Acesso total", permissions: ["monitoring.read", "stations.read", "stations.create"] },
  { id: 2, name: "Cliente", description: null, permissions: ["monitoring.read"] },
];
const catalog = [
  { code: "monitoring.read", description: "Consultar monitoramento" },
  { code: "stations.create", description: "Criar estações" },
  { code: "stations.read", description: "Consultar estações" },
];

function routes(extra: Record<string, unknown> = {}) {
  return { ...defaultRoutes(), "/api/roles": roles, "/api/permissions": catalog, ...extra };
}

describe("Perfis e permissões (SCRUM-436)", () => {
  it("agrupa o catálogo pelo recurso", () => {
    expect(groupPermissions(catalog).map((g) => [g.label, g.items.length])).toEqual([["Estações", 2], ["Monitoramento", 1]]);
  });

  it("marca permissões de um perfil e salva a lista completa", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi(routes({ "PUT /api/roles/2/permissions": { role_id: 2, permissions: [] } }));
    renderWithProviders(<RolesPage />);

    await user.click(await screen.findByRole("button", { name: /^Cliente/ }));
    const save = screen.getByRole("button", { name: "Salvar permissões" });
    expect(save).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /Consultar estações/ }));
    expect(save).toBeEnabled();
    await user.click(save);

    expect(await screen.findByText('Permissões do perfil "Cliente" atualizadas.')).toBeInTheDocument();
    const put = calls.find((c) => c.method === "PUT" && c.path === "/api/roles/2/permissions");
    expect(put?.body).toEqual({ permissions: ["monitoring.read", "stations.read"] });
  });

  it("cria perfil novo", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi(routes({ "POST /api/roles": { id: 9, name: "Técnico", description: null, permissions: [] } }));
    renderWithProviders(<RolesPage />);

    await user.click(await screen.findByRole("button", { name: "Novo perfil" }));
    const dialog = screen.getByRole("dialog", { name: "Novo perfil" });
    await user.click(within(dialog).getByRole("button", { name: "Criar perfil" }));
    expect(within(dialog).getByText("Informe o nome do perfil.")).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText("Nome"), "Técnico");
    await user.click(within(dialog).getByRole("button", { name: "Criar perfil" }));

    await waitFor(() => expect(calls.some((c) => c.method === "POST" && c.path === "/api/roles")).toBe(true));
    expect(calls.find((c) => c.method === "POST")?.body).toEqual({ name: "Técnico", description: null });
  });

  it("não oferece excluir perfil com usuários", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi(routes());
    renderWithProviders(<RolesPage />);

    await user.click(await screen.findByRole("button", { name: "Excluir Administrador" }));
    const dialog = screen.getByRole("dialog", { name: "Excluir perfil" });
    await waitFor(() => expect(within(dialog).getByText(/atribuído a/)).toBeInTheDocument());
    expect(within(dialog).queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();
    expect(calls.some((c) => c.method === "DELETE")).toBe(false);
  });

  it("perfil sem permissão de edição só consulta", async () => {
    mockApi(routes());
    renderWithProviders(<RolesPage />, { ...testUser, permissions: ["roles.read", "permissions.read"] });

    expect(await screen.findByText("Permissões — Administrador")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar permissões" })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Criar estações/ })).toBeDisabled();
  });
});
