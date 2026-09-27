import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import L from "leaflet";
import { describe, expect, it, vi } from "vitest";

import { overview } from "@/test/fixtures";

import { hasLocation, markerDot, StationsMap } from "./StationsMap";

describe("StationsMap", () => {
  it("põe um pino por estação com coordenadas, com nome e status acessíveis", () => {
    render(<StationsMap stations={overview.stations} />);

    expect(screen.getByRole("region", { name: "Mapa das estações" })).toBeInTheDocument();
    const pin = screen.getByTitle("Estação Sede: Online");
    expect(pin).toHaveAttribute("role", "button");
    expect(pin).toHaveAttribute("aria-label", "Estação Sede: Online");
    expect(pin).toHaveAttribute("tabindex", "0");
    // Estações sem latitude/longitude não viram pino.
    expect(screen.queryByTitle(/Estação Pivô/)).not.toBeInTheDocument();
    expect(screen.getByText("Com alerta")).toBeInTheDocument(); // legenda
  });

  it("abre o resumo da estação no pino e leva o foco para o link", async () => {
    render(<StationsMap stations={overview.stations} />);

    fireEvent.click(screen.getByTitle("Estação Sede: Online"));
    const link = await screen.findByRole("link", { name: /Abrir estação/ });
    expect(link).toHaveAttribute("href", "/estacoes/1");
    expect(screen.getByText("24 °C · 60 %")).toBeInTheDocument();
    await waitFor(() => expect(link).toHaveFocus());
  });

  it("enquadra as estações uma vez e não reenquadra com os mesmos pontos", () => {
    const fit = vi.spyOn(L.Map.prototype, "fitBounds");
    const located = overview.stations.map((s, i) => ({ ...s, latitude: -23.1 - i / 100, longitude: -45.8 }));
    const { rerender } = render(<StationsMap stations={located} />);
    expect(fit).toHaveBeenCalledTimes(1);

    rerender(<StationsMap stations={located.map((s) => ({ ...s }))} />);
    expect(fit).toHaveBeenCalledTimes(1);
    fit.mockRestore();
  });

  it("aceita rótulo próprio e destaca a estação selecionada", () => {
    render(<StationsMap stations={[overview.stations[0]!]} selectedId={1} label="Localização da Sede" />);
    expect(screen.getByRole("region", { name: "Localização da Sede" })).toBeInTheDocument();
    expect(screen.getByTitle("Estação Sede: Online").innerHTML).toContain("width:22px");
  });
});

describe("markerDot", () => {
  it("diferencia o status também pela forma, não só pela cor", () => {
    expect(markerDot("Online", 16)).toContain("station-ping");
    expect(markerDot("Com alerta", 16)).toContain(">!<");
    expect(markerDot("Offline", 16)).toContain("background:#fff");
  });
});

describe("hasLocation", () => {
  it("exige latitude e longitude", () => {
    expect(overview.stations.filter(hasLocation).map((s) => s.id)).toEqual([1]);
  });
});
