// Limites físicos do tipo de sensor (SCRUM-636). Leitura fora da faixa é gravada
// como inconsistente. O limite do sensor, quando definido, substitui o do tipo.

import { parseCalibration } from "./calibration";

export type TypeLimits = {
  min_value?: number | null | undefined;
  max_value?: number | null | undefined;
};

const limitFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 6 });

/** Texto da lista: "0 a 100 %", "mínimo 0 mm", "máximo 50 °C" ou "Sem limites". */
export function limitsText(limits: TypeLimits, unit: string): string {
  const min = limits.min_value ?? null;
  const max = limits.max_value ?? null;
  const suffix = unit ? ` ${unit}` : "";
  if (min !== null && max !== null) return `${limitFormat.format(min)} a ${limitFormat.format(max)}${suffix}`;
  if (min !== null) return `mínimo ${limitFormat.format(min)}${suffix}`;
  if (max !== null) return `máximo ${limitFormat.format(max)}${suffix}`;
  return "Sem limites";
}

/** Erros dos campos de mínimo e máximo; vazio é aceito (sem limite). */
export function limitsErrors(minText: string, maxText: string): { min_value?: string; max_value?: string } {
  const errors: { min_value?: string; max_value?: string } = {};
  const min = parseCalibration(minText);
  const max = parseCalibration(maxText);
  if (min !== null && !Number.isFinite(min)) errors.min_value = "Número inválido.";
  if (max !== null && !Number.isFinite(max)) errors.max_value = "Número inválido.";
  if (!errors.min_value && !errors.max_value && min !== null && max !== null && min > max) {
    errors.min_value = "O mínimo não pode ser maior que o máximo.";
  }
  return errors;
}
