import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CommunicationSummaryCards } from "./CommunicationSummaryCards";
import type { CommunicationSummary } from "../types/dashboard";

describe("CommunicationSummaryCards", () => {
  const mockSummary: CommunicationSummary = {
    totalStations: 12,
    onlineCount: 8,
    unstableCount: 2,
    offlineCount: 2,
    globalAvailabilitySla: 96.4,
    consistentDataRate: 75,
    onlinePercentage: 67,
    slaTarget: 95.0,
  };

  it("renderiza todos os cards com as métricas de comunicação", () => {
    render(<CommunicationSummaryCards summary={mockSummary} />);

    expect(screen.getByText("Estações Totais")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Conectadas")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("67%")).toBeInTheDocument();
    expect(screen.getByText("Instáveis")).toBeInTheDocument();
    expect(screen.getByText("Sem Conexão")).toBeInTheDocument();
    expect(screen.getByText("SLA Disponibilidade")).toBeInTheDocument();
    expect(screen.getByText("96.4%")).toBeInTheDocument();
    expect(screen.getByText("Consistência de dados: 75%")).toBeInTheDocument();
  });
});
