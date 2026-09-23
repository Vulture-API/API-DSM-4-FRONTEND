import { StrictMode } from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import ParametersPage from "@/app/administracao/parametros/page";
import { MockParameterRepository } from "../repositories/MockParameterRepository";
import type { Parameter } from "../types/parameter";
import { ParametersManagement } from "./ParametersManagement";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});

async function setup(repository = new MockParameterRepository()) {
  render(<ParametersManagement repository={repository} />);
  await screen.findByRole("table");
  return { user: userEvent.setup(), repository };
}

async function openForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Novo parâmetro" }));
  return screen.getByRole("dialog", { name: "Novo parâmetro" });
}

describe("Gestão de parâmetros meteorológicos", () => {
  it("compõe a rota e apresenta os seis parâmetros e as colunas oficiais", async () => {
    render(<ParametersPage />);
    expect(
      screen.getByRole("heading", {
        name: "Administração de Parâmetros Meteorológicos",
      }),
    ).toBeInTheDocument();
    const table = await screen.findByRole("table");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Parâmetro", "Unidade de medida", "Fator", "Ganho", "Ações"]);
    expect(within(table).getAllByRole("row")).toHaveLength(7);
    expect(
      screen.getByRole("link", { name: "Parâmetros meteorológicos" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("busca por nome com trim, sem diferenciar maiúsculas, e permite limpar", async () => {
    const { user } = await setup();
    await user.type(screen.getByRole("searchbox"), "  TEMPERATURA  ");
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("Temperatura")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(screen.getAllByRole("row")).toHaveLength(7);
  });

  it("busca por unidade de medida sem diferenciar maiúsculas", async () => {
    const { user } = await setup();
    await user.type(screen.getByRole("searchbox"), "HPA");
    expect(screen.getByText("Pressão Atmosférica")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("mostra busca sem resultados", async () => {
    const { user } = await setup();
    await user.type(screen.getByRole("searchbox"), "inexistente");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Nenhum parâmetro encontrado.",
    );
  });

  it("abre o formulário, direciona foco e permite cancelar com Escape", async () => {
    const { user } = await setup();
    const trigger = screen.getByRole("button", { name: "Novo parâmetro" });
    await openForm(user);
    expect(screen.getByRole("textbox", { name: "Nome do parâmetro" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("valida nome e unidade obrigatórios próximos aos campos", async () => {
    const { user } = await setup();
    await openForm(user);
    await user.click(screen.getByRole("button", { name: "Salvar parâmetro" }));
    expect(
      await screen.findByText("Informe o nome do parâmetro."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Informe a unidade de medida."),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Nome do parâmetro" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("impede nome duplicado", async () => {
    const { user, repository } = await setup();
    await openForm(user);
    await user.type(screen.getByRole("textbox", { name: "Nome do parâmetro" }), "Temperatura");
    await user.type(screen.getByRole("textbox", { name: "Unidade de medida" }), "K");
    await user.click(screen.getByRole("button", { name: "Salvar parâmetro" }));
    expect(
      await screen.findByText("Já existe um parâmetro com esse nome."),
    ).toBeInTheDocument();
    expect(await repository.list()).toHaveLength(6);
  });

  it("valida fator e ganho numéricos", async () => {
    const { user } = await setup();
    await openForm(user);
    await user.type(screen.getByRole("textbox", { name: "Nome do parâmetro" }), "Radiação");
    await user.type(screen.getByRole("textbox", { name: "Unidade de medida" }), "W/m²");
    await user.type(screen.getByLabelText("Fator"), "abc");
    await user.type(screen.getByLabelText("Ganho"), "x");
    await user.click(screen.getByRole("button", { name: "Salvar parâmetro" }));
    expect(
      await screen.findAllByText("Informe um número válido."),
    ).toHaveLength(2);
  });

  it("cria parâmetro com vírgula decimal e opcional vazio, atualizando a lista", async () => {
    const { user, repository } = await setup();
    await openForm(user);
    await user.type(
      screen.getByRole("textbox", { name: "Nome do parâmetro" }),
      "Radiação Solar",
    );
    await user.type(screen.getByRole("textbox", { name: "Unidade de medida" }), "W/m²");
    await user.type(screen.getByLabelText("Fator"), "2,50");
    await user.click(screen.getByRole("button", { name: "Salvar parâmetro" }));
    expect(
      await screen.findByText("Parâmetro cadastrado com sucesso."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Radiação Solar")).toBeInTheDocument();
    expect((await repository.list()).at(-1)).toMatchObject({
      nome: "Radiação Solar",
      unidade_medida: "W/m²",
      fator: 2.5,
      ganho: null,
    });
  });

  it("edita no mesmo formulário preservando id e permitindo manter o próprio nome", async () => {
    const { user, repository } = await setup();
    await user.click(
      screen.getByRole("button", { name: "Editar Temperatura" }),
    );
    expect(screen.getByRole("textbox", { name: "Nome do parâmetro" })).toHaveValue(
      "Temperatura",
    );
    await user.clear(screen.getByRole("textbox", { name: "Unidade de medida" }));
    await user.type(screen.getByRole("textbox", { name: "Unidade de medida" }), "K");
    await user.clear(screen.getByLabelText("Fator"));
    await user.type(screen.getByLabelText("Ganho"), "0");
    await user.click(screen.getByRole("button", { name: "Salvar parâmetro" }));
    expect(
      await screen.findByText("Parâmetro atualizado com sucesso."),
    ).toBeInTheDocument();
    expect((await repository.list())[0]).toEqual({
      id: 1,
      nome: "Temperatura",
      unidade_medida: "K",
      fator: null,
      ganho: 0,
    });
  });

  it("cancela a remoção sem alterar o catálogo", async () => {
    const { user, repository } = await setup();
    await user.click(
      screen.getByRole("button", { name: "Remover Temperatura" }),
    );
    expect(
      within(screen.getByRole("dialog")).getByText("Temperatura"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(await repository.list()).toHaveLength(6);
  });

  it("remove somente após confirmação e atualiza a tabela", async () => {
    const { user, repository } = await setup();
    await user.click(
      screen.getByRole("button", { name: "Remover Temperatura" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirmar remoção" }));
    expect(
      await screen.findByText("Parâmetro removido com sucesso."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Temperatura")).not.toBeInTheDocument();
    expect(await repository.list()).toHaveLength(5);
  });

  it("apresenta estado vazio e permite abrir cadastro", async () => {
    render(
      <ParametersManagement repository={new MockParameterRepository([])} />,
    );
    expect(
      await screen.findByText("Nenhum parâmetro cadastrado."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Novo parâmetro" }),
    ).toBeEnabled();
  });

  it("apresenta erro ao carregar", async () => {
    const repository = new MockParameterRepository();
    vi.spyOn(repository, "list").mockRejectedValue(new Error("privado"));
    render(<ParametersManagement repository={repository} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar os parâmetros.",
    );
    expect(
      screen.getByRole("button", { name: "Novo parâmetro" }),
    ).toBeDisabled();
  });

  it("mostra loading enquanto o repository está pendente", async () => {
    const repository = new MockParameterRepository();
    let resolve!: (items: Parameter[]) => void;
    vi.spyOn(repository, "list").mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(<ParametersManagement repository={repository} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Carregando parâmetros...",
    );
    await act(async () => resolve([]));
    expect(
      screen.getByText("Nenhum parâmetro cadastrado."),
    ).toBeInTheDocument();
  });

  it("preserva formulário e valores após falha de criação", async () => {
    const repository = new MockParameterRepository();
    vi.spyOn(repository, "create").mockRejectedValue(new Error("falha"));
    const { user } = await setup(repository);
    await openForm(user);
    await user.type(screen.getByRole("textbox", { name: "Nome do parâmetro" }), "Radiação");
    await user.type(screen.getByRole("textbox", { name: "Unidade de medida" }), "W/m²");
    await user.click(screen.getByRole("button", { name: "Salvar parâmetro" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível salvar",
    );
    expect(screen.getByRole("textbox", { name: "Nome do parâmetro" })).toHaveValue("Radiação");
  });

  it("preserva registro e confirmação após falha de remoção", async () => {
    const repository = new MockParameterRepository();
    vi.spyOn(repository, "remove").mockRejectedValue(new Error("falha"));
    const { user } = await setup(repository);
    await user.click(
      screen.getByRole("button", { name: "Remover Temperatura" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirmar remoção" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível remover",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(await repository.list()).toHaveLength(6);
  });
});


describe("Recuperação e acessibilidade de parâmetros", () => {
  it("preserva a edição após erro e permite tentar novamente", async () => {
    const repository = new MockParameterRepository();
    const update = vi.spyOn(repository, "update").mockRejectedValueOnce(new Error("interno"));
    const { user } = await setup(repository);
    await user.click(screen.getByRole("button", { name: "Editar Temperatura" }));
    await user.clear(screen.getByRole("textbox", { name: "Unidade de medida" }));
    await user.type(screen.getByRole("textbox", { name: "Unidade de medida" }), "K");
    await user.click(screen.getByRole("button", { name: "Salvar parâmetro" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível salvar");
    expect(screen.getByRole("textbox", { name: "Unidade de medida" })).toHaveValue("K");
    expect((await repository.list())[0].unidade_medida).toBe("°C");
    await user.click(screen.getByRole("button", { name: "Salvar parâmetro" }));
    expect(await screen.findByText("Parâmetro atualizado com sucesso.")).toBeInTheDocument();
    expect(update).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Editar Temperatura" })).toHaveFocus();
  });

  it("direciona o foco ao título quando a remoção elimina o botão de origem", async () => {
    const { user } = await setup();
    await user.click(screen.getByRole("button", { name: "Remover Temperatura" }));
    await user.click(screen.getByRole("button", { name: "Confirmar remoção" }));
    await screen.findByText("Parâmetro removido com sucesso.");
    expect(screen.getByRole("heading", { name: "Parâmetros Meteorológicos" })).toHaveFocus();
  });

  it("bloqueia envio duplicado e fechamento enquanto salva", async () => {
    const repository = new MockParameterRepository();
    let complete!: (value: Parameter) => void;
    const create = vi.spyOn(repository, "create").mockImplementation(() => new Promise((resolve) => { complete = resolve; }));
    const { user } = await setup(repository);
    await openForm(user);
    await user.type(screen.getByRole("textbox", { name: "Nome do parâmetro" }), "Radiação");
    await user.type(screen.getByRole("textbox", { name: "Unidade de medida" }), "W/m²");
    await user.click(screen.getByRole("button", { name: "Salvar parâmetro" }));
    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Fechar painel" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(create).toHaveBeenCalledTimes(1);
    await act(async () => complete({ id: 7, nome: "Radiação", unidade_medida: "W/m²", fator: null, ganho: null }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});


it("restaura o foco ao abrir e fechar o painel em StrictMode", async () => {
  const user = userEvent.setup();
  render(<StrictMode><ParametersManagement repository={new MockParameterRepository()} /></StrictMode>);
  await screen.findByRole("table");
  const trigger = screen.getByRole("button", { name: "Novo parâmetro" });
  await user.click(trigger);
  expect(screen.getByRole("textbox", { name: "Nome do parâmetro" })).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(trigger).toHaveFocus();
});
