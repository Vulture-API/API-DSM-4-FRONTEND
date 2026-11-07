import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LoginPage } from "./LoginPage";

describe("tela de login", () => {
  it("apresenta identidade visual, campos acessíveis e orientação de acesso", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: "Bem-vindo de volta" })).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("Senha")).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByText("Entre em contato com o administrador.")).toBeInTheDocument();
  });

  it("valida e-mail e senha antes de enviar", async () => {
    const user = userEvent.setup();
    const login = vi.fn();
    render(<LoginPage onLogin={login} />);
    await user.click(screen.getByRole("button", { name: "Entrar na plataforma" }));
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Senha")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Informe um e-mail válido.")).toBeInTheDocument();
    expect(screen.getByText("Informe sua senha.")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("mostra e oculta a senha sem enviar o formulário", async () => {
    const user = userEvent.setup();
    const login = vi.fn();
    render(<LoginPage onLogin={login} />);
    const password = screen.getByLabelText("Senha");
    await user.type(password, "minha-senha");
    await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(password).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Ocultar senha" }));
    expect(password).toHaveAttribute("type", "password");
    expect(login).not.toHaveBeenCalled();
  });

  it("normaliza o e-mail, preserva a senha e bloqueia reenvio enquanto aguarda", async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    const login = vi.fn(() => new Promise<void>((done) => { finish = done; }));
    render(<LoginPage onLogin={login} />);
    await user.type(screen.getByLabelText("E-mail"), "ADMIN@EXEMPLO.COM");
    await user.type(screen.getByLabelText("Senha"), " senha ");
    await user.dblClick(screen.getByRole("button", { name: "Entrar na plataforma" }));
    expect(login).toHaveBeenCalledExactlyOnceWith({ email: "admin@exemplo.com", password: " senha " });
    expect(screen.getByRole("button", { name: "Entrando…" })).toBeDisabled();
    expect(screen.getByLabelText("E-mail")).toBeDisabled();
    await act(async () => finish());
    await waitFor(() => expect(screen.getByRole("button", { name: "Entrar na plataforma" })).toBeEnabled());
  });

  it("mostra o erro da autenticação e permite nova tentativa", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValueOnce(new Error("E-mail ou senha inválidos.")).mockResolvedValue(undefined);
    render(<LoginPage onLogin={login} />);
    await user.type(screen.getByLabelText("E-mail"), "pessoa@exemplo.com");
    await user.type(screen.getByLabelText("Senha"), "senha");
    await user.click(screen.getByRole("button", { name: "Entrar na plataforma" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha inválidos.");
    await user.click(screen.getByRole("button", { name: "Entrar na plataforma" }));
    await waitFor(() => expect(login).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("não simula uma sessão antes de a integração ser configurada", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByLabelText("E-mail"), "pessoa@exemplo.com");
    await user.type(screen.getByLabelText("Senha"), "senha");
    await user.click(screen.getByRole("button", { name: "Entrar na plataforma" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("O acesso à plataforma ainda não está disponível.");
  });
});
