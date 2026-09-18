import type { UserListItem } from "../types/user";

/** Busca local da etapa mock. Rever integração quando houver OpenAPI. */
export function searchUsers(
  users: UserListItem[],
  term: string,
): UserListItem[] {
  const query = term.trim().toLocaleLowerCase("pt-BR");
  return users.filter(
    (user) =>
      user.nome.toLocaleLowerCase("pt-BR").includes(query) ||
      (user.email?.toLocaleLowerCase("pt-BR").includes(query) ?? false),
  );
}
