import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import UsersPage from "@/app/administracao/usuarios/page";
import { MockUserRepository } from "../repositories/MockUserRepository";
import type {
  PaginatedUsers,
  UserRepository,
} from "../repositories/UserRepository";
import type { UserListItem } from "../types/user";
import { UsersList } from "./UsersList";

vi.mock("../repositories", async () => {
  const { MockUserRepository } = await import(
    "../repositories/MockUserRepository"
  );

  return { userRepository: new MockUserRepository() };
});

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});

function page(
  items: UserListItem[],
  currentPage = 1,
  totalPages = items.length > 0 ? 1 : 0,
): PaginatedUsers {
  return {
    items,
    pagination: {
      totalRecords: items.length,
      totalPages,
      currentPage,
    },
  };
}

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

  it("preserva o nome e e-mail completos no conteúdo acessível mesmo quando longos", async () => {
    const [base] = (await new MockUserRepository().list()).items;
    const nome = "Maria Aparecida de Albuquerque e Silva";
    const email = "maria.aparecida.albuquerque.silva@example.com";
    render(
      <UsersList
        repository={Object.assign(new MockUserRepository(), {
          list: async () => page([{ ...base, nome, email }]),
        })}
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
    expect(screen.getByRole("link", { name: "Usuários" })).toHaveAttribute(
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
      screen.getByRole("combobox", { name: "Filtrar por cargo" }),
    ).toBeEnabled();

  });

  it("mostra loading enquanto aguarda os dados e então apresenta o resultado", async () => {
    let resolve!: (users: PaginatedUsers) => void;
    const repository: UserRepository = Object.assign(new MockUserRepository(), {
      list: () =>
        new Promise((done) => {
          resolve = done;
        }),
    });
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
    render(
      <UsersList
        repository={Object.assign(new MockUserRepository(), {
          list: async () => page([]),
        })}
      />,
    );
    expect(
      await screen.findByText("Nenhum usuário cadastrado."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("apresenta erro sem expor detalhes internos do repository", async () => {
    render(
      <UsersList
        repository={Object.assign(new MockUserRepository(), {
          list: async () => {
            throw new Error("detalhe privado");
          },
        })}
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
    const [base] = (await new MockUserRepository().list()).items;
    const user = userEvent.setup();
    render(
      <UsersList
        repository={Object.assign(new MockUserRepository(), {
          list: async () =>
            page([
              {
                ...base,
                email: null,
                cargo: { id: 4, nome: "PESQUISADOR" },
              },
            ]),
        })}
      />,
    );
    expect(await screen.findByText("E-mail não informado")).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("PESQUISADOR")).toBeInTheDocument();
    await user.type(screen.getByRole("searchbox"), "@example");
    expect(screen.getByText("Nenhum usuário encontrado.")).toBeInTheDocument();
  });

  it("cadastra um usuário e recarrega a página atual", async () => {
    const repository = new MockUserRepository();
    const interaction = userEvent.setup();
    render(<UsersList repository={repository} />);
    await screen.findByRole("table");

    await interaction.click(screen.getByRole("button", { name: "Novo usuário" }));
    await interaction.type(screen.getByLabelText(/Nome completo/), "Ana Lima");
    await interaction.type(screen.getByLabelText(/E-mail/), "ana@example.com");
    await interaction.selectOptions(
      screen.getByRole("combobox", { name: /Cargo/ }),
      "2",
    );
    await interaction.type(screen.getByLabelText(/Senha/), "password123");
    await interaction.click(
      screen.getByRole("button", { name: "Cadastrar usuário" }),
    );

    expect(
      await screen.findByText("Usuário cadastrado com sucesso."),
    ).toBeInTheDocument();
    expect(await screen.findByText("Ana Lima")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});


describe("Filtro de usuários por cargo", () => {
  it("combina cargo com busca e permite voltar a todos os cargos", async () => {
    const user = userEvent.setup();
    render(<UsersList />);
    await screen.findByRole("table");
    const filter = screen.getByRole("combobox", { name: "Filtrar por cargo" });
    await user.selectOptions(filter, "1");
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("joao.feijao@example.com")).toBeInTheDocument();
    await user.type(screen.getByRole("searchbox"), "inexistente");
    expect(screen.getByText("Nenhum usuário encontrado.")).toBeInTheDocument();
    await user.clear(screen.getByRole("searchbox"));
    await user.selectOptions(filter, "");
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(7);
  });
});

describe("Paginação de usuários", () => {
  it("navega pelas páginas usando o metadado retornado pelo repository", async () => {
    const [first, second] = (await new MockUserRepository().list()).items;
    const list = vi.fn(async ({ page: requestedPage = 1 } = {}) =>
      requestedPage === 1
        ? page([first], 1, 2)
        : page([second], 2, 2),
    );
    const repository = Object.assign(new MockUserRepository(), { list });
    const interaction = userEvent.setup();

    render(<UsersList repository={repository} />);

    expect(await screen.findByText(first.nome)).toBeInTheDocument();
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();

    await interaction.click(
      screen.getByRole("button", { name: "Próxima página" }),
    );

    expect(await screen.findByText(second.nome)).toBeInTheDocument();
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
    expect(list).toHaveBeenLastCalledWith({ page: 2, limit: 20 });
  });
});
