import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { UserPropertySelect } from "./UserPropertySelect";

describe("SCRUM-614: seleção de propriedades", () => {
  it("exibe vínculos existentes e permite incluir e remover", async () => {
    const change = vi.fn();
    render(<UserPropertySelect properties={[{ id: 1, name: "Fazenda A", location: null }, { id: 2, name: "Fazenda B", location: null }]} selected={[1]} onChange={change} loading={false} />);
    expect(screen.getByLabelText("Fazenda A")).toBeChecked();
    await userEvent.click(screen.getByLabelText("Fazenda B"));
    expect(change).toHaveBeenLastCalledWith([1, 2]);
    await userEvent.click(screen.getByLabelText("Fazenda A"));
    expect(change).toHaveBeenLastCalledWith([]);
  });
  it("representa carregamento, erro e ausência de propriedades", () => {
    const props = { properties: [], selected: [], onChange: vi.fn(), loading: true };
    const { rerender } = render(<UserPropertySelect {...props} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    rerender(<UserPropertySelect {...props} loading={false} error="Falha ao consultar" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Falha ao consultar");
    rerender(<UserPropertySelect {...props} loading={false} />);
    expect(screen.getByText("Nenhuma propriedade cadastrada.")).toBeInTheDocument();
  });
});
