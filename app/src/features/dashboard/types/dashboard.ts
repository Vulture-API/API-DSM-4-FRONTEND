export type StationCommunicationStatus = "online" | "unstable" | "offline";

export interface CommunicationSummary {
  totalStations: number;
  onlineCount: number;
  unstableCount: number;
  offlineCount: number;
  globalAvailabilitySla: number;
  consistentDataRate: number;
  onlinePercentage: number;
  slaTarget: number;
}

export interface WeatherOverview {
  avgTemperature: number;
  minTemperature: number;
  maxTemperature: number;
  avgSoilMoisture: number;
  avgSoilTemperature: number;
  accumulatedRainfall: number;
  avgWindSpeed: number;
  maxWindGust: number;
  soilMoistureStatus: "adequate" | "warning" | "critical";
}

export interface HourlyCommunicationPoint {
  hour: string;
  onlineCount: number;
  unstableCount: number;
  offlineCount: number;
  uptimePct: number;
}

export interface WeatherTrendPoint {
  time: string;
  temperature: number;
  soilMoisture: number;
  soilTemperature: number;
}

export interface RainfallPoint {
  label: string;
  amountMm: number;
}

export interface StationCommunicationDetail {
  id: number;
  codigo: string;
  name: string;
  property: string;
  status: StationCommunicationStatus;
  latitude: number;
  longitude: number;
  lastCommunication: string;
  lastCommunicationMinutesAgo: number;
  activeSensorsCount: number;
  totalSensorsCount: number;
  dataConsistent: boolean;
  macAddress: string;
}

export interface CommunicationIncident {
  id: string;
  stationName: string;
  propertyName: string;
  type: "offline" | "inconsistent_data" | "sensor_inactive" | "no_communication";
  severity: "critical" | "warning" | "info";
  description: string;
  occurredAt: string;
  duration: string;
}

export type DashboardPeriod = "today" | "24h" | "7d" | "30d";
