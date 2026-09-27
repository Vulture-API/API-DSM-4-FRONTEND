"use client";

import { Gauge, Pencil, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { RowActions } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { sensorVisual } from "@/features/sensor-visual";
import { formatNumber } from "@/lib/format";

import type { SensorType } from "./api";
import { useDeleteSensorType, useSaveSensorType, useSensors, useSensorTypes } from "./hooks";

export function ParametersPage() {
  const types = useSensorTypes();
  const sensors = useSensors();
  const remove = useDeleteSensorType();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<SensorType | "new" | null>(null);
  const [deleting, setDeleting] = useState<SensorType | null>(null);

  const usage = useMemo(() => {
    const counts = new Map<number, number>();
    sensors.data?.forEach((s) => counts.set(s.sensor_type_id, (counts.get(s.sensor_type_id) ?? 0) + 1));
    return counts;
  }, [sensors.data]);

  const term = search.trim().toLowerCase();
  const visible = (types.data ?? [])
    .filter((t) => !term || t.name.toLowerCase().includes(term) || t.unit_of_measure.toLowerCase().includes(term))
    .sort((a, b) => a.name.localeCompare(b.name));

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success("Parâmetro excluído.");
      setDeleting(null);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Parâmetros meteorológicos"
        description="Tipos de medição que os sensores podem registrar, com unidade e calibração."
        actions={
          <Button variant="light" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>
            Novo parâmetro
          </Button>
        }
      />
      <Card className="shadow-[var(--shadow-lift)]">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput label="Buscar parâmetro" placeholder="Buscar por nome ou unidade" value={search} onChange={setSearch} className="sm:w-72" />
          {types.data && (
            <p className="text-xs text-muted">
              {types.data.length} parâmetros · {sensors.data?.length ?? 0} sensores cadastrados
            </p>
          )}
        </div>
        {types.isLoading ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : types.error ? (
          <ErrorState message={types.error.message} onRetry={() => void types.refetch()} />
        ) : visible.length === 0 ? (
          <EmptyState icon={<Gauge className="size-5" />} title="Nenhum parâmetro encontrado" />
        ) : (
          <ul className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Parâmetros">
            {visible.map((type) => {
              const visual = sensorVisual(type.name);
              const count = usage.get(type.id) ?? 0;
              const calibrated = type.factor !== null || type.gain !== null;
              return (
                <li
                  key={type.id}
                  className="group relative flex flex-col rounded-xl border border-line bg-surface p-4 transition-shadow hover:shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex items-center gap-3">
                      <span
                        className="inline-flex size-10 items-center justify-center rounded-xl"
                        style={{ background: visual.soft, color: visual.color }}
                        aria-hidden
                      >
                        <visual.icon className="size-5" />
                      </span>
                      <span>
                        <h2 className="text-sm font-semibold text-ink">{type.name}</h2>
                        <span className="mt-0.5 inline-block rounded-md bg-subtle px-1.5 py-0.5 font-mono text-xs">
                          {type.unit_of_measure}
                        </span>
                      </span>
                    </span>
                    <RowActions>
                      <IconButton label={`Editar ${type.name}`} onClick={() => setEditing(type)}>
                        <Pencil className="size-4" />
                      </IconButton>
                      <IconButton label={`Excluir ${type.name}`} onClick={() => setDeleting(type)} className="hover:text-danger">
                        <Trash2 className="size-4" />
                      </IconButton>
                    </RowActions>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3 text-sm">
                    <div>
                      <dt className="text-xs text-faint">Sensores</dt>
                      <dd className="font-semibold tabular-nums">{count}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-faint">Calibração</dt>
                      <dd className="tabular-nums text-muted">
                        {calibrated ? (
                          <>
                            {type.factor !== null && <span>fator {formatNumber(type.factor)}</span>}
                            {type.factor !== null && type.gain !== null && " · "}
                            {type.gain !== null && <span>ganho {formatNumber(type.gain)}</span>}
                          </>
                        ) : (
                          "Sem calibração"
                        )}
                      </dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      {editing && <SensorTypeModal type={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir parâmetro"
        message={
          deleting && usage.get(deleting.id)
            ? `${deleting.name} está em uso por ${usage.get(deleting.id)} sensor(es). Remova os sensores antes.`
            : `${deleting?.name ?? ""} será excluído.`
        }
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

function SensorTypeModal({ type, onClose }: { type?: SensorType | undefined; onClose: () => void }) {
  const save = useSaveSensorType();
  const toast = useToast();
  const [values, setValues] = useState({
    name: type?.name ?? "",
    unit_of_measure: type?.unit_of_measure ?? "",
    factor: type?.factor?.toString() ?? "",
    gain: type?.gain?.toString() ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values, string>>>({});
  const set = (key: keyof typeof values) => (value: string) => setValues((v) => ({ ...v, [key]: value }));
  const numberOrNull = (value: string) => (value.trim() === "" ? null : Number(value.replace(",", ".")));

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found: typeof errors = {};
    if (!values.name.trim()) found.name = "Informe o nome.";
    if (!values.unit_of_measure.trim()) found.unit_of_measure = "Informe a unidade.";
    if (Number.isNaN(numberOrNull(values.factor))) found.factor = "Número inválido.";
    if (Number.isNaN(numberOrNull(values.gain))) found.gain = "Número inválido.";
    setErrors(found);
    if (Object.keys(found).length) return;
    try {
      await save.mutateAsync({
        id: type?.id,
        input: {
          name: values.name.trim(),
          unit_of_measure: values.unit_of_measure.trim(),
          factor: numberOrNull(values.factor),
          gain: numberOrNull(values.gain),
        },
      });
      toast.success(type ? "Parâmetro atualizado." : "Parâmetro cadastrado.");
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={type ? "Editar parâmetro" : "Novo parâmetro"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="sensor-type-form" loading={save.isPending}>
            {type ? "Salvar" : "Cadastrar"}
          </Button>
        </>
      }
    >
      <form id="sensor-type-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" error={errors.name} className="sm:col-span-2">
          {(p) => <Input {...p} value={values.name} maxLength={50} onChange={(e) => set("name")(e.target.value)} placeholder="Temperatura" />}
        </Field>
        <Field label="Unidade de medida" error={errors.unit_of_measure} className="sm:col-span-2">
          {(p) => <Input {...p} value={values.unit_of_measure} maxLength={20} onChange={(e) => set("unit_of_measure")(e.target.value)} placeholder="°C" />}
        </Field>
        <Field label="Fator" error={errors.factor} hint="Opcional, calibração">
          {(p) => <Input {...p} inputMode="decimal" value={values.factor} onChange={(e) => set("factor")(e.target.value)} />}
        </Field>
        <Field label="Ganho" error={errors.gain} hint="Opcional, calibração">
          {(p) => <Input {...p} inputMode="decimal" value={values.gain} onChange={(e) => set("gain")(e.target.value)} />}
        </Field>
      </form>
    </Modal>
  );
}
