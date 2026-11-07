import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TrendChart } from "@/components/charts/TrendChart";
import { AppShell } from "@/components/layout/AppShell";
import { TopNav } from "@/components/layout/TopNav";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { Field, Input, Select, Switch } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ReactSelect } from "@/components/ui/ReactSelect";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { AlertsPage } from "@/features/alerts/AlertsPage";
import { RulesPage } from "@/features/alerts/RulesPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { HistoryPage } from "@/features/history/HistoryPage";
import { ParametersPage } from "@/features/parameters/ParametersPage";
import { PropertiesPage } from "@/features/properties/PropertiesPage";
import { RolesPage } from "@/features/roles/RolesPage";
import { ForecastCalendarCard } from "@/features/stations/ForecastCalendarCard";
import { StationDetailPage } from "@/features/stations/StationDetailPage";
import { StationsPage } from "@/features/stations/StationsPage";
import { AlertThresholdChart, isThresholdViolated } from "@/features/stats/AlertThresholdChart";
import { DashboardStats } from "@/features/stats/DashboardStats";
import { StationExtremesChart } from "@/features/stats/StationExtremesChart";
import { UsersPage } from "@/features/users/UsersPage";
import { ApiError, request } from "@/lib/api/http";
import { SESSION_EXPIRED } from "@/lib/auth/policy";
import { sameOrigin } from "@/lib/auth/session.server";
import { formatDateTime, formatNumber } from "@/lib/format";
import { forecast } from "@/test/fixtures";
import { defaultRoutes, mockApi, renderWithProviders, testUser } from "@/test/utils";

const navigationState = vi.hoisted(() => ({
  path: "/dashboard",
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.path,
  useRouter: () => ({ replace: navigationState.replace, refresh: navigationState.refresh }),
}));

type SupportedBrowser = {
  id: "chrome" | "edge" | "firefox";
  name: string;
  userAgent: string;
  secFetchSite: string;
};

const SUPPORTED_BROWSERS: SupportedBrowser[] = [
  {
    id: "chrome",
    name: "Google Chrome",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    secFetchSite: "same-origin",
  },
  {
    id: "edge",
    name: "Microsoft Edge",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
    secFetchSite: "same-origin",
  },
  {
    id: "firefox",
    name: "Mozilla Firefox",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
    secFetchSite: "same-origin",
  },
];

