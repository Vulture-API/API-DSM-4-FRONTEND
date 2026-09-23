export type StationCommunicationStatus = "online" | "unstable" | "offline";

export interface CommunicationSummary {
  totalStations: number;
  onlineCount: number;
  unstableCount: number;
  offlineCount: number;
  globalAvailabilitySla: number;
  packetsReceived24h: number;
  packetsLost24h: number;
  avgLatencyMs: number;
  onlinePercentage: number;
  slaTarget: number;
}

export interface WeatherOverview {
  avgTemperature: number;
  minTemperature: number;
  maxTemperature: number;
  avgSoilMoisture: number;
  avgAirHumidity: number;
  accumulatedRainfall: number;
  avgWindSpeed: number;
  maxWindGust: number;
  solarRadiation: number;
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
  humidity: number;
  soilMoisture: number;
}

export interface RainfallPoint {
  label: string;
  amountMm: number;
}

export interface StationCommunicationDetail {
  id: number;
  name: string;
  property: string;
  status: StationCommunicationStatus;
  signalStrength: "excellent" | "good" | "fair" | "poor" | "none";
  signalDbm: number;
  batteryPct: number;
  lastCommunication: string;
  lastCommunicationMinutesAgo: number;
  activeSensorsCount: number;
  totalSensorsCount: number;
  macAddress: string;
  firmwareVersion: string;
}

export interface CommunicationIncident {
  id: string;
  stationName: string;
  propertyName: string;
  type: "offline" | "packet_loss" | "high_latency" | "sensor_timeout";
  severity: "critical" | "warning" | "info";
  description: string;
  occurredAt: string;
  duration: string;
}

export type DashboardPeriod = "today" | "24h" | "7d" | "30d";
