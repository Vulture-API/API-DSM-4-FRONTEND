import type { UserListItem } from "../types/user";
import type { UserRepository } from "./UserRepository";

/** Integração pendente: implementar somente após aprovação do contrato OpenAPI. */
export class ApiUserRepository implements UserRepository {
  getById: UserRepository["getById"] = async () => {
    throw new Error("Consulta pela API pendente do alinhamento com o contrato OpenAPI oficial.");
  };

  update: UserRepository["update"] = async () => {
    throw new Error("Atualização pela API pendente do alinhamento com o contrato OpenAPI oficial.");
  };

  delete: UserRepository["delete"] = async () => {
    throw new Error("Exclusão pela API pendente do alinhamento com o contrato OpenAPI oficial.");
  };
  async list(): Promise<UserListItem[]> {
    throw new Error(
      "Integração de usuários pendente do contrato OpenAPI oficial.",
    );
  }
  listCargos: UserRepository["listCargos"] = async () => {
    throw new Error("Integração de cargos pendente do contrato OpenAPI oficial.");
  };

  create: UserRepository["create"] = async () => {
    throw new Error("Cadastro pela API pendente do alinhamento com o contrato OpenAPI oficial.");
  };
}
