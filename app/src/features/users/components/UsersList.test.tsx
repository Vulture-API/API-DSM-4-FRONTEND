import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import UsersPage from "@/app/administracao/usuarios/page";
import { MockUserRepository } from "../repositories/MockUserRepository";
import type { UserRepository } from "../repositories/UserRepository";
import type { UserListItem } from "../types/user";
import { UsersList } from "./UsersList";

describe("Listagem de usuários", () => {
  it("limpa a busca pelo teclado e devolve o foco ao campo", async () => {
    const user = userEvent.setup();
    render(<UsersList />);
    await screen.findByRole("table");
    const search = screen.getByRole("searchbox");
    await user.type(search, "inexistente");
    await user.tab();
    expect(screen.getByRole("button", { name: "Limpar busca" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(search).toHaveValue("");
    expect(search).toHaveFocus();
    expect(screen.getAllByRole("row")).toHaveLength(7);
    expect(
      screen.queryByRole("button", { name: "Limpar busca" }),
    ).not.toBeInTheDocument();
  });

  it("explica os controles indisponíveis sem depender de tooltip nativo", async () => {
    render(<UsersList />);
    await screen.findByRole("table");
    for (const name of ["Filtrar por Grupo", "Convidar Membro"]) {
      const button = screen.getByRole("button", { name });
      expect(button).toBeDisabled();
      expect(button).toHaveAccessibleDescription(
        /Filtro por grupo indisponível/,
      );
      expect(button).not.toHaveAttribute("title");
    }
  });

  it("preserva o nome e e-mail completos no conteúdo acessível mesmo quando longos", async () => {
    const [base] = await new MockUserRepository().list();
    const nome = "Maria Aparecida de Albuquerque e Silva";
    const email = "maria.aparecida.albuquerque.silva@example.com";
    render(
      <UsersList
        repository={{ list: async () => [{ ...base, nome, email }] }}
      />,
    );
    expect(await screen.findByText(email)).toHaveAttribute("title", email);
    expect(screen.getByText(nome)).toBeInTheDocument();
  });

  it("compõe o portal e exibe usuários do repository mock nas colunas aprovadas", async () => {
    render(<UsersPage />);
    expect(
      screen.getByRole("heading", { name: "Administração de Usuários" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Navegação principal" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Administração" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    const table = await screen.findByRole("table", {
      name: "Usuários cadastrados",
    });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Nome do usuário", "Cargo", "Status"]);
    expect(within(table).getAllByRole("row")).toHaveLength(7);
    expect(
      within(table).getByText("joao.feijao@example.com"),
    ).toBeInTheDocument();
    expect(within(table).getByText("ADMIN")).toBeInTheDocument();
    expect(within(table).getAllByText("Ativo")).toHaveLength(3);
    expect(within(table).getAllByText("Inativo")).toHaveLength(3);
    expect(
      screen.getByRole("button", { name: "Filtrar por Grupo" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Convidar Membro" }),
    ).toBeDisabled();
  });

  it("mostra loading enquanto aguarda os dados e então apresenta o resultado", async () => {
    let resolve!: (users: UserListItem[]) => void;
    const repository: UserRepository = {
      list: () =>
        new Promise((done) => {
          resolve = done;
        }),
    };
    render(<UsersList repository={repository} />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando usuários");
    expect(screen.getByRole("searchbox")).toBeDisabled();
    const users = await new MockUserRepository().list();
    await act(async () => {
      resolve(users);
    });
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeEnabled();
  });

  it("apresenta estado vazio quando não há usuários cadastrados", async () => {
    render(<UsersList repository={{ list: async () => [] }} />);
    expect(
      await screen.findByText("Nenhum usuário cadastrado."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("apresenta erro sem expor detalhes internos do repository", async () => {
    render(
      <UsersList
        repository={{
          list: async () => {
            throw new Error("detalhe privado");
          },
        }}
      />,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar os usuários.",
    );
    expect(screen.queryByText("detalhe privado")).not.toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeDisabled();
  });

  it("busca por nome sem diferenciar maiúsculas e ignora espaços nas extremidades", async () => {
    const user = userEvent.setup();
    render(<UsersList />);
    await screen.findByRole("table");
    await user.type(screen.getByRole("searchbox"), "  MARIA DO BAIRRO  ");
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("Maria do Bairro")).toBeInTheDocument();
    expect(screen.queryByText("João da Soja")).not.toBeInTheDocument();
  });

  it("busca por e-mail e restaura a listagem ao limpar ou informar somente espaços", async () => {
    const user = userEvent.setup();
    render(<UsersList />);
    await screen.findByRole("table");
    const input = screen.getByRole("searchbox");
    await user.type(input, "JOAO.SOJA@EXAMPLE.COM");
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("João da Soja")).toBeInTheDocument();
    await user.clear(input);
    expect(screen.getAllByRole("row")).toHaveLength(7);
    await user.type(input, "   ");
    expect(screen.getAllByRole("row")).toHaveLength(7);
  });

  it("distingue uma busca sem resultados de uma base vazia e permite nova busca", async () => {
    const user = userEvent.setup();
    render(<UsersList />);
    await screen.findByRole("table");
    await user.type(screen.getByRole("searchbox"), "inexistente");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Nenhum usuário encontrado.",
    );
    expect(
      screen.queryByText("Nenhum usuário cadastrado."),
    ).not.toBeInTheDocument();
    await user.clear(screen.getByRole("searchbox"));
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("suporta usuário sem credencial e cargo sem enum fechado", async () => {
    const [base] = await new MockUserRepository().list();
    const user = userEvent.setup();
    render(
      <UsersList
        repository={{
          list: async () => [
            { ...base, email: null, cargo: { id: 4, nome: "PESQUISADOR" } },
          ],
        }}
      />,
    );
    expect(await screen.findByText("E-mail não informado")).toBeInTheDocument();
    expect(screen.getByText("PESQUISADOR")).toBeInTheDocument();
    await user.type(screen.getByRole("searchbox"), "@example");
    expect(screen.getByText("Nenhum usuário encontrado.")).toBeInTheDocument();
  });
});
