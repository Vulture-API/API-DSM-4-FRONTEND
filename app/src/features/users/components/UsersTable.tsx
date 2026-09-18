import { Badge } from "@/components/ui/Badge/Badge";
import type { UserListItem } from "../types/user";
import styles from "./UsersTable.module.css";

export function UsersTable({ users }: { users: UserListItem[] }) {
  return (
    <div
      className={styles.scroll}
      role="region"
      aria-label="Tabela de usuários"
      tabIndex={0}
    >
      <table className={styles.table}>
        <caption className={styles.caption}>Usuários cadastrados</caption>
        <thead>
          <tr>
            <th scope="col">Nome do usuário</th>
            <th scope="col">Cargo</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <div className={styles.identity}>
                  <span className={styles.avatar} aria-hidden="true">
                    {user.nome.trim().charAt(0).toLocaleUpperCase("pt-BR")}
                  </span>
                  <div className={styles.details}>
                    <strong title={user.nome}>{user.nome}</strong>
                    <span
                      className={styles.email}
                      title={user.email ?? undefined}
                    >
                      {user.email ?? "E-mail não informado"}
                    </span>
                  </div>
                </div>
              </td>
              <td className={styles.cargo}>{user.cargo.nome}</td>
              <td>
                <Badge tone={user.ativo ? "positive" : "neutral"}>
                  {user.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
