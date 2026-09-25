import { describe, expect, it } from "vitest";

import { sensorOrder, sensorVisual } from "./sensor-visual";

describe("sensorVisual", () => {
  it.each(["Temperatura", "Umidade", "Velocidade do Vento", "Índice Pluviométrico", "Temperatura do Solo", "Umidade do Solo", "Pressão"])(
    "tem ícone e cor para %s",
    (name) => {
      const visual = sensorVisual(name);
      expect(visual.icon).toBeDefined();
      expect(visual.color).toMatch(/^#/);
    },
  );

  it("ordena ar antes de solo e desconhecidos no fim", () => {
    const names = ["Umidade do Solo", "Radiação", "Pressão", "Temperatura", "Umidade"];
    expect([...names].sort((a, b) => sensorOrder(a) - sensorOrder(b))).toEqual([
      "Temperatura",
      "Umidade",
      "Pressão",
      "Umidade do Solo",
      "Radiação",
    ]);
  });
});
