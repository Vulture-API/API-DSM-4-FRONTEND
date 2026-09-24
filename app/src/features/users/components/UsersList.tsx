"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { SearchInput } from "@/components/ui/SearchInput/SearchInput";
import { FeedbackState } from "@/components/ui/FeedbackState/FeedbackState";
import { useUsers } from "../hooks/useUsers";
import type { UserRepository } from "../repositories/UserRepository";
import { searchUsers } from "../services/searchUsers";
import { userRepository } from "../repositories";
import { CreateUserModal } from "./CreateUserModal";
import { UsersTable } from "./UsersTable";
import styles from "./UsersList.module.css";

export function UsersList({ repository = userRepository }: { repository?: UserRepository }) {
  const state = useUsers(repository);
  const [term, setTerm] = useState("");
  const [cargoId, setCargoId] = useState("");
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");
  const cargos = state.status === "success" ? state.cargos : [];
  const users = state.status === "success"
    ? searchUsers(state.users, term).filter((user) => !cargoId || String(user.cargo.id) === cargoId)
    : [];
  const noMatches =
    state.status === "success" && state.users.length > 0 && users.length === 0;

  return (
    <section className={styles.section} aria-label="Listagem de usuários">
      <div className={styles.toolbar} suppressHydrationWarning>
        <label className={styles.filter}>
          <span>Filtrar por cargo</span>
          <select
            value={cargoId}
            onChange={(event) => setCargoId(event.target.value)}
            disabled={state.status !== "success"}
            suppressHydrationWarning
          >
            <option value="">Todos os cargos</option>
            {cargos.map((cargo) => <option key={cargo.id} value={cargo.id}>{cargo.nome}</option>)}
          </select>
        </label>
        <div className={styles.actions}>
          <SearchInput
            label="Buscar usuários por nome ou e-mail"
            placeholder="Buscar usuários..."
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            onClear={() => setTerm("")}
            disabled={state.status !== "success"}
          />
          <Button disabled={state.status !== "success"} onClick={() => { setNotice(""); setCreating(true); }}>
            <Icon name="plus" />
            Novo usuário
          </Button>
        </div>
      </div>
      {notice && <p role="status" className={styles.availability}>{notice}</p>}
      {creating && state.status === "success" && (
        <CreateUserModal
          open
          cargos={state.cargos}
          repository={repository}
          onClose={() => setCreating(false)}
          onCreated={() => {
            state.refresh();
            setTerm("");
            setCargoId("");
            setNotice("Usuário cadastrado com sucesso.");
            setCreating(false);
          }}
        />
      )}
      <div className={styles.panel} aria-busy={state.status === "loading"}>
        {state.status === "loading" && (
          <FeedbackState kind="loading" title="Carregando usuários..." />
        )}
        {state.status === "error" && (
          <FeedbackState
            kind="error"
            title="Não foi possível carregar os usuários."
            description="Tente novamente mais tarde."
          />
        )}
        {state.status === "success" &&
          (users.length > 0 ? (
            <UsersTable users={users} />
          ) : (
            <FeedbackState
              kind="empty"
              title={
                noMatches
                  ? "Nenhum usuário encontrado."
                  : "Nenhum usuário cadastrado."
              }
              description={
                noMatches
                  ? "Tente outro nome, e-mail ou cargo."
                  : "Os usuários aparecerão aqui quando estiverem disponíveis."
              }
            />
          ))}
      </div>
      {state.status === "success" && state.pagination.totalPages > 1 && (
        <nav className={styles.pagination} aria-label="Paginação de usuários">
          <Button
            variant="secondary"
            disabled={state.pagination.currentPage <= 1}
            onClick={() => state.goToPage(state.pagination.currentPage - 1)}
          >
            Página anterior
          </Button>
          <span aria-live="polite">
            Página {state.pagination.currentPage} de {state.pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={
              state.pagination.currentPage >= state.pagination.totalPages
            }
            onClick={() => state.goToPage(state.pagination.currentPage + 1)}
          >
            Próxima página
          </Button>
        </nav>
      )}
    </section>
  );
}
