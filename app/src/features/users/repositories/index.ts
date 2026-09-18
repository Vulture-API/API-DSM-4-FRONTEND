import { MockUserRepository } from "./MockUserRepository";
import type { UserRepository } from "./UserRepository";

// Ponto de composição: substituir apenas quando houver contrato OpenAPI oficial.
export const userRepository: UserRepository = new MockUserRepository();
