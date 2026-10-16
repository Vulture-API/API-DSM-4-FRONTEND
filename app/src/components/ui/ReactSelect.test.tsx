import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReactSelect } from "./ReactSelect";

describe("ReactSelect", () => {
  const options = [
    { value: "all", label: "Todas as opções" },
    { value: "1", label: "Opção 1", sublabel: "Subtítulo 1", badge: "Ativo" },
    { value: "2", label: "Opção 2", sublabel: "Sem badge" },
  ];

  it("renderiza corretamente com o valor selecionado e variant default", () => {
    render(
      <ReactSelect
        id="test-select"
        label="Meu Select"
        value="1"
        onChange={vi.fn()}
        options={options}
      />,
    );

    expect(screen.getByLabelText("Meu Select")).toBeInTheDocument();
  });

  it("permite selecionar opção pelo select acessível", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <ReactSelect
        id="test-select"
        label="Meu Select"
        value="all"
        onChange={handleChange}
        options={options}
      />,
    );

    const selectEl = screen.getByLabelText("Meu Select");
    await user.selectOptions(selectEl, "2");

    expect(handleChange).toHaveBeenCalledWith("2");
  });

  it("renderiza com variant glass e opções numéricas", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const numOptions = [
      { value: 10, label: "Número 10" },
      { value: 20, label: "Número 20" },
    ];

    render(
      <ReactSelect
        id="num-select"
        label="Número"
        value={10}
        variant="glass"
        onChange={handleChange}
        options={numOptions}
      />,
    );

    const selectEl = screen.getByLabelText("Número");
    await user.selectOptions(selectEl, "20");
    expect(handleChange).toHaveBeenCalledWith(20);
  });

  it("renderiza em estado desabilitado", () => {
    render(
      <ReactSelect
        id="disabled-select"
        label="Desabilitado"
        value="all"
        isDisabled
        onChange={vi.fn()}
        options={options}
      />,
    );

    expect(screen.getByLabelText("Desabilitado")).toBeDisabled();
  });
});
