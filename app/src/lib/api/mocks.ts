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
  // Estação 1: Sede (Fazenda Santa Rita)
  { id: 10, station_id: 1, sensor_type_id: 1, local_identifier: "temp_ar", operational_status: true, created_at: minutesAgo(43200) },
  { id: 11, station_id: 1, sensor_type_id: 2, local_identifier: "umid_ar", operational_status: true, created_at: minutesAgo(43200) },
  { id: 12, station_id: 1, sensor_type_id: 3, local_identifier: "vento_dir", operational_status: true, created_at: minutesAgo(43200) },
  { id: 13, station_id: 1, sensor_type_id: 4, local_identifier: "pluv_calha", operational_status: true, created_at: minutesAgo(43200) },
  { id: 14, station_id: 1, sensor_type_id: 5, local_identifier: "temp_solo_10cm", operational_status: true, created_at: minutesAgo(43200) },
  { id: 15, station_id: 1, sensor_type_id: 6, local_identifier: "umid_solo_10cm", operational_status: true, created_at: minutesAgo(43200) },

  // Estação 2: Pivô Central (Fazenda Santa Rita)
  { id: 20, station_id: 2, sensor_type_id: 1, local_identifier: "temp_pivo", operational_status: true, created_at: minutesAgo(43200) },
  { id: 21, station_id: 2, sensor_type_id: 2, local_identifier: "umid_pivo", operational_status: true, created_at: minutesAgo(43200) },
  { id: 22, station_id: 2, sensor_type_id: 3, local_identifier: "vento_pivo", operational_status: true, created_at: minutesAgo(43200) },
  { id: 23, station_id: 2, sensor_type_id: 4, local_identifier: "pluv_pivo", operational_status: true, created_at: minutesAgo(43200) },
  { id: 24, station_id: 2, sensor_type_id: 5, local_identifier: "temp_solo_pivo", operational_status: true, created_at: minutesAgo(43200) },
  { id: 25, station_id: 2, sensor_type_id: 6, local_identifier: "umid_solo_pivo", operational_status: true, created_at: minutesAgo(43200) },

  // Estação 3: Brejo (Sítio Água Limpa)
  { id: 30, station_id: 3, sensor_type_id: 1, local_identifier: "temp_brejo", operational_status: false, created_at: minutesAgo(43200) },
  { id: 31, station_id: 3, sensor_type_id: 2, local_identifier: "umid_brejo", operational_status: false, created_at: minutesAgo(43200) },
];

