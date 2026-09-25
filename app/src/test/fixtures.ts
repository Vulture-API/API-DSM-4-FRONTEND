import type { AlertRule, TriggeredAlert } from "@/features/alerts/api";
import type { Sensor, SensorType } from "@/features/parameters/api";
import type { Overview, Property, Station, StationOverview } from "@/features/stations/api";
import type { Role, User } from "@/features/users/api";

const nowSeconds = () => Math.floor(Date.now() / 1000);
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export const properties: Property[] = [
  { id: 1, name: "Fazenda Santa Rita", location: "SJC" },
  { id: 2, name: "Sítio Água Limpa", location: "Pinda" },
];

export const stations: Station[] = [
  { id: 1, property_id: 1, mac_address: "00:1A:2B:3C:4D:01", name: "Estação Sede", latitude: -23.1, longitude: -45.8, last_communication_at: minutesAgo(1), created_at: minutesAgo(9999) },
  { id: 2, property_id: 1, mac_address: "00:1A:2B:3C:4D:02", name: "Estação Pivô", latitude: null, longitude: null, last_communication_at: minutesAgo(2), created_at: minutesAgo(9999) },
  { id: 3, property_id: 2, mac_address: "00:1A:2B:3C:4D:03", name: "Estação Brejo", latitude: null, longitude: null, last_communication_at: minutesAgo(300), created_at: minutesAgo(9999) },
];

export const sensorTypes: SensorType[] = [
  { id: 1, name: "Temperatura", unit_of_measure: "°C", factor: null, gain: null },
  { id: 2, name: "Umidade", unit_of_measure: "%", factor: 1.5, gain: 2 },
];

export const sensors: Sensor[] = [
  { id: 10, station_id: 1, sensor_type_id: 1, local_identifier: "temp", operational_status: true, created_at: minutesAgo(9999) },
  { id: 11, station_id: 1, sensor_type_id: 2, local_identifier: "umid", operational_status: false, created_at: minutesAgo(9999) },
  { id: 20, station_id: 2, sensor_type_id: 1, local_identifier: "temp", operational_status: true, created_at: minutesAgo(9999) },
];

function overviewStation(
  station: Station,
  status: StationOverview["status"],
  activeAlerts: number,
  readings: Array<[number, string, string, number]>,
): StationOverview {
  return {
    id: station.id,
    name: station.name,
    mac_address: station.mac_address,
    property_id: station.property_id,
    property_name: properties.find((p) => p.id === station.property_id)!.name,
    latitude: station.latitude,
    longitude: station.longitude,
    last_communication_at: station.last_communication_at,
    sensors_total: 2,
    sensors_active: 1,
    active_alerts: activeAlerts,
    status,
    latest_readings: readings.map(([sensorId, type, unit, value]) => ({
      sensor_id: sensorId,
      local_identifier: type.slice(0, 4).toLowerCase(),
      sensor_type_id: type === "Temperatura" ? 1 : 2,
      sensor_type: type,
      unit_of_measure: unit,
      value,
      unix_time: nowSeconds() - 60,
    })),
  };
}

export const overview: Overview = {
  generated_at: new Date().toISOString(),
  offline_threshold_minutes: 10,
  summary: { total: 3, online: 1, with_alert: 1, offline: 1 },
  stations: [
    overviewStation(stations[0]!, "Online", 0, [
      [10, "Temperatura", "°C", 24],
      [11, "Umidade", "%", 60],
    ]),
    overviewStation(stations[1]!, "Com alerta", 2, [[20, "Temperatura", "°C", 30]]),
    overviewStation(stations[2]!, "Offline", 0, []),
  ],
};

export const series = {
  from: minutesAgo(1440),
  to: minutesAgo(0),
  bucket_minutes: 30,
  series: [
    { sensor_type_id: 1, sensor_type: "Temperatura", unit_of_measure: "°C", points: [{ t: nowSeconds() - 3600, avg: 22, min: 20, max: 24 }, { t: nowSeconds(), avg: 25, min: 24, max: 26 }] },
    { sensor_type_id: 2, sensor_type: "Umidade", unit_of_measure: "%", points: [{ t: nowSeconds(), avg: 60, min: 55, max: 65 }] },
  ],
};

export const roles: Role[] = [
  { id: 1, name: "Administrador", description: null },
  { id: 2, name: "Cliente", description: null },
];

export const users: User[] = [
  { id: 1, role_id: 1, name: "Mariana Albuquerque", email: "mariana@agritech.dev", active: true, created_at: minutesAgo(9999) },
  { id: 2, role_id: 2, name: "Carlos Mendes", email: "carlos@agritech.dev", active: true, created_at: minutesAgo(9999) },
  { id: 3, role_id: 2, name: "Paulo Dias", email: "paulo@agritech.dev", active: false, created_at: minutesAgo(9999) },
];

export const rules: AlertRule[] = [
  { id: 1, manager_user_id: 2, sensor_id: 10, reference_value: 28.5, comparison_operator: ">", message: "Temperatura alta na sede", active: true, created_at: minutesAgo(9999) },
  { id: 2, manager_user_id: null, sensor_id: 11, reference_value: 40, comparison_operator: "<", message: "Ar seco", active: false, created_at: minutesAgo(9999) },
];

export const triggered: TriggeredAlert[] = [
  { id: 100, alert_config_id: 1, reading_id: 5, acknowledged_by: null, triggered_at: minutesAgo(5), acknowledged_at: null, reading_value: 30.2, reading_unix_time: nowSeconds() - 300 },
  { id: 101, alert_config_id: 2, reading_id: 6, acknowledged_by: null, triggered_at: minutesAgo(90), acknowledged_at: null, reading_value: null, reading_unix_time: null },
];

export const acknowledgedAlerts: TriggeredAlert[] = [
  { id: 90, alert_config_id: 1, reading_id: 4, acknowledged_by: 1, triggered_at: minutesAgo(600), acknowledged_at: minutesAgo(570), reading_value: 29, reading_unix_time: nowSeconds() - 36000 },
];
