import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { overview } from "@/test/fixtures";
import { defaultRoutes, mockApi, page, renderWithProviders } from "@/test/utils";

import type { Occurrence } from "./api";
import { OccurrencesSummary } from "./OccurrencesSummary";

const failures: Occurrence[] = [
  {
    id: 1, type: "COMMUNICATION_FAILURE", status: "OPEN",
    station_id: 1, station_name: "Estação Sede", sensor_id: null,
    sensor_identifier: null, sensor_type: null, reading_id: null, value: null,
    description: "Estação Sede sem comunicação há 20 min (limite de 10 min).",
    detected_at: "2026-10-17T12:00:00Z", resolved_at: null,
  },
  {
    id: 2, type: "OUT_OF_RANGE", status: "OPEN",
    station_id: 1, station_name: "Estação Sede", sensor_id: 10,
    sensor_identifier: "TEMP-SEDE", sensor_type: "Temperatura",
    reading_id: 99, value: 0,
    description: "Sensor TEMP-SEDE: valor 0 abaixo do mínimo 5 configurado.",
    detected_at: "2026-10-17T12:05:00Z", resolved_at: null,
  },
  {
    id: 3, type: "OUT_OF_RANGE", status: "OPEN",
    station_id: 3, station_name: "Estação Brejo", sensor_id: 30,
    sensor_identifier: "TEMP-BREJO", sensor_type: "Temperatura",
    reading_id: 100, value: 80,
    description: "Sensor TEMP-BREJO: valor 80 acima do máximo 60 configurado.",
    detected_at: "2026-10-17T12:10:00Z", resolved_at: null,
  },
];

function routes() {
  return {
    ...defaultRoutes(),
    "/api/occurrences": ({ url }: { url: URL }) =>
      page(failures.filter((o) => !url.searchParams.get("station_id") ||
        o.station_id === Number(url.searchParams.get("station_id")))),
    "/api/stations/overview": ({ url }: { url: URL }) => ({
      ...overview,
      stations: overview.stations.filter((s) => !url.searchParams.get("property_id") ||
        s.property_id === Number(url.searchParams.get("property_id"))),
    }),
  };
}

