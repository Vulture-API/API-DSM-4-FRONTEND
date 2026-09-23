import type {
  CommunicationIncident,
  CommunicationSummary,
  HourlyCommunicationPoint,
  RainfallPoint,
  StationCommunicationDetail,
  WeatherOverview,
  WeatherTrendPoint,
} from "../types/dashboard";

export interface PropertyOption {
  id: string;
  name: string;
  location: string;
}

export const propertiesList: PropertyOption[] = [
  { id: "all", name: "Todas as Propriedades", location: "Geral" },
  { id: "1", name: "Fazenda Santa Rita", location: "São José dos Campos - SP" },
  { id: "2", name: "Fazenda Boa Vista", location: "Taubaté - SP" },
  { id: "3", name: "Fazenda Esperança", location: "Jacareí - SP" },
  { id: "4", name: "Sítio Boa Vista", location: "Caçapava - SP" },
  { id: "5", name: "Fazenda Água Limpa", location: "Pindamonhangaba - SP" },
];

export const mockStationsCommunication: StationCommunicationDetail[] = [
  {
    id: 1,
    codigo: "EST-001",
    name: "Estação 01",
    property: "Fazenda Santa Rita",
    status: "online",
    latitude: -23.1791,
    longitude: -45.8872,
    lastCommunication: "10/06/2025 - 14:30",
    lastCommunicationMinutesAgo: 2,
    activeSensorsCount: 5,
    totalSensorsCount: 5,
    dataConsistent: true,
    macAddress: "00:1A:2B:3C:4D:01",
  },
  {
    id: 2,
    codigo: "EST-002",
    name: "Estação 02",
    property: "Fazenda Santa Rita",
    status: "online",
    latitude: -23.1755,
    longitude: -45.879,
    lastCommunication: "10/06/2025 - 14:28",
    lastCommunicationMinutesAgo: 4,
    activeSensorsCount: 5,
    totalSensorsCount: 5,
    dataConsistent: true,
    macAddress: "00:1A:2B:3C:4D:02",
  },
  {
    id: 3,
    codigo: "EST-003",
    name: "Estação 03",
    property: "Fazenda Santa Rita",
    status: "online",
    latitude: -23.1702,
    longitude: -45.876,
    lastCommunication: "10/06/2025 - 14:32",
    lastCommunicationMinutesAgo: 1,
    activeSensorsCount: 5,
    totalSensorsCount: 5,
    dataConsistent: true,
    macAddress: "00:1A:2B:3C:4D:03",
  },
  {
    id: 4,
    codigo: "EST-004",
    name: "Estação 04",
    property: "Fazenda Boa Vista",
    status: "unstable",
    latitude: -23.1868,
    longitude: -45.8901,
    lastCommunication: "10/06/2025 - 14:20",
    lastCommunicationMinutesAgo: 12,
    activeSensorsCount: 3,
    totalSensorsCount: 5,
    dataConsistent: false,
    macAddress: "00:1A:2B:3C:4D:04",
  },
  {
    id: 5,
    codigo: "EST-005",
    name: "Estação 05",
    property: "Fazenda Boa Vista",
    status: "offline",
    latitude: -23.181,
    longitude: -45.8845,
    lastCommunication: "10/06/2025 - 13:52",
    lastCommunicationMinutesAgo: 40,
    activeSensorsCount: 0,
    totalSensorsCount: 5,
    dataConsistent: false,
    macAddress: "00:1A:2B:3C:4D:05",
  },
  {
    id: 6,
    codigo: "EST-006",
    name: "Estação 06",
    property: "Fazenda Esperança",
    status: "online",
    latitude: -23.1745,
    longitude: -45.893,
    lastCommunication: "10/06/2025 - 14:31",
    lastCommunicationMinutesAgo: 2,
    activeSensorsCount: 5,
    totalSensorsCount: 5,
    dataConsistent: true,
    macAddress: "00:1A:2B:3C:4D:06",
  },
  {
    id: 7,
    codigo: "EST-007",
    name: "Estação 07",
    property: "Fazenda Esperança",
    status: "online",
    latitude: -23.1799,
    longitude: -45.8801,
    lastCommunication: "10/06/2025 - 14:27",
    lastCommunicationMinutesAgo: 5,
    activeSensorsCount: 5,
    totalSensorsCount: 5,
    dataConsistent: true,
    macAddress: "00:1A:2B:3C:4D:07",
  },
  {
    id: 8,
    codigo: "EST-008",
    name: "Estação 08",
    property: "Sítio Boa Vista",
    status: "unstable",
    latitude: -23.1912,
    longitude: -45.8888,
    lastCommunication: "10/06/2025 - 14:18",
    lastCommunicationMinutesAgo: 14,
    activeSensorsCount: 4,
    totalSensorsCount: 5,
    dataConsistent: false,
    macAddress: "00:1A:2B:3C:4D:08",
  },
  {
    id: 9,
    codigo: "EST-009",
    name: "Estação 09",
    property: "Sítio Boa Vista",
    status: "online",
    latitude: -23.1955,
    longitude: -45.877,
    lastCommunication: "10/06/2025 - 14:33",
    lastCommunicationMinutesAgo: 1,
    activeSensorsCount: 5,
    totalSensorsCount: 5,
    dataConsistent: true,
    macAddress: "00:1A:2B:3C:4D:09",
  },
  {
    id: 10,
    codigo: "EST-010",
    name: "Estação 10",
    property: "Fazenda Água Limpa",
    status: "online",
    latitude: -23.168,
    longitude: -45.885,
    lastCommunication: "10/06/2025 - 14:25",
    lastCommunicationMinutesAgo: 7,
    activeSensorsCount: 5,
    totalSensorsCount: 5,
    dataConsistent: true,
    macAddress: "00:1A:2B:3C:4D:10",
  },
  {
    id: 11,
    codigo: "EST-011",
    name: "Estação 11",
    property: "Fazenda Água Limpa",
    status: "online",
    latitude: -23.1729,
    longitude: -45.8919,
    lastCommunication: "10/06/2025 - 14:29",
    lastCommunicationMinutesAgo: 3,
    activeSensorsCount: 5,
    totalSensorsCount: 5,
    dataConsistent: true,
    macAddress: "00:1A:2B:3C:4D:11",
  },
  {
    id: 12,
    codigo: "EST-012",
    name: "Estação 12",
    property: "Fazenda Santa Rita",
    status: "offline",
    latitude: -23.184,
    longitude: -45.882,
    lastCommunication: "10/06/2025 - 12:47",
    lastCommunicationMinutesAgo: 105,
    activeSensorsCount: 0,
    totalSensorsCount: 5,
    dataConsistent: false,
    macAddress: "00:1A:2B:3C:4D:12",
  },
];

