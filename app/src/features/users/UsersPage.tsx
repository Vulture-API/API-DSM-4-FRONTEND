"use client";

import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select, Switch } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { RowActions, Table, Td, Th, Tr } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/format";

import type { User } from "./api";
import { useDeleteUser, useRoles, useUpdateUser, useUsers } from "./hooks";
import { UserFormModal } from "./UserFormModal";

type StatusFilter = "all" | "active" | "inactive";

/** Cor do selo de cada cargo (os demais ficam neutros). */
const ROLE_TONE: Record<string, Tone> = { Administrador: "brand", "Gerente Agrícola": "info" };

export function UsersPage() {
  const users = useUsers();
  const roles = useRoles();
  const update = useUpdateUser();
  const remove = useDeleteUser();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [roleId, setRoleId] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<User | "new" | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const roleById = new Map(roles.data?.map((r) => [r.id, r]));
  const all = [...(users.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const term = search.trim().toLowerCase();
  const visible = all.filter(
    (u) =>
      (!roleId || u.role_id === Number(roleId)) &&
      (status === "all" || (status === "active") === u.active) &&
      (!term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)),
  );

  async function toggle(user: User) {
    try {
      await update.mutateAsync({ id: user.id, input: { name: user.name, role_id: user.role_id, active: !user.active } });
      toast.success(user.active ? `${user.name} desativado.` : `${user.name} ativado.`);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success("Usuário excluído.");
      setDeleting(null);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Usuários"
        description="Pessoas com acesso ao portal e seus cargos."
        actions={
          <Button variant="light" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>
            Novo usuário
          </Button>
        }
      />
      <Card className="shadow-[var(--shadow-lift)]">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <SearchInput label="Buscar usuário" placeholder="Buscar por nome ou e-mail" value={search} onChange={setSearch} className="lg:w-72" />
          <Select aria-label="Filtrar por cargo" value={roleId} onChange={(e) => setRoleId(e.target.value)} className="h-9 lg:w-52">
            <option value="">Todos os cargos</option>
            {roles.data?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
          <div className="lg:ml-auto">
            <Segmented
              label="Filtrar por status"
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "Todos", count: all.length },
                { value: "active", label: "Ativos", count: all.filter((u) => u.active).length },
                { value: "inactive", label: "Inativos", count: all.filter((u) => !u.active).length },
              ]}
            />
          </div>
        </div>
        {users.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : users.error ? (
          <ErrorState message={users.error.message} onRetry={() => void users.refetch()} />
        ) : visible.length === 0 ? (
          <EmptyState icon={<Users className="size-5" />} title={all.length ? "Nenhum usuário com esses filtros" : "Nenhum usuário cadastrado"} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Usuário</Th>
                <Th className="hidden sm:table-cell">Cargo</Th>
                <Th>Ativo</Th>
                <Th className="hidden md:table-cell">Desde</Th>
                <Th className="w-20">
                  <span className="sr-only">Ações</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((user) => (
                <Tr key={user.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} className={user.active ? undefined : "grayscale"} />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-medium text-ink">
                          {user.name}
                          {!user.active && (
                            <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">Inativo</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted">{user.email}</p>
                        <p className="text-xs text-muted sm:hidden">
                          Cargo: {roleById.get(user.role_id)?.name ?? `#${user.role_id}`}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <Badge tone={ROLE_TONE[roleById.get(user.role_id)?.name ?? ""] ?? "neutral"}>
                      {roleById.get(user.role_id)?.name ?? `Cargo #${user.role_id}`}
                    </Badge>
                  </Td>
                  <Td>
                    <Switch label={`${user.name} ativo`} checked={user.active} onChange={() => void toggle(user)} />
                  </Td>
                  <Td className="hidden whitespace-nowrap text-muted md:table-cell">{formatDate(user.created_at)}</Td>
                  <Td>
                    <RowActions>
                      <IconButton label={`Editar ${user.name}`} onClick={() => setEditing(user)}>
                        <Pencil className="size-4" />
                      </IconButton>
                      <IconButton label={`Excluir ${user.name}`} onClick={() => setDeleting(user)} className="hover:text-danger">
                        <Trash2 className="size-4" />
                      </IconButton>
                    </RowActions>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      {editing && <UserFormModal user={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir usuário"
        message={`${deleting?.name ?? ""} perde o acesso ao portal. Se ele tiver registros vinculados, prefira desativar.`}
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