/** Gera leituras históricas mockadas seguindo o schema OpenAPI Reading */
export function generateMockReadings(): Reading[] {
  const readings: Reading[] = [];
  const baseNow = nowSeconds();
  let idCounter = 1;

  // Leituras históricas ao longo dos últimos 7 dias a cada 2 horas
  for (let i = 0; i < 60; i++) {
    const t = baseNow - i * 3600 * 2;
    const hour = new Date(t * 1000).getHours();

    // Variação diurna realista para Estação 1 (Sede)
    const tempVal1 = Number((22 + 9 * Math.sin(((hour - 7) / 24) * Math.PI * 2) + (i % 7 === 0 ? 5.2 : 0)).toFixed(1));
    const humVal1 = Number(Math.max(20, Math.min(95, 70 - 30 * Math.sin(((hour - 7) / 24) * Math.PI * 2))).toFixed(1));
    const windVal1 = Number((12 + (i % 7) * 2.5).toFixed(1));
    const rainVal1 = (i % 6 === 0 ? 4.5 : i % 11 === 0 ? 12.0 : 0);
    const soilTempVal1 = Number((21.5 + 3 * Math.sin(((hour - 10) / 24) * Math.PI * 2)).toFixed(1));
    const soilHumVal1 = Number((45 - (i * 0.2)).toFixed(1));

    // Estação 2 (Pivô Central) - mais quente, pivô com picos ocasionais
    const tempVal2 = Number((tempVal1 + 2.8).toFixed(1));
    const humVal2 = Number(Math.max(18, humVal1 - 8).toFixed(1));
    const windVal2 = Number((windVal1 + 3.0).toFixed(1));
    const rainVal2 = rainVal1;
    const soilTempVal2 = Number((soilTempVal1 + 1.2).toFixed(1));
    const soilHumVal2 = Number(Math.max(25, 42 - (i * 0.35)).toFixed(1));

    // Inserção da Estação 1
    readings.push(
      { id: idCounter++, sensor_id: 10, value: tempVal1, unix_time: t, data_consistent: i !== 14, created_at: new Date(t * 1000).toISOString() },
      { id: idCounter++, sensor_id: 11, value: humVal1, unix_time: t, data_consistent: true, created_at: new Date(t * 1000).toISOString() },
      { id: idCounter++, sensor_id: 12, value: windVal1, unix_time: t, data_consistent: true, created_at: new Date(t * 1000).toISOString() },
      { id: idCounter++, sensor_id: 13, value: rainVal1, unix_time: t, data_consistent: true, created_at: new Date(t * 1000).toISOString() },
      { id: idCounter++, sensor_id: 14, value: soilTempVal1, unix_time: t, data_consistent: true, created_at: new Date(t * 1000).toISOString() },
      { id: idCounter++, sensor_id: 15, value: soilHumVal1, unix_time: t, data_consistent: true, created_at: new Date(t * 1000).toISOString() },
    );

    // Inserção da Estação 2
    readings.push(
      { id: idCounter++, sensor_id: 20, value: tempVal2, unix_time: t, data_consistent: true, created_at: new Date(t * 1000).toISOString() },
      { id: idCounter++, sensor_id: 21, value: humVal2, unix_time: t, data_consistent: true, created_at: new Date(t * 1000).toISOString() },
      { id: idCounter++, sensor_id: 22, value: windVal2, unix_time: t, data_consistent: true, created_at: new Date(t * 1000).toISOString() },
      { id: idCounter++, sensor_id: 23, value: rainVal2, unix_time: t, data_consistent: true, created_at: new Date(t * 1000).toISOString() },
      { id: idCounter++, sensor_id: 24, value: soilTempVal2, unix_time: t, data_consistent: true, created_at: new Date(t * 1000).toISOString() },
      { id: idCounter++, sensor_id: 25, value: soilHumVal2, unix_time: t, data_consistent: true, created_at: new Date(t * 1000).toISOString() },
    );

    // Inserção da Estação 3 (apenas registros anteriores a 6 horas atrás)
    if (i >= 3) {
      readings.push(
        { id: idCounter++, sensor_id: 30, value: Number((tempVal1 - 1.5).toFixed(1)), unix_time: t, data_consistent: true, created_at: new Date(t * 1000).toISOString() },
        { id: idCounter++, sensor_id: 31, value: Number((humVal1 + 10).toFixed(1)), unix_time: t, data_consistent: true, created_at: new Date(t * 1000).toISOString() },
      );
    }
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
  {
    sensor_type_id: 7,
    sensor_type: "Pressão",
    unit_of_measure: "hPa",
    count: 240,
    avg: 1013.2,
    min: 1009.6,
    max: 1016.4,
    stddev: 2.1,
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
    {
      sensor_type_id: 3,
      sensor_type: "Velocidade do Vento",
      unit_of_measure: "km/h",
      points: [
        { t: nowSeconds() - 86400 * 3, avg: 10.2, min: 4.5, max: 16.0 },
        { t: nowSeconds() - 86400 * 2, avg: 14.5, min: 7.0, max: 24.5 },
        { t: nowSeconds() - 86400, avg: 16.8, min: 8.5, max: 28.7 },
        { t: nowSeconds() - 3600 * 6, avg: 11.4, min: 5.0, max: 18.2 },
        { t: nowSeconds(), avg: 12.6, min: 6.2, max: 19.4 },
      ],
    },
    {
      sensor_type_id: 4,
      sensor_type: "Índice Pluviométrico",
      unit_of_measure: "mm",
      points: [
        { t: nowSeconds() - 86400 * 3, avg: 0.0, min: 0.0, max: 0.0 },
        { t: nowSeconds() - 86400 * 2, avg: 2.4, min: 0.0, max: 8.5 },
        { t: nowSeconds() - 86400, avg: 4.1, min: 0.5, max: 14.2 },
        { t: nowSeconds() - 3600 * 6, avg: 0.0, min: 0.0, max: 0.0 },
        { t: nowSeconds(), avg: 0.8, min: 0.0, max: 3.4 },
      ],
    },
    {
      sensor_type_id: 5,
      sensor_type: "Temperatura do Solo",
      unit_of_measure: "°C",
      points: [
        { t: nowSeconds() - 86400 * 3, avg: 20.5, min: 18.2, max: 22.8 },
        { t: nowSeconds() - 86400 * 2, avg: 21.4, min: 19.0, max: 23.9 },
        { t: nowSeconds() - 86400, avg: 22.1, min: 19.5, max: 24.6 },
        { t: nowSeconds() - 3600 * 6, avg: 21.0, min: 18.8, max: 23.1 },
        { t: nowSeconds(), avg: 21.3, min: 19.2, max: 23.4 },
      ],
    },
    {
      sensor_type_id: 6,
      sensor_type: "Umidade do Solo",
      unit_of_measure: "%",
      points: [
        { t: nowSeconds() - 86400 * 3, avg: 40.2, min: 36.5, max: 43.0 },
        { t: nowSeconds() - 86400 * 2, avg: 38.4, min: 34.8, max: 41.2 },
        { t: nowSeconds() - 86400, avg: 35.1, min: 31.5, max: 38.0 },
        { t: nowSeconds() - 3600 * 6, avg: 37.8, min: 34.2, max: 40.5 },
        { t: nowSeconds(), avg: 37.2, min: 33.8, max: 39.8 },
      ],
    },
    {
      sensor_type_id: 7,
      sensor_type: "Pressão",
      unit_of_measure: "hPa",
      points: [
        { t: nowSeconds() - 86400 * 3, avg: 1013.8, min: 1011.5, max: 1015.9 },
        { t: nowSeconds() - 86400 * 2, avg: 1012.4, min: 1010.1, max: 1014.6 },
        { t: nowSeconds() - 86400, avg: 1011.2, min: 1009.4, max: 1013.0 },
        { t: nowSeconds() - 3600 * 6, avg: 1012.9, min: 1011.0, max: 1014.8 },
        { t: nowSeconds(), avg: 1013.4, min: 1011.8, max: 1015.2 },
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

function paginateList<T>(
  list: T[],
  searchParams: URLSearchParams,
  defaultLimit = 20,
): { data: T[]; meta: { total_records: number; total_pages: number; current_page: number } } {
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") ?? defaultLimit)));
  const total_records = list.length;
  const total_pages = Math.max(1, Math.ceil(total_records / limit));
  const start = (page - 1) * limit;
  const data = list.slice(start, start + limit);
  return {
    data,
    meta: {
      total_records,
      total_pages,
      current_page: page,
    },
  };
}

/**
 * Roteador de mocks OpenAPI 1.5.0: responde endpoints do contrato oficial para permitir
 * desenvolvimento/testes locais imediatos com total fidelidade ao backend.
 */
export function getOpenApiMock<T>(rawPath: string, method = "GET"): T | undefined {
  if (method !== "GET") return undefined;

  const url = new URL(rawPath, "http://localhost");
  const path = url.pathname;
  const search = url.searchParams;

  // GET /api/readings (ReadingsPaginated)
  if (path === "/api/readings" || path === "/readings") {
    let list = [...mockReadings];
    const sensorId = search.get("sensor_id");
    const startUnix = search.get("start_unix_time");
    const endUnix = search.get("end_unix_time");

    if (sensorId) {
      list = list.filter((r) => r.sensor_id === Number(sensorId));
    }
    if (startUnix) {
      list = list.filter((r) => r.unix_time >= Number(startUnix));
    }
    if (endUnix) {
      list = list.filter((r) => r.unix_time <= Number(endUnix));
    }

    return paginateList(list, search, 20) as unknown as T;
  }

  // GET /api/stations/statistics ou /api/stations/:id/statistics (Statistics)
  if (path === "/api/stations/statistics" || path.endsWith("/statistics")) {
    const match = path.match(/\/api\/stations\/(\d+)\/statistics/);
    const stationId = match ? Number(match[1]) : 1;
    return {
      ...mockStatistics,
      station_id: stationId,
    } as unknown as T;
  }

  // GET /api/stations/:id/forecast (StationForecast)
  if (path.includes("/forecast")) {
    const match = path.match(/\/api\/stations\/(\d+)\/forecast/);
    const stationId = match ? Number(match[1]) : 1;
    const station = mockStations.find((s) => s.id === stationId) ?? mockStations[0]!;
    const days = Math.min(7, Math.max(1, Number(search.get("days") ?? 7)));
    return {
      station_id: station.id,
      latitude: station.latitude ?? -23.1896,
      longitude: station.longitude ?? -45.8841,
      source: "open-meteo",
      generated_at: BASE_MOCK_ISO,
      days: mockForecastDays.slice(0, days),
    } as unknown as T;
  }

  // GET /api/stations/current ou /api/stations/:id/current (CurrentData / StationCurrentData)
  if (path === "/api/stations/current" || path.endsWith("/current")) {
    const match = path.match(/\/api\/stations\/(\d+)\/current/);
    if (match) {
      const id = Number(match[1]);
      const stationCurrent = mockCurrentData.stations.find((s) => s.station_id === id);
      return stationCurrent as unknown as T;
    }
    return mockCurrentData as unknown as T;
  }

  // GET /api/stations/:id/status (StationStatusResponse)
  if (path.endsWith("/status")) {
    const match = path.match(/\/api\/stations\/(\d+)\/status/);
    const id = match ? Number(match[1]) : 1;
    const station = mockStations.find((s) => s.id === id);
    const isOffline = station?.id === 3;
    return {
      station_id: id,
      status: isOffline ? "Offline" : "Online",
      last_communication_at: station?.last_communication_at ?? minutesAgo(2),
      checked_at: BASE_MOCK_ISO,
      offline_threshold_minutes: 10,
    } as unknown as T;
  }

  // GET /api/stations/overview (Overview)
  if (path === "/api/stations/overview") {
    return mockOverview as unknown as T;
  }

  // GET /api/stations/readings/series ou /api/stations/:id/readings/series
  if (path.includes("/readings/series")) {
    return mockSeries as unknown as T;
  }

  // GET /api/stations/properties ou /api/properties (PropertiesPaginated ou Property[])
  if (path === "/api/stations/properties" || path === "/api/properties" || path === "/properties") {
    if (search.has("page") || search.has("limit")) {
      return paginateList(mockProperties, search, 100) as unknown as T;
    }
    return mockProperties as unknown as T;
  }

  // GET /api/stations (StationsPaginated ou Station[])
  if (path === "/api/stations" || path === "/stations") {
    let list = [...mockStations];
    const propertyId = search.get("property_id");
    if (propertyId) {
      list = list.filter((s) => s.property_id === Number(propertyId));
    }
    if (search.has("page") || search.has("limit")) {
      return paginateList(list, search, 100) as unknown as T;
    }
    return list as unknown as T;
  }

  const stationMatch = path.match(/^\/api\/stations\/(\d+)$/);
  if (stationMatch) {
    const id = Number(stationMatch[1]);
    return mockStations.find((s) => s.id === id) as unknown as T;
  }

  // GET /api/sensors (SensorsPaginated ou Sensor[])
  if (path === "/api/sensors" || path === "/sensors") {
    let list = [...mockSensors];
    const stationId = search.get("station_id");
    if (stationId) {
      list = list.filter((s) => s.station_id === Number(stationId));
    }
    if (search.has("page") || search.has("limit")) {
      return paginateList(list, search, 100) as unknown as T;
    }
    return list as unknown as T;
  }

  const sensorMatch = path.match(/^\/api\/sensors\/(\d+)$/);
  if (sensorMatch) {
    const id = Number(sensorMatch[1]);
    return mockSensors.find((s) => s.id === id) as unknown as T;
  }

  // GET /api/sensor-types
  if (path === "/api/sensor-types" || path === "/sensor-types") {
    return mockSensorTypes as unknown as T;
  }

  const sensorTypeMatch = path.match(/^\/api\/sensor-types\/(\d+)$/);
  if (sensorTypeMatch) {
    const id = Number(sensorTypeMatch[1]);
    return mockSensorTypes.find((t) => t.id === id) as unknown as T;
  }

  // GET /api/alerts/config (AlertConfigsPaginated ou AlertConfig[])
  if (path === "/api/alerts/config" || path === "/alerts/config") {
    if (search.has("page") || search.has("limit")) {
      return paginateList(mockAlertRules, search, 100) as unknown as T;
    }
    return mockAlertRules as unknown as T;
  }

  // GET /api/alerts/triggered (TriggeredAlertsPaginated ou TriggeredAlert[])
  if (path === "/api/alerts/triggered" || path === "/alerts/triggered") {
    let list = [...mockTriggeredAlerts];
    const ack = search.get("acknowledged");
    if (ack !== null) {
      const isAck = ack === "true";
      list = list.filter((a) => (a.acknowledged_at !== null) === isAck);
    }
    if (search.has("page") || search.has("limit")) {
      return paginateList(list, search, 15) as unknown as T;
    }
    return list as unknown as T;
  }

  // GET /api/users (UsersPaginated ou User[])
  if (path === "/api/users" || path === "/users") {
    if (search.has("page") || search.has("limit")) {
      return paginateList(mockUsers, search, 100) as unknown as T;
    }
    return mockUsers as unknown as T;
  }

  const userMatch = path.match(/^\/api\/users\/(\d+)$/);
  if (userMatch) {
    const id = Number(userMatch[1]);
    return mockUsers.find((u) => u.id === id) as unknown as T;
  }

  // GET /api/roles
  if (path === "/api/roles" || path === "/roles") {
    return mockRoles as unknown as T;
  }

  return undefined;
}
