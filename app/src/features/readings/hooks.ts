"use client";

import { useQuery } from "@tanstack/react-query";

import { type ReadingsQuery, readingsApi } from "./api";

export const readingKeys = {
  all: ["readings"] as const,
  list: (params: ReadingsQuery) => [...readingKeys.all, "list", params] as const,
};

export function useReadings(params: ReadingsQuery = {}) {
  return useQuery({
    queryKey: readingKeys.list(params),
    queryFn: () => readingsApi.list(params),
  });
}
