"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { SearchInput } from "@/components/ui/SearchInput/SearchInput";
import { FeedbackState } from "@/components/ui/FeedbackState/FeedbackState";
import { useUsers } from "../hooks/useUsers";
import type { UserRepository } from "../repositories/UserRepository";
import { searchUsers } from "../services/searchUsers";
import { UsersTable } from "./UsersTable";
import styles from "./UsersList.module.css";

export function UsersList({ repository }: { repository?: UserRepository }) {
  const state = useUsers(repository);
  const [term, setTerm] = useState("");
  const availabilityId = useId();
  const users =
    state.status === "success" ? searchUsers(state.users, term) : [];
  const noMatches =
    state.status === "success" && state.users.length > 0 && users.length === 0;

  return (
    <section className={styles.section} aria-label="Listagem de usuários">
      <div className={styles.toolbar}>
        <Button variant="secondary" disabled aria-describedby={availabilityId}>
          Filtrar por Grupo
          <Icon name="chevron" />
        </Button>
        <div className={styles.actions}>
          <SearchInput
            label="Buscar usuários por nome ou e-mail"
            placeholder="Buscar usuários..."
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            onClear={() => setTerm("")}
            disabled={state.status !== "success"}
          />
          <Button disabled aria-describedby={availabilityId}>
            <Icon name="plus" />
            Convidar Membro
          </Button>
        </div>
      </div>
      <p id={availabilityId} className={styles.availability}>
        <Icon name="info" />
        <span>
          Filtro por grupo indisponível nesta etapa. Convites estarão
          disponíveis na gestão de usuários.
        </span>
      </p>
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
                  ? "Tente buscar por outro nome ou e-mail."
                  : "Os usuários aparecerão aqui quando estiverem disponíveis."
              }
            />
          ))}
      </div>
    </section>
  );
}
