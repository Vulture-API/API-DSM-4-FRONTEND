import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StationStatusBadge } from "./StationStatusBadge";

// SCRUM-590: apresentação do estado recebido por props, sem serviços ou hooks.
describe("StationStatusBadge", () => {
  it.each(["Online", "Offline", "Com alerta"] as const)("apresenta o status %s recebido por props", (status) => {
    render(<StationStatusBadge status={status} />);
    expect(screen.getByText(status)).toBeInTheDocument();
    expect(screen.queryByText(/pendente/)).not.toBeInTheDocument();
  });

  it.each([[1, "1 pendente"], [2, "2 pendentes"]])("formata %s alerta(s)", (alerts, text) => {
    render(<StationStatusBadge status="Com alerta" alerts={Number(alerts)} />);
    expect(screen.getByText(new RegExp(String(text)))).toBeInTheDocument();
  });

  it.each([undefined, 0, -1])("não exibe contagem inexistente ou não positiva: %s", (alerts) => {
    render(<StationStatusBadge status="Offline" alerts={alerts} />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(screen.queryByText(/pendente/)).not.toBeInTheDocument();
  });

  it("atualiza o status e remove a contagem anterior quando as props mudam", () => {
    const { rerender } = render(<StationStatusBadge status="Com alerta" alerts={2} />);
    expect(screen.getByText(/2 pendentes/)).toBeInTheDocument();
    rerender(<StationStatusBadge status="Online" />);
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.queryByText("Com alerta")).not.toBeInTheDocument();
    expect(screen.queryByText(/pendente/)).not.toBeInTheDocument();
    rerender(<StationStatusBadge status="Offline" />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(screen.queryByText("Online")).not.toBeInTheDocument();
  });
});
