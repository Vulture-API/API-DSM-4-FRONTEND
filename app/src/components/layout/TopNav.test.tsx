import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { defaultRoutes, mockApi, renderWithProviders } from "@/test/utils";

import { activeItem } from "./nav";
import { TopNav } from "./TopNav";

vi.mock("next/navigation", () => ({ usePathname: () => "/alertas/regras" }));

describe("TopNav", () => {
  beforeEach(() => {
    mockApi(defaultRoutes());
  });

  it("mostra os grupos e marca o grupo da página atual", () => {
    renderWithProviders(<TopNav />);
    const nav = screen.getByRole("navigation", { name: "Navegação principal" });

    expect(within(nav).getAllByRole("button").map((b) => b.textContent)).toEqual([
      "Monitoramento",
      "Alertas",
      "Administração",
    ]);
  });

  it("abre o mega-menu ao passar o mouse e fecha ao sair", async () => {
    vi.useFakeTimers();
    renderWithProviders(<TopNav />);
    const trigger = screen.getByRole("button", { name: "Alertas" });

    fireEvent.mouseEnter(trigger.parentElement!);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const current = screen.getByRole("link", { name: /Regras de alerta/ });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Alertas disparados/ })).not.toHaveAttribute("aria-current");

    fireEvent.mouseLeave(trigger.parentElement!);
    act(() => vi.advanceTimersByTime(200));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    vi.useRealTimers();
  });

  it("abre por teclado, navega com setas e fecha com Esc", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TopNav />);
    const trigger = screen.getByRole("button", { name: "Administração" });

    trigger.focus();
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(screen.getByRole("link", { name: /Usuários/ })).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("link", { name: /Parâmetros/ })).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("link", { name: /Usuários/ })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("fecha quando o foco sai do menu com Tab", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TopNav />);
    const trigger = screen.getByRole("button", { name: "Administração" });

    trigger.focus();
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(screen.getByRole("link", { name: /Usuários/ })).toHaveFocus());
    await user.tab();
    expect(screen.getByRole("link", { name: /Parâmetros/ })).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.tab();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("o clique que vem depois do hover não fecha; os seguintes alternam", () => {
    renderWithProviders(<TopNav />);
    const trigger = screen.getByRole("button", { name: "Monitoramento" });

    fireEvent.mouseEnter(trigger.parentElement!);
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("fecha ao clicar fora", () => {
    renderWithProviders(<TopNav />);
    const trigger = screen.getByRole("button", { name: "Alertas" });

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.pointerDown(document.body);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("mostra o total de alertas pendentes no sino", async () => {
    renderWithProviders(<TopNav />);
    expect(await screen.findByRole("link", { name: "2 alertas pendentes" })).toHaveTextContent("2");
  });

  it("abre e fecha o menu de celular", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TopNav />);

    const toggle = screen.getByRole("button", { name: "Abrir menu" });
    expect(toggle).toHaveAttribute("aria-controls", "menu-mobile");
    await user.click(toggle);
    const mobile = screen.getByRole("navigation", { name: "Menu" });
    expect(within(mobile).getAllByRole("link")).toHaveLength(6);
    await user.click(within(mobile).getByRole("link", { name: "Usuários" }));
    expect(screen.queryByRole("navigation", { name: "Menu" })).not.toBeInTheDocument();
  });
});

describe("activeItem", () => {
  it("escolhe a rota mais específica", () => {
    expect(activeItem("/alertas/regras")?.label).toBe("Regras de alerta");
    expect(activeItem("/alertas")?.label).toBe("Alertas disparados");
    expect(activeItem("/estacoes/12")?.label).toBe("Estações");
    expect(activeItem("/nada")).toBeUndefined();
  });
});
