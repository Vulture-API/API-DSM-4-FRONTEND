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

interface PropertyProfile {
  baseTemp: number;
  tempMin: number;
  tempMax: number;
  baseSoilMoist: number;
  baseSoilTemp: number;
  baseWind: number;
  gustWind: number;
  baseRain24h: number;
  baseRain7d: number;
  baseRain30d: number;
  sla: number;
  uptimeDropAt?: string;
  uptimeLevel: number;
}

const propertyProfiles: Record<string, PropertyProfile> = {
  all: {
    baseTemp: 24.8,
    tempMin: 16.9,
    tempMax: 28.9,
    baseSoilMoist: 31.4,
    baseSoilTemp: 22.8,
    baseWind: 14.2,
    gustWind: 28.5,
    baseRain24h: 2.4,
    baseRain7d: 27.3,
    baseRain30d: 112.5,
    sla: 96.4,
    uptimeLevel: 91.6,
  },
  "1": {
    baseTemp: 25.1,
    tempMin: 17.2,
    tempMax: 29.5,
    baseSoilMoist: 33.0,
    baseSoilTemp: 23.1,
    baseWind: 12.5,
    gustWind: 24.0,
    baseRain24h: 1.8,
    baseRain7d: 22.0,
    baseRain30d: 95.0,
    sla: 93.2,
    uptimeDropAt: "12:00",
    uptimeLevel: 75.0,
  },
  "2": {
    baseTemp: 29.2,
    tempMin: 20.4,
    tempMax: 34.1,
    baseSoilMoist: 16.0,
    baseSoilTemp: 27.6,
    baseWind: 9.8,
    gustWind: 18.0,
    baseRain24h: 0.0,
    baseRain7d: 1.2,
    baseRain30d: 14.0,
    sla: 71.5,
    uptimeLevel: 50.0,
  },
  "3": {
    baseTemp: 22.4,
    tempMin: 15.1,
    tempMax: 26.2,
    baseSoilMoist: 37.0,
    baseSoilTemp: 21.7,
    baseWind: 16.4,
    gustWind: 32.0,
    baseRain24h: 6.2,
    baseRain7d: 38.4,
    baseRain30d: 145.0,
    sla: 99.8,
    uptimeLevel: 100.0,
  },
  "4": {
    baseTemp: 26.3,
    tempMin: 18.4,
    tempMax: 30.1,
    baseSoilMoist: 28.0,
    baseSoilTemp: 24.2,
    baseWind: 18.9,
    gustWind: 36.5,
    baseRain24h: 0.5,
    baseRain7d: 18.0,
    baseRain30d: 82.0,
    sla: 88.6,
    uptimeLevel: 85.0,
  },
  "5": {
    baseTemp: 23.7,
    tempMin: 16.0,
    tempMax: 27.5,
    baseSoilMoist: 39.0,
    baseSoilTemp: 22.1,
    baseWind: 11.2,
    gustWind: 21.0,
    baseRain24h: 8.5,
    baseRain7d: 46.2,
    baseRain30d: 168.0,
    sla: 99.5,
    uptimeLevel: 100.0,
  },
};

