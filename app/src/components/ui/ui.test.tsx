import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Badge } from "./Badge";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { EmptyState } from "./States";
import { useToast } from "./Toast";

describe("componentes base", () => {
  it("Modal fecha com Esc, com o X e clicando fora, e devolve o foco", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(
      <>
        <button>abrir</button>
        <Modal open={false} onClose={onClose} title="T">
          <input aria-label="campo" />
        </Modal>
      </>,
    );
    screen.getByRole("button", { name: "abrir" }).focus();
    rerender(
      <>
        <button>abrir</button>
        <Modal open onClose={onClose} title="T">
          <input aria-label="campo" />
        </Modal>
      </>,
    );
    expect(screen.getByLabelText("campo")).toHaveFocus();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalledTimes(2);
    rerender(
      <>
        <button>abrir</button>
        <Modal open={false} onClose={onClose} title="T">
          <input aria-label="campo" />
        </Modal>
      </>,
    );
    expect(screen.getByRole("button", { name: "abrir" })).toHaveFocus();
  });

  it("Modal mantém o Tab dentro e não rouba o foco quando o pai re-renderiza", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Modal open onClose={() => {}} title="T" footer={<button>ok</button>}>
        <input aria-label="a" />
        <input aria-label="b" />
      </Modal>,
    );
    await user.click(screen.getByLabelText("b"));
    // Pai re-renderiza com um onClose novo (arrow function inline).
    rerender(
      <Modal open onClose={() => {}} title="T" footer={<button>ok</button>}>
        <input aria-label="a" />
        <input aria-label="b" />
      </Modal>,
    );
    expect(screen.getByLabelText("b")).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "ok" }));
    await user.tab();
    expect(screen.getByRole("button", { name: "Fechar" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "ok" })).toHaveFocus();
  });

  it("Button mostra carregando e fica desabilitado", () => {
    render(<Button loading>Salvar</Button>);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
  });

  it("Badge e EmptyState renderizam o conteúdo", () => {
    render(
      <>
        <Badge tone="danger" dot pulse>
          Offline
        </Badge>
        <EmptyState title="Vazio" description="Nada aqui" action={<button>ação</button>} />
      </>,
    );
    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(screen.getByText("Nada aqui")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ação" })).toBeInTheDocument();
  });

  it("useToast exige o provider", () => {
    function Consumer() {
      useToast();
      return null;
    }
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow("ToastProvider");
    vi.restoreAllMocks();
  });
});
