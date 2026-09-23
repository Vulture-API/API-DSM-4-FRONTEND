"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodError } from "zod";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import {
  parameterFormSchema,
  type ParameterFormValues,
} from "../schemas/parameterSchema";
import type { Parameter, ParameterValues } from "../types/parameter";
import styles from "./ParameterForm.module.css";

export function ParameterForm({
  existing,
  parameter,
  onSave,
  onCancel,
}: {
  existing: Parameter[];
  parameter?: Parameter;
  onSave: (values: ParameterValues) => Promise<void>;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ParameterFormValues, unknown, ParameterValues>({
    resolver: zodResolver(parameterFormSchema(existing, parameter?.id)),
    defaultValues: {
      nome: parameter?.nome ?? "",
      unidade_medida: parameter?.unidade_medida ?? "",
      fator: parameter?.fator?.toString().replace(".", ",") ?? "",
      ganho: parameter?.ganho?.toString().replace(".", ",") ?? "",
    },
  });
  const submit = handleSubmit(async (values) => {
    try {
      await onSave(values);
    } catch (error) {
      if (error instanceof ZodError) {
        for (const issue of error.issues)
          setError(issue.path[0] as keyof ParameterFormValues, {
            message: issue.message,
          });
      } else
        setError("root", {
          message: "Não foi possível salvar o parâmetro. Tente novamente.",
        });
    }
  });
  return (
    <form
      onSubmit={submit}
      noValidate
      className={styles.form}
      aria-busy={isSubmitting}
    >
      <fieldset disabled={isSubmitting} className={styles.fields}>
        <Input
          label="Nome do parâmetro"
          required
          placeholder="Ex.: Temperatura"
          error={errors.nome?.message}
          {...register("nome")}
        />
        <Input
          label="Unidade de medida"
          required
          placeholder="Ex.: °C, %, mm, m/s, hPa"
          error={errors.unidade_medida?.message}
          {...register("unidade_medida")}
        />
        <Input
          label="Fator"
          inputMode="decimal"
          placeholder="Ex.: 1,00"
          hint="Fator técnico padrão do tipo de sensor. Opcional."
          error={errors.fator?.message}
          {...register("fator")}
        />
        <Input
          label="Ganho"
          inputMode="decimal"
          placeholder="Ex.: 1,00"
          hint="Ganho técnico padrão do tipo de sensor. Opcional."
          error={errors.ganho?.message}
          {...register("ganho")}
        />
      </fieldset>
      {errors.root && (
        <p role="alert" className={styles.error}>
          {errors.root.message}
        </p>
      )}
      <div className={styles.footer}>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Icon name="save" />
          {isSubmitting ? "Salvando..." : "Salvar parâmetro"}
        </Button>
      </div>
    </form>
  );
}
