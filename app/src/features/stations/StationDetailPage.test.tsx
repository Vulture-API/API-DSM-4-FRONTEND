import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { defaultRoutes, mockApi, renderWithProviders } from "@/test/utils";

import { StationDetailPage } from "./StationDetailPage";

describe("StationDetailPage", () => {
  it("mostra cabeçalho, leituras atuais, histórico e sensores", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<StationDetailPage id={1} />);

    expect(await screen.findByRole("heading", { name: "Estação Sede" })).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
    const readings = screen.getByRole("region", { name: "Leituras atuais" });
    expect(within(readings).getByText("24")).toBeInTheDocument();
    const measure = await screen.findByLabelText("Medição exibida no gráfico");
    await waitFor(() => expect(measure).toHaveValue("1"));
    expect(within(measure).getByRole("option", { name: "Umidade (%)" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Mapa com a localização de Estação Sede" })).toBeInTheDocument();
    expect(screen.getByText("-23.1000, -45.8000")).toBeInTheDocument();
    expect(await screen.findByRole("switch", { name: "Sensor umid operacional" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("troca o tipo e o período do gráfico", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi(defaultRoutes());
    renderWithProviders(<StationDetailPage id={1} />);

    const measure = await screen.findByLabelText("Medição exibida no gráfico");
    await waitFor(() => expect(measure).toHaveValue("1"));
    await user.selectOptions(measure, "2");
    expect(measure).toHaveValue("2");
    expect(screen.getByText("Último").nextElementSibling).toHaveTextContent("60 %");
    expect(screen.getByText(/^Gráfico de Umidade em 24 h/)).toHaveTextContent("mínimo 55 e máximo 65 %");
    await user.click(screen.getByRole("radio", { name: "7 dias" }));
    await waitFor(() =>
      expect(calls.some((c) => c.path.includes("/api/stations/1/readings/series?hours=168&bucket_minutes=180"))).toBe(true),
    );
  });

  it("vincula, ativa e remove sensores", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi({
      ...defaultRoutes(),
      "POST /api/sensors": { id: 99 },
      "PUT /api/sensors/11": { id: 11 },
      "DELETE /api/sensors/10": { status: 204, body: null },
    });
    renderWithProviders(<StationDetailPage id={1} />);
    await screen.findByRole("switch", { name: "Sensor umid operacional" });

    await user.click(screen.getByRole("button", { name: "Adicionar sensor" }));
    const dialog = screen.getByRole("dialog", { name: "Adicionar sensor" });
    await user.click(within(dialog).getByRole("button", { name: "Vincular sensor" }));
    expect(within(dialog).getByText("Escolha o tipo de medição.")).toBeInTheDocument();
    expect(within(dialog).getByText("Informe o identificador.")).toBeInTheDocument();

    await user.selectOptions(within(dialog).getByLabelText("Tipo de medição"), "2");
    await user.type(within(dialog).getByLabelText("Identificador"), "umid_2");
    await user.click(within(dialog).getByRole("button", { name: "Vincular sensor" }));
    expect(await screen.findByText("Sensor vinculado à estação.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(calls.find((c) => c.method === "POST")?.body).toEqual({
      station_id: 1,
      sensor_type_id: 2,
      local_identifier: "umid_2",
      operational_status: true,
    });

    await user.click(screen.getByRole("switch", { name: "Sensor umid operacional" }));
    expect(await screen.findByText("Sensor ativado.")).toBeInTheDocument();
    expect(calls.find((c) => c.method === "PUT")?.body).toMatchObject({ operational_status: true });

    await user.click(screen.getByRole("button", { name: "Remover sensor temp" }));
    expect(await screen.findByText("Sensor removido.")).toBeInTheDocument();
  });

  it("abre a edição", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());
    renderWithProviders(<StationDetailPage id={1} />);

    await user.click(await screen.findByRole("button", { name: "Editar" }));
    expect(screen.getByRole("dialog", { name: "Editar estação" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("avisa quando a estação não existe", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<StationDetailPage id={404} />);
    expect(await screen.findByText("Estação não encontrada")).toBeInTheDocument();
  });

  it("mostra estado vazio sem leituras", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<StationDetailPage id={3} />);
    expect(await screen.findByText("Sem leituras ainda")).toBeInTheDocument();
    expect(await screen.findByText("Nenhum sensor vinculado")).toBeInTheDocument();
  });
});
