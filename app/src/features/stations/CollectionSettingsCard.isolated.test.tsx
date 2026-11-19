import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/http";

import type { StationCollectionSettings, StationStatusResponse } from "./api";
import { CollectionSettingsCard } from "./CollectionSettingsCard";

const state = vi.hoisted(() => ({
  permissions: [] as string[],
  collection: { data: undefined as StationCollectionSettings | undefined, isPending: false, error: null as Error | null, refetch: vi.fn() },
  status: { data: undefined as StationStatusResponse | undefined, isPending: false, error: null as Error | null, refetch: vi.fn() },
  save: { isPending: false, error: null as Error | null, mutateAsync: vi.fn(), reset: vi.fn() },
  success: vi.fn(),
}));

vi.mock("./hooks", () => ({
  useCollectionSettings: () => state.collection,
  useStationStatus: () => state.status,
  useSaveCollectionSettings: () => state.save,
}));
vi.mock("@/features/auth/AuthProvider", () => ({ useCan: (permission: string) => state.permissions.includes(permission) }));
vi.mock("@/components/ui/Toast", () => ({ useToast: () => ({ success: state.success }) }));

const mount = () => render(<CollectionSettingsCard stationId={1} stationName="Estação Sede" />);
const field = () => screen.getByLabelText("Novo intervalo de coleta (segundos)");
const saveButton = () => screen.getByRole("button", { name: "Salvar intervalo" });

