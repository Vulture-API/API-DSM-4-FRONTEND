"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

import { useUsers } from "@/features/users/hooks";

import type { Property, PropertyInput } from "./api";
import { useCreateProperty, useUpdateProperty } from "./hooks";

type Values = {
  name: string;
  location: string;
  owner_user_id: string;
};

type Errors = Partial<Record<keyof Values, string>>;

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.name.trim() || values.name.trim().length < 3) {
    errors.name = "Informe o nome da propriedade com pelo menos 3 caracteres.";
  }
  if (!values.owner_user_id) {
    errors.owner_user_id = "Selecione o responsável pela propriedade.";
  }
  return errors;
}

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
  const usersQuery = useUsers();
  const toast = useToast();

  const users = usersQuery.data ?? [];

  const [values, setValues] = useState<Values>(() => ({
    name: property?.name ?? "",
    location: property?.location ?? "",
    owner_user_id: String(property?.owner_user_id ?? property?.owner_id ?? 38),
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
      owner_user_id: Number(values.owner_user_id) || 1,
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

        <Field label="Responsável *" error={errors.owner_user_id}>
          {(p) => (
            <Select
              {...p}
              value={values.owner_user_id}
              onChange={(e) => set("owner_user_id")(e.target.value)}
            >
              {users.length > 0 ? (
                users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))
              ) : (
                <option value={values.owner_user_id || 1}>
                  Carregando responsáveis...
                </option>
              )}
            </Select>
          )}
        </Field>
      </form>
    </Modal>
  );
}
