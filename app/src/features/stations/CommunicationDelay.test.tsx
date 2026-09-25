import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { communicationDelay, LastCommunication } from "./CommunicationDelay";

const now = new Date("2026-09-25T12:00:00Z");
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

describe("communicationDelay", () => {
  it("não alerta dentro do limite de 1 hora", () => {
    expect(communicationDelay(ago(5), now)).toBeNull();
    expect(communicationDelay(ago(60), now)).toBeNull();
  });

  it("descreve o atraso em horas e minutos", () => {
    expect(communicationDelay(ago(61), now)).toBe("Sem comunicação há 1 h e 1 min");
    expect(communicationDelay(ago(180), now)).toBe("Sem comunicação há 3 h");
    expect(communicationDelay(ago(3 * 24 * 60), now)).toBe("Sem comunicação há 3 dias");
  });

  it("avisa quando a estação nunca comunicou", () => {
    expect(communicationDelay(null, now)).toBe("Sem registro de comunicação");
  });
});

describe("LastCommunication", () => {
  it("mostra só o tempo relativo quando está em dia", () => {
    render(<LastCommunication lastCommunicationAt={new Date().toISOString()} />);
    expect(screen.getByText("agora")).toBeInTheDocument();
  });

  it("mostra o alerta quando passou do limite", () => {
    render(<LastCommunication lastCommunicationAt={new Date(Date.now() - 300 * 60_000).toISOString()} />);
    expect(screen.getByText("Sem comunicação há 5 h")).toHaveClass("text-danger");
  });
});