export function getFilteredDashboardData(propertyId: string, period: string) {
  let stations = mockStationsCommunication;

  if (propertyId !== "all") {
    const prop = propertiesList.find((p) => p.id === propertyId);
    if (prop) {
      stations = mockStationsCommunication.filter((s) => s.property === prop.name);
    }
  }

  const profile = propertyProfiles[propertyId] || propertyProfiles.all;

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
    globalAvailabilitySla: profile.sla,
    consistentDataRate,
    onlinePercentage,
    slaTarget: 95.0,
  };

  const accumulatedRainfall =
    period === "today"
      ? profile.baseRain24h * 0.4
      : period === "7d"
      ? profile.baseRain7d
      : period === "30d"
      ? profile.baseRain30d
      : profile.baseRain24h;

  const weatherOverview: WeatherOverview = {
    avgTemperature: profile.baseTemp,
    minTemperature: profile.tempMin,
    maxTemperature: profile.tempMax,
    avgSoilMoisture: profile.baseSoilMoist,
    avgSoilTemperature: profile.baseSoilTemp,
    accumulatedRainfall: Number(accumulatedRainfall.toFixed(1)),
    avgWindSpeed: profile.baseWind,
    maxWindGust: profile.gustWind,
    soilMoistureStatus:
      profile.baseSoilMoist < 20
        ? "critical"
        : profile.baseSoilMoist < 25
        ? "warning"
        : "adequate",
  };

  // Generate dynamic hourly communication points
  const hours = ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00"];
  const hourlyCommunication: HourlyCommunicationPoint[] = hours.map((h, i) => {
    let uptime = 100;
    if (propertyId === "2") {
      // Fazenda Boa Vista (unstable & offline)
      uptime = 50 + (i % 2 === 0 ? 10 : 0);
    } else if (propertyId === "1") {
      // Fazenda Santa Rita drops when Est 12 disconnects at 12h
      uptime = i >= 6 ? 75 : 100;
    } else if (propertyId === "4") {
      uptime = 85 + (i % 3 === 0 ? 5 : -5);
    } else if (propertyId === "3" || propertyId === "5") {
      uptime = 100;
    } else {
      // All
      const curve = [100, 100, 96.2, 95.8, 91.6, 89.2, 83.3, 80.5];
      uptime = curve[i];
    }

    const onCount = Math.round((uptime / 100) * totalStations);
    const offCount = totalStations - onCount;

    return {
      hour: h,
      onlineCount: onCount,
      unstableCount: unstableCount > 0 && i >= 4 ? 1 : 0,
      offlineCount: offCount,
      uptimePct: uptime,
    };
  });

  // Generate dynamic weather trends based on property and period
  let weatherTrends: WeatherTrendPoint[] = [];
  if (period === "7d") {
    const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    weatherTrends = days.map((day, idx) => ({
      time: day,
      temperature: Number((profile.baseTemp + Math.sin(idx) * 2.5).toFixed(1)),
      soilMoisture: Number((profile.baseSoilMoist + Math.cos(idx) * 2.0).toFixed(0)),
      soilTemperature: Number((profile.baseSoilTemp + Math.sin(idx + 1) * 1.5).toFixed(1)),
    }));
  } else if (period === "30d") {
    const weeks = ["Sem 1", "Sem 2", "Sem 3", "Sem 4"];
    weatherTrends = weeks.map((w, idx) => ({
      time: w,
      temperature: Number((profile.baseTemp + (idx - 1.5) * 1.2).toFixed(1)),
      soilMoisture: Number((profile.baseSoilMoist - idx * 1.5).toFixed(0)),
      soilTemperature: Number((profile.baseSoilTemp + (idx - 1.5) * 0.8).toFixed(1)),
    }));
  } else {
    // 24h / today
    weatherTrends = hours.map((h, idx) => ({
      time: h,
      temperature: Number((profile.tempMin + ((profile.tempMax - profile.tempMin) * (idx / 7))).toFixed(1)),
      soilMoisture: Number((profile.baseSoilMoist + (3 - idx * 0.6)).toFixed(0)),
      soilTemperature: Number((profile.baseSoilTemp + (idx * 0.3)).toFixed(1)),
    }));
  }

  // Generate dynamic rainfall points based on property and period
  let rainfall: RainfallPoint[] = [];
  if (period === "today" || period === "24h") {
    const timeLabels = ["00h", "04h", "08h", "12h", "16h", "20h"];
    const rainFactor = profile.baseRain24h / 4;
    rainfall = timeLabels.map((lbl, idx) => ({
      label: lbl,
      amountMm: idx === 3 || idx === 4 ? Number((rainFactor * 1.5).toFixed(1)) : Number((rainFactor * 0.3).toFixed(1)),
    }));
  } else if (period === "30d") {
    const weeks = ["Sem 1", "Sem 2", "Sem 3", "Sem 4"];
    const weekRain = profile.baseRain30d / 4;
    rainfall = weeks.map((w, idx) => ({
      label: w,
      amountMm: Number((weekRain * (0.8 + (idx % 2) * 0.4)).toFixed(1)),
    }));
  } else {
    // 7d
    const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const dayRain = profile.baseRain7d / 5;
    rainfall = days.map((d, idx) => ({
      label: d,
      amountMm: idx === 1 || idx === 2 || idx === 5 ? Number((dayRain * 1.6).toFixed(1)) : 0.0,
    }));
  }

  return {
    summary: communicationSummary,
    weather: weatherOverview,
    stations,
    hourlyCommunication,
    weatherTrends,
    rainfall,
    incidents: mockIncidents.filter((inc) =>
      propertyId === "all"
        ? true
        : stations.some((s) => s.name === inc.stationName)
    ),
  };
}
