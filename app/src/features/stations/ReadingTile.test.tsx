import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CurrentReading } from "./api";
import { ReadingTile } from "./ReadingTile";

const now = Date.parse("2026-11-10T12:00:00Z");
const reading: CurrentReading = {
  sensor_id: 10, local_identifier: "temp", sensor_type_id: 1,
  sensor_type: "Temperatura", unit_of_measure: "°C", value: 24.5,
  unix_time: now / 1000 - 300,
};

describe("ReadingTile", () => {
  it.each([0, -5, 24.5])("mostra o valor %s em pt-BR, unidade e identificação do sensor", (value) => {
    render(<ReadingTile reading={{ ...reading, value }} now={now} />);
    expect(screen.getByText(new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value))).toHaveTextContent("°C");
    expect(screen.getByText("Temperatura")).toBeInTheDocument();
    expect(screen.getByText("temp")).toBeInTheDocument();
    expect(screen.getByText("há 5 min")).toHaveAttribute("title", "10/11 08:55");
  });

  it.each([null, NaN, Infinity, -Infinity])("mostra ausência de leitura para %s sem exibir unidade", (value) => {
    render(<ReadingTile reading={{ ...reading, value, unix_time: null }} now={now} />);
    expect(screen.getByText("Sem leitura")).toBeInTheDocument();
    expect(screen.getByText("Aguardando medição")).toBeInTheDocument();
    expect(screen.queryByText("°C")).not.toBeInTheDocument();
  });

  it.each([NaN, Infinity, 8_640_000_000_001])("trata timestamp inválido %s sem falhar", (unix_time) => {
    render(<ReadingTile reading={{ ...reading, unix_time }} now={now} />);
    expect(screen.getByText("Aguardando medição")).toBeInTheDocument();
  });

  it.each([[1800, false], [1801, true]])("marca leitura antiga após %s segundos", (seconds, old) => {
    render(<ReadingTile reading={{ ...reading, unix_time: now / 1000 - seconds }} now={now} />);
    expect(Boolean(screen.queryByText(/Leitura antiga/))).toBe(old);
  });
});
