import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommunicationIncidentsTable } from "./CommunicationIncidentsTable";
import type { CommunicationIncident } from "../types/dashboard";

describe("CommunicationIncidentsTable", () => {
  const mockIncidents: CommunicationIncident[] = [
    {
      id: "INC-1",
      stationName: "Estação 05",
      propertyName: "Fazenda Boa Vista",
      type: "offline",
      severity: "critical",
      description: "Perda total de comunicação por mais de 40 minutos",
      occurredAt: "Hoje, 13:52",
      duration: "40 min",
    },
    {
      id: "INC-2",
      stationName: "Estação 04",
      propertyName: "Fazenda Boa Vista",
      type: "inconsistent_data",
      severity: "warning",
      description: "Leituras com flag data_consistent=false no sensor HUM-01",
      occurredAt: "Hoje, 14:20",
      duration: "12 min",
    },
  ];

  it("renderiza a tabela de incidentes corretamente", () => {
    render(<CommunicationIncidentsTable incidents={mockIncidents} />);

    expect(screen.getByText("Ocorrências Recentes de Conectividade")).toBeInTheDocument();
    expect(screen.getByText("Crítico")).toBeInTheDocument();
    expect(screen.getByText("Atenção")).toBeInTheDocument();
    expect(screen.getByText("Estação 05")).toBeInTheDocument();
    expect(screen.getByText("Estação 04")).toBeInTheDocument();
    expect(screen.getByText("Perda total de comunicação por mais de 40 minutos")).toBeInTheDocument();
  });

  it("dispara callback ao clicar em diagnosticar", () => {
    const handleDiagnose = vi.fn();
    render(
      <CommunicationIncidentsTable
        incidents={mockIncidents}
        onDiagnose={handleDiagnose}
      />
    );

    const buttons = screen.getAllByRole("button", { name: "Diagnosticar" });
    fireEvent.click(buttons[0]);
    expect(handleDiagnose).toHaveBeenCalledWith("INC-1");
  });

  it("exibe mensagem quando não há incidentes", () => {
    render(<CommunicationIncidentsTable incidents={[]} />);

    expect(
      screen.getByText(/Nenhum incidente de comunicação registrado no momento/)
    ).toBeInTheDocument();
  });
});
