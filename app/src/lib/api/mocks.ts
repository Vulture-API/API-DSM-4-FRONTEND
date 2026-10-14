import type { AlertRule, TriggeredAlert } from "@/features/alerts/api";
import type { Sensor, SensorType } from "@/features/parameters/api";
import type { Reading } from "@/features/readings/api";
import type {
  CurrentData,
  ForecastDay,
  Overview,
  Property,
  ReadingSeries,
  SensorTypeStatistics,
  Station,
  StationForecast,
  StationStatusResponse,
  Statistics,
} from "@/features/stations/api";
import type { Role, User } from "@/features/users/api";

// Base temporal determinística e estável para eliminar hydration mismatch no SSR do Next.js
export const BASE_MOCK_TIME_SEC = 1791936000; // 2026-10-13 21:00 BRT
export const BASE_MOCK_TIME_MS = BASE_MOCK_TIME_SEC * 1000;
export const BASE_MOCK_ISO = "2026-10-14T00:00:00.000Z";

const nowSeconds = () => BASE_MOCK_TIME_SEC;
const minutesAgo = (m: number) => new Date(BASE_MOCK_TIME_MS - m * 60_000).toISOString();

export const mockProperties: Property[] = [
  { id: 1, name: "Fazenda Santa Rita", location: "São José dos Campos - SP" },
  { id: 2, name: "Sítio Água Limpa", location: "Pindamonhangaba - SP" },
];

export const mockStations: Station[] = [
  {
    id: 1,
    property_id: 1,
    mac_address: "00:1A:2B:3C:4D:01",
    name: "Estação Sede",
    latitude: -23.1896,
    longitude: -45.8841,
    last_communication_at: minutesAgo(2),
    created_at: minutesAgo(43200),
  },
  {
    id: 2,
    property_id: 1,
    mac_address: "00:1A:2B:3C:4D:02",
    name: "Estação Pivô Central",
    latitude: -23.192,
    longitude: -45.889,
    last_communication_at: minutesAgo(5),
    created_at: minutesAgo(43200),
  },
  {
    id: 3,
    property_id: 2,
    mac_address: "00:1A:2B:3C:4D:03",
    name: "Estação Brejo",
    latitude: -22.925,
    longitude: -45.461,
    last_communication_at: minutesAgo(340),
    created_at: minutesAgo(43200),
  },
];

export const mockSensorTypes: SensorType[] = [
  { id: 1, name: "Temperatura", unit_of_measure: "°C", factor: 1.0, gain: 0 },
  { id: 2, name: "Umidade", unit_of_measure: "%", factor: 1.0, gain: 0 },
  { id: 3, name: "Velocidade do Vento", unit_of_measure: "km/h", factor: 1.0, gain: 0 },
  { id: 4, name: "Índice Pluviométrico", unit_of_measure: "mm", factor: 1.0, gain: 0 },
  { id: 5, name: "Temperatura do Solo", unit_of_measure: "°C", factor: 1.0, gain: 0 },
  { id: 6, name: "Umidade do Solo", unit_of_measure: "%", factor: 1.0, gain: 0 },
];

export const mockSensors: Sensor[] = [
  { id: 10, station_id: 1, sensor_type_id: 1, local_identifier: "temp_ar", operational_status: true, created_at: minutesAgo(43200) },
  { id: 11, station_id: 1, sensor_type_id: 2, local_identifier: "umid_ar", operational_status: true, created_at: minutesAgo(43200) },
  { id: 12, station_id: 1, sensor_type_id: 3, local_identifier: "vento_dir", operational_status: true, created_at: minutesAgo(43200) },
  { id: 13, station_id: 1, sensor_type_id: 4, local_identifier: "pluv_calha", operational_status: true, created_at: minutesAgo(43200) },
  { id: 14, station_id: 1, sensor_type_id: 5, local_identifier: "temp_solo_10cm", operational_status: true, created_at: minutesAgo(43200) },
  { id: 15, station_id: 1, sensor_type_id: 6, local_identifier: "umid_solo_10cm", operational_status: true, created_at: minutesAgo(43200) },
  { id: 20, station_id: 2, sensor_type_id: 1, local_identifier: "temp_pivo", operational_status: true, created_at: minutesAgo(43200) },
  { id: 21, station_id: 2, sensor_type_id: 2, local_identifier: "umid_pivo", operational_status: true, created_at: minutesAgo(43200) },
];

