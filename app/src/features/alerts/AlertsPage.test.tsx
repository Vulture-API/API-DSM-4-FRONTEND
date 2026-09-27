import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { defaultRoutes, mockApi, renderWithProviders } from "@/test/utils";

import { AlertsPage } from "./AlertsPage";

describe("AlertsPage", () => {
  it("lista os pendentes com regra, estação e valor lido", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<AlertsPage />);

    const row = (await screen.findByText("Temperatura alta na sede")).closest("tr")!;
    expect(within(row).getByText("Temperatura acima de 28,5 °C")).toBeInTheDocument();
    expect(within(row).getByText("Estação Sede")).toBeInTheDocument();
    expect(within(row).getByText("30,2 °C")).toBeInTheDocument();
    expect(within(row).getByText("+1,7 do limite")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Pendentes/ })).toHaveTextContent("2");
    // Regressão: o contador (limit=1) e a tabela (limit=15) não podem dividir o cache.
    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(3));
    expect(screen.getByText(/Reconhecendo como/)).toHaveTextContent("Reconhecendo como Mariana Albuquerque");
  });

  it("reconhece um alerta como o usuário atual", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi({ ...defaultRoutes(), "PUT /api/alerts/triggered/100/acknowledge": { id: 100 } });
    renderWithProviders(<AlertsPage />);

    const row = (await screen.findByText("Temperatura alta na sede")).closest("tr")!;
    await waitFor(() => expect(screen.getByText(/Reconhecendo como/)).toBeInTheDocument());
    await user.click(within(row).getByRole("button", { name: "Reconhecer" }));

    expect(await screen.findByText("Alerta reconhecido.")).toBeInTheDocument();
    expect(calls.find((c) => c.method === "PUT")?.body).toEqual({ acknowledged_by: 1 });
  });

  it("mostra os reconhecidos com quem reconheceu", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());
    renderWithProviders(<AlertsPage />);
    await screen.findByText("Temperatura alta na sede");

    await user.click(screen.getByRole("radio", { name: /Reconhecidos/ }));
    const table = await screen.findByRole("table");
    await waitFor(() => expect(within(table).getByText("Mariana Albuquerque", { exact: false })).toBeInTheDocument());
    const row = within(table).getByText("Mariana Albuquerque", { exact: false }).closest("tr")!;
    expect(within(row).getByText("29 °C")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reconhecer" })).not.toBeInTheDocument();
  });

  it("pagina", async () => {
    const user = userEvent.setup();
    const { calls } = mockApi({
      ...defaultRoutes(),
      "/api/alerts/triggered": ({ url }: { url: URL }) => ({
        data: [],
        meta: { total_records: url.searchParams.get("limit") === "1" ? 40 : 40, total_pages: 3, current_page: 1 },
      }),
    });
    renderWithProviders(<AlertsPage />);

    await user.click(await screen.findByRole("button", { name: "Próxima página" }));
    await waitFor(() => expect(calls.some((c) => c.path.includes("page=2"))).toBe(true));
    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Página anterior" }));
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
  });

  it("mostra estado vazio", async () => {
    mockApi({
      ...defaultRoutes(),
      "/api/alerts/triggered": { data: [], meta: { total_records: 0, total_pages: 0, current_page: 1 } },
    });
    renderWithProviders(<AlertsPage />);
    expect(await screen.findByText("Nenhum alerta pendente")).toBeInTheDocument();
  });
});
