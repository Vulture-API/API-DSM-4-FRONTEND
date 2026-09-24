import { ApiUserRepository } from "./ApiUserRepository";
import type { UserRepository } from "./UserRepository";

export const userRepository: UserRepository = new ApiUserRepository();
