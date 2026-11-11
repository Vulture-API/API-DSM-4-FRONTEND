import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { current, sensors, sensorTypes } from "@/test/fixtures";
import { defaultRoutes, mockApi, renderWithProviders } from "@/test/utils";

import { StationDetailPage } from "./StationDetailPage";

describe("StationDetailPage", () => {
  it("mostra cabeçalho, leituras atuais, histórico e sensores", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<StationDetailPage id={1} />);

    expect(await screen.findByRole("heading", { name: "Estação Sede" })).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
    const readings = screen.getByRole("region", { name: "Leituras atuais" });
    expect(await within(readings).findByText("24")).toBeInTheDocument();
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

  it("vincula sensor com modelo, ganho e offset", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi({ ...defaultRoutes(), "POST /api/sensors": { id: 99 } });
    renderWithProviders(<StationDetailPage id={1} />);
    await screen.findByRole("switch", { name: "Sensor umid operacional" });

    await user.click(screen.getByRole("button", { name: "Adicionar sensor" }));
    const dialog = screen.getByRole("dialog", { name: "Adicionar sensor" });
    await user.selectOptions(within(dialog).getByLabelText("Tipo de medição"), "2");
    expect(within(dialog).getByText(/vale a do tipo \(fator 1,5 · ganho 2\)/)).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText("Identificador"), "lux");
    await user.type(within(dialog).getByLabelText("Modelo"), "LDR GL5528");

    await user.type(within(dialog).getByLabelText("Ganho"), "0");
    await user.type(within(dialog).getByLabelText("Offset"), "abc");
    await user.click(within(dialog).getByRole("button", { name: "Vincular sensor" }));
    expect(within(dialog).getByText("Não pode ser zero.")).toBeInTheDocument();
    expect(within(dialog).getByText("Número inválido.")).toBeInTheDocument();
    expect(calls.some((c) => c.method === "POST")).toBe(false);

    await user.clear(within(dialog).getByLabelText("Ganho"));
    await user.type(within(dialog).getByLabelText("Ganho"), "0,0008");
    await user.clear(within(dialog).getByLabelText("Offset"));
    await user.type(within(dialog).getByLabelText("Offset"), "-0,125");
    await user.click(within(dialog).getByRole("button", { name: "Vincular sensor" }));

    expect(await screen.findByText("Sensor vinculado à estação.")).toBeInTheDocument();
    expect(calls.find((c) => c.method === "POST")?.body).toEqual({
      station_id: 1,
      sensor_type_id: 2,
      local_identifier: "lux",
      operational_status: true,
      gain: 0.0008,
      offset_value: -0.125,
      model: "LDR GL5528",
    });
  });

  it("mostra a calibração em uso de cada sensor", async () => {
    mockApi({
      ...defaultRoutes(),
      "/api/sensors": {
        data: [
          { ...sensors[0], model: "DHT22" },
          { ...sensors[1], gain: 0.5, offset_value: -1 },
        ],
        meta: { total_records: 2, total_pages: 1, current_page: 1 },
      },
    });
    renderWithProviders(<StationDetailPage id={1} />);

    const umid = (await screen.findByRole("switch", { name: "Sensor umid operacional" })).closest("tr")!;
    expect(within(umid).getByText("fator 1,5 · ganho 0,5 · offset -1")).toBeInTheDocument();
    expect(within(umid).getByText("do sensor")).toBeInTheDocument();
    const temp = screen.getByRole("switch", { name: "Sensor temp operacional" }).closest("tr")!;
    expect(within(temp).getByText("Sem calibração")).toBeInTheDocument();
    expect(within(temp).getByText("DHT22")).toBeInTheDocument();
  });

  it("mostra a calibração do tipo quando o sensor não tem a própria", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<StationDetailPage id={1} />);

    const umid = (await screen.findByRole("switch", { name: "Sensor umid operacional" })).closest("tr")!;
    expect(within(umid).getByText("fator 1,5 · ganho 2")).toBeInTheDocument();
    expect(within(umid).getByText("do tipo")).toBeInTheDocument();
  });

  it("edita a calibração do sensor e remove o que ficou em branco", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi({
      ...defaultRoutes(),
      "/api/sensors": {
        data: [{ ...sensors[1], gain: 0.5, offset_value: -1, model: "HIH-4030" }],
        meta: { total_records: 1, total_pages: 1, current_page: 1 },
      },
      "PUT /api/sensors/11": { id: 11 },
    });
    renderWithProviders(<StationDetailPage id={1} />);

    await user.click(await screen.findByRole("button", { name: "Editar sensor umid" }));
    const dialog = screen.getByRole("dialog", { name: "Editar sensor" });
    expect(within(dialog).getByLabelText("Ganho")).toHaveValue("0,5");
    expect(within(dialog).getByLabelText("Offset")).toHaveValue("-1");
    expect(within(dialog).getByLabelText("Modelo")).toHaveValue("HIH-4030");

    await user.clear(within(dialog).getByLabelText("Ganho"));
    await user.type(within(dialog).getByLabelText("Ganho"), "2");
    await user.clear(within(dialog).getByLabelText("Offset"));
    await user.clear(within(dialog).getByLabelText("Modelo"));
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Sensor atualizado.")).toBeInTheDocument();
    expect(calls.find((c) => c.method === "PUT")?.body).toEqual({
      station_id: 1,
      sensor_type_id: 2,
      local_identifier: "umid",
      operational_status: false,
      gain: 2,
      offset_value: null,
      model: null,
    });
  });

  it("mostra o erro da API ao salvar a calibração", async () => {
    const user = userEvent.setup();
    mockApi({
      ...defaultRoutes(),
      "PUT /api/sensors/11": { status: 400, body: { message: "Invalid calibration: gain must be a finite number different from zero." } },
    });
    renderWithProviders(<StationDetailPage id={1} />);

    await user.click(await screen.findByRole("button", { name: "Editar sensor umid" }));
    const dialog = screen.getByRole("dialog", { name: "Editar sensor" });
    await user.type(within(dialog).getByLabelText("Ganho"), "3");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText(/Invalid calibration/)).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Editar sensor" })).toBeInTheDocument();
  });

  it("lista sensor de um tipo novo cadastrado pelo cliente", async () => {
    mockApi({
      ...defaultRoutes(),
      "/api/sensor-types": [...sensorTypes, { id: 7, name: "Luminosidade", unit_of_measure: "lux", factor: null, gain: null, offset_value: null }],
      "/api/sensors": {
        data: [{ ...sensors[0], id: 12, sensor_type_id: 7, local_identifier: "lux" }],
        meta: { total_records: 1, total_pages: 1, current_page: 1 },
      },
    });
    renderWithProviders(<StationDetailPage id={1} />);

    const row = (await screen.findByRole("switch", { name: "Sensor lux operacional" })).closest("tr")!;
    expect(within(row).getByText("Luminosidade")).toBeInTheDocument();
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

  it("mostra ausência de medição e identifica leituras antigas", async () => {
    const data = structuredClone(current);
    data.stations[0]!.readings[0]!.value = null;
    data.stations[0]!.readings[0]!.unix_time = null;
    data.stations[0]!.readings[1]!.unix_time = Math.floor(Date.now() / 1000) - 3600;
    mockApi({ ...defaultRoutes(), "/api/stations/1/current": data });
    renderWithProviders(<StationDetailPage id={1} />);
    expect(await screen.findByText("Sem leitura")).toBeInTheDocument();
    expect(screen.getByText("Aguardando medição")).toBeInTheDocument();
    expect(screen.getByText(/Leitura antiga/)).toBeInTheDocument();
  });

  it("mostra estado vazio sem leituras", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<StationDetailPage id={3} />);
    expect(await screen.findByText("Sem leituras ainda")).toBeInTheDocument();
    expect(await screen.findByText("Nenhum sensor vinculado")).toBeInTheDocument();
  });
});
