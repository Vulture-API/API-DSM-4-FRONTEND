import { cargos, publicCredentials, users } from "../mocks/users";
import type { UserListItem } from "../types/user";
import type { UserRepository } from "./UserRepository";

export class MockUserRepository implements UserRepository {
  async list(): Promise<UserListItem[]> {
    return users.map((user) => {
      const cargo = cargos.find(({ id }) => id === user.cargo_id)!;
      return {
        ...user,
        cargo: { id: cargo.id, nome: cargo.nome },
        email:
          publicCredentials.find(({ usuario_id }) => usuario_id === user.id)
            ?.email ?? null,
      };
    });
  }
}
