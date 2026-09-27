"use client";

import { Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select, Switch } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { RowActions, Table, Td, Th, Tr } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { useSensorCatalog } from "@/features/catalog";
import { sensorVisual } from "@/features/sensor-visual";
import { useUsers } from "@/features/users/hooks";
import { formatNumber } from "@/lib/format";

import { type AlertRule, OPERATOR_PHRASES } from "./api";
import { useAlertRules, useDeleteRule, useSaveRule } from "./hooks";
import { RuleFormModal } from "./RuleFormModal";

type ActiveFilter = "all" | "active" | "inactive";

export function RulesPage() {
  const rules = useAlertRules();
  const catalog = useSensorCatalog();
  const users = useUsers();
  const save = useSaveRule();
  const remove = useDeleteRule();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [stationId, setStationId] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [editing, setEditing] = useState<AlertRule | "new" | null>(null);
  const [deleting, setDeleting] = useState<AlertRule | null>(null);

  const userById = new Map(users.data?.map((u) => [u.id, u]));
  const all = rules.data ?? [];
  const term = search.trim().toLowerCase();
  const visible = all.filter((rule) => {
    const entry = catalog.bySensorId.get(rule.sensor_id);
    if (stationId && String(entry?.station?.id) !== stationId) return false;
    if (activeFilter === "active" && !rule.active) return false;
    if (activeFilter === "inactive" && rule.active) return false;
    if (!term) return true;
    return [rule.message, entry?.station?.name, entry?.type?.name]
      .filter(Boolean)
      .some((text) => text!.toLowerCase().includes(term));
  });

  async function toggle(rule: AlertRule) {
    try {
      await save.mutateAsync({
        id: rule.id,
        input: {
          sensor_id: rule.sensor_id,
          comparison_operator: rule.comparison_operator,
          reference_value: rule.reference_value,
          message: rule.message,
          manager_user_id: rule.manager_user_id,
          active: !rule.active,
        },
      });
      toast.success(rule.active ? "Regra desativada." : "Regra ativada.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success("Regra excluída.");
      setDeleting(null);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  const loading = rules.isLoading || catalog.isLoading;
  const error = rules.error ?? catalog.error;

  return (
    <>
      <PageHeader
        eyebrow="Alertas"
        title="Regras de alerta"
        description="Condições que disparam um aviso quando uma leitura passa do limite."
        actions={
          <Button variant="light" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>
            Nova regra
          </Button>
        }
      />

      <Card className="shadow-[var(--shadow-lift)]">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <SearchInput label="Buscar regra" placeholder="Buscar regra" value={search} onChange={setSearch} className="lg:w-80" />
          <Select aria-label="Filtrar por estação" value={stationId} onChange={(e) => setStationId(e.target.value)} className="h-9 lg:w-56">
            <option value="">Todas as estações</option>
            {catalog.stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <div className="lg:ml-auto">
            <Segmented
              label="Filtrar por situação"
              value={activeFilter}
              onChange={setActiveFilter}
              options={[
                { value: "all", label: "Todas", count: all.length },
                { value: "active", label: "Ativas", count: all.filter((r) => r.active).length },
                { value: "inactive", label: "Inativas", count: all.filter((r) => !r.active).length },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            message={error.message}
            onRetry={() => {
              void rules.refetch();
              catalog.refetch();
            }}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<SlidersHorizontal className="size-5" />}
            title={all.length ? "Nenhuma regra com esses filtros" : "Nenhuma regra cadastrada"}
            action={!all.length && <Button onClick={() => setEditing("new")}>Criar a primeira regra</Button>}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Condição</Th>
                <Th className="hidden md:table-cell">Estação</Th>
                <Th className="hidden lg:table-cell">Mensagem</Th>
                <Th className="hidden xl:table-cell">Responsável</Th>
                <Th>Ativa</Th>
                <Th className="w-20">
                  <span className="sr-only">Ações</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((rule) => {
                const entry = catalog.bySensorId.get(rule.sensor_id);
                const visual = sensorVisual(entry?.type?.name ?? "");
                return (
                  <Tr key={rule.id} className={rule.active ? undefined : "bg-canvas/60"}>
                    <Td>
                      <span className="flex items-center gap-3">
                        <span
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: visual.soft, color: visual.color }}
                          aria-hidden
                        >
                          <visual.icon className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-ink">{entry?.type?.name ?? "Sensor"}</span>
                          <span className="block text-xs text-muted">
                            {OPERATOR_PHRASES[rule.comparison_operator]}{" "}
                            <span className="font-semibold text-ink tabular-nums">
                              {formatNumber(rule.reference_value)} {entry?.type?.unit_of_measure}
                            </span>
                          </span>
                          {entry?.station && (
                            <span className="block text-xs text-muted md:hidden">em {entry.station.name}</span>
                          )}
                          {rule.message && (
                            <span className="line-clamp-1 text-xs text-muted lg:hidden">“{rule.message}”</span>
                          )}
                        </span>
                        {!rule.active && (
                          <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">Inativa</span>
                        )}
                      </span>
                    </Td>
                    <Td className="hidden md:table-cell">
                      {entry?.station ? (
                        <Link href={`/estacoes/${entry.station.id}`} className="text-ink hover:text-brand-700">
                          {entry.station.name}
                          <span className="block font-mono text-xs text-faint">{entry.sensor.local_identifier}</span>
                        </Link>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </Td>
                    <Td className="hidden max-w-xs text-muted lg:table-cell">
                      <span className="line-clamp-2">{rule.message ?? "—"}</span>
                    </Td>
                    <Td className="hidden whitespace-nowrap text-muted xl:table-cell">
                      {rule.manager_user_id && userById.get(rule.manager_user_id) ? (
                        <span className="inline-flex items-center gap-2">
                          <Avatar name={userById.get(rule.manager_user_id)!.name} size="sm" />
                          {userById.get(rule.manager_user_id)!.name}
                        </span>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>
                      <Switch label={`Regra ${rule.id} ativa`} checked={rule.active} onChange={() => void toggle(rule)} />
                    </Td>
                    <Td>
                      <RowActions>
                        <IconButton label={`Editar regra ${rule.id}`} onClick={() => setEditing(rule)}>
                          <Pencil className="size-4" />
                        </IconButton>
                        <IconButton label={`Excluir regra ${rule.id}`} onClick={() => setDeleting(rule)} className="hover:text-danger">
                          <Trash2 className="size-4" />
                        </IconButton>
                      </RowActions>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {editing && <RuleFormModal rule={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir regra"
        message="A regra e o histórico de alertas disparados por ela serão apagados."
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
