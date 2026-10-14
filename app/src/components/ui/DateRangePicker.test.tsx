import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DateRangePicker } from "./DateRangePicker";

function ControlledPicker({ onChange }: { onChange?: (s: string, e: string) => void }) {
  const [start, setStart] = useState("06/10/2026");
  const [end, setEnd] = useState("13/10/2026");
  return (
    <DateRangePicker
      startDate={start}
      endDate={end}
      onChange={(s, e) => {
        setStart(s);
        setEnd(e);
        onChange?.(s, e);
      }}
    />
  );
}

describe("DateRangePicker", () => {
  it("renderiza o botão com o intervalo selecionado e inputs acessíveis", () => {
    render(
      <ControlledPicker />
    );

    expect(screen.getByText(/06\/10\/2026 — 13\/10\/2026/)).toBeInTheDocument();
    expect(screen.getByLabelText("Data inicial")).toBeInTheDocument();
    expect(screen.getByLabelText("Data final")).toBeInTheDocument();
  });

  it("permite alterar datas diretamente pelos inputs acessíveis", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <ControlledPicker onChange={handleChange} />
    );

    const startInput = screen.getByLabelText("Data inicial");
    await user.clear(startInput);
    await user.type(startInput, "01/10/2026");

    expect(handleChange).toHaveBeenCalledWith("01/10/2026", "13/10/2026");
  });

  it("abre o popover, navega pelos meses e usa atalhos de período", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <ControlledPicker onChange={handleChange} />
    );

    // Clica no botão para abrir o popover
    await user.click(screen.getByText(/06\/10\/2026 — 13\/10\/2026/));

    expect(screen.getByRole("dialog", { name: "Selecionar período" })).toBeInTheDocument();

    // Navega meses
    await user.click(screen.getByLabelText("Mês anterior"));
    await user.click(screen.getByLabelText("Próximo mês"));

    // Clica no atalho 7 dias
    await user.click(screen.getByRole("button", { name: "7 dias" }));
    expect(handleChange).toHaveBeenCalled();
  });

  it("permite selecionar dois dias no grid para formar um novo intervalo", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <ControlledPicker onChange={handleChange} />
    );

    await user.click(screen.getByText(/06\/10\/2026 — 13\/10\/2026/));

    // Clica no dia 10 e depois no dia 20
    const day10Buttons = screen.getAllByRole("button", { name: "10" });
    await user.click(day10Buttons[0]!);

    const day20Buttons = screen.getAllByRole("button", { name: "20" });
    await user.click(day20Buttons[0]!);

    expect(handleChange).toHaveBeenCalled();
  });

  it("fecha o popover ao clicar em Fechar", async () => {
    const user = userEvent.setup();

    render(
      <ControlledPicker />
    );

    await user.click(screen.getByText(/06\/10\/2026 — 13\/10\/2026/));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
