import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  defaultRoutes,
  mockApi,
  renderWithProviders,
  testUser,
} from "@/test/utils";

import { CollectionSettingsCard } from "./CollectionSettingsCard";

const settings = {
  station_id: 1,
  mac_address: "AA:BB:CC:DD:EE:01",
  collection_interval_seconds: 60,
  min_interval_seconds: 10,
  max_interval_seconds: 300,
};
const mount = () =>
  renderWithProviders(
    <CollectionSettingsCard stationId={1} stationName="Sede" />,
  );
const input = () =>
  screen.findByLabelText("Novo intervalo de coleta (segundos)");
const button = () => screen.getByRole("button", { name: "Salvar intervalo" });

// SCRUM-590 — testes unitários do painel e contrato HTTP da SCRUM-589.
describe("configuração administrativa da coleta", () => {
  it("exibe estação, MAC, intervalo e informações de comunicação", async () => {
    mockApi({ ...defaultRoutes(), "/api/stations/1/collection": settings });
    mount();
    expect(
      await screen.findByText("Estação selecionada: Sede"),
    ).toBeInTheDocument();
    expect(await screen.findByText(settings.mac_address)).toBeInTheDocument();
    expect(screen.getByText("60 segundos (1 minuto)")).toBeInTheDocument();
    expect(await screen.findByText("Em comunicação")).toBeInTheDocument();
    expect(await input()).toHaveValue("60");
    expect(button()).toBeDisabled();
  });

  it.each(["", "0", "9", "301", "1.5", "abc"])(
    "bloqueia %j antes de enviar",
    async (value) => {
      const user = userEvent.setup();
      const { calls } = mockApi(defaultRoutes());
      mount();
      const field = await input();
      await user.clear(field);
      if (value) await user.type(field, value);
      await user.click(button());
      expect(field).toHaveAttribute("aria-invalid", "true");
      expect(calls.some((c) => c.method === "PUT")).toBe(false);
    },
  );

  it("salva um inteiro e atualiza o intervalo apresentado", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi({
      ...defaultRoutes(),
      "PUT /api/stations/1/collection": {
        ...settings,
        collection_interval_seconds: 120,
      },
    });
    mount();
    const field = await input();
    await user.clear(field);
    await user.type(field, "120");
    await user.click(button());
    expect(
      await screen.findByText("Intervalo de coleta atualizado."),
    ).toBeInTheDocument();
    expect(screen.getByText("120 segundos (2 minutos)")).toBeInTheDocument();
    expect(field).toHaveValue("120");
    expect(button()).toBeDisabled();
    expect(calls.find((c) => c.method === "PUT")?.body).toEqual({
      collection_interval_seconds: 120,
    });
  });

  it("mantém o valor configurado e o rascunho após falha e permite tentar de novo", async () => {
    const user = userEvent.setup();
    let fail = true;
    mockApi({
      ...defaultRoutes(),
      "PUT /api/stations/1/collection": () =>
        fail
          ? { status: 503, body: { message: "Unavailable" } }
          : { ...settings, collection_interval_seconds: 120 },
    });
    mount();
    const field = await input();
    await user.clear(field);
    await user.type(field, "120");
    await user.click(button());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Serviço de coleta indisponível",
    );
    expect(screen.getByText("60 segundos (1 minuto)")).toBeInTheDocument();
    expect(field).toHaveValue("120");
    fail = false;
    await user.click(button());
    expect(
      await screen.findByText("Intervalo de coleta atualizado."),
    ).toBeInTheDocument();
  });

  it("carrega e permite repetir a consulta após indisponibilidade", async () => {
    const user = userEvent.setup();
    let resolve!: (value: unknown) => void;
    let fail = true;
    mockApi({
      ...defaultRoutes(),
      "/api/stations/1/collection": () =>
        fail
          ? new Promise((done) => {
              resolve = done;
            })
          : settings,
    });
    mount();
    expect(
      screen.getByText("Carregando configuração da coleta…"),
    ).toBeInTheDocument();
    await waitFor(() => expect(resolve).toBeDefined());
    await act(async () =>
      resolve({ status: 503, body: { message: "Unavailable" } }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Serviço de coleta indisponível",
    );
    fail = false;
    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(await input()).toHaveValue("60");
  });

  it("bloqueia novos envios enquanto salva", async () => {
    const user = userEvent.setup();
    let resolve!: (value: unknown) => void;
    const { calls } = mockApi({
      ...defaultRoutes(),
      "PUT /api/stations/1/collection": () =>
        new Promise((done) => {
          resolve = done;
        }),
    });
    mount();
    const field = await input();
    await user.clear(field);
    await user.type(field, "120");
    await user.dblClick(button());
    expect(field).toBeDisabled();
    expect(button()).toBeDisabled();
    expect(calls.filter((c) => c.method === "PUT")).toHaveLength(1);
    await act(async () =>
      resolve({ ...settings, collection_interval_seconds: 120 }),
    );
    expect(
      await screen.findByText("Intervalo de coleta atualizado."),
    ).toBeInTheDocument();
  });

  it("trata estação removida antes da consulta", async () => {
    mockApi({
      ...defaultRoutes(),
      "/api/stations/1/collection": {
        status: 404,
        body: { message: "Missing" },
      },
    });
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Estação não encontrada ou removida",
    );
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it("bloqueia edição quando a estação é removida durante o salvamento", async () => {
    const user = userEvent.setup();
    mockApi({
      ...defaultRoutes(),
      "PUT /api/stations/1/collection": {
        status: 404,
        body: { message: "Missing" },
      },
    });
    mount();
    const field = await input();
    await user.clear(field);
    await user.type(field, "120");
    await user.click(button());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Estação não encontrada ou removida",
    );
    expect(field).toBeDisabled();
    expect(button()).toBeDisabled();
  });

  it("apresenta estação sem comunicação e sem registros", async () => {
    mockApi({
      ...defaultRoutes(),
      "/api/stations/1/status": {
        station_id: 1,
        status: "Offline",
        last_communication_at: null,
        checked_at: "2026-11-17T12:00:00Z",
        offline_threshold_minutes: 10,
      },
    });
    mount();
    expect(await screen.findByText("Sem comunicação")).toBeInTheDocument();
    expect(
      screen.getByText("Nenhuma comunicação registrada"),
    ).toBeInTheDocument();
    expect(await input()).toBeEnabled();
  });

  it("mantém a configuração disponível quando a consulta do status falha", async () => {
    mockApi({
      ...defaultRoutes(),
      "/api/stations/1/status": {
        status: 503,
        body: { message: "Unavailable" },
      },
    });
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Serviço de coleta indisponível",
    );
    expect(await input()).toBeEnabled();
    expect(screen.queryByText("Em comunicação")).not.toBeInTheDocument();
  });

  it.each(["Gerente Agrícola", "Cliente"])(
    "não exibe nem consulta configuração para %s",
    async (name) => {
      const { calls } = mockApi(defaultRoutes());
      renderWithProviders(
        <CollectionSettingsCard stationId={1} stationName="Sede" />,
        {
          ...testUser,
          name,
          permissions: ["stations.read", "stations.update", "monitoring.read"],
        },
      );
      expect(
        screen.queryByRole("region", { name: "Configuração da coleta" }),
      ).not.toBeInTheDocument();
      expect(calls).toHaveLength(0);
    },
  );

  it("oculta o formulário para uma concessão somente de leitura", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(
      <CollectionSettingsCard stationId={1} stationName="Sede" />,
      {
        ...testUser,
        permissions: ["stations.read", "station-collection.read"],
      },
    );
    expect(
      await screen.findByText("60 segundos (1 minuto)"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(
      within(
        screen.getByRole("region", { name: "Configuração da coleta" }),
      ).queryByRole("button", { name: "Salvar intervalo" }),
    ).not.toBeInTheDocument();
  });
});
