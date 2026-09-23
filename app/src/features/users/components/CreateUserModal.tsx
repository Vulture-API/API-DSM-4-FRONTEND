"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ZodError } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { Icon } from "@/components/ui/Icon/Icon";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import type { UserRepository } from "../repositories/UserRepository";
import { Modal } from "@/components/ui/Modal/Modal";

import {
  createUserSchema,
  type CreateUserFormValues,
} from "../schemas/createUserSchema";

import type { Cargo, UserListItem } from "../types/user";

import styles from "./CreateUserModal.module.css";

type CreateUserModalProps = {
  open: boolean;
  cargos: Cargo[];
  busy?: boolean;
  returnFocus?: HTMLElement | null;
  onClose: () => void;
  repository: UserRepository;
  onCreated: (user: UserListItem) => void;
};

const defaultValues: CreateUserFormValues = {
  nome: "",
  email: "",
  cargo_id: 0,
  senha: "",
  ativo: true,
};

export function CreateUserModal({
  open,
  cargos,
  busy = false,
  returnFocus,
  onClose,
  repository,
  onCreated,
}: CreateUserModalProps) {
  const id = useId();
  const submitLock = useRef(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    setError,
    clearErrors,
    setFocus,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) setFocus("nome");
    else reset(defaultValues);
  }, [open, reset, setFocus]);

  if (!open) {
    return null;
  }

  const submitting = busy || isSubmitting;

  async function submit(values: CreateUserFormValues) {
    clearErrors("root");
    try {
      const user = await repository.create(values);
      reset(defaultValues);
      onCreated(user);
    } catch (error) {
      if (error instanceof ZodError) {
        for (const issue of error.issues) {
          setError(issue.path[0] as keyof CreateUserFormValues, { message: issue.message });
        }
      } else {
        setError("root", { message: "Não foi possível cadastrar o usuário. Tente novamente." });
      }
    }
  }

  return (
    <Modal
      title="Novo usuário"
      onClose={onClose}
      busy={submitting}
      returnFocus={returnFocus ? () => returnFocus : undefined}
      size="form"
      closeLabel="Fechar cadastro de usuário"
    >
      <form
        className={styles.form}
        aria-busy={submitting}
        onSubmit={(event) => {
          if (submitLock.current || submitting) { event.preventDefault(); return; }
          submitLock.current = true;
          void handleSubmit(submit)(event).finally(() => { submitLock.current = false; });
        }}
        noValidate
      >
        <p className={styles.description}>
          Cadastre um usuário para acesso ao portal.
        </p>

        <section
          className={styles.section}
          aria-labelledby={`${id}-information`}
        >
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} aria-hidden="true">
              <Icon name="users" />
            </div>

            <div>
              <h3
                id={`${id}-information`}
                className={styles.sectionTitle}
              >
                Informações do usuário
              </h3>

              <p className={styles.sectionDescription}>
                Dados básicos para identificação no sistema.
              </p>
            </div>
          </div>

          <div className={styles.fields}>
            <Input
              label="Nome completo"
              required
              placeholder="Digite o nome completo do usuário..."
              autoComplete="name"
              error={errors.nome?.message}
              disabled={submitting}
              {...register("nome")}
            />

            <Input
              label="E-mail"
              type="email"
              required
              placeholder="exemplo@dominio.com"
              autoComplete="email"
              error={errors.email?.message}
              disabled={submitting}
              {...register("email")}
            />

            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${id}-role`}>
                Cargo <span aria-hidden="true">*</span>
              </label>

              <select
                id={`${id}-role`}
                className={`${styles.select} ${
                  errors.cargo_id ? styles.invalid : ""
                }`}
                aria-invalid={Boolean(errors.cargo_id)}
                aria-describedby={
                  errors.cargo_id ? `${id}-role-error` : undefined
                }
                disabled={submitting}
                required
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
                  id={`${id}-role-error`}
                  className={styles.error}
                  role="alert"
                >
                  {errors.cargo_id.message}
                </span>
              )}
            </div>
          </div>
        </section>

        <section
          className={styles.section}
          aria-labelledby={`${id}-access`}
        >
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} aria-hidden="true">
              <Icon name="lock" />
            </div>

            <div>
              <h3 id={`${id}-access`} className={styles.sectionTitle}>
                Acesso
              </h3>

              <p className={styles.sectionDescription}>
                Defina a senha de acesso e o status do usuário.
              </p>
            </div>
          </div>

          <div className={styles.accessGrid}>
            <div className={styles.password}>
              <Input
                label="Senha"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Digite uma senha..."
                autoComplete="new-password"
                error={errors.senha?.message}
                disabled={submitting}
                {...register("senha")}
              />
              <div className={styles.passwordToggle}>
                <IconButton
                  label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  disabled={submitting}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} />
                </IconButton>
              </div>
            </div>
            <Controller
              name="ativo"
              control={control}
              render={({ field }) => (
                <fieldset className={styles.statusFieldset} disabled={submitting}>
                  <legend className={styles.label}>Status</legend>
                  <div className={styles.statusOptions}>
                    <label className={styles.radioLabel}>
                      <input type="radio" name={field.name} ref={field.ref}
                        value="true" checked={field.value === true}
                        onChange={() => field.onChange(true)} onBlur={field.onBlur} />
                      <span>Ativo</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name={field.name}
                        value="false" checked={field.value === false}
                        onChange={() => field.onChange(false)} onBlur={field.onBlur} />
                      <span>Inativo</span>
                    </label>
                  </div>
                </fieldset>
              )}
            />
          </div>
        </section>

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
            {submitting ? "Cadastrando..." : "Cadastrar usuário"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}