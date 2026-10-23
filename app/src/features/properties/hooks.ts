"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { propertiesApi, type PropertyInput } from "./api";

export const propertyKeys = {
  all: ["properties"] as const,
  list: () => [...propertyKeys.all, "list"] as const,
  detail: (id: number) => [...propertyKeys.all, "detail", id] as const,
};

export function usePropertiesList() {
  return useQuery({
    queryKey: propertyKeys.list(),
    queryFn: propertiesApi.list,
  });
}

export function useProperty(id: number) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => propertiesApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateProperty() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: PropertyInput) => propertiesApi.create(data),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: propertyKeys.all });
      void client.invalidateQueries({ queryKey: ["stations"] });
    },
  });
}

export function useUpdateProperty() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PropertyInput }) =>
      propertiesApi.update(id, data),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: propertyKeys.all });
      void client.invalidateQueries({ queryKey: ["stations"] });
    },
  });
}

export function useDeleteProperty() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => propertiesApi.delete(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: propertyKeys.all });
      void client.invalidateQueries({ queryKey: ["stations"] });
    },
  });
}

export function useAssociateStation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      stationId,
      propertyId,
    }: {
      stationId: number;
      propertyId: number;
    }) => propertiesApi.associateStation(stationId, propertyId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: propertyKeys.all });
      void client.invalidateQueries({ queryKey: ["stations"] });
    },
  });
}
