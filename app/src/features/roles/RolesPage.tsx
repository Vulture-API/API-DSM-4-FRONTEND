"use client";

import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

import { Button, IconButton } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { Can } from "@/features/auth/Can";
import { useCan } from "@/features/auth/AuthProvider";
import { useUsers } from "@/features/users/hooks";
import { ApiError } from "@/lib/api/http";
import { cn } from "@/lib/cn";

import type { Permission, RoleWithPermissions } from "./api";
import { useDeleteRole, usePermissionCatalog, useRolesWithPermissions, useSaveRole, useSetRolePermissions } from "./hooks";

/** Rótulo de cada grupo do catálogo (prefixo do código da permissão). */
const GROUP_LABELS: Record<string, string> = {
  monitoring: "Monitoramento",
  stations: "Estações",
  sensors: "Sensores",
  "sensor-types": "Parâmetros",
  properties: "Propriedades",
  "alert-configs": "Regras de alerta",
  "triggered-alerts": "Alertas disparados",
  occurrences: "Ocorrências",
  "rules-engine": "Motor de regras",
  users: "Usuários",
  roles: "Perfis",
  permissions: "Permissões",
};

export function groupPermissions(catalog: Permission[]) {
  const groups = new Map<string, Permission[]>();
  for (const permission of catalog) {
    const prefix = permission.code.split(".")[0] ?? permission.code;
    groups.set(prefix, [...(groups.get(prefix) ?? []), permission]);
  }
  return [...groups.entries()]
    .map(([prefix, items]) => ({ prefix, label: GROUP_LABELS[prefix] ?? prefix, items }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function RolesPage() {
  const roles = useRolesWithPermissions();
  const catalog = usePermissionCatalog();
  const users = useUsers();
  const toast = useToast();
  const setPermissions = useSetRolePermissions();
  const removeRole = useDeleteRole();
  const canEdit = useCan("roles.permissions.update");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ roleId: number; codes: Set<string> } | null>(null);
  const [editing, setEditing] = useState<RoleWithPermissions | "new" | null>(null);
  const [deleting, setDeleting] = useState<RoleWithPermissions | null>(null);

  const list = useMemo(() => [...(roles.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [roles.data]);
  const selected = list.find((r) => r.id === selectedId) ?? list[0];
  const groups = useMemo(() => groupPermissions(catalog.data ?? []), [catalog.data]);
  const usersByRole = useMemo(() => {
    const counts = new Map<number, number>();
    users.data?.forEach((u) => counts.set(u.role_id, (counts.get(u.role_id) ?? 0) + 1));
    return counts;
  }, [users.data]);

  const saved = new Set(selected?.permissions ?? []);
  const current = draft && selected && draft.roleId === selected.id ? draft.codes : saved;
  const dirty = current.size !== saved.size || [...current].some((code) => !saved.has(code));

  function toggle(codes: string[], value: boolean) {
    if (!selected) return;
    const next = new Set(current);
    codes.forEach((code) => (value ? next.add(code) : next.delete(code)));
    setDraft({ roleId: selected.id, codes: next });
  }

  function select(role: RoleWithPermissions) {
    setSelectedId(role.id);
    setDraft(null);
  }

  async function save() {
    if (!selected) return;
    try {
      await setPermissions.mutateAsync({ id: selected.id, permissions: [...current].sort() });
      toast.success(`Permissões do perfil "${selected.name}" atualizadas.`);
      setDraft(null);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await removeRole.mutateAsync(deleting.id);
      toast.success(`Perfil "${deleting.name}" excluído.`);
      if (selectedId === deleting.id) setSelectedId(null);
      setDeleting(null);
    } catch (error) {
      toast.error(error instanceof ApiError && error.status === 409
        ? "O perfil possui usuários vinculados. Altere o cargo desses usuários antes."
        : (error as Error).message);
    }
  }

  const deletingUsers = deleting ? (usersByRole.get(deleting.id) ?? 0) : 0;
  const error = roles.error ?? catalog.error;

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Perfis e permissões"
        description="Defina o que cada perfil de acesso pode consultar e alterar no portal."
        actions={
          <Can permission="roles.create">
            <Button variant="light" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>
              Novo perfil
            </Button>
          </Can>
        }
      />
      {error ? (
        <ErrorState message={error.message} onRetry={() => { void roles.refetch(); void catalog.refetch(); }} />
      ) : roles.isLoading || catalog.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-64 lg:col-span-4" />
          <Skeleton className="h-96 lg:col-span-8" />
        </div>
      ) : !selected ? (
        <Card><EmptyState title="Nenhum perfil cadastrado" description="Crie um perfil para atribuir aos usuários." /></Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-4">
            <CardHeader title="Perfis" description={`${list.length} perfis de acesso`} />
            <ul className="mt-4 divide-y divide-line border-t border-line" aria-label="Perfis de acesso">
              {list.map((role) => (
                <li key={role.id} className={cn("flex items-center gap-2 px-5 py-3", role.id === selected.id && "bg-brand-50/60")}>
                  <button type="button" className="min-w-0 flex-1 text-left" aria-current={role.id === selected.id} onClick={() => select(role)}>
                    <span className="block truncate text-sm font-medium text-ink">{role.name}</span>
                    <span className="block text-xs text-muted">
                      {role.permissions.length} permissões · {usersByRole.get(role.id) ?? 0} usuário(s)
                    </span>
                  </button>
                  <Can permission="roles.update">
                    <IconButton label={`Editar ${role.name}`} onClick={() => setEditing(role)}><Pencil className="size-4" /></IconButton>
                  </Can>
                  <Can permission="roles.delete">
                    <IconButton label={`Excluir ${role.name}`} onClick={() => setDeleting(role)}><Trash2 className="size-4" /></IconButton>
                  </Can>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="lg:col-span-8">
            <CardHeader
              icon={<ShieldCheck className="size-4" />}
              title={`Permissões — ${selected.name}`}
              description={selected.description ?? "Marque o que este perfil pode fazer."}
              action={canEdit && (
                <>
                  <Button variant="secondary" size="sm" disabled={!dirty || setPermissions.isPending} onClick={() => setDraft(null)}>
                    Descartar
                  </Button>
                  <Button size="sm" disabled={!dirty} loading={setPermissions.isPending} onClick={() => void save()}>
                    Salvar permissões
                  </Button>
                </>
              )}
            />
            <div className="mt-4 grid gap-4 border-t border-line p-5 sm:grid-cols-2">
              {groups.map((group) => {
                const codes = group.items.map((p) => p.code);
                const all = codes.every((code) => current.has(code));
                return (
                  <fieldset key={group.prefix} className="rounded-xl border border-line p-3">
                    <legend className="flex w-full items-center justify-between gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                      <span>{group.label}</span>
                      {canEdit && (
                        <button type="button" className="text-[11px] font-medium normal-case text-brand-600 hover:underline" onClick={() => toggle(codes, !all)}>
                          {all ? "Desmarcar todas" : "Marcar todas"}
                        </button>
                      )}
                    </legend>
                    <ul className="mt-1 space-y-1.5">
                      {group.items.map((permission) => (
                        <li key={permission.code}>
                          <label className="flex items-start gap-2 text-sm text-ink">
                            <input
                              type="checkbox"
                              className="mt-0.5 size-4 accent-brand-600"
                              checked={current.has(permission.code)}
                              disabled={!canEdit}
                              onChange={(e) => toggle([permission.code], e.target.checked)}
                            />
                            <span>
                              {permission.description}
                              <span className="block font-mono text-[11px] text-faint">{permission.code}</span>
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </fieldset>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {editing && <RoleModal role={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} onSaved={(id) => setSelectedId(id)} />}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir perfil"
        message={deletingUsers
          ? `O perfil "${deleting?.name}" está atribuído a ${deletingUsers} usuário(s). Altere o cargo desses usuários antes de excluir.`
          : `O perfil "${deleting?.name ?? ""}" será excluído.`}
        confirmDisabled={deletingUsers > 0}
        loading={removeRole.isPending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

function RoleModal({ role, onClose, onSaved }: { role?: RoleWithPermissions | undefined; onClose: () => void; onSaved: (id: number) => void }) {
  const save = useSaveRole();
  const toast = useToast();
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Informe o nome do perfil.");
      return;
    }
    try {
      const result = await save.mutateAsync({ id: role?.id, input: { name: name.trim(), description: description.trim() || null } });
      toast.success(role ? "Perfil atualizado." : "Perfil criado. Agora marque as permissões.");
      onSaved(result.id);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError && err.status === 409 ? "Já existe um perfil com esse nome." : (err as Error).message);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={role ? "Editar perfil" : "Novo perfil"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="role-form" loading={save.isPending}>{role ? "Salvar" : "Criar perfil"}</Button>
        </>
      }
    >
      <form id="role-form" onSubmit={(e) => void submit(e)} noValidate className="space-y-4">
        <Field label="Nome" error={error}>
          {(p) => <Input {...p} value={name} maxLength={50} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Técnico de campo" />}
        </Field>
        <Field label="Descrição" hint="Opcional">
          {(p) => <Input {...p} value={description} maxLength={255} onChange={(e) => setDescription(e.target.value)} />}
        </Field>
      </form>
    </Modal>
  );
}