export const mockHourlyCommunication: HourlyCommunicationPoint[] = [
  { hour: "00:00", onlineCount: 12, unstableCount: 0, offlineCount: 0, uptimePct: 100 },
  { hour: "02:00", onlineCount: 12, unstableCount: 0, offlineCount: 0, uptimePct: 100 },
  { hour: "04:00", onlineCount: 11, unstableCount: 1, offlineCount: 0, uptimePct: 96.2 },
  { hour: "06:00", onlineCount: 11, unstableCount: 1, offlineCount: 0, uptimePct: 95.8 },
  { hour: "08:00", onlineCount: 11, unstableCount: 0, offlineCount: 1, uptimePct: 91.6 },
  { hour: "10:00", onlineCount: 10, unstableCount: 1, offlineCount: 1, uptimePct: 89.2 },
  { hour: "12:00", onlineCount: 9, unstableCount: 1, offlineCount: 2, uptimePct: 83.3 },
  { hour: "14:00", onlineCount: 8, unstableCount: 2, offlineCount: 2, uptimePct: 80.5 },
];

export const mockWeatherTrends: WeatherTrendPoint[] = [
  { time: "00:00", temperature: 18.2, soilMoisture: 35, soilTemperature: 21.0 },
  { time: "02:00", temperature: 17.5, soilMoisture: 35, soilTemperature: 20.8 },
  { time: "04:00", temperature: 16.9, soilMoisture: 34, soilTemperature: 20.5 },
  { time: "06:00", temperature: 17.8, soilMoisture: 34, soilTemperature: 20.7 },
  { time: "08:00", temperature: 21.4, soilMoisture: 33, soilTemperature: 21.5 },
  { time: "10:00", temperature: 24.8, soilMoisture: 32, soilTemperature: 22.4 },
  { time: "12:00", temperature: 27.6, soilMoisture: 31, soilTemperature: 23.1 },
  { time: "14:00", temperature: 28.9, soilMoisture: 30, soilTemperature: 23.5 },
];

