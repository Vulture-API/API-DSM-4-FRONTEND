import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StationsStatusGrid } from "./StationsStatusGrid";
import type { StationCommunicationDetail } from "../types/dashboard";

describe("StationsStatusGrid", () => {
  const mockStations: StationCommunicationDetail[] = [
    {
      id: 1,
      codigo: "EST-001",
      name: "Estação Alpha",
      property: "Fazenda A",
      status: "online",
      latitude: -23.17,
      longitude: -45.88,
      lastCommunication: "10/06/2025 - 14:30",
      lastCommunicationMinutesAgo: 2,
      activeSensorsCount: 5,
      totalSensorsCount: 5,
      dataConsistent: true,
      macAddress: "00:1A:2B:3C:4D:01",
    },
    {
      id: 2,
      codigo: "EST-002",
      name: "Estação Beta",
      property: "Fazenda B",
      status: "unstable",
      latitude: -23.18,
      longitude: -45.89,
      lastCommunication: "10/06/2025 - 14:20",
      lastCommunicationMinutesAgo: 12,
      activeSensorsCount: 3,
      totalSensorsCount: 5,
      dataConsistent: false,
      macAddress: "00:1A:2B:3C:4D:02",
    },
    {
      id: 3,
      codigo: "EST-003",
      name: "Estação Gama",
      property: "Fazenda C",
      status: "offline",
      latitude: -23.19,
      longitude: -45.87,
      lastCommunication: "10/06/2025 - 13:50",
      lastCommunicationMinutesAgo: 45,
      activeSensorsCount: 0,
      totalSensorsCount: 5,
      dataConsistent: false,
      macAddress: "00:1A:2B:3C:4D:03",
    },
  ];

  it("renderiza o monitor com todas as estações e códigos do banco", () => {
    render(<StationsStatusGrid stations={mockStations} />);

    expect(screen.getByText("Status Operacional das Estações")).toBeInTheDocument();
    expect(screen.getByText("EST-001")).toBeInTheDocument();
    expect(screen.getByText("Estação Alpha")).toBeInTheDocument();
    expect(screen.getByText("EST-002")).toBeInTheDocument();
    expect(screen.getByText("Estação Beta")).toBeInTheDocument();
    expect(screen.getByText("EST-003")).toBeInTheDocument();
    expect(screen.getByText("Estação Gama")).toBeInTheDocument();
  });

  it("filtra as estações por status (online, instável, offline)", () => {
    render(<StationsStatusGrid stations={mockStations} />);

    // Click Online tab
    fireEvent.click(screen.getByRole("button", { name: /Online \(1\)/ }));
    expect(screen.getByText("Estação Alpha")).toBeInTheDocument();
    expect(screen.queryByText("Estação Beta")).not.toBeInTheDocument();
    expect(screen.queryByText("Estação Gama")).not.toBeInTheDocument();

    // Click Instáveis tab
    fireEvent.click(screen.getByRole("button", { name: /Instáveis \(1\)/ }));
    expect(screen.queryByText("Estação Alpha")).not.toBeInTheDocument();
    expect(screen.getByText("Estação Beta")).toBeInTheDocument();
    expect(screen.queryByText("Estação Gama")).not.toBeInTheDocument();

    // Click Offline tab
    fireEvent.click(screen.getByRole("button", { name: /Offline \(1\)/ }));
    expect(screen.queryByText("Estação Alpha")).not.toBeInTheDocument();
    expect(screen.queryByText("Estação Beta")).not.toBeInTheDocument();
    expect(screen.getByText("Estação Gama")).toBeInTheDocument();

    // Click Todas tab
    fireEvent.click(screen.getByRole("button", { name: /Todas \(3\)/ }));
    expect(screen.getByText("Estação Alpha")).toBeInTheDocument();
    expect(screen.getByText("Estação Beta")).toBeInTheDocument();
    expect(screen.getByText("Estação Gama")).toBeInTheDocument();
  });
});
