import { request, requestAll } from "@/lib/api/http";

export type User = {
  id: number;
  role_id: number;
  name: string;
  email: string;
  active: boolean;
  created_at: string;
};
export type Role = { id: number; name: string; description: string | null };
export type CreateUserInput = { role_id: number; name: string; email: string; password: string; active: boolean };
export type UpdateUserInput = { role_id: number; name: string; active: boolean };

export const usersApi = {
  list: () => requestAll<User>("/api/users"),
  roles: () => request<Role[]>("/api/roles"),
  create: (input: CreateUserInput) => request<User>("/api/users", { method: "POST", json: input }),
  update: (id: number, input: UpdateUserInput) =>
    request<User>(`/api/users/${id}`, { method: "PUT", json: input }),
  remove: (id: number) => request<void>(`/api/users/${id}`, { method: "DELETE" }),
};
