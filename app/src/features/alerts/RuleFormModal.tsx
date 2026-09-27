"use client";

import { type FormEvent, useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { type CatalogEntry, useSensorCatalog } from "@/features/catalog";
import { useUsers } from "@/features/users/hooks";
import { formatNumber } from "@/lib/format";

import { type AlertRule, type Operator, OPERATOR_LABELS, OPERATORS } from "./api";
import { useSaveRule } from "./hooks";

type Values = {
  station_id: string;
  sensor_id: string;
  comparison_operator: Operator;
  reference_value: string;
  message: string;
  manager_user_id: string;
  active: boolean;
};

export function RuleFormModal({ rule, onClose }: { rule?: AlertRule | undefined; onClose: () => void }) {
  const formId = useId();
  const catalog = useSensorCatalog();
  const users = useUsers();
  const save = useSaveRule();
  const toast = useToast();
  const current = rule ? catalog.bySensorId.get(rule.sensor_id) : undefined;
  const [values, setValues] = useState<Values>({
    station_id: current?.station ? String(current.station.id) : "",
    sensor_id: rule ? String(rule.sensor_id) : "",
    comparison_operator: rule?.comparison_operator ?? ">",
    reference_value: rule ? String(rule.reference_value) : "",
    message: rule?.message ?? "",
    manager_user_id: rule?.manager_user_id ? String(rule.manager_user_id) : "",
    active: rule?.active ?? true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});

  const sensorsOfStation = useMemo<CatalogEntry[]>(
    () =>
      [...catalog.bySensorId.values()]
        .filter((e) => String(e.sensor.station_id) === values.station_id)
        .sort((a, b) => (a.type?.name ?? "").localeCompare(b.type?.name ?? "")),
    [catalog.bySensorId, values.station_id],
  );
  const selected = catalog.bySensorId.get(Number(values.sensor_id));
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found: typeof errors = {};
    if (!values.sensor_id) found.sensor_id = "Escolha o sensor.";
    if (values.reference_value === "" || Number.isNaN(Number(values.reference_value)))
      found.reference_value = "Informe um número.";
    if (values.message.length > 200) found.message = "Até 200 caracteres.";
    setErrors(found);
    if (Object.keys(found).length) return;
    try {
      await save.mutateAsync({
        id: rule?.id,
        input: {
          sensor_id: Number(values.sensor_id),
          comparison_operator: values.comparison_operator,
          reference_value: Number(values.reference_value),
          message: values.message.trim() || null,
          manager_user_id: values.manager_user_id ? Number(values.manager_user_id) : null,
          active: values.active,
        },
      });
      toast.success(rule ? "Regra atualizada." : "Regra criada.");
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={rule ? "Editar regra de alerta" : "Nova regra de alerta"}
      description="O motor de regras compara cada leitura nova do sensor com a condição."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="rule-form" loading={save.isPending}>
            {rule ? "Salvar" : "Criar regra"}
          </Button>
        </>
      }
    >
      <form id="rule-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Estação">
          {(p) => (
            <Select
              {...p}
              value={values.station_id}
              onChange={(e) => setValues((v) => ({ ...v, station_id: e.target.value, sensor_id: "" }))}
            >
              <option value="">Selecione…</option>
              {catalog.stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Sensor" error={errors.sensor_id}>
          {(p) => (
            <Select {...p} value={values.sensor_id} disabled={!values.station_id} onChange={(e) => set("sensor_id", e.target.value)}>
              <option value="">{values.station_id ? "Selecione…" : "Escolha a estação antes"}</option>
              {sensorsOfStation.map((e) => (
                <option key={e.sensor.id} value={e.sensor.id}>
                  {e.type?.name ?? "Sensor"} ({e.sensor.local_identifier})
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Condição">
          {(p) => (
            <Select {...p} value={values.comparison_operator} onChange={(e) => set("comparison_operator", e.target.value as Operator)}>
              {OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {OPERATOR_LABELS[op]} ({op})
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={`Valor de referência${selected?.type ? ` (${selected.type.unit_of_measure})` : ""}`} error={errors.reference_value}>
          {(p) => (
            <Input {...p} inputMode="decimal" value={values.reference_value} onChange={(e) => set("reference_value", e.target.value)} placeholder="30" />
          )}
        </Field>
        <Field label="Mensagem do alerta" error={errors.message} className="sm:col-span-2">
          {(p) => (
            <Textarea {...p} value={values.message} maxLength={200} onChange={(e) => set("message", e.target.value)} placeholder="Temperatura alta: risco de estresse térmico" />
          )}
        </Field>
        <Field label="Responsável" hint="Quem é avisado">
          {(p) => (
            <Select {...p} value={values.manager_user_id} onChange={(e) => set("manager_user_id", e.target.value)}>
              <option value="">Sem responsável</option>
              {users.data
                ?.filter((u) => u.active)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </Select>
          )}
        </Field>
        <div className="flex items-center gap-3 self-center pt-5">
          <Switch labelledBy={`${formId}-rule-active`} checked={values.active} onChange={(value) => set("active", value)} />
          <span id={`${formId}-rule-active`} className="text-sm text-ink">
            Regra ativa
          </span>
        </div>

        {selected && values.reference_value !== "" && !Number.isNaN(Number(values.reference_value)) && (
          <p className="rounded-lg bg-brand-50 px-3 py-2.5 text-[13px] text-brand-800 sm:col-span-2">
            Avisar quando <strong>{selected.type?.name}</strong> em <strong>{selected.station?.name}</strong> for{" "}
            {OPERATOR_LABELS[values.comparison_operator]}{" "}
            <strong>
              {formatNumber(Number(values.reference_value))} {selected.type?.unit_of_measure}
            </strong>
            .
          </p>
        )}
      </form>
    </Modal>
  );
}
