export type ComparisonOperator = ">" | "<" | ">=" | "<=" | "=" | "!=";

export type AlertType =
  | "Temperatura"
  | "Umidade"
  | "Chuva"
  | "Vento"
  | "Bateria"
  | "Sensor";

export type AlertStatus = "Aberto" | "Em análise" | "Resolvido" | "Crítico";

export interface AlertItem {
  id: string;
  alertConfigId: number;
  sensorId: number;
  sensor: string;
  sensorName: string;
  unitOfMeasure: string;
  comparisonOperator: ComparisonOperator;
  referenceValue: number;
  message: string;
  description: string;
  active: boolean;
  stationId: number;
  station: string;
  property: string;
  macAddress?: string;
  managerUserId?: number;
  managerName?: string;
  readingId?: number;
  readingValue?: number;
  triggeredAt?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  timestamp: string;
  isoDate: string;
  status: AlertStatus;
  type: AlertType;
}

export interface AlertSummaryStats {
  total: number;
  totalChange: string;
  warnings: number;
  critical: number;
  resolved: number;
}

export interface AlertFiltersState {
  search: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface StationAlertRank {
  position: number;
  stationName: string;
  propertyName: string;
  alertCount: number;
}