/** Gera leituras históricas mockadas seguindo o schema OpenAPI Reading */
export function generateMockReadings(): Reading[] {
  const readings: Reading[] = [];
  const baseNow = nowSeconds();
  let idCounter = 1;

  // 120 leituras recentes ao longo dos últimos 7 dias (a cada 1 a 2 horas)
  for (let i = 0; i < 60; i++) {
    const t = baseNow - i * 3600 * 2;
    const hour = new Date(t * 1000).getHours();

    // Variação diurna realista
    const tempVal = Number((22 + 9 * Math.sin(((hour - 7) / 24) * Math.PI * 2) + (i % 5 === 0 ? 5.2 : 0)).toFixed(1));
    const humVal = Number(Math.max(20, Math.min(95, 70 - 30 * Math.sin(((hour - 7) / 24) * Math.PI * 2))).toFixed(1));
    const windVal = Number((12 + (i % 7) * 2.5).toFixed(1));
    const rainVal = (i % 6 === 0 ? 4.5 : i % 11 === 0 ? 12.0 : 0);
    const soilHumVal = Number((45 - (i * 0.2)).toFixed(1));

    readings.push(
      {
        id: idCounter++,
        sensor_id: 10,
        value: tempVal,
        unix_time: t,
        data_consistent: true,
        created_at: new Date(t * 1000).toISOString(),
      },
      {
        id: idCounter++,
        sensor_id: 11,
        value: humVal,
        unix_time: t,
        data_consistent: true,
        created_at: new Date(t * 1000).toISOString(),
      },
      {
        id: idCounter++,
        sensor_id: 12,
        value: windVal,
        unix_time: t,
        data_consistent: true,
        created_at: new Date(t * 1000).toISOString(),
      },
      {
        id: idCounter++,
        sensor_id: 13,
        value: rainVal,
        unix_time: t,
        data_consistent: true,
        created_at: new Date(t * 1000).toISOString(),
      },
      {
        id: idCounter++,
        sensor_id: 15,
        value: soilHumVal,
        unix_time: t,
        data_consistent: true,
        created_at: new Date(t * 1000).toISOString(),
      },
    );
  }

  // Ordenar do mais recente para o mais antigo
  readings.sort((a, b) => b.unix_time - a.unix_time);
  return readings;
}

export const mockReadings: Reading[] = generateMockReadings();

export const mockSensorTypesStatistics: SensorTypeStatistics[] = [
  {
    sensor_type_id: 1,
    sensor_type: "Temperatura",
    unit_of_measure: "°C",
    count: 360,
    avg: 24.5,
    min: 17.8,
    max: 36.2,
    stddev: 3.8,
    first_reading_at: minutesAgo(10080),
    last_reading_at: minutesAgo(2),
  },
  {
    sensor_type_id: 2,
    sensor_type: "Umidade",
    unit_of_measure: "%",
    count: 360,
    avg: 61.2,
    min: 27.5,
    max: 88.0,
    stddev: 12.4,
    first_reading_at: minutesAgo(10080),
    last_reading_at: minutesAgo(2),
  },
  {
    sensor_type_id: 3,
    sensor_type: "Velocidade do Vento",
    unit_of_measure: "km/h",
    count: 240,
    avg: 14.8,
    min: 4.0,
    max: 32.5,
    stddev: 6.1,
    first_reading_at: minutesAgo(10080),
    last_reading_at: minutesAgo(2),
  },
  {
    sensor_type_id: 4,
    sensor_type: "Índice Pluviométrico",
    unit_of_measure: "mm",
    count: 180,
    avg: 3.2,
    min: 0.0,
    max: 24.0,
    stddev: 5.6,
    first_reading_at: minutesAgo(10080),
    last_reading_at: minutesAgo(2),
  },
  {
    sensor_type_id: 5,
    sensor_type: "Temperatura do Solo",
    unit_of_measure: "°C",
    count: 240,
    avg: 22.8,
    min: 19.5,
    max: 26.4,
    stddev: 1.9,
    first_reading_at: minutesAgo(10080),
    last_reading_at: minutesAgo(2),
  },
  {
    sensor_type_id: 6,
    sensor_type: "Umidade do Solo",
    unit_of_measure: "%",
    count: 240,
    avg: 44.5,
    min: 34.0,
    max: 56.2,
    stddev: 4.8,
    first_reading_at: minutesAgo(10080),
    last_reading_at: minutesAgo(2),
  },
];

export const mockStatistics: Statistics = {
  from: minutesAgo(10080),
  to: BASE_MOCK_ISO,
  station_id: 1,
  property_id: 1,
  readings_total: 1620,
  sensor_types: mockSensorTypesStatistics,
};

