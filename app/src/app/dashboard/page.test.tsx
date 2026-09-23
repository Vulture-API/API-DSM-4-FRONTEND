import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardPage from "./page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("DashboardPage", () => {
  it("renderiza o layout completo do dashboard com filtros e seções", () => {
    render(<DashboardPage />);

    expect(
      screen.getByText("Dashboard Climático & Monitoramento")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por propriedade")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Atualizar dados do dashboard" })
    ).toBeInTheDocument();
    expect(screen.getByText("Estações Totais")).toBeInTheDocument();
    expect(screen.getByText("Condições Climáticas Atuais")).toBeInTheDocument();
    expect(screen.getByText("Status Operacional das Estações")).toBeInTheDocument();
  });

  it("permite alterar a propriedade selecionada no filtro", () => {
    render(<DashboardPage />);

    const select = screen.getByLabelText("Filtrar por propriedade");
    fireEvent.change(select, { target: { value: "1" } });

    expect((select as HTMLSelectElement).value).toBe("1");
    expect(screen.getByText("4 de 4 estações")).toBeInTheDocument();
  });

  it("permite alterar o filtro de período temporal", () => {
    render(<DashboardPage />);

    const btn7d = screen.getByRole("button", { name: "7 dias" });
    fireEvent.click(btn7d);

    expect(btn7d).toHaveAttribute("aria-pressed", "true");
  });

  it("permite acionar o botão de atualização", () => {
    render(<DashboardPage />);

    const refreshBtn = screen.getByRole("button", {
      name: "Atualizar dados do dashboard",
    });
    fireEvent.click(refreshBtn);

    expect(screen.getByText("Atualizando...")).toBeInTheDocument();
  });
});
