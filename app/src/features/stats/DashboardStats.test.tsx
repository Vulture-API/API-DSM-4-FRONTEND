import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DashboardStats } from "./DashboardStats";
import { defaultRoutes, mockApi, renderWithProviders } from "@/test/utils";

describe("DashboardStats", () => {
  it("renderiza o cabeçalho com título e botão de exportação", () => {
    mockApi(defaultRoutes());
    renderWithProviders(<DashboardStats />);

    expect(
      screen.getByRole("heading", { name: "Estatísticas meteorológicas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Exportar CSV/i }),
    ).toBeInTheDocument();
  });

  it("renderiza os indicadores meteorológicos consolidados do banco de dados", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<DashboardStats />);

    expect((await screen.findAllByText("Temperatura")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Umidade do Ar").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Vento").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Chuva").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pressão").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Temp. Solo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Umid. Solo").length).toBeGreaterThan(0);
  });

  it("renderiza os 2 gráficos distintos (barras por estação e linha por horário)", async () => {
    mockApi(defaultRoutes());
    renderWithProviders(<DashboardStats />);

    expect(
      await screen.findByText("Comparativo por estação"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Variação por horário"),
    ).toBeInTheDocument();
  });

  it("permite filtrar os gráficos por tipo de medição pelos seletores", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());
    renderWithProviders(<DashboardStats />);

    const barSelect = await screen.findByLabelText("Medição exibida no gráfico de barras");
    await user.selectOptions(barSelect, "Velocidade do Vento");

    const lineSelect = screen.getByLabelText("Medição exibida no gráfico de linha");
    await user.selectOptions(lineSelect, "Velocidade do Vento");

    expect(barSelect).toHaveValue("Velocidade do Vento");
    expect(lineSelect).toHaveValue("Velocidade do Vento");
  });

  it("permite alternar período rápido pelos botões segmentados", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());
    renderWithProviders(<DashboardStats />);

    const button24h = screen.getByRole("radio", { name: "24 h" });
    await user.click(button24h);
    expect(button24h).toHaveAttribute("aria-checked", "true");
  });
});
