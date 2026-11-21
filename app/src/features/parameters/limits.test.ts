import { describe, expect, it } from "vitest";

import { limitsErrors, limitsText } from "./limits";

// SCRUM-637: limites físicos do tipo de sensor.
describe("limitsText", () => {
  it.each([
    [{ min_value: 0, max_value: 100 }, "%", "0 a 100 %"],
    [{ min_value: 0, max_value: null }, "mm", "mínimo 0 mm"],
    [{ min_value: null, max_value: 60.5 }, "°C", "máximo 60,5 °C"],
    [{}, "hPa", "Sem limites"],
    [{ min_value: -40, max_value: 80 }, "", "-40 a 80"],
  ])("mostra %o em %s como %s", (limits, unit, text) => {
    expect(limitsText(limits, unit)).toBe(text);
  });
});

describe("limitsErrors", () => {
  it("aceita campos vazios, só um lado e mínimo igual ao máximo", () => {
    expect(limitsErrors("", "")).toEqual({});
    expect(limitsErrors("0", "")).toEqual({});
    expect(limitsErrors("", "100")).toEqual({});
    expect(limitsErrors("5", "5")).toEqual({});
    expect(limitsErrors("-0,5", "1.5")).toEqual({});
  });

  it("recusa número inválido", () => {
    expect(limitsErrors("x", "")).toEqual({ min_value: "Número inválido." });
    expect(limitsErrors("", "1,2,3")).toEqual({
      max_value: "Número inválido.",
    });
  });

  it("recusa mínimo maior que o máximo", () => {
    expect(limitsErrors("100", "0")).toEqual({
      min_value: "O mínimo não pode ser maior que o máximo.",
    });
  });
});
