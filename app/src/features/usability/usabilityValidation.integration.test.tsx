import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/layout/AppShell";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { AlertsPage } from "@/features/alerts/AlertsPage";
import { RulesPage } from "@/features/alerts/RulesPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { HistoryPage } from "@/features/history/HistoryPage";
import { ParametersPage } from "@/features/parameters/ParametersPage";
import { PropertiesPage } from "@/features/properties/PropertiesPage";
import { ReportsPage } from "@/features/reports/ReportsPage";
import { RolesPage } from "@/features/roles/RolesPage";
import { StationDetailPage } from "@/features/stations/StationDetailPage";
import { StationsPage } from "@/features/stations/StationsPage";
import { UsersPage } from "@/features/users/UsersPage";
import { defaultRoutes, mockApi, renderWithProviders } from "@/test/utils";

const navigationState = vi.hoisted(() => ({
  path: "/dashboard",
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.path,
  useRouter: () => ({
    replace: navigationState.replace,
    refresh: navigationState.refresh,
  }),
}));

function ModalAndToastHarness() {
  const [open, setOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const toast = useToast();

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir diálogo
      </button>
      <button type="button" onClick={() => setConfirmOpen(true)}>
        Solicitar exclusão
      </button>
      <button
        type="button"
        onClick={() => toast.success("Operação concluída com sucesso.")}
      >
        Notificar sucesso
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Edição rápida"
        description="Ajuste os dados abaixo."
      >
        <div className="space-y-3">
          <Input aria-label="Nome do item" defaultValue="Estação Central" />
          <button type="button" onClick={() => setOpen(false)}>
            Confirmar edição
          </button>
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmOpen}
        title="Excluir registro"
        message="Tem certeza que deseja excluir este item?"
        onConfirm={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

import * as React from "react";

describe("Validação de usabilidade das principais interfaces (SCRUM-545 / RNF07)", () => {
  beforeEach(() => {
    navigationState.path = "/dashboard";
    navigationState.replace.mockReset();
    navigationState.refresh.mockReset();
    window.URL.createObjectURL = vi.fn(
      () => "blob:https://agritech.local/export",
    );
    window.URL.revokeObjectURL = vi.fn();
  });

  it("valida estrutura semântica, atalho de salto e navegação por teclado no AppShell e TopNav", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());

    renderWithProviders(
      <AppShell>
        <DashboardPage />
      </AppShell>,
    );

    const skipLink = screen.getByRole("link", {
      name: "Pular para o conteúdo",
    });
    expect(skipLink).toHaveAttribute("href", "#conteudo");

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "conteudo");
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    const alertsTrigger = within(nav).getByRole("button", { name: "Alertas" });
    expect(alertsTrigger).toHaveAttribute("aria-expanded", "false");

    alertsTrigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(alertsTrigger).toHaveAttribute("aria-expanded", "true");
    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: /Alertas disparados/ }),
      ).toHaveFocus(),
    );

    await user.keyboard("{Escape}");
    expect(alertsTrigger).toHaveAttribute("aria-expanded", "false");
    expect(alertsTrigger).toHaveFocus();

    const mobileToggle = screen.getByRole("button", { name: "Abrir menu" });
    expect(mobileToggle).toHaveAttribute("aria-expanded", "false");
    await user.click(mobileToggle);
    expect(screen.getByRole("button", { name: "Fechar menu" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    const mobileNav = screen.getByRole("navigation", { name: "Menu" });
    expect(
      within(mobileNav).getByRole("link", { name: "Dashboard" }),
    ).toHaveAttribute("aria-current", "page");

    const banner = screen.getByRole("banner");
    expect(
      within(banner).getByRole("link", { name: /alertas pendentes/i }),
    ).toBeInTheDocument();
    expect(
      within(banner).getByRole("button", { name: "Sair da conta" }),
    ).toBeInTheDocument();
  });

  it("valida usabilidade do formulário de login com validação inline, visibilidade de senha e feedback de erro", async () => {
    const user = userEvent.setup();
    const onLogin = vi
      .fn()
      .mockRejectedValueOnce(new Error("Credenciais inválidas."));

    render(<LoginPage onLogin={onLogin} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Bem-vindo de volta" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: "Entrar no Portal Climático" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Entrar/i }));

    const emailInput = screen.getByLabelText("E-mail");
    const passwordInput = screen.getByLabelText("Senha");
    expect(emailInput).toHaveAttribute("aria-invalid", "true");
    expect(passwordInput).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Informe um e-mail válido.")).toHaveAttribute(
      "role",
      "alert",
    );
    expect(screen.getByText("Informe sua senha.")).toHaveAttribute(
      "role",
      "alert",
    );

    const togglePassword = screen.getByRole("button", {
      name: "Mostrar senha",
    });
    expect(togglePassword).toHaveAttribute("aria-pressed", "false");
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(togglePassword);
    expect(
      screen.getByRole("button", { name: "Ocultar senha" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.type(emailInput, "operador@agritech.com");
    await user.type(passwordInput, "SenhaForte123");
    await user.click(screen.getByRole("button", { name: /Entrar/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Credenciais inválidas.",
    );
    expect(onLogin).toHaveBeenCalledTimes(1);
  });

  it("valida hierarquia, filtros acessíveis e recuperação de erro no Dashboard", async () => {
    mockApi({
      ...defaultRoutes(),
      "GET /api/stations/overview": () => ({
        status: 500,
        body: { detail: "Falha temporária" },
      }),
    });

    renderWithProviders(<DashboardPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Visão geral" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Filtrar por propriedade"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por estação")).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /Tentar de novo/i }),
    ).toBeInTheDocument();
  });

  it("valida busca, limpeza rápida e fluxo de detalhes nas interfaces de Estações", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());

    renderWithProviders(<StationsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Estações" }),
    ).toBeInTheDocument();
    const searchInput = await screen.findByLabelText("Buscar estação");
    await user.type(searchInput, "Sede");
    expect(searchInput).toHaveValue("Sede");

    const clearBtn = screen.getByRole("button", { name: "Limpar busca" });
    await user.click(clearBtn);
    expect(searchInput).toHaveValue("");

    expect(
      screen.getByLabelText("Filtrar por propriedade"),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: /Abrir Estação Sede/i }),
    ).toBeInTheDocument();
  });

  it("valida cabeçalho, leituras e edição em modal acessível nos detalhes da estação", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());

    renderWithProviders(<StationDetailPage id={1} />);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Estação Sede" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Estações/i })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Leituras atuais" }),
    ).toBeInTheDocument();

    const editBtn = screen.getByRole("button", { name: "Editar" });
    await user.click(editBtn);

    const dialog = screen.getByRole("dialog", { name: "Editar estação" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("valida filtros, feedback e confirmação de ações nas interfaces de Alertas e Regras", async () => {
    const user = userEvent.setup();
    mockApi({
      ...defaultRoutes(),
      "PUT /api/alerts/triggered/100/acknowledge": { id: 100 },
      "DELETE /api/alerts/config/1": { ok: true },
    });

    const alertsView = renderWithProviders(<AlertsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Alertas disparados" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("radio", { name: /Pendentes/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Reconhecidos/ }),
    ).toBeInTheDocument();
    const ackButtons = await screen.findAllByRole("button", {
      name: "Reconhecer",
    });
    await user.click(ackButtons[0]!);
    expect(await screen.findByText("Alerta reconhecido.")).toBeInTheDocument();
    alertsView.unmount();

    renderWithProviders(<RulesPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Regras de alerta" }),
    ).toBeInTheDocument();
    const ruleSwitch = await screen.findByRole("switch", {
      name: "Regra 1 ativa",
    });
    expect(ruleSwitch).toHaveAttribute("aria-checked", "true");

    const deleteBtn = screen.getByRole("button", { name: "Excluir regra 1" });
    await user.click(deleteBtn);
    const confirmDialog = screen.getByRole("dialog", { name: "Excluir regra" });
    expect(
      within(confirmDialog).getByRole("button", { name: "Cancelar" }),
    ).toBeInTheDocument();
    expect(
      within(confirmDialog).getByRole("button", { name: "Excluir" }),
    ).toBeInTheDocument();
    await user.click(
      within(confirmDialog).getByRole("button", { name: "Cancelar" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("valida filtros acessíveis e estados informativos no Histórico e Relatórios", async () => {
    const user = userEvent.setup();
    mockApi(defaultRoutes());

    const historyView = renderWithProviders(<HistoryPage />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Histórico de dados meteorológicos",
      }),
    ).toBeInTheDocument();
    const criticalityCheckbox = await screen.findByLabelText(
      "Exibir apenas leituras com alerta / discrepância meteorológica",
    );
    expect(criticalityCheckbox).toHaveAttribute("type", "checkbox");
    await user.click(criticalityCheckbox);
    expect(criticalityCheckbox).toBeChecked();
    historyView.unmount();

    renderWithProviders(<ReportsPage />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Relatórios Meteorológicos",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radiogroup", {
        name: "Tipo de relatório meteorológico",
      }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Exportar CSV/i }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /Restaurar padrão/i }));
    expect(screen.getByLabelText("Propriedade Rural")).toHaveValue("all");
  });

  it("valida usabilidade das telas administrativas de Usuários, Parâmetros, Perfis e Propriedades", async () => {
    mockApi({
      ...defaultRoutes(),
      "/api/roles": [
        {
          id: 1,
          name: "Administrador",
          description: "Acesso total",
          permissions: ["monitoring.read"],
        },
      ],
      "/api/permissions": [
        { code: "monitoring.read", description: "Consultar monitoramento" },
      ],
    });

    const usersView = renderWithProviders(<UsersPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Usuários" }),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText("Buscar usuário")).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por cargo")).toBeInTheDocument();
    usersView.unmount();

    const paramsView = renderWithProviders(<ParametersPage />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Parâmetros meteorológicos",
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("list", { name: "Parâmetros" }),
    ).toBeInTheDocument();
    paramsView.unmount();

    const rolesView = renderWithProviders(<RolesPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Perfis e permissões" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("list", { name: "Perfis de acesso" }),
    ).toBeInTheDocument();
    rolesView.unmount();

    renderWithProviders(<PropertiesPage />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Gestão de propriedades agrícolas",
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Limpar filtros" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Nova propriedade/i }),
    ).toBeInTheDocument();
  });

  it("valida armadilha de foco em modais, restauração de foco, confirmação e notificações acessíveis", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ModalAndToastHarness />);

    const openBtn = screen.getByRole("button", { name: "Abrir diálogo" });
    openBtn.focus();
    await user.click(openBtn);

    const dialog = screen.getByRole("dialog", { name: "Edição rápida" });
    const nameInput = within(dialog).getByLabelText("Nome do item");
    const confirmBtn = within(dialog).getByRole("button", {
      name: "Confirmar edição",
    });
    const closeBtn = within(dialog).getByRole("button", { name: "Fechar" });

    expect(nameInput).toHaveFocus();
    await user.tab();
    expect(confirmBtn).toHaveFocus();
    await user.tab();
    expect(closeBtn).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirmBtn).toHaveFocus();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(openBtn).toHaveFocus();

    await user.click(
      screen.getByRole("button", { name: "Solicitar exclusão" }),
    );
    const confirmDialog = screen.getByRole("dialog", {
      name: "Excluir registro",
    });
    expect(
      within(confirmDialog).getByText(
        "Tem certeza que deseja excluir este item?",
      ),
    ).toBeInTheDocument();
    await user.click(
      within(confirmDialog).getByRole("button", { name: "Cancelar" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "Notificar sucesso" }));
    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Operação concluída com sucesso.");
  });
});
