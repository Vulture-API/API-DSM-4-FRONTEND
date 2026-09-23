"use client";

import { ZodError } from "zod";
import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { Modal } from "@/components/ui/Modal/Modal";

import {
  editUserSchema,
  type EditUserFormValues,
} from "../schemas/editUserSchema";
import type { Cargo, UserListItem } from "../types/user";

import styles from "./EditUserModal.module.css";

type EditUserModalProps = {
  open: boolean;
  user: UserListItem;
  cargos: Cargo[];
  busy?: boolean;
  returnFocus?: HTMLElement | null;
  onClose: () => void;
  onSubmit: (values: EditUserFormValues) => Promise<void> | void;
};

export function EditUserModal({
  open,
  user,
  cargos,
  busy = false,
  returnFocus,
  onClose,
  onSubmit,
}: EditUserModalProps) {
  const submitLock = useRef(false);
  const {
    setError,
    clearErrors,
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      nome: user.nome,
      cargo_id: user.cargo_id,
      ativo: user.ativo,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        nome: user.nome,
        cargo_id: user.cargo_id,
        ativo: user.ativo,
      });
    }
  }, [open, reset, user]);

  if (!open) {
    return null;
  }

  const submitting = busy || isSubmitting;

  return (
    <Modal
      title="Editar usuário"
      onClose={onClose}
      busy={submitting}
      returnFocus={returnFocus ? () => returnFocus : undefined}
    >
      <form
        className={styles.form}
        onSubmit={(event) => {
          if (submitLock.current || submitting) { event.preventDefault(); return; }
          submitLock.current = true;
          void handleSubmit(async (values) => {
            clearErrors("root");
            try { await onSubmit(values); } catch (error) {
              if (error instanceof ZodError) {
                for (const issue of error.issues) {
                  setError(issue.path[0] as keyof EditUserFormValues, { message: issue.message });
                }
              } else {
                setError("root", { message: "Não foi possível atualizar o usuário. Tente novamente." });
              }
            }
          })(event).finally(() => { submitLock.current = false; });
        }}
        aria-busy={submitting}
        noValidate
      >
        <p className={styles.description}>
          Atualize as informações do usuário.
        </p>

        <Input
          label="Nome completo"
          required
          autoComplete="name"
          error={errors.nome?.message}
          disabled={submitting}
          {...register("nome")}
        />

        <div className={styles.field}>
          <label className={styles.label} htmlFor="edit-user-role">
            Cargo <span aria-hidden="true">*</span>
          </label>

          <select
            id="edit-user-role"
            className={`${styles.select} ${
              errors.cargo_id ? styles.invalid : ""
            }`}
            aria-invalid={Boolean(errors.cargo_id)}
            aria-describedby={
              errors.cargo_id ? "edit-user-role-error" : undefined
            }
            disabled={submitting}
            {...register("cargo_id", { valueAsNumber: true })}
          >
            <option value={0}>Selecione o cargo</option>
            {cargos.map((cargo) => (
              <option key={cargo.id} value={cargo.id}>
                {cargo.nome}
              </option>
            ))}
          </select>

          {errors.cargo_id && (
            <span
              id="edit-user-role-error"
              className={styles.error}
              role="alert"
            >
              {errors.cargo_id.message}
            </span>
          )}
        </div>

        <Controller
          control={control}
          name="ativo"
          render={({ field }) => (
            <fieldset className={styles.statusFieldset}>
              <legend className={styles.label}>Status</legend>

              <div className={styles.statusOptions}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name={field.name}
                    onBlur={field.onBlur}
                    checked={field.value === true}
                    onChange={() => field.onChange(true)}
                    disabled={submitting}
                  />
                  <span>Ativo</span>
                </label>

                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name={field.name}
                    onBlur={field.onBlur}
                    checked={field.value === false}
                    onChange={() => field.onChange(false)}
                    disabled={submitting}
                  />
                  <span>Inativo</span>
                </label>
              </div>
            </fieldset>
          )}
        />

        <div className={styles.emailNotice}>
          <strong>E-mail de acesso</strong>
          <span>{user.email ?? "Não informado"}</span>
          <small>
            O e-mail é somente leitura.
          </small>
        </div>

        {errors.root && <p role="alert" className={styles.error}>{errors.root.message}</p>}
        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>

          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
