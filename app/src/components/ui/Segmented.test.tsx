import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { Field, Input } from "./Field";
import { Segmented } from "./Segmented";

function Harness() {
  const [value, setValue] = useState<"a" | "b" | "c">("a");
  return (
    <>
      <button>antes</button>
      <Segmented
        label="Filtro"
        value={value}
        onChange={setValue}
        options={[
          { value: "a", label: "Todas", count: 3 },
          { value: "b", label: "Online" },
          { value: "c", label: "Offline" },
        ]}
      />
      <button>depois</button>
    </>
  );
}

describe("Segmented", () => {
  it("o Tab entra só na opção marcada e as setas trocam a seleção", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    screen.getByRole("button", { name: "antes" }).focus();
    await user.tab();
    expect(screen.getByRole("radio", { name: /Todas/ })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Online" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Online" })).toHaveAttribute("aria-checked", "true");

    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Offline" })).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{Home}");
    expect(screen.getByRole("radio", { name: /Todas/ })).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{End}");
    expect(screen.getByRole("radio", { name: "Offline" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "depois" })).toHaveFocus();
  });
});

describe("Field", () => {
  it("anuncia o erro e liga o texto ao campo", () => {
    render(<Field label="Nome" error="Informe o nome.">{(p) => <Input {...p} />}</Field>);

    const input = screen.getByLabelText("Nome");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Informe o nome.");
    expect(input).toHaveAccessibleDescription("Informe o nome.");
  });
});
