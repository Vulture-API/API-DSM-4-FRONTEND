"use client";

import { type FormEvent, useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Switch } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

import type { User } from "./api";
import { useCreateUser, useRoles, useUpdateUser } from "./hooks";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function UserFormModal({ user, onClose }: { user?: User | undefined; onClose: () => void }) {
  const formId = useId();
  const roles = useRoles();
  const create = useCreateUser();
  const update = useUpdateUser();
  const toast = useToast();
  const [values, setValues] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role_id: user ? String(user.role_id) : "",
    active: user?.active ?? true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values, string>>>({});
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found: typeof errors = {};
    if (!values.name.trim()) found.name = "Informe o nome.";
    if (!values.role_id) found.role_id = "Escolha o cargo.";
    if (!user && !EMAIL.test(values.email.trim())) found.email = "E-mail inválido.";
    if (!user && values.password.length < 8) found.password = "Mínimo de 8 caracteres.";
    setErrors(found);
    if (Object.keys(found).length) return;
    try {
      if (user) {
        await update.mutateAsync({
          id: user.id,
          input: { name: values.name.trim(), role_id: Number(values.role_id), active: values.active },
        });
        toast.success("Usuário atualizado.");
      } else {
        await create.mutateAsync({
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
          role_id: Number(values.role_id),
          active: values.active,
        });
        toast.success("Usuário cadastrado.");
      }
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={user ? "Editar usuário" : "Novo usuário"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="user-form" loading={create.isPending || update.isPending}>
            {user ? "Salvar" : "Cadastrar"}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} noValidate className="grid gap-4">
        <Field label="Nome completo" error={errors.name}>
          {(p) => <Input {...p} value={values.name} onChange={(e) => set("name", e.target.value)} />}
        </Field>
        <Field label="E-mail" error={errors.email} hint={user ? "O e-mail não pode ser alterado." : undefined}>
          {(p) => (
            <Input {...p} type="email" value={values.email} disabled={Boolean(user)} onChange={(e) => set("email", e.target.value)} />
          )}
        </Field>
        {!user && (
          <Field label="Senha" error={errors.password} hint="Mínimo de 8 caracteres.">
            {(p) => (
              <Input {...p} type="password" autoComplete="new-password" value={values.password} onChange={(e) => set("password", e.target.value)} />
            )}
          </Field>
        )}
        <Field label="Cargo" error={errors.role_id}>
          {(p) => (
            <Select {...p} value={values.role_id} onChange={(e) => set("role_id", e.target.value)}>
              <option value="">Selecione…</option>
              {roles.data?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="flex items-center gap-3">
          <Switch labelledBy={`${formId}-user-active`} checked={values.active} onChange={(value) => set("active", value)} />
          <span id={`${formId}-user-active`} className="text-sm text-ink">
            Usuário ativo
          </span>
        </div>
      </form>
    </Modal>
  );
}
