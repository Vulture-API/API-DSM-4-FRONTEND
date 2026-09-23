"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FeedbackState } from "@/components/ui/FeedbackState/FeedbackState";
import { useUserDetails } from "../hooks/useUserDetails";
import type { UserRepository } from "../repositories/UserRepository";
import { UserDetails } from "./UserDetails";

export function UserDetailsScreen({ id, repository }: { id: number; repository?: UserRepository }) {
  // A new ID starts with fresh loading and modal state during client navigation.
  return <Details key={id} id={id} repository={repository} />;
}

function Details({ id, repository }: { id: number; repository?: UserRepository }) {
  const router = useRouter();
  const { state, operation, notice, update, remove } = useUserDetails(id, repository);

  if (state.status !== "success") {
    return <>
      <Link href="/administracao/usuarios">← Voltar para a lista</Link>
      {state.status === "loading" && <FeedbackState kind="loading" title="Carregando usuário..." />}
      {state.status === "not-found" && <FeedbackState kind="empty" title="Usuário não encontrado." />}
      {state.status === "error" && <FeedbackState kind="error" title="Não foi possível carregar o usuário." description="Tente novamente mais tarde." />}
    </>;
  }

  return <>
    {notice && <p role="status">{notice}</p>}
    <UserDetails
      user={state.user}
      cargos={state.cargos}
      updating={operation === "updating"}
      deleting={operation === "deleting"}
      onUpdate={(_id, input) => update(input)}
      onDelete={async () => {
        await remove();
        router.push("/administracao/usuarios");
      }}
    />
  </>;
}
