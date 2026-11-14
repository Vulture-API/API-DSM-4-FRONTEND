"use client";

import { useAuth, useCan } from "@/features/auth/AuthProvider";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { type CreateUserInput, type UpdateUserInput, usersApi } from "./api";
import { propertiesApi } from "@/features/properties/api";

export const useUserProperties = (id: number | undefined, enabled: boolean) => useQuery({
  queryKey: ["users", id, "properties"], queryFn: () => usersApi.properties(id!), enabled: enabled && id !== undefined,
});
export const usePropertyOptions = (enabled: boolean) => useQuery({
  queryKey: ["properties", "user-link-options"], queryFn: propertiesApi.list, enabled,
});
export function useReplaceUserProperties() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ids }: { id: number; ids: number[] }) => usersApi.replaceProperties(id, ids),
    onSuccess: async () => { await client.invalidateQueries(); },
  });
}

export const userKeys = { list: ["users"] as const, roles: ["roles"] as const };

export const useUsers = () => useQuery({ enabled: useCan("users.read"), queryKey: userKeys.list, queryFn: usersApi.list });
export const useRoles = () =>
  useQuery({ enabled: useCan("roles.read"), queryKey: userKeys.roles, queryFn: usersApi.roles, staleTime: 10 * 60_000 });

export function useCreateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => usersApi.create(input),
    onSuccess: () => client.invalidateQueries({ queryKey: userKeys.list }),
  });
}

export function useUpdateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateUserInput }) => usersApi.update(id, input),
    onSuccess: async () => {
      await Promise.all([client.invalidateQueries({ queryKey: userKeys.list }), client.invalidateQueries({ queryKey: ["auth", "me"] })]);
    },
  });
}

export function useDeleteUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: usersApi.remove,
    onSuccess: () => client.invalidateQueries({ queryKey: userKeys.list }),
  });
}

/** Identidade validada pelo backend, sem usuário de demonstração. */
export function useCurrentUser() { return useAuth().user ?? undefined; }
