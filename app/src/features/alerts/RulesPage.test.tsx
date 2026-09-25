import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { defaultRoutes, mockApi, renderWithProviders } from "@/test/utils";

import { RulesPage } from "./RulesPage";

describe("RulesPage", () => {
  it("lista as regras com condição, estação e responsável", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<RulesPage />);

    const row = (await screen.findByText("Temperatura alta na sede")).closest("tr")!;
    expect(within(row).getByText("28,5 °C")).toBeInTheDocument();
    expect(row).toHaveTextContent("Temperaturaacima de 28,5 °C");
    expect(within(row).getByText("Estação Sede")).toBeInTheDocument();
    expect(within(row).getByText("Carlos Mendes")).toBeInTheDocument();
  });

  it("filtra por situação, estação e texto", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());
    renderWithProviders(<RulesPage />);
    await screen.findByText("Temperatura alta na sede");

    await user.click(screen.getByRole("radio", { name: /Inativas/ }));
    expect(screen.queryByText("Temperatura alta na sede")).not.toBeInTheDocument();
    expect(screen.getByText("Ar seco")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /Ativas/ }));
    expect(screen.queryByText("Ar seco")).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /Todas/ }));
    await user.selectOptions(screen.getByLabelText("Filtrar por estação"), "2");
    expect(screen.getByText("Nenhuma regra com esses filtros")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Filtrar por estação"), "");
    await user.type(screen.getByLabelText("Buscar regra"), "seco");
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("ativa e desativa pela chave", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi({ ...defaultRoutes(), "PUT /api/alerts/config/1": { id: 1 } });
    renderWithProviders(<RulesPage />);

    await user.click(await screen.findByRole("switch", { name: "Regra 1 ativa" }));
    expect(await screen.findByText("Regra desativada.")).toBeInTheDocument();
    expect(calls.find((c) => c.method === "PUT")?.body).toEqual({
      sensor_id: 10,
      comparison_operator: ">",
      reference_value: 28.5,
      message: "Temperatura alta na sede",
      manager_user_id: 2,
      active: false,
    });
  });

  it("cria uma regra escolhendo estação e sensor", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi({ ...defaultRoutes(), "POST /api/alerts/config": { id: 3 } });
    renderWithProviders(<RulesPage />);
    await screen.findByText("Temperatura alta na sede");

    await user.click(screen.getByRole("button", { name: "Nova regra" }));
    const dialog = screen.getByRole("dialog", { name: "Nova regra de alerta" });
    await user.click(within(dialog).getByRole("button", { name: "Criar regra" }));
    expect(within(dialog).getByText("Escolha o sensor.")).toBeInTheDocument();

    await user.selectOptions(within(dialog).getByLabelText("Estação"), "1");
    await user.selectOptions(within(dialog).getByLabelText("Sensor"), "10");
    await user.selectOptions(within(dialog).getByLabelText("Condição"), "<");
    await user.type(within(dialog).getByLabelText(/Valor de referência/), "5");
    await user.type(within(dialog).getByLabelText("Mensagem do alerta"), "Geada");
    await user.selectOptions(within(dialog).getByLabelText("Responsável"), "2");
    expect(within(dialog).getByText(/Avisar quando/)).toHaveTextContent("Avisar quando Temperatura em Estação Sede for menor que 5 °C.");
    await user.click(within(dialog).getByRole("switch", { name: "Regra ativa" }));
    await user.click(within(dialog).getByRole("button", { name: "Criar regra" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(calls.find((c) => c.method === "POST")?.body).toEqual({
      sensor_id: 10,
      comparison_operator: "<",
      reference_value: 5,
      message: "Geada",
      manager_user_id: 2,
      active: false,
    });
  });

  it("edita e exclui", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi({
      ...defaultRoutes(),
      "PUT /api/alerts/config/2": { id: 2 },
      "DELETE /api/alerts/config/2": { status: 204, body: null },
    });
    renderWithProviders(<RulesPage />);

    await user.click(await screen.findByRole("button", { name: "Editar regra 2" }));
    const dialog = screen.getByRole("dialog", { name: "Editar regra de alerta" });
    expect(within(dialog).getByLabelText("Sensor")).toHaveValue("11");
    await user.clear(within(dialog).getByLabelText(/Valor de referência/));
    await user.type(within(dialog).getByLabelText(/Valor de referência/), "abc");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    expect(within(dialog).getByText("Informe um número.")).toBeInTheDocument();
    await user.clear(within(dialog).getByLabelText(/Valor de referência/));
    await user.type(within(dialog).getByLabelText(/Valor de referência/), "35");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Regra atualizada.")).toBeInTheDocument();
    expect(calls.find((c) => c.method === "PUT")?.body).toMatchObject({ reference_value: 35, sensor_id: 11 });

    await user.click(screen.getByRole("button", { name: "Excluir regra 2" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Excluir" }));
    expect(await screen.findByText("Regra excluída.")).toBeInTheDocument();
  });
});
