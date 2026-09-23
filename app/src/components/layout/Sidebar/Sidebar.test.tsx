import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Sidebar } from "./Sidebar";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

beforeEach(() => vi.mocked(usePathname).mockReturnValue("/administracao/usuarios"));

describe("Navegação administrativa", () => {
  it("agrupa as duas páginas existentes e mantém destinos futuros sem links", () => {
    render(<Sidebar />);
    const links = within(screen.getByRole("group", { name: "Administração" })).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Usuários", "Parâmetros meteorológicos"]);
    expect(screen.getAllByRole("link")).toHaveLength(2);
    for (const link of links) {
      expect(existsSync(resolve("src/app", `.${link.getAttribute("href")}/page.tsx`))).toBe(true);
    }
    expect(screen.getByText("Dashboard Climático")).toHaveAttribute("aria-disabled", "true");
  });

  it("acompanha a URL, mesmo quando a seção fornecida está desatualizada", () => {
    const { rerender } = render(<Sidebar section="users" />);
    expect(screen.getByRole("link", { name: "Usuários" })).toHaveAttribute("aria-current", "page");
    vi.mocked(usePathname).mockReturnValue("/administracao/parametros");
    rerender(<Sidebar section="users" />);
    expect(screen.getByRole("link", { name: "Parâmetros meteorológicos" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Usuários" })).not.toHaveAttribute("aria-current");
  });

  it("não marca Administração em uma URL sem relação com suas filhas", () => {
    vi.mocked(usePathname).mockReturnValue("/exemplo");
    render(<Sidebar />);
    for (const link of screen.getAllByRole("link")) expect(link).not.toHaveAttribute("aria-current");
  });
});
