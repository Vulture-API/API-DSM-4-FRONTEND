import type { ParameterRepository } from "./ParameterRepository";

/** Assinaturas da aplicação apenas. Integração aguarda o OpenAPI oficial. */
export class ApiParameterRepository implements ParameterRepository {
  list: ParameterRepository["list"] = async () => {
    throw new Error("Integração pendente do OpenAPI oficial.");
  };
  create: ParameterRepository["create"] = async () => {
    throw new Error("Integração pendente do OpenAPI oficial.");
  };
  update: ParameterRepository["update"] = async () => {
    throw new Error("Integração pendente do OpenAPI oficial.");
  };
  remove: ParameterRepository["remove"] = async () => {
    throw new Error("Integração pendente do OpenAPI oficial.");
  };
}
