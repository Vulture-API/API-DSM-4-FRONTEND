import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LastUpdate } from "./LastUpdate";
import { formatLastUpdate } from "./last-update";

describe("formatLastUpdate", () => {
  it.each([
    ["2026-11-10T12:34:00Z", "10/11 09:34"],
    ["2026-11-10T01:05:00Z", "09/11 22:05"],
    ["2026-01-01T02:59:00Z", "31/12 23:59"],
    ["2024-02-29T03:00:00Z", "29/02 00:00"],
    ["2026-11-10T09:34:00-03:00", "10/11 09:34"],
    ["1970-01-01T00:00:00Z", "31/12 21:00"],
  ])("formata %s no fuso de São Paulo", (input, expected) => {
    expect(formatLastUpdate(input)).toBe(expected);
  });

  it.each([null, undefined, "", "inválido", "2026-99-99T00:00:00Z"])("trata valor ausente ou inválido %s", (value) => {
    expect(formatLastUpdate(value)).toBeNull();
  });
});

describe("LastUpdate", () => {
  it("exibe data, hora e identificação da estação recebidas por props", () => {
    render(<LastUpdate lastUpdate="2026-11-10T12:34:00Z" stationName="Estação Sede" />);
    const label = screen.getByLabelText("Última atualização de Estação Sede");
    expect(label).toHaveTextContent("Última atualização: 10/11 09:34");
    expect(label.querySelector("time")).toHaveAttribute("datetime", "2026-11-10T12:34:00.000Z");
  });

  it.each([null, undefined, "", "não é data"])("apresenta fallback para %s sem elemento time inválido", (value) => {
    const { container } = render(<LastUpdate lastUpdate={value} stationName="Estação Sede" />);
    expect(screen.getByText("Última atualização indisponível")).toBeInTheDocument();
    expect(container.querySelector("time")).toBeNull();
  });

  it("atualiza a apresentação e a identificação quando as props mudam", () => {
    const { rerender } = render(<LastUpdate lastUpdate={null} stationName="Estação A" />);
    rerender(<LastUpdate lastUpdate="2026-11-10T12:34:00Z" stationName="Estação B" />);
    expect(screen.queryByLabelText("Última atualização de Estação A")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Última atualização de Estação B")).toHaveTextContent("10/11 09:34");
    rerender(<LastUpdate lastUpdate="2026-11-10T13:40:00Z" stationName="Estação B" />);
    expect(screen.getByLabelText("Última atualização de Estação B")).toHaveTextContent("10/11 10:40");
    rerender(<LastUpdate lastUpdate="inválido" stationName="Estação B" />);
    expect(screen.getByLabelText("Última atualização de Estação B")).toHaveTextContent("Última atualização indisponível");
  });
});
