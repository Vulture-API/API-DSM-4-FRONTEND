// Calibração dos sensores (SCRUM-602). A estação envia a leitura bruta e o
// sistema converte: valor = bruto × fator × ganho + offset. Campo vazio não
// altera a leitura; ganho e offset do sensor valem no lugar dos do tipo.

export type TypeCalibration = {
  factor?: number | null | undefined;
  gain?: number | null | undefined;
  offset_value?: number | null | undefined;
};

export type SensorCalibration = {
  gain?: number | null | undefined;
  offset_value?: number | null | undefined;
};

/** Texto do formulário para número: vazio é null; texto inválido é NaN. */
export function parseCalibration(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  return /^[+-]?(\d+([.,]\d*)?|[.,]\d+)$/.test(trimmed) ? Number(trimmed.replace(",", ".")) : Number.NaN;
}

/** Fator e ganho multiplicam a leitura: zero apagaria toda medição. */
export function multiplierError(text: string): string | undefined {
  const value = parseCalibration(text);
  if (value === null) return undefined;
  if (!Number.isFinite(value)) return "Número inválido.";
  return value === 0 ? "Não pode ser zero." : undefined;
}

export function offsetError(text: string): string | undefined {
  const value = parseCalibration(text);
  return value === null || Number.isFinite(value) ? undefined : "Número inválido.";
}

export const calibrationText = (value: number | null | undefined) => (value === null || value === undefined ? "" : String(value).replace(".", ","));

export type EffectiveCalibration = {
  factor: number | null;
  gain: number | null;
  offset_value: number | null;
  /** O ganho ou o offset em uso foi informado no próprio sensor. */
  fromSensor: boolean;
};

export function effectiveCalibration(sensor: SensorCalibration, type: TypeCalibration | undefined): EffectiveCalibration {
  const sensorGain = sensor.gain ?? null;
  const sensorOffset = sensor.offset_value ?? null;
  return {
    factor: type?.factor ?? null,
    gain: sensorGain ?? type?.gain ?? null,
    offset_value: sensorOffset ?? type?.offset_value ?? null,
    fromSensor: sensorGain !== null || sensorOffset !== null,
  };
}

// Um ganho de conversor analógico tem muitas casas (3,3 V / 4095 = 0,000805…).
const calibrationFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 12 });

/** Partes para exibição, na ordem da conta; vazio quando não há calibração. */
export function calibrationParts(calibration: TypeCalibration): string[] {
  const parts: string[] = [];
  if (calibration.factor != null) parts.push(`fator ${calibrationFormat.format(calibration.factor)}`);
  if (calibration.gain != null) parts.push(`ganho ${calibrationFormat.format(calibration.gain)}`);
  if (calibration.offset_value != null) parts.push(`offset ${calibrationFormat.format(calibration.offset_value)}`);
  return parts;
}

/** Valor que o sistema grava para uma leitura bruta. */
export function convertReading(raw: number, calibration: TypeCalibration): number {
  return raw * (calibration.factor ?? 1) * (calibration.gain ?? 1) + (calibration.offset_value ?? 0);
}
