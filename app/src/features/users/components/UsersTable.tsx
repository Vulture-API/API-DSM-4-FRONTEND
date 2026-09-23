import Link from "next/link";
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
            <tr key={user.id} className={styles.row}>
              <td className={styles.linkCell}>
                <Link
                  href={`/administracao/usuarios/${user.id}`}
                  className={styles.rowLink}
                  aria-label={`Ver detalhes de ${user.nome}`}
                >
                  <div className={styles.identity}>
                    <span className={styles.avatar} aria-hidden="true">
                      {user.nome.trim().charAt(0).toLocaleUpperCase("pt-BR")}
                    </span>

                    <div className={styles.details}>
                      <p title={user.nome}>
                        <strong>{user.nome}</strong>
                      </p>

                      <span
                        className={styles.email}
                        title={user.email ?? undefined}
                      >
                        {user.email ?? "E-mail não informado"}
                      </span>
                    </div>
                  </div>
                </Link>
              </td>

              <td className={`${styles.cargo} ${styles.linkCell}`}>
                <Link
                  href={`/administracao/usuarios/${user.id}`}
                  className={styles.rowLink}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  {user.cargo.nome}
                </Link>
              </td>

              <td className={styles.linkCell}>
                <Link
                  href={`/administracao/usuarios/${user.id}`}
                  className={styles.rowLink}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <Badge tone={user.ativo ? "positive" : "neutral"}>
                    {user.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