// SCRUM-590: componente isolado de autenticação, TanStack Query e rede.
describe("CollectionSettingsCard isolado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.permissions = ["station-collection.read", "station-collection.update"];
    state.collection.data = { station_id: 1, mac_address: "AA:BB:CC:DD:EE:01", collection_interval_seconds: 60,
      min_interval_seconds: 10, max_interval_seconds: 300 };
    state.collection.isPending = false;
    state.collection.error = null;
    state.status.data = { station_id: 1, status: "Online", last_communication_at: "2026-11-17T12:00:00Z",
      checked_at: "2026-11-17T12:01:00Z", offline_threshold_minutes: 10 };
    state.status.isPending = false;
    state.status.error = null;
    state.save.isPending = false;
    state.save.error = null;
    state.save.mutateAsync.mockReset().mockResolvedValue(undefined);
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Teste unitário não deve acessar a rede"); }));
  });

  it("apresenta frequência e identificação sem acessar serviços", () => {
    mount();
    expect(screen.getByText("Estação selecionada: Estação Sede")).toBeInTheDocument();
    expect(screen.getByText("AA:BB:CC:DD:EE:01")).toBeInTheDocument();
    expect(screen.getByText("60 segundos (1 minuto)")).toBeInTheDocument();
    expect(field()).toHaveValue("60");
    expect(saveButton()).toBeDisabled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([10, 300])("permite informar e enviar o limite válido %s como número", async (seconds) => {
    const user = userEvent.setup();
    mount();
    await user.clear(field());
    await user.type(field(), String(seconds));
    expect(saveButton()).toBeEnabled();
    await user.click(saveButton());
    await waitFor(() => expect(state.success).toHaveBeenCalledWith("Intervalo de coleta atualizado."));
    expect(state.save.mutateAsync).toHaveBeenCalledExactlyOnceWith(seconds);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ["", "Informe o intervalo de coleta."],
    ["9", "Use um intervalo entre 10 e 300 segundos."],
    ["301", "Use um intervalo entre 10 e 300 segundos."],
    ["12.5", "Informe um número inteiro de segundos."],
    ["1e2", "Informe um número inteiro de segundos."],
    ["texto", "Informe um número inteiro de segundos."],
  ])("informa o erro de %j sem chamar a mutação", async (value, message) => {
    const user = userEvent.setup();
    mount();
    await user.clear(field());
    if (value) await user.type(field(), value);
    await user.click(saveButton());
    const error = screen.getByRole("alert");
    expect(error).toHaveTextContent(message);
    expect(field()).toHaveAttribute("aria-invalid", "true");
    expect(field()).toHaveAttribute("aria-describedby", error.id);
    expect(state.save.mutateAsync).not.toHaveBeenCalled();
    expect(state.success).not.toHaveBeenCalled();
  });

  it("remove o erro de validação ao corrigir a entrada e permite reenviar", async () => {
    const user = userEvent.setup();
    mount();
    await user.clear(field());
    await user.type(field(), "9");
    await user.click(saveButton());
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.clear(field());
    await user.type(field(), "120");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(field()).toHaveAttribute("aria-invalid", "false");
    await user.click(saveButton());
    expect(state.save.mutateAsync).toHaveBeenCalledWith(120);
  });

  it("usa os limites recebidos sem fixar 300 segundos", async () => {
    const user = userEvent.setup();
    state.collection.data!.max_interval_seconds = 900;
    mount();
    expect(screen.getByText("Número inteiro entre 10 e 900 segundos.")).toBeInTheDocument();
    await user.clear(field());
    await user.type(field(), "600");
    await user.click(saveButton());
    expect(state.save.mutateAsync).toHaveBeenCalledWith(600);
  });

  it("mantém a frequência atual e o rascunho quando a mutação falha", async () => {
    const user = userEvent.setup();
    state.save.mutateAsync.mockRejectedValueOnce(new Error("Falha ao salvar"));
    mount();
    await user.clear(field());
    await user.type(field(), "120");
    await user.click(saveButton());
    await waitFor(() => expect(state.save.mutateAsync).toHaveBeenCalledWith(120));
    expect(field()).toHaveValue("120");
    expect(screen.getByText("60 segundos (1 minuto)")).toBeInTheDocument();
    expect(state.success).not.toHaveBeenCalled();
  });

  it("reseta o rascunho ao selecionar outra estação", async () => {
    const user = userEvent.setup();
    const { rerender } = mount();
    await user.clear(field());
    await user.type(field(), "180");
    state.collection.data = { ...state.collection.data!, station_id: 2, collection_interval_seconds: 120, mac_address: "AA:BB:CC:DD:EE:02" };
    rerender(<CollectionSettingsCard stationId={2} stationName="Estação Norte" />);
    expect(field()).toHaveValue("120");
    expect(screen.getByText("120 segundos (2 minutos)")).toBeInTheDocument();
    expect(screen.getByText("Estação selecionada: Estação Norte")).toBeInTheDocument();
    expect(state.save.mutateAsync).not.toHaveBeenCalled();
  });

  it("exibe carregamento sem formulário quando ainda não há configuração", () => {
    state.collection.data = undefined;
    state.collection.isPending = true;
    mount();
    expect(screen.getByText("Carregando configuração da coleta…")).toHaveAttribute("role", "status");
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it.each([
    [404, "Estação não encontrada ou removida"],
    [403, "Você não tem permissão"],
    [503, "Serviço de coleta indisponível"],
  ])("trata configuração ausente com erro %s e permite repetir a consulta", async (status, message) => {
    const user = userEvent.setup();
    state.collection.data = undefined;
    state.collection.error = new ApiError(status, "raw");
    mount();
    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(state.collection.refetch).toHaveBeenCalledOnce();
  });

  it("não permite salvar configuração em cache após falha de atualização", async () => {
    state.collection.error = new ApiError(503, "raw");
    mount();
    expect(screen.getByText("60 segundos (1 minuto)")).toBeInTheDocument();
    expect(field()).toBeDisabled();
    expect(saveButton()).toBeDisabled();
    fireEvent.submit(screen.getByRole("form"));
    expect(state.save.mutateAsync).not.toHaveBeenCalled();
  });

  it("bloqueia edição e envio enquanto a mutação está pendente", () => {
    state.save.isPending = true;
    mount();
    expect(field()).toBeDisabled();
    expect(saveButton()).toBeDisabled();
    fireEvent.submit(screen.getByRole("form"));
    expect(state.save.mutateAsync).not.toHaveBeenCalled();
  });

  it("apresenta o erro do salvamento e limpa a mensagem ao editar novamente", async () => {
    const user = userEvent.setup();
    state.save.error = new ApiError(400, "Intervalo não permitido pelo servidor");
    mount();
    expect(screen.getByRole("alert")).toHaveTextContent("Intervalo não permitido pelo servidor");
    await user.type(field(), "0");
    expect(state.save.reset).toHaveBeenCalled();
  });

  it("exibe a consulta de comunicação pendente sem presumir um status", () => {
    state.status.data = undefined;
    state.status.isPending = true;
    mount();
    expect(screen.getByText("Consultando comunicação…")).toHaveAttribute("role", "status");
    expect(screen.queryByText("Em comunicação")).not.toBeInTheDocument();
    expect(screen.queryByText("Sem comunicação")).not.toBeInTheDocument();
    expect(field()).toBeEnabled();
  });

  it("não inventa status ou data quando os dados estão ausentes", () => {
    state.status.data = undefined;
    mount();
    expect(screen.queryByText("Em comunicação")).not.toBeInTheDocument();
    expect(screen.queryByText("Sem comunicação")).not.toBeInTheDocument();
    expect(screen.queryByText("Verificado em")).not.toBeInTheDocument();
    expect(field()).toBeEnabled();
  });

  it("permite repetir a consulta de status sem repetir a consulta da configuração", async () => {
    const user = userEvent.setup();
    state.status.error = new ApiError(503, "raw");
    mount();
    expect(screen.queryByText("Em comunicação")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(state.status.refetch).toHaveBeenCalledOnce();
    expect(state.collection.refetch).not.toHaveBeenCalled();
  });
});
