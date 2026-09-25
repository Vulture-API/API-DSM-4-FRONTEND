import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { defaultRoutes, mockApi, renderWithProviders } from "@/test/utils";

import { StationsPage } from "./StationsPage";

describe("StationsPage", () => {
  it("lista as estações com status, sensores e propriedade", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<StationsPage />);

    const row = (await screen.findByText("Estação Pivô")).closest("tr")!;
    expect(row).toHaveTextContent("Com alerta · 2 pendentes");
    // SCRUM-372: estação sem comunicar há mais de 1 h ganha o indicativo de falha.
    const brejo = screen.getByText("Estação Brejo").closest("tr")!;
    expect(within(brejo).getAllByText("Sem comunicação há 5 h").length).toBeGreaterThan(0);
    expect(within(row).getByText("1/2")).toBeInTheDocument();
    expect(within(row).getByText("Fazenda Santa Rita")).toBeInTheDocument();
  });

  it("filtra por status, propriedade e busca", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());
    renderWithProviders(<StationsPage />);
    await screen.findByText("Estação Sede");

    await user.click(screen.getByRole("radio", { name: /Offline/ }));
    expect(screen.queryByText("Estação Sede")).not.toBeInTheDocument();
    expect(screen.getByText("Estação Brejo")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /Todas/ }));
    await user.selectOptions(screen.getByLabelText("Filtrar por propriedade"), "1");
    expect(screen.queryByText("Estação Brejo")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Buscar estação"), "4d:02");
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("Estação Pivô")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Buscar estação"));
    await user.type(screen.getByLabelText("Buscar estação"), "zzz");
    expect(screen.getByText("Nenhuma estação com esses filtros")).toBeInTheDocument();
  });

  it("valida e cadastra uma estação", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi({ ...defaultRoutes(), "POST /api/stations": { id: 9 } });
    renderWithProviders(<StationsPage />);
    await screen.findByText("Estação Sede");

    await user.click(screen.getByRole("button", { name: "Nova estação" }));
    const dialog = screen.getByRole("dialog", { name: "Nova estação" });
    await user.click(within(dialog).getByRole("button", { name: "Cadastrar" }));
    expect(within(dialog).getByText("Use pelo menos 3 caracteres.")).toBeInTheDocument();
    expect(within(dialog).getByText("Formato: AA:BB:CC:DD:EE:FF")).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText("Nome"), "Estação Nova");
    await user.selectOptions(within(dialog).getByLabelText("Propriedade"), "2");
    await user.type(within(dialog).getByLabelText("Endereço MAC"), "aa-bb-cc-dd-ee-09");
    await user.type(within(dialog).getByLabelText("Latitude"), "95");
    await user.click(within(dialog).getByRole("button", { name: "Cadastrar" }));
    expect(within(dialog).getByText("Entre -90 e 90.")).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText("Latitude"));
    await user.type(within(dialog).getByLabelText("Latitude"), "-23.2");
    await user.click(within(dialog).getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(calls.find((c) => c.method === "POST")?.body).toEqual({
      property_id: 2,
      name: "Estação Nova",
      mac_address: "aa-bb-cc-dd-ee-09",
      latitude: -23.2,
      longitude: null,
    });
    expect(await screen.findByText("Estação cadastrada.")).toBeInTheDocument();
  });

  it("mostra o erro do serviço ao salvar", async () => {
    const user = userEvent.setup();
    mockApi({ ...defaultRoutes(), "PUT /api/stations/1": { status: 409, body: { message: "MAC já cadastrado" } } });
    renderWithProviders(<StationsPage />);

    await user.click(await screen.findByRole("button", { name: "Editar Estação Sede" }));
    const dialog = screen.getByRole("dialog", { name: "Editar estação" });
    expect(within(dialog).getByLabelText("Nome")).toHaveValue("Estação Sede");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("MAC já cadastrado")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("exclui após confirmar", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi({ ...defaultRoutes(), "DELETE /api/stations/3": { status: 204, body: null } });
    renderWithProviders(<StationsPage />);

    await user.click(await screen.findByRole("button", { name: "Excluir Estação Brejo" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Excluir" }));

    expect(await screen.findByText("Estação Brejo excluída.")).toBeInTheDocument();
    expect(calls.some((c) => c.method === "DELETE" && c.path === "/api/stations/3")).toBe(true);
  });

  it("mostra erro com opção de tentar de novo", async () => {
    const user = userEvent.setup();
    const routes = { ...defaultRoutes(), "/api/stations/overview": { status: 500, body: { message: "Falhou" } } };
    mockApi(routes);
    renderWithProviders(<StationsPage />);

    expect(await screen.findByText("Falhou")).toBeInTheDocument();
    mockApi(defaultRoutes());
    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByText("Estação Sede")).toBeInTheDocument();
  });
});
