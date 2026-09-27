import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { defaultRoutes, mockApi, renderWithProviders } from "@/test/utils";

import { UsersPage } from "./UsersPage";

describe("UsersPage", () => {
  it("lista em ordem alfabética com cargo e status", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<UsersPage />);

    await screen.findByText("Carlos Mendes");
    const names = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("paragraph")[0]?.firstChild?.textContent);
    expect(names).toEqual(["Carlos Mendes", "Mariana Albuquerque", "Paulo Dias"]);
    expect(screen.getByText("Paulo Dias").closest("tr")).toHaveTextContent("Inativo");
    const mariana = screen.getByText("Mariana Albuquerque").closest("tr")!;
    expect(await within(mariana).findByText("Administrador")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Paulo Dias ativo" })).toHaveAttribute("aria-checked", "false");
  });

  it("filtra por cargo, status e busca", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());
    renderWithProviders(<UsersPage />);
    await screen.findByText("Carlos Mendes");

    await user.click(screen.getByRole("radio", { name: /Inativos/ }));
    expect(screen.getAllByRole("row")).toHaveLength(2);
    await user.click(screen.getByRole("radio", { name: /Ativos/ }));
    expect(screen.queryByText("Paulo Dias")).not.toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /Todos/ }));
    await user.selectOptions(screen.getByLabelText("Filtrar por cargo"), "1");
    expect(screen.getAllByRole("row")).toHaveLength(2);
    await user.selectOptions(screen.getByLabelText("Filtrar por cargo"), "");
    await user.type(screen.getByLabelText("Buscar usuário"), "carlos@");
    expect(screen.getByText("Carlos Mendes")).toBeInTheDocument();
    expect(screen.queryByText("Mariana Albuquerque")).not.toBeInTheDocument();
  });

  it("valida e cadastra", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi({ ...defaultRoutes(), "POST /api/users": { id: 9 } });
    renderWithProviders(<UsersPage />);
    await screen.findByText("Carlos Mendes");

    await user.click(screen.getByRole("button", { name: "Novo usuário" }));
    const dialog = screen.getByRole("dialog", { name: "Novo usuário" });
    await user.click(within(dialog).getByRole("button", { name: "Cadastrar" }));
    expect(within(dialog).getByText("E-mail inválido.")).toBeInTheDocument();
    expect(within(dialog).getByText("Mínimo de 8 caracteres.", { selector: "p[id$=error]" })).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText("Nome completo"), "Ana Lima");
    await user.type(within(dialog).getByLabelText("E-mail"), "ana@agritech.dev");
    await user.type(within(dialog).getByLabelText("Senha"), "senha-segura");
    await user.selectOptions(within(dialog).getByLabelText("Cargo"), "2");
    await user.click(within(dialog).getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("Usuário cadastrado.")).toBeInTheDocument();
    expect(calls.find((c) => c.method === "POST")?.body).toEqual({
      name: "Ana Lima",
      email: "ana@agritech.dev",
      password: "senha-segura",
      role_id: 2,
      active: true,
    });
  });

  it("edita sem mexer no e-mail, desativa e exclui", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi({
      ...defaultRoutes(),
      "PUT /api/users/2": { id: 2 },
      "DELETE /api/users/3": { status: 409, body: { message: "Usuário tem registros vinculados." } },
    });
    renderWithProviders(<UsersPage />);

    await user.click(await screen.findByRole("button", { name: "Editar Carlos Mendes" }));
    const dialog = screen.getByRole("dialog", { name: "Editar usuário" });
    expect(within(dialog).getByLabelText("E-mail")).toBeDisabled();
    expect(within(dialog).queryByLabelText("Senha")).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Usuário atualizado.")).toBeInTheDocument();
    expect(calls.find((c) => c.method === "PUT")?.body).toEqual({ name: "Carlos Mendes", role_id: 2, active: true });

    await user.click(screen.getByRole("switch", { name: "Carlos Mendes ativo" }));
    await waitFor(() => expect(calls.filter((c) => c.method === "PUT")).toHaveLength(2));
    expect(calls.filter((c) => c.method === "PUT")[1]?.body).toMatchObject({ active: false });

    await user.click(screen.getByRole("button", { name: "Excluir Paulo Dias" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Excluir" }));
    expect(await screen.findByText("Usuário tem registros vinculados.")).toBeInTheDocument();
  });
});
