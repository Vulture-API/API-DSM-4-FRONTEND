import type {
  ApiAlertConfigDto,
  ApiAlertConfigInputDto,
  ApiSensorDto,
  ApiSensorTypeDto,
  ApiStationDto,
  ApiTriggeredAlertDto,
} from "../dtos/alertApiDto";
import type {
  AlertItem,
  AlertStatus,
  AlertType,
  ComparisonOperator,
} from "../types/alert";
import type {
  SensorCatalogItem,
  StationCatalogItem,
} from "../mocks/alertsData";

export function resolveAlertType(name: string): AlertType {
  const lower = name.toLowerCase();
  if (lower.includes("temp")) return "Temperatura";
  if (lower.includes("umid")) return "Umidade";
  if (lower.includes("chuv") || lower.includes("pluv")) return "Chuva";
  if (lower.includes("vent") || lower.includes("anem")) return "Vento";
  if (lower.includes("bat") || lower.includes("tens")) return "Bateria";
  return "Sensor";
}

export function formatDateTime(isoString: string): { timestamp: string; isoDate: string } {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      const today = new Date().toISOString().split("T")[0];
      return { timestamp: today, isoDate: today };
    }
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const isoDate = `${year}-${month}-${day}`;
    const timestamp = `${day}/${month}/${year} - ${hours}:${minutes}`;
    return { timestamp, isoDate };
  } catch {
    const today = new Date().toISOString().split("T")[0];
    return { timestamp: today, isoDate: today };
  }
}

export function mapApiStation(
  dto: ApiStationDto,
  propertyName?: string
): StationCatalogItem {
  return {
    id: dto.id,
    name: dto.name,
    propertyId: dto.property_id,
    property: propertyName || `Propriedade #${dto.property_id}`,
    macAddress: dto.mac_address,
  };
}

export function mapApiSensor(
  dto: ApiSensorDto,
  sensorType?: ApiSensorTypeDto
): SensorCatalogItem {
  const typeName = sensorType?.name || dto.local_identifier;
  const unit = sensorType?.unit_of_measure || "";
  const alertType = resolveAlertType(typeName);

  let defaultOperator: ComparisonOperator = "<";
  let defaultReference = 20;

  if (alertType === "Temperatura") {
    defaultOperator = ">=";
    defaultReference = 35;
  } else if (alertType === "Chuva") {
    defaultOperator = ">=";
    defaultReference = 50;
  } else if (alertType === "Vento") {
    defaultOperator = ">=";
    defaultReference = 60;
  } else if (alertType === "Bateria") {
    defaultOperator = "<=";
    defaultReference = 3.3;
  }

  return {
    id: dto.id,
    stationId: dto.station_id,
    sensorTypeId: dto.sensor_type_id,
    localIdentifier: dto.local_identifier,
    sensorName: typeName,
    unitOfMeasure: unit,
    type: alertType,
    defaultOperator,
    defaultReference,
  };
}

export interface MapAlertContext {
  sensors?: SensorCatalogItem[];
  stations?: StationCatalogItem[];
  latestTrigger?: ApiTriggeredAlertDto;
}

export function mapApiAlertConfigToAlertItem(
  config: ApiAlertConfigDto,
  context: MapAlertContext = {}
): AlertItem {
  const { sensors = [], stations = [], latestTrigger } = context;

  const sensor = sensors.find((s) => s.id === config.sensor_id);
  const station = sensor ? stations.find((st) => st.id === sensor.stationId) : stations[0];

  const dateSource = latestTrigger?.triggered_at || config.created_at;
  const { timestamp, isoDate } = formatDateTime(dateSource);

  let status: AlertStatus = "Aberto";
  if (!config.active) {
    status = "Resolvido";
  } else if (latestTrigger?.acknowledged_at) {
    status = "Em análise";
  }

  const formattedId = `A-${String(config.id).padStart(3, "0")}`;

  return {
    id: formattedId,
    alertConfigId: config.id,
    triggeredAlertId: latestTrigger?.id,
    sensorId: config.sensor_id,
    sensor: sensor?.localIdentifier || `SEN-${config.sensor_id}`,
    sensorName: sensor?.sensorName || "Sensor",
    unitOfMeasure: sensor?.unitOfMeasure || "",
    comparisonOperator: config.comparison_operator as ComparisonOperator,
    referenceValue: Number(config.reference_value),
    readingId: latestTrigger?.reading_id,
    readingValue: Number(config.reference_value) * 1.05,
    message: config.message || `Limite atingido para o sensor ${sensor?.localIdentifier || config.sensor_id}`,
    description: config.message || `Limite atingido para o sensor ${sensor?.localIdentifier || config.sensor_id}`,
    active: config.active,
    stationId: station?.id || sensor?.stationId || 1,
    station: station?.name || "Estação",
    property: station?.property || "Propriedade",
    macAddress: station?.macAddress || "00:00:00:00:00:00",
    managerUserId: config.manager_user_id || undefined,
    managerName: config.manager_user_id ? `Gestor #${config.manager_user_id}` : undefined,
    triggeredAt: latestTrigger?.triggered_at,
    acknowledgedBy: latestTrigger?.acknowledged_by ? `Usuário #${latestTrigger.acknowledged_by}` : undefined,
    acknowledgedAt: latestTrigger?.acknowledged_at || undefined,
    timestamp,
    isoDate,
    status,
    type: sensor?.type || "Sensor",
  };
}

export function mapAlertItemToApiConfigInput(
  item: {
    sensorId: number;
    referenceValue: number;
    comparisonOperator: ComparisonOperator;
    message?: string;
    active?: boolean;
    managerUserId?: number;
  }
): ApiAlertConfigInputDto {
  return {
    sensor_id: item.sensorId,
    reference_value: item.referenceValue,
    comparison_operator: item.comparisonOperator,
    message: item.message?.trim() || null,
    active: item.active ?? true,
    manager_user_id: item.managerUserId ?? null,
  };
}
