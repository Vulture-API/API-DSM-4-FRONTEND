"use client";

import { ArrowLeft, Clock, Cpu, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";

import { Button, IconButton } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select, Switch } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { RowActions, Table, Td, Th, Tr } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import type { Sensor } from "@/features/parameters/api";
import { useDeleteSensor, useSaveSensor, useSensors, useSensorTypes } from "@/features/parameters/hooks";
import { sensorOrder, sensorVisual } from "@/features/sensor-visual";
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format";

import type { LatestReading, StationOverview } from "./api";
import { useOverview } from "./hooks";
import { SeriesCard } from "./SeriesCard";
import { StationFormModal } from "./StationFormModal";
import { StationsMapLazy } from "./StationsMapLazy";
import { toStation } from "./StationsPage";
import { StationStatusBadge } from "./StationStatusBadge";

export function StationDetailPage({ id }: { id: number }) {
  const overview = useOverview();
  const station = overview.data?.stations.find((s) => s.id === id);
  const [editing, setEditing] = useState(false);

  const back = (
    <Link href="/estacoes" className="inline-flex items-center gap-1.5 rounded text-sm text-white/75 hover:text-white">
      <ArrowLeft className="size-4" aria-hidden /> Estações
    </Link>
  );

  if (overview.isLoading) {
    return (
      <>
        <PageHeader title="Carregando estação…" back={back} />
        <div className="space-y-6">
          <Skeleton className="h-32 rounded-[var(--radius-card)]" />
          <Skeleton className="h-80 rounded-[var(--radius-card)]" />
        </div>
      </>
    );
  }
  if (overview.error) {
    return (
      <>
        <PageHeader title="Estação" back={back} />
        <Card>
          <ErrorState message={overview.error.message} onRetry={() => void overview.refetch()} />
        </Card>
      </>
    );
  }
  if (!station) {
    return (
      <>
        <PageHeader title="Estação" back={back} />
        <Card>
          <EmptyState
            title="Estação não encontrada"
            description="Ela pode ter sido excluída."
            action={
              <Link href="/estacoes" className="text-sm font-medium text-brand-700 hover:underline">
                Voltar para estações
              </Link>
            }
          />
        </Card>
      </>
    );
  }

  const readings = [...station.latest_readings].sort((a, b) => sensorOrder(a.sensor_type) - sensorOrder(b.sensor_type));

  return (
    <>
      <PageHeader
        back={back}
        title={station.name}
        badge={<StationStatusBadge status={station.status} alerts={station.active_alerts} />}
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{station.property_name}</span>
            <span
              className="inline-flex items-center gap-1"
              title={station.last_communication_at ? formatDateTime(station.last_communication_at) : undefined}
            >
              <Clock className="size-3.5" aria-hidden />
              Última comunicação {formatRelative(station.last_communication_at)}
            </span>
          </span>
        }
        actions={
          <Button variant="glass" icon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>
            Editar
          </Button>
        }
      />

      <div className="space-y-6">
        <Card className="overflow-hidden shadow-[var(--shadow-lift)]">
          <section aria-label="Leituras atuais" className="-mb-px -ml-px flex flex-wrap">
            {readings.length === 0 && (
              <div className="flex-1">
                <EmptyState title="Sem leituras ainda" description="A estação ainda não enviou dados." />
              </div>
            )}
            {readings.map((reading) => (
              <ReadingTile key={reading.sensor_id} reading={reading} />
            ))}
          </section>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 [&>*]:min-w-0">
          <SeriesCard title="Histórico" stationId={station.id} className="lg:col-span-8" />
          <LocationCard station={station} />
        </div>

        <SensorsCard station={station} />
      </div>

      {editing && <StationFormModal open station={toStation(station)} onClose={() => setEditing(false)} />}
    </>
  );
}

function ReadingTile({ reading }: { reading: LatestReading }) {
  const visual = sensorVisual(reading.sensor_type);
  return (
    <div className="flex min-w-[150px] flex-1 flex-col border-b border-l border-line p-5">
      <p className="flex items-start gap-2 text-[13px] leading-snug font-medium text-muted">
        <visual.icon className="mt-px size-4 shrink-0" style={{ color: visual.color }} aria-hidden />
        {reading.sensor_type}
      </p>
      <p className="mt-auto pt-2 text-[26px] leading-none font-semibold tracking-tight tabular-nums">
        {formatNumber(reading.value)}
        <span className="ml-1 text-sm font-medium text-muted">{reading.unit_of_measure}</span>
      </p>
      <p className="mt-2 font-mono text-[11px] text-faint">{reading.local_identifier}</p>
    </div>
  );
}

function LocationCard({ station }: { station: StationOverview }) {
  const located = station.latitude !== null && station.longitude !== null;
  return (
    <Card className="flex flex-col overflow-hidden lg:col-span-4">
      <CardHeader title="Localização" icon={<MapPin className="size-4" />} />
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 text-sm">
        <div>
          <dt className="text-xs text-faint">Propriedade</dt>
          <dd className="font-medium">{station.property_name}</dd>
        </div>
        <div>
          <dt className="text-xs text-faint">MAC</dt>
          <dd className="font-mono text-[13px]">{station.mac_address}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-faint">Coordenadas</dt>
          <dd className="tabular-nums">
            {located ? `${station.latitude!.toFixed(4)}, ${station.longitude!.toFixed(4)}` : "Não informadas"}
          </dd>
        </div>
      </dl>
      <div className="mt-auto border-t border-line">
        {located ? (
          <StationsMapLazy stations={[station]} selectedId={station.id} height={240} zoom={14} label={`Mapa com a localização de ${station.name}`} />
        ) : (
          <EmptyState title="Sem coordenadas" description="Edite a estação para informar latitude e longitude." />
        )}
      </div>
    </Card>
  );
}

