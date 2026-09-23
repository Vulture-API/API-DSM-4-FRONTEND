import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WeatherTrendsChart } from "./WeatherTrendsChart";
import type { WeatherTrendPoint } from "../types/dashboard";

describe("WeatherTrendsChart", () => {
  const mockData: WeatherTrendPoint[] = [
    { time: "06:00", temperature: 18.0, soilMoisture: 34, soilTemperature: 20.7 },
    { time: "12:00", temperature: 28.0, soilMoisture: 30, soilTemperature: 23.1 },
  ];

  it("renderiza o gráfico de tendências climáticas", () => {
    render(<WeatherTrendsChart data={mockData} />);

    expect(screen.getByText("Temperatura do Ar e Umidade do Solo (24h)")).toBeInTheDocument();
    expect(screen.getByText("06:00")).toBeInTheDocument();
    expect(screen.getByText("12:00")).toBeInTheDocument();
  });

  it("exibe tooltip ao interagir com ponto de temperatura", () => {
    render(<WeatherTrendsChart data={mockData} />);

    const point = screen.getByLabelText("06:00: Temperatura 18°C");
    fireEvent.mouseEnter(point);

    expect(screen.getByText(/18°C ar | 34% umidade solo/)).toBeInTheDocument();

    fireEvent.mouseLeave(point);
    expect(screen.queryByText(/18°C ar | 34% umidade solo/)).not.toBeInTheDocument();
  });

  it("retorna null quando não há dados", () => {
    const { container } = render(<WeatherTrendsChart data={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
