import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RainfallChart } from "./RainfallChart";
import type { RainfallPoint } from "../types/dashboard";

describe("RainfallChart", () => {
  const mockData: RainfallPoint[] = [
    { label: "Seg", amountMm: 5.0 },
    { label: "Ter", amountMm: 12.0 },
  ];

  it("renderiza o gráfico de precipitação e o total acumulado", () => {
    render(<RainfallChart data={mockData} />);

    expect(screen.getByText("Precipitação Pluviométrica Acumulada")).toBeInTheDocument();
    expect(screen.getByText("Total acumulado: 17.0 mm")).toBeInTheDocument();
    expect(screen.getByText("Seg")).toBeInTheDocument();
    expect(screen.getByText("Ter")).toBeInTheDocument();
  });

  it("exibe tooltip ao passar o mouse sobre a barra", () => {
    render(<RainfallChart data={mockData} />);

    const bar = screen.getByLabelText("Seg: 5.0 mm");
    fireEvent.mouseEnter(bar);

    expect(screen.getByText("Seg: 5.0 mm")).toBeInTheDocument();

    fireEvent.mouseLeave(bar);
    expect(screen.queryByText("Seg: 5.0 mm")).not.toBeInTheDocument();
  });

  it("retorna null quando a lista está vazia", () => {
    const { container } = render(<RainfallChart data={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
