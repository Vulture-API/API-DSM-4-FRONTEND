import type { UserListItem } from "../types/user";
import type { UserRepository } from "./UserRepository";

/** Integração pendente: implementar somente após aprovação do contrato OpenAPI. */
export class ApiUserRepository implements UserRepository {
  async list(): Promise<UserListItem[]> {
    throw new Error(
      "Integração de usuários pendente do contrato OpenAPI oficial.",
    );
  }
}
