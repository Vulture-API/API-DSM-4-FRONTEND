"use client";

import {
  Building2,
  Edit2,
  Link as LinkIcon,
  MapPin,
  Plus,
  RadioTower,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input, Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { useOverview } from "@/features/stations/hooks";
import { useUsers } from "@/features/users/hooks";

import type { Property } from "./api";
import { useDeleteProperty, usePropertiesList } from "./hooks";
import { PropertyFormModal } from "./PropertyFormModal";
import { PropertyStationsModal } from "./PropertyStationsModal";

type CoverageFilter = "all" | "with_stations" | "with_alerts" | "without_stations";

export function PropertiesPage() {
  const propertiesQuery = usePropertiesList();
  const overviewQuery = useOverview();
  const usersQuery = useUsers();
  const deleteProperty = useDeleteProperty();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [onlyWithStations, setOnlyWithStations] = useState(false);
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>("all");

  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [formProperty, setFormProperty] = useState<Property | "new" | null>(null);
  const [associatingProperty, setAssociatingProperty] = useState<Property | null>(null);
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null);

  const properties = useMemo(() => propertiesQuery.data ?? [], [propertiesQuery.data]);
  const stations = useMemo(() => overviewQuery.data?.stations ?? [], [overviewQuery.data]);

  // Mapa de estações por propriedade
  const stationsByProperty = useMemo(() => {
    const map = new Map<number, typeof stations>();
    for (const st of stations) {
      const list = map.get(st.property_id) ?? [];
      list.push(st);
      map.set(st.property_id, list);
    }
    return map;
  }, [stations]);

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const usersMap = useMemo(() => new Map(users.map((u) => [u.id, u.name])), [users]);

  // Opções únicas de localização e proprietários para os Selects
  const uniqueLocations = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((p) => {
      if (p.location) set.add(p.location);
    });
    return Array.from(set).sort();
  }, [properties]);

  const uniqueOwners = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((p) => {
      const owner = p.owner ?? (p.owner_user_id ? usersMap.get(p.owner_user_id) : undefined) ?? "Mariana Albuquerque";
      if (owner) set.add(owner);
    });
    return Array.from(set).sort();
  }, [properties, usersMap]);

  // Lista filtrada de propriedades
  const filteredProperties = useMemo(() => {
    const sTerm = search.trim().toLowerCase();
    const stTerm = stationFilter.trim().toLowerCase();

    return properties.filter((p) => {
      const pStations = stationsByProperty.get(p.id) ?? [];
      const hasStations = pStations.length > 0;
      const hasAlerts = pStations.some((s) => s.status === "Com alerta" || (s.active_alerts ?? 0) > 0);
      const owner = p.owner ?? (p.owner_user_id ? usersMap.get(p.owner_user_id) : undefined);

      if (onlyWithStations && !hasStations) return false;
      if (coverageFilter === "with_stations" && !hasStations) return false;
      if (coverageFilter === "without_stations" && hasStations) return false;
      if (coverageFilter === "with_alerts" && !hasAlerts) return false;

      if (locationFilter && p.location !== locationFilter) return false;
      if (ownerFilter && owner !== ownerFilter) return false;

      if (
        sTerm &&
        !p.name.toLowerCase().includes(sTerm) &&
        !(p.location ?? "").toLowerCase().includes(sTerm) &&
        !(owner ?? "").toLowerCase().includes(sTerm)
      ) {
        return false;
      }

      if (
        stTerm &&
        !pStations.some(
          (st) =>
            st.name.toLowerCase().includes(stTerm) ||
            st.mac_address.toLowerCase().includes(stTerm),
        )
      ) {
        return false;
      }

      return true;
    });
  }, [
    properties,
    stationsByProperty,
    search,
    stationFilter,
    locationFilter,
    ownerFilter,
    onlyWithStations,
    coverageFilter,
    usersMap,
  ]);

  // Propriedade selecionada para o painel de detalhamento
  const activeProperty = useMemo(() => {
    if (selectedPropertyId !== null) {
      const found = properties.find((p) => p.id === selectedPropertyId);
      if (found) return found;
    }
    return filteredProperties[0] ?? properties[0] ?? null;
  }, [selectedPropertyId, properties, filteredProperties]);

  const activePropertyStations = useMemo(() => {
    if (!activeProperty) return [];
    return stationsByProperty.get(activeProperty.id) ?? [];
  }, [activeProperty, stationsByProperty]);

  // Métricas para o cabeçalho
  const totalProperties = properties.length;
  const totalLinkedStations = stations.length;
  const onlineStationsCount = stations.filter((s) => s.status === "Online").length;
  const offlineStationsCount = stations.filter((s) => s.status === "Offline").length;

  // Contagens para os botões segmentados
  const countWithStations = useMemo(
    () => properties.filter((p) => (stationsByProperty.get(p.id) ?? []).length > 0).length,
    [properties, stationsByProperty],
  );
  const countWithAlerts = useMemo(
    () =>
      properties.filter((p) => {
        const pStations = stationsByProperty.get(p.id) ?? [];
        return pStations.some((s) => s.status === "Com alerta" || (s.active_alerts ?? 0) > 0);
      }).length,
    [properties, stationsByProperty],
  );
  const countWithoutStations = totalProperties - countWithStations;

  function handleResetFilters() {
    setSearch("");
    setLocationFilter("");
    setOwnerFilter("");
    setStationFilter("");
    setOnlyWithStations(false);
    setCoverageFilter("all");
  }

  async function confirmDelete() {
    if (!deletingProperty) return;
    try {
      await deleteProperty.mutateAsync(deletingProperty.id);
      toast.success(`Propriedade "${deletingProperty.name}" excluída.`);
      if (selectedPropertyId === deletingProperty.id) {
        setSelectedPropertyId(null);
      }
      setDeletingProperty(null);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      {/* ===================================================================
          CABEÇALHO DA PÁGINA (PAGEHEADER)
          =================================================================== */}
      <PageHeader
        eyebrow="Monitoramento"
        title="Gestão de propriedades agrícolas"
        description="Cadastro, consulta, localização e associação das propriedades agrícolas às estações meteorológicas."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="glass"
              icon={<LinkIcon className="size-4" />}
              onClick={() => setAssociatingProperty(activeProperty ?? properties[0] ?? null)}
              disabled={properties.length === 0}
            >
              Associar estações
            </Button>
            <Button
              variant="light"
              icon={<Plus className="size-4" />}
              onClick={() => setFormProperty("new")}
            >
              Nova propriedade
            </Button>
          </div>
        }
      >
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-brand-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-brand-300" />
            {totalProperties} {totalProperties === 1 ? "propriedade cadastrada" : "propriedades cadastradas"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-brand-300" />
            {totalLinkedStations} estações associadas
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-brand-300" />
            {onlineStationsCount} online · {offlineStationsCount} offline
          </span>
        </div>
      </PageHeader>

      {/* ===================================================================
          CARD 1: FILTROS DE CONSULTA
          =================================================================== */}
      <Card className="p-5 shadow-[var(--shadow-lift)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">Filtros de consulta</h2>
            <p className="text-xs text-muted">
              Consulte as propriedades por identificação, município, responsável ou cobertura de estações.
            </p>
          </div>
          <Segmented
            label="Cobertura de estações"
            value={coverageFilter}
            onChange={(val) => setCoverageFilter(val as CoverageFilter)}
            options={[
              { value: "all", label: `Todas (${totalProperties})` },
              { value: "with_stations", label: `Com estações (${countWithStations})` },
              { value: "with_alerts", label: `Com alerta (${countWithAlerts})` },
              { value: "without_stations", label: `Sem estações (${countWithoutStations})` },
            ]}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="filter-prop-search" className="mb-1 block text-xs font-medium text-muted">
              Propriedade (Identificação)
            </label>
            <Input
              id="filter-prop-search"
              placeholder="Ex.: Fazenda Santa Rita"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
          </div>

          <div>
            <label htmlFor="filter-prop-location" className="mb-1 block text-xs font-medium text-muted">
              Localização (Município - UF)
            </label>
            <Select
              id="filter-prop-location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="h-9"
            >
              <option value="">Todas as localidades</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="filter-prop-owner" className="mb-1 block text-xs font-medium text-muted">
              Responsável
            </label>
            <Select
              id="filter-prop-owner"
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="h-9"
            >
              <option value="">Todos os responsáveis</option>
              {uniqueOwners.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="filter-prop-station" className="mb-1 block text-xs font-medium text-muted">
              Estação associada
            </label>
            <Input
              id="filter-prop-station"
              placeholder="Ex.: Estação Sede ou MAC"
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3.5">
          <label className="inline-flex items-center gap-2 text-xs text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={onlyWithStations}
              onChange={(e) => setOnlyWithStations(e.target.checked)}
              className="rounded border-line text-brand-600 focus:ring-brand-500"
            />
            Exibir apenas propriedades com estações meteorológicas vinculadas
          </label>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={handleResetFilters}>
              Limpar filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* ===================================================================
          CARD 2: TABELA DE LISTAGEM DE PROPRIEDADES
          =================================================================== */}
      <Card className="overflow-hidden shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-2 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">Listagem de propriedades agrícolas</h2>
            <p className="text-xs text-muted">
              {filteredProperties.length}{" "}
              {filteredProperties.length === 1 ? "propriedade encontrada" : "propriedades encontradas"} · Clique em
              uma linha para visualizar o detalhamento abaixo
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={<Plus className="size-3.5" />}
            onClick={() => setFormProperty("new")}
          >
            Cadastrar propriedade
          </Button>
        </div>

        {propertiesQuery.isLoading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ) : propertiesQuery.error ? (
          <div className="p-5">
            <ErrorState
              message={propertiesQuery.error.message}
              onRetry={() => void propertiesQuery.refetch()}
            />
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Nenhuma propriedade encontrada"
              description="Não há propriedades agrícolas correspondentes aos filtros selecionados. Limpe os filtros ou cadastre uma nova propriedade."
              action={
                <Button variant="secondary" onClick={handleResetFilters}>
                  Limpar filtros
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <Tr className="border-b border-line bg-subtle/40 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <Th className="py-3 pr-3 pl-5">Propriedade (Identificação)</Th>
                  <Th className="px-3 py-3">Localização</Th>
                  <Th className="px-3 py-3">Responsável</Th>
                  <Th className="px-3 py-3">Estações Associadas</Th>
                  <Th className="px-3 py-3">Status das Estações</Th>
                  <Th className="px-3 py-3">Alertas</Th>
                  <Th className="py-3 pr-5 pl-3 text-right">Ações</Th>
                </Tr>
              </thead>
              <tbody className="divide-y divide-line text-xs">
                {filteredProperties.map((p) => {
                  const pStations = stationsByProperty.get(p.id) ?? [];
                  const isSelected = activeProperty?.id === p.id;
                  const offlineCount = pStations.filter((s) => s.status === "Offline").length;
                  const activeAlertsCount = pStations.reduce(
                    (acc, s) => acc + (s.active_alerts ?? (s.status === "Com alerta" ? 1 : 0)),
                    0,
                  );
                  const statusColor =
                    pStations.length === 0
                      ? "bg-control"
                      : activeAlertsCount > 0
                        ? "bg-warn"
                        : offlineCount > 0
                          ? "bg-danger"
                          : "bg-ok";

                  return (
                    <Tr
                      key={p.id}
                      onClick={() => setSelectedPropertyId(p.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-brand-50/70" : "hover:bg-subtle/50"
                      }`}
                    >
                      <Td className="py-3 pr-3 pl-5 font-medium text-ink">
                        <div className="flex items-center gap-2.5">
                          <span className={`size-2 rounded-full ${statusColor}`} />
                          <div>
                            <span className="font-semibold text-ink">{p.name}</span>
                            <span className="block text-[11px] text-faint">ID #{String(p.id).padStart(3, "0")}</span>
                          </div>
                        </div>
                      </Td>

                      <Td className="px-3 py-3 text-muted">{p.location ?? "—"}</Td>

                      <Td className="px-3 py-3 text-muted">
                        {p.owner ?? (p.owner_user_id ? usersMap.get(p.owner_user_id) : undefined) ?? "—"}
                      </Td>

                      <Td className="px-3 py-3">
                        {pStations.length > 0 ? (
                          <span>
                            <strong className="font-semibold text-ink">{pStations.length}</strong>{" "}
                            <span className="text-[11px] text-faint">
                              ({pStations.map((s) => s.name.replace("Estação ", "")).join(", ")})
                            </span>
                          </span>
                        ) : (
                          <span className="text-faint">Nenhuma vinculada</span>
                        )}
                      </Td>

                      <Td className="px-3 py-3">
                        {pStations.length === 0 ? (
                          <Badge tone="neutral">Sem estações</Badge>
                        ) : offlineCount > 0 ? (
                          <Badge tone="warn" dot>
                            {offlineCount} {offlineCount === 1 ? "offline" : "offlines"}
                          </Badge>
                        ) : (
                          <Badge tone="ok" dot pulse>
                            Todas comunicando
                          </Badge>
                        )}
                      </Td>

                      <Td className="px-3 py-3">
                        {activeAlertsCount > 0 ? (
                          <Badge tone="danger" dot pulse>
                            {activeAlertsCount} {activeAlertsCount === 1 ? "alerta ativo" : "alertas ativos"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted/60">—</span>
                        )}
                      </Td>

                      <Td className="py-3 pr-5 pl-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<Edit2 className="size-3" />}
                            onClick={() => setFormProperty(p)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<RadioTower className="size-3" />}
                            onClick={() => setAssociatingProperty(p)}
                          >
                            Estações
                          </Button>
                          <IconButton
                            label={`Excluir ${p.name}`}
                            onClick={() => setDeletingProperty(p)}
                          >
                            <Trash2 className="size-3.5 text-danger" />
                          </IconButton>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      {/* ===================================================================
          PAINEL DE DETALHAMENTO DA PROPRIEDADE SELECIONADA
          =================================================================== */}
      {activeProperty && (
        <Card className="p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <Building2 className="size-5 text-brand-600" />
                <h3 className="text-base font-semibold text-ink">{activeProperty.name}</h3>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800">
                  {activePropertyStations.length}{" "}
                  {activePropertyStations.length === 1 ? "estação associada" : "estações associadas"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                Localização: <strong className="font-medium text-ink">{activeProperty.location ?? "Não informada"}</strong>{" "}
                · Responsável: <strong className="font-medium text-ink">{activeProperty.owner ?? (activeProperty.owner_user_id ? usersMap.get(activeProperty.owner_user_id) : undefined) ?? "Mariana Albuquerque"}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={<Edit2 className="size-3.5" />}
                onClick={() => setFormProperty(activeProperty)}
              >
                Editar propriedade
              </Button>
              <Button
                size="sm"
                variant="glass"
                icon={<RadioTower className="size-3.5" />}
                onClick={() => setAssociatingProperty(activeProperty)}
              >
                + Associar estação
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-12">
            {/* Mapa conceitual e espacial da propriedade */}
            <div className="lg:col-span-5">
              <div className="relative h-56 w-full overflow-hidden rounded-xl border border-line bg-subtle/30 p-3">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 220" fill="none">
                  <path
                    d="M60 45 L320 35 L360 165 L180 195 L50 150 Z"
                    fill="#2f8050"
                    fillOpacity="0.12"
                    stroke="#226339"
                    strokeWidth="1.8"
                    strokeDasharray="5 4"
                  />
                </svg>

                {activePropertyStations.map((st, idx) => {
                  const pos = [
                    { top: "34%", left: "42%" },
                    { top: "62%", left: "65%" },
                    { top: "48%", left: "26%" },
                  ][idx % 3]!;
                  const color =
                    st.status === "Online"
                      ? "bg-ok"
                      : st.status === "Com alerta"
                        ? "bg-warn"
                        : "bg-danger";

                  return (
                    <div
                      key={st.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ top: pos.top, left: pos.left }}
                    >
                      <span className={`relative flex size-3 items-center justify-center rounded-full border-2 border-white shadow ${color}`} />
                      <div className="mt-1 whitespace-nowrap rounded border border-line bg-surface/95 px-1.5 py-0.5 text-[10px] font-medium text-ink shadow-2xs">
                        {st.name}
                      </div>
                    </div>
                  );
                })}

                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md border border-line bg-surface/90 px-2 py-1 text-[11px] text-muted">
                  <MapPin className="size-3.5 text-brand-600" />
                  <span>Localização territorial · {activeProperty.location ?? activeProperty.name}</span>
                </div>
              </div>
            </div>

            {/* Tabela de estações vinculadas */}
            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-xl border border-line bg-surface">
                <Table>
                  <thead>
                    <Tr className="border-b border-line bg-subtle/50 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      <Th className="py-2.5 pr-2 pl-3.5">Estação Associada</Th>
                      <Th className="px-2 py-2.5">Endereço MAC</Th>
                      <Th className="px-2 py-2.5">Coordenadas</Th>
                      <Th className="py-2.5 pr-3.5 pl-2">Status</Th>
                    </Tr>
                  </thead>
                  <tbody className="divide-y divide-line text-xs">
                    {activePropertyStations.length === 0 ? (
                      <Tr>
                        <Td colSpan={4} className="py-8 text-center text-xs text-muted">
                          Nenhuma estação meteorológica associada a esta propriedade.
                        </Td>
                      </Tr>
                    ) : (
                      activePropertyStations.map((st) => (
                        <Tr key={st.id} className="hover:bg-subtle/30">
                          <Td className="py-2.5 pr-2 pl-3.5 font-medium text-ink">{st.name}</Td>
                          <Td className="px-2 py-2.5 font-mono text-faint">{st.mac_address}</Td>
                          <Td className="px-2 py-2.5 font-mono text-muted">
                            {st.latitude !== null && st.longitude !== null
                              ? `${st.latitude.toFixed(4)}, ${st.longitude.toFixed(4)}`
                              : "—"}
                          </Td>
                          <Td className="py-2.5 pr-3.5 pl-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                st.status === "Online"
                                  ? "bg-ok-soft text-ok"
                                  : st.status === "Com alerta"
                                    ? "bg-warn-soft text-warn"
                                    : "bg-danger-soft text-danger"
                              }`}
                            >
                              ● {st.status}
                            </span>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ===================================================================
          MODAIS E DIÁLOGOS
          =================================================================== */}
      {Boolean(formProperty) && (
        <PropertyFormModal
          open
          property={typeof formProperty === "object" && formProperty !== null ? formProperty : undefined}
          onClose={() => setFormProperty(null)}
        />
      )}

      {Boolean(associatingProperty) && (
        <PropertyStationsModal
          open
          property={associatingProperty ?? undefined}
          onClose={() => setAssociatingProperty(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deletingProperty)}
        title="Excluir propriedade agrícola"
        message={`Deseja realmente excluir a propriedade "${deletingProperty?.name}"? Esta ação removerá o registro e desassociará as estações vinculadas a ela.`}
        confirmLabel="Excluir"
        loading={deleteProperty.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingProperty(null)}
      />
    </div>
  );
}

export default PropertiesPage;
