import { describe, expect, it } from "vitest";

import { availableChannels, BOARD_CHANNELS, channelHint, channelLabel, findChannel } from "./board-channels";

describe("canais da placa", () => {
  it("lista os canais que o firmware envia", () => {
    expect(BOARD_CHANNELS.map((c) => c.id)).toEqual([
      "temp", "umid",
      "an34", "an35", "an36", "an39",
      "pu34", "pu35", "pu36", "pu39",
      "pu4", "pu5", "pu12", "pu13", "pu14", "pu15", "pu16", "pu17", "pu18", "pu19", "pu21", "pu22", "pu23", "pu26", "pu27",
      "pu32", "pu33",
    ]);
  });

  it("acha o canal sem diferenciar maiúsculas nem espaços", () => {
    expect(findChannel(" PU26 ")?.kind).toBe("pulse");
    expect(findChannel("an34")?.pin).toBe(34);
    expect(findChannel("lux")).toBeUndefined();
    expect(findChannel("")).toBeUndefined();
  });

  it("não oferece canal já usado por outro sensor da estação", () => {
    const ids = availableChannels(["temp", "AN34", "lux"]).map((c) => c.id);
    expect(ids).not.toContain("temp");
    expect(ids).not.toContain("an34");
    expect(ids).toContain("umid");
    expect(ids).toHaveLength(25);
  });

  it("na edição mantém o canal do próprio sensor", () => {
    const ids = availableChannels(["temp", "pu26"], "PU26").map((c) => c.id);
    expect(ids).toContain("pu26");
    expect(ids).not.toContain("temp");
  });

  it("descreve o canal e a calibração conforme o tipo", () => {
    expect(channelLabel(findChannel("pu26")!)).toBe("pu26 · Pulsos GPIO26");
    expect(channelLabel(findChannel("pu35")!)).toBe("pu35 · Pulsos GPIO35");
    expect(channelLabel(findChannel("temp")!)).toBe("temp · DHT22");
    expect(channelHint(findChannel("pu26")!)).toContain("pluviômetro de 0,2 mm → 0,2");
    expect(channelHint(findChannel("an39")!)).toContain("0 a 4095");
    expect(channelHint(findChannel("an39")!)).toContain("0,000805860805");
    expect(findChannel("di18")).toBeUndefined();
    expect(channelHint(findChannel("temp")!)).toContain("Já chega na unidade");
  });
});
