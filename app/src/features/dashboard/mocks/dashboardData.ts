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
    name: "Estação 01",
    property: "Fazenda Santa Rita",
    status: "online",
    signalStrength: "excellent",
    signalDbm: -62,
    batteryPct: 98,
    lastCommunication: "10/06/2025 - 14:30",
    lastCommunicationMinutesAgo: 2,
    activeSensorsCount: 5,
    totalSensorsCount: 5,
    macAddress: "00:1A:2B:3C:4D:01",
    firmwareVersion: "v2.4.1",
  },
  {
    id: 2,
    name: "Estação 02",
    property: "Fazenda Santa Rita",
    status: "online",
    signalStrength: "good",
    signalDbm: -71,
    batteryPct: 92,
    lastCommunication: "10/06/2025 - 14:28",
    lastCommunicationMinutesAgo: 4,
    activeSensorsCount: 5,
    totalSensorsCount: 5,
    macAddress: "00:1A:2B:3C:4D:02",
    firmwareVersion: "v2.4.1",
  },
  {
    id: 3,
    name: "Estação 03",
    property: "Fazenda Santa Rita",
    status: "online",
    signalStrength: "excellent",
    signalDbm: -59,
    batteryPct: 95,
    lastCommunication: "10/06/2025 - 14:32",
    lastCommunicationMinutesAgo: 1,
    activeSensorsCount: 5,
    totalSensorsCount: 5,
    macAddress: "00:1A:2B:3C:4D:03",
    firmwareVersion: "v2.4.0",
  },
  {
    id: 4,
    name: "Estação 04",
    property: "Fazenda Boa Vista",
    status: "unstable",
    signalStrength: "poor",
    signalDbm: -92,
    batteryPct: 34,
    lastCommunication: "10/06/2025 - 14:20",
    lastCommunicationMinutesAgo: 12,
    activeSensorsCount: 3,
    totalSensorsCount: 5,
    macAddress: "00:1A:2B:3C:4D:04",
    firmwareVersion: "v2.3.9",
  },
  {
    id: 5,
    name: "Estação 05",
    property: "Fazenda Boa Vista",
    status: "offline",
    signalStrength: "none",
    signalDbm: -115,
    batteryPct: 12,
    lastCommunication: "10/06/2025 - 13:52",
    lastCommunicationMinutesAgo: 40,
    activeSensorsCount: 0,
    totalSensorsCount: 5,
    macAddress: "00:1A:2B:3C:4D:05",
    firmwareVersion: "v2.3.8",
  },
  {
    id: 6,
    name: "Estação 06",
    property: "Fazenda Esperança",
    status: "online",
    signalStrength: "excellent",
    signalDbm: -60,
    batteryPct: 89,
    lastCommunication: "10/06/2025 - 14:31",
    lastCommunicationMinutesAgo: 2,
    activeSensorsCount: 5,
    totalSensorsCount: 5,
    macAddress: "00:1A:2B:3C:4D:06",
    firmwareVersion: "v2.4.1",
  },
  {
    id: 7,
    name: "Estação 07",
    property: "Fazenda Esperança",
    status: "online",
    signalStrength: "good",
    signalDbm: -68,
    batteryPct: 86,
    lastCommunication: "10/06/2025 - 14:27",
    lastCommunicationMinutesAgo: 5,
    activeSensorsCount: 5,
    totalSensorsCount: 5,
    macAddress: "00:1A:2B:3C:4D:07",
    firmwareVersion: "v2.4.1",
  },
  {
    id: 8,
    name: "Estação 08",
    property: "Sítio Boa Vista",
    status: "unstable",
    signalStrength: "fair",
    signalDbm: -84,
    batteryPct: 45,
    lastCommunication: "10/06/2025 - 14:18",
    lastCommunicationMinutesAgo: 14,
    activeSensorsCount: 4,
    totalSensorsCount: 5,
    macAddress: "00:1A:2B:3C:4D:08",
    firmwareVersion: "v2.4.0",
  },
  {
    id: 9,
    name: "Estação 09",
    property: "Sítio Boa Vista",
    status: "online",
    signalStrength: "excellent",
    signalDbm: -64,
    batteryPct: 91,
    lastCommunication: "10/06/2025 - 14:33",
    lastCommunicationMinutesAgo: 1,
    activeSensorsCount: 5,
    totalSensorsCount: 5,
    macAddress: "00:1A:2B:3C:4D:09",
    firmwareVersion: "v2.4.1",
  },
  {
    id: 10,
    name: "Estação 10",
    property: "Fazenda Água Limpa",
    status: "online",
    signalStrength: "good",
    signalDbm: -66,
    batteryPct: 94,
    lastCommunication: "10/06/2025 - 14:25",
    lastCommunicationMinutesAgo: 7,
    activeSensorsCount: 5,
    totalSensorsCount: 5,
    macAddress: "00:1A:2B:3C:4D:10",
    firmwareVersion: "v2.4.1",
  },
  {
    id: 11,
    name: "Estação 11",
    property: "Fazenda Água Limpa",
    status: "online",
    signalStrength: "excellent",
    signalDbm: -58,
    batteryPct: 97,
    lastCommunication: "10/06/2025 - 14:29",
    lastCommunicationMinutesAgo: 3,
    activeSensorsCount: 5,
    totalSensorsCount: 5,
    macAddress: "00:1A:2B:3C:4D:11",
    firmwareVersion: "v2.4.1",
  },
  {
    id: 12,
    name: "Estação 12",
    property: "Fazenda Santa Rita",
    status: "offline",
    signalStrength: "none",
    signalDbm: -110,
    batteryPct: 8,
    lastCommunication: "10/06/2025 - 12:47",
    lastCommunicationMinutesAgo: 105,
    activeSensorsCount: 0,
    totalSensorsCount: 5,
    macAddress: "00:1A:2B:3C:4D:12",
    firmwareVersion: "v2.3.7",
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
  { time: "00:00", temperature: 18.2, humidity: 82, soilMoisture: 35 },
  { time: "02:00", temperature: 17.5, humidity: 85, soilMoisture: 35 },
  { time: "04:00", temperature: 16.9, humidity: 88, soilMoisture: 34 },
  { time: "06:00", temperature: 17.8, humidity: 84, soilMoisture: 34 },
  { time: "08:00", temperature: 21.4, humidity: 76, soilMoisture: 33 },
  { time: "10:00", temperature: 24.8, humidity: 65, soilMoisture: 32 },
  { time: "12:00", temperature: 27.6, humidity: 54, soilMoisture: 31 },
  { time: "14:00", temperature: 28.9, humidity: 48, soilMoisture: 30 },
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
    description: "Perda total de comunicação por mais de 40 minutos",
    occurredAt: "Hoje, 13:52",
    duration: "40 min",
  },
  {
    id: "INC-103",
    stationName: "Estação 12",
    propertyName: "Fazenda Santa Rita",
    type: "offline",
    severity: "critical",
    description: "Sem sinal LoRa/4G e bateria em nível crítico (8%)",
    occurredAt: "Hoje, 12:47",
    duration: "1h 45min",
  },
  {
    id: "INC-102",
    stationName: "Estação 04",
    propertyName: "Fazenda Boa Vista",
    type: "packet_loss",
    severity: "warning",
    description: "Alta taxa de perda de pacotes (32%) e sinal degradado (-92 dBm)",
    occurredAt: "Hoje, 14:20",
    duration: "12 min",
  },
  {
    id: "INC-101",
    stationName: "Estação 08",
    propertyName: "Sítio Boa Vista",
    type: "high_latency",
    severity: "warning",
    description: "Latência média de transmissão acima de 1.800 ms",
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

  const communicationSummary: CommunicationSummary = {
    totalStations,
    onlineCount,
    unstableCount,
    offlineCount,
    globalAvailabilitySla: 96.4,
    packetsReceived24h: 14280,
    packetsLost24h: 420,
    avgLatencyMs: 148,
    onlinePercentage,
    slaTarget: 95.0,
  };

  const weatherOverview: WeatherOverview = {
    avgTemperature: 24.8,
    minTemperature: 16.9,
    maxTemperature: 28.9,
    avgSoilMoisture: 31.4,
    avgAirHumidity: 63,
    accumulatedRainfall: period === "7d" ? 27.3 : period === "30d" ? 112.5 : 2.4,
    avgWindSpeed: 14.2,
    maxWindGust: 28.5,
    solarRadiation: 840,
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
