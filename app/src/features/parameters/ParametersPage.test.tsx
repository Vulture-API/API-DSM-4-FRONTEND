import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { defaultRoutes, mockApi, renderWithProviders } from "@/test/utils";

import { ParametersPage } from "./ParametersPage";

describe("ParametersPage", () => {
  it("lista os tipos com unidade, calibração e uso", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<ParametersPage />);

    const card = (await screen.findByText("Umidade")).closest("li")!;
    expect(within(card).getByText("%")).toBeInTheDocument();
    expect(within(card).getByText("fator 1,5")).toBeInTheDocument();
    expect(within(card).getByText("ganho 2")).toBeInTheDocument();
    const temperature = screen.getByText("Temperatura").closest("li")!;
    expect(within(temperature).getByText("Sem calibração")).toBeInTheDocument();
    await waitFor(() => expect(within(temperature).getByText("2")).toBeInTheDocument());
  });

  it("busca por nome ou unidade", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());
    renderWithProviders(<ParametersPage />);
    await screen.findByText("Umidade");

    await user.type(screen.getByLabelText("Buscar parâmetro"), "°c");
    expect(screen.queryByText("Umidade")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Buscar parâmetro"), "xyz");
    expect(screen.getByText("Nenhum parâmetro encontrado")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(screen.getByText("Umidade")).toBeInTheDocument();
  });

  it("cadastra com calibração opcional", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi({ ...defaultRoutes(), "POST /api/sensor-types": { id: 3 } });
    renderWithProviders(<ParametersPage />);
    await screen.findByText("Umidade");

    await user.click(screen.getByRole("button", { name: "Novo parâmetro" }));
    const dialog = screen.getByRole("dialog", { name: "Novo parâmetro" });
    await user.click(within(dialog).getByRole("button", { name: "Cadastrar" }));
    expect(within(dialog).getByText("Informe o nome.")).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText("Nome"), "Radiação Solar");
    await user.type(within(dialog).getByLabelText("Unidade de medida"), "W/m²");
    await user.type(within(dialog).getByLabelText("Fator"), "x");
    await user.click(within(dialog).getByRole("button", { name: "Cadastrar" }));
    expect(within(dialog).getByText("Número inválido.")).toBeInTheDocument();
    await user.clear(within(dialog).getByLabelText("Fator"));
    await user.type(within(dialog).getByLabelText("Fator"), "0,5");
    await user.click(within(dialog).getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("Parâmetro cadastrado.")).toBeInTheDocument();
    expect(calls.find((c) => c.method === "POST")?.body).toEqual({
      name: "Radiação Solar",
      unit_of_measure: "W/m²",
      factor: 0.5,
      gain: null,
    });
  });

  it("edita e avisa ao excluir tipo em uso", async () => {
    const user = userEvent.setup();
    mockApi({
      ...defaultRoutes(),
      "PUT /api/sensor-types/2": { id: 2 },
      "DELETE /api/sensor-types/1": { status: 409, body: { message: "Tipo em uso" } },
    });
    renderWithProviders(<ParametersPage />);

    await user.click(await screen.findByRole("button", { name: "Editar Umidade" }));
    const dialog = screen.getByRole("dialog", { name: "Editar parâmetro" });
    expect(within(dialog).getByLabelText("Ganho")).toHaveValue("2");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Parâmetro atualizado.")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText("Temperatura").closest("li")).toHaveTextContent("Sensores2"));
    await user.click(screen.getByRole("button", { name: "Excluir Temperatura" }));
    const confirm = screen.getByRole("dialog", { name: "Excluir parâmetro" });
    expect(confirm).toHaveTextContent("está em uso por 2 sensor(es)");
    await user.click(within(confirm).getByRole("button", { name: "Excluir" }));
    expect(await screen.findByText("Tipo em uso")).toBeInTheDocument();
  });
});
