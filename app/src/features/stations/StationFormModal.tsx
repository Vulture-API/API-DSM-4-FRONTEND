"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

import type { Station, StationInput } from "./api";
import { useProperties, useSaveStation } from "./hooks";

const MAC = /^[0-9A-Fa-f]{2}([:-])(?:[0-9A-Fa-f]{2}\1){4}[0-9A-Fa-f]{2}$/;

type Values = { property_id: string; name: string; mac_address: string; latitude: string; longitude: string };
type Errors = Partial<Record<keyof Values, string>>;

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.property_id) errors.property_id = "Escolha a propriedade.";
  if (values.name.trim().length < 3) errors.name = "Use pelo menos 3 caracteres.";
  if (!MAC.test(values.mac_address.trim())) errors.mac_address = "Formato: AA:BB:CC:DD:EE:FF";
  const lat = values.latitude === "" ? null : Number(values.latitude);
  const lon = values.longitude === "" ? null : Number(values.longitude);
  if (lat !== null && (Number.isNaN(lat) || lat < -90 || lat > 90)) errors.latitude = "Entre -90 e 90.";
  if (lon !== null && (Number.isNaN(lon) || lon < -180 || lon > 180)) errors.longitude = "Entre -180 e 180.";
  return errors;
}

export function StationFormModal({
  open,
  station,
  onClose,
}: {
  open: boolean;
  station?: Station | undefined;
  onClose: () => void;
}) {
  const properties = useProperties();
  const save = useSaveStation();
  const toast = useToast();
  const [values, setValues] = useState<Values>(() => ({
    property_id: station ? String(station.property_id) : "",
    name: station?.name ?? "",
    mac_address: station?.mac_address ?? "",
    latitude: station?.latitude?.toString() ?? "",
    longitude: station?.longitude?.toString() ?? "",
  }));
  const [errors, setErrors] = useState<Errors>({});

  const set = (key: keyof Values) => (value: string) => setValues((v) => ({ ...v, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    const input: StationInput = {
      property_id: Number(values.property_id),
      name: values.name.trim(),
      mac_address: values.mac_address.trim(),
      latitude: values.latitude === "" ? null : Number(values.latitude),
      longitude: values.longitude === "" ? null : Number(values.longitude),
    };
    try {
      await save.mutateAsync({ id: station?.id, input });
      toast.success(station ? "Estação atualizada." : "Estação cadastrada.");
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={station ? "Editar estação" : "Nova estação"}
      description="O MAC é o identificador que o datalogger envia nas leituras."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="station-form" loading={save.isPending}>
            {station ? "Salvar" : "Cadastrar"}
          </Button>
        </>
      }
    >
      <form id="station-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" error={errors.name} className="sm:col-span-2">
          {(p) => <Input {...p} value={values.name} onChange={(e) => set("name")(e.target.value)} placeholder="Estação Sede" />}
        </Field>
        <Field label="Propriedade" error={errors.property_id}>
          {(p) => (
            <Select {...p} value={values.property_id} onChange={(e) => set("property_id")(e.target.value)}>
              <option value="">Selecione…</option>
              {properties.data?.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Endereço MAC" error={errors.mac_address}>
          {(p) => (
            <Input
              {...p}
              value={values.mac_address}
              onChange={(e) => set("mac_address")(e.target.value)}
              placeholder="AA:BB:CC:DD:EE:FF"
              className="font-mono"
            />
          )}
        </Field>
        <Field label="Latitude" error={errors.latitude} hint="Opcional">
          {(p) => <Input {...p} inputMode="decimal" value={values.latitude} onChange={(e) => set("latitude")(e.target.value)} placeholder="-23.1791" />}
        </Field>
        <Field label="Longitude" error={errors.longitude} hint="Opcional">
          {(p) => <Input {...p} inputMode="decimal" value={values.longitude} onChange={(e) => set("longitude")(e.target.value)} placeholder="-45.8872" />}
        </Field>
      </form>
    </Modal>
  );
}
