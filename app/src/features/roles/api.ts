import { request } from "@/lib/api/http";

export type RoleWithPermissions = {
  id: number;
  name: string;
  description: string | null;
  created_at?: string;
  permissions: string[];
};
export type Permission = { code: string; description: string };
export type RoleInput = { name: string; description: string | null };

export const rolesApi = {
  list: () => request<RoleWithPermissions[]>("/api/roles"),
  permissions: () => request<Permission[]>("/api/permissions"),
  create: (input: RoleInput) => request<RoleWithPermissions>("/api/roles", { method: "POST", json: input }),
  update: (id: number, input: RoleInput) =>
    request<RoleWithPermissions>(`/api/roles/${id}`, { method: "PUT", json: input }),
  remove: (id: number) => request<void>(`/api/roles/${id}`, { method: "DELETE" }),
  setPermissions: (id: number, permissions: string[]) =>
    request<unknown>(`/api/roles/${id}/permissions`, { method: "PUT", json: { permissions } }),
};
