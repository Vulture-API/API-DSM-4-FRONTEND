import type { AlertItem, ComparisonOperator } from "../types/alert";
import type { SensorCatalogItem, StationCatalogItem } from "../mocks/alertsData";

export type AlertListOptions = {
  page?: number;
  limit?: number;
  sensorId?: number;
  managerUserId?: number;
};

export type AlertPagination = {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
};

export type PaginatedAlerts = {
  items: AlertItem[];
  pagination: AlertPagination;
};

export type CreateAlertConfigInput = {
  sensorId: number;
  referenceValue: number;
  comparisonOperator: ComparisonOperator;
  message?: string;
  active?: boolean;
  managerUserId?: number;
};

export type UpdateAlertConfigInput = {
  sensorId: number;
  referenceValue: number;
  comparisonOperator: ComparisonOperator;
  message?: string;
  active?: boolean;
  managerUserId?: number;
};

export const DEFAULT_ALERTS_PAGE = 1;
export const DEFAULT_ALERTS_LIMIT = 50;

export function resolveAlertListOptions(
  options: AlertListOptions = {},
): Required<AlertListOptions> {
  const page = options.page ?? DEFAULT_ALERTS_PAGE;
  const limit = options.limit ?? DEFAULT_ALERTS_LIMIT;
  const sensorId = options.sensorId ?? 0;
  const managerUserId = options.managerUserId ?? 0;

  if (!Number.isInteger(page) || page < 1) {
    throw new RangeError("A página deve ser um inteiro maior ou igual a 1.");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new RangeError("O limite deve ser um inteiro entre 1 e 100.");
  }

  return { page, limit, sensorId, managerUserId };
}

export interface AlertRepository {
  listAlerts(options?: AlertListOptions): Promise<PaginatedAlerts>;
  getAlertById(id: number): Promise<AlertItem | null>;
  createAlertConfig(input: CreateAlertConfigInput): Promise<AlertItem>;
  updateAlertConfig(id: number, input: UpdateAlertConfigInput): Promise<AlertItem>;
  deleteAlertConfig(id: number): Promise<void>;
  acknowledgeAlert(id: number): Promise<void>;
  listStations(): Promise<StationCatalogItem[]>;
  listSensors(stationId?: number): Promise<SensorCatalogItem[]>;
}