export const mockRainfallPoints: RainfallPoint[] = [
  { label: "Seg", amountMm: 0.0 },
  { label: "Ter", amountMm: 4.2 },
  { label: "Qua", amountMm: 12.8 },
  { label: "Qui", amountMm: 1.5 },
  { label: "Sex", amountMm: 0.0 },
  { label: "Sáb", amountMm: 8.6 },
  { label: "Dom", amountMm: 0.2 },
];

export const mockIncidents: CommunicationIncident[] = [
  {
    id: "INC-104",
    stationName: "Estação 05",
    propertyName: "Fazenda Boa Vista",
    type: "offline",
    severity: "critical",
    description: "Sem comunicação de leituras há mais de 40 minutos",
    occurredAt: "Hoje, 13:52",
    duration: "40 min",
  },
  {
    id: "INC-103",
    stationName: "Estação 12",
    propertyName: "Fazenda Santa Rita",
    type: "no_communication",
    severity: "critical",
    description: "Estação inativa sem envio de telemetria",
    occurredAt: "Hoje, 12:47",
    duration: "1h 45min",
  },
  {
    id: "INC-102",
    stationName: "Estação 04",
    propertyName: "Fazenda Boa Vista",
    type: "inconsistent_data",
    severity: "warning",
    description: "Leituras com flag data_consistent=false no sensor HUM-01",
    occurredAt: "Hoje, 14:20",
    duration: "12 min",
  },
  {
    id: "INC-101",
    stationName: "Estação 08",
    propertyName: "Sítio Boa Vista",
    type: "sensor_inactive",
    severity: "warning",
    description: "Sensor WIND-01 em estado operacional inativo (operational_status=false)",
    occurredAt: "Hoje, 14:18",
    duration: "14 min",
  },
];

export function getFilteredDashboardData(propertyId: string, period: string) {
  let stations = mockStationsCommunication;

  if (propertyId !== "all") {
    const prop = propertiesList.find((p) => p.id === propertyId);
    if (prop) {
      stations = mockStationsCommunication.filter((s) => s.property === prop.name);
    }
  }

  const totalStations = stations.length;
  const onlineCount = stations.filter((s) => s.status === "online").length;
  const unstableCount = stations.filter((s) => s.status === "unstable").length;
  const offlineCount = stations.filter((s) => s.status === "offline").length;

  const onlinePercentage =
    totalStations > 0 ? Math.round((onlineCount / totalStations) * 100) : 0;

  const consistentCount = stations.filter((s) => s.dataConsistent).length;
  const consistentDataRate =
    totalStations > 0 ? Math.round((consistentCount / totalStations) * 100) : 0;

  const communicationSummary: CommunicationSummary = {
    totalStations,
    onlineCount,
    unstableCount,
    offlineCount,
    globalAvailabilitySla: 96.4,
    consistentDataRate,
    onlinePercentage,
    slaTarget: 95.0,
  };

  const weatherOverview: WeatherOverview = {
    avgTemperature: 24.8,
    minTemperature: 16.9,
    maxTemperature: 28.9,
    avgSoilMoisture: 31.4,
    avgSoilTemperature: 22.8,
    accumulatedRainfall: period === "7d" ? 27.3 : period === "30d" ? 112.5 : 2.4,
    avgWindSpeed: 14.2,
    maxWindGust: 28.5,
    soilMoistureStatus: "adequate",
  };

  return {
    summary: communicationSummary,
    weather: weatherOverview,
    stations,
    hourlyCommunication: mockHourlyCommunication,
    weatherTrends: mockWeatherTrends,
    rainfall: mockRainfallPoints,
    incidents: mockIncidents.filter((inc) =>
      propertyId === "all"
        ? true
        : stations.some((s) => s.name === inc.stationName)
    ),
  };
}
