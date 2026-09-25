import { query, request, requestAll } from "@/lib/api/http";

export type SensorType = {
  id: number;
  name: string;
  unit_of_measure: string;
  factor: number | null;
  gain: number | null;
};
export type SensorTypeInput = Omit<SensorType, "id">;

export type Sensor = {
  id: number;
  station_id: number;
  sensor_type_id: number;
  local_identifier: string;
  operational_status: boolean;
  created_at: string;
};
export type SensorInput = Omit<Sensor, "id" | "created_at">;

export const parametersApi = {
  sensorTypes: () => request<SensorType[]>("/api/sensor-types"),
  createSensorType: (input: SensorTypeInput) =>
    request<SensorType>("/api/sensor-types", { method: "POST", json: input }),
  updateSensorType: (id: number, input: SensorTypeInput) =>
    request<SensorType>(`/api/sensor-types/${id}`, { method: "PUT", json: input }),
  removeSensorType: (id: number) => request<void>(`/api/sensor-types/${id}`, { method: "DELETE" }),

  sensors: (stationId?: number) => requestAll<Sensor>(`/api/sensors${query({ station_id: stationId })}`),
  createSensor: (input: SensorInput) => request<Sensor>("/api/sensors", { method: "POST", json: input }),
  updateSensor: (id: number, input: SensorInput) =>
    request<Sensor>(`/api/sensors/${id}`, { method: "PUT", json: input }),
  removeSensor: (id: number) => request<void>(`/api/sensors/${id}`, { method: "DELETE" }),
};
