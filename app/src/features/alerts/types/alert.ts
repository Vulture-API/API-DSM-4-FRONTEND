export type AlertType =
  | "Temperatura"
  | "Umidade"
  | "Chuva"
  | "Vento"
  | "Bateria"
  | "Cultura"
  | "Sensor";

export type AlertStatus = "Aberto" | "Em análise" | "Resolvido" | "Crítico";

export interface AlertItem {
  id: string;
  type: AlertType;
  description: string;
  station: string;
  sensor: string;
  timestamp: string;
  isoDate: string;
  status: AlertStatus;
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
