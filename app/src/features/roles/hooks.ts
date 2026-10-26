"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useCan } from "@/features/auth/AuthProvider";
import { userKeys } from "@/features/users/hooks";

import { type RoleInput, rolesApi } from "./api";

export const roleKeys = { permissions: ["permissions"] as const };

export const useRolesWithPermissions = () =>
  useQuery({ enabled: useCan("roles.read"), queryKey: userKeys.roles, queryFn: rolesApi.list });

export const usePermissionCatalog = () =>
  useQuery({ enabled: useCan("permissions.read"), queryKey: roleKeys.permissions, queryFn: rolesApi.permissions, staleTime: 10 * 60_000 });

function useInvalidateRoles() {
  const client = useQueryClient();
  return () => Promise.all([
    client.invalidateQueries({ queryKey: userKeys.roles }),
    client.invalidateQueries({ queryKey: ["auth", "me"] }),
  ]);
}

export function useSaveRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: RoleInput }) =>
      id ? rolesApi.update(id, input) : rolesApi.create(input),
    onSuccess: invalidate,
  });
}

export function useDeleteRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({ mutationFn: rolesApi.remove, onSuccess: invalidate });
}

export function useSetRolePermissions() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: ({ id, permissions }: { id: number; permissions: string[] }) => rolesApi.setPermissions(id, permissions),
    onSuccess: invalidate,
  });
}
