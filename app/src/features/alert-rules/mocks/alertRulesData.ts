import type { AlertRule, OperatorOption } from "../types/alertRule";

export const initialAlertRules: AlertRule[] = [
  {
    id: 1,
    sensorType: "Temperatura",
    operator: ">",
    value: 35,
    message: "Risco de estresse térmico na plantação",
    active: true,
    stations: ["Estação 01", "Estação 02"],
    sensor_id: "Temperatura",
    reference_value: 35,
    comparison_operator: ">",
  },
  {
    id: 2,
    sensorType: "Umidade",
    operator: "<",
    value: 30,
    message: "Solo com baixa umidade, avaliar irrigação",
    active: true,
    stations: ["Todas as estações"],
    sensor_id: "Umidade",
    reference_value: 30,
    comparison_operator: "<",
  },
  {
    id: 3,
    sensorType: "Velocidade do Vento",
    operator: ">=",
    value: 60,
    message: "Condição de vento perigosa para pulverização",
    active: false,
    stations: ["Estação A - Parreirais"],
    sensor_id: "Velocidade do Vento",
    reference_value: 60,
    comparison_operator: ">=",
  },
];

export const sensorOptions: string[] = [
  "Temperatura",
  "Umidade",
  "Velocidade do Vento",
  "Chuva",
];

export const sensorUnits: Record<string, string> = {
  Temperatura: "°C",
  Umidade: "%",
  "Velocidade do Vento": "km/h",
  Chuva: "mm",
};

export const operatorOptions: OperatorOption[] = [
  { label: "maior que", value: ">" },
  { label: "menor que", value: "<" },
  { label: "maior ou igual", value: ">=" },
  { label: "menor ou igual", value: "<=" },
  { label: "igual a", value: "=" },
  { label: "diferente de", value: "!=" },
];

export const availableStations: string[] = [
  "Estação 01",
  "Estação 02",
  "Estação 03",
  "Estação A - Parreirais",
  "Fazenda Santa Rita",
  "Fazenda Boa Vista",
  "Todas as estações",
];

export function formatCondition(
  sensor: string,
  operator: string,
  value: number
): string {
  const unit = sensorUnits[sensor] || "";
  const unitSuffix = unit ? (unit.startsWith("°") || unit === "%" ? unit : ` ${unit}`) : "";
  return `${sensor} ${operator} ${value}${unitSuffix}`;
}
