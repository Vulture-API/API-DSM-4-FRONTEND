"use client";

import { ChevronRight, Pencil, Plus, RadioTower, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { RowActions, Table, Td, Th, Tr } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { formatRelative } from "@/lib/format";

import type { Station, StationOverview, StationStatus } from "./api";
import { useDeleteStation, useOverview, useProperties } from "./hooks";
import { communicationDelay, LastCommunication } from "./CommunicationDelay";
import { StationFormModal } from "./StationFormModal";
import { StationStatusBadge, StatusDot } from "./StationStatusBadge";

type StatusFilter = "all" | StationStatus;

export function toStation(s: StationOverview): Station {
  return {
    id: s.id,
    property_id: s.property_id,
    mac_address: s.mac_address,
    name: s.name,
    latitude: s.latitude,
    longitude: s.longitude,
    last_communication_at: s.last_communication_at,
    created_at: "",
  };
}

export function StationsPage() {
  const overview = useOverview();
  const properties = useProperties();
  const remove = useDeleteStation();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<Station | "new" | null>(null);
  const [deleting, setDeleting] = useState<StationOverview | null>(null);

  const stations = useMemo(() => overview.data?.stations ?? [], [overview.data]);
  const byProperty = stations.filter((s) => !propertyId || s.property_id === Number(propertyId));
  const term = search.trim().toLowerCase();
  const visible = byProperty.filter(
    (s) =>
      (status === "all" || s.status === status) &&
      (!term || s.name.toLowerCase().includes(term) || s.mac_address.toLowerCase().includes(term)),
  );
  const count = (value: StationStatus) => byProperty.filter((s) => s.status === value).length;

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success(`${deleting.name} excluída.`);
      setDeleting(null);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Monitoramento"
        title="Estações"
        description="Estações meteorológicas instaladas, seus sensores e a última comunicação."
        actions={
          <Button variant="light" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>
            Nova estação
          </Button>
        }
      />

      <Card className="shadow-[var(--shadow-lift)]">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <SearchInput
            label="Buscar estação"
            placeholder="Buscar por nome ou MAC"
            value={search}
            onChange={setSearch}
            className="lg:w-72"
          />
          <Select
            aria-label="Filtrar por propriedade"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="h-9 lg:w-56"
          >
            <option value="">Todas as propriedades</option>
            {properties.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <div className="lg:ml-auto">
            <Segmented
              label="Filtrar por status"
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "Todas", count: byProperty.length },
                { value: "Online", label: "Online", count: count("Online") },
                { value: "Com alerta", label: "Com alerta", count: count("Com alerta") },
                { value: "Offline", label: "Offline", count: count("Offline") },
              ]}
            />
          </div>
        </div>

        {overview.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : overview.error ? (
          <ErrorState message={overview.error.message} onRetry={() => void overview.refetch()} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<RadioTower className="size-5" />}
            title={stations.length ? "Nenhuma estação com esses filtros" : "Nenhuma estação cadastrada"}
            description={stations.length ? "Tente limpar a busca ou trocar o status." : "Cadastre a primeira estação para começar."}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Estação</Th>
                <Th className="hidden md:table-cell">Propriedade</Th>
                <Th>Status</Th>
                <Th className="hidden text-right md:table-cell">Sensores</Th>
                <Th className="hidden sm:table-cell">Última comunicação</Th>
                <Th className="w-24">
                  <span className="sr-only">Ações</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((station) => (
                <Tr key={station.id}>
                  <Td>
                    <Link href={`/estacoes/${station.id}`} className="group flex items-center gap-3">
                      <StatusDot status={station.status} />
                      <span className="min-w-0">
                        <span className="block font-medium text-ink group-hover:text-brand-700">{station.name}</span>
                        <span className="block font-mono text-xs text-faint">{station.mac_address}</span>
                        <span className="block text-xs text-muted md:hidden">
                          {station.property_name} ·{" "}
                          {communicationDelay(station.last_communication_at) ?? formatRelative(station.last_communication_at)} ·{" "}
                          {station.sensors_active}/{station.sensors_total} sensores
                        </span>
                      </span>
                      <span className="sr-only">, {station.status}</span>
                    </Link>
                  </Td>
                  <Td className="hidden text-muted md:table-cell">{station.property_name}</Td>
                  <Td>
                    <StationStatusBadge status={station.status} alerts={station.active_alerts} />
                  </Td>
                  <Td className="hidden text-right md:table-cell">
                    <SensorsMeter active={station.sensors_active} total={station.sensors_total} />
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <LastCommunication lastCommunicationAt={station.last_communication_at} />
                  </Td>
                  <Td>
                    <RowActions>
                      <IconButton label={`Editar ${station.name}`} onClick={() => setEditing(toStation(station))}>
                        <Pencil className="size-4" />
                      </IconButton>
                      <IconButton label={`Excluir ${station.name}`} onClick={() => setDeleting(station)} className="hover:text-danger">
                        <Trash2 className="size-4" />
                      </IconButton>
                      <Link
                        href={`/estacoes/${station.id}`}
                        aria-label={`Abrir ${station.name}`}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-faint hover:bg-subtle hover:text-ink"
                      >
                        <ChevronRight className="size-4" />
                      </Link>
                    </RowActions>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {editing && (
        <StationFormModal
          open
          station={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir estação"
        message={`${deleting?.name ?? ""} e todos os sensores e leituras dela serão apagados. Essa ação não pode ser desfeita.`}
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

function SensorsMeter({ active, total }: { active: number; total: number }) {
  const ratio = total ? active / total : 0;
  return (
    <span className="inline-flex items-center gap-2" title={`${active} de ${total} sensores operacionais`}>
      <span className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-subtle sm:block" aria-hidden>
        <span
          className="block h-full rounded-full"
          style={{ width: `${ratio * 100}%`, background: ratio === 1 ? "var(--color-dot-ok)" : "var(--color-dot-warn)" }}
        />
      </span>
      <span className="tabular-nums text-muted">
        {active}/{total}
      </span>
    </span>
  );
}
