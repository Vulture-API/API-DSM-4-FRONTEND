"use client";

import { useCan } from "@/features/auth/AuthProvider";

import { useQuery } from "@tanstack/react-query";

import { type ReadingsQuery, readingsApi } from "./api";

export const readingKeys = {
  all: ["readings"] as const,
  list: (params: ReadingsQuery) => [...readingKeys.all, "list", params] as const,
};

export function useReadings(params: ReadingsQuery = {}) {
  return useQuery({
    enabled: useCan("monitoring.read"),
    queryKey: readingKeys.list(params),
    queryFn: () => readingsApi.list(params),
  });
}
