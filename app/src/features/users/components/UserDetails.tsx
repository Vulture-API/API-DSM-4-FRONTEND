"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Badge } from "@/components/ui/Badge/Badge";
import { Button } from "@/components/ui/Button/Button";

import type { Cargo, UserListItem } from "../types/user";
import type { EditUserFormValues } from "../schemas/editUserSchema";
import { DeleteUserModal } from "./DeleteUserModal";
import { EditUserModal } from "./EditUserModal";

import styles from "./UserDetails.module.css";

type UserDetailsProps = {
  user: UserListItem;
  cargos: Cargo[];
  updating?: boolean;
  deleting?: boolean;
  onUpdate: (
    id: number,
    values: EditUserFormValues,
  ) => Promise<void> | void;
  onDelete: (id: number) => Promise<void> | void;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatCreatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function UserDetails({
  user,
  cargos,
  updating = false,
  deleting = false,
  onUpdate,
  onDelete,
}: UserDetailsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);


  const initials = useMemo(() => getInitials(user.nome), [user.nome]);

  async function handleUpdate(values: EditUserFormValues) {
    await onUpdate(user.id, values);
    setEditOpen(false);
  }

  async function handleDelete() {
    await onDelete(user.id);
  }

  return (
    <>
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <Link href="/administracao/usuarios" className={styles.backLink}>
            ← Voltar para a lista
          </Link>

          <div className={styles.actions}>
            <Button
              type="button"
              className={styles.deleteAction}
              onClick={() => setDeleteOpen(true)}
            >
              Excluir usuário
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditOpen(true)}
            >
              Editar usuário
            </Button>
          </div>
        </div>

        <section className={styles.summaryCard} aria-labelledby="user-name">
          <div className={styles.identity}>
            <div className={styles.avatar} aria-hidden="true">
              {initials}
            </div>

            <div>
              <h2 id="user-name" className={styles.userName}>
                {user.nome}
              </h2>
              <p className={styles.userEmail}>
                {user.email ?? "E-mail não informado"}
              </p>
            </div>
          </div>

          <dl className={styles.summaryGrid}>
            <div>
              <dt>Cargo</dt>
              <dd>{user.cargo.nome}</dd>
            </div>

            <div>
              <dt>Status</dt>
              <dd>
                <Badge tone={user.ativo ? "positive" : "neutral"}>{user.ativo ? "Ativo" : "Inativo"}</Badge>
              </dd>
            </div>

            <div>
              <dt>Usuário desde</dt>
              <dd>{formatCreatedAt(user.criado_em)}</dd>
            </div>

            <div>
              <dt>ID</dt>
              <dd>#{user.id}</dd>
            </div>
          </dl>
        </section>

        <section
          className={styles.infoCard}
          aria-labelledby="user-information-heading"
        >
          <div className={styles.cardHeader}>
            <div>
              <h2
                id="user-information-heading"
                className={styles.cardTitle}
              >
                Informações do usuário
              </h2>
              <p className={styles.cardDescription}>
                Dados cadastrados para identificação e acesso.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditOpen(true)}
            >
              Editar
            </Button>
          </div>

          <dl className={styles.detailsList}>
            <div>
              <dt>Nome completo</dt>
              <dd>{user.nome}</dd>
            </div>

            <div>
              <dt>E-mail</dt>
              <dd>{user.email ?? "Não informado"}</dd>
            </div>

            <div>
              <dt>Cargo</dt>
              <dd>{user.cargo.nome}</dd>
            </div>

            <div>
              <dt>Status</dt>
              <dd>
                <Badge tone={user.ativo ? "positive" : "neutral"}>{user.ativo ? "Ativo" : "Inativo"}</Badge>
              </dd>
            </div>

            <div>
              <dt>Criado em</dt>
              <dd>{formatCreatedAt(user.criado_em)}</dd>
            </div>
          </dl>
        </section>
      </div>

      {editOpen && <EditUserModal
        open={editOpen}
        user={user}
        cargos={cargos}
        busy={updating}
        onClose={() => setEditOpen(false)}
        onSubmit={handleUpdate}
      />}

      {deleteOpen && <DeleteUserModal
        open={deleteOpen}
        userName={user.nome}
        busy={deleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />}
    </>
  );
}