describe("Falhas em aberto no dashboard", () => {
  it("conta todas as ocorrências e detalha falhas e leituras fora dos limites no modal", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi(routes());
    renderWithProviders(<DashboardPage />);
    const trigger = await screen.findByRole("button", { name: "Falhas em aberto" });
    await waitFor(() => expect(trigger).toHaveTextContent("3"));
    expect(calls.some((c) => c.path === "/api/occurrences?status=OPEN&page=1&limit=100")).toBe(true);
    await user.click(trigger);
    const modal = screen.getByRole("dialog", { name: "Falhas em aberto" });
    expect(within(modal).getByText("Falha de comunicação")).toBeInTheDocument();
    expect(within(modal).getAllByText("Leitura fora dos limites")).toHaveLength(2);
    expect(within(modal).getByText(failures[1]!.description)).toBeInTheDocument();
    expect(within(modal).getByText("0")).toBeInTheDocument();
    expect(within(modal).getByText("#99")).toBeInTheDocument();
    expect(within(modal).getByText(/TEMP-SEDE · #10 · Temperatura/)).toBeInTheDocument();
    expect(within(modal).getByRole("link", { name: "Estação Brejo" })).toHaveAttribute("href", "/estacoes/3");
    expect(within(modal).getByText("17 de out. de 2026 · 09:05")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("filtra contagem e detalhes pela estação selecionada e volta ao total geral", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi(routes());
    renderWithProviders(<DashboardPage />);
    const trigger = await screen.findByRole("button", { name: "Falhas em aberto" });
    await waitFor(() => expect(trigger).toHaveTextContent("3"));
    await user.selectOptions(screen.getByLabelText("Filtrar por estação"), "1");
    await waitFor(() => expect(screen.getByRole("button", { name: "Falhas em aberto" })).toHaveTextContent("2"));
    expect(calls.some((c) => c.path.includes("status=OPEN&station_id=1"))).toBe(true);
    await user.click(screen.getByRole("button", { name: "Falhas em aberto" }));
    const modal = screen.getByRole("dialog");
    expect(within(modal).getByText(/Estação Sede. Falhas de comunicação/)).toBeInTheDocument();
    expect(within(modal).queryByText(failures[2]!.description)).not.toBeInTheDocument();
    await user.click(within(modal).getByRole("button", { name: "Fechar detalhes" }));
    await user.selectOptions(screen.getByLabelText("Filtrar por estação"), "");
    await waitFor(() => expect(screen.getByRole("button", { name: "Falhas em aberto" })).toHaveTextContent("3"));
  });

  it("respeita propriedade sem enviar filtro não suportado pelo backend", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi(routes());
    renderWithProviders(<DashboardPage />);
    await screen.findByRole("button", { name: "Falhas em aberto" });
    await user.selectOptions(screen.getByLabelText("Filtrar por propriedade"), "2");
    await waitFor(() => expect(screen.getByRole("button", { name: "Falhas em aberto" })).toHaveTextContent("1"));
    expect(calls.filter((c) => c.path.startsWith("/api/occurrences")).every((c) => !c.path.includes("property_id"))).toBe(true);
    await user.click(screen.getByRole("button", { name: "Falhas em aberto" }));
    const modal = screen.getByRole("dialog");
    expect(within(modal).getByText(failures[2]!.description)).toBeInTheDocument();
    expect(within(modal).queryByText(failures[0]!.description)).not.toBeInTheDocument();
  });

  it("distingue ausência de falhas de erro de comunicação e permite tentar novamente", async () => {
    const user = userEvent.setup();
    let failing = true;
    mockApi({ "/api/occurrences": () => failing
      ? { status: 503, body: { message: "Ocorrências indisponíveis" } }
      : page([]) });
    renderWithProviders(<OccurrencesSummary stations={overview.stations} />);
    const trigger = screen.getByRole("button", { name: "Falhas em aberto" });
    await waitFor(() => expect(trigger).toHaveTextContent("—"));
    await user.click(trigger);
    const modal = screen.getByRole("dialog");
    expect(within(modal).getByText("Ocorrências indisponíveis")).toBeInTheDocument();
    expect(within(modal).queryByText("Nenhuma falha em aberto")).not.toBeInTheDocument();
    failing = false;
    await user.click(within(modal).getByRole("button", { name: "Tentar de novo" }));
    expect(await within(modal).findByText("Nenhuma falha em aberto")).toBeInTheDocument();
    expect(trigger).toHaveTextContent("0");
  });

  it("mostra carregamento no contador e no modal enquanto a consulta está pendente", async () => {
    const user = userEvent.setup();
    let resolve!: (result: unknown) => void;
    mockApi({ "/api/occurrences": () => new Promise((done) => { resolve = done; }) });
    renderWithProviders(<OccurrencesSummary stations={overview.stations} />);
    expect(screen.getByRole("status", { name: "Carregando falhas" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Falhas em aberto" }));
    expect(screen.getByRole("status", { name: "Carregando ocorrências" })).toBeInTheDocument();
    await act(async () => resolve(page([])));
    expect(await screen.findByText("Nenhuma falha em aberto")).toBeInTheDocument();
  });

  it("busca todas as páginas da API e pagina os detalhes sem perder contagem", async () => {
    const user = userEvent.setup();
    const items = Array.from({ length: 9 }, (_, i) => ({ ...failures[0]!, id: i + 1, description: `Falha de teste ${i + 1}` }));
    mockApi({ "/api/occurrences": ({ url }: { url: URL }) => ({
      data: url.searchParams.get("page") === "1" ? items.slice(0, 5) : items.slice(5),
      meta: { total_records: 9, total_pages: 2, current_page: Number(url.searchParams.get("page")) },
    }) });
    renderWithProviders(<OccurrencesSummary stations={overview.stations} />);
    const trigger = screen.getByRole("button", { name: "Falhas em aberto" });
    await waitFor(() => expect(trigger).toHaveTextContent("9"));
    await user.click(trigger);
    const modal = screen.getByRole("dialog");
    expect(within(modal).getByText("Página 1 de 2")).toBeInTheDocument();
    expect(within(modal).getAllByRole("listitem")).toHaveLength(8);
    await user.click(within(modal).getByRole("button", { name: "Próxima" }));
    expect(within(modal).getAllByRole("listitem")).toHaveLength(1);
    expect(within(modal).getByText("Falha de teste 1")).toBeInTheDocument();
  });

  it("pede confirmação, permite cancelar e atualiza o contador após resolver", async () => {
    const user = userEvent.setup();
    let items = [...failures];
    const { calls } = mockApi({
      ...routes(),
      "/api/occurrences": () => page(items),
      "PATCH /api/occurrences/2/resolve": () => {
        items = items.filter((o) => o.id !== 2);
        return { ...failures[1]!, status: "RESOLVED", resolved_at: new Date().toISOString() };
      },
    });
    renderWithProviders(<OccurrencesSummary stations={overview.stations} />);
    const trigger = screen.getByRole("button", { name: "Falhas em aberto" });
    await waitFor(() => expect(trigger).toHaveTextContent("3"));
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Marcar como resolvida ocorrência #2" }));
    expect(screen.getByRole("dialog", { name: "Resolver ocorrência" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(calls.filter((c) => c.method === "PATCH")).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Marcar como resolvida ocorrência #2" }));
    await user.click(screen.getByRole("button", { name: "Confirmar resolução" }));
    expect(await screen.findByText("Ocorrência #2 marcada como resolvida.")).toBeInTheDocument();
    expect(trigger).toHaveTextContent("2");
    expect(screen.queryByRole("button", { name: "Marcar como resolvida ocorrência #2" })).not.toBeInTheDocument();
    expect(calls.filter((c) => c.method === "PATCH")).toEqual([
      { method: "PATCH", path: "/api/occurrences/2/resolve", body: undefined },
    ]);
  });

  it("mantém a ocorrência quando a API recusa a resolução e informa o erro", async () => {
    const user = userEvent.setup();
    mockApi({
      ...routes(),
      "PATCH /api/occurrences/1/resolve": { status: 403, body: { message: "Sem permissão para resolver" } },
    });
    renderWithProviders(<OccurrencesSummary stations={overview.stations} />);
    const trigger = screen.getByRole("button", { name: "Falhas em aberto" });
    await waitFor(() => expect(trigger).toHaveTextContent("3"));
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Marcar como resolvida ocorrência #1" }));
    expect(screen.getByText(/Se a estação continuar sem comunicar/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirmar resolução" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sem permissão para resolver");
    expect(trigger).toHaveTextContent("3");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("button", { name: "Marcar como resolvida ocorrência #1" })).toBeInTheDocument();
  });

  it("impede envio duplicado e fechamento durante a resolução", async () => {
    const user = userEvent.setup();
    let items = [...failures];
    let complete!: (data: unknown) => void;
    const { calls } = mockApi({
      ...routes(),
      "/api/occurrences": () => page(items),
      "PATCH /api/occurrences/3/resolve": () => new Promise((done) => { complete = done; }),
    });
    renderWithProviders(<OccurrencesSummary stations={overview.stations} />);
    await user.click(screen.getByRole("button", { name: "Falhas em aberto" }));
    await user.click(await screen.findByRole("button", { name: "Marcar como resolvida ocorrência #3" }));
    await user.dblClick(screen.getByRole("button", { name: "Confirmar resolução" }));
    expect(screen.getByRole("button", { name: "Confirmar resolução" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Resolver ocorrência" })).toBeInTheDocument();
    expect(calls.filter((c) => c.method === "PATCH")).toHaveLength(1);
    items = items.filter((o) => o.id !== 3);
    await act(async () => complete({ ...failures[2]!, status: "RESOLVED", resolved_at: new Date().toISOString() }));
    expect(await screen.findByText("Ocorrência #3 marcada como resolvida.")).toBeInTheDocument();
  });

  it("atualiza automaticamente a contagem e os detalhes quando uma ocorrência é resolvida", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    try {
      let items = failures;
      mockApi({ "/api/occurrences": () => page(items) });
      renderWithProviders(<OccurrencesSummary stations={overview.stations} />);
      const trigger = screen.getByRole("button", { name: "Falhas em aberto" });
      await waitFor(() => expect(trigger).toHaveTextContent("3"));
      const user = userEvent.setup();
      await user.click(trigger);
      items = [failures[0]!];
      await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
      await waitFor(() => expect(trigger).toHaveTextContent("1"));
      expect(within(screen.getByRole("dialog")).getAllByRole("listitem")).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