function SensorsCard({ station }: { station: StationOverview }) {
  const sensors = useSensors(station.id);
  const types = useSensorTypes();
  const save = useSaveSensor();
  const remove = useDeleteSensor();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const typeById = useMemo(() => new Map(types.data?.map((t) => [t.id, t])), [types.data]);
  const readingBySensor = useMemo(
    () => new Map(station.latest_readings.map((r) => [r.sensor_id, r])),
    [station.latest_readings],
  );

  async function toggle(sensor: Sensor) {
    try {
      await save.mutateAsync({
        id: sensor.id,
        input: {
          station_id: sensor.station_id,
          sensor_type_id: sensor.sensor_type_id,
          local_identifier: sensor.local_identifier,
          operational_status: !sensor.operational_status,
        },
      });
      toast.success(sensor.operational_status ? "Sensor desativado." : "Sensor ativado.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function removeSensor(sensor: Sensor) {
    try {
      await remove.mutateAsync(sensor.id);
      toast.success("Sensor removido.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Sensores"
        description="O identificador é a chave que o datalogger usa no payload (ex.: temp, umid)."
        icon={<Cpu className="size-4" />}
        action={
          <Button variant="secondary" size="sm" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            Adicionar sensor
          </Button>
        }
      />
      <div className="mt-4 border-t border-line">
        {sensors.isLoading ? (
          <div className="space-y-2 p-5">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
        ) : sensors.error ? (
          <ErrorState message={sensors.error.message} onRetry={() => void sensors.refetch()} />
        ) : !sensors.data?.length ? (
          <EmptyState title="Nenhum sensor vinculado" description="Adicione os sensores presentes no datalogger desta estação." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Medição</Th>
                <Th className="hidden sm:table-cell">Identificador</Th>
                <Th className="text-right">Última leitura</Th>
                <Th>Operacional</Th>
                <Th className="w-16">
                  <span className="sr-only">Ações</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {[...sensors.data]
                .sort(
                  (a, b) =>
                    sensorOrder(typeById.get(a.sensor_type_id)?.name ?? "") -
                    sensorOrder(typeById.get(b.sensor_type_id)?.name ?? ""),
                )
                .map((sensor) => {
                  const type = typeById.get(sensor.sensor_type_id);
                  const visual = sensorVisual(type?.name ?? "");
                  const reading = readingBySensor.get(sensor.id);
                  return (
                    <Tr key={sensor.id}>
                      <Td>
                        <span className="inline-flex items-center gap-2.5">
                          <span
                            className="inline-flex size-8 items-center justify-center rounded-lg"
                            style={{ background: visual.soft, color: visual.color }}
                            aria-hidden
                          >
                            <visual.icon className="size-4" />
                          </span>
                          <span>
                            <span className="block font-medium text-ink">{type ? type.name : `Tipo #${sensor.sensor_type_id}`}</span>
                            <span className="block font-mono text-xs text-faint sm:hidden">{sensor.local_identifier}</span>
                          </span>
                        </span>
                      </Td>
                      <Td className="hidden sm:table-cell">
                        <span className="rounded-md bg-subtle px-1.5 py-0.5 font-mono text-[13px]">{sensor.local_identifier}</span>
                      </Td>
                      <Td className="whitespace-nowrap text-right tabular-nums">
                        {reading ? (
                          <>
                            <span className="font-medium">
                              {formatNumber(reading.value)} {reading.unit_of_measure}
                            </span>
                            <span className="block text-xs text-faint">{formatRelative(new Date(reading.unix_time * 1000))}</span>
                          </>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </Td>
                      <Td>
                        <Switch
                          label={`Sensor ${sensor.local_identifier} operacional`}
                          checked={sensor.operational_status}
                          onChange={() => void toggle(sensor)}
                        />
                      </Td>
                      <Td>
                        <RowActions>
                          <IconButton
                            label={`Remover sensor ${sensor.local_identifier}`}
                            onClick={() => void removeSensor(sensor)}
                            className="hover:text-danger"
                          >
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
      </div>
      {adding && <AddSensorModal stationId={station.id} onClose={() => setAdding(false)} />}
    </Card>
  );
}

function AddSensorModal({ stationId, onClose }: { stationId: number; onClose: () => void }) {
  const types = useSensorTypes();
  const save = useSaveSensor();
  const toast = useToast();
  const [typeId, setTypeId] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [errors, setErrors] = useState<{ type?: string; identifier?: string }>({});

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found: typeof errors = {};
    if (!typeId) found.type = "Escolha o tipo de medição.";
    if (!identifier.trim()) found.identifier = "Informe o identificador.";
    setErrors(found);
    if (Object.keys(found).length) return;
    try {
      await save.mutateAsync({
        input: {
          station_id: stationId,
          sensor_type_id: Number(typeId),
          local_identifier: identifier.trim(),
          operational_status: true,
        },
      });
      toast.success("Sensor vinculado à estação.");
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Adicionar sensor"
      description="Vincule um sensor do datalogger a esta estação."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="add-sensor-form" loading={save.isPending}>
            Vincular sensor
          </Button>
        </>
      }
    >
      <form id="add-sensor-form" onSubmit={submit} noValidate className="grid gap-4">
        <Field label="Tipo de medição" error={errors.type}>
          {(p) => (
            <Select {...p} value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              <option value="">Selecione…</option>
              {types.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.unit_of_measure})
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Identificador" error={errors.identifier} hint="Mesma chave usada no payload MQTT, ex.: temp">
          {(p) => (
            <Input
              {...p}
              value={identifier}
              maxLength={50}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="temp"
              className="font-mono"
            />
          )}
        </Field>
      </form>
    </Modal>
  );
}
