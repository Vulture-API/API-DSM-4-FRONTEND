"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { type Occurrence, occurrencesApi } from "./api";

export function useOpenOccurrences(stationId?: number) {
  return useQuery({
    queryKey: ["occurrences", "open", stationId ?? "all"],
    queryFn: () => occurrencesApi.open(stationId),
    refetchInterval: 30_000,
  });
}

export function useResolveOccurrence() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: occurrencesApi.resolve,
    onSuccess: async (resolved) => {
      // Evita que uma consulta iniciada antes da resolução restaure a ocorrência.
      await client.cancelQueries({ queryKey: ["occurrences", "open"] });
      client.setQueriesData<Occurrence[]>({ queryKey: ["occurrences", "open"] },
        (data) => data?.filter((o) => o.id !== resolved.id));
      await client.invalidateQueries({ queryKey: ["occurrences"] });
    },
  });
}