export const mockForecastDays: ForecastDay[] = [
  {
    date: new Date(BASE_MOCK_TIME_MS).toISOString().slice(0, 10),
    temperature_max: 29.5,
    temperature_min: 18.2,
    precipitation_mm: 0.0,
    precipitation_probability: 10,
    wind_speed_max_kmh: 15.2,
    weather_code: 0,
  },
  {
    date: new Date(BASE_MOCK_TIME_MS + 86400000).toISOString().slice(0, 10),
    temperature_max: 30.1,
    temperature_min: 19.0,
    precipitation_mm: 2.5,
    precipitation_probability: 35,
    wind_speed_max_kmh: 16.4,
    weather_code: 2,
  },
  {
    date: new Date(BASE_MOCK_TIME_MS + 86400000 * 2).toISOString().slice(0, 10),
    temperature_max: 26.8,
    temperature_min: 17.5,
    precipitation_mm: 14.2,
    precipitation_probability: 85,
    wind_speed_max_kmh: 24.0,
    weather_code: 61,
  },
  {
    date: new Date(BASE_MOCK_TIME_MS + 86400000 * 3).toISOString().slice(0, 10),
    temperature_max: 25.0,
    temperature_min: 16.8,
    precipitation_mm: 19.8,
    precipitation_probability: 90,
    wind_speed_max_kmh: 26.5,
    weather_code: 63,
  },
  {
    date: new Date(BASE_MOCK_TIME_MS + 86400000 * 4).toISOString().slice(0, 10),
    temperature_max: 27.5,
    temperature_min: 17.0,
    precipitation_mm: 4.0,
    precipitation_probability: 45,
    wind_speed_max_kmh: 14.8,
    weather_code: 3,
  },
  {
    date: new Date(BASE_MOCK_TIME_MS + 86400000 * 5).toISOString().slice(0, 10),
    temperature_max: 30.5,
    temperature_min: 19.5,
    precipitation_mm: 0.0,
    precipitation_probability: 15,
    wind_speed_max_kmh: 13.0,
    weather_code: 1,
  },
  {
    date: new Date(BASE_MOCK_TIME_MS + 86400000 * 6).toISOString().slice(0, 10),
    temperature_max: 31.2,
    temperature_min: 20.2,
    precipitation_mm: 0.0,
    precipitation_probability: 10,
    wind_speed_max_kmh: 12.5,
    weather_code: 0,
  },
];

export const mockForecast: StationForecast = {
  station_id: 1,
  latitude: -23.1896,
  longitude: -45.8841,
  source: "open-meteo",
  generated_at: BASE_MOCK_ISO,
  days: mockForecastDays,
};

export const mockCurrentData: CurrentData = {
  generated_at: BASE_MOCK_ISO,
  offline_threshold_minutes: 10,
  stations: [
    {
      station_id: 1,
      name: "Estação Sede",
      property_id: 1,
      property_name: "Fazenda Santa Rita",
      status: "Online",
      last_update: minutesAgo(2),
      readings: [
        { sensor_id: 10, local_identifier: "temp_ar", sensor_type_id: 1, sensor_type: "Temperatura", unit_of_measure: "°C", value: 24.2, unix_time: nowSeconds() - 120 },
        { sensor_id: 11, local_identifier: "umid_ar", sensor_type_id: 2, sensor_type: "Umidade", unit_of_measure: "%", value: 58.0, unix_time: nowSeconds() - 120 },
        { sensor_id: 12, local_identifier: "vento_dir", sensor_type_id: 3, sensor_type: "Velocidade do Vento", unit_of_measure: "km/h", value: 14.5, unix_time: nowSeconds() - 120 },
      ],
    },
    {
      station_id: 2,
      name: "Estação Pivô Central",
      property_id: 1,
      property_name: "Fazenda Santa Rita",
      status: "Com alerta",
      last_update: minutesAgo(5),
      readings: [
        { sensor_id: 20, local_identifier: "temp_pivo", sensor_type_id: 1, sensor_type: "Temperatura", unit_of_measure: "°C", value: 36.4, unix_time: nowSeconds() - 300 },
        { sensor_id: 21, local_identifier: "umid_pivo", sensor_type_id: 2, sensor_type: "Umidade", unit_of_measure: "%", value: 28.0, unix_time: nowSeconds() - 300 },
      ],
    },
    {
      station_id: 3,
      name: "Estação Brejo",
      property_id: 2,
      property_name: "Sítio Água Limpa",
      status: "Offline",
      last_update: minutesAgo(340),
      readings: [],
    },
  ],
};

export const mockStationStatus: StationStatusResponse = {
  station_id: 1,
  status: "Online",
  last_communication_at: minutesAgo(2),
  checked_at: BASE_MOCK_ISO,
  offline_threshold_minutes: 10,
};

