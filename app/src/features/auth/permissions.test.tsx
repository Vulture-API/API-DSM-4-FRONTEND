import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RulesPage } from "@/features/alerts/RulesPage";
import { StationsPage } from "@/features/stations/StationsPage";
import { defaultRoutes, mockApi, renderWithProviders, testUser } from "@/test/utils";

describe("ações por permissão", () => {
  it("mantém as estações visíveis para consulta sem expor cadastro, edição ou exclusão", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<StationsPage />, { ...testUser, permissions: ["stations.read", "monitoring.read", "properties.read"] });
    expect(await screen.findByText("Estação Sede")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Nova estação/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Editar Estação/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Excluir Estação/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir Estação Sede" })).toBeInTheDocument();
  });
  it("permite regras ao gerente sem consultar a administração de usuários", async () => {
    const { calls } = mockApi(defaultRoutes());
    const permissions = ["alert-configs.read", "alert-configs.create", "alert-configs.update", "alert-configs.delete", "stations.read", "properties.read", "sensors.read", "sensor-types.read"];
    renderWithProviders(<RulesPage />, { ...testUser, permissions });
    await screen.findByText("Temperatura alta na sede");
    await userEvent.setup().click(screen.getByRole("button", { name: /Nova regra/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(calls.some((call) => call.path.startsWith("/api/users"))).toBe(false);
  });
});