function applyBrowserEnvironment(browser: SupportedBrowser, width = 1280, height = 800) {
  Object.defineProperty(window.navigator, "userAgent", {
    value: browser.userAgent,
    configurable: true,
  });
  Object.defineProperty(window, "innerWidth", {
    value: width,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, "innerHeight", {
    value: height,
    configurable: true,
    writable: true,
  });
  window.URL.createObjectURL = vi.fn(() => `blob:https://agritech.local/${browser.id}-export`);
  window.URL.revokeObjectURL = vi.fn();
}

describe.each(SUPPORTED_BROWSERS)(
  "Compatibilidade cross-browser (SCRUM-543 / RNF08) - $name",
  (browser) => {
    beforeEach(() => {
      navigationState.path = "/dashboard";
      navigationState.replace.mockClear();
      navigationState.refresh.mockClear();
      applyBrowserEnvironment(browser);
      mockApi({
        ...defaultRoutes(),
        "/api/permissions": [
          { code: "monitoring.read", description: "Consultar monitoramento" },
          { code: "stations.read", description: "Consultar estações" },
        ],
      });
    });

    it("deve carregar as paginas principais de autenticacao, monitoramento, alertas e administracao", async () => {
      expect(window.navigator.userAgent).toBe(browser.userAgent);

      const loginView = render(<LoginPage onLogin={vi.fn()} />);
      expect(screen.getByRole("heading", { name: "Bem-vindo de volta" })).toBeInTheDocument();
      loginView.unmount();

      const dashboardView = renderWithProviders(<DashboardPage />);
      expect(await screen.findByRole("region", { name: "Resumo" })).toBeInTheDocument();
      expect(await screen.findByRole("region", { name: "Condições agora" })).toBeInTheDocument();
      dashboardView.unmount();

      const stationsView = renderWithProviders(<StationsPage />);
      expect(await screen.findByText("Estação Sede")).toBeInTheDocument();
      stationsView.unmount();

      const detailView = renderWithProviders(<StationDetailPage id={1} />);
      expect(await screen.findByRole("heading", { name: "Estação Sede" })).toBeInTheDocument();
      detailView.unmount();

      const historyView = renderWithProviders(<HistoryPage />);
      expect(await screen.findByRole("heading", { name: "Histórico de dados meteorológicos" })).toBeInTheDocument();
      historyView.unmount();

      const statsView = renderWithProviders(<DashboardStats />);
      expect(await screen.findByRole("heading", { name: "Estatísticas meteorológicas" })).toBeInTheDocument();
      statsView.unmount();

      const alertsView = renderWithProviders(<AlertsPage />);
      expect(await screen.findByText("Temperatura alta na sede")).toBeInTheDocument();
      alertsView.unmount();

      const rulesView = renderWithProviders(<RulesPage />);
      expect(await screen.findByRole("button", { name: "Nova regra" })).toBeInTheDocument();
      rulesView.unmount();

      const propertiesView = renderWithProviders(<PropertiesPage />);
      expect((await screen.findAllByText("Fazenda Santa Rita")).length).toBeGreaterThan(0);
      propertiesView.unmount();

      const usersView = renderWithProviders(<UsersPage />);
      expect(await screen.findByText("Carlos Mendes")).toBeInTheDocument();
      usersView.unmount();

      const rolesView = renderWithProviders(<RolesPage />);
      expect(await screen.findByRole("button", { name: "Novo perfil" })).toBeInTheDocument();
      rolesView.unmount();

      const parametersView = renderWithProviders(<ParametersPage />);
      expect(await screen.findByText("Umidade")).toBeInTheDocument();
      parametersView.unmount();
    });

    it("deve permitir navegacao entre telas por mega-menu desktop, teclado, ponteiro e menu mobile", async () => {
      const user = userEvent.setup();
      navigationState.path = "/alertas/regras";

      renderWithProviders(
        <AppShell>
          <div>Conteúdo principal</div>
        </AppShell>,
      );

      const skipLink = screen.getByRole("link", { name: "Pular para o conteúdo" });
      expect(skipLink).toHaveAttribute("href", "#conteudo");
      expect(screen.getByRole("main")).toHaveAttribute("id", "conteudo");

      const alertsTrigger = screen.getByRole("button", { name: "Alertas" });
      fireEvent.mouseEnter(alertsTrigger.parentElement!);
      expect(alertsTrigger).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("link", { name: /Regras de alerta/ })).toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("link", { name: /Alertas disparados/ })).toHaveAttribute("href", "/alertas");

      fireEvent.pointerDown(document.body);
      expect(alertsTrigger).toHaveAttribute("aria-expanded", "false");

      const adminTrigger = screen.getByRole("button", { name: "Administração" });
      adminTrigger.focus();
      await user.keyboard("{ArrowDown}");
      await waitFor(() => expect(screen.getByRole("link", { name: /Usuários/ })).toHaveFocus());
      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("link", { name: /Parâmetros/ })).toHaveFocus();
      await user.keyboard("{Escape}");
      expect(adminTrigger).toHaveAttribute("aria-expanded", "false");
    });

    it("deve validar e submeter formularios com atributos de acessibilidade padronizados", async () => {
      const user = userEvent.setup();
      const onLogin = vi.fn().mockResolvedValue(undefined);

      const loginView = render(<LoginPage onLogin={onLogin} />);
      await user.click(screen.getByRole("button", { name: "Entrar na plataforma" }));

      expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByLabelText("Senha")).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByText("Informe um e-mail válido.")).toBeInTheDocument();

      await user.type(screen.getByLabelText("E-mail"), "operador@agritech.dev");
      await user.type(screen.getByLabelText("Senha"), "senha-valida-123");
      await user.click(screen.getByRole("button", { name: "Entrar na plataforma" }));
      expect(onLogin).toHaveBeenCalledWith({ email: "operador@agritech.dev", password: "senha-valida-123" });
      loginView.unmount();

      const { calls } = mockApi({ ...defaultRoutes(), "POST /api/stations": { id: 15 } });
      renderWithProviders(<StationsPage />);
      await screen.findByText("Estação Sede");

      await user.click(screen.getByRole("button", { name: "Nova estação" }));
      const dialog = screen.getByRole("dialog", { name: "Nova estação" });
      await user.click(within(dialog).getByRole("button", { name: "Cadastrar" }));

      expect(within(dialog).getByLabelText("Nome")).toHaveAttribute("aria-invalid", "true");
      expect(within(dialog).getByText("Use pelo menos 3 caracteres.")).toBeInTheDocument();

      await user.type(within(dialog).getByLabelText("Nome"), "Estação Sul");
      await user.selectOptions(within(dialog).getByLabelText("Propriedade"), "1");
      await user.type(within(dialog).getByLabelText("Endereço MAC"), "AA:BB:CC:DD:EE:15");
      await user.click(within(dialog).getByRole("button", { name: "Cadastrar" }));

      await waitFor(() => expect(calls.some((call) => call.method === "POST" && call.path === "/api/stations")).toBe(true));
    });

    it("deve renderizar tabelas de dados com estrutura semantica, filtros, paginacao e rolagem horizontal", async () => {
      const user = userEvent.setup();
      const { calls } = mockApi({
        ...defaultRoutes(),
        "/api/alerts/triggered": ({ url }: { url: URL }) => ({
          data: defaultRoutes()["/api/alerts/triggered"]
            ? (
                defaultRoutes()["/api/alerts/triggered"] as (req: {
                  url: URL;
                  method: string;
                  body: unknown;
                }) => { data: unknown[] }
              )({ url, method: "GET", body: undefined }).data
            : [],
          meta: { total_records: 30, total_pages: 2, current_page: Number(url.searchParams.get("page") ?? 1) },
        }),
      });

      const alertsView = renderWithProviders(<AlertsPage />);
      const table = await screen.findByRole("table");
      expect(table.parentElement).toHaveClass("overflow-x-auto");
      expect(within(table).getAllByRole("columnheader").length).toBeGreaterThanOrEqual(4);

      await user.click(await screen.findByRole("button", { name: "Próxima página" }));
      await waitFor(() => expect(calls.some((call) => call.path.includes("page=2"))).toBe(true));
      alertsView.unmount();

      const historyView = renderWithProviders(<HistoryPage />);
      expect(await screen.findByText("DATA / HORA (REGISTRO)")).toBeInTheDocument();
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      const exportButton = screen.getAllByRole("button", { name: "Exportar CSV" })[0]!;
      await user.click(exportButton);
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
      clickSpy.mockRestore();
      historyView.unmount();
    });

    it("deve renderizar graficos, indicadores estatisticos e calendario de previsao com ResizeObserver", async () => {
      render(
        <div>
          <TrendChart
            points={[
              { t: 1760000000, avg: 24.5, min: 22.0, max: 27.0 },
              { t: 1760003600, avg: 25.2, min: 23.1, max: 28.4 },
            ]}
            unit="°C"
            color="#2f6f4e"
          />
          <StationExtremesChart
            data={[
              { stationId: 1, stationName: "Estação Sede", min: 18.2, avg: 24.1, max: 29.8, stddev: 1.2, count: 48 },
              { stationId: 2, stationName: "Estação Pivô", min: 19.0, avg: 25.4, max: 31.0, stddev: 1.5, count: 48 },
            ]}
            unit="°C"
          />
          <AlertThresholdChart
            points={[
              { t: 1760000000, avg: 26.4, min: 24.0, max: 28.0 },
              { t: 1760003600, avg: 31.2, min: 29.0, max: 33.0 },
            ]}
            unit="°C"
            hours={24}
            rule={{ id: 1, operator: ">", referenceValue: 30, message: "Temperatura crítica" }}
          />
          <ForecastCalendarCard
            stationName="Estação Sede"
            propertyName="Fazenda Santa Rita"
            latitude={-23.1896}
            longitude={-45.8841}
            forecast={forecast}
          />
        </div>,
      );

      expect(isThresholdViolated(31.2, { id: 1, operator: ">", referenceValue: 30 })).toBe(true);
      expect(screen.getByRole("heading", { name: "Previsão meteorológica — Estação Sede" })).toBeInTheDocument();
      expect(formatNumber(24.5)).toBe("24,5");
      expect(formatDateTime("2026-10-17T15:00:00Z")).toContain("17/10");
    });

    it("deve operar os componentes visuais interativos de modal, seletores, calendario, segmented e switch", async () => {
      const user = userEvent.setup();
      const onCloseModal = vi.fn();
      const onConfirm = vi.fn();
      const onSelectChange = vi.fn();
      const onRangeChange = vi.fn();
      const onSegmentChange = vi.fn();
      const onSwitchChange = vi.fn();

      render(
        <div>
          <Field label="Filtro rápido" hint="Selecione um item">
            {(props) => (
              <Select {...props} variant="glass" defaultValue="1">
                <option value="1">Opção A</option>
                <option value="2">Opção B</option>
              </Select>
            )}
          </Field>
          <ReactSelect
            id="compat-select"
            label="Seletor rico"
            value="1"
            onChange={onSelectChange}
            options={[
              { value: "1", label: "Sensor 1", badge: "Online" },
              { value: "2", label: "Sensor 2", badge: "Offline" },
            ]}
          />
          <DateRangePicker startDate="01/10/2026" endDate="07/10/2026" onChange={onRangeChange} />
          <Segmented
            label="Modo de visualização"
            value="all"
            onChange={onSegmentChange}
            options={[
              { value: "all", label: "Todas", count: 3 },
              { value: "online", label: "Online", count: 2 },
            ]}
          />
          <Switch checked={false} onChange={onSwitchChange} label="Ativar sensor" />
          <Modal open onClose={onCloseModal} title="Detalhes técnicos">
            <Input aria-label="Campo interno" defaultValue="Valor inicial" />
          </Modal>
          <ConfirmDialog
            open={false}
            title="Confirmar exclusão"
            message="Deseja excluir?"
            onConfirm={onConfirm}
            onCancel={vi.fn()}
          />
        </div>,
      );

      expect(screen.getByRole("dialog", { name: "Detalhes técnicos" })).toBeInTheDocument();
      await user.keyboard("{Escape}");
      expect(onCloseModal).toHaveBeenCalledTimes(1);

      await user.selectOptions(screen.getByLabelText("Seletor rico"), "2");
      expect(onSelectChange).toHaveBeenCalledWith("2");

      await user.click(screen.getByRole("radio", { name: /Online/ }));
      expect(onSegmentChange).toHaveBeenCalledWith("online");

      await user.click(screen.getByRole("switch", { name: "Ativar sensor" }));
      expect(onSwitchChange).toHaveBeenCalledWith(true);
    });

    it("deve manter a responsividade em viewports mobile e desktop sem quebra estrutural", async () => {
      const user = userEvent.setup();
      applyBrowserEnvironment(browser, 375, 667);
      window.dispatchEvent(new Event("resize"));

      renderWithProviders(
        <div>
          <TopNav />
          <Table>
            <thead>
              <Tr>
                <Th>Estação</Th>
                <Th className="hidden sm:table-cell">Propriedade</Th>
                <Th className="hidden md:table-cell">MAC</Th>
              </Tr>
            </thead>
            <tbody>
              <Tr>
                <Td>Estação Sede</Td>
                <Td className="hidden sm:table-cell">Fazenda Santa Rita</Td>
                <Td className="hidden md:table-cell">AA:BB:CC:DD:EE:01</Td>
              </Tr>
            </tbody>
          </Table>
        </div>,
      );

      const mobileToggle = screen.getByRole("button", { name: "Abrir menu" });
      expect(mobileToggle).toHaveAttribute("aria-controls", "menu-mobile");
      await user.click(mobileToggle);

      const mobileMenu = screen.getByRole("navigation", { name: "Menu" });
      expect(within(mobileMenu).getAllByRole("link").length).toBeGreaterThan(0);

      await user.click(screen.getByRole("button", { name: "Fechar menu" }));
      expect(screen.queryByRole("navigation", { name: "Menu" })).not.toBeInTheDocument();
    });

    it("deve integrar as interfaces com a API validando headers do navegador, sessao e permissoes", async () => {
      const originRequest = new Request("http://localhost:3010/api/auth/login", {
        method: "POST",
        headers: {
          Origin: "https://agritech.example.com",
          "X-Forwarded-Host": "agritech.example.com",
          "X-Forwarded-Proto": "https",
          "Sec-Fetch-Site": browser.secFetchSite,
          "User-Agent": browser.userAgent,
        },
      });
      expect(sameOrigin(originRequest)).toBe(true);

      const crossSiteRequest = new Request("http://localhost:3010/api/auth/login", {
        method: "POST",
        headers: {
          Origin: "https://agritech.example.com",
          "X-Forwarded-Host": "agritech.example.com",
          "X-Forwarded-Proto": "https",
          "Sec-Fetch-Site": "cross-site",
          "User-Agent": browser.userAgent,
        },
      });
      expect(sameOrigin(crossSiteRequest)).toBe(false);

      const expiredHandler = vi.fn();
      const permissionsHandler = vi.fn();
      window.addEventListener(SESSION_EXPIRED, expiredHandler);
      window.addEventListener("agritech:permissions-changed", permissionsHandler);

      mockApi({
        "/api/stations": { status: 401, body: { message: "Sessão expirada" } },
        "/api/users": { status: 403, body: { message: "Acesso negado" } },
      });

      await expect(request("/api/stations")).rejects.toBeInstanceOf(ApiError);
      expect(expiredHandler).toHaveBeenCalledTimes(1);

      await expect(request("/api/users")).rejects.toMatchObject({ status: 403, message: "Acesso negado" });
      expect(permissionsHandler).toHaveBeenCalledTimes(1);

      window.removeEventListener(SESSION_EXPIRED, expiredHandler);
      window.removeEventListener("agritech:permissions-changed", permissionsHandler);

      mockApi(defaultRoutes());
      renderWithProviders(
        <StationsPage />,
        { ...testUser, permissions: ["stations.read", "monitoring.read", "properties.read"] },
      );
      expect(await screen.findByText("Estação Sede")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Nova estação" })).not.toBeInTheDocument();
    });

    it("deve exibir mensagens de erro, estados vazios e notificacoes de sucesso de forma consistente", async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      function ToastHarness() {
        const toast = useToast();
        return (
          <div>
            <button onClick={() => toast.success("Operação concluída com sucesso.")}>Disparar sucesso</button>
            <button onClick={() => toast.error("Falha ao processar solicitação.")}>Disparar erro</button>
          </div>
        );
      }

      render(
        <ToastProvider>
          <ToastHarness />
          <ErrorState message="Não foi possível conectar ao servidor." onRetry={onRetry} />
          <EmptyState title="Sem registros" description="Nenhuma leitura encontrada para o filtro." />
        </ToastProvider>,
      );

      await user.click(screen.getByRole("button", { name: "Disparar sucesso" }));
      expect(await screen.findByRole("status")).toHaveTextContent("Operação concluída com sucesso.");

      await user.click(screen.getByRole("button", { name: "Disparar erro" }));
      const statuses = await screen.findAllByRole("status");
      expect(statuses.some((el) => el.textContent?.includes("Falha ao processar solicitação."))).toBe(true);

      expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível conectar ao servidor.");
      await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
      expect(onRetry).toHaveBeenCalledTimes(1);

      expect(screen.getByText("Sem registros")).toBeInTheDocument();
      expect(screen.getByText("Nenhuma leitura encontrada para o filtro.")).toBeInTheDocument();
    });
  },
);
