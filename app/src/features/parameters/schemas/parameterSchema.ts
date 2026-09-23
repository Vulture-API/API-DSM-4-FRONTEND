import { z } from "zod";
import type { Parameter } from "../types/parameter";

const decimal = z
  .number({ error: "Informe um número válido." })
  .finite()
  .min(-99999999.99, "O valor deve respeitar DECIMAL(10,2).")
  .max(99999999.99, "O valor deve respeitar DECIMAL(10,2).")
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001,
    "Use no máximo duas casas decimais.",
  )
  .nullable();

export function parameterSchema(existing: Parameter[], editingId?: number) {
  return z
    .object({
      nome: z
        .string()
        .trim()
        .min(1, "Informe o nome do parâmetro.")
        .max(50, "Use no máximo 50 caracteres."),
      unidade_medida: z
        .string()
        .trim()
        .min(1, "Informe a unidade de medida.")
        .max(20, "Use no máximo 20 caracteres."),
      fator: decimal,
      ganho: decimal,
    })
    .refine(
      (value) =>
        !existing.some(
          (item) => item.id !== editingId && item.nome === value.nome,
        ),
      {
        path: ["nome"],
        message: "Já existe um parâmetro com esse nome.",
      },
    );
}

// Aceita vírgula ou ponto decimal; vazio representa NULL, nunca zero implícito.
const numericText = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^[+-]?\d+(?:[.,]\d+)?$/.test(value),
    "Informe um número válido.",
  )
  .transform((value) =>
    value === "" ? null : Number(value.replace(",", ".")),
  );

export function parameterFormSchema(existing: Parameter[], editingId?: number) {
  return z
    .object({
      nome: z.string(),
      unidade_medida: z.string(),
      fator: numericText,
      ganho: numericText,
    })
    .pipe(parameterSchema(existing, editingId));
}

export type ParameterFormValues = z.input<
  ReturnType<typeof parameterFormSchema>
>;
