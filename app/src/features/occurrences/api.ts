import { query, request, requestAll } from "@/lib/api/http";

export type Occurrence = {
  id: number;
  type: "COMMUNICATION_FAILURE" | "OUT_OF_RANGE";
  status: "OPEN" | "RESOLVED";
  station_id: number;
  station_name: string;
  sensor_id: number | null;
  sensor_identifier: string | null;
  sensor_type: string | null;
  reading_id: number | null;
  value: number | null;
  description: string;
  detected_at: string;
  resolved_at: string | null;
};

export const occurrencesApi = {
  resolve: (id: number) =>
    request<Occurrence>(`/api/occurrences/${id}/resolve`, { method: "PATCH" }),
  open: (stationId?: number) =>
    requestAll<Occurrence>(`/api/occurrences${query({ status: "OPEN", station_id: stationId })}`),
};