export const mockOverview: Overview = {
  generated_at: BASE_MOCK_ISO,
  offline_threshold_minutes: 10,
  summary: { total: 3, online: 1, with_alert: 1, offline: 1 },
  stations: [
    {
      id: 1,
      name: "Estação Sede",
      mac_address: "00:1A:2B:3C:4D:01",
      property_id: 1,
      property_name: "Fazenda Santa Rita",
      latitude: -23.1896,
      longitude: -45.8841,
      last_communication_at: minutesAgo(2),
      sensors_total: 6,
      sensors_active: 6,
      active_alerts: 0,
      status: "Online",
      latest_readings: [
        { sensor_id: 10, local_identifier: "temp_ar", sensor_type_id: 1, sensor_type: "Temperatura", unit_of_measure: "°C", value: 24.2, unix_time: nowSeconds() - 120 },
        { sensor_id: 11, local_identifier: "umid_ar", sensor_type_id: 2, sensor_type: "Umidade", unit_of_measure: "%", value: 58.0, unix_time: nowSeconds() - 120 },
      ],
    },
    {
      id: 2,
      name: "Estação Pivô Central",
      mac_address: "00:1A:2B:3C:4D:02",
      property_id: 1,
      property_name: "Fazenda Santa Rita",
      latitude: -23.192,
      longitude: -45.889,
      last_communication_at: minutesAgo(5),
      sensors_total: 2,
      sensors_active: 2,
      active_alerts: 1,
      status: "Com alerta",
      latest_readings: [
        { sensor_id: 20, local_identifier: "temp_pivo", sensor_type_id: 1, sensor_type: "Temperatura", unit_of_measure: "°C", value: 36.4, unix_time: nowSeconds() - 300 },
      ],
    },
    {
      id: 3,
      name: "Estação Brejo",
      mac_address: "00:1A:2B:3C:4D:03",
      property_id: 2,
      property_name: "Sítio Água Limpa",
      latitude: -22.925,
      longitude: -45.461,
      last_communication_at: minutesAgo(340),
      sensors_total: 0,
      sensors_active: 0,
      active_alerts: 0,
      status: "Offline",
      latest_readings: [],
    },
  ],
};

export const mockSeries: ReadingSeries = {
  from: minutesAgo(10080),
  to: BASE_MOCK_ISO,
  bucket_minutes: 180,
  series: [
    {
      sensor_type_id: 1,
      sensor_type: "Temperatura",
      unit_of_measure: "°C",
      points: [
        { t: nowSeconds() - 86400 * 3, avg: 22.4, min: 18.5, max: 26.2 },
        { t: nowSeconds() - 86400 * 2, avg: 25.1, min: 19.8, max: 31.0 },
        { t: nowSeconds() - 86400, avg: 27.8, min: 21.0, max: 35.8 },
        { t: nowSeconds() - 3600 * 6, avg: 24.0, min: 20.5, max: 28.0 },
        { t: nowSeconds(), avg: 24.2, min: 22.0, max: 25.5 },
      ],
    },
    {
      sensor_type_id: 2,
      sensor_type: "Umidade",
      unit_of_measure: "%",
      points: [
        { t: nowSeconds() - 86400 * 3, avg: 68.0, min: 52.0, max: 85.0 },
        { t: nowSeconds() - 86400 * 2, avg: 59.0, min: 42.0, max: 76.0 },
        { t: nowSeconds() - 86400, avg: 45.0, min: 28.0, max: 62.0 },
        { t: nowSeconds() - 3600 * 6, avg: 54.0, min: 38.0, max: 70.0 },
        { t: nowSeconds(), avg: 58.0, min: 48.0, max: 65.0 },
      ],
    },
  ],
};

export const mockAlertRules: AlertRule[] = [
  {
    id: 1,
    manager_user_id: 2,
    sensor_id: 10,
    reference_value: 35.0,
    comparison_operator: ">",
    message: "Temperatura crítica acima de 35 °C",
    active: true,
    created_at: minutesAgo(43200),
  },
  {
    id: 2,
    manager_user_id: null,
    sensor_id: 11,
    reference_value: 30.0,
    comparison_operator: "<",
    message: "Alerta de ar extremamente seco (< 30%)",
    active: true,
    created_at: minutesAgo(43200),
  },
];

export const mockTriggeredAlerts: TriggeredAlert[] = [
  {
    id: 101,
    alert_config_id: 1,
    reading_id: 50,
    acknowledged_by: null,
    triggered_at: minutesAgo(15),
    acknowledged_at: null,
    reading_value: 36.4,
    reading_unix_time: nowSeconds() - 900,
  },
  {
    id: 102,
    alert_config_id: 2,
    reading_id: 51,
    acknowledged_by: null,
    triggered_at: minutesAgo(45),
    acknowledged_at: null,
    reading_value: 28.0,
    reading_unix_time: nowSeconds() - 2700,
  },
];

