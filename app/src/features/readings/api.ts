import { query, request } from "@/lib/api/http";

export type Reading = {
  id: number;
  sensor_id: number;
  value: number;
  unix_time: number;
  data_consistent: boolean;
  created_at: string;
};

export type ReadingsPaginated = {
  data: Reading[];
  meta: {
    total_records: number;
    total_pages: number;
    current_page: number;
  };
};

export type ReadingsQuery = {
  page?: number | undefined;
  limit?: number | undefined;
  sensor_id?: number | undefined;
  start_unix_time?: number | undefined;
  end_unix_time?: number | undefined;
};

export const readingsApi = {
  list: (params: ReadingsQuery = {}) =>
    request<ReadingsPaginated>(`/api/readings${query(params)}`),
};
