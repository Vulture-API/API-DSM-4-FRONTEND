import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultRoutes, mockApi, renderWithProviders } from "@/test/utils";
import { ReportsPage } from "./ReportsPage";

describe("ReportsPage", () => {
  it("carrega e alterna entre os relatórios de histórico, previsão e alertas", async () => {
    mockApi(defaultRoutes());

    renderWithProviders(<ReportsPage />);

    expect(
      screen.getByRole("heading", { name: "Relatórios Meteorológicos" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("Resumo Estatístico por Tipo de Sensor"),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Data final"), {
      target: { value: "31/12/2026" },
    });

    fireEvent.click(screen.getByText("Relatório de Previsão Meteorológica"));

    await waitFor(() => {
      expect(
        screen.getByText(/Previsão Diária — Estação Sede/i),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Relatório de Alertas e Ocorrências"));

    await waitFor(() => {
      expect(
        screen.getByText("Ocorrências e Alertas Disparados"),
      ).toBeInTheDocument();
    });
  });

  it("permite filtrar por propriedade, restaurar filtros padrão e exportar CSV", async () => {
    mockApi(defaultRoutes());
    const createObjectUrlSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:relatorio-teste");
    const revokeObjectUrlSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});

    renderWithProviders(<ReportsPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Resumo Estatístico por Tipo de Sensor"),
      ).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole("button", { name: /Exportar CSV/i });
    expect(exportBtn).toBeEnabled();
    fireEvent.click(exportBtn);

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlSpy).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText("Propriedade Rural"), {
      target: { value: "1" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Restaurar padrão/i }));

    expect(screen.getByLabelText("Propriedade Rural")).toHaveValue("all");

    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
  });

  it("utiliza o endpoint direto /api/reports quando disponível e exibe erro se falhar com 500", async () => {
    const routes = {
      ...defaultRoutes(),
      "/api/reports": () => ({ status: 500, body: { message: "Erro interno no motor de relatórios" } }),
    };
    mockApi(routes);

    renderWithProviders(<ReportsPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Erro interno no motor de relatórios"),
      ).toBeInTheDocument();
    });
  });
});
