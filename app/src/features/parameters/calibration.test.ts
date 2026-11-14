import { describe, expect, it } from "vitest";

import {
  calibrationParts,
  calibrationText,
  convertReading,
  effectiveCalibration,
  multiplierError,
  offsetError,
  parseCalibration,
} from "./calibration";

describe("parseCalibration", () => {
  it.each([
    ["", null],
    ["   ", null],
    ["2", 2],
    ["0,5", 0.5],
    ["0.5", 0.5],
    [" -12,5 ", -12.5],
    ["+3", 3],
    [",5", 0.5],
    ["0,000805860805", 0.000805860805],
  ])("lê %j como %j", (text, expected) => {
    expect(parseCalibration(text)).toBe(expected);
  });

  it.each(["x", "1,2,3", "1e3", "--1", "1 2", ",", "Infinity"])("devolve NaN para %j", (text) => {
    expect(parseCalibration(text)).toBeNaN();
  });
});

describe("multiplierError", () => {
  it.each(["", "1", "-2", "0,0008"])("aceita %j", (text) => {
    expect(multiplierError(text)).toBeUndefined();
  });

  it.each(["0", "0,0", "-0"])("recusa zero em %j", (text) => {
    expect(multiplierError(text)).toBe("Não pode ser zero.");
  });

  it("recusa texto que não é número", () => {
    expect(multiplierError("abc")).toBe("Número inválido.");
  });
});

describe("offsetError", () => {
  it.each(["", "0", "-12,5", "3"])("aceita %j", (text) => {
    expect(offsetError(text)).toBeUndefined();
  });

  it("recusa texto que não é número", () => {
    expect(offsetError("dois")).toBe("Número inválido.");
  });
});

describe("calibrationText", () => {
  it("mostra vazio para ausente e vírgula decimal para número", () => {
    expect(calibrationText(null)).toBe("");
    expect(calibrationText(undefined)).toBe("");
    expect(calibrationText(0.5)).toBe("0,5");
    expect(calibrationText(-2)).toBe("-2");
  });
});

describe("effectiveCalibration", () => {
  const type = { factor: 3.6, gain: 2, offset_value: 1 };

  it("usa a calibração do tipo quando o sensor não tem", () => {
    expect(effectiveCalibration({}, type)).toEqual({ factor: 3.6, gain: 2, offset_value: 1, fromSensor: false });
    expect(effectiveCalibration({ gain: null, offset_value: null }, type).fromSensor).toBe(false);
  });

  it("ganho e offset do sensor valem no lugar dos do tipo, e o fator continua", () => {
    expect(effectiveCalibration({ gain: 0.5 }, type)).toEqual({ factor: 3.6, gain: 0.5, offset_value: 1, fromSensor: true });
    expect(effectiveCalibration({ offset_value: 0 }, type)).toEqual({ factor: 3.6, gain: 2, offset_value: 0, fromSensor: true });
  });

  it("fica sem calibração quando nem sensor nem tipo têm", () => {
    expect(effectiveCalibration({}, undefined)).toEqual({ factor: null, gain: null, offset_value: null, fromSensor: false });
    expect(effectiveCalibration({}, { factor: null, gain: null })).toMatchObject({ factor: null, gain: null, offset_value: null });
  });
});

describe("calibrationParts", () => {
  it("lista só os campos preenchidos, na ordem da conta", () => {
    expect(calibrationParts({ factor: 1.5, gain: 2, offset_value: -3 })).toEqual(["fator 1,5", "ganho 2", "offset -3"]);
    expect(calibrationParts({ factor: null, gain: 0.5 })).toEqual(["ganho 0,5"]);
    expect(calibrationParts({ offset_value: 0 })).toEqual(["offset 0"]);
    expect(calibrationParts({})).toEqual([]);
  });

  it("não arredonda um ganho com muitas casas", () => {
    expect(calibrationParts({ gain: 0.000805860805 })).toEqual(["ganho 0,000805860805"]);
  });
});

describe("convertReading", () => {
  it("calcula leitura × fator × ganho + offset", () => {
    expect(convertReading(10, { factor: 3.6, gain: 0.5, offset_value: -2 })).toBe(16);
  });

  it("não altera a leitura sem calibração", () => {
    expect(convertReading(23.4, {})).toBe(23.4);
    expect(convertReading(23.4, { factor: null, gain: null, offset_value: null })).toBe(23.4);
  });
});
