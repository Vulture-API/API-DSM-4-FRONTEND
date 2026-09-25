"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { type CreateUserInput, type UpdateUserInput, usersApi } from "./api";

export const userKeys = { list: ["users"] as const, roles: ["roles"] as const };

export const useUsers = () => useQuery({ queryKey: userKeys.list, queryFn: usersApi.list });
export const useRoles = () =>
  useQuery({ queryKey: userKeys.roles, queryFn: usersApi.roles, staleTime: 10 * 60_000 });

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
    onSuccess: () => client.invalidateQueries({ queryKey: userKeys.list }),
  });
}

export function useDeleteUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: usersApi.remove,
    onSuccess: () => client.invalidateQueries({ queryKey: userKeys.list }),
  });
}

/**
 * Ainda não há login: as ações que registram "quem fez" (reconhecer alerta)
 * usam o primeiro administrador ativo como usuário da demonstração.
 */
export function useCurrentUser() {
  const users = useUsers();
  const roles = useRoles();
  const adminRole = roles.data?.find((r) => r.name === "Administrador");
  const active = users.data?.filter((u) => u.active) ?? [];
  return active.find((u) => u.role_id === adminRole?.id) ?? active[0];
}