export const mockRoles: Role[] = [
  { id: 1, name: "Administrador", description: "Acesso total à rede e cadastros" },
  { id: 2, name: "Técnico Agrônomo", description: "Configuração de regras e telemetria" },
  { id: 3, name: "Operador de Campo", description: "Consulta e reconhecimento de alertas" },
];

export const mockUsers: User[] = [
  { id: 1, role_id: 1, name: "Mariana Albuquerque", email: "mariana@agritech.dev", active: true, created_at: minutesAgo(43200) },
  { id: 2, role_id: 2, name: "Carlos Mendes", email: "carlos@agritech.dev", active: true, created_at: minutesAgo(43200) },
  { id: 3, role_id: 3, name: "Paulo Dias", email: "paulo@agritech.dev", active: true, created_at: minutesAgo(43200) },
];

/**
 * Roteador de mocks OpenAPI 1.5.0: responde qualquer endpoint para permitir
 * desenvolvimento/testes locais imediatos antes das rotas finais do backend.
 */
export function getOpenApiMock<T>(rawPath: string, method = "GET"): T | undefined {
  if (method !== "GET") return undefined;

  const url = new URL(rawPath, "http://localhost");
  const path = url.pathname;
  const search = url.searchParams;

  // GET /api/readings
  if (path === "/api/readings" || path === "/readings") {
    let list = [...mockReadings];
    const sensorId = search.get("sensor_id");
    const startUnix = search.get("start_unix_time");
    const endUnix = search.get("end_unix_time");
    const page = Math.max(1, Number(search.get("page") ?? 1));
    const limit = Math.max(1, Math.min(100, Number(search.get("limit") ?? 20)));

    if (sensorId) {
      list = list.filter((r) => r.sensor_id === Number(sensorId));
    }
    if (startUnix) {
      list = list.filter((r) => r.unix_time >= Number(startUnix));
    }
    if (endUnix) {
      list = list.filter((r) => r.unix_time <= Number(endUnix));
    }

    const totalRecords = list.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const start = (page - 1) * limit;
    const data = list.slice(start, start + limit);

    return {
      data,
      meta: {
        total_records: totalRecords,
        total_pages: totalPages,
        current_page: page,
      },
    } as unknown as T;
  }

  // GET /api/stations/statistics ou /api/stations/:id/statistics
  if (path === "/api/stations/statistics" || path.endsWith("/statistics")) {
    return mockStatistics as unknown as T;
  }

  // GET /api/stations/:id/forecast
  if (path.includes("/forecast")) {
    const days = Math.min(7, Math.max(1, Number(search.get("days") ?? 7)));
    return {
      ...mockForecast,
      days: mockForecastDays.slice(0, days),
    } as unknown as T;
  }

  // GET /api/stations/current ou /api/stations/:id/current
  if (path === "/api/stations/current" || path.endsWith("/current")) {
    return mockCurrentData as unknown as T;
  }

  // GET /api/stations/:id/status
  if (path.endsWith("/status")) {
    return mockStationStatus as unknown as T;
  }

  // GET /api/stations/overview
  if (path === "/api/stations/overview") {
    return mockOverview as unknown as T;
  }

  // GET /api/stations/readings/series ou /api/stations/:id/readings/series
  if (path.includes("/readings/series")) {
    return mockSeries as unknown as T;
  }

  // GET /api/stations/properties ou /api/properties
  if (path === "/api/stations/properties" || path === "/api/properties") {
    return mockProperties as unknown as T;
  }

  // GET /api/stations
  if (path === "/api/stations") {
    return mockStations as unknown as T;
  }

  // GET /api/sensors
  if (path === "/api/sensors") {
    return mockSensors as unknown as T;
  }

  // GET /api/sensor-types
  if (path === "/api/sensor-types") {
    return mockSensorTypes as unknown as T;
  }

  // GET /api/alerts/config
  if (path === "/api/alerts/config") {
    return mockAlertRules as unknown as T;
  }

  // GET /api/alerts/triggered
  if (path === "/api/alerts/triggered") {
    return mockTriggeredAlerts as unknown as T;
  }

  // GET /api/users
  if (path === "/api/users") {
    return mockUsers as unknown as T;
  }

  // GET /api/roles
  if (path === "/api/roles") {
    return mockRoles as unknown as T;
  }

  return undefined;
}
