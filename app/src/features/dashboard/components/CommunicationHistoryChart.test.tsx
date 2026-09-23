import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CommunicationHistoryChart } from "./CommunicationHistoryChart";
import type { HourlyCommunicationPoint } from "../types/dashboard";

describe("CommunicationHistoryChart", () => {
  const mockData: HourlyCommunicationPoint[] = [
    { hour: "00:00", onlineCount: 12, unstableCount: 0, offlineCount: 0, uptimePct: 100 },
    { hour: "06:00", onlineCount: 11, unstableCount: 1, offlineCount: 0, uptimePct: 95.8 },
    { hour: "12:00", onlineCount: 9, unstableCount: 1, offlineCount: 2, uptimePct: 83.3 },
  ];

  it("renderiza o gráfico de disponibilidade e meta SLA", () => {
    render(<CommunicationHistoryChart data={mockData} slaTarget={95} />);

    expect(screen.getByText("Disponibilidade da Rede de Estações (24h)")).toBeInTheDocument();
    expect(screen.getByText("SLA 95%")).toBeInTheDocument();
    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(screen.getByText("06:00")).toBeInTheDocument();
    expect(screen.getByText("12:00")).toBeInTheDocument();
  });

  it("exibe tooltip ao passar o mouse sobre um ponto do gráfico", () => {
    render(<CommunicationHistoryChart data={mockData} />);

    const point = screen.getByLabelText("00:00: 100% uptime, 12 conectadas, 0 offline");
    fireEvent.mouseEnter(point);

    expect(screen.getByText(/00:00: 100% disponível/)).toBeInTheDocument();

    fireEvent.mouseLeave(point);
    expect(screen.queryByText(/00:00: 100% disponível/)).not.toBeInTheDocument();
  });

  it("retorna null se a lista de dados estiver vazia", () => {
    const { container } = render(<CommunicationHistoryChart data={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
