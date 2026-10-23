"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

import type { Property, PropertyInput } from "./api";
import { useCreateProperty, useUpdateProperty } from "./hooks";

type Values = {
  name: string;
  location: string;
  owner: string;
};

type Errors = Partial<Record<keyof Values, string>>;

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.name.trim() || values.name.trim().length < 3) {
    errors.name = "Informe o nome da propriedade com pelo menos 3 caracteres.";
  }
  return errors;
}

const DEFAULT_OWNERS = [
  "Mariana Albuquerque",
  "Carlos Mendes",
  "Juliana Prado",
  "Tiago Ribeiro",
  "Aline Camargo",
];

export function PropertyFormModal({
  open,
  property,
  onClose,
}: {
  open: boolean;
  property?: Property | undefined;
  onClose: () => void;
}) {
  const create = useCreateProperty();
  const update = useUpdateProperty();
  const toast = useToast();

  const [values, setValues] = useState<Values>(() => ({
    name: property?.name ?? "",
    location: property?.location ?? "",
    owner: property?.owner ?? DEFAULT_OWNERS[0]!,
  }));

  const [errors, setErrors] = useState<Errors>({});

  const set = (key: keyof Values) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    const input: PropertyInput = {
      name: values.name.trim(),
      location: values.location.trim() || null,
      owner: values.owner,
    };

    try {
      if (property) {
        await update.mutateAsync({ id: property.id, data: input });
        toast.success(`Propriedade "${input.name}" atualizada com sucesso.`);
      } else {
        await create.mutateAsync(input);
        toast.success(`Propriedade "${input.name}" cadastrada com sucesso.`);
      }
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={property ? "Editar propriedade" : "Nova propriedade"}
      description="Preencha os dados de identificação, localização e responsável da propriedade agrícola."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="property-form" loading={isPending}>
            {property ? "Salvar alterações" : "Cadastrar propriedade"}
          </Button>
        </>
      }
    >
      <form id="property-form" onSubmit={submit} noValidate className="space-y-4">
        <Field label="Nome da propriedade *" error={errors.name}>
          {(p) => (
            <Input
              {...p}
              value={values.name}
              onChange={(e) => set("name")(e.target.value)}
              placeholder="Ex.: Fazenda Santa Rita"
            />
          )}
        </Field>

        <Field label="Localização (Município - UF)" error={errors.location} hint="Opcional">
          {(p) => (
            <Input
              {...p}
              value={values.location}
              onChange={(e) => set("location")(e.target.value)}
              placeholder="Ex.: São José dos Campos - SP"
            />
          )}
        </Field>

        <Field label="Responsável *" error={errors.owner}>
          {(p) => (
            <Select
              {...p}
              value={values.owner}
              onChange={(e) => set("owner")(e.target.value)}
            >
              {DEFAULT_OWNERS.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </form>
    </Modal>
  );
}
