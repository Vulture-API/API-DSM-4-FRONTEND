import { describe, expect, it } from "vitest";

import { formatDate, formatDateTime, formatHour, formatNumber, formatRelative, initials } from "./format";

describe("format", () => {
  const now = new Date("2026-09-25T15:00:00Z");

  it.each([
    [null, "nunca"],
    ["2026-09-25T14:59:40Z", "agora"],
    ["2026-09-25T14:55:00Z", "há 5 min"],
    ["2026-09-25T12:00:00Z", "há 3 h"],
    ["2026-09-24T14:00:00Z", "há 1 dia"],
    ["2026-09-20T15:00:00Z", "há 5 dias"],
  ])("formatRelative(%s) = %s", (value, expected) => {
    expect(formatRelative(value, now)).toBe(expected);
  });

  it("formata datas no fuso de Brasília", () => {
    expect(formatHour(now)).toBe("12:00");
    expect(formatDateTime(now)).toBe("25/09 12:00");
    expect(formatDate(now)).toMatch(/25 de set\.? de 2026/);
  });

  it("formata números e iniciais", () => {
    expect(formatNumber(1013.456)).toBe("1.013,5");
    expect(initials("mariana albuquerque silva")).toBe("MA");
  });
});
