import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import UserDetailsPage from "@/app/administracao/usuarios/[id]/page";
import { MockUserRepository } from "../repositories/MockUserRepository";
import { ApiUserRepository } from "../repositories/ApiUserRepository";
import { editUserSchema } from "../schemas/editUserSchema";
import { UserDetailsScreen } from "./UserDetailsScreen";
import { UsersList } from "./UsersList";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/administracao/usuarios/1" }));
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
beforeEach(() => vi.clearAllMocks());

async function setup() {
  const repository = new MockUserRepository();
  const interaction = userEvent.setup();
  render(<UserDetailsScreen id={1} repository={repository} />);
  await screen.findByRole("heading", { name: "João pé de feijão" });
  return { repository, interaction };
}

describe("Detalhes do usuário", () => {
  it("compõe a rota e carrega pelo ID com estado de loading", async () => {
    render(await UserDetailsPage({ params: Promise.resolve({ id: "1" }) }));
    expect(screen.getByText("Carregando usuário...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "João pé de feijão" })).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Voltar para a lista/ })).toHaveAttribute("href", "/administracao/usuarios");
    expect(screen.queryByText(/Resetar senha|Permissões|Último acesso/)).not.toBeInTheDocument();
  });

  it.each(["999", "invalido", "0", "1e0"])("mostra usuário não encontrado para %s", async (id) => {
    render(await UserDetailsPage({ params: Promise.resolve({ id }) }));
    expect(await screen.findByText("Usuário não encontrado.")).toBeInTheDocument();
  });

  it("trata erro de carregamento sem expor mensagem interna", async () => {
    const repository = new MockUserRepository();
    vi.spyOn(repository, "getById").mockRejectedValue(new Error("interno"));
    render(<UserDetailsScreen id={1} repository={repository} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o usuário.");
    expect(screen.queryByText("interno")).not.toBeInTheDocument();
  });

  it("edita apenas nome, cargo e ativo, preservando email e data", async () => {
    const { repository, interaction } = await setup();
    const original = await repository.getById(1);
    await interaction.click(screen.getByRole("button", { name: "Editar usuário" }));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getAllByRole("textbox")).toHaveLength(1);
    await interaction.clear(dialog.getByLabelText(/Nome completo/));
    await interaction.type(dialog.getByLabelText(/Nome completo/), "  Maria Silva  ");
    await interaction.selectOptions(dialog.getByLabelText(/Cargo/), "2");
    await interaction.click(dialog.getByLabelText("Inativo"));
    await interaction.click(dialog.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Usuário atualizado com sucesso.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(await repository.getById(1)).toMatchObject({ nome: "Maria Silva", cargo_id: 2, ativo: false, email: original!.email, criado_em: original!.criado_em });
  });

  it("valida campos e descarta alterações ao cancelar", async () => {
    const { repository, interaction } = await setup();
    const update = vi.spyOn(repository, "update");
    await interaction.click(screen.getByRole("button", { name: "Editar" }));
    await interaction.clear(screen.getByLabelText(/Nome completo/));
    await interaction.selectOptions(screen.getByLabelText(/Cargo/), "0");
    await interaction.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Informe o nome do usuário.")).toBeInTheDocument();
    expect(screen.getByText("Selecione um cargo.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Nome completo/), { target: { value: "a".repeat(151) } });
    await interaction.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("O nome deve ter no máximo 150 caracteres.")).toBeInTheDocument();
    await interaction.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(update).not.toHaveBeenCalled();
    await interaction.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText(/Nome completo/)).toHaveValue("João pé de feijão");
  });

  it("mantém edição aberta quando o repository falha e permite tentar novamente", async () => {
    const { repository, interaction } = await setup();
    vi.spyOn(repository, "update").mockRejectedValueOnce(new Error("interno"));
    await interaction.click(screen.getByRole("button", { name: "Editar usuário" }));
    await interaction.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível atualizar");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await interaction.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Usuário atualizado com sucesso.")).toBeInTheDocument();
  });

  it("mostra erro de cargo informado pelo repository", async () => {
    const { repository, interaction } = await setup();
    const invalid = editUserSchema.safeParse({ nome: "", cargo_id: 1, ativo: true });
    vi.spyOn(repository, "update").mockRejectedValueOnce(invalid.error);
    await interaction.click(screen.getByRole("button", { name: "Editar" }));
    await interaction.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Informe o nome do usuário.")).toBeInTheDocument();
  });

  it("bloqueia os controles durante atualização", async () => {
    const { repository, interaction } = await setup();
    const original = (await repository.getById(1))!;
    let finish!: (value: typeof original) => void;
    vi.spyOn(repository, "update").mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    await interaction.click(screen.getByRole("button", { name: "Editar" }));
    await interaction.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await act(async () => finish(original));
  });

  it("cancela exclusão e só exclui após confirmação, navegando para a lista", async () => {
    const { repository, interaction } = await setup();
    const remove = vi.spyOn(repository, "delete");
    await interaction.click(screen.getByRole("button", { name: "Excluir usuário" }));
    await interaction.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(remove).not.toHaveBeenCalled();
    await interaction.click(screen.getByRole("button", { name: "Excluir usuário" }));
    await interaction.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Excluir usuário" }));
    expect(await repository.getById(1)).toBeNull();
    expect(push).toHaveBeenCalledWith("/administracao/usuarios");
  });

  it("trata exclusão bloqueada, mantém dados e permite cancelar", async () => {
    const { repository, interaction } = await setup();
    let reject!: (error: Error) => void;
    vi.spyOn(repository, "delete").mockImplementation(() => new Promise((_resolve, fail) => { reject = fail; }));
    await interaction.click(screen.getByRole("button", { name: "Excluir usuário" }));
    await interaction.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Excluir usuário" }));
    expect(screen.getByRole("button", { name: "Excluindo..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    await act(async () => reject(new Error("RESTRICT")));
    expect(await screen.findByRole("alert")).toHaveTextContent("vínculos existentes");
    expect(await repository.getById(1)).not.toBeNull();
    expect(push).not.toHaveBeenCalled();
    await interaction.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lista oferece link de detalhes de cada usuário", async () => {
    const repository = new MockUserRepository();
    render(<UsersList repository={repository} />);
    await screen.findByRole("table");
    for (const user of await repository.list()) {
      expect(screen.getByRole("link", { name: user.nome })).toHaveAttribute("href", `/administracao/usuarios/${user.id}`);
    }
  });

  it("troca o ID sem manter os dados do usuário anterior", async () => {
    const repository = new MockUserRepository();
    const { rerender } = render(<UserDetailsScreen id={1} repository={repository} />);
    await screen.findByRole("heading", { name: "João pé de feijão" });
    rerender(<UserDetailsScreen id={999} repository={repository} />);
    expect(screen.queryByRole("heading", { name: "João pé de feijão" })).not.toBeInTheDocument();
    await screen.findByText("Usuário não encontrado.");
  });

  it("exibe usuário de nome único, inativo e sem credencial", async () => {
    const [base] = await new MockUserRepository().list();
    const repository = new MockUserRepository([{ ...base, nome: "Ana", email: null, ativo: false }]);
    const interaction = userEvent.setup();
    render(<UserDetailsScreen id={base.id} repository={repository} />);
    expect(await screen.findByRole("heading", { name: "Ana" })).toBeInTheDocument();
    expect(screen.getByText("AN")).toBeInTheDocument();
    expect(screen.getByText("E-mail não informado")).toBeInTheDocument();
    expect(screen.getAllByText("Inativo")).toHaveLength(2);
    await interaction.click(screen.getByRole("button", { name: "Editar" }));
    expect(within(screen.getByRole("dialog")).getByText("Não informado")).toBeInTheDocument();
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Operações do repository de detalhes", () => {
  it("consulta isolada, atualiza campos permitidos e exclui somente o alvo", async () => {
    const repository = new MockUserRepository();
    const original = (await repository.getById(1))!;
    original.cargo.nome = "Alterado";
    expect((await repository.getById(1))!.cargo.nome).toBe("ADMIN");
    const input = { nome: " Novo nome ", cargo_id: 2, ativo: false, email: "ignorar", criado_em: "ignorar" };
    const updated = await repository.update(1, input);
    expect(updated).toMatchObject({ nome: "Novo nome", cargo_id: 2, ativo: false, email: original.email, criado_em: original.criado_em });
    await expect(repository.update(1, { ...input, cargo_id: 999 })).rejects.toThrow("Selecione um cargo existente.");
    await expect(repository.update(1, { ...input, nome: " " })).rejects.toThrow();
    await repository.delete(1);
    expect(await repository.list()).toHaveLength(5);
    expect(await repository.getById(1)).toBeNull();
    await expect(repository.update(1, input)).rejects.toThrow("Usuário não encontrado.");
    await expect(repository.delete(1)).rejects.toThrow("Usuário não encontrado.");
  });

  it("mantém API explicitamente pendente", async () => {
    const repository = new ApiUserRepository();
    await expect(repository.getById(1)).rejects.toThrow("contrato OpenAPI");
    await expect(repository.update(1, { nome: "Nome", cargo_id: 1, ativo: true })).rejects.toThrow("contrato OpenAPI");
    await expect(repository.delete(1)).rejects.toThrow("contrato OpenAPI");
  });
});
