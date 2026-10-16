import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ForecastCalendarCard, getWeatherVisual } from "./ForecastCalendarCard";
import { mockForecast } from "@/lib/api/mocks";

describe("ForecastCalendarCard", () => {
  it("renderiza o cabeçalho, as colunas dos 7 dias e os cards de recomendação", () => {
    render(
      <ForecastCalendarCard
        stationName="Estação Sede"
        propertyName="Fazenda Santa Rita"
        latitude={-23.1896}
        longitude={-45.8841}
        forecast={mockForecast}
      />,
    );

    // Badge de identificação da previsão
    expect(screen.getByText("Previsão Meteorológica")).toBeInTheDocument();
    expect(screen.getByText("Próximos 7 dias e condições operacionais")).toBeInTheDocument();

    // Título e subtítulo
    expect(
      screen.getByRole("heading", { name: "Previsão meteorológica — Estação Sede" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Fazenda Santa Rita/)).toBeInTheDocument();

    // 7 colunas de dias
    expect(screen.getByTestId("forecast-day-0")).toBeInTheDocument();
    expect(screen.getByTestId("forecast-day-6")).toBeInTheDocument();
    expect(screen.getByText("Hoje")).toBeInTheDocument();

    // Recomendações agrícolas do rodapé
    expect(screen.getByText("Janela de Pulverização (24h)")).toBeInTheDocument();
    expect(screen.getByText("Manejo de Irrigação (Pivô / Geral)")).toBeInTheDocument();
    expect(screen.getByText("Risco de Estresse Térmico")).toBeInTheDocument();
  });

  it("renderiza o estado skeleton quando isLoading é true", () => {
    render(<ForecastCalendarCard isLoading />);
    expect(screen.queryByText("Previsão meteorológica — Estação Sede")).not.toBeInTheDocument();
  });

  it("classifica corretamente as condições meteorológicas em getWeatherVisual", () => {
    expect(getWeatherVisual(95).label).toBe("Tempestade");
    expect(getWeatherVisual(63).label).toBe("Chuva forte");
    expect(getWeatherVisual(80).label).toBe("Pancadas isoladas");
    expect(getWeatherVisual(61).label).toBe("Chuva leve");
    expect(getWeatherVisual(3).label).toBe("Aumento de nuvens");
    expect(getWeatherVisual(2).label).toBe("Sol entre nuvens");
    expect(getWeatherVisual(1).label).toBe("Tempo firme");
    expect(getWeatherVisual(0).label).toBe("Sol predominante");
  });
});
