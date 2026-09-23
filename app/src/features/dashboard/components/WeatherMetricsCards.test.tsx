import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WeatherMetricsCards } from "./WeatherMetricsCards";
import type { WeatherOverview } from "../types/dashboard";

describe("WeatherMetricsCards", () => {
  const mockWeather: WeatherOverview = {
    avgTemperature: 24.8,
    minTemperature: 16.9,
    maxTemperature: 28.9,
    avgSoilMoisture: 31.4,
    avgAirHumidity: 63,
    accumulatedRainfall: 14.5,
    avgWindSpeed: 14.2,
    maxWindGust: 28.5,
    solarRadiation: 840,
    soilMoistureStatus: "adequate",
  };

  it("renderiza os cards com os valores e unidades climáticas", () => {
    render(<WeatherMetricsCards weather={mockWeather} />);

    expect(screen.getByText("Condições Climáticas Atuais")).toBeInTheDocument();
    expect(screen.getByText("24.8")).toBeInTheDocument();
    expect(screen.getByText("31")).toBeInTheDocument();
    expect(screen.getByText("63")).toBeInTheDocument();
    expect(screen.getByText("14.5")).toBeInTheDocument();
    expect(screen.getByText("14.2")).toBeInTheDocument();
    expect(screen.getByText("840")).toBeInTheDocument();
    expect(screen.getByText("Mín: 16.9°C")).toBeInTheDocument();
    expect(screen.getByText("Máx: 28.9°C")).toBeInTheDocument();
  });
});
