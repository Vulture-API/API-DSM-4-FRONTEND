import {
  initialAlerts,
  sensorsCatalog,
  stationsCatalog,
  type SensorCatalogItem,
  type StationCatalogItem,
} from "../mocks/alertsData";
import type { AlertItem } from "../types/alert";
import {
  resolveAlertListOptions,
  type AlertListOptions,
  type AlertRepository,
  type CreateAlertConfigInput,
  type PaginatedAlerts,
  type UpdateAlertConfigInput,
} from "./AlertRepository";

export class MockAlertRepository implements AlertRepository {
  private alerts: AlertItem[] = [...initialAlerts];
  private stations: StationCatalogItem[] = [...stationsCatalog];
  private sensors: SensorCatalogItem[] = [...sensorsCatalog];

  async listAlerts(options?: AlertListOptions): Promise<PaginatedAlerts> {
    const { page, limit, sensorId, managerUserId } = resolveAlertListOptions(options);

    let filtered = this.alerts;
    if (sensorId > 0) {
      filtered = filtered.filter((a) => a.sensorId === sensorId);
    }
    if (managerUserId > 0) {
      filtered = filtered.filter((a) => a.managerUserId === managerUserId);
    }

    const totalRecords = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return {
      items,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
      },
    };
  }

  async getAlertById(id: number): Promise<AlertItem | null> {
    return this.alerts.find((a) => a.alertConfigId === id) || null;
  }

  async createAlertConfig(input: CreateAlertConfigInput): Promise<AlertItem> {
    const nextConfigId = this.alerts.length > 0 ? Math.max(...this.alerts.map((a) => a.alertConfigId || 0)) + 1 : 1;
    const sensor = this.sensors.find((s) => s.id === input.sensorId) || this.sensors[0];
    const station = this.stations.find((st) => st.id === sensor.stationId) || this.stations[0];

    const today = new Date().toISOString().split("T")[0];
    const nowHours = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const newItem: AlertItem = {
      id: `A-${String(nextConfigId).padStart(3, "0")}`,
      alertConfigId: nextConfigId,
      sensorId: sensor.id,
      sensor: sensor.localIdentifier,
      sensorName: sensor.sensorName,
      unitOfMeasure: sensor.unitOfMeasure,
      comparisonOperator: input.comparisonOperator,
      referenceValue: input.referenceValue,
      readingValue: input.referenceValue * 1.05,
      message: input.message?.trim() || `Alerta configurado para o sensor ${sensor.localIdentifier}`,
      description: input.message?.trim() || `Alerta configurado para o sensor ${sensor.localIdentifier}`,
      active: input.active ?? true,
      stationId: station.id,
      station: station.name,
      property: station.property,
      macAddress: station.macAddress,
      managerUserId: input.managerUserId || 1,
      managerName: input.managerUserId ? `Gestor #${input.managerUserId}` : "Carlos Mendes",
      timestamp: `${today.split("-").reverse().join("/")} - ${nowHours}`,
      isoDate: today,
      status: "Aberto",
      type: sensor.type,
    };

    this.alerts = [newItem, ...this.alerts];
    return newItem;
  }

  async updateAlertConfig(id: number, input: UpdateAlertConfigInput): Promise<AlertItem> {
    const existingIndex = this.alerts.findIndex((a) => a.alertConfigId === id);
    if (existingIndex === -1) {
      throw new Error(`Alerta com ID de configuração ${id} não encontrado.`);
    }

    const sensor = this.sensors.find((s) => s.id === input.sensorId) || this.sensors[0];
    const station = this.stations.find((st) => st.id === sensor.stationId) || this.stations[0];

    const updated: AlertItem = {
      ...this.alerts[existingIndex],
      sensorId: sensor.id,
      sensor: sensor.localIdentifier,
      sensorName: sensor.sensorName,
      unitOfMeasure: sensor.unitOfMeasure,
      comparisonOperator: input.comparisonOperator,
      referenceValue: input.referenceValue,
      message: input.message?.trim() || this.alerts[existingIndex].message,
      description: input.message?.trim() || this.alerts[existingIndex].description,
      active: input.active ?? this.alerts[existingIndex].active,
      stationId: station.id,
      station: station.name,
      property: station.property,
      macAddress: station.macAddress,
      type: sensor.type,
    };

    this.alerts[existingIndex] = updated;
    return updated;
  }

  async deleteAlertConfig(id: number): Promise<void> {
    this.alerts = this.alerts.filter((a) => a.alertConfigId !== id);
  }

  async acknowledgeAlert(id: number): Promise<void> {
    const alert = this.alerts.find((a) => a.alertConfigId === id || a.id === `A-${String(id).padStart(3, "0")}`);
    if (alert) {
      alert.status = "Em análise";
      alert.acknowledgedBy = "Carlos Mendes";
      alert.acknowledgedAt = new Date().toISOString();
    }
  }

  async listStations(): Promise<StationCatalogItem[]> {
    return [...this.stations];
  }

  async listSensors(stationId?: number): Promise<SensorCatalogItem[]> {
    if (stationId) {
      return this.sensors.filter((s) => s.stationId === stationId);
    }
    return [...this.sensors];
  }
}
