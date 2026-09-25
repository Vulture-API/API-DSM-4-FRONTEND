import { query, request, requestAll } from "@/lib/api/http";

export type Station = {
  id: number;
  property_id: number;
  mac_address: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  last_communication_at: string | null;
  created_at: string;
};

export type StationInput = {
  property_id: number;
  name: string;
  mac_address: string;
  latitude: number | null;
  longitude: number | null;
};

export type Property = { id: number; name: string; location: string | null };

export type LatestReading = {
  sensor_id: number;
  local_identifier: string;
  sensor_type_id: number;
  sensor_type: string;
  unit_of_measure: string;
  value: number;
  unix_time: number;
};

export type StationStatus = "Online" | "Com alerta" | "Offline";

export type StationOverview = {
  id: number;
  name: string;
  mac_address: string;
  property_id: number;
  property_name: string;
  latitude: number | null;
  longitude: number | null;
  last_communication_at: string | null;
  sensors_total: number;
  sensors_active: number;
  active_alerts: number;
  latest_readings: LatestReading[];
  status: StationStatus;
};

export type Overview = {
  generated_at: string;
  offline_threshold_minutes: number;
  summary: { total: number; online: number; with_alert: number; offline: number };
  stations: StationOverview[];
};

export type SeriesPoint = { t: number; avg: number; min: number; max: number };
export type SensorTypeSeries = {
  sensor_type_id: number;
  sensor_type: string;
  unit_of_measure: string;
  points: SeriesPoint[];
};
export type ReadingSeries = {
  from: string;
  to: string;
  bucket_minutes: number;
  series: SensorTypeSeries[];
};

export type SeriesOptions = { hours: number; bucketMinutes: number; propertyId?: number | undefined };

export const stationsApi = {
  list: () => requestAll<Station>("/api/stations"),
  get: (id: number) => request<Station>(`/api/stations/${id}`),
  properties: () => request<Property[]>("/api/stations/properties"),
  overview: (propertyId?: number) =>
    request<Overview>(`/api/stations/overview${query({ property_id: propertyId })}`),
  networkSeries: ({ hours, bucketMinutes, propertyId }: SeriesOptions) =>
    request<ReadingSeries>(
      `/api/stations/readings/series${query({ hours, bucket_minutes: bucketMinutes, property_id: propertyId })}`,
    ),
  stationSeries: (id: number, { hours, bucketMinutes }: SeriesOptions) =>
    request<ReadingSeries>(
      `/api/stations/${id}/readings/series${query({ hours, bucket_minutes: bucketMinutes })}`,
    ),
  create: (input: StationInput) => request<Station>("/api/stations", { method: "POST", json: input }),
  update: (id: number, input: StationInput) =>
    request<Station>(`/api/stations/${id}`, { method: "PUT", json: input }),
  remove: (id: number) => request<void>(`/api/stations/${id}`, { method: "DELETE" }),
};
