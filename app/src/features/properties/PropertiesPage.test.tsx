import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { Property } from "@/features/properties/api";
import { defaultRoutes, mockApi, renderWithProviders } from "@/test/utils";

import { PropertiesPage } from "./PropertiesPage";

const testProperties: Property[] = [
  {
    id: 1,
    name: "Fazenda Santa Rita",
    location: "São José dos Campos - SP",
    owner_user_id: 1,
  },
  {
    id: 2,
    name: "Sítio Água Limpa",
    location: "Pindamonhangaba - SP",
    owner_user_id: 2,
  },
  {
    id: 3,
    name: "Fazenda Esperança",
    location: "Jacareí - SP",
    owner_user_id: 1,
  },
];

async function getPropertiesTable() {
  const tables = await screen.findAllByRole("table");
  return tables[0]!;
}

describe("PropertiesPage - [QA] CRUD e Associação de Propriedades", () => {
  it("Cenário 1: lista propriedades agrícolas com localização, responsável e contadores", async () => {
    mockApi({
      ...defaultRoutes(),
      "/api/properties": testProperties,
    });

    renderWithProviders(<PropertiesPage />);

    const table = await getPropertiesTable();
    expect(within(table).getByText("Fazenda Santa Rita")).toBeInTheDocument();
    expect(within(table).getByText("Sítio Água Limpa")).toBeInTheDocument();
    expect(within(table).getByText("Fazenda Esperança")).toBeInTheDocument();

    // Identificadores formatados na tabela
    expect(within(table).getByText("ID #001")).toBeInTheDocument();
    expect(within(table).getByText("ID #002")).toBeInTheDocument();

    // Localizações na tabela
    expect(within(table).getByText("São José dos Campos - SP")).toBeInTheDocument();
    expect(within(table).getByText("Pindamonhangaba - SP")).toBeInTheDocument();

    // Responsáveis resolvidos dinamicamente de usersMap (User 1: Mariana Albuquerque, User 2: Carlos Mendes)
    expect(within(table).getAllByText("Mariana Albuquerque").length).toBe(2);
    expect(within(table).getByText("Carlos Mendes")).toBeInTheDocument();

    // Contadores gerais no cabeçalho
    expect(screen.getByText(/3 propriedades cadastradas/)).toBeInTheDocument();
  });

  it("Cenário 2: exibe estado vazio quando nenhuma propriedade for encontrada", async () => {
    mockApi({
      ...defaultRoutes(),
      "/api/properties": [],
    });

    renderWithProviders(<PropertiesPage />);

    expect(
      await screen.findByText("Nenhuma propriedade encontrada"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Não há propriedades agrícolas correspondentes aos filtros selecionados/),
    ).toBeInTheDocument();
  });

  it("Cenário 3: filtra propriedades por busca textual, localização e cobertura de estações", async () => {
    const user = userEvent.setup();
    mockApi({
      ...defaultRoutes(),
      "/api/properties": testProperties,
    });

    renderWithProviders(<PropertiesPage />);
    const table = await getPropertiesTable();
    expect(within(table).getByText("Fazenda Santa Rita")).toBeInTheDocument();

    // 1. Busca textual por identificação
    const searchInput = screen.getByLabelText("Propriedade (Identificação)");
    await user.type(searchInput, "Água Limpa");
    expect(within(table).getByText("Sítio Água Limpa")).toBeInTheDocument();
    expect(within(table).queryByText("Fazenda Santa Rita")).not.toBeInTheDocument();

    // 2. Limpar filtros
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    await waitFor(() => {
      expect(within(table).getByText("Fazenda Santa Rita")).toBeInTheDocument();
    });

    // 3. Filtro por localização
    const locationSelect = screen.getByLabelText("Localização (Município - UF)");
    await user.selectOptions(locationSelect, "Jacareí - SP");
    expect(within(table).getByText("Fazenda Esperança")).toBeInTheDocument();
    expect(within(table).queryByText("Fazenda Santa Rita")).not.toBeInTheDocument();

    // 4. Filtro por responsável
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    const ownerSelect = screen.getByLabelText("Responsável");
    await user.selectOptions(ownerSelect, "Carlos Mendes");
    expect(within(table).getByText("Sítio Água Limpa")).toBeInTheDocument();
    expect(within(table).queryByText("Fazenda Santa Rita")).not.toBeInTheDocument();

    // 5. Filtro por cobertura de estações
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    await user.click(screen.getByRole("radio", { name: /Sem estações/ }));
    expect(within(table).getByText("Fazenda Esperança")).toBeInTheDocument();
    expect(within(table).queryByText("Fazenda Santa Rita")).not.toBeInTheDocument();
  });

  it("Cenário 4: seleciona uma propriedade para visualizar painel de detalhamento", async () => {
    const user = userEvent.setup();
    mockApi({
      ...defaultRoutes(),
      "/api/properties": testProperties,
    });

    renderWithProviders(<PropertiesPage />);
    const table = await getPropertiesTable();
    const row = within(table).getByText("Fazenda Santa Rita").closest("tr")!;
    await user.click(row);

    // Painel de detalhamento exibido abaixo
    expect(screen.getByRole("heading", { level: 3, name: "Fazenda Santa Rita" })).toBeInTheDocument();
    expect(screen.getByText("2 estações associadas")).toBeInTheDocument();
    expect(screen.getByText("Localização territorial · São José dos Campos - SP")).toBeInTheDocument();

    const tables = await screen.findAllByRole("table");
    expect(tables.length).toBeGreaterThanOrEqual(2);
    expect(within(tables[1]!).getByText("Estação Sede")).toBeInTheDocument();
  });

  it("Cenário 5: valida campos obrigatórios e cadastra nova propriedade via POST", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi({
      ...defaultRoutes(),
      "/api/properties": testProperties,
      "POST /api/properties": {
        id: 4,
        name: "Fazenda Nova Aurora",
        location: "Taubaté - SP",
        owner_user_id: 1,
      },
    });

    renderWithProviders(<PropertiesPage />);
    await getPropertiesTable();

    // Abre modal de criação
    await user.click(screen.getByRole("button", { name: "Nova propriedade" }));
    const dialog = screen.getByRole("dialog", { name: "Nova propriedade" });

    // Tenta cadastrar sem nome (validação)
    await user.click(within(dialog).getByRole("button", { name: "Cadastrar propriedade" }));
    expect(
      within(dialog).getByText("Informe o nome da propriedade com pelo menos 3 caracteres."),
    ).toBeInTheDocument();

    // Preenche formulário
    await user.type(within(dialog).getByLabelText(/Nome da propriedade/), "Fazenda Nova Aurora");
    await user.type(within(dialog).getByLabelText(/Localização/), "Taubaté - SP");
    await user.selectOptions(within(dialog).getByLabelText(/Responsável/), "1");

    await user.click(within(dialog).getByRole("button", { name: "Cadastrar propriedade" }));

    // Valida mensagem de sucesso e payload enviado
    expect(await screen.findByText('Propriedade "Fazenda Nova Aurora" cadastrada com sucesso.')).toBeInTheDocument();
    const postCall = calls.find((c) => c.method === "POST" && c.path === "/api/properties");
    expect(postCall?.body).toEqual({
      name: "Fazenda Nova Aurora",
      location: "Taubaté - SP",
      owner_user_id: 1,
    });
  });

  it("Cenário 6: abre modal de edição e atualiza propriedade via PUT", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi({
      ...defaultRoutes(),
      "/api/properties": testProperties,
      "PUT /api/properties/1": {
        id: 1,
        name: "Fazenda Santa Rita Atualizada",
        location: "São José dos Campos - SP",
        owner_user_id: 2,
      },
    });

    renderWithProviders(<PropertiesPage />);
    const table = await getPropertiesTable();
    const santaRitaRow = within(table).getByText("Fazenda Santa Rita").closest("tr")!;

    // Clica no botão editar da linha
    await user.click(within(santaRitaRow).getByRole("button", { name: "Editar" }));
    const dialog = screen.getByRole("dialog", { name: "Editar propriedade" });

    // Altera valores
    const nameInput = within(dialog).getByLabelText(/Nome da propriedade/);
    await user.clear(nameInput);
    await user.type(nameInput, "Fazenda Santa Rita Atualizada");
    await user.selectOptions(within(dialog).getByLabelText(/Responsável/), "2");

    await user.click(within(dialog).getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByText('Propriedade "Fazenda Santa Rita Atualizada" atualizada com sucesso.')).toBeInTheDocument();
    const putCall = calls.find((c) => c.method === "PUT" && c.path === "/api/properties/1");
    expect(putCall?.body).toEqual({
      name: "Fazenda Santa Rita Atualizada",
      location: "São José dos Campos - SP",
      owner_user_id: 2,
    });
  });

  it("Cenário 7: exclui propriedade via DELETE e trata confirmação", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi({
      ...defaultRoutes(),
      "/api/properties": testProperties,
      "DELETE /api/properties/3": () => undefined,
    });

    renderWithProviders(<PropertiesPage />);
    const table = await getPropertiesTable();
    const esperancaRow = within(table).getByText("Fazenda Esperança").closest("tr")!;

    // Clica no botão de excluir (IconButton com aria-label)
    await user.click(within(esperancaRow).getByRole("button", { name: "Excluir Fazenda Esperança" }));
    const dialog = screen.getByRole("dialog", { name: "Excluir propriedade agrícola" });
    expect(
      within(dialog).getByText(/Deseja realmente excluir a propriedade "Fazenda Esperança"?/),
    ).toBeInTheDocument();

    // Confirma exclusão
    await user.click(within(dialog).getByRole("button", { name: "Excluir" }));
    expect(await screen.findByText('Propriedade "Fazenda Esperança" excluída.')).toBeInTheDocument();
    expect(calls.some((c) => c.method === "DELETE" && c.path === "/api/properties/3")).toBe(true);
  });

  it("Cenário 8: trata erro 409 ao excluir propriedade com estações associadas", async () => {
    const user = userEvent.setup();
    mockApi({
      ...defaultRoutes(),
      "/api/properties": testProperties,
      "DELETE /api/properties/1": {
        status: 409,
        body: { message: "Não é possível excluir propriedade com estações associadas." },
      },
    });

    renderWithProviders(<PropertiesPage />);
    const table = await getPropertiesTable();
    const santaRitaRow = within(table).getByText("Fazenda Santa Rita").closest("tr")!;

    await user.click(within(santaRitaRow).getByRole("button", { name: "Excluir Fazenda Santa Rita" }));
    const dialog = screen.getByRole("dialog", { name: "Excluir propriedade agrícola" });
    await user.click(within(dialog).getByRole("button", { name: "Excluir" }));

    expect(
      await screen.findByText("Não é possível excluir propriedade com estações associadas."),
    ).toBeInTheDocument();
  });

  it("Cenário 9: associa estação disponível a uma propriedade através do modal de estações", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi({
      ...defaultRoutes(),
      "/api/properties": testProperties,
      "PUT /api/properties/1/stations/3": { ok: true },
    });

    renderWithProviders(<PropertiesPage />);
    const table = await getPropertiesTable();
    const santaRitaRow = within(table).getByText("Fazenda Santa Rita").closest("tr")!;

    // Clica no botão Estações
    await user.click(within(santaRitaRow).getByRole("button", { name: "Estações" }));
    const modal = screen.getByRole("dialog", { name: /Associar estações/ });
    expect(modal).toBeInTheDocument();

    // Estação disponível para associação (Estação Brejo, que pertence à propriedade 2)
    const availableSection = within(modal).getByText(/Estações disponíveis na rede/);
    expect(availableSection).toBeInTheDocument();
    expect(within(modal).getByText("Estação Brejo")).toBeInTheDocument();

    // Clica em Associar
    const associateButton = within(modal).getByRole("button", { name: "Associar" });
    await user.click(associateButton);

    expect(
      await screen.findByText('Estação "Estação Brejo" vinculada a "Fazenda Santa Rita".'),
    ).toBeInTheDocument();

    expect(
      calls.some((c) => c.method === "PUT" && c.path === "/api/properties/1/stations/3"),
    ).toBe(true);

    // Fecha o modal
    await user.click(within(modal).getByRole("button", { name: "Concluir" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: /Associar estações/ })).not.toBeInTheDocument();
    });
  });
});
