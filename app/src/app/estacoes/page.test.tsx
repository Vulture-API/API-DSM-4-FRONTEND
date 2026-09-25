import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EstacoesPage from "./page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/estacoes",
}));

describe("EstacoesPage", () => {
  it("renderiza a página de estações com barra de ações e tabela", async () => {
    render(<EstacoesPage />);

    expect(screen.getByText("Estações de Monitoramento")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nova Estação/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Filtrar estações...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("ESTAÇÃO")).toBeInTheDocument();
      expect(screen.getByText("PROPRIEDADE")).toBeInTheDocument();
      expect(screen.getByText("ENDEREÇO MAC")).toBeInTheDocument();
    });
  });

  it("abre e fecha o modal de nova estação", async () => {
    render(<EstacoesPage />);

    const newBtn = screen.getByRole("button", { name: /Nova Estação/i });
    fireEvent.click(newBtn);

    expect(screen.getByRole("heading", { name: "Criar Estação" })).toBeInTheDocument();

    const cancelBtn = screen.getByRole("button", { name: "Cancelar" });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Criar Estação" })).not.toBeInTheDocument();
    });
  });

  it("filtra estações através do campo de busca", async () => {
    render(<EstacoesPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Estação 01").length).toBeGreaterThanOrEqual(1);
    });

    const searchInput = screen.getByPlaceholderText("Filtrar estações...");
    fireEvent.change(searchInput, { target: { value: "Estação 01" } });

    expect(screen.getAllByText("Estação 01").length).toBeGreaterThanOrEqual(1);
  });

  it("exibe alerta somente após uma hora sem comunicação", async () => {
    render(<EstacoesPage />);

    expect(
      await screen.findByLabelText(
        "Alerta de comunicação da Estação 04: sem comunicação há 1 h e 15 min",
      ),
    ).toHaveAttribute("title", "Sem comunicação há 1 h e 15 min");
    expect(
      screen.queryByLabelText(/Alerta de comunicação da Estação 01/),
    ).not.toBeInTheDocument();
  });
});
